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
    "6855005144988": { 
        nome: "ECO CMC", 
        secret: "51686239198d05bcc4312a45cc6b9263" 
    },
    "4367695632300": { 
        nome: "ECO BA", 
        secret: "7b5cc60e8d6a2b115e91fb997dd3f6df"
    }
};

// FUNÇÃO AUXILIAR: BUSCAR PEDIDO COMPLETO NO OMIE (COM LOGS DETALHADOS)
async function buscarPedidoCompletoOmie(appKey, appSecret, codigoPedido) {
    try {
        console.log(`[Omie API] Enviando requisição -> AppKey: ${appKey} | CodigoPedido: ${codigoPedido}`);
        
        const response = await fetch("https://app.omie.com.br/api/v1/produtos/pedido/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                call: "ConsultarPedido",
                app_key: appKey,
                app_secret: appSecret,
                param: [{ codigo_pedido: codigoPedido }]
            })
        });
        
        // Vamos ler a resposta como texto puro primeiro para podermos ver o erro
        const textResponse = await response.text();
        
        if (!response.ok) {
            console.error(`[Omie API] O Omie recusou a chamada! Status HTTP: ${response.status}`);
            console.error(`[Omie API] Motivo do erro:`, textResponse);
            return null;
        }
        
        // Se deu tudo certo, transforma em JSON
        return JSON.parse(textResponse);
    } catch (error) {
        console.error("❌ Erro de conexão com a API do Omie:", error);
        return null;
    }
}

// WEBHOOK OMIE - RECEPÇÃO E INTEGRAÇÃO KANBAN
router.post("/webhook/omie/pedidos", async (req, res) => {
    const payload = req.body;
    const io = req.app.get("io");

    // 1. Emite para o Console de Testes na tela de Configurações
    if (io) io.emit("webhook_omie_recebido", { payload: payload });

    // 2. Ping de validação do Omie
    if (payload && payload.ping) return res.status(200).json({ message: "pong" });

    // 3. Verifica se tem o evento esperado
    if (!payload || !payload.topic || !payload.event) return res.status(200).send("OK");

    const topic = payload.topic;
    const event = payload.event;
    const appKey = payload.appKey;
    const credenciais = EMPRESAS_OMIE[appKey];

    // DEFINIÇÃO DA ETAPA GATILHO (Ex: "20" = Pedido de Venda)
    const ETAPA_GATILHO = "20";

    const dbPromise = db.promise();

    try {
        // =======================================================
        // AÇÃO: ETAPA ALTERADA PARA "20" -> CONSULTAR API -> CRIAR CARD
        // =======================================================
        if (topic === "VendaProduto.EtapaAlterada" && credenciais && event.etapa === ETAPA_GATILHO) {
            const idPedido = event.idPedido;
            const numeroPedido = event.numeroPedido;
            const autor = payload.author && payload.author.name ? payload.author.name : "OMIE";

            // Impede duplicação (Se a etapa for "20" mais de uma vez, cria o card só 1 vez)
            const [jaExiste] = await dbPromise.query("SELECT id FROM kanban_cards WHERE titulo LIKE ?", [`%${numeroPedido} - %`]);
            if (jaExiste.length > 0) {
                console.log(`[Omie] Pedido #${numeroPedido} avançou para a etapa ${ETAPA_GATILHO}, mas já possui card no Kanban. Ignorado.`);
                return res.status(200).send("OK");
            }

            console.log(`[Omie] Consultando dados completos do Pedido #${numeroPedido}...`);
            const dadosCompletos = await buscarPedidoCompletoOmie(appKey, credenciais.secret, idPedido);

            if (!dadosCompletos || !dadosCompletos.pedido) {
                console.error(`[Omie] Falha ao consultar o pedido #${numeroPedido} na API.`);
                return res.status(200).send("OK");
            }

            // --- EXTRAÇÃO DE DADOS FORMATADOS ---
            const clienteNome = dadosCompletos.cliente.nome_fantasia || dadosCompletos.cliente.razao_social || "Cliente Desconhecido";
            const dataPrevisao = dadosCompletos.pedido.cabecalho.data_previsao;
            const itens = dadosCompletos.pedido.det || [];
            
            // Tratamento do Prazo para o padrão do Banco (YYYY-MM-DD)
            let prazoFormatado = null;
            if (dataPrevisao) {
                const partes = dataPrevisao.split('/');
                if (partes.length === 3) prazoFormatado = `${partes[2]}-${partes[1]}-${partes[0]}`;
            }

            // --- 1. TÍTULO DO CARD ---
            const tituloCard = `${numeroPedido} - ${clienteNome} - (${autor.toUpperCase()}) - ${credenciais.nome}`;

            // --- 2. DESCRIÇÃO DO CARD (CHECKLIST) ---
            let descricaoCard = `
                <div style="font-size: 0.95rem; font-weight: bold; margin-bottom: 20px;">VERIFICAR</div>
                <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 15px;">
                    <div style="display: flex; align-items: center; gap: 8px; font-weight: bold; margin-bottom: 15px; color: #fff;">
                        <i class="fa-regular fa-square-check" style="color: #08c068;"></i> ITENS
                    </div>
            `;

            itens.forEach(item => {
                const descProd = item.produto.descricao || "Produto";
                const qtd = item.produto.quantidade || 0;
                const obs = item.observacao && item.observacao.obs_item ? ` - <span style="color: #ffc107;">${item.observacao.obs_item}</span>` : "";
                
                descricaoCard += `
                    <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; font-size: 0.85rem; color: rgba(255,255,255,0.8);">
                        <input type="checkbox" disabled style="margin-top: 4px; opacity: 0.5;">
                        <div>
                            ${descProd} <strong>x ${qtd}</strong>${obs}
                        </div>
                    </div>
                `;
            });

            descricaoCard += `</div>`; 

            // --- 3. DESCOBRIR A COLUNA DE DESTINO CORRETA ---
            let colunaDestinoId = null;
            
            const queryBuscaColuna = `
                SELECT c.id 
                FROM kanban_colunas c
                INNER JOIN espacos_trabalho e ON c.espaco_id = e.id
                WHERE e.nome LIKE '%Produção%' AND c.titulo LIKE '%Pedidos%'
                LIMIT 1
            `;
            const [colsFound] = await dbPromise.query(queryBuscaColuna);
            
            if (colsFound.length > 0) {
                colunaDestinoId = colsFound[0].id;
            } else {
                const [primeiraCol] = await dbPromise.query("SELECT id FROM kanban_colunas ORDER BY espaco_id ASC, ordem ASC LIMIT 1");
                if (primeiraCol.length > 0) colunaDestinoId = primeiraCol[0].id;
            }

            // --- 4. INSERIR NO BANCO DE DADOS ---
            if (colunaDestinoId) {
                const [insert] = await dbPromise.query(
                    "INSERT INTO kanban_cards (coluna_id, titulo, descricao, ordem, prazo, concluido, prioridade) VALUES (?, ?, ?, 999, ?, 0, 'normal')",
                    [colunaDestinoId, tituloCard, descricaoCard, prazoFormatado]
                );

                await dbPromise.query("INSERT INTO kanban_historico (card_id, acao, usuario) VALUES (?, 'Card gerado e detalhado via Omie', 'Omie Bot')", [insert.insertId]);

                // Atualiza a tela em tempo real
                if (io) {
                    const [rows] = await dbPromise.query("SELECT * FROM kanban_cards WHERE id = ?", [insert.insertId]);
                    io.emit("card_criado", rows[0]);
                }
                console.log(`✅ Sucesso! Card do pedido #${numeroPedido} criado na Produção.`);
            }
        }
    } catch (error) {
        console.error("Erro interno no Webhook Omie:", error);
    }

    return res.status(200).send("OK");
});

// WEBHOOK OMIE - CONSOLE DE INTEGRAÇÃO (TESTE)
router.post("/webhook/omie/pedidos", (req, res) => {
    const payload = req.body;

    // Tenta enviar o evento para o WebSocket (para aparecer no Console do navegador)
    const io = req.app.get("io");
    if (io) {
        io.emit("webhook_omie_recebido", { payload: payload });
    } else {
        // Se o WebSocket não estiver a escutar, imprime no terminal de logs do servidor
        console.log("[Omie Webhook Recebido]", payload);
    }

    // O Omie envia um evento inicial de Ping ao adicionar a URL no painel deles
    if (payload && payload.ping) {
        return res.status(200).json({ message: "pong" });
    }

    // Retorna SEMPRE 200 OK para dizer ao Omie que a mensagem chegou com sucesso (evita bloqueios)
    return res.status(200).send("OK");
});

module.exports = router;