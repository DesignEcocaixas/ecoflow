const express = require("express");
const router = express.Router();
const db = require("../db");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Configuração para processar o Upload de Imagens das Facas
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = "public/uploads/";
        if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// View e Bibliotecas
const chapasView = require("../views/chapasView");
const ExcelJS = require("exceljs");

//------------------------------------------------------------------------------ROTAS PARA CHAPAS E FACAS------------------------------------------------------------------------------
// LISTAR CHAPAS E FACAS
router.get("/chapas", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario === "motorista") return res.status(403).send("Acesso negado.");

    try {
        // Busca chapas
        const [chapas] = await db.promise().query("SELECT * FROM chapas ORDER BY id DESC");
        
        let facas = [];
        try {
            // Busca facas (caso a tabela já exista)
            const [resultFacas] = await db.promise().query("SELECT * FROM facas_manutencao ORDER BY id DESC");
            facas = resultFacas;
        } catch (errDb) {
            console.log("[Aviso] A tabela facas_manutencao não existe ou está vazia.");
        }

        res.send(chapasView(req.session.user, chapas, facas));
    } catch (err) {
        console.error("Erro ao buscar chapas e facas:", err);
        res.status(500).send("Erro interno");
    }
});

// CADASTRAR NOVA MANUTENÇÃO DE FACA
router.post("/facas/manutencao", upload.single("imagem_faca"), async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { status, faca, data_saida, nome_retirou, descricao, data_entrada, nome_entregou } = req.body;
    const imagem = req.file ? req.file.filename : null;
    const isEmManutencao = status === 'em_manutencao' ? 1 : 0;

    try {
        // Garantia de criação da tabela caso seja a primeira vez que o módulo é executado
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS facas_manutencao (
                id INT AUTO_INCREMENT PRIMARY KEY,
                faca VARCHAR(255) NOT NULL,
                imagem_faca VARCHAR(255),
                data_saida DATE,
                nome_retirou VARCHAR(255),
                descricao TEXT,
                data_entrada DATE,
                nome_entregou VARCHAR(255),
                em_manutencao BOOLEAN DEFAULT 1,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.promise().query(
            `INSERT INTO facas_manutencao (faca, imagem_faca, data_saida, nome_retirou, descricao, data_entrada, nome_entregou, em_manutencao) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [faca, imagem, data_saida || null, nome_retirou, descricao, data_entrada || null, nome_entregou, isEmManutencao]
        );

        res.redirect("/chapas");
    } catch (err) {
        console.error("Erro ao cadastrar manutenção da faca:", err);
        res.status(500).send("Erro interno ao salvar manutenção.");
    }
});

// EDITAR MANUTENÇÃO DE FACA
router.post("/facas/editar/:id", upload.single("imagem_faca"), async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { id } = req.params;
    const { status, faca, data_saida, nome_retirou, descricao, data_entrada, nome_entregou } = req.body;
    const isEmManutencao = status === 'em_manutencao' ? 1 : 0;

    try {
        if (req.file) {
            const imagem = req.file.filename;
            await db.promise().query(
                `UPDATE facas_manutencao SET faca=?, imagem_faca=?, data_saida=?, nome_retirou=?, descricao=?, data_entrada=?, nome_entregou=?, em_manutencao=? WHERE id=?`,
                [faca, imagem, data_saida || null, nome_retirou, descricao, data_entrada || null, nome_entregou, isEmManutencao, id]
            );
        } else {
            await db.promise().query(
                `UPDATE facas_manutencao SET faca=?, data_saida=?, nome_retirou=?, descricao=?, data_entrada=?, nome_entregou=?, em_manutencao=? WHERE id=?`,
                [faca, data_saida || null, nome_retirou, descricao, data_entrada || null, nome_entregou, isEmManutencao, id]
            );
        }
        res.redirect("/chapas");
    } catch (err) {
        console.error("Erro ao editar faca:", err);
        res.status(500).send("Erro interno ao editar manutenção.");
    }
});

// EXCLUIR MANUTENÇÃO DE FACA
router.post("/facas/excluir/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { id } = req.params;

    try {
        const [rows] = await db.promise().query("SELECT imagem_faca FROM facas_manutencao WHERE id = ?", [id]);
        if (rows.length > 0 && rows[0].imagem_faca) {
            const filePath = path.join(__dirname, "..", "public", "uploads", rows[0].imagem_faca);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await db.promise().query("DELETE FROM facas_manutencao WHERE id=?", [id]);
        res.redirect("/chapas");
    } catch (err) {
        console.error("Erro ao excluir faca:", err);
        res.status(500).send("Erro interno ao excluir manutenção.");
    }
});

//CADASTRAR NOVA CHAPA
router.post("/chapas/novo", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario === "motorista") return res.status(403).send("Acesso negado.");

    const { material, modelo, fornecedor, medida, quantidade } = req.body;

    db.query(
        "INSERT INTO chapas (material, modelo, fornecedor, medida, quantidade) VALUES (?, ?, ?, ?, ?)",
        [material, modelo, fornecedor, medida, quantidade],
        (err) => {
            if (err) console.error("Erro ao cadastrar chapa:", err);
            res.redirect("/chapas");
        }
    );
});

//EDITAR CHAPA
router.post("/chapas/editar/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario === "motorista") return res.status(403).send("Acesso negado.");

    const { id } = req.params;
    const { material, modelo, fornecedor, medida, quantidade } = req.body;

    db.query(
        "UPDATE chapas SET material=?, modelo=?, fornecedor=?, medida=?, quantidade=? WHERE id=?",
        [material, modelo, fornecedor, medida, quantidade, id],
        (err) => {
            if (err) console.error("Erro ao editar chapa:", err);
            res.redirect("/chapas");
        }
    );
});

//EXCLUIR CHAPA
router.post("/chapas/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario === "motorista") return res.status(403).send("Acesso negado.");

    const { id } = req.params;

    db.query("DELETE FROM chapas WHERE id=?", [id], (err) => {
        if (err) console.error("Erro ao excluir chapa:", err);
        res.redirect("/chapas");
    });
});

//RELATÓRIO COMPLETO CHAPAS
router.get('/exportar/chapas', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        // Busca todos os dados do estoque de chapas
        const [dados] = await db.promise().query(`
            SELECT material, modelo, fornecedor, medida, quantidade 
            FROM chapas 
            ORDER BY material ASC, modelo ASC
        `);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Estoque de Chapas');

        sheet.columns = [
            { header: 'MATERIAL', key: 'material', width: 20 },
            { header: 'MODELO', key: 'modelo', width: 30 },
            { header: 'FORNECEDOR', key: 'fornecedor', width: 30 },
            { header: 'MEDIDA', key: 'medida', width: 20 },
            { header: 'QUANTIDADE', key: 'quantidade', width: 15 }
        ];

        // Estiliza o cabeçalho
        sheet.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Preenche os dados
        dados.forEach(c => {
            const row = sheet.addRow({
                material: c.material,
                modelo: c.modelo,
                fornecedor: c.fornecedor,
                medida: c.medida,
                quantidade: Number(c.quantidade) || 0
            });

            // Destaca quantidades críticas (abaixo de 5000)
            if (Number(c.quantidade) < 5000) {
                row.getCell('quantidade').font = { color: { argb: 'FFDC3545' }, bold: true };
            }
        });

        // Aplica bordas em todas as células
        sheet.eachRow(row => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Estoque_Chapas_${dataHoje}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('[ERRO EXPORTAR CHAPAS]', err);
        res.status(500).send('Erro ao gerar relatório de chapas');
    }
});

module.exports = router;