const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const { uploadDiaristas } = require("../config/uploadConfig");
const diaristasView = require("../views/diaristasView");

//------------------------------------------------------------------------------ROTAS PARA DIARISTAS------------------------------------------------------------------------------
//LISTAR DIARISTAS
router.get("/diaristas", async (req, res) => {
    if (!req.session.user || (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "financeiro" && req.session.user.tipo_usuario !== "logistica")) {
        return res.redirect("/login");
    }

    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = 10;
        const offset = (page - 1) * limit;
        const { data_inicio, data_fim, diarista_id } = req.query;

        // A. Busca Taxas
        const [configs] = await db.promise().query("SELECT chave, valor FROM configuracoes");
        let taxas = {};
        configs.forEach(c => {
            if (['diaria_padrao', 'diaria_domingo', 'diaria_limpeza'].includes(c.chave)) taxas[c.chave] = parseFloat(c.valor);
        });

        // B. Busca Diaristas para os Cards
        const [diaristas] = await db.promise().query("SELECT id, nome, tipo_usuario, foto, cpf, pix, banco, telefone FROM usuarios WHERE tipo_usuario = 'diarista' ORDER BY nome ASC");

        // C. Filtros e Busca das PASTAS DE FECHAMENTO
        let whereHist = [];
        let paramsHist = [];
        if (data_inicio) { whereHist.push("DATE(p.data_criacao) >= ?"); paramsHist.push(data_inicio); }
        if (data_fim) { whereHist.push("DATE(p.data_criacao) <= ?"); paramsHist.push(data_fim); }
        if (diarista_id) { whereHist.push("p.colaborador_id = ?"); paramsHist.push(diarista_id); }

        const whereHistSql = whereHist.length ? "WHERE " + whereHist.join(" AND ") : "";
        const countQuery = `SELECT COUNT(p.id) AS total FROM pastas_diaristas p ${whereHistSql}`;
        const [[countResult]] = await db.promise().query(countQuery, paramsHist);

        const total = countResult.total;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const queryParams = [...paramsHist, limit, offset];

        const [pastas] = await db.promise().query(`
            SELECT p.*, u.nome as nome_colaborador, u.foto as foto_colab, u.pix, u.banco, u.cpf,
                IFNULL((SELECT SUM(valor_total) FROM pagamentos_colaboradores WHERE pasta_id = p.id), 0) as valor_total,
                (SELECT COUNT(id) FROM pagamentos_colaboradores WHERE pasta_id = p.id) as qtd_diarias
            FROM pastas_diaristas p 
            LEFT JOIN usuarios u ON p.colaborador_id = u.id 
            ${whereHistSql} 
            ORDER BY p.data_criacao DESC LIMIT ? OFFSET ?
        `, queryParams);

        // Busca as diárias dentro de cada pasta para injetar no Modal da Tabela
        for (let pt of pastas) {
            const [itens] = await db.promise().query("SELECT * FROM pagamentos_colaboradores WHERE pasta_id = ? ORDER BY data_servico ASC", [pt.id]);
            pt.itens = itens;
        }

        const filtros = { data_inicio, data_fim, diarista_id };

        res.send(diaristasView(req.session.user, diaristas, pastas, filtros, { page, totalPages }, taxas));

    } catch (error) {
        console.error("Erro no Controle de Diaristas:", error);
        res.status(500).send("Erro interno ao carregar a página.");
    }
});

//CRIAR PASTA PARA DIARISTA
router.post("/diaristas/pasta/nova", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    try {
        await db.promise().query("INSERT INTO pastas_diaristas (colaborador_id, status) VALUES (?, 'Aberta')", [req.body.colaborador_id]);
        res.redirect("/diaristas");
    } catch (error) {
        res.status(500).send("Erro ao criar pasta.");
    }
});

//ADICIONAR DIÁRIA
router.post("/diaristas/pasta/item", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const { pasta_id, colaborador_id, data_servico, qtd_entregas, valor_total, tipo_viagem } = req.body;
    try {
        await db.promise().query(
            "INSERT INTO pagamentos_colaboradores (pasta_id, colaborador_id, data_servico, qtd_entregas, valor_total, status, tipo_viagem) VALUES (?, ?, ?, ?, ?, 'Pendente', ?)",
            [pasta_id, colaborador_id, data_servico, qtd_entregas || 1, valor_total || 0, tipo_viagem]
        );
        res.redirect("/diaristas");
    } catch (error) {
        res.status(500).send("Erro ao adicionar diária na pasta.");
    }
});

//FINALIZAR PASTA DE DIARISTA
router.post("/diaristas/pasta/fechar/:id", uploadDiaristas.single("comprovante"), async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const id = req.params.id;

    try {
        // Se foi enviado um novo comprovante, tratamos o arquivo
        if (req.file) {
            const novoComprovante = "financeiro/diaristas/" + req.file.filename;

            // Busca o arquivo antigo para apagá-lo do disco (evitar acúmulo de lixo)
            const [[oldPasta]] = await db.promise().query("SELECT comprovante FROM pastas_diaristas WHERE id = ?", [id]);
            if (oldPasta && oldPasta.comprovante) {
                const fs = require('fs');
                const path = require('path');
                const oldFilePath = path.join(__dirname, "uploads", oldPasta.comprovante);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }

            // Marca a Pasta com o novo comprovante
            await db.promise().query("UPDATE pastas_diaristas SET status = 'PAGO', comprovante = ? WHERE id = ?", [novoComprovante, id]);
        } else {
            // Se não enviou comprovante, apenas muda o status
            await db.promise().query("UPDATE pastas_diaristas SET status = 'PAGO' WHERE id = ?", [id]);
        }

        // Marca TODOS os itens dentro dela como PAGO
        await db.promise().query("UPDATE pagamentos_colaboradores SET status = 'PAGO' WHERE pasta_id = ?", [id]);
        res.redirect("/diaristas");
    } catch (error) {
        console.error("Erro ao fechar pasta:", error);
        res.status(500).send("Erro ao fechar pasta.");
    }
});

//EXCLUIR PASTA DIARISTA
router.post("/diaristas/pasta/excluir/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const id = req.params.id;

    try {
        // Primeiro busca o comprovante da pasta para excluí-lo do disco
        const [[pasta]] = await db.promise().query("SELECT comprovante FROM pastas_diaristas WHERE id = ?", [id]);

        if (pasta && pasta.comprovante) {
            const fs = require('fs');
            const path = require('path');
            const caminho = path.join(__dirname, "uploads", pasta.comprovante);
            if (fs.existsSync(caminho)) {
                fs.unlinkSync(caminho);
            }
        }

        // Depois apaga o registro do banco
        await db.promise().query("DELETE FROM pastas_diaristas WHERE id = ?", [id]);
        res.redirect("/diaristas");
    } catch (error) {
        console.error("Erro ao excluir pasta:", error);
        res.status(500).send("Erro ao excluir pasta.");
    }
});

router.get("/configuracoes", (req, res) => {
    if (!req.session.user || req.session.user.tipo_usuario !== 'admin') {
        return res.redirect("/home?erro=acesso_negado");
    }

    // Busca as taxas respeitando a estrutura CHAVE/VALOR do Ecoflow
    db.query("SELECT chave, valor FROM configuracoes", (errConfig, resultConfig) => {
        if (errConfig) {
            console.error("Erro ao buscar configurações:", errConfig);
            return res.status(500).send("Erro interno");
        }

        // Converte o array de chaves e valores num objeto direto para a View
        const taxas = {};
        resultConfig.forEach(row => {
            taxas[row.chave] = row.valor;
        });

        // Busca o histórico de notificações globais
        db.query("SELECT * FROM notificacoes_globais ORDER BY criado_em DESC", (errNotif, resultNotif) => {
            if (errNotif) {
                console.error("Erro ao buscar notificações:", errNotif);
                return res.status(500).send("Erro interno");
            }

            const configView = require('../views/configView');
            const html = configView(req.session.user, taxas, resultNotif);
            res.send(html);
        });
    });
});

module.exports = router;