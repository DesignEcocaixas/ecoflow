const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");

const { uploadFacas } = require("../config/uploadConfig"); 
const facasView = require("../views/facasView");
const facaFichaView = require("../views/facaFichaView");
const facasQrPrintView = require("../views/facasQrPrintView");

// =========================================================================
// ROTA GET: LISTAR FACAS COM FILTROS E PAGINAÇÃO
// =========================================================================
router.get("/catalogo-facas", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = 12;
        const offset = (page - 1) * limit;
        const { busca, categoria } = req.query;

        let where = [];
        let params = [];

        // NOVO MOTOR DE BUSCA: Procura em múltiplas colunas ao mesmo tempo
        if (busca) {
            where.push(`(
                modelo LIKE ? OR 
                id LIKE ? OR 
                tamanho_referencia LIKE ? OR 
                medida LIKE ? OR 
                utilizacao LIKE ? OR 
                componente LIKE ? OR 
                configuracao LIKE ? OR 
                chapas_utilizadas LIKE ?
            )`);
            // Adiciona o parâmetro de busca 8 vezes (uma para cada coluna acima)
            for(let i = 0; i < 8; i++) {
                params.push(`%${busca}%`);
            }
        }
        
        if (categoria) {
            where.push("categoria = ?");
            params.push(categoria);
        }

        const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
        const countQuery = `SELECT COUNT(*) AS total FROM facas ${whereSql}`;
        
        const [countResult] = await db.promise().query(countQuery, params);
        const total = countResult[0].total;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        const queryParams = [...params, limit, offset];
        const [facas] = await db.promise().query(`
            SELECT * FROM facas 
            ${whereSql} 
            ORDER BY criado_em DESC 
            LIMIT ? OFFSET ?
        `, queryParams);

        // Busca todas as informações para montar o texto do Select
        const [chapasDisponiveis] = await db.promise().query("SELECT modelo, material, fornecedor, medida FROM chapas ORDER BY modelo ASC");

        const filtros = { busca, categoria };
        const paginacao = { page, totalPages, total };

        res.send(facasView(req.session.user, facas, filtros, paginacao, chapasDisponiveis));

    } catch (error) {
        console.error("[ERRO AO LISTAR FACAS]:", error);
        res.status(500).send("Erro interno ao carregar o catálogo de facas.");
    }
});

// =========================================================================
// ROTA POST: CADASTRAR NOVA FACA
// =========================================================================
router.post("/catalogo-facas/novo", uploadFacas.single("foto"), async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { 
        categoria, modelo, tamanho_referencia, 
        medida, versao, componente, configuracao, 
        utilizacao, chapas_utilizadas 
    } = req.body;

    const foto = req.file ? "facas/" + req.file.filename : null;

    let arrayChapas = [];
    if (chapas_utilizadas) {
        arrayChapas = Array.isArray(chapas_utilizadas) ? chapas_utilizadas : [chapas_utilizadas];
    }
    const chapasJson = JSON.stringify(arrayChapas);

    try {
        const prefix = categoria === 'rotativa' ? 'ROT' : 'PLA';
        const [[lastFaca]] = await db.promise().query(`
            SELECT id FROM facas 
            WHERE id LIKE ? 
            ORDER BY LENGTH(id) DESC, id DESC LIMIT 1
        `, [`${prefix}-%`]);

        let nextNum = 1;
        if (lastFaca && lastFaca.id) {
            const parts = lastFaca.id.split('-');
            if (parts.length === 2 && !isNaN(parts[1])) {
                nextNum = parseInt(parts[1], 10) + 1;
            }
        }
        const novoCodigo = `${prefix}-${String(nextNum).padStart(3, '0')}`;

        await db.promise().query(`
            INSERT INTO facas (
                id, categoria, modelo, tamanho_referencia, medida, 
                versao, componente, configuracao, utilizacao, chapas_utilizadas, foto
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            novoCodigo, categoria, modelo, tamanho_referencia || null, medida || null, 
            versao || null, componente || null, configuracao || null, 
            utilizacao || null, chapasJson, foto
        ]);

        res.redirect("/catalogo-facas");
    } catch (error) {
        console.error("[ERRO AO CADASTRAR FACA]:", error);
        res.status(500).send("Erro interno ao tentar salvar a faca.");
    }
});

// =========================================================================
// ROTA POST: EDITAR FACA EXISTENTE
// =========================================================================
router.post("/catalogo-facas/editar/:id", uploadFacas.single("foto"), async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const idAtual = req.params.id;
    const { 
        categoria, modelo, tamanho_referencia, 
        medida, versao, componente, configuracao, 
        utilizacao, chapas_utilizadas 
    } = req.body;

    let arrayChapas = [];
    if (chapas_utilizadas) {
        arrayChapas = Array.isArray(chapas_utilizadas) ? chapas_utilizadas : [chapas_utilizadas];
    }
    const chapasJson = JSON.stringify(arrayChapas);

    try {
        let query = `
            UPDATE facas SET 
                categoria = ?, modelo = ?, tamanho_referencia = ?, 
                medida = ?, versao = ?, componente = ?, configuracao = ?, 
                utilizacao = ?, chapas_utilizadas = ?
        `;
        let params = [
            categoria, modelo, tamanho_referencia || null, 
            medida || null, versao || null, componente || null, 
            configuracao || null, utilizacao || null, chapasJson
        ];

        if (req.file) {
            const novaFoto = "facas/" + req.file.filename;

            const [[facaAntiga]] = await db.promise().query("SELECT foto FROM facas WHERE id = ?", [idAtual]);
            if (facaAntiga && facaAntiga.foto) {
                const oldFilePath = path.join(__dirname, "..", "uploads", facaAntiga.foto);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }

            query += ", foto = ?";
            params.push(novaFoto);
        }

        query += " WHERE id = ?";
        params.push(idAtual);

        await db.promise().query(query, params);

        res.redirect("/catalogo-facas");
    } catch (error) {
        console.error("[ERRO AO EDITAR FACA]:", error);
        res.status(500).send("Erro interno ao tentar editar a faca.");
    }
});

// =========================================================================
// ROTA POST: EXCLUIR FACA
// =========================================================================
router.post("/catalogo-facas/excluir/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const id = req.params.id;

    try {
        const [[faca]] = await db.promise().query("SELECT foto FROM facas WHERE id = ?", [id]);
        
        if (faca && faca.foto) {
            const caminho = path.join(__dirname, "..", "uploads", faca.foto);
            if (fs.existsSync(caminho)) {
                fs.unlinkSync(caminho);
            }
        }

        await db.promise().query("DELETE FROM facas WHERE id = ?", [id]);

        res.redirect("/catalogo-facas");
    } catch (error) {
        console.error("[ERRO AO EXCLUIR FACA]:", error);
        res.status(500).send("Erro interno ao tentar excluir a faca.");
    }
});

// =========================================================================
// ROTA GET: FICHA TÉCNICA PÚBLICA (QR CODE)
// =========================================================================
router.get("/catalogo-facas/ficha/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const [[faca]] = await db.promise().query("SELECT * FROM facas WHERE id = ?", [id]);
        
        if (!faca) {
            return res.status(404).send("Ficha técnica não encontrada ou faca excluída.");
        }

        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        
        res.send(facaFichaView(faca, fullUrl));

    } catch (error) {
        console.error("[ERRO AO GERAR FICHA]:", error);
        res.status(500).send("Erro interno ao gerar a ficha da faca.");
    }
});

// =========================================================================
// ROTA GET: PÁGINA GLOBAL DE IMPRESSÃO DE QR CODES
// =========================================================================
router.get("/catalogo-facas/qrcodes", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const [facas] = await db.promise().query("SELECT id, modelo, tamanho_referencia, categoria, componente FROM facas ORDER BY categoria, modelo ASC");
        
        const baseUrl = req.protocol + '://' + req.get('host');
        
        res.send(facasQrPrintView(facas, baseUrl));

    } catch (error) {
        console.error("[ERRO AO GERAR LISTA QR]:", error);
        res.status(500).send("Erro interno ao gerar a lista de QR Codes.");
    }
});

module.exports = router;