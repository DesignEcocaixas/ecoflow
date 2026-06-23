const express = require("express");
const router = express.Router();
const db = require("../db");
const ExcelJS = require("exceljs");
const { exec } = require('child_process'); // Necessário para rodar o script Python

const { uploadProducao } = require("../config/uploadConfig");
const { isLogged } = require("../middlewares/authMiddleware");

//------------------------------------------------------------------------------ROTAS PARA ORDEM DE PRODUÇÃO------------------------------------------------------------------------------
//LISTAR ORDENS DE PRODUÇÃO
router.get('/producao', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario === "motorista") return res.status(403).send("Acesso negado.");

    try {
        // Busca apenas o que está ATIVO (ativo = 1) para os modais de produção
        const [rotativa] = await db.promise().query('SELECT * FROM pedidos_rotativa WHERE ativo = 1 ORDER BY status_producao ASC, created_at DESC');
        const [flexo] = await db.promise().query('SELECT * FROM pedidos_flexografica WHERE ativo = 1 ORDER BY status_producao ASC, created_at DESC');

        const [[rotativaNovas]] = await db.promise().query('SELECT COUNT(*) as total FROM pedidos_rotativa WHERE notificado = 1 AND ativo = 1');
        const [[flexoNovas]] = await db.promise().query('SELECT COUNT(*) as total FROM pedidos_flexografica WHERE notificado = 1 AND ativo = 1');

        const page = parseInt(req.query.page || "1", 10);
        const limit = 10;
        const offset = (page - 1) * limit;

        // Contagem agora baseada em lotes únicos
        const queryHistoricoCount = `
            SELECT COUNT(DISTINCT lote) AS total_datas FROM (
                SELECT lote FROM pedidos_rotativa WHERE lote IS NOT NULL
                UNION ALL
                SELECT lote FROM pedidos_flexografica WHERE lote IS NOT NULL
            ) AS t
        `;
        const [[countResult]] = await db.promise().query(queryHistoricoCount);
        const total = countResult.total_datas || 0;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        const currentOffset = (currentPage - 1) * limit;

        // O histórico agora agrupa por LOTE (geração única) e mostra a hora exata
        const queryHistoricoList = `
            SELECT lote as lote_id, 
                   DATE_FORMAT(MAX(created_at), '%d/%m/%Y %H:%i') as data_formatada,
                   COUNT(*) as total_pedidos
            FROM (
                SELECT lote, created_at FROM pedidos_rotativa WHERE lote IS NOT NULL
                UNION ALL
                SELECT lote, created_at FROM pedidos_flexografica WHERE lote IS NOT NULL
            ) AS t
            GROUP BY lote
            ORDER BY lote DESC
            LIMIT ? OFFSET ?
        `;

        const [historico] = await db.promise().query(queryHistoricoList, [limit, currentOffset]);

        res.send(require('../views/ordemProducaoView')(
            req.session.user,
            rotativa,
            flexo,
            req.query,
            rotativaNovas.total,
            flexoNovas.total,
            historico,
            { page: currentPage, totalPages }
        ));
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar produção');
    }
});

//EXPORTAR HISTÓRICO DE ORDENS DE PRODUÇÃO
router.get('/exportar/historico', async (req, res) => {
    const loteAlvo = req.query.lote; // agora recebe o ID do lote

    if (!loteAlvo) return res.status(400).send("Lote não especificado.");

    try {
        const [rotativa] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, quantidade, previsao_faturamento, status_producao
            FROM pedidos_rotativa 
            WHERE lote = ? 
            ORDER BY 
                modelo,
                CAST(REGEXP_REPLACE(tamanho, '[^0-9]', '') AS UNSIGNED),
                cliente`, [loteAlvo]
        );

        const [flexo] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, material, qtd_cores, cor_personalizacao, quantidade, status_pedido, previsao_faturamento, status_producao
            FROM pedidos_flexografica 
            WHERE lote = ? 
            ORDER BY cliente`, [loteAlvo]
        );

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();

        // Transforma o timestamp do lote numa data legível para os títulos do Excel
        const dataDoLote = new Date(parseInt(loteAlvo));
        const dataFormatadaStr = isNaN(dataDoLote) ? loteAlvo : dataDoLote.toLocaleDateString('pt-BR');

        // ==========================================
        // ABA 1: ROTATIVA / PLANA
        // ==========================================
        if (rotativa.length > 0) {
            const sheetRot = workbook.addWorksheet('Rotativa');

            sheetRot.pageSetup = {
                orientation: 'landscape',
                scale: 95,
                fitToPage: false,
                margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
            };

            sheetRot.columns = [
                { header: 'MODELO', key: 'modelo', width: 25 },
                { header: 'TAMANHO', key: 'tamanho', width: 12 },
                { header: 'CLIENTE', key: 'cliente', width: 30 },
                { header: 'QUANTIDADE', key: 'quantidade', width: 15 },
                { header: 'VENDEDOR', key: 'vendedor', width: 25 },
                { header: 'DATA', key: 'previsao_faturamento', width: 15 },
                { header: 'OPERADOR', key: 'operador', width: 20 },
                { header: 'STATUS', key: 'status', width: 15 }
            ];

            sheetRot.insertRow(1, []);
            sheetRot.mergeCells(1, 1, 1, sheetRot.columns.length);

            const tituloCell = sheetRot.getCell('A1');
            tituloCell.value = `ROTATIVA/PLANA (HISTÓRICO) - ${dataFormatadaStr}`;
            tituloCell.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
            tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
            sheetRot.getRow(1).height = 25;

            const headerRow = sheetRot.getRow(2);
            headerRow.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            let modeloAtual = null;
            let tamanhoAtual = null;

            rotativa.forEach(d => {
                if (modeloAtual !== null && modeloAtual !== d.modelo) {
                    sheetRot.addRow({});
                    sheetRot.addRow({});
                }

                if (tamanhoAtual !== null && tamanhoAtual !== d.tamanho && modeloAtual === d.modelo) {
                    sheetRot.addRow({});
                }

                sheetRot.addRow({
                    modelo: modeloAtual === d.modelo ? '' : d.modelo,
                    tamanho: tamanhoAtual === d.tamanho && modeloAtual === d.modelo ? '' : d.tamanho,
                    cliente: d.cliente,
                    quantidade: d.quantidade,
                    vendedor: d.vendedor,
                    previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                    operador: '',
                    status: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente'
                });

                modeloAtual = d.modelo;
                tamanhoAtual = d.tamanho;
            });

            sheetRot.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
            sheetRot.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
            sheetRot.getColumn('modelo').alignment = { horizontal: 'center' };
            sheetRot.getColumn('tamanho').alignment = { horizontal: 'center' };
            sheetRot.getColumn('quantidade').alignment = { horizontal: 'center' };

            sheetRot.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            });
        }

        // ==========================================
        // ABA 2: FLEXOGRÁFICA
        // ==========================================
        if (flexo.length > 0) {
            const sheetFlexo = workbook.addWorksheet('Flexográfica');

            sheetFlexo.pageSetup = {
                orientation: 'landscape',
                scale: 70,
                fitToPage: false,
                margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
            };

            sheetFlexo.columns = [
                { header: 'CLIENTE', key: 'cliente', width: 30 },
                { header: 'VENDEDOR', key: 'vendedor', width: 15 },
                { header: 'MODELO', key: 'modelo', width: 20 },
                { header: 'TAMANHO', key: 'tamanho', width: 10 },
                { header: 'MATERIAL', key: 'material', width: 12 },
                { header: 'QTD CORES', key: 'qtd_cores', width: 12 },
                { header: 'COR PERSONALIZAÇÃO', key: 'cor_personalizacao', width: 35 },
                { header: 'QTD', key: 'quantidade', width: 10 },
                { header: 'STATUS PEDIDO', key: 'status_pedido', width: 25 },
                { header: 'PREV. FAT.', key: 'previsao_faturamento', width: 15 },
                { header: 'OPERADOR', key: 'operador', width: 20 },
                { header: 'STATUS PROD.', key: 'status_producao', width: 15 }
            ];

            sheetFlexo.insertRow(1, []);
            sheetFlexo.mergeCells(1, 1, 1, sheetFlexo.columns.length);
            const tituloCellFlexo = sheetFlexo.getCell('A1');
            tituloCellFlexo.value = `FLEXOGRÁFICA (HISTÓRICO) - ${dataFormatadaStr}`;
            tituloCellFlexo.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
            tituloCellFlexo.alignment = { horizontal: 'center', vertical: 'middle' };
            sheetFlexo.getRow(1).height = 25;

            const headerRowFlexo = sheetFlexo.getRow(2);
            headerRowFlexo.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            let clienteAnterior = null;

            flexo.forEach(d => {
                if (clienteAnterior && d.cliente !== clienteAnterior) {
                    sheetFlexo.addRow({});
                }

                sheetFlexo.addRow({
                    ...d,
                    previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                    status_producao: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente',
                    operador: ''
                });

                clienteAnterior = d.cliente;
            });

            sheetFlexo.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
            sheetFlexo.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
            sheetFlexo.getColumn('quantidade').alignment = { horizontal: 'center' };
            sheetFlexo.getColumn('qtd_cores').alignment = { horizontal: 'center' };

            sheetFlexo.eachRow((row) => {
                row.eachCell(cell => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            });
        }

        if (rotativa.length === 0 && flexo.length === 0) {
            return res.status(404).send("Nenhum dado encontrado para a geração especificada.");
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Historico_Producao_Lote_${loteAlvo}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao exportar histórico');
    }
});

// ADICIONE ESTA NOVA ROTA PARA EXPORTAR PELO HISTÓRICO
router.get('/exportar/historico', async (req, res) => {
    const dataAlvo = req.query.data; // formato YYYY-MM-DD

    if (!dataAlvo) return res.status(400).send("Data não especificada.");

    try {
        const [rotativa] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, quantidade, previsao_faturamento, status_producao
            FROM pedidos_rotativa 
            WHERE DATE(created_at) = ? 
            ORDER BY 
                modelo,
                CAST(REGEXP_REPLACE(tamanho, '[^0-9]', '') AS UNSIGNED),
                cliente`, [dataAlvo]
        );

        const [flexo] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, material, qtd_cores, cor_personalizacao, quantidade, status_pedido, previsao_faturamento, status_producao
            FROM pedidos_flexografica 
            WHERE DATE(created_at) = ? 
            ORDER BY cliente`, [dataAlvo]
        );

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const dataFormatadaStr = dataAlvo.split('-').reverse().join('-');

        // ==========================================
        // ABA 1: ROTATIVA / PLANA
        // ==========================================
        if (rotativa.length > 0) {
            const sheetRot = workbook.addWorksheet('Rotativa');

            sheetRot.pageSetup = {
                orientation: 'landscape',
                scale: 95,
                fitToPage: false,
                margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
            };

            sheetRot.columns = [
                { header: 'MODELO', key: 'modelo', width: 25 },
                { header: 'TAMANHO', key: 'tamanho', width: 12 },
                { header: 'CLIENTE', key: 'cliente', width: 30 },
                { header: 'QUANTIDADE', key: 'quantidade', width: 15 },
                { header: 'VENDEDOR', key: 'vendedor', width: 25 },
                { header: 'DATA', key: 'previsao_faturamento', width: 15 },
                { header: 'OPERADOR', key: 'operador', width: 20 },
                { header: 'STATUS', key: 'status', width: 15 }
            ];

            sheetRot.insertRow(1, []);
            sheetRot.mergeCells(1, 1, 1, sheetRot.columns.length);

            const tituloCell = sheetRot.getCell('A1');
            tituloCell.value = `ROTATIVA/PLANA (HISTÓRICO) - ${dataFormatadaStr}`;
            tituloCell.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
            tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
            sheetRot.getRow(1).height = 25;

            const headerRow = sheetRot.getRow(2);
            headerRow.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            let modeloAtual = null;
            let tamanhoAtual = null;

            rotativa.forEach(d => {
                if (modeloAtual !== null && modeloAtual !== d.modelo) {
                    sheetRot.addRow({});
                    sheetRot.addRow({});
                }

                if (tamanhoAtual !== null && tamanhoAtual !== d.tamanho && modeloAtual === d.modelo) {
                    sheetRot.addRow({});
                }

                sheetRot.addRow({
                    modelo: modeloAtual === d.modelo ? '' : d.modelo,
                    tamanho: tamanhoAtual === d.tamanho && modeloAtual === d.modelo ? '' : d.tamanho,
                    cliente: d.cliente,
                    quantidade: d.quantidade,
                    vendedor: d.vendedor,
                    previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                    operador: '',
                    status: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente'
                });

                modeloAtual = d.modelo;
                tamanhoAtual = d.tamanho;
            });

            sheetRot.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
            sheetRot.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
            sheetRot.getColumn('modelo').alignment = { horizontal: 'center' };
            sheetRot.getColumn('tamanho').alignment = { horizontal: 'center' };
            sheetRot.getColumn('quantidade').alignment = { horizontal: 'center' };

            sheetRot.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            });
        }

        // ==========================================
        // ABA 2: FLEXOGRÁFICA
        // ==========================================
        if (flexo.length > 0) {
            const sheetFlexo = workbook.addWorksheet('Flexográfica');

            sheetFlexo.pageSetup = {
                orientation: 'landscape',
                scale: 70,
                fitToPage: false,
                margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
            };

            sheetFlexo.columns = [
                { header: 'CLIENTE', key: 'cliente', width: 30 },
                { header: 'VENDEDOR', key: 'vendedor', width: 15 },
                { header: 'MODELO', key: 'modelo', width: 20 },
                { header: 'TAMANHO', key: 'tamanho', width: 10 },
                { header: 'MATERIAL', key: 'material', width: 12 },
                { header: 'QTD CORES', key: 'qtd_cores', width: 12 },
                { header: 'COR PERSONALIZAÇÃO', key: 'cor_personalizacao', width: 35 },
                { header: 'QTD', key: 'quantidade', width: 10 },
                { header: 'STATUS PEDIDO', key: 'status_pedido', width: 25 },
                { header: 'PREV. FAT.', key: 'previsao_faturamento', width: 15 },
                { header: 'OPERADOR', key: 'operador', width: 20 },
                { header: 'STATUS PROD.', key: 'status_producao', width: 15 }
            ];

            sheetFlexo.insertRow(1, []);
            sheetFlexo.mergeCells(1, 1, 1, sheetFlexo.columns.length);
            const tituloCellFlexo = sheetFlexo.getCell('A1');
            tituloCellFlexo.value = `FLEXOGRÁFICA (HISTÓRICO) - ${dataFormatadaStr}`;
            tituloCellFlexo.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
            tituloCellFlexo.alignment = { horizontal: 'center', vertical: 'middle' };
            sheetFlexo.getRow(1).height = 25;

            const headerRowFlexo = sheetFlexo.getRow(2);
            headerRowFlexo.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            let clienteAnterior = null;

            flexo.forEach(d => {
                if (clienteAnterior && d.cliente !== clienteAnterior) {
                    sheetFlexo.addRow({});
                }

                sheetFlexo.addRow({
                    ...d,
                    previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                    status_producao: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente',
                    operador: ''
                });

                clienteAnterior = d.cliente;
            });

            sheetFlexo.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
            sheetFlexo.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
            sheetFlexo.getColumn('quantidade').alignment = { horizontal: 'center' };
            sheetFlexo.getColumn('qtd_cores').alignment = { horizontal: 'center' };

            sheetFlexo.eachRow((row) => {
                row.eachCell(cell => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            });
        }

        // Se por algum motivo a data não tiver registros nas duas tabelas (caso raro), previne corrupção de excel vazio
        if (rotativa.length === 0 && flexo.length === 0) {
            return res.status(404).send("Nenhum dado encontrado para a data especificada.");
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Historico_Producao_${dataFormatadaStr}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao exportar histórico');
    }
});

// ROTA POST: IMPORTAR ORDENS VINDAS DO OMIE PARA REORGANIZAR
router.post('/importar', uploadProducao.single('planilha'), async (req, res) => {
    if (!req.file) return res.redirect('/producao?erro=arquivo');

    // O req.file.path já aponta corretamente para a nova subpasta "producao/importacoes" com o caminho absoluto
    const caminhoArquivo = req.file.path;
    const lote = Date.now(); // Gera o ID único da importação
    const pythonPath = process.platform === "win32" ? `"C:\\Python313\\python.exe"` : "python3";

    exec(`${pythonPath} app.py "${caminhoArquivo}" ${lote}`, async (error, stdout, stderr) => {
        console.log('----- OUTPUT DO PYTHON -----');
        console.log(stdout);

        // Verifica se houve erro de execução ou erro tratado pelo Python
        if (error || stdout.includes("Erro:")) {
            console.error('----- ERRO DO PYTHON -----');
            console.error(error || stdout);

            // Em caso de erro, removemos apenas a "metade" que tentou entrar
            await db.promise().query('DELETE FROM pedidos_rotativa WHERE lote = ?', [lote]);
            await db.promise().query('DELETE FROM pedidos_flexografica WHERE lote = ?', [lote]);

            return res.redirect('/producao?erro=planilha');
        }

        try {
            // MÁGICA AQUI: Arquiva (limpa do painel) todos os dados que estavam ativos antes desta importação
            await db.promise().query('UPDATE pedidos_rotativa SET ativo = 0 WHERE ativo = 1 AND lote != ?', [lote]);
            await db.promise().query('UPDATE pedidos_flexografica SET ativo = 0 WHERE ativo = 1 AND lote != ?', [lote]);

            // Redireciona com sucesso
            res.redirect('/producao?sucesso=1');
        } catch (dbErr) {
            console.error('[ERRO DB UPDATE ATIVO]', dbErr);
            res.redirect('/producao?erro=planilha');
        }
    });
});

//MUDAR STATUS DE PENDENTE PARA CONCLUÍDO NAS ORDENS
router.post('/status/:tipo/:id', isLogged, async (req, res) => {
    const { tipo, id } = req.params;
    const tabela = tipo === 'rotativa' ? 'pedidos_rotativa' : 'pedidos_flexografica';
    try {
        await db.promise().query(`UPDATE ${tabela} SET status_producao = CASE WHEN status_producao = 'pendente' THEN 'concluido' ELSE 'pendente' END WHERE id = ?`, [id]);
        const [rows] = await db.promise().query(`SELECT status_producao FROM ${tabela} WHERE id = ?`, [id]);
        res.json({ success: true, status: rows[0].status_producao });
    } catch (err) { res.status(500).json({ success: false }); }
});

//LIMPAR ORDENS DE PRODUÇÃO DO PAINEL
router.post('/limpar', async (req, res) => {
    try {
        // Em vez de TRUNCATE, marcamos como inativo
        await db.promise().query('UPDATE pedidos_rotativa SET ativo = 0 WHERE ativo = 1');
        await db.promise().query('UPDATE pedidos_flexografica SET ativo = 0 WHERE ativo = 1');

        res.redirect('/producao?limpo=1');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao limpar os dados');
    }
});

//EXPORTAR EXCEL DE ORDENS DA ROTATIVA
router.get('/exportar/rotativa', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const [dados] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, quantidade, previsao_faturamento, status_producao
            FROM pedidos_rotativa
            WHERE ativo = 1
            ORDER BY 
                modelo,
                CAST(REGEXP_REPLACE(tamanho, '[^0-9]', '') AS UNSIGNED),
                cliente
        `);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Rotativa');
        const hoje = new Date();
        const dataFormatada = hoje.toLocaleDateString('pt-BR');

        sheet.pageSetup = {
            orientation: 'landscape',
            scale: 95,
            fitToPage: false,
            margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
        };

        sheet.columns = [
            { header: 'MODELO', key: 'modelo', width: 25 },
            { header: 'TAMANHO', key: 'tamanho', width: 12 },
            { header: 'CLIENTE', key: 'cliente', width: 30 },
            { header: 'QUANTIDADE', key: 'quantidade', width: 15 },
            { header: 'VENDEDOR', key: 'vendedor', width: 25 },
            { header: 'DATA', key: 'previsao_faturamento', width: 15 },
            { header: 'OPERADOR', key: 'operador', width: 20 },
            { header: 'STATUS', key: 'status', width: 15 }
        ];

        sheet.insertRow(1, []);
        sheet.mergeCells(1, 1, 1, sheet.columns.length);

        const tituloCell = sheet.getCell('A1');
        tituloCell.value = `ROTATIVA/PLANA - ${dataFormatada}`;
        tituloCell.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 25;

        const headerRow = sheet.getRow(2);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        let modeloAtual = null;
        let tamanhoAtual = null;

        dados.forEach(d => {
            if (modeloAtual !== null && modeloAtual !== d.modelo) {
                sheet.addRow({});
                sheet.addRow({});
            }

            if (tamanhoAtual !== null && tamanhoAtual !== d.tamanho && modeloAtual === d.modelo) {
                sheet.addRow({});
            }

            sheet.addRow({
                modelo: modeloAtual === d.modelo ? '' : d.modelo,
                tamanho: tamanhoAtual === d.tamanho && modeloAtual === d.modelo ? '' : d.tamanho,
                cliente: d.cliente,
                quantidade: d.quantidade,
                vendedor: d.vendedor,
                previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                operador: '',
                status: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente'
            });

            modeloAtual = d.modelo;
            tamanhoAtual = d.tamanho;
        });

        sheet.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
        sheet.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
        sheet.getColumn('modelo').alignment = { horizontal: 'center' };
        sheet.getColumn('tamanho').alignment = { horizontal: 'center' };
        sheet.getColumn('quantidade').alignment = { horizontal: 'center' };

        sheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=rotativa_plana_${dataFormatada.replace(/\//g, '-')}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('[ERRO EXPORTAR ROTATIVA]', err);
        res.status(500).send('Erro ao gerar planilha');
    }
});

//EXPORTAR EXCEL DE ORDENS DA FLEXOGRAFICA
router.get('/exportar/flexografica', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const [dados] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, material,
                   qtd_cores, cor_personalizacao, quantidade,
                   status_pedido, previsao_faturamento, status_producao
            FROM pedidos_flexografica
            WHERE ativo = 1
            ORDER BY cliente
        `);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Flexografica');
        const hoje = new Date();
        const dataFormatada = hoje.toLocaleDateString('pt-BR');

        sheet.pageSetup = {
            orientation: 'landscape',
            scale: 70,
            fitToPage: false,
            margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
        };

        sheet.columns = [
            { header: 'CLIENTE', key: 'cliente', width: 30 },
            { header: 'VENDEDOR', key: 'vendedor', width: 15 },
            { header: 'MODELO', key: 'modelo', width: 20 },
            { header: 'TAMANHO', key: 'tamanho', width: 10 },
            { header: 'MATERIAL', key: 'material', width: 12 },
            { header: 'QTD CORES', key: 'qtd_cores', width: 12 },
            { header: 'COR PERSONALIZAÇÃO', key: 'cor_personalizacao', width: 35 },
            { header: 'QTD', key: 'quantidade', width: 10 },
            { header: 'STATUS PEDIDO', key: 'status_pedido', width: 25 },
            { header: 'PREV. FAT.', key: 'previsao_faturamento', width: 15 },
            { header: 'OPERADOR', key: 'operador', width: 20 },
            { header: 'STATUS PROD.', key: 'status_producao', width: 15 }
        ];

        sheet.insertRow(1, []);
        sheet.mergeCells(1, 1, 1, sheet.columns.length);
        const tituloCell = sheet.getCell('A1');
        tituloCell.value = `FLEXOGRÁFICA - ${dataFormatada}`;
        tituloCell.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 25;

        const headerRow = sheet.getRow(2);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        let clienteAnterior = null;

        dados.forEach(d => {
            if (clienteAnterior && d.cliente !== clienteAnterior) {
                sheet.addRow({});
            }

            sheet.addRow({
                ...d,
                previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                status_producao: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente',
                operador: ''
            });

            clienteAnterior = d.cliente;
        });

        sheet.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
        sheet.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
        sheet.getColumn('quantidade').alignment = { horizontal: 'center' };
        sheet.getColumn('qtd_cores').alignment = { horizontal: 'center' };

        sheet.eachRow((row) => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=flexografica_${dataFormatada.replace(/\//g, '-')}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('[ERRO EXPORTAR FLEXO]', err);
        res.status(500).send('Erro ao gerar planilha');
    }
});

// ROTA POST: INTEGRAR ORDENS DE PRODUÇÃO COM KANBAN (FLEXO E ROTATIVA)
router.post("/producao/integrar-kanban", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Não autorizado" });

    // Agora recebemos também o 'tipo' para saber de onde vêm as ordens
    const { ordens_ids, tipo } = req.body;
    const usuarioNome = req.session.user.nome;

    if (!ordens_ids || !Array.isArray(ordens_ids) || ordens_ids.length === 0) {
        return res.status(400).json({ success: false, message: "Nenhuma ordem selecionada." });
    }
    if (!tipo || !['flexo', 'rotativa'].includes(tipo)) {
        return res.status(400).json({ success: false, message: "Setor de produção inválido." });
    }

    try {
        // 1. Encontra o Espaço "Produção"
        const [[espaco]] = await db.promise().query("SELECT id FROM espacos_trabalho WHERE nome = 'Produção' LIMIT 1");
        if (!espaco) return res.status(404).json({ success: false, message: "Espaço de trabalho 'Produção' não encontrado." });

        // Define a coluna alvo com base no setor
        const nomeColuna = tipo === 'flexo' ? 'Pintura' : 'Corte';

        const [[coluna]] = await db.promise().query("SELECT id FROM kanban_colunas WHERE espaco_id = ? AND titulo = ? LIMIT 1", [espaco.id, nomeColuna]);
        if (!coluna) return res.status(404).json({ success: false, message: `Coluna '${nomeColuna}' não encontrada no espaço Produção.` });

        const colunaId = coluna.id;

        // 2. Define a tabela correta e busca as ordens selecionadas
        const tabela = tipo === 'flexo' ? 'pedidos_flexografica' : 'pedidos_rotativa';
        const [ordens] = await db.promise().query(`SELECT * FROM ${tabela} WHERE id IN (?)`, [ordens_ids]);

        if (ordens.length === 0) {
            return res.status(404).json({ success: false, message: "As ordens solicitadas não foram encontradas." });
        }

        // 3. Agrupamento por Cliente
        const ordensAgrupadas = {};
        for (const ordem of ordens) {
            const cliente = ordem.cliente || 'Cliente Indefinido';
            if (!ordensAgrupadas[cliente]) ordensAgrupadas[cliente] = [];
            ordensAgrupadas[cliente].push(ordem);
        }

        // 4. Cria os cards agrupados
        for (const cliente in ordensAgrupadas) {
            const pedidosDoCliente = ordensAgrupadas[cliente];
            const tituloCard = cliente;

            let descricaoCard = `<strong>Vendedor:</strong> ${pedidosDoCliente[0].vendedor || '-'}<br><br>`;
            descricaoCard += `<strong>--- PEDIDOS DESTE CLIENTE ---</strong><br><br>`;

            // Monta a descrição do card dinâmica por setor
            pedidosDoCliente.forEach((pedido, index) => {
                descricaoCard += `
                    <div style="margin-bottom: 10px; border-left: 2px solid #08c068; padding-left: 8px;">
                        <strong>Pedido #${index + 1}</strong><br>
                        <strong>Modelo:</strong> ${pedido.modelo || '-'}<br>
                        <strong>Tamanho:</strong> ${pedido.tamanho || '-'}<br>`;

                // Só adiciona Material e Cores se for da Flexográfica
                if (tipo === 'flexo') {
                    descricaoCard += `
                        <strong>Material:</strong> ${pedido.material || '-'}<br>
                        <strong>Qtd Cores:</strong> ${pedido.qtd_cores || '-'}<br>
                        <strong>Cor Personalização:</strong> ${pedido.cor_personalizacao || '-'}<br>`;
                }

                descricaoCard += `
                        <strong>Quantidade: <span style="color: #08c068;">${pedido.quantidade || '-'}</span></strong>
                    </div>
                `;
            });

            const [resultInsert] = await db.promise().query(
                "INSERT INTO kanban_cards (coluna_id, titulo, descricao, ordem) VALUES (?, ?, ?, 0)",
                [colunaId, tituloCard, descricaoCard]
            );

            const novoCardId = resultInsert.insertId;
            const nomeSetor = tipo === 'flexo' ? 'Flexografia' : 'Rotativa/Plana';

            await db.promise().query(
                "INSERT INTO kanban_historico (card_id, acao, usuario) VALUES (?, ?, ?)",
                [novoCardId, `Card gerado automaticamente agrupando ${pedidosDoCliente.length} pedido(s) da ${nomeSetor}`, usuarioNome]
            );
        }

        const totalCardsCriados = Object.keys(ordensAgrupadas).length;
        res.json({ success: true, message: `${totalCardsCriados} card(s) gerado(s) na coluna ${nomeColuna} com sucesso!` });

    } catch (error) {
        console.error("Erro na integração Kanban:", error);
        res.status(500).json({ success: false, message: "Erro interno ao integrar com o Kanban." });
    }
});

module.exports = router;