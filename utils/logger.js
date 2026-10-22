// utils/logger.js
const db = require('../db');

const registrarLogSistema = async (usuario, acao, modulo, detalhes) => {
    try {
        // Opcional: limitar o tamanho dos detalhes para evitar logs gigantes
        const detalhesResumidos = detalhes ? detalhes.substring(0, 1000) : '';

        await db.promise().query(
            "INSERT INTO logs_sistema (usuario_nome, acao, modulo, detalhes) VALUES (?, ?, ?, ?)",
            [usuario || 'Sistema', acao, modulo, detalhesResumidos]
        );
    } catch (err) {
        console.error("Falha ao registar log de auditoria:", err);
    }
};

module.exports = { registrarLogSistema };