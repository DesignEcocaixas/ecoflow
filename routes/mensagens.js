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
            // Aqui resolvemos a pegadinha do Omie!
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

    // NOVO: SALVAR O LOG NO BANCO DE DADOS ANTES DE QUALQUER COISA
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

    // 1. EMITE PARA O CONSOLE VISUAL (Na tela de Configurações)
    if (io) {
        io.emit("webhook_omie_recebido", { payload: payload });
    } else {
        console.log("[Omie Webhook Recebido]", payload);
    }

    // 2. RESPONDE AO PING DO OMIE
    if (payload && payload.ping) return res.status(200).json({ message: "pong" });

    // Valida se o payload tem dados
    if (!payload || !payload.topic || !payload.event) return res.status(200).send("OK");

    const event = payload.event;
    const appKey = payload.appKey;

    // Busca dinamicamente a empresa e o secret correto!
    const empresaConfig = EMPRESAS_OMIE[appKey];
    if (!empresaConfig) {
        console.log("AppKey não configurada no sistema:", appKey);
        return res.status(200).send("OK");
    }

    const ETAPA_GATILHO = "20"; // Etapa para capturar o evento

    try {
        // AÇÃO 1: ETAPA ALTERADA -> CRIAR NOVO CARD
        if (payload.topic === "VendaProduto.EtapaAlterada" && event.etapa === ETAPA_GATILHO) {

            // Verificação de duplicidade na tabela kanban_cards
            const [jaExiste] = await dbPromise.query("SELECT id FROM kanban_cards WHERE titulo LIKE ?", [`%${event.numeroPedido} - %`]);
            if (jaExiste.length > 0) return res.status(200).send("OK");

            // Busca os detalhes na API (usando a secret dinâmica)
            const dados = await buscarDetalhesOmie(appKey, empresaConfig.secret, event.idPedido, event.idCliente);
            if (!dados || !dados.pedido) return res.status(200).send("OK");

            // Preparação dos dados para a estrutura do Ecoflow
            const cli = dados.cliente;
            const clienteNome = cli.nome_fantasia || cli.razao_social || "Cliente Desconhecido";
            const autor = payload.author && payload.author.name ? payload.author.name.toUpperCase() : "SISTEMA";

            const tituloCard = `${event.numeroPedido} - ${clienteNome} - (${autor}) - ${empresaConfig.nome}`;

            let prazo = null;
            if (dados.pedido.cabecalho.data_previsao) {
                prazo = dados.pedido.cabecalho.data_previsao.split('/').reverse().join('-');
            }

            // 3. Coluna 'descricao' (Com observações da venda e dos itens)
            const itens = dados.pedido.det || [];

            // Puxa a observação geral do pedido, se existir
            const obsGeral = dados.pedido.observacoes && dados.pedido.observacoes.obs_venda
                ? dados.pedido.observacoes.obs_venda
                : "";

            let descricaoCard = "";
            // Se houver observação geral, cria uma caixa de destaque amarela
            if (obsGeral) {
                descricaoCard += `<div style="font-weight:bold; margin-bottom:5px; color: #ffc107;"><i class="fa-solid fa-circle-exclamation"></i> OBSERVAÇÕES DO PEDIDO</div>`;
                // O .replace(/\n/g, '<br>') garante que as quebras de linha que o comercial deu no Omie apareçam certinhas no Kanban
                descricaoCard += `<div style="margin-bottom:15px; padding: 10px; background: rgba(255,193,7,0.1); border-left: 3px solid #ffc107; border-radius: 4px; font-size: 0.85rem;">${obsGeral.replace(/\n/g, '<br>')}</div>`;
            }
            descricaoCard += `<div style="font-weight:bold; margin-bottom:10px;">ITENS DO PEDIDO</div>`;
            itens.forEach(item => {
                // Se existir observação no item, adiciona o " - Texto", senão, fica vazio
                const obsItem = item.observacao && item.observacao.obs_item
                    ? ` - ${item.observacao.obs_item.trim()}`
                    : "";

                descricaoCard += `<div style="margin-bottom: 6px;"><input type="checkbox" disabled> ${item.produto.descricao} <b>x ${item.produto.quantidade}</b>${obsItem}</div>`;
            });

            // Busca a coluna "Pedidos" ou usa a ID 1 como fallback
            const [col] = await dbPromise.query("SELECT id FROM kanban_colunas WHERE titulo LIKE '%Pedidos%' LIMIT 1");
            const colunaId = col.length > 0 ? col[0].id : 1;

            // Insere o Card
            const [insert] = await dbPromise.query(
                "INSERT INTO kanban_cards (coluna_id, titulo, descricao, ordem, prazo, concluido, prioridade) VALUES (?, ?, ?, 999, ?, 0, 'normal')",
                [colunaId, tituloCard, descricaoCard, prazo]
            );

            await dbPromise.query("INSERT INTO kanban_historico (card_id, acao, usuario) VALUES (?, 'Criado via Omie Webhook', 'Omie')", [insert.insertId]);
            console.log(`✅ Card criado: ${tituloCard}`);

            if (io) {
                const [rows] = await dbPromise.query("SELECT * FROM kanban_cards WHERE id = ?", [insert.insertId]);
                io.emit("card_criado", rows[0]);
            }
        }

        // AÇÃO 2: PEDIDO ALTERADO -> ATUALIZAR PRAZO NO KANBAN
        if (payload.topic === "VendaProduto.Alterada") {
            const idPedido = event.idPedido;
            const numeroPedido = event.numeroPedido;

            // 1. Verifica se já existe um card no Kanban para este pedido
            const [cardsExistentes] = await dbPromise.query("SELECT * FROM kanban_cards WHERE titulo LIKE ?", [`%${numeroPedido} - %`]);

            if (cardsExistentes.length > 0) {
                const cardAlvo = cardsExistentes[0];
                console.log(`[Omie] Pedido #${numeroPedido} alterado no Omie. Verificando nova data...`);

                // 2. Busca os dados atualizados na API do Omie
                const dadosCompletos = await buscarDetalhesOmie(appKey, empresaConfig.secret, idPedido, event.idCliente);

                if (dadosCompletos && dadosCompletos.pedido) {
                    const dataPrevisao = dadosCompletos.pedido.cabecalho.data_previsao;

                    let prazoFormatado = null;
                    if (dataPrevisao) {
                        const partes = dataPrevisao.split('/');
                        if (partes.length === 3) prazoFormatado = `${partes[2]}-${partes[1]}-${partes[0]}`;
                    }

                    // 3. Compara a data do banco com a nova data
                    const prazoBancoStr = cardAlvo.prazo ? new Date(cardAlvo.prazo).toISOString().split('T')[0] : null;

                    if (prazoFormatado && prazoFormatado !== prazoBancoStr) {
                        // Atualiza a data no banco de dados
                        await dbPromise.query("UPDATE kanban_cards SET prazo = ? WHERE id = ?", [prazoFormatado, cardAlvo.id]);

                        await dbPromise.query("INSERT INTO kanban_historico (card_id, acao, usuario) VALUES (?, 'Prazo atualizado via Omie', 'Omie')", [cardAlvo.id]);

                        // 4. Emite o evento do Socket.io para mover o card visualmente
                        if (io) {
                            const [cardAtualizado] = await dbPromise.query("SELECT * FROM kanban_cards WHERE id = ?", [cardAlvo.id]);
                            io.emit("card_atualizado", cardAtualizado[0]);
                            io.emit("webhook_omie_recebido", {
                                resumo: `Data do Pedido #${numeroPedido} atualizada para ${dataPrevisao}!`,
                                status: "Sucesso",
                                payload: payload
                            });
                        }
                        console.log(`✅ Prazo do pedido #${numeroPedido} atualizado automaticamente para ${prazoFormatado}.`);
                    } else {
                        console.log(`[Omie] O pedido #${numeroPedido} foi alterado, mas a data de previsão continua a mesma.`);
                    }
                }
            }
        }

    } catch (error) {
        console.error("Erro no processamento do Webhook Omie:", error);
    }

    //O retorno de OK deve acontecer no final da função para liberar o Omie rapidamente
    return res.status(200).send("OK");
});

// NOVO: ROTA PARA BUSCAR O HISTÓRICO DE LOGS (EXIBIR NA TELA DE CONFIGURAÇÕES)
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