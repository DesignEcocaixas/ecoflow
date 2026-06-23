const express = require("express");
const router = express.Router();
const db = require("../db");
const ExcelJS = require("exceljs"); // Necessário para a exportação

// Cole a função exatamente aqui, solta no arquivo, antes das rotas:
function tratarData(valor) {
    if (!valor) return null;
    if (typeof valor === 'string' && valor.trim() === '') return null;
    return valor;
}

//------------------------------------------------------------------------------ROTAS PARA PROPOSTAS E DESIGN------------------------------------------------------------------------------
//LISTAR PROPOSTAS
router.get('/propostas/lista', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        const { cliente, data_inicio, data_fim, page = 1 } = req.query;
        const limit = 12; // <--- ALTERADO PARA 12 POR PÁGINA
        const offset = (page - 1) * limit;

        let where = 'WHERE 1=1';
        const params = [];

        if (cliente) {
            where += ' AND p.cliente LIKE ?';
            params.push(`%${cliente}%`);
        }

        if (data_inicio && data_fim) {
            where += ' AND p.data_inicio >= ? AND p.data_fim <= ?';
            params.push(data_inicio, data_fim);
        }

        const [[{ total }]] = await db.promise().query(`SELECT COUNT(DISTINCT p.id) AS total FROM propostas p ${where}`, params);

        const [rows] = await db.promise().query(
            `SELECT p.*, COUNT(m.id) AS total_modificacoes
             FROM propostas p
             LEFT JOIN proposta_modificacoes m ON m.proposta_id = p.id
             ${where}
             GROUP BY p.id ORDER BY p.criada_em DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return res.json({ data: rows, pagination: { total, page: Number(page), totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
});

//CADASTRAR PROPOSTA
router.post('/propostas', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        const { cliente, designer, data_inicio, data_fim, observacao, data_solicitacao_cliche, data_chegada_cliche, modificacoes = [] } = req.body;

        const [result] = await db.promise().query(
            `INSERT INTO propostas (cliente, designer, data_inicio, data_fim, observacao, data_solicitacao_cliche, data_chegada_cliche) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [cliente, designer || null, tratarData(data_inicio), tratarData(data_fim), observacao || null, tratarData(data_solicitacao_cliche), tratarData(data_chegada_cliche)]
        );

        const propostaId = result.insertId;

        for (const m of modificacoes) {
            if (m.descricao) {
                await db.promise().query(
                    `INSERT INTO proposta_modificacoes (proposta_id, descricao, data_modificacao) VALUES (?, ?, ?)`,
                    [propostaId, m.descricao, tratarData(m.data_modificacao)]
                );
            }
        }
        return res.json({ success: true, id: propostaId });
    } catch (err) {
        console.error('Erro ao criar proposta:', err);
        return res.status(500).json({ success: false });
    }
});

//BUSCAR PROPOSTA
router.get('/propostas/detalhe/:id', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        const { id } = req.params;
        const [[proposta]] = await db.promise().query('SELECT * FROM propostas WHERE id = ?', [id]);
        if (!proposta) return res.status(404).json({ success: false, error: 'Proposta não encontrada' });

        const [modificacoes] = await db.promise().query('SELECT * FROM proposta_modificacoes WHERE proposta_id = ? ORDER BY data_modificacao ASC', [id]);
        return res.json({ proposta, modificacoes });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
});

//EDITAR PROPOSTA
router.put('/propostas/:id', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        const { id } = req.params;
        const { cliente, designer, data_inicio, data_fim, observacao, data_solicitacao_cliche, data_chegada_cliche, modificacoes = [] } = req.body;

        await db.promise().query(
            `UPDATE propostas SET cliente = ?, designer = ?, data_inicio = ?, data_fim = ?, observacao = ?, data_solicitacao_cliche = ?, data_chegada_cliche = ? WHERE id = ?`,
            [cliente, designer || null, tratarData(data_inicio), tratarData(data_fim), observacao || null, tratarData(data_solicitacao_cliche), tratarData(data_chegada_cliche), id]
        );

        await db.promise().query('DELETE FROM proposta_modificacoes WHERE proposta_id = ?', [id]);
        for (const m of modificacoes) {
            if (m.descricao) {
                await db.promise().query(`INSERT INTO proposta_modificacoes (proposta_id, descricao, data_modificacao) VALUES (?, ?, ?)`, [id, m.descricao, tratarData(m.data_modificacao)]);
            }
        }
        return res.json({ success: true });
    } catch (err) {
        console.error('Erro ao atualizar proposta:', err);
        return res.status(500).json({ success: false });
    }
});

//EXCLUIR PROPOSTA
router.delete('/propostas/:id', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        await db.promise().query('DELETE FROM propostas WHERE id = ?', [req.params.id]);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
});

// 6. API Períodos Disponíveis (Para modal do Excel)
router.get('/admin/api/periodos-disponiveis', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        const [rows] = await db.promise().query(`SELECT DISTINCT MONTH(data_inicio) as mes, YEAR(data_inicio) as ano FROM propostas WHERE data_inicio IS NOT NULL ORDER BY ano DESC, mes DESC`);
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Erro' });
    }
});

//RENDERIZAR PROPOSTAS
router.get('/propostas', (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    return res.send(require('../views/propostasView')(req.session.user));
});

//RELATÓRIO COMPLETO PROPOSTAS
router.get('/propostas/exportar/excel', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    try {
        const { mes, ano } = req.query;
        let whereClause = '';
        const queryParams = [];

        if (mes && ano) {
            whereClause = 'WHERE MONTH(p.data_inicio) = ? AND YEAR(p.data_inicio) = ?';
            queryParams.push(mes, ano);
        }

        const query = `
            SELECT p.cliente, p.designer, p.data_inicio, p.data_fim, p.data_solicitacao_cliche, p.data_chegada_cliche, COUNT(m.id) AS total_modificacoes
            FROM propostas p LEFT JOIN proposta_modificacoes m ON m.proposta_id = p.id
            ${whereClause} GROUP BY p.id ORDER BY p.data_inicio DESC
        `;

        const [rows] = await db.promise().query(query, queryParams);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Relatório');

        worksheet.columns = [
            { header: 'Mês / Ano', key: 'mesAno', width: 15 },
            { header: 'Cliente', key: 'cliente', width: 35 },
            { header: 'Designer', key: 'designer', width: 20 },
            { header: 'Alterações', key: 'alteracoes', width: 15 },
            { header: 'Duração da Arte (Dias)', key: 'diasArte', width: 25 },
            { header: 'Logística Clichê (Dias)', key: 'diasCliche', width: 25 },
            { header: 'Status', key: 'status', width: 20 }
        ];

        const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        worksheet.getRow(1).eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = borderStyle;
        });

        if (rows.length === 0) {
            worksheet.addRow({ mesAno: 'Nenhum registro encontrado para este período.' });
            worksheet.mergeCells('A2:G2');
            worksheet.getCell('A2').alignment = { horizontal: 'center' };
            worksheet.getCell('A2').border = borderStyle;
        } else {
            let somaAlteracoes = 0, somaDiasArte = 0, countDiasArte = 0, somaDiasCliche = 0, countDiasCliche = 0;

            rows.forEach(row => {
                let mesAno = '-', diasArteTexto = '-', diasClicheTexto = '-', status = 'Em andamento';
                let diasArteNum = 0, diasClicheNum = 0;

                if (row.data_inicio) {
                    const d = new Date(row.data_inicio);
                    mesAno = (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
                }

                if (row.data_inicio && row.data_fim) {
                    const ms = new Date(row.data_fim) - new Date(row.data_inicio);
                    diasArteNum = Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
                    diasArteTexto = diasArteNum;
                    status = 'Concluída';
                    somaDiasArte += diasArteNum; countDiasArte++;
                }

                if (row.data_solicitacao_cliche && row.data_chegada_cliche) {
                    const ms = new Date(row.data_chegada_cliche) - new Date(row.data_solicitacao_cliche);
                    diasClicheNum = Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
                    diasClicheTexto = diasClicheNum;
                    somaDiasCliche += diasClicheNum; countDiasCliche++;
                }

                somaAlteracoes += (row.total_modificacoes || 0);

                const novaLinha = worksheet.addRow({
                    mesAno: mesAno, cliente: row.cliente || '', designer: row.designer || '-',
                    alteracoes: row.total_modificacoes || 0, diasArte: diasArteTexto, diasCliche: diasClicheTexto, status: status
                });

                novaLinha.alignment = { horizontal: 'center' };

                // === NOVA LÓGICA DE CORES DA LINHA EXCEL ===
                let corFundo = null;
                // Se algum estourar 2 dias, mantém a linha branca (null)
                if (diasArteNum > 2 || diasClicheNum > 2) {
                    corFundo = null;
                }
                // Se não estourou, e algum tem pelo menos 1 dia (até 2), fica verde
                else if ((diasArteNum > 0 && diasArteNum <= 2) || (diasClicheNum > 0 && diasClicheNum <= 2)) {
                    corFundo = 'FFE2EFDA'; // Verde claro
                }

                novaLinha.eachCell((cell) => {
                    cell.border = borderStyle;
                    if (corFundo) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: corFundo } };
                    }
                    if (typeof cell.value === 'number') cell.font = { bold: true, color: { argb: 'FF000000' } };
                });
            });

            const mediaAlteracoes = parseFloat((somaAlteracoes / rows.length).toFixed(1));
            const mediaDiasArte = countDiasArte > 0 ? parseFloat((somaDiasArte / countDiasArte).toFixed(1)) : '-';
            const mediaDiasCliche = countDiasCliche > 0 ? parseFloat((somaDiasCliche / countDiasCliche).toFixed(1)) : '-';

            const rowMedia = worksheet.addRow({
                mesAno: 'MÉDIAS', cliente: '-', designer: '-', alteracoes: mediaAlteracoes,
                diasArte: mediaDiasArte, diasCliche: mediaDiasCliche, status: '-'
            });

            rowMedia.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FF1E293B' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
                cell.alignment = { horizontal: 'center' };
                cell.border = borderStyle;
            });
        }

        const fileName = (mes && ano) ? `relatorio_propostas_${mes}_${ano}.xlsx` : `relatorio_propostas.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        await workbook.xlsx.write(res);
        return res.end();

    } catch (err) {
        return res.status(500).send('Erro ao gerar relatório');
    }
});

module.exports = router;