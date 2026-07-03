// routes/termos.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Assumindo que você tem um middleware de autenticação
const { isLogged } = require("../middlewares/authMiddleware");

router.post("/api/termos/aceitar", isLogged, (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    const userId = req.session.user.id;
    
    // Atualiza no banco de dados e marca a data
    db.query("UPDATE usuarios SET termos_aceitos = 1, data_aceite_termos = NOW() WHERE id = ?", [userId], (err) => {
        if (err) {
            console.error("Erro ao aceitar termos:", err);
            return res.status(500).json({ success: false });
        }
        
        // Atualiza a sessão atual para que o frontend não mostre mais o toast
        req.session.user.termos_aceitos = 1;
        res.json({ success: true });
    });
});

module.exports = router;