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

        // 1. Busca as etiquetas deste espaço
        db.query("SELECT * FROM kanban_etiquetas WHERE espaco_id = ?", [espaco_id], (err, etiquetas) => {
            espacoAtual.etiquetas = etiquetas || [];

            // 2. Busca as colunas
            db.query("SELECT * FROM kanban_colunas WHERE espaco_id = ? ORDER BY ordem ASC", [espaco_id], (err, colunas) => {
                if (err) return res.status(500).send("Erro ao carregar colunas.");

                if (colunas.length === 0) {
                    return res.send(kanbanView(req.session.user, [], espacoAtual));
                }

                const idsColunas = colunas.map(c => c.id);

                // 3. Busca os cards
                db.query("SELECT * FROM kanban_cards WHERE coluna_id IN (?) ORDER BY ordem ASC", [idsColunas], (errCards, cards) => {
                    if (errCards) return res.status(500).send("Erro ao carregar cards.");

                    const idsCards = cards.map(c => c.id);
                    if (idsCards.length === 0) {
                        colunas.forEach(col => col.cards = []);
                        return res.send(kanbanView(req.session.user, colunas, espacoAtual));
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

                            colunas.forEach(col => {
                                col.cards = cards.filter(c => c.coluna_id === col.id);
                            });

                            res.send(kanbanView(req.session.user, colunas, espacoAtual));
                        });
                    });
                });
            });
        });
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