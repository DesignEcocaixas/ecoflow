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

// 2. ENDPOINT DE MONITORAMENTO (POLLING DO MODAL) - ATUALIZADO
router.get("/api/whatsapp/status-monitor", (req, res) => {
    if (!req.session.user) return res.status(401).json({ erro: "Não autorizado" });
    
    // Pega o snapshot atual de logs e qr code
    const dadosMonitor = whatsappService.obterDadosMonitor();
    
    // Força o status 'isReady' a bater rigorosamente com a verificação oficial do cliente
    dadosMonitor.isReady = whatsappService.verificarReady();
    
    return res.json(dadosMonitor);
});

// 3. ENDPOINT: DESCONECTAR SESSÃO VIA PAINEL ADMINISTRATIVO
router.post("/api/whatsapp/desconectar", async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    
    try {
        const targetClient = whatsappService.client;

        if (targetClient) {
            console.log("[WHATSAPP PAINEL] 🔌 Desconectando sessão via painel administrativo...");
            
            // 1. Força a limpeza das variáveis globais e estados na memória do Node imediatamente
            whatsappService.forcarResetEstadoManual();

            // 2. Executa o logout no WhatsApp Web
            await targetClient.logout().catch(() => {
                console.log("[WHATSAPP PAINEL] Aviso: Sessão já estava inativa ou sem autenticação.");
            });
            
            // 3. Aguarda 2.5 segundos para o Puppeteer matar os subprocessos do Chrome/Chromium
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            // 4. Inicializa o cliente do WhatsApp do zero para gerar um novo QR Code limpo
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
        
        // 1. Destrói o cliente atual para liberar os arquivos bloqueados pelo navegador
        if (whatsappService.client) {
            await whatsappService.client.destroy().catch(() => console.log("Cliente já estava inativo."));
        }
        
        // 2. Apaga a pasta .wwebjs_auth e .wwebjs_cache
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

        // 3. Responde ao frontend antes de reiniciar (para o painel não dar erro de timeout)
        res.status(200).json({ success: true, message: "Hard Reset concluído. O PM2 reiniciará o serviço." });

        // 4. Força o encerramento do processo do Node. O PM2 na VPS detectará a queda e reiniciará o app instantaneamente, de forma limpa.
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

    // Processamento assíncrono em background
    (async () => {
        for (let cadernoId of ids) {
            try {
                // 1. ADICIONADO: ch.contato_secundario na consulta SQL
                const [itens] = await db.promise().query(`
                    SELECT i.local_entrega, i.itens_pedido, i.quantidade, i.valor_aberto, ch.contato, ch.contato_secundario 
                    FROM caderno_entregas_itens i
                    LEFT JOIN clientes_historico ch ON i.local_entrega = ch.nome
                    WHERE i.caderno_id = ?
                    ORDER BY i.id ASC
                `, [cadernoId]);

                for (let i = 0; i < itens.length; i++) {
                    const cliente = itens[i];
                    
                    // Verifica quais contatos o cliente possui e os adiciona a uma lista
                    const contatosValidos = [];
                    if (cliente.contato && cliente.contato.trim() !== '') {
                        contatosValidos.push(cliente.contato.trim());
                    }
                    if (cliente.contato_secundario && cliente.contato_secundario.trim() !== '') {
                        contatosValidos.push(cliente.contato_secundario.trim());
                    }

                    // Se não tiver nenhum número cadastrado, pula para o próximo cliente
                    if (contatosValidos.length === 0) {
                        console.log(`[WHATSAPP] ⚠️ Nenhum contato encontrado para: ${cliente.local_entrega}. Pulando...`);
                        continue;
                    }

                    // Formata a lista de itens
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

                    const mensagem = `Olá, *${(cliente.local_entrega || '').toUpperCase()}*! 👋\nAqui é o *Setor de Relacionamento* da Eco Caixas. 📦\nSeu pedido está na rota para entrega e, neste momento, está previsto para ser a nossa *${i + 1}ª parada*.\n\n*📋 Relação de Itens:*\n${listaItensFormatada}\n*🔢 Quantidade Total:* ${cliente.quantidade || '-'}\n\n*💰 Valor a Receber:* R$ ${valorFmt}\n\nEste é um aviso automático para que você acompanhe o andamento da entrega. Como toda operação logística, o roteiro poderá sofrer alterações por motivos operacionais, trânsito ou outras situações imprevistas.\nAgradecemos pela confiança e seguimos à disposição. Até breve!`;

                    // 2. ADICIONADO: Loop para enviar a mensagem para cada contato cadastrado
                    for (let numero of contatosValidos) {
                        // Enviamos o local_entrega como nomeCliente para formatar bonito no painel
                        const disparou = await whatsappService.enviarMensagem(numero, mensagem, cliente.local_entrega);

                        // Registra o envio (ou falha) individualmente no banco de dados
                        await db.promise().query(`
                            INSERT INTO whatsapp_logs_envio (caderno_id, cliente, contato, sucesso) 
                            VALUES (?, ?, ?, ?)
                        `, [cadernoId, cliente.local_entrega, numero, disparou ? 1 : 0]);

                        // Aguarda 2,5s entre mensagens para o WhatsApp não bloquear como spam
                        await new Promise(resolve => setTimeout(resolve, 2500));
                    }
                }

                // Automação: Marca o caderno automaticamente como enviado (whatsapp_ativo = 0) ao finalizar
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

module.exports = router;