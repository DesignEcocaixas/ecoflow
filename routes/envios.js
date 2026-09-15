// routes/envios.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");
const whatsappService = require("../services/whatsappService");

// 1. TELA PRINCIPAL DE ENVIOS COM PAGINAÇÃO INTEGRA
router.get("/envios-whatsapp", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const limit = 15;
        const pageCadernos = parseInt(req.query.pageCadernos || "1", 15);
        const offsetCadernos = (pageCadernos - 1) * limit;

        const pageLogs = parseInt(req.query.pageLogs || "1", 15);
        const offsetLogs = (pageLogs - 1) * limit;

        // 1. Contador e consulta de cadernos
        const [countCadernos] = await db.promise().query(`
            SELECT COUNT(DISTINCT c.id) AS total FROM caderno_entregas c
            INNER JOIN caderno_entregas_itens i ON i.caderno_id = c.id
        `);
        const totalC = countCadernos[0].total;
        const totalPagesCadernos = Math.max(1, Math.ceil(totalC / limit));

        const [cadernos] = await db.promise().query(`
            SELECT c.id, c.data_criacao, c.motorista, c.whatsapp_ativo, COUNT(i.id) as total_entregas
            FROM caderno_entregas c
            INNER JOIN caderno_entregas_itens i ON i.caderno_id = c.id
            GROUP BY c.id
            ORDER BY c.data_criacao DESC LIMIT ? OFFSET ?
        `, [limit, offsetCadernos]);

        // 2. Contador e consulta de logs
        const [countLogs] = await db.promise().query(`SELECT COUNT(*) AS total FROM whatsapp_logs_envio`);
        const totalL = countLogs[0].total;
        const totalPagesLogs = Math.max(1, Math.ceil(totalL / limit));

        const [logs] = await db.promise().query(`
            SELECT * FROM whatsapp_logs_envio 
            ORDER BY data_envio DESC LIMIT ? OFFSET ?
        `, [limit, offsetLogs]);

        // Uma única declaração limpa para o status em tempo real do robô
        const statusBot = { isReady: whatsappService.verificarReady() };

        res.send(require('../views/enviosView')(
            req,
            cadernos,
            logs,
            statusBot,
            { page: pageCadernos, totalPages: totalPagesCadernos },
            { page: pageLogs, totalPages: totalPagesLogs }
        ));
    } catch (error) {
        console.error("Erro ao carregar painel de envios:", error);
        res.status(500).send("Erro interno ao carregar o painel.");
    }
});

// 2. ENDPOINT DE MONITORAMENTO (POLLING DO MODAL)
router.get("/api/whatsapp/status-monitor", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ erro: "Não autorizado" });
    
    const dadosMonitor = whatsappService.obterDadosMonitor();
    dadosMonitor.isReady = whatsappService.verificarReady();
    
    try {
        const [dbLogs] = await db.promise().query(`
            SELECT * FROM whatsapp_logs_envio 
            ORDER BY data_envio DESC LIMIT 15
        `);
        dadosMonitor.dbLogs = dbLogs;
    } catch (err) {
        console.error("Erro ao buscar logs para o monitor:", err);
        dadosMonitor.dbLogs = [];
    }
    
    return res.json(dadosMonitor);
});

// 3. ENDPOINT: DESCONECTAR SESSÃO VIA PAINEL ADMINISTRATIVO
router.post("/api/whatsapp/desconectar", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    
    try {
        const targetClient = whatsappService.client;

        if (targetClient) {
            console.log("[WHATSAPP PAINEL] 🔌 Desconectando sessão via painel administrativo...");
            
            whatsappService.forcarResetEstadoManual();

            await targetClient.logout().catch(() => {
                console.log("[WHATSAPP PAINEL] Aviso: Sessão já estava inativa ou sem autenticação.");
            });
            
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            console.log("[WHATSAPP PAINEL] ⚙️ Reinicializando Puppeteer para capturar novo QR Code...");
            targetClient.initialize().catch(errInit => {
                console.error(`[WHATSAPP PAINEL] ❌ Erro ao inicializar após logout: ${errInit.message}`);
            });
            
            return res.status(200).json({ success: true, message: "Sessão encerrada com sucesso. Novo QR Code sendo gerado..." });
        } else {
            return res.status(500).json({ erro: "Instância do cliente WhatsApp não localizada." });
        }
    } catch (error) {
        console.error("Erro crítico ao desconectar WhatsApp:", error);
        return res.status(500).json({ erro: "Falha ao desconectar o robô do servidor." });
    }
});

// 3.5 ENDPOINT: HARD RESET (EXCLUIR PASTA E REINICIAR VPS)
router.post("/api/whatsapp/hard-reset", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    
    try {
        console.log("[WHATSAPP PAINEL] ⚠️ HARD RESET INICIADO! Destruindo cliente e apagando cache...");
        
        if (whatsappService.client) {
            await whatsappService.client.destroy().catch(() => console.log("Cliente já estava inativo."));
        }
        
        const authPath = path.join(process.cwd(), '.wwebjs_auth');
        const cachePath = path.join(process.cwd(), '.wwebjs_cache');
        
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
            console.log("[WHATSAPP PAINEL] 🗑️ Pasta .wwebjs_auth apagada com sucesso.");
        }
        if (fs.existsSync(cachePath)) {
            fs.rmSync(cachePath, { recursive: true, force: true });
            console.log("[WHATSAPP PAINEL] 🗑️ Pasta .wwebjs_cache apagada com sucesso.");
        }

        res.status(200).json({ success: true, message: "Hard Reset concluído. O PM2 reiniciará o serviço." });

        setTimeout(() => {
            console.log("♻️ Reiniciando o processo via PM2...");
            process.exit(1); 
        }, 1500);

    } catch (error) {
        console.error("Erro crítico ao fazer hard reset:", error);
        return res.status(500).json({ erro: "Falha ao executar o Hard Reset." });
    }
});

// 4. PROCESSAMENTO DE DISPARO MANUAL EM LOTE
router.post("/caderno-entregas/disparar-manual", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send("Nenhum manifesto selecionado.");
    }

    const templatePath = path.join(process.cwd(), 'whatsapp_template.txt');
    let baseTemplate = `Olá, *{{CLIENTE}}*! 👋\nAqui é o *Setor de Relacionamento* da Eco Caixas. 📦\nSeu pedido está na rota para entrega e, neste momento, está previsto para ser a nossa *{{PARADA}}ª parada*.\n\n*📋 Relação de Itens:*\n{{ITENS}}\n*🔢 Quantidade Total:* {{QUANTIDADE}}\n\n*💰 Valor a Receber:* R$ {{VALOR}}\n\nEste é um aviso automático para que você acompanhe o andamento da entrega. Como toda operação logística, o roteiro poderá sofrer alterações por motivos operacionais, trânsito ou outras situações imprevistas.\nAgradecemos pela confiança e seguimos à disposição. Até breve!`;

    try {
        if (fs.existsSync(templatePath)) {
            baseTemplate = fs.readFileSync(templatePath, 'utf8');
        }
    } catch (e) {
        console.error("Erro ao ler template. Usando o padrão.", e);
    }

    (async () => {
        for (let cadernoId of ids) {
            try {
                const [itens] = await db.promise().query(`
                    SELECT i.local_entrega, i.itens_pedido, i.quantidade, i.valor_aberto, ch.contato, ch.contato_secundario 
                    FROM caderno_entregas_itens i
                    LEFT JOIN clientes_historico ch ON i.local_entrega = ch.nome
                    WHERE i.caderno_id = ?
                    ORDER BY i.id ASC
                `, [cadernoId]);

                for (let i = 0; i < itens.length; i++) {
                    const cliente = itens[i];
                    
                    const contatosValidos = [];
                    if (cliente.contato && cliente.contato.trim() !== '') {
                        contatosValidos.push(cliente.contato.trim());
                    }
                    if (cliente.contato_secundario && cliente.contato_secundario.trim() !== '') {
                        contatosValidos.push(cliente.contato_secundario.trim());
                    }

                    if (contatosValidos.length === 0) {
                        console.log(`[WHATSAPP] ⚠️ Nenhum contato encontrado para: ${cliente.local_entrega}. Pulando...`);
                        continue;
                    }

                    let listaItensFormatada = '';
                    const itensTexto = cliente.itens_pedido || '';
                    if (itensTexto.trim() !== '' && itensTexto.trim() !== '-') {
                        cliente.itens_pedido.split(',').forEach(itemStr => {
                            if (itemStr.trim()) listaItensFormatada += `• ${itemStr.trim()}\n`;
                        });
                    } else {
                        listaItensFormatada = '-\n';
                    }

                    const valorNum = parseFloat(cliente.valor_aberto || 0);
                    const valorFmt = valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                    const mensagemFormatada = baseTemplate
                        .replace(/\{\{CLIENTE\}\}/g, (cliente.local_entrega || '').toUpperCase())
                        .replace(/\{\{PARADA\}\}/g, (i + 1))
                        .replace(/\{\{ITENS\}\}/g, listaItensFormatada)
                        .replace(/\{\{QUANTIDADE\}\}/g, cliente.quantidade || '-')
                        .replace(/\{\{VALOR\}\}/g, valorFmt);

                    for (let numero of contatosValidos) {
                        let disparou = false;
                        let msgErro = null;

                        try {
                            // Captura a resposta inteligente (Objeto) do whatsappService
                            const resultado = await whatsappService.enviarMensagem(numero, mensagemFormatada, cliente.local_entrega);
                            disparou = resultado.success;
                            if (!disparou) msgErro = resultado.error || "Serviço indisponível.";
                        } catch (errDisparo) {
                            disparou = false;
                            msgErro = errDisparo.message || "Erro desconhecido ao disparar.";
                        }

                        // INSERE A MENSAGEM DETALHADA NO BANCO DE DADOS
                        await db.promise().query(`
                            INSERT INTO whatsapp_logs_envio (caderno_id, cliente, contato, sucesso, erro, mensagem) 
                            VALUES (?, ?, ?, ?, ?, ?)
                        `, [cadernoId, cliente.local_entrega, numero, disparou ? 1 : 0, msgErro, mensagemFormatada]);

                        await new Promise(resolve => setTimeout(resolve, 2500));
                    }
                }

                await db.promise().query(
                    "UPDATE caderno_entregas SET whatsapp_ativo = 0 WHERE id = ?",
                    [cadernoId]
                );
                console.log(`[AUTOMAÇÃO WHATSAPP] ✅ Caderno #${cadernoId} finalizado e marcado automaticamente como concluído.`);

            } catch (errCaderno) {
                console.error(`Erro ao processar envio em lote do caderno #${cadernoId}:`, errCaderno);
            }
        }
    })();

    return res.sendStatus(200);
});

// 5. ATUALIZAR STATUS DE ENVIO DO CADERNO (MARCAR COMO ENVIADO NO DB)
router.post("/api/cadernos/atualizar-status-envio", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);

    const { id, enviado } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, error: "ID do caderno não informado." });
    }

    const whatsappAtivo = enviado ? 0 : 1;

    try {
        await db.promise().query(
            "UPDATE caderno_entregas SET whatsapp_ativo = ? WHERE id = ?",
            [whatsappAtivo, id]
        );

        return res.status(200).json({
            success: true,
            message: enviado ? `Manifesto #${id} marcado como enviado.` : `Manifesto #${id} restaurado.`
        });
    } catch (error) {
        console.error("[ERRO SQL ATUALIZAR STATUS ENVIO CADERNO]:", error);
        return res.status(500).json({ success: false, error: "Erro ao atualizar o banco de dados." });
    }
});

// 6. REENVIAR MENSAGEM COM ERRO COM NOVO CONTATO
router.post("/api/whatsapp/reenviar", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);

    const { log_id, novo_numero } = req.body;

    if (!log_id || !novo_numero) {
        return res.status(400).json({ success: false, error: "Dados incompletos para o reenvio." });
    }

    try {
        const [logs] = await db.promise().query("SELECT * FROM whatsapp_logs_envio WHERE id = ?", [log_id]);
        if (logs.length === 0) return res.status(404).json({ success: false, error: "Registro original não encontrado." });

        const logOriginal = logs[0];

        let disparou = false;
        let msgErro = null;

        try {
            // Captura a resposta inteligente (Objeto) do whatsappService
            const resultado = await whatsappService.enviarMensagem(novo_numero, logOriginal.mensagem, logOriginal.cliente);
            disparou = resultado.success;
            if (!disparou) msgErro = resultado.error || "Serviço indisponível.";
        } catch (errDisparo) {
            disparou = false;
            msgErro = errDisparo.message || "Erro desconhecido ao disparar.";
        }

        await db.promise().query(`
            INSERT INTO whatsapp_logs_envio (caderno_id, cliente, contato, sucesso, erro, mensagem) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [logOriginal.caderno_id, logOriginal.cliente, novo_numero, disparou ? 1 : 0, msgErro, logOriginal.mensagem]);

        if (disparou) {
            return res.status(200).json({ success: true, message: "Mensagem reenviada com sucesso!" });
        } else {
            return res.status(400).json({ success: false, error: msgErro });
        }

    } catch (error) {
        console.error("[ERRO REENVIO WHATSAPP]:", error);
        return res.status(500).json({ success: false, error: "Erro interno no servidor." });
    }
});

// 7. NOVO ENDPOINT: BUSCAR DETALHES DO CADERNO (PARA O MODAL)
router.get("/api/cadernos/:id/detalhes", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, erro: "Não autorizado" });
    
    const cadernoId = req.params.id;

    try {
        const [cadernos] = await db.promise().query(`
            SELECT c.*, 
                   um.foto as motorista_foto, 
                   ua.foto as ajudante_foto 
            FROM caderno_entregas c
            LEFT JOIN usuarios um ON c.motorista = um.nome
            LEFT JOIN usuarios ua ON c.ajudante = ua.nome
            WHERE c.id = ?
        `, [cadernoId]);

        if (cadernos.length === 0) {
            return res.status(404).json({ success: false, erro: "Manifesto não encontrado." });
        }

        const caderno = cadernos[0];

        if (caderno.veiculo_id) {
            try {
                const [veic] = await db.promise().query("SELECT modelo, foto FROM veiculos WHERE id = ?", [caderno.veiculo_id]);
                if(veic.length > 0) {
                    caderno.veiculo_modelo = veic[0].modelo;
                    caderno.veiculo_foto = veic[0].foto;
                }
            } catch(e) {
                try {
                    const [veic2] = await db.promise().query("SELECT modelo, foto FROM frota_veiculos WHERE id = ?", [caderno.veiculo_id]);
                    if(veic2.length > 0) {
                        caderno.veiculo_modelo = veic2[0].modelo;
                        caderno.veiculo_foto = veic2[0].foto;
                    }
                } catch(e2) {
                    console.log("Erro ao buscar veiculo", e2);
                }
            }
        }

        const [itens] = await db.promise().query(`
            SELECT local_entrega, itens_pedido, quantidade, valor_aberto 
            FROM caderno_entregas_itens 
            WHERE caderno_id = ? 
            ORDER BY id ASC
        `, [cadernoId]);

        res.json({ success: true, caderno, itens });
    } catch (error) {
        console.error("Erro ao buscar detalhes do caderno:", error);
        res.status(500).json({ success: false, erro: "Erro interno do servidor." });
    }
});

// 8. OBTER TEMPLATE DA MENSAGEM
router.get("/api/whatsapp/template", (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "Não autorizado" });
    const templatePath = path.join(process.cwd(), 'whatsapp_template.txt');
    
    let template = `Olá, *{{CLIENTE}}*! 👋\nAqui é o *Setor de Relacionamento* da Eco Caixas. 📦\nSeu pedido está na rota para entrega e, neste momento, está previsto para ser a nossa *{{PARADA}}ª parada*.\n\n*📋 Relação de Itens:*\n{{ITENS}}\n*🔢 Quantidade Total:* {{QUANTIDADE}}\n\n*💰 Valor a Receber:* R$ {{VALOR}}\n\nEste é um aviso automático para que você acompanhe o andamento da entrega. Como toda operação logística, o roteiro poderá sofrer alterações por motivos operacionais, trânsito ou outras situações imprevistas.\nAgradecemos pela confiança e seguimos à disposição. Até breve!`;
    
    try {
        if (fs.existsSync(templatePath)) {
            template = fs.readFileSync(templatePath, 'utf8');
        }
    } catch (e) {
        console.error("Erro ao ler template.", e);
    }
    
    res.json({ template });
});

// 9. SALVAR TEMPLATE DA MENSAGEM
router.post("/api/whatsapp/template", (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "Não autorizado" });
    const { template } = req.body;
    
    if (!template) return res.status(400).json({ error: "O template não pode ser vazio." });

    const templatePath = path.join(process.cwd(), 'whatsapp_template.txt');
    try {
        fs.writeFileSync(templatePath, template, 'utf8');
        res.json({ success: true, message: "Base da mensagem atualizada com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar template:", error);
        res.status(500).json({ error: "Falha ao gravar arquivo no servidor." });
    }
});

module.exports = router;