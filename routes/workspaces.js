const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");

// Importações de Upload e Segurança
const { uploadWorkspaces } = require("../config/uploadConfig");
const { isLogged } = require("../middlewares/authMiddleware");

// View
const espacosDeTrabalhoView = require("../views/espacosDeTrabalhoView");

//------------------------------------------------------------------------------ROTAS PARA WORKSPACES------------------------------------------------------------------------------
//LISTAR WORKSPACES (ENVIANDO TODOS PARA TRATAMENTO VISUAL NA VIEW)
router.get("/espacos-trabalho", isLogged, (req, res) => {
    db.query("SELECT * FROM espacos_trabalho ORDER BY id DESC", (err, espacos) => {
        if (err) return res.status(500).send("Erro ao carregar espaços de trabalho");
        // O bloqueio agora é visual, então mandamos todos os espaços para a View
        res.send(espacosDeTrabalhoView(req.session.user, espacos));
    });
});

// ATUALIZAR PERMISSÕES DO WORKSPACE (NOVA ROTA)
router.post("/espacos-trabalho/permissoes/:id", isLogged, (req, res) => {
    const espacoId = req.params.id;
    const { papel, ativo } = req.body;

    // 1. Busca as permissões atuais no banco
    db.query("SELECT permissoes FROM espacos_trabalho WHERE id = ?", [espacoId], (err, results) => {
        if (err || results.length === 0) return res.status(404).send("Espaço não encontrado");

        let permissoesStr = results[0].permissoes;
        let permissoesArray = permissoesStr ? permissoesStr.split(',') : ['admin','financeiro','motorista','design','logistica','producao','comercial'];

        // 2. Adiciona ou remove o papel baseado no switch
        if (ativo === '1') {
            if (!permissoesArray.includes(papel)) permissoesArray.push(papel);
        } else {
            permissoesArray = permissoesArray.filter(p => p !== papel);
        }

        // Blindagem: O Admin nunca pode ser bloqueado
        if (!permissoesArray.includes('admin')) permissoesArray.push('admin');

        const novasPermissoes = permissoesArray.join(',');

        // 3. Salva a nova string no banco
        db.query("UPDATE espacos_trabalho SET permissoes = ? WHERE id = ?", [novasPermissoes, espacoId], (errUpd) => {
            if (errUpd) return res.status(500).send("Erro ao salvar permissões");
            res.status(200).send("Permissões atualizadas com sucesso");
        });
    });
});

// CRIAR WORKSPACE
router.post("/espacos-trabalho/novo", isLogged, uploadWorkspaces.single("thumb"), (req, res) => {
    const { nome, descricao } = req.body;
    
    // Captura o nome do usuário logado que está criando o workspace
    const criadoPor = req.session.user ? req.session.user.nome : null;

    // Salva com o prefixo da pasta
    const thumb = req.file ? "workspaces/" + req.file.filename : null;

    // Injeta a coluna criado_por no banco de dados
    db.query("INSERT INTO espacos_trabalho (nome, descricao, thumb, criado_por) VALUES (?, ?, ?, ?)",
        [nome, descricao, thumb, criadoPor], (err) => {
            if (err) return res.status(500).send("Erro ao salvar espaço");
            res.redirect("/espacos-trabalho?sucesso=1");
        });
});

// EDITAR WORKSPACE
router.post("/espacos-trabalho/editar/:id", isLogged, uploadWorkspaces.single("thumb"), (req, res) => {
    const { nome, descricao } = req.body;
    const id = req.params.id;

    // Salva com o prefixo da pasta
    const novoThumb = req.file ? "workspaces/" + req.file.filename : null;

    if (novoThumb) {
        // 1. Busca a thumb antiga para apagar do disco (evitando acúmulo de lixo)
        db.query("SELECT thumb FROM espacos_trabalho WHERE id = ?", [id], (errSel, results) => {
            if (!errSel && results.length > 0 && results[0].thumb) {
                const thumbAntiga = results[0].thumb;
                const fs = require('fs');
                const path = require('path');
                const caminho = path.join(__dirname, "uploads", thumbAntiga);

                if (fs.existsSync(caminho)) {
                    fs.unlinkSync(caminho);
                }
            }

            // 2. Atualiza no banco com a nova imagem
            db.query("UPDATE espacos_trabalho SET nome=?, descricao=?, thumb=? WHERE id=?", [nome, descricao, novoThumb, id], (err) => {
                res.redirect("/espacos-trabalho?editado=1");
            });
        });
    } else {
        // Se não enviou imagem nova, atualiza apenas os textos
        db.query("UPDATE espacos_trabalho SET nome=?, descricao=? WHERE id=?", [nome, descricao, id], (err) => {
            res.redirect("/espacos-trabalho?editado=1");
        });
    }
});

// EXCLUIR WORKSPACE
router.post("/espacos-trabalho/excluir/:id", isLogged, (req, res) => {
    const id = req.params.id;

    // Primeiro busca a thumb para excluí-la fisicamente do servidor
    db.query("SELECT thumb FROM espacos_trabalho WHERE id = ?", [id], (errSel, results) => {
        if (!errSel && results.length > 0 && results[0].thumb) {
            const thumbAntiga = results[0].thumb;
            const fs = require('fs');
            const path = require('path');
            const caminho = path.join(__dirname, "uploads", thumbAntiga);

            if (fs.existsSync(caminho)) {
                fs.unlinkSync(caminho);
            }
        }

        // Em seguida, apaga o registro do banco de dados
        db.query("DELETE FROM espacos_trabalho WHERE id=?", [id], (err) => {
            // Apaga as colunas associadas a este espaço
            db.query("DELETE FROM kanban_colunas WHERE espaco_id=?", [id], () => {
                res.redirect("/espacos-trabalho?excluido=1");
            });
        });
    });
});

module.exports = router;