const express = require("express");
const router = express.Router();
const db = require("../db");
const path = require("path");
const fs = require("fs");
const pdfkit = require("pdfkit"); 
const ExcelJS = require("exceljs"); 

//------------------------------------------------------------------------------ROTAS PARA ENTRADAS E SAÍDAS------------------------------------------------------------------------------
//LISTAR ENTRADAS E SAÍDAS
router.get("/entradas-saidas", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "financeiro") {
        console.warn(`[Segurança] Usuário ${req.session.user.nome} tentou acessar /entradas-saidas sem permissão.`);
        return res.status(403).send("Acesso negado.");
    }

    const usuario = req.session.user;

    let page = parseInt(req.query.page || "1", 10);
    if (isNaN(page) || page < 1) {
        page = 1;
    }

    const limit = 20;
    const { data_inicio, data_fim, tipo } = req.query;

    let whereList = [];
    let paramsList = [];

    if (data_inicio) { whereList.push("data >= ?"); paramsList.push(data_inicio); }
    if (data_fim) { whereList.push("data <= ?"); paramsList.push(data_fim); }
    if (tipo === "entrada" || tipo === "saida") { whereList.push("tipo = ?"); paramsList.push(tipo); }

    const whereListSql = whereList.length ? "WHERE " + whereList.join(" AND ") : "";

    let whereIndic = [];
    let paramsIndic = [];

    if (data_inicio) { whereIndic.push("data >= ?"); paramsIndic.push(data_inicio); }
    if (data_fim) { whereIndic.push("data <= ?"); paramsIndic.push(data_fim); }

    if (!data_inicio && !data_fim) {
        whereIndic.push("MONTH(data) = MONTH(CURRENT_DATE()) AND YEAR(data) = YEAR(CURRENT_DATE())");
    }

    const whereIndicSql = whereIndic.length ? "WHERE " + whereIndic.join(" AND ") : "";

    const sqlTotais = `
        SELECT 
            (SELECT COUNT(*) FROM movimentacoes ${whereListSql}) AS total_itens,
            (SELECT COALESCE(SUM(valor), 0) FROM movimentacoes ${whereIndicSql} ${whereIndic.length ? 'AND' : 'WHERE'} tipo = 'entrada') AS total_entradas,
            (SELECT COALESCE(SUM(valor), 0) FROM movimentacoes ${whereIndicSql} ${whereIndic.length ? 'AND' : 'WHERE'} tipo = 'saida') AS total_saidas,
            (SELECT COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) FROM movimentacoes) AS total_caixa
    `;

    const paramsTotais = [...paramsList, ...paramsIndic, ...paramsIndic];

    db.query(sqlTotais, paramsTotais, (errTotais, rowsTotais) => {
        if (errTotais) {
            console.error("[Erro Banco de Dados] Falha ao contar movimentações e somar totais:", errTotais);
            return res.status(500).send("Erro interno do servidor.");
        }

        const total = rowsTotais[0]?.total_itens || 0;
        const totalEntradas = rowsTotais[0]?.total_entradas || 0;
        const totalSaidas = rowsTotais[0]?.total_saidas || 0;
        const totalCaixa = rowsTotais[0]?.total_caixa || 0;

        const totalPages = Math.max(1, Math.ceil(total / limit));
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        const currentOffset = (currentPage - 1) * limit;

        const queryParamsLista = [...paramsList, limit, currentOffset];

        db.query(`SELECT * FROM movimentacoes ${whereListSql} ORDER BY data DESC, id DESC LIMIT ? OFFSET ?`,
            queryParamsLista,
            (errMov, movimentacoes) => {
                if (errMov) {
                    console.error("[Erro Banco de Dados] Falha ao buscar as movimentações:", errMov);
                    return res.status(500).send("Erro interno do servidor.");
                }

                try {
                    res.send(require('../views/entradasSaidasView')(
                        usuario,
                        movimentacoes,
                        { page: currentPage, totalPages, total, totalEntradas, totalSaidas, totalCaixa },
                        { data_inicio, data_fim, tipo }
                    ));
                } catch (renderError) {
                    console.error("[Erro Crítico] Falha na renderização da View:", renderError);
                    res.status(500).send("Ocorreu um erro interno ao tentar exibir a interface.");
                }
            }
        );
    });
});

//CADASTRAR ENTRADA/SAÍDA COM SNAPSHOT DE SALDO
router.post('/movimentacoes/novo', async (req, res) => {
    const { tipo, data, valor, descricao, observacao, assinatura_base64, nome_assinante } = req.body;
    const responsavel = req.session.user ? req.session.user.nome : "Sistema";
    const valorCalculo = parseFloat(valor) || 0;

    try {
        const [saldoQuery] = await db.promise().query(`
            SELECT COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) AS saldo_atual 
            FROM movimentacoes
        `);
        const saldoAnterior = parseFloat(saldoQuery[0].saldo_atual);
        const saldoNovo = tipo === 'entrada' ? saldoAnterior + valorCalculo : saldoAnterior - valorCalculo;

        await db.promise().query(`
            INSERT INTO movimentacoes (tipo, data, valor, descricao, observacao, assinatura_base64, responsavel, nome_assinante, saldo_anterior, saldo_novo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [tipo, data, valorCalculo, descricao, observacao, assinatura_base64, responsavel, nome_assinante, saldoAnterior, saldoNovo]);

        res.redirect('/entradas-saidas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao salvar movimentação e auditar saldo');
    }
});

//EDITAR ENTRADA/SAÍDA
router.post('/movimentacoes/editar/:id', async (req, res) => {
    const { id } = req.params;
    const { data, valor, descricao, observacao, nome_assinante } = req.body;

    try {
        await db.promise().query(`
            UPDATE movimentacoes 
            SET data = ?, valor = ?, descricao = ?, observacao = ?, nome_assinante = ?
            WHERE id = ?
        `, [data, valor, descricao, observacao, nome_assinante, id]);

        res.redirect('/entradas-saidas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar movimentação');
    }
});

//EXCLUIR ENTRADA/SAÍDA
router.post("/movimentacoes/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "financeiro") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;

    db.query("DELETE FROM movimentacoes WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("Erro ao excluir movimentação:", err);
            return res.status(500).send("Erro ao excluir movimentação.");
        }
        res.redirect("/entradas-saidas");
    });
});

//API GRÁFICO ENTRADAS/SAÍDAS
router.get('/api/movimentacoes/grafico', async (req, res) => {
    if (!req.session.user || (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "financeiro")) {
        return res.status(403).json({ error: "Acesso negado" });
    }

    const { visao, mes, ano } = req.query;

    if (!visao || !ano) {
        return res.status(400).json({ error: "Parâmetros insuficientes." });
    }

    try {
        let query = '';
        let params = [];
        let labels = [];
        let entradas = [];
        let saidas = [];

        if (visao === 'dia') {
            if (!mes) return res.status(400).json({ error: "Mês não informado." });

            const diasNoMes = new Date(ano, mes, 0).getDate();
            labels = Array.from({ length: diasNoMes }, (_, i) => String(i + 1).padStart(2, '0'));
            entradas = new Array(diasNoMes).fill(0);
            saidas = new Array(diasNoMes).fill(0);

            query = `
                SELECT DAY(data) as chave, tipo, SUM(valor) as total
                FROM movimentacoes
                WHERE MONTH(data) = ? AND YEAR(data) = ?
                GROUP BY DAY(data), tipo
            `;
            params = [mes, ano];

        } else if (visao === 'mes') {
            labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            entradas = new Array(12).fill(0);
            saidas = new Array(12).fill(0);

            query = `
                SELECT MONTH(data) as chave, tipo, SUM(valor) as total
                FROM movimentacoes
                WHERE YEAR(data) = ?
                GROUP BY MONTH(data), tipo
            `;
            params = [ano];
        } else {
            return res.status(400).json({ error: "Visão inválida." });
        }

        const [rows] = await db.promise().query(query, params);

        rows.forEach(row => {
            const index = row.chave - 1; 
            const valorTotal = parseFloat(row.total) || 0;

            if (row.tipo === 'entrada') {
                entradas[index] = valorTotal;
            } else if (row.tipo === 'saida') {
                saidas[index] = valorTotal;
            }
        });

        res.json({ labels, entradas, saidas });

    } catch (error) {
        console.error("[Erro API Gráfico]:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

//COMPROVANTE ENTRADA/SAÍDA
router.get('/movimentacoes/comprovante/:id', (req, res) => {
    if (!req.session.user || (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "financeiro")) {
        return res.status(403).send("Acesso negado");
    }

    const id = req.params.id;

    db.query("SELECT * FROM movimentacoes WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).send("Movimentação não encontrada.");

        const m = results[0];

        if (m.tipo !== 'saida') return res.status(400).send("Comprovantes são apenas para retiradas.");

        const doc = new pdfkit({ margin: 50 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=comprovante_retirada_${m.id}.pdf`);
        doc.pipe(res);
        const logoPath = path.join(__dirname, 'public', 'img', 'logo-ecocaixas.png')
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, (doc.page.width - 140) / 2, doc.y, { width: 140 });
            doc.moveDown(6); 
        }

        doc.fontSize(14).font('Helvetica-Bold').text("Ecocaixas BA Soluções em embalagens", { align: 'center' });
        doc.fontSize(10).font('Helvetica').text("CNPJ: 22.570.982/0001-90", { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica').text("COMPROVANTE DE RETIRADA DE CAIXA", { align: 'center' });
        doc.moveDown(2);

        doc.rect(50, doc.y, 500, 100).stroke();
        doc.moveDown(1);
        doc.fontSize(12).font('Helvetica-Bold').text(" DADOS DA RETIRADA:", 60, doc.y);
        doc.moveDown(0.5);

        const dataFormatada = new Date(m.data).toLocaleDateString('pt-BR');
        const valorFormatado = Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        doc.font('Helvetica').text(`  Data: ${dataFormatada}`);
        doc.text(`  Valor Retirado: R$ ${valorFormatado}`);
        doc.text(`  Retirado por: ${m.nome_assinante}`);
        doc.text(`  Registrado por: ${m.responsavel || 'Sistema'}`);
        doc.moveDown(3);

        doc.font('Helvetica-Bold').text(" DESCRIÇÃO:", 50, doc.y);
        doc.font('Helvetica').text(m.descricao || "Nenhuma", 50, doc.y);
        doc.moveDown(1);

        doc.font('Helvetica-Bold').text(" OBSERVAÇÕES:", 50, doc.y);
        doc.font('Helvetica').text(m.observacao || "Nenhuma observação registada.", 50, doc.y);
        doc.moveDown(4);

        doc.moveTo(150, doc.y).lineTo(450, doc.y).stroke();
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text(m.nome_assinante, { align: 'center' });
        doc.fontSize(10).font('Helvetica').text("Assinatura do Recebedor", { align: 'center', color: 'grey' });

        if (m.assinatura_base64) {
            try {
                const base64Data = m.assinatura_base64.replace(/^data:image\/\w+;base64,/, "");
                const imageBuffer = Buffer.from(base64Data, "base64");
                doc.image(imageBuffer, (doc.page.width - 200) / 2, doc.y - 120, { width: 200 });
            } catch (e) {
                console.error("Erro ao renderizar assinatura no PDF:", e);
            }
        }

        doc.moveDown(4);
        doc.fontSize(8).fillColor('grey').text(`Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} - Ecoflow ERP`, { align: 'center' });

        doc.end();
    });
});

//BUSCAR DADOS DE ENTRADAS E SAÍDAS POR PERÍODO
router.get('/api/movimentacoes/periodos', async (req, res) => {
    if (!req.session.user) return res.status(401).json([]);
    try {
        const [rows] = await db.promise().query(`
            SELECT DISTINCT YEAR(data) as ano, MONTH(data) as mes 
            FROM movimentacoes 
            ORDER BY ano DESC, mes DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar períodos:", error);
        res.status(500).json([]);
    }
});

//EXPORTAR RELATÓRIO EXCEL PARA ENTRADAS/SAÍDAS
router.get('/exportar/movimentacoes', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const { mes, ano, cols } = req.query;
        
        // Pega as colunas escolhidas ou o padrão (todas marcadas)
        const requestedCols = cols ? cols.split(',') : ['data','tipo','valor','rastreio','descricao','observacao','assinante','responsavel'];
        
        let whereClause = '';
        const queryParams = [];

        if (mes && ano) {
            whereClause = 'WHERE MONTH(data) = ? AND YEAR(data) = ?';
            queryParams.push(mes, ano);
        }

        const [dados] = await db.promise().query(`
            SELECT data, tipo, valor, responsavel, nome_assinante, descricao, observacao, saldo_anterior, saldo_novo 
            FROM movimentacoes 
            ${whereClause}
            ORDER BY data ASC, id ASC
        `, queryParams);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Movimentações de Caixa');

        // Cria a configuração de colunas de forma dinâmica, obedecendo à ordem e ao filtro do usuário
        const columns = [];
        if (requestedCols.includes('data')) columns.push({ header: 'DATA', key: 'data', width: 15 });
        if (requestedCols.includes('tipo')) columns.push({ header: 'TIPO', key: 'tipo', width: 18 });
        if (requestedCols.includes('valor')) columns.push({ header: 'VALOR (R$)', key: 'valor', width: 15 });
        if (requestedCols.includes('rastreio')) {
            columns.push({ header: 'SALDO ANTERIOR (R$)', key: 'saldo_anterior', width: 22 });
            columns.push({ header: 'NOVO SALDO (R$)', key: 'saldo_novo', width: 22 });
        }
        if (requestedCols.includes('descricao')) columns.push({ header: 'DESCRIÇÃO', key: 'descricao', width: 35 });
        if (requestedCols.includes('observacao')) columns.push({ header: 'OBSERVAÇÕES', key: 'observacao', width: 35 });
        if (requestedCols.includes('assinante')) columns.push({ header: 'ASSINANTE (QUEM MOVIMENTOU)', key: 'nome_assinante', width: 30 });
        if (requestedCols.includes('responsavel')) columns.push({ header: 'REGISTRADO POR', key: 'responsavel', width: 25 });

        sheet.columns = columns;

        // Estiliza o Header Dinâmico
        sheet.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        let totalEntradas = 0;
        let totalSaidas = 0;

        dados.forEach(m => {
            const valorCalculo = parseFloat(m.valor) || 0;

            if (m.tipo === 'entrada') {
                totalEntradas += valorCalculo;
            } else if (m.tipo === 'saida') {
                totalSaidas += valorCalculo;
            }

            // O ExcelJS injeta apenas o que estiver definido no `sheet.columns`
            const row = sheet.addRow({
                data: new Date(m.data),
                tipo: m.tipo.toUpperCase(),
                valor: valorCalculo,
                saldo_anterior: parseFloat(m.saldo_anterior) || 0,
                saldo_novo: parseFloat(m.saldo_novo) || 0,
                responsavel: m.responsavel || '-',
                nome_assinante: m.nome_assinante || 'Não informado',
                descricao: m.descricao,
                observacao: m.observacao || '-'
            });

            if (requestedCols.includes('tipo')) {
                const corStatus = m.tipo === 'entrada' ? 'FF28A745' : 'FFDC3545';
                row.getCell('tipo').font = { color: { argb: corStatus }, bold: true };
            }
        });

        // Formatação Numérica das Colunas (se existirem na requisição atual)
        if (requestedCols.includes('valor')) sheet.getColumn('valor').numFmt = '"R$ " #,##0.00';
        if (requestedCols.includes('data')) sheet.getColumn('data').numFmt = 'dd/mm/yyyy';
        if (requestedCols.includes('rastreio')) {
            sheet.getColumn('saldo_anterior').numFmt = '"R$ " #,##0.00';
            sheet.getColumn('saldo_novo').numFmt = '"R$ " #,##0.00';
        }

        sheet.eachRow(row => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        sheet.addRow([]);

        // Roda-pé de Totais anexado estaticamente para não bugar com os filtros
        const saldoFinal = totalEntradas - totalSaidas;
        
        const rowEntradas = sheet.addRow(['TOTAL ENTRADAS:', totalEntradas]);
        const rowSaidas = sheet.addRow(['TOTAL SAÍDAS:', totalSaidas]);
        const rowSaldo = sheet.addRow(['SALDO FINAL:', saldoFinal]);

        [rowEntradas, rowSaidas, rowSaldo].forEach(row => {
            row.getCell(1).font = { bold: true };
            row.getCell(1).alignment = { horizontal: 'right' };
            row.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            row.getCell(2).numFmt = '"R$ " #,##0.00';
            row.getCell(2).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        rowEntradas.getCell(2).font = { bold: true, color: { argb: 'FF28A745' } };
        rowSaidas.getCell(2).font = { bold: true, color: { argb: 'FFDC3545' } };
        rowSaldo.getCell(2).font = { bold: true, color: { argb: saldoFinal >= 0 ? 'FF000000' : 'FFDC3545' } };

        const compNome = (mes && ano) ? `${mes}_${ano}` : `Geral`;
        const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Caixa_${compNome}_${dataHoje}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('[ERRO EXPORTAR CAIXA]', err);
        res.status(500).send('Erro ao gerar relatório');
    }
});

module.exports = router;