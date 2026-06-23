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
//LISTAR COLUNAS/CARDS
router.get("/kanban", isLogged, (req, res) => {
    const espaco_id = req.query.espaco_id;

    if (!espaco_id) {
        return res.redirect("/espacos-trabalho");
    }

    db.query("SELECT * FROM espacos_trabalho WHERE id = ?", [espaco_id], (err, espacosResult) => {
        if (err || espacosResult.length === 0) return res.redirect("/espacos-trabalho");
        const espacoAtual = espacosResult[0];

        db.query("SELECT * FROM kanban_colunas WHERE espaco_id = ? ORDER BY ordem ASC", [espaco_id], (err, colunas) => {
            if (err) return res.status(500).send("Erro ao carregar colunas.");

            if (colunas.length === 0) {
                return res.send(kanbanView(req.session.user, [], espacoAtual));
            }

            const idsColunas = colunas.map(c => c.id);

            db.query("SELECT * FROM kanban_cards WHERE coluna_id IN (?) ORDER BY ordem ASC", [idsColunas], (errCards, cards) => {
                if (errCards) return res.status(500).send("Erro ao carregar cards.");

                const idsCards = cards.map(c => c.id);
                if (idsCards.length === 0) {
                    colunas.forEach(col => col.cards = []);
                    return res.send(kanbanView(req.session.user, colunas, espacoAtual));
                }

                db.query("SELECT * FROM kanban_anexos WHERE card_id IN (?)", [idsCards], (errAnexos, anexos) => {
                    if (errAnexos) return res.status(500).send("Erro ao carregar anexos.");

                    cards.forEach(card => {
                        card.anexos = anexos.filter(a => a.card_id === card.id);
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

//HISTÓRICO CARD KANBAN
router.get("/kanban/historico/:id", isLogged, (req, res) => {
    const cardId = req.params.id;

    // O COLLATE resolve o erro "Illegal mix of collations" forçando o mesmo padrão
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

    // 1. Puxa o 'id' diretamente dos parâmetros da rota
    const cardId = req.params.id;

    // 2. Puxa o array de arquivos (req.files)
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).send("Nenhum arquivo enviado.");
    }

    // 3. Prepara um array aninhado para inserir múltiplos arquivos.
    const values = files.map(file => [
        cardId,
        file.originalname,
        "kanban/" + file.filename, // <-- A MÁGICA AQUI: Salva no banco com o nome da pasta na frente
        file.mimetype,
        file.path
    ]);

    const query = "INSERT INTO kanban_anexos (card_id, nome_original, nome_arquivo, tipo, caminho) VALUES ?";

    // O MySQL exige que o array de valores (values) esteja dentro de outro array [values] para inserções múltiplas
    db.query(query, [values], (err, result) => {
        if (err) {
            console.error("Erro ao salvar anexos:", err);
            return res.status(500).send("Erro ao guardar anexo.");
        }

        // Retorna sucesso para o frontend
        res.json({ success: true, message: "Anexos salvos com sucesso!" });
    });
});

//EXCLUIR UM ANEXO DO CARD KANBAN
router.delete("/kanban/anexos/:id", isLogged, (req, res) => {
    const anexoId = req.params.id;

    // Primeiro buscamos as informações do arquivo para apagá-lo do servidor
    db.query("SELECT * FROM kanban_anexos WHERE id = ?", [anexoId], (err, results) => {
        if (err || results.length === 0) return res.status(404).send("Anexo não encontrado");

        const anexo = results[0];

        // Como o banco agora pode retornar "kanban/arquivo.jpg" ou só "arquivo.jpg" (arquivos antigos),
        // o path.join lida com as barras automaticamente e encontra o caminho certo.
        const filePath = path.join(__dirname, "uploads", anexo.nome_arquivo);

        // Exclui o arquivo fisicamente, se ele existir
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Apaga o registro do banco de dados
        db.query("DELETE FROM kanban_anexos WHERE id = ?", [anexoId], (deleteErr) => {
            if (deleteErr) return res.status(500).send("Erro ao excluir registro do banco");
            res.json({ success: true });
        });
    });
});

module.exports = router;