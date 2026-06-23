const express = require("express");
const router = express.Router();
const db = require("../db");
const axios = require("axios");
const pdfkit = require("pdfkit"); // Para gerar o PDF com o QR Code
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

// A MÁGICA AQUI: Importando as funções do Google Maps do nosso Service
const { 
    obterLocalizacao, 
    otimizarRotaGoogleAPI, 
    obterCidadeDasCoordenadas 
} = require("../services/mapsService");

//------------------------------------------------------------------------------ROTAS PARA CADERNOS------------------------------------------------------------------------------
//LISTAR CADERNOS
router.get("/caderno-entregas", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = 10;
        const offset = (page - 1) * limit;
        const { data_inicio, data_fim } = req.query;

        let where = [];
        let params = [];

        if (data_inicio) { where.push("DATE(data_criacao) >= ?"); params.push(data_inicio); }
        if (data_fim) { where.push("DATE(data_criacao) <= ?"); params.push(data_fim); }

        const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
        const countQuery = `SELECT COUNT(*) AS total FROM caderno_entregas ${whereSql}`;
        const [countResult] = await db.promise().query(countQuery, params);

        const total = countResult[0].total;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        const queryParams = [...params, limit, offset];
        const [cadernos] = await db.promise().query(`
            SELECT c.*, v.modelo as veiculo_modelo 
            FROM caderno_entregas c
            LEFT JOIN veiculos v ON c.veiculo_id = v.id
            ${whereSql}
            ORDER BY c.data_criacao DESC LIMIT ? OFFSET ?
        `, queryParams);

        for (let c of cadernos) {
            // MUDANÇA: Faz um JOIN para buscar também as coordenadas salvas na tabela de histórico
            const [itens] = await db.promise().query(`
                SELECT i.*, ch.coordenadas 
                FROM caderno_entregas_itens i
                LEFT JOIN clientes_historico ch ON i.local_entrega = ch.nome
                WHERE i.caderno_id = ?
                ORDER BY i.id ASC
            `, [c.id]);
            c.entregas = itens;
        }

        const [veiculos] = await db.promise().query("SELECT id, modelo FROM veiculos ORDER BY modelo ASC");

        // NOVO: Busca o histórico fixo de clientes imune à exclusão (com a Cidade para a tag azul)
        const [clientesDB] = await db.promise().query("SELECT nome, link_endereco, coordenadas, cidade FROM clientes_historico ORDER BY nome ASC");

        // NOVO: Busca o catálogo de itens do pedido (as dezenas de caixas que inserimos via script SQL)
        const [itensCatalogo] = await db.promise().query("SELECT nome FROM itens_catalogo ORDER BY nome ASC");

        // NOVO: Busca os colaboradores (Motoristas, Ajudantes, etc.) para o Autocomplete com foto
        const [colaboradores] = await db.promise().query("SELECT id, nome, tipo_usuario, foto FROM usuarios WHERE tipo_usuario IN ('motorista', 'motorista_avulso', 'ajudante', 'diarista', 'logistica') ORDER BY nome ASC");

        res.send(require('../views/cadernoEntregasView')(
            req.session.user,
            cadernos,
            veiculos,
            clientesDB,
            { page, totalPages, total },
            { data_inicio, data_fim },
            itensCatalogo,
            colaboradores // <--- Parâmetro dos colaboradores injetado aqui!
        ));
    } catch (error) {
        console.error("Erro no Caderno de Entregas:", error);
        res.status(500).send("Erro interno ao carregar cadernos.");
    }
});

//CADASTRAR CADERNO
router.post("/caderno-entregas/novo", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const { motorista, ajudante, veiculo_id, local, link, itens_pedido, quantidade, valor_aberto } = req.body;

    try {
        const [result] = await db.promise().query(
            "INSERT INTO caderno_entregas (motorista, ajudante, veiculo_id, status) VALUES (?, ?, ?, 'Pendente')",
            [motorista, ajudante || null, veiculo_id || null]
        );
        const cadernoId = result.insertId;

        if (local) {
            // O QUE MUDA NAS ROTAS POST /novo e POST /editar/:id
            const locais = Array.isArray(local) ? local : [local];
            const links = Array.isArray(link) ? link : [link];
            const itens = Array.isArray(itens_pedido) ? itens_pedido : [itens_pedido];
            const quantidades = Array.isArray(quantidade) ? quantidade : [quantidade];
            const valores = Array.isArray(valor_aberto) ? valor_aberto : [valor_aberto];
            // NOVO: Puxa o array de coordenadas preenchido dinamicamente na tela
            const coordsForm = Array.isArray(req.body.coordenadas_rota) ? req.body.coordenadas_rota : [req.body.coordenadas_rota];

            let entregasParaProcessar = [];
            for (let i = 0; i < locais.length; i++) {
                const nomeCli = locais[i].trim();
                const linkCli = links[i] || null;
                let coordCli = (coordsForm[i] && coordsForm[i].trim() !== '') ? coordsForm[i].trim() : null;

                if (nomeCli !== '') {
                    // Se não preencheu coordenada na tela, mas tem link, o servidor caça a coordenada sozinho
                    if (!coordCli && linkCli) {
                        const localizacaoResolvida = await obterLocalizacao(nomeCli, linkCli);
                        if (localizacaoResolvida && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(localizacaoResolvida.trim())) {
                            coordCli = localizacaoResolvida.trim();
                        }
                    }

                    // Se encontrou a coordenada, descobre a CIDADE na hora
                    let cidadeCli = null;
                    if (coordCli) {
                        cidadeCli = await obterCidadeDasCoordenadas(coordCli);
                    }

                    // Salva no banco de dados o Cliente + Link + Coordenadas + Cidade Automática
                    await db.promise().query(`
                        INSERT INTO clientes_historico (nome, link_endereco, coordenadas, cidade) VALUES (?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE 
                            link_endereco = COALESCE(?, link_endereco),
                            coordenadas = COALESCE(?, coordenadas),
                            cidade = COALESCE(?, cidade)
                    `, [nomeCli, linkCli, coordCli, cidadeCli, linkCli, coordCli, cidadeCli]);

                    entregasParaProcessar.push({
                        nome: nomeCli,
                        link: linkCli,
                        itens: itens[i] || null,
                        qtd: quantidades[i] && quantidades[i].trim() !== '' ? parseInt(quantidades[i], 10) : null,
                        valor: valores[i] && valores[i].trim() !== '' ? parseFloat(valores[i]) : null,
                        queryLocation: coordCli || await obterLocalizacao(nomeCli, linkCli)
                    });
                }
            }

            // A MÁGICA ACONTECE AQUI: A API do Google devolve o array ordenado com trânsito real
            const rotaFinal = await otimizarRotaGoogleAPI(entregasParaProcessar);

            for (let item of rotaFinal) {
                await db.promise().query(
                    "INSERT INTO caderno_entregas_itens (caderno_id, local_entrega, link_endereco, itens_pedido, quantidade, valor_aberto) VALUES (?, ?, ?, ?, ?, ?)",
                    [cadernoId, item.nome, item.link, item.itens, item.qtd, item.valor]
                );
            }
        }

        // CORREÇÃO AQUI: Passando o ID do caderno criado pela URL para o frontend detectar
        return res.redirect("/caderno-entregas?cadernoCriado=" + cadernoId);

    } catch (error) {
        console.error("Erro ao salvar caderno:", error);
        res.status(500).send("Erro ao salvar.");
    }
});

//EDITAR CADERNO
router.post("/caderno-entregas/editar/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const cadernoId = req.params.id;
    const { motorista, ajudante, veiculo_id } = req.body;

    console.log(`\n\n======================================================`);
    console.log(`[DEBUG] INICIANDO EDIÇÃO DO CADERNO #${cadernoId}`);
    console.log(`[DEBUG] BODY RECEBIDO DO FORMULÁRIO:`);
    console.log(JSON.stringify(req.body, null, 2));
    console.log(`======================================================\n`);

    // Força a padronização para Array para evitar problemas de sincronia de 1 único item vs múltiplos itens
    const forceArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);

    const ids = forceArray(req.body['id[]'] || req.body.id);
    const locais = forceArray(req.body['local[]'] || req.body.local);
    const links = forceArray(req.body['link[]'] || req.body.link);
    const itensPedido = forceArray(req.body['itens_pedido[]'] || req.body.itens_pedido);
    const quantidades = forceArray(req.body['quantidade[]'] || req.body.quantidade);
    const valoresAbertos = forceArray(req.body['valor_aberto[]'] || req.body.valor_aberto);
    // Recupera as coordenadas preenchidas no front-end durante a edição
    const coordsForm = forceArray(req.body['coordenadas_rota[]'] || req.body.coordenadas_rota);

    console.log(`[DEBUG] Arrays processados:`);
    console.log(`- Qtd Locais: ${locais.length}`);
    console.log(`- Qtd IDs: ${ids.length}`);
    console.log(`- Locais Extraídos:`, locais);

    try {
        // 1. Atualiza caderno principal
        await db.promise().query("UPDATE caderno_entregas SET motorista = ?, ajudante = ?, veiculo_id = ? WHERE id = ?", [motorista, ajudante || null, veiculo_id || null, cadernoId]);
        console.log(`[DEBUG] 1. Caderno principal atualizado com sucesso.`);

        if (locais.length === 0) {
            console.log(`[DEBUG] Nenhum local recebido no formulário. Apagando todos os itens da rota...`);
            await db.promise().query("DELETE FROM caderno_entregas_itens WHERE caderno_id = ?", [cadernoId]);
            return res.redirect("/caderno-entregas");
        }

        // 2. Busca status atuais para manter (Ex: Pendente, Em Rota, etc.)
        const [itensAntigos] = await db.promise().query("SELECT id, status FROM caderno_entregas_itens WHERE caderno_id = ?", [cadernoId]);
        const statusMap = {};
        itensAntigos.forEach(item => {
            statusMap[item.id] = item.status || 'Pendente';
        });
        console.log(`[DEBUG] 2. Mapa de Status dos itens antigos carregado:`, statusMap);

        // 3. Monta o array para otimização e resolve coordenadas pendentes
        let entregasParaProcessar = [];

        for (let i = 0; i < locais.length; i++) {
            const nomeCli = locais[i].trim();
            const linkCli = links[i] || null;
            let coordCli = (coordsForm[i] && coordsForm[i].trim() !== '') ? coordsForm[i].trim() : null;
            const entregaId = ids[i];

            // Mantém o status original ou define como Pendente se for um local recém-adicionado
            let currentStatus = (entregaId && statusMap[entregaId]) ? statusMap[entregaId] : 'Pendente';

            if (nomeCli !== '') {
                console.log(`[DEBUG] 3. Processando Cliente [${i}]: ${nomeCli} | Status herdado: ${currentStatus}`);

                // Inteligência: Se não tem coordenada mas tem link, tenta decodificar agora
                if (!coordCli && linkCli) {
                    const localizacaoResolvida = await obterLocalizacao(nomeCli, linkCli);
                    if (localizacaoResolvida && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(localizacaoResolvida.trim())) {
                        coordCli = localizacaoResolvida.trim();
                        console.log(`   -> [INFO] Coordenada extraída do Link para ${nomeCli}: ${coordCli}`);
                    }
                }

                // Se conseguiu a coordenada, descobre a cidade
                let cidadeCli = null;
                if (coordCli) {
                    cidadeCli = await obterCidadeDasCoordenadas(coordCli);
                }

                // Atualiza o histórico de clientes com os dados mais recentes
                await db.promise().query(`
                    INSERT INTO clientes_historico (nome, link_endereco, coordenadas, cidade) VALUES (?, ?, ?, ?) 
                    ON DUPLICATE KEY UPDATE 
                        link_endereco = COALESCE(?, link_endereco),
                        coordenadas = COALESCE(?, coordenadas),
                        cidade = COALESCE(?, cidade)
                `, [nomeCli, linkCli, coordCli, cidadeCli, linkCli, coordCli, cidadeCli]);

                // Estrutura exigida pelo 'otimizarRotaGoogleAPI'
                entregasParaProcessar.push({
                    nome: nomeCli,
                    link: linkCli,
                    itens: itensPedido[i] || null,
                    qtd: quantidades[i] && quantidades[i].trim() !== '' ? parseInt(quantidades[i], 10) : null,
                    valor: valoresAbertos[i] && valoresAbertos[i].trim() !== '' ? parseFloat(valoresAbertos[i]) : null,
                    queryLocation: coordCli || await obterLocalizacao(nomeCli, linkCli),
                    status: currentStatus
                });
            } else {
                console.log(`   -> [AVISO] Nome do cliente na posição [${i}] estava em branco. Ignorado.`);
            }
        }

        console.log(`[DEBUG] 4. Array 'entregasParaProcessar' finalizado com ${entregasParaProcessar.length} itens. Enviando para Google Routes API...`);

        // 4. CHAMA O ALGORITMO GOOGLE ROUTES PARA RECALCULAR A ROTA
        const rotaFinal = await otimizarRotaGoogleAPI(entregasParaProcessar);

        console.log(`[DEBUG] 5. Google Routes devolveu um array com ${rotaFinal.length} itens reordenados.`);

        // 5. Deleta antigos e insere os novos na ordem perfeitamente otimizada
        await db.promise().query("DELETE FROM caderno_entregas_itens WHERE caderno_id = ?", [cadernoId]);
        console.log(`[DEBUG] 6. Itens desatualizados do BD foram deletados.`);

        let insertedCount = 0;
        for (let item of rotaFinal) {
            await db.promise().query(
                "INSERT INTO caderno_entregas_itens (caderno_id, local_entrega, link_endereco, itens_pedido, quantidade, valor_aberto, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [cadernoId, item.nome, item.link, item.itens, item.qtd, item.valor, item.status]
            );
            insertedCount++;
        }

        console.log(`[DEBUG] 7. Concluído! ${insertedCount} novos itens inseridos na ordem correta.`);
        console.log(`======================================================\n`);

        res.redirect("/caderno-entregas");

    } catch (error) {
        console.error("\n[ERRO FATAL AO EDITAR CADERNO E OTIMIZAR]:", error);
        res.status(500).send("Erro interno ao tentar editar e re-otimizar o caderno.");
    }
});

//EXCLUIR CADERNO
router.post("/caderno-entregas/excluir/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { id } = req.params;

    try {
        await db.promise().query("DELETE FROM caderno_entregas WHERE id = ?", [id]);

        res.redirect("/caderno-entregas");
    } catch (error) {
        console.error("[ERRO AO EXCLUIR CADERNO]:", error);
        res.status(500).send("Erro interno ao tentar excluir o caderno de entregas.");
    }
});

//CADASTRAR CLIENTE PELO CADERNO
router.post("/caderno-entregas/clientes/novo", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    let { nome, link_endereco, coordenadas } = req.body;

    try {
        if (nome && nome.trim() !== '') {
            // SE A COORDENADA VEIO VAZIA, MAS TEM LINK: O servidor decodifica o link curto agora mesmo!
            if ((!coordenadas || coordenadas.trim() === '') && link_endereco && link_endereco.trim() !== '') {
                const localizacaoResolvida = await obterLocalizacao(nome, link_endereco);

                // Valida se o que foi retornado segue o padrão de coordenadas numéricas (lat,lng)
                if (localizacaoResolvida && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(localizacaoResolvida.trim())) {
                    coordenadas = localizacaoResolvida.trim();
                }
            }

            await db.promise().query(`
                INSERT INTO clientes_historico (nome, link_endereco, coordenadas) VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                    link_endereco = COALESCE(?, link_endereco), 
                    coordenadas = COALESCE(?, coordenadas)
            `, [
                nome.trim(),
                link_endereco || null,
                coordenadas || null,
                link_endereco || null,
                coordenadas || null
            ]);
        }

        // CORREÇÃO: Enviando o parâmetro na URL para ativar o Toast na View
        res.redirect("/caderno-entregas?sucessoCliente=1");

    } catch (error) {
        console.error("[ERRO AO CADASTRAR CLIENTE]:", error);
        res.status(500).send("Erro interno ao tentar salvar o cliente.");
    }
});

//EDITAR CLIENTE DO CADERNO
router.post("/caderno-entregas/clientes/editar", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    let { nomeOriginal, nomeNovo, link_endereco, coordenadas } = req.body;

    try {
        if (nomeOriginal && nomeNovo) {
            // SE NA EDIÇÃO A COORDENADA FICOU VAZIA, MAS FOI PASSADO UM LINK: Decodifica também!
            if ((!coordenadas || coordenadas.trim() === '') && link_endereco && link_endereco.trim() !== '') {
                const localizacaoResolvida = await obterLocalizacao(nomeNovo, link_endereco);

                if (localizacaoResolvida && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(localizacaoResolvida.trim())) {
                    coordenadas = localizacaoResolvida.trim();
                }
            }

            await db.promise().query(`
                UPDATE clientes_historico 
                SET nome = ?, link_endereco = ?, coordenadas = ? 
                WHERE nome = ?
            `, [nomeNovo.trim(), link_endereco || null, coordenadas || null, nomeOriginal.trim()]);

            await db.promise().query(`
                UPDATE caderno_entregas_itens 
                SET local_entrega = ? 
                WHERE local_entrega = ?
            `, [nomeNovo.trim(), nomeOriginal.trim()]);
        }

        // REDIRECIONAMENTO ATUALIZADO: Ativa o Toast de Sucesso na View
        res.redirect("/caderno-entregas?sucessoCliente=1");

    } catch (error) {
        console.error("[ERRO AO EDITAR CLIENTE]:", error);
        res.status(500).send("Erro interno ao tentar atualizar o cliente.");
    }
});

//EXCLUIR CLIENTE CADERNO
router.post("/caderno-entregas/clientes/excluir", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const { nome } = req.body;

    try {
        if (nome) {
            await db.promise().query("DELETE FROM clientes_historico WHERE nome = ?", [nome.trim()]);
        }

        // REDIRECIONAMENTO ATUALIZADO: Ativa o Toast de Sucesso na View
        res.redirect("/caderno-entregas?sucessoCliente=1");

    } catch (error) {
        console.error("[ERRO AO EXCLUIR CLIENTE]:", error);
        res.status(500).send("Erro interno ao tentar excluir o cliente.");
    }
});

//RELATÓRIO COMPLETO DOS CLIENTES DO CADERNO
router.get('/caderno-entregas/clientes/exportar-excel', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const [clientes] = await db.promise().query(`
            SELECT nome, link_endereco, coordenadas, cidade
            FROM clientes_historico 
            ORDER BY nome ASC
        `);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Clientes');

        sheet.columns = [
            { header: 'NOME / PIZZARIA', key: 'nome', width: 40 },
            { header: 'CIDADE', key: 'cidade', width: 20 },
            { header: 'LINK DO MAPS', key: 'link_endereco', width: 50 },
            { header: 'COORDENADAS', key: 'coordenadas', width: 25 }
        ];

        sheet.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        clientes.forEach(c => {
            sheet.addRow({
                nome: c.nome,
                cidade: c.cidade || '-',
                link_endereco: c.link_endereco,
                coordenadas: c.coordenadas
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio_clientes.xlsx');

        // Escreve diretamente no stream de resposta
        await workbook.xlsx.write(res);
        return res.end();

    } catch (error) {
        console.error("[ERRO AO EXPORTAR CLIENTES]:", error);
        res.status(500).send("Erro ao gerar o relatório.");
    }
});

//RELATÓRIO EXCEL COMPLETO DOS CADERNOS
router.get('/exportar/caderno-entregas', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const { data_inicio, data_fim } = req.query;
        let where = [];
        let params = [];

        if (data_inicio) { where.push("DATE(c.data_criacao) >= ?"); params.push(data_inicio); }
        if (data_fim) { where.push("DATE(c.data_criacao) <= ?"); params.push(data_fim); }
        const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

        const [dados] = await db.promise().query(`
            SELECT c.id, c.data_criacao, c.motorista, c.ajudante, v.modelo AS veiculo,
                   i.local_entrega, i.link_endereco, i.status AS item_status
            FROM caderno_entregas c
            LEFT JOIN veiculos v ON c.veiculo_id = v.id
            LEFT JOIN caderno_entregas_itens i ON i.caderno_id = c.id
            ${whereSql}
            ORDER BY c.data_criacao ASC, c.id ASC
        `, params);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Caderno de Entregas');

        sheet.columns = [
            { header: 'ID CADERNO', key: 'id', width: 12 },
            { header: 'DATA/HORA CRIAÇÃO', key: 'data_criacao', width: 22 },
            { header: 'MOTORISTA', key: 'motorista', width: 25 },
            { header: 'AJUDANTE', key: 'ajudante', width: 25 },
            { header: 'VEÍCULO', key: 'veiculo', width: 20 },
            { header: 'LOCAL / PIZZARIA', key: 'local_entrega', width: 30 },
            { header: 'STATUS ENTREGA', key: 'item_status', width: 18 },
            { header: 'LINK ENDEREÇO (MAPS)', key: 'link_endereco', width: 45 }
        ];

        sheet.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        dados.forEach(m => {
            sheet.addRow({
                id: m.id,
                data_criacao: new Date(m.data_criacao).toLocaleString('pt-BR'),
                motorista: m.motorista,
                ajudante: m.ajudante || '-',
                veiculo: m.veiculo || '-',
                local_entrega: m.local_entrega || 'Nenhum local atribuído',
                item_status: m.item_status || '-',
                link_endereco: m.link_endereco || '-'
            });
        });

        sheet.eachRow(row => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Caderno_Entregas_${dataHoje}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('[ERRO EXPORTAR CADERNOS]', err);
        res.status(500).send('Erro ao gerar relatório');
    }
});

// =======================================================
// 3. EXPORTAR RELATÓRIO EXCEL COMPLETO DOS CADERNOS
// =======================================================
router.get('/exportar/caderno-entregas', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const { data_inicio, data_fim } = req.query;
        let where = [];
        let params = [];

        if (data_inicio) { where.push("DATE(c.data_criacao) >= ?"); params.push(data_inicio); }
        if (data_fim) { where.push("DATE(c.data_criacao) <= ?"); params.push(data_fim); }
        const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

        const [dados] = await db.promise().query(`
            SELECT c.id, c.data_criacao, c.motorista, c.ajudante, v.modelo AS veiculo,
                   i.local_entrega, i.link_endereco, i.status AS item_status,
                   i.itens_pedido, i.quantidade, i.valor_aberto
            FROM caderno_entregas c
            LEFT JOIN veiculos v ON c.veiculo_id = v.id
            LEFT JOIN caderno_entregas_itens i ON i.caderno_id = c.id
            ${whereSql}
            ORDER BY c.data_criacao ASC, c.id ASC
        `, params);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Caderno de Entregas');

        // Adicionadas as novas colunas
        sheet.columns = [
            { header: 'ID CADERNO', key: 'id', width: 12 },
            { header: 'DATA/HORA CRIAÇÃO', key: 'data_criacao', width: 22 },
            { header: 'MOTORISTA', key: 'motorista', width: 25 },
            { header: 'AJUDANTE', key: 'ajudante', width: 25 },
            { header: 'VEÍCULO', key: 'veiculo', width: 20 },
            { header: 'LOCAL / PIZZARIA', key: 'local_entrega', width: 30 },
            { header: 'ITENS DO PEDIDO', key: 'itens_pedido', width: 35 },
            { header: 'QTD', key: 'quantidade', width: 10 },
            { header: 'VALOR EM ABERTO', key: 'valor_aberto', width: 20 },
            { header: 'STATUS ENTREGA', key: 'item_status', width: 18 },
            { header: 'LINK ENDEREÇO (MAPS)', key: 'link_endereco', width: 45 }
        ];

        sheet.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        dados.forEach(m => {
            sheet.addRow({
                id: m.id,
                data_criacao: new Date(m.data_criacao).toLocaleString('pt-BR'),
                motorista: m.motorista,
                ajudante: m.ajudante || '-',
                veiculo: m.veiculo || '-',
                local_entrega: m.local_entrega || 'Nenhum local atribuído',
                itens_pedido: m.itens_pedido || '-',
                quantidade: m.quantidade || '-',
                valor_aberto: m.valor_aberto ? parseFloat(m.valor_aberto) : '',
                item_status: m.item_status || '-',
                link_endereco: m.link_endereco || '-'
            });
        });

        // Aplica a formatação de Moeda na coluna de Valor
        sheet.getColumn('valor_aberto').numFmt = '"R$ " #,##0.00';

        sheet.eachRow(row => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Caderno_Entregas_${dataHoje}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('[ERRO EXPORTAR CADERNOS]', err);
        res.status(500).send('Erro ao gerar relatório');
    }
});

//EXPORTAR CADERNO ENTREGAS PARA MOTORISTAS
router.get("/caderno-entregas/pdf/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { id } = req.params;

    try {
        // 1. Busca os dados principais do caderno (capa)
        const [cadernoRows] = await db.promise().query(`
            SELECT c.*, v.modelo as veiculo_modelo 
            FROM caderno_entregas c
            LEFT JOIN veiculos v ON c.veiculo_id = v.id
            WHERE c.id = ?
        `, [id]);

        if (cadernoRows.length === 0) {
            return res.status(404).send("Caderno não encontrado.");
        }

        const caderno = cadernoRows[0];

        // 2. Busca todos os locais de entrega associados ao caderno + coordenadas e cidade salvas no histórico
        const [itens] = await db.promise().query(`
            SELECT i.*, ch.coordenadas, ch.cidade 
            FROM caderno_entregas_itens i
            LEFT JOIN clientes_historico ch ON i.local_entrega = ch.nome
            WHERE i.caderno_id = ? 
            ORDER BY i.id ASC
        `, [id]);

        const PDFDocument = require('pdfkit');
        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');

        // =======================================================
        // CONSTRÓI A URL DA ROTA INTELIGENTE COMPLETA (TODAS AS PARADAS)
        // =======================================================
        let linkRotaCompleta = "#";
        if (itens.length > 0) {
            const paradasUrl = itens.map(e => {
                if (e.coordenadas && e.coordenadas.trim() !== '') {
                    return encodeURIComponent(e.coordenadas.trim().replace(/\s/g, ''));
                }
                return encodeURIComponent(e.local_entrega + ", Camaçari, BA");
            }).join('/');

            // Truque de concatenação
            const baseDirUrl = "https://www" + ".google.com/maps/dir//";
            linkRotaCompleta = baseDirUrl + paradasUrl;
        }

        // =======================================================
        // FUNÇÕES AUXILIARES PARA ORGANIZAR ITENS POR TAMANHO
        // =======================================================
        function extrairTamanhoDoItem(texto = '') {
            const item = String(texto).toUpperCase();
            const match = item.match(/\b(N\d{1,3}|PP\d*|P\d*|M\d*|G\d*|GG|C\d+|A\d+|L\d+|\d+\s*CM|\d+\s*MM|\d+)\b/);
            return match ? match[0].replace(/\s+/g, '') : '';
        }

        // Fórmula de ordenação sequencial de caixas (PP -> GG)
        function pesoTamanho(tamanho = '') {
            const t = String(tamanho).toUpperCase().replace(/\s+/g, '');
            const ordemLetras = {
                'MINI': 1, 'PP': 2, 'PP1': 3, 'PP2': 4, 'PP3': 5,
                'P': 10, 'M': 20, 'G': 30, 'GG': 40
            };

            if (ordemLetras[t]) return ordemLetras[t];

            const numero = t.match(/\d+/);
            if (numero) return parseInt(numero[0], 10);

            return 9999;
        }

        function organizarItensPorTamanho(itensPedido = '') {
            if (!itensPedido || String(itensPedido).trim() === '') {
                return ['-'];
            }

            let texto = String(itensPedido)
                .replace(/\r/g, '')
                .replace(/\n+/g, ';')
                .replace(/\s+\+\s+/g, ';')
                .replace(/\s+\/\s+/g, ';')
                .replace(/\s*\|\s*/g, ';');

            texto = texto.replace(/,\s*(?=(CX|CAIXA|PIZZA|N\d{1,3}|PP|P\b|M\b|G\b|GG\b|RETANGULAR|QUADRADA|SMART|OITAVADA))/gi, ';');

            const lista = texto
                .split(';')
                .map(item => item.trim())
                .filter(Boolean);

            return lista.sort((a, b) => {
                const tamanhoA = extrairTamanhoDoItem(a);
                const tamanhoB = extrairTamanhoDoItem(b);

                const pesoA = pesoTamanho(tamanhoA);
                const pesoB = pesoTamanho(tamanhoB);

                if (pesoA !== pesoB) return pesoA - pesoB;
                return a.localeCompare(b, 'pt-BR');
            });
        }

        // =======================================================
        // FUNÇÃO AUXILIAR PARA CAMPO DE RECEBIMENTO
        // =======================================================
        function desenharCamposRecebimento(doc, x, y) {
            doc.font('Helvetica-Bold')
                .fontSize(6.8)
                .fillColor('#333333');

            doc.text('Dinheiro [   ]', x + 42, y, { lineBreak: false });
            doc.text('Pix [   ]', x + 100, y, { lineBreak: false });
            doc.text('Cartão [   ]', x + 138, y, { lineBreak: false });
        }

        // Inicializa o documento em tamanho A4 com margens
        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        // Gera o nome do ficheiro dinâmico com a data
        const dataGerado = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        // Configura os cabeçalhos para o browser abrir o PDF diretamente
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=caderno(${dataGerado}).pdf`);
        doc.pipe(res);

        // --- DESIGN DO MANIFESTO (Estilo Ecoflow) ---
        doc.rect(0, 0, 600, 15).fill('#0D5749');

        // Inserção da Logo da Ecocaixas
        const logoPath = path.join(process.cwd(), 'public', 'img', 'logo-ecocaixas.png');
        let titleX = 40;

        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 25, { width: 110 });
            titleX = 170;
        }

        // Título Principal
        doc.fillColor('#222222')
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('MANIFESTO DE CARGA E ROTAS', titleX, 35);

        // Dados da Equipe (Em bloco compacto abaixo do título)
        doc.font('Helvetica-Bold')
            .fontSize(9.5)
            .fillColor('#333333');

        let infoY = 58;
        const colLabelX = titleX;
        const colValueX = titleX + 65;

        // Motorista
        doc.text('Motorista:', colLabelX, infoY);
        doc.font('Helvetica').fillColor('#555555').text((caderno.motorista || '').toUpperCase(), colValueX, infoY);
        infoY += 14;

        // Ajudante
        doc.font('Helvetica-Bold').fillColor('#333333').text('Ajudante:', colLabelX, infoY);
        doc.font('Helvetica').fillColor('#555555').text((caderno.ajudante || 'SEM AJUDANTE').toUpperCase(), colValueX, infoY);
        infoY += 14;

        // Veículo
        doc.font('Helvetica-Bold').fillColor('#333333').text('Veículo:', colLabelX, infoY);
        doc.font('Helvetica').fillColor('#555555').text((caderno.veiculo_modelo || 'NÃO INFORMADO').toUpperCase(), colValueX, infoY);
        infoY += 16;

        // Data de Geração
        doc.font('Helvetica-Oblique').fontSize(8).fillColor('#888888').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, colLabelX, infoY);

        // =======================================================
        // QR CODE DA ROTA COMPLETA BEM MAIOR (110x110)
        // =======================================================
        if (linkRotaCompleta !== "#") {
            try {
                // Solicita o tamanho 250x250 da API externa para garantir densidade e nitidez máxima no papel
                const qrUrlGeral = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(linkRotaCompleta)}`;
                const responseGeral = await axios.get(qrUrlGeral, { responseType: 'arraybuffer' });
                const qrBufferGeral = Buffer.from(responseGeral.data, 'binary');

                // Desenha o QR Code mestre ampliado no canto superior direito
                doc.image(qrBufferGeral, 445, 25, { width: 110, height: 110 });
                doc.font('Helvetica-Bold')
                    .fontSize(7.5)
                    .fillColor('#0D5749')
                    .text('ROTA COMPLETA NO MAPS (GPS)', 435, 140, { width: 130, align: 'center' });
            } catch (errQrGeral) {
                console.error("[Erro] Falha ao injetar QR Code Geral no PDF:", errQrGeral.message);
            }
        }

        // =======================================================
        // CAIXA DE ALERTA VERMELHO DE ARRUMAÇÃO DE CARGA
        // =======================================================
        doc.rect(40, 155, 515, 30).fill('#FFF5F5');
        doc.lineWidth(1).strokeColor('#F5B7B7').rect(40, 155, 515, 30).stroke();

        doc.fillColor('#D32F2F')
            .font('Helvetica-Bold')
            .fontSize(9.5)
            .text('ORDEM DE CARREGAMENTO: CARREGUE O VEÍCULO DO ÚLTIMO PARA O PRIMEIRO ITEM', 45, 165, { align: 'center', width: 505 });

        // Linha divisória pós-alerta antes de iniciar a listagem das paradas
        doc.moveTo(40, 200).lineTo(555, 200).stroke('#dddddd');

        doc.fillColor('#0D5749')
            .font('Helvetica-Bold')
            .fontSize(13)
            .text('RELAÇÃO ORDENADA DE ENTREGAS', 40, 212);

        // Posição Y inicial de renderização das caixas ajustada de forma limpa
        let yPosition = 237;

        // Loop para desenhar as caixas de cada entrega com os novos dados e QR Code individual
        for (let i = 0; i < itens.length; i++) {
            const item = itens[i];
            const itensOrganizados = organizarItensPorTamanho(item.itens_pedido);

            const alturaLinhaItem = 11;
            const alturaItens = Math.max(14, itensOrganizados.length * alturaLinhaItem);

            const qtdY = yPosition + 43 + alturaItens;
            const idY = qtdY + 30;

            const boxHeight = Math.max(108, idY - yPosition + 22);

            // Proteção de Quebra de Página Inteligente
            if (yPosition + boxHeight > doc.page.height - 45) {
                doc.addPage();
                doc.rect(0, 0, 600, 12).fill('#0D5749');
                yPosition = 40;
            }

            // Recalcula posições após possível quebra de página
            const itensStartY = yPosition + 35;
            const qtdStartY = yPosition + 43 + alturaItens;
            const idStartY = qtdStartY + 30;

            // Caixa delimitadora da entrega
            doc.rect(40, yPosition, 515, boxHeight).stroke('#e5e5e5');

            // Formatação do Nome do Cliente e da Cidade
            const cidadeFormatada = item.cidade && item.cidade.trim() !== '' ? ` (${item.cidade.trim().toUpperCase()})` : '';
            const nomeClienteFinal = `${(item.local_entrega || '').toUpperCase()}${cidadeFormatada}`;

            // Nome do Cliente / Localização
            doc.fillColor('#111111')
                .font('Helvetica-Bold')
                .fontSize(11)
                .text(`[   ]  ${i + 1}. ${nomeClienteFinal}`, 55, yPosition + 15, {
                    width: 390,
                    lineBreak: false
                });

            // Listagem de Itens
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor('#444444')
                .text('Itens:', 55, itensStartY);

            doc.font('Helvetica')
                .fontSize(8.7)
                .fillColor('#333333');

            itensOrganizados.forEach((linha, index) => {
                doc.text(`• ${linha}`, 90, itensStartY + (index * alturaLinhaItem), {
                    width: 330,
                    lineBreak: false
                });
            });

            // Quantidades Totais
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor('#444444')
                .text('Qtd Total:', 55, qtdStartY);

            doc.font('Helvetica')
                .fillColor('#333333')
                .text((item.quantidade || '-'), 110, qtdStartY);

            // Valores Financeiros em Aberto
            if (item.valor_aberto && parseFloat(item.valor_aberto) > 0) {
                const valorFormatado = parseFloat(item.valor_aberto).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });

                doc.font('Helvetica-Bold')
                    .fontSize(9)
                    .fillColor('#444444')
                    .text('A Receber:', 145, qtdStartY);

                doc.font('Helvetica-Bold')
                    .fontSize(9)
                    .fillColor('#0D5749')
                    .text(`R$ ${valorFormatado}`, 202, qtdStartY);

                desenharCamposRecebimento(doc, 270, qtdStartY + 1);
            }

            // Metadados de ID e Rastreio
            doc.font('Helvetica')
                .fontSize(8)
                .fillColor('#999999')
                .text(`ID Registo: #${item.id}  |  Manifesto Base: #${id}`, 55, idStartY);

            // QR Code Individual da Parada (Usa Coordenadas se existirem, senão link)
            const searchBaseUrl = "https://www" + ".google.com/maps/search/?api=1&query=";
            const targetLink = (item.coordenadas && item.coordenadas.trim() !== '')
                ? searchBaseUrl + encodeURIComponent(item.coordenadas.trim().replace(/\s/g, ''))
                : item.link_endereco;

            if (targetLink) {
                doc.font('Helvetica-Bold')
                    .fontSize(8)
                    .fillColor('#0D5749')
                    .text('Endereço ->', 385, yPosition + 45);

                try {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(targetLink)}`;
                    const response = await axios.get(qrUrl, { responseType: 'arraybuffer' });
                    const qrBuffer = Buffer.from(response.data, 'binary');

                    doc.image(qrBuffer, 470, yPosition + 12, {
                        width: 70,
                        height: 70
                    });
                } catch (errorQr) {
                    console.error("Falha ao injetar QR Code individual no PDF:", errorQr.message);
                    doc.fillColor('#dc3545')
                        .fontSize(8)
                        .text('[Erro QR Code]', 430, yPosition + 32);
                }
            } else {
                doc.font('Helvetica-Oblique')
                    .fontSize(8.5)
                    .fillColor('#999999')
                    .text('Nenhum link ou rota GPS associada a este destino.', 55, idStartY, {
                        align: 'right',
                        width: 490
                    });
            }

            yPosition += boxHeight + 15;
        }

        // Finaliza o documento PDF
        doc.end();

    } catch (error) {
        console.error('[ERRO PDF MANIFESTO]', error);
        if (!res.headersSent) {
            res.status(500).send('Erro crítico interno ao processar o PDF de impressão. Verifique os logs.');
        }
    }
});

//ATUALIZAR COORDENADAS DAS CIDADES DE ACORDO COM AS COORDENADAS
router.get("/caderno-entregas/migrar-coordenadas", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        // Busca clientes que não têm coordenada OU que não têm a cidade salva
        const [clientes] = await db.promise().query(`
            SELECT nome, link_endereco, coordenadas 
            FROM clientes_historico 
            WHERE link_endereco IS NOT NULL 
              AND link_endereco != '' 
              AND (coordenadas IS NULL OR coordenadas = '' OR cidade IS NULL OR cidade = '')
        `);

        // Cabeçalhos essenciais para forçar o Streaming e desativar o Buffering em Produção
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Accel-Buffering', 'no'); // <--- A MÁGICA PARA O NGINX EM PRODUÇÃO AQUI
        res.setHeader('Connection', 'keep-alive');

        if (clientes.length === 0) {
            return res.send(`
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                    <h3 style="color: #0D5749;">Tudo pronto!</h3>
                    <p>Não há clientes precisando de atualização de GPS ou Cidade.</p>
                </div>
            `);
        }

        // Envia um "padding" inicial para forçar os browsers/proxies mais teimosos a começarem o stream
        res.write(' '.repeat(1024));

        res.write(`
            <style>
                body { font-family: 'Segoe UI', sans-serif; font-size: 14px; color: #333; padding: 10px; margin: 0; background: #f8f9fa; }
                .linha { margin: 5px 0; padding: 8px; border-radius: 4px; border-left: 4px solid #ccc; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .sucesso { border-left-color: #198754; }
                .aviso { border-left-color: #ffc107; }
                .erro { border-left-color: #dc3545; }
            </style>
            <h3>Sincronizando cidades e coordenadas de ${clientes.length} clientes...</h3>
            <p>Por favor, não feche o modal até a conclusão.</p>
            <hr style="border: 1px solid #ddd;">
        `);

        let atualizados = 0;

        for (let c of clientes) {
            try {
                let coordCli = c.coordenadas;
                let atualizouAlgo = false;

                // Se não tem coordenada, decodifica o link
                if (!coordCli || coordCli.trim() === '') {
                    const localizacaoResolvida = await obterLocalizacao(c.nome, c.link_endereco);
                    if (localizacaoResolvida && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(localizacaoResolvida.trim())) {
                        coordCli = localizacaoResolvida.trim();
                        atualizouAlgo = true;
                    }
                }

                // Se temos a coordenada na mão, buscamos a cidade
                if (coordCli && coordCli.trim() !== '') {
                    const cidade = await obterCidadeDasCoordenadas(coordCli);

                    await db.promise().query(
                        "UPDATE clientes_historico SET coordenadas = ?, cidade = ? WHERE nome = ?",
                        [coordCli, cidade || null, c.nome]
                    );

                    atualizados++;
                    res.write(`<div class="linha sucesso">✅ <b>${c.nome}:</b> GPS: ${coordCli} | Cidade: <b>${cidade || 'Não localizada'}</b></div>`);
                } else {
                    res.write(`<div class="linha aviso">⚠️ <b>${c.nome}:</b> Coordenada não encontrada.</div>`);
                }
            } catch (err) {
                res.write(`<div class="linha erro">❌ <b>Erro em ${c.nome}:</b> ${err.message}</div>`);
            }

            res.write(`<script>window.scrollTo(0, document.body.scrollHeight);</script>`);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        res.write(`
            <hr style="border: 1px solid #ddd;">
            <div style="text-align: center; padding: 20px 0;">
                <h4 style="color: #0D5749; margin-bottom: 5px;">Sincronização Concluída!</h4>
                <p><b>${atualizados}</b> clientes foram atualizados com sucesso.</p>
            </div>
            <script>window.scrollTo(0, document.body.scrollHeight);</script>
        `);
        res.end();

    } catch (error) {
        console.error("[ERRO NA MIGRAÇÃO]:", error);
        if (!res.headersSent) res.status(500).send("Erro interno ao tentar rodar a migração.");
    }
});

module.exports = router;