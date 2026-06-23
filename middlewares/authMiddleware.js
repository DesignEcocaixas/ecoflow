// middlewares/authMiddleware.js

const permissoesPorCargo = {
    admin: ['*'], // Acesso total

    motorista: [
        '/checklist-motoristas',
        '/entregas',
        '/home',
        '/logout',
        '/notificacoes',
        '/api'
    ],

    logistica: [
        '/producao',
        '/veiculos',
        '/checklist-motoristas',
        '/entregas',
        '/caderno-entregas',
        '/home',
        '/logout',
        '/notificacoes',
        '/api'
    ],

    financeiro: [
        '/tabela-precos',
        '/chapas',
        '/entradas-saidas',
        '/producao',
        '/caderno-entregas',
        '/home',
        '/logout',
        '/notificacoes',
        '/api',
        '/exportar'
    ],

    design: [
        '/propostas',
        '/admin/gabaritos',
        '/home',
        '/logout',
        '/notificacoes',
        '/api'
    ]
};

function verificarHierarquia(req, res, next) {
    const rotaRequisitada = req.path;

    // 1. Verifica se está logado
    if (!req.session || !req.session.user) {
        if (rotaRequisitada === '/login') return next();
        return res.redirect('/login?erro=nao_logado');
    }

    const tipoUsuario = (req.session.user.tipo_usuario || 'admin').toLowerCase();

    // 2. Admin passa direto para qualquer rota
    if (tipoUsuario === 'admin') {
        return next();
    }

    const rotasPermitidas = permissoesPorCargo[tipoUsuario] || [];

    // 3. Verifica se a rota requisitada começa com alguma das rotas permitidas
    const temAcesso = rotasPermitidas.some(rotaPai =>
        rotaRequisitada === rotaPai || rotaRequisitada.startsWith(rotaPai + '/')
    );

    if (temAcesso) {
        return next();
    } else {
        console.warn(`Acesso negado: [${tipoUsuario}] tentou acessar ${rotaRequisitada}`);

        // Verifica se a requisição veio do AJAX/Fetch (Formulários sem reload)
        const isAjax = req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1) || req.headers['sec-fetch-dest'] === 'empty';

        if (isAjax) {
            // Se for requisição em segundo plano, apenas barra e o front-end dispara o Toast
            return res.status(403).send("Acesso Negado");
        }

        if (rotaRequisitada === '/home') {
            // Se não tem acesso nem à home, mata a sessão e manda pro login
            req.session.destroy(() => {
                res.redirect('/login?erro=perfil_invalido');
            });
            return;
        }

        // Redireciona o utilizador de volta passando a flag de erro na URL
        return res.redirect('/home?erro=acesso_negado');
    }
}

// Verifica de forma simples se está logado
function isLogged(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect("/login");
    }
    next();
}

// Exporta as funções para serem usadas nos arquivos de rota
module.exports = {
    permissoesPorCargo,
    verificarHierarquia,
    isLogged
};