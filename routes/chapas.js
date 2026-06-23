const express = require("express");
const router = express.Router();
const db = require("../db");

// View e Bibliotecas
const chapasView = require("../views/chapasView");
const ExcelJS = require("exceljs"); // Necessário para a rota de exportação

//------------------------------------------------------------------------------ROTAS PARA CHAPAS------------------------------------------------------------------------------
//LISTAR CHAPAS
router.get("/chapas", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario === "motorista") return res.status(403).send("Acesso negado.");

    db.query("SELECT * FROM chapas ORDER BY id DESC", (err, chapas) => {
        if (err) {
            console.error("Erro ao buscar chapas:", err);
            return res.status(500).send("Erro interno");
        }
        res.send(chapasView(req.session.user, chapas));
    });
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