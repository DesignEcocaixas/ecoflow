const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const { uploadPagamentos } = require("../config/uploadConfig");
const controlePagamentosView = require("../views/controlePagamentosView");

//------------------------------------------------------------------------------ROTAS PARA PAGAMENTOS MOTORISTAS/AJUDANTES------------------------------------------------------------------------------
//LISTAR PAGAMENTOS
router.get("/pagamentos", async (req, res) => {
    if (!req.session.user || (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "financeiro" && req.session.user.tipo_usuario !== "logistica")) {
        return res.redirect("/login");
    }

    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = 10;
        const offset = (page - 1) * limit;
        const { data_inicio, data_fim, colaborador, caderno_inicio, caderno_fim } = req.query;

        // A. Busca a lógica de Degraus e Viagens Longas
        const [configs] = await db.promise().query("SELECT chave, valor FROM configuracoes");
        let taxas = {
            mot_t1: 80, mot_t2: 95, mot_t3: 110,
            aju_t1: 55, aju_t2: 65, aju_t3: 75,
            val_almoco: 25,
            vl_sulbahia: 200, vl_aracaju1: 160, vl_aracaju2: 200, vl_capimgrosso: 200
        };
        configs.forEach(c => {
            if (taxas[c.chave] !== undefined) taxas[c.chave] = parseFloat(c.valor);
        });

        // B. Busca Colaboradores
        const [colaboradores] = await db.promise().query("SELECT id, nome, tipo_usuario, foto, cpf, pix, banco FROM usuarios ORDER BY nome ASC");

        // C. Busca Cadernos Pendentes (CORRIGIDO: Puxa o status e o VALOR EXATO pago para atualizar os cards)
        let whereCad = [];
        let paramsCad = [];
        if (caderno_inicio) { whereCad.push("DATE(c.data_criacao) >= ?"); paramsCad.push(caderno_inicio); }
        if (caderno_fim) { whereCad.push("DATE(c.data_criacao) <= ?"); paramsCad.push(caderno_fim); }
        const whereCadSql = whereCad.length ? "WHERE " + whereCad.join(" AND ") : "";

        const [cadernosPendentes] = await db.promise().query(`
            SELECT c.*, v.modelo as veiculo_modelo,
                (SELECT status FROM pagamentos_colaboradores p WHERE p.caderno_id = c.id AND p.colaborador_id = (SELECT id FROM usuarios WHERE nome = c.motorista LIMIT 1) ORDER BY id DESC LIMIT 1) as mot_status,
                (SELECT valor_total FROM pagamentos_colaboradores p WHERE p.caderno_id = c.id AND p.colaborador_id = (SELECT id FROM usuarios WHERE nome = c.motorista LIMIT 1) ORDER BY id DESC LIMIT 1) as mot_valor,
                (SELECT status FROM pagamentos_colaboradores p WHERE p.caderno_id = c.id AND p.colaborador_id = (SELECT id FROM usuarios WHERE nome = c.ajudante LIMIT 1) ORDER BY id DESC LIMIT 1) as aju_status,
                (SELECT valor_total FROM pagamentos_colaboradores p WHERE p.caderno_id = c.id AND p.colaborador_id = (SELECT id FROM usuarios WHERE nome = c.ajudante LIMIT 1) ORDER BY id DESC LIMIT 1) as aju_valor
            FROM caderno_entregas c
            LEFT JOIN veiculos v ON c.veiculo_id = v.id
            ${whereCadSql}
            ORDER BY c.data_criacao DESC LIMIT 50 
        `, paramsCad);

        for (let c of cadernosPendentes) {
            const [itens] = await db.promise().query(`SELECT i.*, ch.cidade FROM caderno_entregas_itens i LEFT JOIN clientes_historico ch ON i.local_entrega = ch.nome WHERE i.caderno_id = ? ORDER BY i.id ASC`, [c.id]);
            c.entregas = itens;
            c.qtd_entregas = itens.length;
        }

        // D. Busca Histórico Dinâmico
        let whereHist = [];
        let paramsHist = [];
        if (data_inicio) { whereHist.push("DATE(p.data_servico) >= ?"); paramsHist.push(data_inicio); }
        if (data_fim) { whereHist.push("DATE(p.data_servico) <= ?"); paramsHist.push(data_fim); }
        if (colaborador) { whereHist.push("p.colaborador_id = ?"); paramsHist.push(colaborador); }

        const whereHistSql = whereHist.length ? "WHERE " + whereHist.join(" AND ") : "";
        const countQuery = `SELECT COUNT(*) AS total FROM pagamentos_colaboradores p ${whereHistSql}`;
        const [[countResult]] = await db.promise().query(countQuery, paramsHist);

        const total = countResult.total;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const queryParams = [...paramsHist, limit, offset];

        const [pagamentos] = await db.promise().query(`
            SELECT p.*, u.nome as nome_colaborador, u.tipo_usuario as tipo_colaborador 
            FROM pagamentos_colaboradores p 
            LEFT JOIN usuarios u ON p.colaborador_id = u.id 
            ${whereHistSql} 
            ORDER BY p.data_servico DESC, p.id DESC 
            LIMIT ? OFFSET ?
        `, queryParams);

        const filtrosCompletos = { data_inicio, data_fim, colaborador, caderno_inicio, caderno_fim };

        res.send(controlePagamentosView(
            req.session.user, colaboradores, pagamentos, cadernosPendentes, filtrosCompletos, { page, totalPages }, taxas
        ));

    } catch (error) {
        console.error("Erro no Controle de Pagamentos:", error);
        res.status(500).send("Erro interno ao carregar a página.");
    }
});

//DEFINIÇÕES DE PAGAMENTO
router.post("/configuracoes/taxas", async (req, res) => {
    if (!req.session.user || (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "financeiro")) {
        return res.status(403).send("Acesso negado.");
    }

    try {
        const promises = Object.keys(req.body).map(chave => {
            return db.promise().query("INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?", [chave, req.body[chave], req.body[chave]]);
        });
        await Promise.all(promises);
        res.redirect("/pagamentos");
    } catch (error) {
        console.error("Erro ao salvar taxas:", error);
        res.status(500).send("Erro ao salvar configurações.");
    }
});

//CADASTRAR UM NOVO REGISTRO DE PAGAMENTO
router.post("/pagamentos/novo", uploadPagamentos.single("comprovante"), async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const {
        colaborador_id, data_servico, valor_total, ja_pago, caderno_id,
        is_viagem_longa, destino_longa, is_almoco, valor_almoco_bd,
        adicional, observacao
    } = req.body;

    let { qtd_entregas } = req.body;

    // BLINDAGEM: Se a quantidade vier como 0 ou vazia, o sistema lê direto do banco de dados para nunca falhar o histórico.
    if ((!qtd_entregas || qtd_entregas == 0) && caderno_id) {
        try {
            const [[countItens]] = await db.promise().query("SELECT COUNT(id) as total FROM caderno_entregas_itens WHERE caderno_id = ?", [caderno_id]);
            qtd_entregas = countItens ? countItens.total : 0;
        } catch (e) {
            qtd_entregas = 0;
        }
    }

    const status = ja_pago === "sim" ? 'PAGO' : 'Pendente';

    // A MÁGICA AQUI: Define o caminho já com a subpasta
    const comprovante = req.file ? "financeiro/pagamentos/" + req.file.filename : null;

    const tipo_viagem = is_viagem_longa === "sim" ? destino_longa : 'Padrão';
    const almoco = is_almoco === "sim" ? (valor_almoco_bd || 25.00) : 0.00;

    // Tratamento para garantir que o adicional não cause erro se vier vazio
    const valorAdicional = parseFloat(adicional) || 0.00;

    try {
        await db.promise().query(
            "INSERT INTO pagamentos_colaboradores (colaborador_id, data_servico, qtd_entregas, valor_total, status, comprovante, caderno_id, almoco, tipo_viagem, adicional, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [colaborador_id, data_servico, qtd_entregas || 0, valor_total || 0, status, comprovante, caderno_id || null, almoco, tipo_viagem, valorAdicional, observacao]
        );
        res.redirect("/pagamentos");
    } catch (error) {
        console.error("Erro ao registrar pagamento:", error);
        res.status(500).send("Erro ao registrar o pagamento.");
    }
});

// EDITAR PAGAMENTO
router.post("/pagamentos/editar/:id", uploadPagamentos.single("comprovante"), async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const id = req.params.id;
    const { data_servico, qtd_entregas, valor_total, ja_pago, tipo_viagem, redirect_to } = req.body;
    const status = ja_pago === "sim" ? 'PAGO' : 'Pendente';

    let query = "UPDATE pagamentos_colaboradores SET data_servico=?, qtd_entregas=?, valor_total=?, status=?, tipo_viagem=? WHERE id=?";
    let params = [data_servico, qtd_entregas || 1, valor_total || 0, status, tipo_viagem || 'Diária Padrão', id];

    try {
        // Se o usuário mandou um novo comprovante
        if (req.file) {
            const novoComprovante = "financeiro/pagamentos/" + req.file.filename;

            // 1. Busca o arquivo antigo para apagá-lo do disco
            const [[oldReg]] = await db.promise().query("SELECT comprovante FROM pagamentos_colaboradores WHERE id = ?", [id]);
            if (oldReg && oldReg.comprovante) {
                const fs = require('fs');
                const path = require('path');
                const oldFilePath = path.join(__dirname, "uploads", oldReg.comprovante);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }

            // 2. Prepara a query de update com o novo arquivo
            query = "UPDATE pagamentos_colaboradores SET data_servico=?, qtd_entregas=?, valor_total=?, status=?, tipo_viagem=?, comprovante=? WHERE id=?";
            params = [data_servico, qtd_entregas || 1, valor_total || 0, status, tipo_viagem || 'Diária Padrão', novoComprovante, id];
        }

        // Executa a atualização
        await db.promise().query(query, params);
        res.redirect(redirect_to || "/diaristas");
    } catch (error) {
        console.error("Erro ao editar pagamento:", error);
        res.status(500).send("Erro ao salvar edição.");
    }
});

//EXCLUIR PAGAMENTO
router.post("/pagamentos/excluir/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    try {
        // Primeiro busca o comprovante para excluí-lo do disco
        const [[pagamento]] = await db.promise().query("SELECT comprovante FROM pagamentos_colaboradores WHERE id = ?", [req.params.id]);

        if (pagamento && pagamento.comprovante) {
            const fs = require('fs');
            const path = require('path');
            const caminho = path.join(__dirname, "uploads", pagamento.comprovante);
            if (fs.existsSync(caminho)) {
                fs.unlinkSync(caminho);
            }
        }

        // Depois apaga o registro do banco
        await db.promise().query("DELETE FROM pagamentos_colaboradores WHERE id = ?", [req.params.id]);
        res.redirect("/pagamentos");
    } catch (error) {
        console.error("Erro ao excluir pagamento:", error);
        res.status(500).send("Erro ao excluir.");
    }
});

//MUDAR STATUS DO PAGAMENTO PARA PAGO
router.post("/pagamentos/baixar/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    try {
        await db.promise().query("UPDATE pagamentos_colaboradores SET status = 'PAGO' WHERE id = ?", [req.params.id]);
        res.redirect("/pagamentos");
    } catch (error) {
        res.status(500).send("Erro ao atualizar.");
    }
});

//RELATÓRIO COMPLETO PAGAMENTOS
router.get("/pagamentos/exportar-excel", async (req, res) => {
    if (!req.session.user) return res.status(401).send("Acesso negado");

    try {
        const { data_inicio, data_fim, colaborador } = req.query;

        // CORREÇÃO: Tabela alterada de 'colaboradores' para 'usuarios'
        let queryPagamentos = `
            SELECT p.*, u.nome, u.cpf, u.pix, u.banco 
            FROM pagamentos_colaboradores p
            LEFT JOIN usuarios u ON p.colaborador_id = u.id
            WHERE 1=1
        `;
        let params = [];

        if (data_inicio) {
            queryPagamentos += " AND p.data_servico >= ?";
            params.push(data_inicio);
        }
        if (data_fim) {
            queryPagamentos += " AND p.data_servico <= ?";
            params.push(data_fim);
        }
        if (colaborador) {
            queryPagamentos += " AND p.colaborador_id = ?";
            params.push(colaborador);
        }

        queryPagamentos += " ORDER BY p.data_servico DESC, p.id DESC";

        const [pagamentos] = await db.promise().query(queryPagamentos, params);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Relatório de Pagamentos');

        worksheet.columns = [
            { header: 'Data Serviço', key: 'data', width: 15 },
            { header: 'Colaborador', key: 'nome', width: 30 },
            { header: 'CPF', key: 'cpf', width: 20 },
            { header: 'PIX', key: 'pix', width: 25 },
            { header: 'Banco', key: 'banco', width: 20 },
            { header: 'Tipo Serviço', key: 'tipo', width: 25 },
            { header: 'Qtd. Entregas', key: 'qtd', width: 15 },
            { header: 'Valor Pago (R$)', key: 'valor', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        // Estiliza o cabeçalho
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };

        pagamentos.forEach(p => {
            let tipoServico = 'Lançamento Avulso';
            if (p.pasta_id) tipoServico = 'Diarista (Pasta/Semana)';
            else if (p.tipo_colaborador === 'ajudante') tipoServico = `Ajudante Rota #${p.caderno_id}`;
            else if (p.caderno_id) tipoServico = `Motorista Rota #${p.caderno_id}`;

            worksheet.addRow({
                data: p.data_servico ? new Date(p.data_servico).toLocaleDateString('pt-BR') : '-',
                nome: p.nome || p.nome_colaborador || 'Desconhecido',
                cpf: p.cpf || 'Não cadastrado',
                pix: p.pix || 'Não cadastrado',
                banco: p.banco || 'Não cadastrado',
                tipo: tipoServico,
                qtd: p.qtd_entregas || 0,
                valor: p.valor_total || 0,
                status: p.status || 'Pendente'
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'Relatorio_Pagamentos.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Erro ao exportar excel:", error);
        res.status(500).send("Erro ao gerar relatório Excel. Verifique os logs.");
    }
});

module.exports = router;