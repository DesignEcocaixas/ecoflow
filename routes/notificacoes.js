const express = require("express");
const router = express.Router();
const db = require("../db");

//------------------------------------------------------------------------------ROTAS PARA NOTIFICAÇÕES------------------------------------------------------------------------------
//LISTAR NOTIFICAÇÕES
router.get("/notificacoes", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ erro: "Não autorizado" });
    }

    db.query(
        "SELECT id, mensagem, tipo, criado_em FROM notificacoes ORDER BY criado_em DESC LIMIT 20",
        (err, results) => {
            if (err) {
                console.error("Erro ao buscar notificações:", err);
                return res.status(500).json({ erro: "Erro ao buscar notificações" });
            }

            res.json(results || []);
        }
    );
});

//EXCLUIR NOTIFICAÇÃO
router.post("/notificacoes/:id/excluir", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ sucesso: false, erro: "Não autorizado" });
    }

    const { id } = req.params;

    db.query("DELETE FROM notificacoes WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("Erro ao remover notificação:", err);
            return res.status(500).json({
                sucesso: false,
                erro: "Erro ao remover notificação"
            });
        }

        res.json({ sucesso: true });
    });
});

//LIMPAR NOTIFICAÇÕES
router.post("/notificacoes/limpar", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ sucesso: false, erro: "Não autorizado" });
    }

    db.query("DELETE FROM notificacoes", (err) => {
        if (err) {
            console.error("Erro ao limpar notificações:", err);
            return res.status(500).json({
                sucesso: false,
                erro: "Erro ao limpar notificações"
            });
        }

        res.json({ sucesso: true });
    });
});

/*app.get("/notificacoes", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    db.query("SELECT * FROM notificacoes ORDER BY criado_em DESC LIMIT 10", (err, results) => {
        if (err) {
            console.error("Erro ao buscar notificações:", err);
            return res.send([]);
        }
        res.json(results);
    });
});

app.post("/notificacoes/excluir/:id", (req, res) => {
    if (!req.session.user) return res.status(401).send("Não autorizado");

    const { id } = req.params;
    db.query("DELETE FROM notificacoes WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("Erro ao excluir notificação:", err);
            return res.status(500).send("Erro ao excluir notificação");
        }
        res.sendStatus(200);
    });
});*/

module.exports = router;