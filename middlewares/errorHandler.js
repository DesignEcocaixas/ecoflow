// middlewares/errorHandler.js
const errosView = require("../views/errosView");

// 1. Interceptador de 404 (Página não encontrada)
function notFoundHandler(req, res, next) {
    if (req.xhr || req.headers['content-type']?.includes('application/json') || req.headers['accept']?.includes('application/json')) {
        return res.status(404).json({
            success: false,
            message: "O endpoint ou recurso solicitado não foi encontrado (404)."
        });
    }

    // Chamando a view sem o parâmetro usuário (4 argumentos apenas)
    res.status(404).send(errosView(
        404, 
        "Página Não Encontrada", 
        `A rota "${req.originalUrl}" não existe no ERP Ecoflow. Verifique se o endereço foi digitado corretamente.`,
        null // Sem stack trace para erro 404 comum
    ));
}

// 2. Interceptador de 500 (Erro Geral do Servidor)
function globalErrorHandler(err, req, res, next) {
    console.error("❌ [ERRO NO SERVIDOR]:", err.stack || err.message);

    const status = err.status || 500;
    const titulo = err.titulo || "Erro Interno no Servidor";
    const mensagem = err.message || "Ocorreu uma falha inesperada durante o processamento da sua solicitação.";

    if (req.xhr || req.headers['content-type']?.includes('application/json') || req.headers['accept']?.includes('application/json')) {
        return res.status(status).json({
            success: false,
            error: titulo,
            message: mensagem
        });
    }

    // Passando o err.stack corretamente como o 4º argumento
    res.status(status).send(errosView(status, titulo, mensagem, err.stack));
}

module.exports = {
    notFoundHandler,
    globalErrorHandler
};