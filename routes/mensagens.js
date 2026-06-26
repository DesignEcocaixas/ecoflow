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

// Função para buscar dados completos (Pedido + Cliente)
async function buscarDetalhesOmie(appKey, appSecret, idPedido, idCliente) {
    try {
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
        console.error("Erro na API do Omie:", error);
        return null;
    }
}

router.post("/webhook/omie/pedidos", async (req, res) => {
    const payload = req.body;
    const io = req.app.get("io");

    if (payload && payload.ping) return res.status(200).json({ message: "pong" });
    if (!payload || !payload.topic || !payload.event) return res.status(200).send("OK");

    const event = payload.event;
    const credenciais = { secret: "SUA_SECRET_AQUI" }; // Substitua pela sua lógica de credenciais
    const dbPromise = db.promise();
    const ETAPA_GATILHO = "20"; 

    try {
        if (payload.topic === "VendaProduto.EtapaAlterada" && event.etapa === ETAPA_GATILHO) {
            
            // Verificação de duplicidade
            const [jaExiste] = await dbPromise.query("SELECT id FROM kanban_cards WHERE titulo LIKE ?", [`%${event.numeroPedido} - %`]);
            if (jaExiste.length > 0) return res.status(200).send("OK");

            const dados = await buscarDetalhesOmie(payload.appKey, credenciais.secret, event.idPedido, event.idCliente);
            if (!dados || !dados.pedido) return res.status(200).send("OK");

            // Preparação dos dados
            const cli = dados.cliente;
            const clienteNome = cli.nome_fantasia || cli.razao_social || "Cliente Desconhecido";
            const itens = dados.pedido.det || [];
            const prazo = dados.pedido.cabecalho.data_previsao.split('/').reverse().join('-'); 

            const tituloCard = `${event.numeroPedido} - ${clienteNome}`;
            
            let descricaoCard = `<div style="font-weight:bold; margin-bottom:10px;">ITENS</div>`;
            itens.forEach(item => {
                descricaoCard += `<div><input type="checkbox" disabled> ${item.produto.descricao} x ${item.produto.quantidade}</div>`;
            });

            // Busca coluna correta
            const [col] = await dbPromise.query("SELECT id FROM kanban_colunas WHERE titulo LIKE '%Pedidos%' LIMIT 1");
            const colunaId = col.length > 0 ? col[0].id : 1;

            // Inserção compatível com sua estrutura
            await dbPromise.query(
                "INSERT INTO kanban_cards (coluna_id, titulo, descricao, ordem, prazo, concluido) VALUES (?, ?, ?, 999, ?, 0)",
                [colunaId, tituloCard, descricaoCard, prazo]
            );

            console.log(`✅ Card criado: ${tituloCard}`);
        }
    } catch (error) {
        console.error("Erro no Webhook:", error);
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