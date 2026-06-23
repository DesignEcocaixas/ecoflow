const express = require("express");
const router = express.Router();
const db = require("../db");

const entregasView = require("../views/entregasView");
const { isLogged } = require("../middlewares/authMiddleware");

//------------------------------------------------------------------------------ROTAS PARA ENTREGAS------------------------------------------------------------------------------
//LISTAR ENTREGAS
router.get("/entregas", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const usuario = req.session.user;

    // Filtros vindos da query string ou formulário (method="GET")
    const { titulo, data_inicio, data_fim } = req.query;

    // Paginação
    const page = parseInt(req.query.page || "1", 10);
    const limit = 6; // nº de pedidos por página

    // Monta WHERE dinâmico (título / período)
    const where = [];
    const params = [];

    if (titulo && titulo.trim() !== "") {
        where.push("p.titulo LIKE ?");
        params.push(`%${titulo.trim()}%`);
    }

    if (data_inicio && data_inicio.trim() !== "") {
        where.push("DATE(p.data_pedido) >= ?");
        params.push(data_inicio.trim());
    }

    if (data_fim && data_fim.trim() !== "") {
        where.push("DATE(p.data_pedido) <= ?");
        params.push(data_fim.trim());
    }

    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    // 1) Conta quantos pedidos existem com os filtros (para calcular total de páginas)
    const sqlCount = `
    SELECT COUNT(*) AS total
    FROM entregas_pedidos p
    ${whereSql}
  `;

    db.query(sqlCount, params, (errCount, rowsCount) => {
        if (errCount) {
            console.error("Erro ao contar pedidos de entregas:", errCount);
            return res.status(500).send("Erro ao carregar entregas.");
        }

        const total = rowsCount[0]?.total || 0;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        const offset = (currentPage - 1) * limit;

        // 2) Busca os pedidos paginados
        const sqlPedidos = `
      SELECT p.*
      FROM entregas_pedidos p
      ${whereSql}
      ORDER BY p.data_pedido DESC, p.id DESC
      LIMIT ? OFFSET ?
    `;

        const paramsPedidos = params.concat([limit, offset]);

        db.query(sqlPedidos, paramsPedidos, (errPedidos, pedidos) => {
            if (errPedidos) {
                console.error("Erro ao buscar pedidos de entregas:", errPedidos);
                return res.status(500).send("Erro ao carregar entregas.");
            }

            // Se não tiver pedidos nessa página, não precisa buscar clientes
            if (!pedidos || pedidos.length === 0) {
                const filtros = {
                    titulo: titulo || "",
                    data_inicio: data_inicio || "",
                    data_fim: data_fim || ""
                };

                const paginacao = {
                    page: currentPage,
                    totalPages,
                    total
                };

                return res.send(
                    entregasView(usuario, [], {}, filtros, paginacao)
                );
            }

            // 3) Busca os clientes de todos os pedidos retornados (numa query só)
            const idsPedidos = pedidos.map(p => p.id);
            const sqlClientes = `
        SELECT c.*
        FROM entregas_clientes c
        WHERE c.pedido_id IN (${idsPedidos.map(() => "?").join(",")})
        ORDER BY c.id ASC
      `;

            db.query(sqlClientes, idsPedidos, (errClientes, clientes) => {
                if (errClientes) {
                    console.error("Erro ao buscar clientes das entregas:", errClientes);
                    return res.status(500).send("Erro ao carregar entregas.");
                }

                // Agrupa clientes por pedido_id
                const clientesPorPedido = {};
                (clientes || []).forEach(c => {
                    if (!clientesPorPedido[c.pedido_id]) {
                        clientesPorPedido[c.pedido_id] = [];
                    }
                    clientesPorPedido[c.pedido_id].push(c);
                });

                const filtros = {
                    titulo: titulo || "",
                    data_inicio: data_inicio || "",
                    data_fim: data_fim || ""
                };

                const paginacao = {
                    page: currentPage,
                    totalPages,
                    total
                };

                // IMPORTANTE: a view agora recebe também 'paginacao'
                res.send(
                    entregasView(usuario, pedidos, clientesPorPedido, filtros, paginacao)
                );
            });
        });
    });
});

//CADASTRAR ENTREGA
router.post("/entregas/novo", isLogged, (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const { titulo, data_pedido } = req.body;

    const usuario = req.session.user; // agora sabemos que existe
    const nomeUsuario = usuario.nome || usuario.email || "Usuário";

    db.query(
        "INSERT INTO entregas_pedidos (titulo, data_pedido, criado_por) VALUES (?, ?, ?)",
        [titulo, data_pedido, nomeUsuario],
        (err) => {
            if (err) {
                console.error("Erro ao criar pedido:", err);
                return res.status(500).send("Erro ao criar pedido.");
            }

            // se você estiver usando notificações:
            db.query(
                "INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'entrega')",
                [`Pedido '${titulo}' criado por ${nomeUsuario}`],
                () => { } // ignora erro aqui se quiser
            );

            return res.redirect("/entregas");
        }
    );
});

//EXCLUIR ENTREGA
router.post("/entregas/:id/excluir", isLogged, /* onlyAdmin, */(req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;
    db.query("DELETE FROM entregas_pedidos WHERE id=?", [id], (err) => {
        if (err) {
            console.error("Erro ao excluir pedido:", err);
            return res.status(500).send("Erro ao excluir pedido.");
        }
        res.redirect("/entregas");
    });
});

//ADICIONAR CLIENTE À ENTREGA
router.post("/entregas/:id/clientes/novo", isLogged, (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;
    let { cliente_nome, status, observacao } = req.body;

    const user = req.session.user || {};
    const atualizadoPor = user.nome || user.email || "Usuário";

    // Default de segurança
    if (!status || !status.trim()) {
        status = "NA_ROTA";
    }

    db.query(
        `INSERT INTO entregas_clientes (pedido_id, cliente_nome, status, observacao, atualizado_por)
     VALUES (?, ?, ?, ?, ?)`,
        [id, cliente_nome, status, observacao && observacao.trim() ? observacao : null, atualizadoPor],
        (err) => {
            if (err) {
                console.error("Erro ao adicionar cliente:", err);
                return res.status(500).send("Erro ao adicionar cliente.");
            }
            res.redirect("/entregas");
        }
    );
});

//EDITAR CLIENTE DA ENTREGA
router.post("/entregas/clientes/editar/:cid", isLogged, (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const { cid } = req.params;
    const { cliente_nome, status, observacao } = req.body;

    const user = req.session.user || {};
    const atualizadoPor = user.nome || user.email || "Usuário";

    const sql = `
    UPDATE entregas_clientes
    SET cliente_nome = ?, status = ?, observacao = ?, atualizado_por = ?
    WHERE id = ?
  `;

    const params = [
        cliente_nome,
        status,
        observacao && observacao.trim() !== "" ? observacao : null,
        atualizadoPor,
        cid,
    ];

    db.query(sql, params, (err) => {
        if (err) {
            console.error("Erro ao editar cliente:", err);
            return res.status(500).send("Erro ao editar cliente.");
        }
        return res.redirect("/entregas");
    });
});

//EXCLUIR CLIENTE DA ENTREGA
router.post("/entregas/clientes/excluir/:cid", /*isLogged*/ /* onlyAdmin, */(req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const { cid } = req.params;
    db.query("DELETE FROM entregas_clientes WHERE id=?", [cid], (err) => {
        if (err) {
            console.error("Erro ao excluir cliente:", err);
            return res.status(500).send("Erro ao excluir cliente.");
        }
        res.redirect("/entregas");
    });
});

module.exports = router