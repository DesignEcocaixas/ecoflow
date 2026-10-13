const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");

const { uploadMensagens } = require("../config/uploadConfig");

// ROTINA AUTOMÁTICA: DESATIVAR MENSAGENS EXPIRADAS
function desativarMensagensExpiradas() {
    const query = `
        UPDATE notificacoes_globais 
        SET status = 'INATIVA' 
        WHERE status = 'ATIVA' 
        AND data_fim IS NOT NULL 
        AND data_fim < CURRENT_DATE()
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("Erro ao verificar/desativar mensagens expiradas:", err);
        } else if (results && results.affectedRows > 0) {
            console.log(`[Sistema] ${results.affectedRows} mensagem(ns) desativada(s) automaticamente por expiração do prazo.`);
        }
    });
}

// Executa a limpeza assim que o servidor liga, e depois a cada 1 hora
desativarMensagensExpiradas();
setInterval(desativarMensagensExpiradas, 1000 * 60 * 60);

// ROTAS PARA MENSAGENS DO SISTEMA

// CADASTRAR NOVA MENSAGEM
router.post("/notificacoes/global/nova", uploadMensagens.single('imagem_notificacao'), (req, res) => {
    if (!req.session.user || req.session.user.tipo_usuario !== 'admin') {
        return res.status(401).send("Acesso negado");
    }

    const { titulo_notificacao, mensagem_notificacao, data_inicio, data_fim } = req.body;
    const imagem = req.file ? req.file.filename : null;

    db.query("UPDATE notificacoes_globais SET status = 'INATIVA' WHERE status = 'ATIVA'", (errDesativa) => {
        if (errDesativa) console.error("Erro ao desativar notificações antigas:", errDesativa);

        const query = "INSERT INTO notificacoes_globais (titulo, mensagem, imagem, status, data_inicio, data_fim) VALUES (?, ?, ?, 'ATIVA', ?, ?)";
        db.query(query, [titulo_notificacao, mensagem_notificacao, imagem, data_inicio || null, data_fim || null], (err) => {
            if (err) {
                console.error("Erro ao inserir notificação global:", err);
                return res.status(500).send("Erro interno");
            }
            res.redirect("/configuracoes?sucesso=1");
        });
    });
});

// DESATIVAR MENSAGEM MANUALMENTE
router.post("/notificacoes/global/desativar/:id", (req, res) => {
    if (!req.session.user || req.session.user.tipo_usuario !== 'admin') {
        return res.status(401).send("Acesso negado");
    }

    const notifId = req.params.id;

    db.query("UPDATE notificacoes_globais SET status = 'INATIVA' WHERE id = ?", [notifId], (err) => {
        if (err) {
            console.error("Erro ao desativar notificação:", err);
            return res.status(500).send("Erro interno");
        }
        res.redirect("/configuracoes?excluido=1");
    });
});

// EDITAR MENSAGEM
router.post("/notificacoes/global/editar/:id", uploadMensagens.single('imagem_notificacao'), (req, res) => {
    if (!req.session.user || req.session.user.tipo_usuario !== 'admin') {
        return res.status(401).send("Acesso negado");
    }

    const notifId = req.params.id;
    const { titulo_notificacao, mensagem_notificacao, status_notificacao, data_inicio, data_fim } = req.body;

    // Lógica para se alterar a imagem ou manter a antiga
    if (req.file) {
        const novaImagem = req.file.filename;
        const query = "UPDATE notificacoes_globais SET titulo = ?, mensagem = ?, status = ?, imagem = ?, data_inicio = ?, data_fim = ? WHERE id = ?";
        const params = [titulo_notificacao, mensagem_notificacao, status_notificacao, novaImagem, data_inicio || null, data_fim || null, notifId];

        // 1. Busca a imagem antiga no banco para apagá-la fisicamente do servidor
        db.query("SELECT imagem FROM notificacoes_globais WHERE id = ?", [notifId], (errSel, results) => {
            if (!errSel && results.length > 0 && results[0].imagem) {
                const caminhoFisico = path.join(__dirname, "..", "uploads", results[0].imagem);
                if (fs.existsSync(caminhoFisico)) {
                    fs.unlinkSync(caminhoFisico); // Apaga a foto velha
                }
            }

            // 2. Continua com a atualização no banco de dados
            if (status_notificacao === 'ATIVA') {
                db.query("UPDATE notificacoes_globais SET status = 'INATIVA' WHERE id != ?", [notifId], () => {
                    db.query(query, params, (err) => {
                        if (err) return res.status(500).send("Erro interno");
                        res.redirect("/configuracoes?editado=1");
                    });
                });
            } else {
                db.query(query, params, (err) => {
                    if (err) return res.status(500).send("Erro interno");
                    res.redirect("/configuracoes?editado=1");
                });
            }
        });
    } else {
        // Atualiza sem alterar a imagem
        const query = "UPDATE notificacoes_globais SET titulo = ?, mensagem = ?, status = ?, data_inicio = ?, data_fim = ? WHERE id = ?";
        const params = [titulo_notificacao, mensagem_notificacao, status_notificacao, data_inicio || null, data_fim || null, notifId];

        if (status_notificacao === 'ATIVA') {
            db.query("UPDATE notificacoes_globais SET status = 'INATIVA' WHERE id != ?", [notifId], () => {
                db.query(query, params, (err) => {
                    if (err) return res.status(500).send("Erro interno");
                    res.redirect("/configuracoes?editado=1");
                });
            });
        } else {
            db.query(query, params, (err) => {
                if (err) return res.status(500).send("Erro interno");
                res.redirect("/configuracoes?editado=1");
            });
        }
    }
});

// DELETAR MENSAGEM
router.post("/notificacoes/global/deletar/:id", (req, res) => {
    if (!req.session.user || req.session.user.tipo_usuario !== 'admin') {
        return res.status(401).send("Acesso negado");
    }

    const notifId = req.params.id;

    // Busca o nome do arquivo para excluí-lo fisicamente
    db.query("SELECT imagem FROM notificacoes_globais WHERE id = ?", [notifId], (errSel, results) => {
        if (!errSel && results.length > 0 && results[0].imagem) {
            const caminhoFisico = path.join(__dirname, "..", "uploads", results[0].imagem);
            if (fs.existsSync(caminhoFisico)) {
                fs.unlinkSync(caminhoFisico); // Apaga a foto ao deletar a mensagem
            }
        }

        db.query("DELETE FROM notificacoes_globais WHERE id = ?", [notifId], (err) => {
            if (err) {
                console.error("Erro ao deletar notificação:", err);
                return res.status(500).send("Erro interno");
            }
            res.redirect("/configuracoes?excluido=1");
        });
    });
});

// CONFIGURAÇÃO DAS UNIDADES E CHAVES OMIE
const EMPRESAS_OMIE = {
    [process.env.OMIE_ECO_CMC_APP_KEY]: {
        nome: "ECO CMC",
        secret: process.env.OMIE_ECO_CMC_APP_SECRET
    },
    [process.env.OMIE_ECO_BA_APP_KEY]: {
        nome: "ECO BA",
        secret: process.env.OMIE_ECO_BA_APP_SECRET
    }
};

// FUNÇÃO AUXILIAR: BUSCAR PEDIDO E CLIENTE NO OMIE
async function buscarDetalhesOmie(appKey, appSecret, idPedido, idCliente) {
    try {
        // 1. Busca os Itens e Detalhes do Pedido
        const reqPedido = await fetch("https://app.omie.com.br/api/v1/produtos/pedido/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                call: "ConsultarPedido",
                app_key: appKey,
                app_secret: appSecret,
                param: [{ codigo_pedido: idPedido }]
            })
        });
        const jsonPedido = await reqPedido.json();

        // 2. Busca o Nome do Cliente
        const reqCliente = await fetch("https://app.omie.com.br/api/v1/geral/clientes/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                call: "ConsultarCliente",
                app_key: appKey,
                app_secret: appSecret,
                param: [{ codigo_cliente_omie: idCliente }]
            })
        });
        const jsonCliente = await reqCliente.json();

        return {
            pedido: jsonPedido.pedido_venda_produto || null,
            cliente: jsonCliente || {}
        };
    } catch (error) {
        console.error("❌ Erro na API do Omie:", error);
        return null;
    }
}

// WEBHOOK OMIE - ROTA ÚNICA E UNIFICADA
router.post("/webhook/omie/pedidos", async (req, res) => {
    const payload = req.body;
    const io = req.app.get("io");
    const dbPromise = db.promise();

    // SALVAR O LOG NO BANCO DE DADOS
    try {
        const topicoStr = payload.topic || (payload.ping ? 'PING' : 'DESCONHECIDO');
        const appKeyStr = payload.appKey || 'N/A';
        const payloadJsonStr = JSON.stringify(payload);

        await dbPromise.query(
            "INSERT INTO webhook_logs (topico, app_key, payload) VALUES (?, ?, ?)",
            [topicoStr, appKeyStr, payloadJsonStr]
        );
    } catch (logErr) {
        console.error("Erro ao salvar log do webhook no banco de dados:", logErr);
    }

    if (io) {
        io.emit("webhook_omie_recebido", { payload: payload });
    }

    if (payload && payload.ping) {
        console.log(`[Omie Webhook] 📡 PING recebido com sucesso.`);
        return res.status(200).json({ message: "pong" });
    }
    
    if (!payload || !payload.topic || !payload.event) return res.status(200).send("OK");

    const event = payload.event;
    const appKey = payload.appKey;
    console.log(`\n[Omie Webhook] 📥 Iniciando processamento... Tópico: ${payload.topic} | Pedido: #${event.numeroPedido}`);

    const empresaConfig = EMPRESAS_OMIE[appKey];
    if (!empresaConfig) {
        console.log(`[Omie Webhook] ⚠️ AppKey não reconhecida. Abortando.`);
        return res.status(200).send("OK");
    }

    const ETAPA_GATILHO = "20"; 

    try {
        // =========================================================================
        // AÇÃO 1: ETAPA ALTERADA -> CRIAR NOVO CARD
        // =========================================================================
        if (payload.topic === "VendaProduto.EtapaAlterada" && event.etapa === ETAPA_GATILHO) {
            console.log(`[Omie Webhook] 🔍 Verificando se o pedido #${event.numeroPedido} já existe no Kanban...`);
            const [jaExiste] = await dbPromise.query("SELECT id FROM kanban_cards WHERE titulo LIKE ?", [`%${event.numeroPedido} - %`]);
            if (jaExiste.length > 0) {
                console.log(`[Omie Webhook] ⏭️ Pedido #${event.numeroPedido} já existe. Ignorando criação.`);
                return res.status(200).send("OK");
            }

            console.log(`[Omie Webhook] 📡 Buscando detalhes do pedido #${event.numeroPedido} na API do Omie...`);
            const dados = await buscarDetalhesOmie(appKey, empresaConfig.secret, event.idPedido, event.idCliente);
            if (!dados || !dados.pedido) {
                console.log(`[Omie Webhook] ❌ Falha ao buscar dados do pedido #${event.numeroPedido}.`);
                return res.status(200).send("OK");
            }

            const cli = dados.cliente;
            const clienteNome = cli.nome_fantasia || cli.razao_social || "Cliente Desconhecido";
            const autor = payload.author && payload.author.name ? payload.author.name.toUpperCase() : "SISTEMA";

            const tituloCard = `${event.numeroPedido} - ${clienteNome} - (${autor}) - ${empresaConfig.nome}`;

            let prazo = null;
            if (dados.pedido.cabecalho.data_previsao) {
                prazo = dados.pedido.cabecalho.data_previsao.split('/').reverse().join('-');
            }

            console.log(`[Omie Webhook] 📝 Montando descrição para o novo card...`);
            const itens = dados.pedido.det || [];
            const obsGeral = dados.pedido.observacoes && dados.pedido.observacoes.obs_venda
                ? dados.pedido.observacoes.obs_venda
                : "";

            let descricaoCard = "";
            if (obsGeral) {
                descricaoCard += `<div style="font-weight:bold; margin-bottom:5px; color: #ffc107;"><i class="fa-solid fa-circle-exclamation"></i> OBSERVAÇÕES DO PEDIDO</div>`;
                descricaoCard += `<div style="margin-bottom:15px; padding: 10px; background: rgba(255,193,7,0.1); border-left: 3px solid #ffc107; border-radius: 4px; font-size: 0.85rem;">${obsGeral.replace(/\n/g, '<br>')}</div>`;
            }
            descricaoCard += `<div style="font-weight:bold; margin-bottom:10px;">ITENS DO PEDIDO</div>`;
            itens.forEach(item => {
                const obsItem = item.observacao && item.observacao.obs_item
                    ? ` - ${item.observacao.obs_item.trim()}`
                    : "";
                // Uso de checkbox interativo e formatado desde a criação
                descricaoCard += `<div style="margin-bottom: 6px;"><input type="checkbox" style="cursor: pointer; margin-right: 6px;"> ${item.produto.descricao} <b>x ${item.produto.quantidade}</b>${obsItem}</div>`;
            });

            const [col] = await dbPromise.query("SELECT id FROM kanban_colunas WHERE titulo LIKE '%Pedidos%' LIMIT 1");
            const colunaId = col.length > 0 ? col[0].id : 1;

            const [insert] = await dbPromise.query(
                "INSERT INTO kanban_cards (coluna_id, titulo, descricao, ordem, prazo, concluido, prioridade) VALUES (?, ?, ?, 999, ?, 0, 'normal')",
                [colunaId, tituloCard, descricaoCard, prazo]
            );

            await dbPromise.query("INSERT INTO kanban_historico (card_id, acao, usuario) VALUES (?, 'Criado via Omie Webhook', 'Omie')", [insert.insertId]);
            console.log(`[Omie Webhook] ✅ Card criado com sucesso: ${tituloCard}`);

            if (io) {
                const [rows] = await dbPromise.query("SELECT * FROM kanban_cards WHERE id = ?", [insert.insertId]);
                const novoCard = rows[0];
                novoCard.isOmie = true; 
                io.emit("card_criado", novoCard);
                
                io.emit("webhook_omie_recebido", {
                    resumo: `O pedido #${event.numeroPedido} (${clienteNome}) foi importado com sucesso!`,
                    status: "Sucesso",
                    payload: payload
                });
            }
        }

        // =========================================================================
        // AÇÃO 2: PEDIDO ALTERADO -> ATUALIZAR PRAZO, MESCLAR DESCRIÇÃO E EXCLUIR ITENS NO KANBAN
        // =========================================================================
        if (payload.topic === "VendaProduto.Alterada") {
            const idPedido = event.idPedido;
            const numeroPedido = event.numeroPedido;

            const [cardsExistentes] = await dbPromise.query("SELECT * FROM kanban_cards WHERE titulo LIKE ?", [`%${numeroPedido} - %`]);

            if (cardsExistentes.length > 0) {
                const cardAlvo = cardsExistentes[0];
                console.log(`[Omie Webhook] 🔄 Pedido #${numeroPedido} alterado no Omie. Iniciando mesclagem inteligente...`);

                console.log(`[Omie Webhook] 📡 Buscando dados atualizados na API do Omie...`);
                const dadosCompletos = await buscarDetalhesOmie(appKey, empresaConfig.secret, idPedido, event.idCliente);

                if (dadosCompletos && dadosCompletos.pedido) {
                    
                    // 1. Atualização do Prazo
                    const dataPrevisao = dadosCompletos.pedido.cabecalho.data_previsao;
                    let prazoFormatado = null;
                    if (dataPrevisao) {
                        const partes = dataPrevisao.split('/');
                        if (partes.length === 3) prazoFormatado = `${partes[2]}-${partes[1]}-${partes[0]}`;
                    }

                    const itens = dadosCompletos.pedido.det || [];
                    const obsGeral = dadosCompletos.pedido.observacoes && dadosCompletos.pedido.observacoes.obs_venda
                        ? dadosCompletos.pedido.observacoes.obs_venda
                        : "";

                    const dbDesc = cardAlvo.descricao || "";
                    let novaDescricao = dbDesc;
                    let houveMudancaItens = false;

                    // =========================================================================
                    // FASE A: DETECÇÃO E EXCLUSÃO DE ITENS REMOVIDOS NO OMIE
                    // =========================================================================
                    console.log(`[Omie Webhook] ⚙️ FASE A: Verificando se há itens excluídos...`);
                    const nomesOmieAtuais = itens.map(item => item.produto.descricao.trim());
                    
                    const regexItemRow = /<div style="margin-bottom: 6px;"><input type="checkbox"[^>]*>\s*([^<]+?)\s*<b>x \d+<\/b>[\s\S]*?<\/div>/gi;
                    
                    novaDescricao = novaDescricao.replace(regexItemRow, (match, nomeNoHtml) => {
                        const nomeLimpo = nomeNoHtml.trim();
                        if (nomesOmieAtuais.includes(nomeLimpo)) {
                            return match; 
                        } else {
                            console.log(`[Omie Webhook] 🗑️ Item removido detectado: ${nomeLimpo}. Excluindo do Card...`);
                            houveMudancaItens = true;
                            return ""; 
                        }
                    });

                    // =========================================================================
                    // FASE B: ATUALIZAR QUANTIDADES E INSERIR NOVOS ITENS
                    // =========================================================================
                    console.log(`[Omie Webhook] ⚙️ FASE B: Verificando quantidades e novos itens adicionados...`);
                    if (!novaDescricao.includes("ITENS DO PEDIDO") && itens.length > 0) {
                        novaDescricao += `<br><div style="font-weight:bold; margin-bottom:10px; margin-top:10px;">ITENS DO PEDIDO</div>`;
                    }

                    itens.forEach(item => {
                        const prodDesc = item.produto.descricao;
                        const prodQtd = item.produto.quantidade;
                        const obsItem = item.observacao && item.observacao.obs_item ? ` - ${item.observacao.obs_item.trim()}` : "";
                        
                        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regexBuscaProduto = new RegExp(escapeRegExp(prodDesc) + "\\s*<b>x (\\d+)</b>", "i");
                        
                        const match = novaDescricao.match(regexBuscaProduto);

                        if (match) {
                            const qtdAntiga = match[1];
                            if (qtdAntiga != prodQtd) {
                                console.log(`[Omie Webhook] ✏️ Quantidade atualizada no item: ${prodDesc} (de ${qtdAntiga} para ${prodQtd})`);
                                const strAntiga = match[0];
                                const strNova = strAntiga.replace(`<b>x ${qtdAntiga}</b>`, `<b>x ${prodQtd}</b>`);
                                novaDescricao = novaDescricao.replace(strAntiga, strNova);
                                houveMudancaItens = true;
                            }
                        } else {
                            console.log(`[Omie Webhook] ➕ Novo item detectado: ${prodDesc} x ${prodQtd}`);
                            const htmlNovoItem = `<div style="margin-bottom: 6px;"><input type="checkbox" style="cursor: pointer; margin-right: 6px;"> ${prodDesc} <b>x ${prodQtd}</b>${obsItem}</div>`;
                            novaDescricao += htmlNovoItem;
                            houveMudancaItens = true;
                        }
                    });

                    // =========================================================================
                    // FASE C: ATUALIZAR OBSERVAÇÕES GERAIS
                    // =========================================================================
                    console.log(`[Omie Webhook] ⚙️ FASE C: Verificando observações de venda...`);
                    const obsGeralClean = obsGeral.replace(/\n/g, '<br>');
                    if (obsGeralClean && !dbDesc.includes(obsGeralClean)) {
                        console.log(`[Omie Webhook] 💬 Nova observação de venda encontrada e anexada ao card.`);
                        const alertaNovaObs = `<div style="margin-top:10px; margin-bottom:10px; padding: 10px; background: rgba(13,110,253,0.1); border-left: 3px solid #0d6efd; border-radius: 4px; font-size: 0.85rem;"><i class="fa-solid fa-info-circle"></i> <b>Nota atualizada no Omie:</b><br>${obsGeralClean}</div>`;
                        novaDescricao = alertaNovaObs + novaDescricao;
                        houveMudancaItens = true;
                    }

                    const prazoBancoStr = cardAlvo.prazo ? new Date(cardAlvo.prazo).toISOString().split('T')[0] : null;
                    const mudouPrazo = prazoFormatado !== prazoBancoStr;
                    console.log(`[Omie Webhook] 🕒 Prazos analisados. Banco (${prazoBancoStr || 'Vazio'}) vs Omie (${prazoFormatado || 'Vazio'}) -> Mudou? ${mudouPrazo}`);

                    if (mudouPrazo || houveMudancaItens) {
                        console.log(`[Omie Webhook] 💾 Alterações confirmadas. Salvando dados no banco...`);
                        await dbPromise.query(
                            "UPDATE kanban_cards SET prazo = ?, descricao = ? WHERE id = ?", 
                            [prazoFormatado, novaDescricao, cardAlvo.id]
                        );

                        let msgHistorico = 'Pedido atualizado via Omie';
                        if (mudouPrazo && !houveMudancaItens) msgHistorico = 'Prazo atualizado via Omie';
                        else if (houveMudancaItens && !mudouPrazo) msgHistorico = 'Itens/Observações atualizados via Omie';

                        await dbPromise.query("INSERT INTO kanban_historico (card_id, acao, usuario) VALUES (?, ?, 'Omie')", [cardAlvo.id, msgHistorico]);

                        if (io) {
                            const [cardAtualizado] = await dbPromise.query("SELECT * FROM kanban_cards WHERE id = ?", [cardAlvo.id]);
                            cardAtualizado[0].isOmie = true;
                            io.emit("card_atualizado", cardAtualizado[0]);
                            
                            io.emit("webhook_omie_recebido", {
                                resumo: `O Pedido #${numeroPedido} sofreu atualizações no Kanban! (${msgHistorico})`,
                                status: "Sucesso",
                                payload: payload
                            });
                        }
                        console.log(`[Omie Webhook] ✅ Fluxo concluído com sucesso para #${numeroPedido}.`);
                    } else {
                        console.log(`[Omie Webhook] ⏭️ Nenhuma divergência estrutural detectada no pedido #${numeroPedido}. Nenhuma ação necessária.`);
                    }
                }
            } else {
                console.log(`[Omie Webhook] ⏭️ Pedido #${numeroPedido} alterado no Omie, mas não existe no Kanban. Ignorando.`);
            }
        }

    } catch (error) {
        console.error("[Omie Webhook] ❌ Erro Crítico no processamento do Webhook:", error);
    }

    return res.status(200).send("OK");
});

// BUSCAR O HISTÓRICO DE LOGS (EXIBIR NA TELA DE CONFIGURAÇÕES)
router.get("/webhook/omie/logs", async (req, res) => {
    try {
        // Traz os últimos 50 eventos registados, do mais recente para o mais antigo
        const [logs] = await db.promise().query("SELECT * FROM webhook_logs ORDER BY criado_em ASC LIMIT 50");
        res.json({ success: true, logs });
    } catch (error) {
        console.error("Erro ao buscar logs do webhook:", error);
        res.status(500).json({ success: false, error: "Erro ao buscar logs" });
    }
});

module.exports = router;