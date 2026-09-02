const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");

// Importações de Upload e Segurança
const { uploadKanban } = require("../config/uploadConfig");
const { isLogged } = require("../middlewares/authMiddleware");

// View
const kanbanView = require("../views/kanbanView");

//------------------------------------------------------------------------------ROTAS PARA KANBAN------------------------------------------------------------------------------
//LISTAR COLUNAS/CARDS E ETIQUETAS
router.get("/kanban", isLogged, (req, res) => {
    const espaco_id = req.query.espaco_id;

    if (!espaco_id) {
        return res.redirect("/espacos-trabalho");
    }

    db.query("SELECT * FROM espacos_trabalho WHERE id = ?", [espaco_id], (err, espacosResult) => {
        if (err || espacosResult.length === 0) return res.redirect("/espacos-trabalho");
        const espacoAtual = espacosResult[0];

        // Busca os colaboradores para popular os selects de "Operador" na View
        db.query("SELECT id, nome, tipo_usuario, foto FROM usuarios", (errUsu, colaboradoresResult) => {
            const listaColaboradores = colaboradoresResult || [];

            // 1. Busca as etiquetas deste espaço
            db.query("SELECT * FROM kanban_etiquetas WHERE espaco_id = ?", [espaco_id], (err, etiquetas) => {
                espacoAtual.etiquetas = etiquetas || [];

                // 2. Busca as colunas
                db.query("SELECT * FROM kanban_colunas WHERE espaco_id = ? ORDER BY ordem ASC", [espaco_id], (err, colunas) => {
                    if (err) return res.status(500).send("Erro ao carregar colunas.");

                    if (colunas.length === 0) {
                        return res.send(kanbanView(req.session.user, [], espacoAtual, [], listaColaboradores));
                    }

                    const idsColunas = colunas.map(c => c.id);

                    // 3. Busca os cards
                    db.query("SELECT * FROM kanban_cards WHERE coluna_id IN (?) ORDER BY ordem ASC", [idsColunas], (errCards, cards) => {
                        if (errCards) return res.status(500).send("Erro ao carregar cards.");

                        const idsCards = cards.map(c => c.id);
                        if (idsCards.length === 0) {
                            colunas.forEach(col => col.cards = []);
                            return res.send(kanbanView(req.session.user, colunas, espacoAtual, [], listaColaboradores));
                        }

                        // 4. Busca os anexos e as relações de etiquetas simultaneamente
                        db.query("SELECT * FROM kanban_anexos WHERE card_id IN (?)", [idsCards], (errAnexos, anexos) => {
                            db.query("SELECT * FROM kanban_cards_etiquetas WHERE card_id IN (?)", [idsCards], (errEtiquetasCards, relacoes) => {

                                const anexosGerais = anexos || [];
                                const relacoesGerais = relacoes || [];

                                cards.forEach(card => {
                                    // Mapeia anexos
                                    card.anexos = anexosGerais.filter(a => a.card_id === card.id);

                                    // Mapeia as etiquetas cruzando os IDs da tabela de relação com os dados reais
                                    const idsEtiquetasDesteCard = relacoesGerais.filter(r => r.card_id === card.id).map(r => r.etiqueta_id);
                                    card.etiquetas = espacoAtual.etiquetas.filter(e => idsEtiquetasDesteCard.includes(e.id));
                                });

                                // LÓGICA DE LIMPEZA E AVISOS (EXCLUSÃO DINÂMICA)
                                const now = new Date();
                                const cardsParaDeletar = [];
                                const avisosExclusao = [];

                                // ATUALIZAÇÃO: DISTRIBUI OS CARDS NAS COLUNAS E FILTRA OS VENCIDOS
                                colunas.forEach(col => {
                                    let cardsDaColuna = cards.filter(c => c.coluna_id === col.id);

                                    // Se a coluna tiver uma regra de exclusão definida
                                    if (col.dias_exclusao && col.dias_exclusao > 0) {
                                        cardsDaColuna = cardsDaColuna.filter(card => {
                                            const dataCriacao = new Date(card.criado_em);
                                            const diffTime = Math.abs(now - dataCriacao);
                                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                            
                                            if (diffDays >= col.dias_exclusao) {
                                                cardsParaDeletar.push(card.id);
                                                return false; // Remove da renderização visual
                                            } else if (diffDays === (col.dias_exclusao - 1)) {
                                                avisosExclusao.push(`${card.titulo || 'Sem Título'} (Coluna: ${col.titulo})`);
                                            }
                                            return true; // Mantém o card
                                        });
                                    }

                                    col.cards = cardsDaColuna.sort((a, b) => {
                                        // 1. Tratamento para cartões sem prazo (vão para o fim da coluna)
                                        if (!a.prazo && b.prazo) return 1;  
                                        if (a.prazo && !b.prazo) return -1; 
                                        if (!a.prazo && !b.prazo) return 0; 

                                        // 2. Ordenação por data: Menor prazo no topo (ASC)
                                        const dataA = new Date(a.prazo);
                                        const dataB = new Date(b.prazo);

                                        if (dataA.getTime() !== dataB.getTime()) {
                                            return dataA - dataB;
                                        }

                                        // 3. CRITÉRIO DE DESEMPATE
                                        if (a.prioridade === 'alta' && b.prioridade !== 'alta') return -1;
                                        if (b.prioridade === 'alta' && a.prioridade !== 'alta') return 1;

                                        return 0; 
                                    });
                                });

                                // Executa a deleção em background caso hajam cards vencidos
                                if (cardsParaDeletar.length > 0) {
                                    db.query("DELETE FROM kanban_cards WHERE id IN (?)", [cardsParaDeletar], () => {});
                                    db.query("DELETE FROM kanban_anexos WHERE card_id IN (?)", [cardsParaDeletar], () => {});
                                    db.query("DELETE FROM kanban_historico WHERE card_id IN (?)", [cardsParaDeletar], () => {});
                                    db.query("DELETE FROM kanban_cards_etiquetas WHERE card_id IN (?)", [cardsParaDeletar], () => {});
                                }

                                // Passa os avisos formatados e os colaboradores para a View
                                res.send(kanbanView(req.session.user, colunas, espacoAtual, avisosExclusao, listaColaboradores));
                            });
                        });
                    });
                });
            });
        });
    });
});

// ATUALIZAR REGRAS DE EXCLUSÃO AUTOMÁTICA
router.post("/kanban/colunas/exclusao-automatica", isLogged, async (req, res) => {
    try {
        const data = req.body;
        const promises = [];
        
        for (const key in data) {
            if (key.startsWith('col_')) {
                const colId = key.replace('col_', '');
                const dias = parseInt(data[key]) > 0 ? parseInt(data[key]) : null;
                promises.push(db.promise().query("UPDATE kanban_colunas SET dias_exclusao = ? WHERE id = ?", [dias, colId]));
            }
        }
        
        await Promise.all(promises);
        res.json({ success: true });
    } catch (error) {
        console.error("Erro ao atualizar regras de exclusão:", error);
        res.status(500).json({ success: false });
    }
});

// ATUALIZAR STATUS DE PERCAS DO WORKSPACE
router.post("/espacos-trabalho/percas/:id", isLogged, (req, res) => {
    const espacoId = req.params.id;
    const percasAtivo = req.body.percas_ativo === '1' ? 1 : 0;

    db.query("UPDATE espacos_trabalho SET percas_ativo = ? WHERE id = ?", [percasAtivo, espacoId], (err) => {
        if (err) {
            console.error("Erro ao atualizar status de percas:", err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true });
    });
});

// UPLOAD DE WALLPAPER DO ESPAÇO
router.post("/espacos-trabalho/wallpaper/:id", isLogged, uploadKanban.single("wallpaper"), (req, res) => {
    const espacoId = req.params.id;
    
    if (req.body.clear === '1') {
        db.query("UPDATE espacos_trabalho SET wallpaper = NULL WHERE id = ?", [espacoId], (err) => {
            if(err) return res.status(500).json({ success: false });
            res.json({ success: true, cleared: true });
        });
        return;
    }

    if (!req.file) return res.status(400).json({ success: false, message: "Nenhum arquivo enviado." });
    const filePath = "kanban/" + req.file.filename;

    db.query("UPDATE espacos_trabalho SET wallpaper = ? WHERE id = ?", [filePath, espacoId], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, path: '/uploads/' + filePath });
    });
});

//HISTÓRICO CARD KANBAN
router.get("/kanban/historico/:id", isLogged, (req, res) => {
    const cardId = req.params.id;

    const query = `
        SELECT h.*, u.foto 
        FROM kanban_historico h 
        LEFT JOIN usuarios u ON h.usuario COLLATE utf8mb4_unicode_ci = u.nome COLLATE utf8mb4_unicode_ci
        WHERE h.card_id = ? 
        ORDER BY h.criado_em DESC
    `;

    db.query(query, [cardId], (err, historico) => {
        if (err) {
            console.error("Erro ao buscar histórico:", err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, historico });
    });
});

//UPLOAD ANEXOS CARDS KANBAN
router.post("/kanban/anexos/:id", isLogged, uploadKanban.array("anexo"), (req, res) => {
    if (!req.session.user) return res.status(401).send("Não autorizado");

    const cardId = req.params.id;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).send("Nenhum arquivo enviado.");
    }

    const values = files.map(file => [
        cardId,
        file.originalname,
        "kanban/" + file.filename,
        file.mimetype,
        file.path
    ]);

    const query = "INSERT INTO kanban_anexos (card_id, nome_original, nome_arquivo, tipo, caminho) VALUES ?";

    db.query(query, [values], (err, result) => {
        if (err) {
            console.error("Erro ao salvar anexos:", err);
            return res.status(500).send("Erro ao guardar anexo.");
        }
        res.json({ success: true, message: "Anexos salvos com sucesso!" });
    });
});

//EXCLUIR UM ANEXO DO CARD KANBAN
router.delete("/kanban/anexos/:id", isLogged, (req, res) => {
    const anexoId = req.params.id;

    db.query("SELECT * FROM kanban_anexos WHERE id = ?", [anexoId], (err, results) => {
        if (err || results.length === 0) return res.status(404).send("Anexo não encontrado");

        const anexo = results[0];
        const filePath = path.join(__dirname, "uploads", anexo.nome_arquivo);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        db.query("DELETE FROM kanban_anexos WHERE id = ?", [anexoId], (deleteErr) => {
            if (deleteErr) return res.status(500).send("Erro ao excluir registro do banco");
            res.json({ success: true });
        });
    });
});

module.exports = router;