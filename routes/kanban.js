// routes/kanban.js
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
    const user = req.session.user;

    if (!espaco_id) {
        return res.redirect("/espacos-trabalho");
    }

    db.query("SELECT * FROM espacos_trabalho WHERE id = ?", [espaco_id], (err, espacosResult) => {
        if (err || espacosResult.length === 0) return res.redirect("/espacos-trabalho");
        const espacoAtual = espacosResult[0];

        // =====================================================================
        // VERIFICAÇÃO DE SEGURANÇA (BLOQUEIO POR URL)
        // =====================================================================
        const userRole = user.tipo_usuario || 'admin';
        
        let permAtuais = ['admin','financeiro','motorista','design','logistica','producao','comercial'];
        if (espacoAtual.permissoes) {
            permAtuais = typeof espacoAtual.permissoes === 'string' ? espacoAtual.permissoes.split(',') : espacoAtual.permissoes;
        }

        const isOwnerOrAdmin = userRole === 'admin' || 
                               (espacoAtual.criador && espacoAtual.criador === user.nome) || 
                               (espacoAtual.criado_por && espacoAtual.criado_por === user.nome) || 
                               (espacoAtual.usuario_id && espacoAtual.usuario_id == user.id);

        const hasAccess = isOwnerOrAdmin || 
                          permAtuais.includes(userRole) || 
                          permAtuais.includes('usr_' + user.id);

        if (!hasAccess) {
            return res.redirect("/espacos-trabalho?erro=acesso_negado");
        }

        db.query("SELECT id, nome, tipo_usuario, foto FROM usuarios", (errUsu, colaboradoresResult) => {
            const listaColaboradores = colaboradoresResult || [];

            db.query("SELECT * FROM kanban_etiquetas WHERE espaco_id = ?", [espaco_id], (err, etiquetas) => {
                espacoAtual.etiquetas = etiquetas || [];

                db.query("SELECT * FROM kanban_colunas WHERE espaco_id = ? ORDER BY ordem ASC", [espaco_id], (err, colunas) => {
                    if (err) return res.status(500).send("Erro ao carregar colunas.");

                    if (colunas.length === 0) {
                        return res.send(kanbanView(req.session.user, [], espacoAtual, [], listaColaboradores));
                    }

                    const idsColunas = colunas.map(c => c.id);

                    db.query("SELECT * FROM kanban_cards WHERE coluna_id IN (?) ORDER BY ordem ASC", [idsColunas], (errCards, cards) => {
                        if (errCards) return res.status(500).send("Erro ao carregar cards.");

                        const idsCards = cards.map(c => c.id);
                        if (idsCards.length === 0) {
                            colunas.forEach(col => col.cards = []);
                            return res.send(kanbanView(req.session.user, colunas, espacoAtual, [], listaColaboradores));
                        }

                        db.query("SELECT * FROM kanban_anexos WHERE card_id IN (?)", [idsCards], (errAnexos, anexos) => {
                            db.query("SELECT * FROM kanban_cards_etiquetas WHERE card_id IN (?)", [idsCards], (errEtiquetasCards, relacoes) => {

                                const anexosGerais = anexos || [];
                                const relacoesGerais = relacoes || [];

                                cards.forEach(card => {
                                    card.anexos = anexosGerais.filter(a => a.card_id === card.id);
                                    const idsEtiquetasDesteCard = relacoesGerais.filter(r => r.card_id === card.id).map(r => r.etiqueta_id);
                                    card.etiquetas = espacoAtual.etiquetas.filter(e => idsEtiquetasDesteCard.includes(e.id));
                                });

                                const now = new Date();
                                const cardsParaDeletar = [];
                                const avisosExclusao = [];

                                colunas.forEach(col => {
                                    let cardsDaColuna = cards.filter(c => c.coluna_id === col.id);

                                    if (col.dias_exclusao && col.dias_exclusao > 0) {
                                        cardsDaColuna = cardsDaColuna.filter(card => {
                                            const dataCriacao = new Date(card.criado_em);
                                            const diffTime = Math.abs(now - dataCriacao);
                                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                            
                                            if (diffDays >= col.dias_exclusao) {
                                                cardsParaDeletar.push(card.id);
                                                return false;
                                            } else if (diffDays === (col.dias_exclusao - 1)) {
                                                avisosExclusao.push(`${card.titulo || 'Sem Título'} (Coluna: ${col.titulo})`);
                                            }
                                            return true; 
                                        });
                                    }

                                    col.cards = cardsDaColuna.sort((a, b) => {
                                        if (!a.prazo && b.prazo) return 1;  
                                        if (a.prazo && !b.prazo) return -1; 
                                        if (!a.prazo && !b.prazo) return 0; 

                                        const dataA = new Date(a.prazo);
                                        const dataB = new Date(b.prazo);

                                        if (dataA.getTime() !== dataB.getTime()) {
                                            return dataA - dataB;
                                        }

                                        if (a.prioridade === 'alta' && b.prioridade !== 'alta') return -1;
                                        if (b.prioridade === 'alta' && a.prioridade !== 'alta') return 1;

                                        return 0; 
                                    });
                                });

                                if (cardsParaDeletar.length > 0) {
                                    db.query("DELETE FROM kanban_cards WHERE id IN (?)", [cardsParaDeletar], () => {});
                                    db.query("DELETE FROM kanban_anexos WHERE card_id IN (?)", [cardsParaDeletar], () => {});
                                    db.query("DELETE FROM kanban_historico WHERE card_id IN (?)", [cardsParaDeletar], () => {});
                                    db.query("DELETE FROM kanban_cards_etiquetas WHERE card_id IN (?)", [cardsParaDeletar], () => {});
                                }

                                res.send(kanbanView(req.session.user, colunas, espacoAtual, avisosExclusao, listaColaboradores));
                            });
                        });
                    });
                });
            });
        });
    });
});

// BAIXAR RELATÓRIO DO KANBAN DE FORMA DINÂMICA
router.post("/kanban/relatorio", isLogged, async (req, res) => {
    const espaco_id = req.query.espaco_id;
    if (!espaco_id) return res.status(400).send("Espaço não informado.");

    const camposSelecionados = req.body.campos || [];
    const colunasSelecionadas = req.body.colunas_selecionadas || [];
    const dataInicio = req.body.data_inicio;
    const dataFim = req.body.data_fim;
    
    if (!camposSelecionados || camposSelecionados.length === 0) {
        return res.status(400).send("Nenhum campo selecionado para o relatório.");
    }

    try {
        const [todasColunas] = await db.promise().query("SELECT id, titulo FROM kanban_colunas WHERE espaco_id = ?", [espaco_id]);
        if (todasColunas.length === 0) return res.send("Nenhuma coluna encontrada para gerar relatório.");

        const colIdsFiltro = Array.isArray(colunasSelecionadas) ? colunasSelecionadas : [colunasSelecionadas];
        const idsValidos = colIdsFiltro.length > 0 ? colIdsFiltro : todasColunas.map(c => c.id);

        let sqlCards = "SELECT * FROM kanban_cards WHERE coluna_id IN (?)";
        const queryParams = [idsValidos];

        if (dataInicio) {
            sqlCards += " AND DATE(criado_em) >= ?";
            queryParams.push(dataInicio);
        }
        if (dataFim) {
            sqlCards += " AND DATE(criado_em) <= ?";
            queryParams.push(dataFim);
        }

        const [cards] = await db.promise().query(sqlCards, queryParams);

        const [relacoesTags] = await db.promise().query(`
            SELECT ce.card_id, e.nome 
            FROM kanban_cards_etiquetas ce 
            JOIN kanban_etiquetas e ON ce.etiqueta_id = e.id 
            WHERE e.espaco_id = ?
        `, [espaco_id]);

        const [usuarios] = await db.promise().query("SELECT id, nome FROM usuarios");
        const userMap = {};
        usuarios.forEach(u => userMap[u.id] = u.nome);

        const colMap = {};
        todasColunas.forEach(c => colMap[c.id] = c.titulo);

        const titulosHeaders = {
            titulo: 'Título',
            prioridade: 'Prioridade',
            prazo: 'Prazo',
            coluna: 'Coluna Atual',
            descricao: 'Descrição',
            etiquetas: 'Etiquetas',
            percas_pintura: 'Percas Pintura (Detalhado)',
            total_percas_pintura: 'Total Percas Pintura',
            percas_corte: 'Percas Corte (Detalhado)',
            total_percas_corte: 'Total Percas Corte'
        };

        let csv = camposSelecionados.map(campo => titulosHeaders[campo]).join(';') + '\n';

        cards.forEach(c => {
            let linhaArray = [];

            camposSelecionados.forEach(campo => {
                if (campo === 'titulo') {
                    linhaArray.push(`"${(c.titulo || '').replace(/"/g, '""')}"`);
                } 
                else if (campo === 'prioridade') {
                    linhaArray.push(`"${c.prioridade || 'normal'}"`);
                }
                else if (campo === 'prazo') {
                    linhaArray.push(`"${c.prazo ? new Date(c.prazo).toLocaleDateString('pt-BR') : ''}"`);
                }
                else if (campo === 'coluna') {
                    linhaArray.push(`"${colMap[c.coluna_id] || ''}"`);
                }
                else if (campo === 'descricao') {
                    const descLimpa = (c.descricao || '').replace(/<[^>]*>?/gm, '').replace(/"/g, '""').replace(/\n/g, ' ');
                    linhaArray.push(`"${descLimpa}"`);
                }
                else if (campo === 'etiquetas') {
                    const tags = relacoesTags.filter(r => r.card_id === c.id).map(r => r.nome).join(', ');
                    linhaArray.push(`"${tags}"`);
                }
                else if (campo === 'percas_pintura' || campo === 'percas_corte') {
                    const formatPercas = (jsonStr) => {
                        try {
                            const arr = JSON.parse(jsonStr);
                            if (!Array.isArray(arr) || arr.length === 0) return '';
                            return arr.map(p => {
                                const op1 = userMap[p.op1] || '';
                                const op2 = userMap[p.op2] || '';
                                let text = `Qtd: ${p.qtd} | Mat: ${p.material} | Chapa: ${p.chapa}`;
                                if (op1) text += ` | Op1: ${op1}`;
                                if (op2) text += ` | Op2: ${op2}`;
                                return text;
                            }).join(' /// ');
                        } catch(e) { return ''; }
                    };
                    const valorStr = campo === 'percas_pintura' ? formatPercas(c.percas_pintura) : formatPercas(c.percas_corte);
                    linhaArray.push(`"${valorStr}"`);
                }
                else if (campo === 'total_percas_pintura' || campo === 'total_percas_corte') {
                    const somarPercas = (jsonStr) => {
                        try {
                            const arr = JSON.parse(jsonStr);
                            if (!Array.isArray(arr) || arr.length === 0) return '0';
                            return arr.reduce((acc, p) => acc + (parseInt(p.qtd) || 0), 0).toString();
                        } catch(e) { return '0'; }
                    };
                    const valorTotal = campo === 'total_percas_pintura' ? somarPercas(c.percas_pintura) : somarPercas(c.percas_corte);
                    linhaArray.push(`"${valorTotal}"`);
                }
            });

            csv += linhaArray.join(';') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_kanban_espaco_${espaco_id}.csv"`);
        res.send('\uFEFF' + csv);

    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        res.status(500).send("Erro ao gerar relatório.");
    }
});

// LIMPEZA MANUAL DE CARDS DE UMA COLUNA POR IDADE 
router.post("/kanban/colunas/:id/limpar", isLogged, async (req, res) => {
    const colId = req.params.id;
    const dias = parseInt(req.body.dias);

    if (isNaN(dias) || dias < 0) return res.status(400).json({ success: false, message: "Dias inválidos." });

    try {
        const [cards] = await db.promise().query(
            "SELECT id FROM kanban_cards WHERE coluna_id = ? AND DATEDIFF(NOW(), criado_em) >= ?", 
            [colId, dias]
        );

        let idsDeletar = [];
        if (cards.length > 0) {
            idsDeletar = cards.map(c => c.id);
            await db.promise().query("DELETE FROM kanban_cards WHERE id IN (?)", [idsDeletar]);
            await db.promise().query("DELETE FROM kanban_anexos WHERE card_id IN (?)", [idsDeletar]);
            await db.promise().query("DELETE FROM kanban_historico WHERE card_id IN (?)", [idsDeletar]);
            await db.promise().query("DELETE FROM kanban_cards_etiquetas WHERE card_id IN (?)", [idsDeletar]);
        }

        res.json({ success: true, deletados: cards.length, ids: idsDeletar });
    } catch (error) {
        console.error("Erro ao limpar cards manualmente:", error);
        res.status(500).json({ success: false });
    }
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
        
        // Dispara a Notificação de Anexo com o Título
        db.query("SELECT titulo FROM kanban_cards WHERE id = ?", [cardId], (errSel, rows) => {
            const tituloCard = (rows && rows.length > 0) ? rows[0].titulo : "um card";
            const usuarioNome = req.session.user ? req.session.user.nome : 'Sistema';
            db.query("INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'kanban')", [`${usuarioNome} anexou arquivo(s) no card "${tituloCard}"`]);
        });

        res.json({ success: true, message: "Anexos salvos com sucesso!" });
    });
});

//EXCLUIR UM ANEXO DO CARD KANBAN
router.delete("/kanban/anexos/:id", isLogged, (req, res) => {
    const anexoId = req.params.id;

    db.query("SELECT card_id, nome_arquivo FROM kanban_anexos WHERE id = ?", [anexoId], (err, results) => {
        if (err || results.length === 0) return res.status(404).send("Anexo não encontrado");

        const anexo = results[0];
        const cardId = anexo.card_id;
        const filePath = path.join(__dirname, "uploads", anexo.nome_arquivo);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        db.query("DELETE FROM kanban_anexos WHERE id = ?", [anexoId], (deleteErr) => {
            if (deleteErr) return res.status(500).send("Erro ao excluir registro do banco");
            
            // Dispara a Notificação de Exclusão com o Título
            db.query("SELECT titulo FROM kanban_cards WHERE id = ?", [cardId], (errSel, rows) => {
                const tituloCard = (rows && rows.length > 0) ? rows[0].titulo : "um card";
                const usuarioNome = req.session.user ? req.session.user.nome : 'Sistema';
                db.query("INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'kanban')", [`${usuarioNome} removeu um anexo do card "${tituloCard}"`]);
            });
            
            res.json({ success: true });
        });
    });
});

module.exports = router;