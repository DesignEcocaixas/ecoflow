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
//LISTAR WORKSPACES
router.get("/espacos-trabalho", isLogged, (req, res) => {
    db.query("SELECT * FROM espacos_trabalho ORDER BY id DESC", (err, espacos) => {
        if (err) return res.status(500).send("Erro ao carregar espaços de trabalho");
        res.send(espacosDeTrabalhoView(req.session.user, espacos));
    });
});

// CRIAR WORKSPACE
router.post("/espacos-trabalho/novo", isLogged, uploadWorkspaces.single("thumb"), (req, res) => {
    const { nome, descricao } = req.body;

    // A MÁGICA AQUI: Salva com o prefixo da pasta
    const thumb = req.file ? "workspaces/" + req.file.filename : null;

    db.query("INSERT INTO espacos_trabalho (nome, descricao, thumb) VALUES (?, ?, ?)",
        [nome, descricao, thumb], (err) => {
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
            // Apaga as colunas associadas a este espaço (os cards podem ser apagados em cascata se configurado no DB, ou deixados órfãos)
            db.query("DELETE FROM kanban_colunas WHERE espaco_id=?", [id], () => {
                res.redirect("/espacos-trabalho?excluido=1");
            });
        });
    });
});

module.exports = router;