const express = require("express");
const router = express.Router();
const db = require("../db");
const path = require("path");
const fs = require("fs");
const pdfkit = require("pdfkit"); // Necessário para gerar o comprovante em PDF
const ExcelJS = require("exceljs"); // Necessário para exportar o relatório

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
        console.warn(`[Aviso] Parâmetro 'page' inválido recebido: ${req.query.page}. Revertendo para página 1.`);
        page = 1;
    }

    const limit = 20;
    const { data_inicio, data_fim, tipo } = req.query;

    // -------------------------------------------------------------
    // FILTROS DA LISTA E DA PAGINAÇÃO (Respeita data e tipo)
    // -------------------------------------------------------------
    let whereList = [];
    let paramsList = [];

    if (data_inicio) { whereList.push("data >= ?"); paramsList.push(data_inicio); }
    if (data_fim) { whereList.push("data <= ?"); paramsList.push(data_fim); }
    if (tipo === "entrada" || tipo === "saida") { whereList.push("tipo = ?"); paramsList.push(tipo); }

    const whereListSql = whereList.length ? "WHERE " + whereList.join(" AND ") : "";
    console.log(`[Filtros Lista] SQL Dinâmico: ${whereListSql || "Nenhum filtro aplicado"} | Parâmetros:`, paramsList);

    // -------------------------------------------------------------
    // FILTROS DOS INDICADORES DE ENTRADA E SAÍDA (Respeita apenas datas ou Mês Atual)
    // -------------------------------------------------------------
    let whereIndic = [];
    let paramsIndic = [];

    if (data_inicio) { whereIndic.push("data >= ?"); paramsIndic.push(data_inicio); }
    if (data_fim) { whereIndic.push("data <= ?"); paramsIndic.push(data_fim); }

    // NOVO: Se não houver filtro de data, restringe Entradas e Saídas estritamente ao mês atual!
    if (!data_inicio && !data_fim) {
        whereIndic.push("MONTH(data) = MONTH(CURRENT_DATE()) AND YEAR(data) = YEAR(CURRENT_DATE())");
    }

    const whereIndicSql = whereIndic.length ? "WHERE " + whereIndic.join(" AND ") : "";

    // -------------------------------------------------------------
    // QUERY 1: BUSCA DE TODOS OS TOTAIS COM PRECISÃO EM UMA SÓ CONSULTA
    // -------------------------------------------------------------
    const sqlTotais = `
        SELECT 
            (SELECT COUNT(*) FROM movimentacoes ${whereListSql}) AS total_itens,
            (SELECT COALESCE(SUM(valor), 0) FROM movimentacoes ${whereIndicSql} ${whereIndic.length ? 'AND' : 'WHERE'} tipo = 'entrada') AS total_entradas,
            (SELECT COALESCE(SUM(valor), 0) FROM movimentacoes ${whereIndicSql} ${whereIndic.length ? 'AND' : 'WHERE'} tipo = 'saida') AS total_saidas,
            (SELECT COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) FROM movimentacoes) AS total_caixa
    `;

    // Mapeamento milimétrico de parâmetros para as subqueries (a do caixa geral não leva parâmetros)
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

        console.log(`[Cálculos do Período] Entradas: ${totalEntradas} | Saídas: ${totalSaidas} | Saldo Geral (Todo Período): ${totalCaixa}`);

        const totalPages = Math.max(1, Math.ceil(total / limit));
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        const currentOffset = (currentPage - 1) * limit;

        console.log(`[Paginação] Total Itens: ${total} | Páginas: ${totalPages} | Atual: ${currentPage} | Offset: ${currentOffset}`);

        // -------------------------------------------------------------
        // QUERY 2: BUSCAR APENAS OS REGISTROS DA PÁGINA ATUAL (COM LIMIT/OFFSET)
        // -------------------------------------------------------------
        const queryParamsLista = [...paramsList, limit, currentOffset];

        db.query(`SELECT * FROM movimentacoes ${whereListSql} ORDER BY data DESC, id DESC LIMIT ? OFFSET ?`,
            queryParamsLista,
            (errMov, movimentacoes) => {
                if (errMov) {
                    console.error("[Erro Banco de Dados] Falha ao buscar as movimentações paginadas:", errMov);
                    return res.status(500).send("Erro interno do servidor.");
                }

                try {
                    console.log(`[Sucesso] Renderizando view com ${movimentacoes.length} registros para o usuário ${usuario.nome}.`);

                    // A view agora recebe os totais blindados e corretos vindos do Banco de Dados
                    res.send(require('../views/entradasSaidasView')(
                        usuario,
                        movimentacoes,
                        { page: currentPage, totalPages, total, totalEntradas, totalSaidas, totalCaixa },
                        { data_inicio, data_fim, tipo }
                    ));
                } catch (renderError) {
                    console.error("[Erro Crítico] Falha na renderização da View 'entradasSaidasView':", renderError);
                    res.status(500).send("Ocorreu um erro interno ao tentar exibir a interface.");
                }
            }
        );
    });
});

//CADASTRAR ENTRADA/SAÍDA
router.post('/movimentacoes/novo', async (req, res) => {
    // Agora capturamos o 'nome_assinante' do formulário
    const { tipo, data, valor, descricao, observacao, assinatura_base64, nome_assinante } = req.body;
    // O responsavel real é extraído de quem está logado no sistema
    const responsavel = req.session.user ? req.session.user.nome : "Sistema";

    try {
        await db.promise().query(`
            INSERT INTO movimentacoes (tipo, data, valor, descricao, observacao, assinatura_base64, responsavel, nome_assinante)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [tipo, data, valor, descricao, observacao, assinatura_base64, responsavel, nome_assinante]);

        res.redirect('/entradas-saidas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao salvar movimentação');
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
    // Validação de segurança idêntica à view principal
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
            if (!mes) return res.status(400).json({ error: "Mês não informado para a visão diária." });

            // Descobre quantos dias tem o mês selecionado para montar o eixo X do gráfico
            const diasNoMes = new Date(ano, mes, 0).getDate();
            labels = Array.from({ length: diasNoMes }, (_, i) => String(i + 1).padStart(2, '0'));
            entradas = new Array(diasNoMes).fill(0);
            saidas = new Array(diasNoMes).fill(0);

            // Soma agrupando pelo DIA
            query = `
                SELECT DAY(data) as chave, tipo, SUM(valor) as total
                FROM movimentacoes
                WHERE MONTH(data) = ? AND YEAR(data) = ?
                GROUP BY DAY(data), tipo
            `;
            params = [mes, ano];

        } else if (visao === 'mes') {
            // Eixo X padrão para o ano todo
            labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            entradas = new Array(12).fill(0);
            saidas = new Array(12).fill(0);

            // Soma agrupando pelo MÊS
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

        // Preenche os arrays corretos substituindo os zeros onde há dados no banco
        rows.forEach(row => {
            const index = row.chave - 1; // As funções DAY() e MONTH() no MySQL começam em 1
            const valorTotal = parseFloat(row.total) || 0;

            if (row.tipo === 'entrada') {
                entradas[index] = valorTotal;
            } else if (row.tipo === 'saida') {
                saidas[index] = valorTotal;
            }
        });

        // Retorna o formato exato que o Chart.js na view está esperando
        res.json({ labels, entradas, saidas });

    } catch (error) {
        console.error("[Erro API Gráfico] Falha ao buscar dados das movimentações:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

//COMPROVANTE ENTRADA/SAÍDA
router.get('/movimentacoes/comprovante/:id', (req, res) => {
    // Valida permissão básica
    if (!req.session.user || (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "financeiro")) {
        return res.status(403).send("Acesso negado");
    }

    const id = req.params.id;

    db.query("SELECT * FROM movimentacoes WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).send("Movimentação não encontrada.");

        const m = results[0];

        if (m.tipo !== 'saida') return res.status(400).send("Comprovantes são apenas para retiradas.");

        // Usa a variável em minúsculo conforme a sua importação
        const doc = new pdfkit({ margin: 50 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=comprovante_retirada_${m.id}.pdf`);
        doc.pipe(res);
        const logoPath = path.join(__dirname, 'public', 'img', 'logo-ecocaixas.png')
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, (doc.page.width - 140) / 2, doc.y, { width: 140 });
            doc.moveDown(6); // Empurra o cursor (Y) para baixo da imagem
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

        // Inserção da Imagem da Assinatura desenhada na tela (Base64)
        if (m.assinatura_base64) {
            try {
                // Remove o prefixo "data:image/png;base64," para o Buffer conseguir converter
                const base64Data = m.assinatura_base64.replace(/^data:image\/\w+;base64,/, "");
                const imageBuffer = Buffer.from(base64Data, "base64");

                // Desenha a assinatura um pouco acima da linha
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
        const { mes, ano } = req.query;
        let whereClause = '';
        const queryParams = [];

        // Filtra por mês e ano se o usuário selecionar no Modal
        if (mes && ano) {
            whereClause = 'WHERE MONTH(data) = ? AND YEAR(data) = ?';
            queryParams.push(mes, ano);
        }

        // Alterado ORDER BY para ASC (Crescente: do dia 1 ao último dia)
        const [dados] = await db.promise().query(`
            SELECT data, tipo, valor, responsavel, nome_assinante, descricao, observacao 
            FROM movimentacoes 
            ${whereClause}
            ORDER BY data ASC, id ASC
        `, queryParams);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Movimentações de Caixa');

        sheet.columns = [
            { header: 'DATA', key: 'data', width: 15 },
            { header: 'TIPO', key: 'tipo', width: 18 },
            { header: 'VALOR (R$)', key: 'valor', width: 15 },
            { header: 'REGISTRADO POR (SISTEMA)', key: 'responsavel', width: 25 },
            { header: 'ASSINANTE (QUEM MOVIMENTOU)', key: 'nome_assinante', width: 30 },
            { header: 'DESCRIÇÃO', key: 'descricao', width: 35 },
            { header: 'OBSERVAÇÕES', key: 'observacao', width: 35 }
        ];

        sheet.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
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

            const row = sheet.addRow({
                data: new Date(m.data),
                tipo: m.tipo.toUpperCase(),
                valor: valorCalculo,
                responsavel: m.responsavel || '-',
                nome_assinante: m.nome_assinante || 'Não informado',
                descricao: m.descricao,
                observacao: m.observacao || '-'
            });

            const corStatus = m.tipo === 'entrada' ? 'FF28A745' : 'FFDC3545';
            row.getCell('tipo').font = { color: { argb: corStatus }, bold: true };
        });

        sheet.getColumn('valor').numFmt = '"R$ " #,##0.00';
        sheet.getColumn('data').numFmt = 'dd/mm/yyyy';

        sheet.eachRow(row => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        sheet.addRow([]);

        const saldoFinal = totalEntradas - totalSaidas;

        const rowEntradas = sheet.addRow({ tipo: 'TOTAL ENTRADAS:', valor: totalEntradas });
        const rowSaidas = sheet.addRow({ tipo: 'TOTAL SAÍDAS:', valor: totalSaidas });
        const rowSaldo = sheet.addRow({ tipo: 'SALDO FINAL:', valor: saldoFinal });

        [rowEntradas, rowSaidas, rowSaldo].forEach(row => {
            row.getCell('tipo').font = { bold: true };
            row.getCell('tipo').alignment = { horizontal: 'right' };
            row.getCell('tipo').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            row.getCell('valor').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        rowEntradas.getCell('valor').font = { bold: true, color: { argb: 'FF28A745' } };
        rowSaidas.getCell('valor').font = { bold: true, color: { argb: 'FFDC3545' } };
        rowSaldo.getCell('valor').font = { bold: true, color: { argb: saldoFinal >= 0 ? 'FF000000' : 'FFDC3545' } };

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