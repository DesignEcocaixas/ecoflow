const express = require("express");
const router = express.Router();
const db = require("../db");

// View
const tabelaPrecosView = require("../views/tabelaPrecosView");

//------------------------------------------------------------------------------ROTAS PARA CAIXAS------------------------------------------------------------------------------
//LISTAR CAIXAS
router.get("/tabela-precos", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (
        req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "financeiro"
    ) {
        return res.status(403).send("Acesso negado.");
    }

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = 10; // MUDANÇA: AGORA EXIBE 10 CARDS/LINHAS POR PÁGINA
    const offset = (page - 1) * limit;

    const q = (req.query.q || "").trim();

    const where = q
        ? `WHERE (c.codigo LIKE ? OR c.modelo LIKE ? OR f.nome LIKE ?)`
        : "";

    const whereParams = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];

    // 1) COUNT TOTAL (sem LIMIT) -> pra preencher a paginação
    db.query(
        `
    SELECT COUNT(*) AS total
    FROM caixas c
    LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
    ${where}
    `,
        whereParams,
        (errCount, countRows) => {
            if (errCount) {
                console.error("Erro ao contar caixas:", errCount);
                return res.send("Erro ao carregar caixas.");
            }

            const total = Number(countRows?.[0]?.total || 0);
            const totalPages = Math.max(Math.ceil(total / limit), 1);

            // 2) DADOS DA PÁGINA (com LIMIT/OFFSET)
            db.query(
                `
        SELECT c.*, f.nome AS fornecedor_nome, f.porcentagem AS fornecedor_pct
        FROM caixas c
        LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
        ${where}
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?
        `,
                [...whereParams, limit, offset],
                (err, caixas) => {
                    if (err) {
                        console.error("Erro ao buscar caixas:", err);
                        return res.send("Erro ao carregar caixas.");
                    }

                    db.query(
                        "SELECT atualizado_em, atualizado_por FROM caixas ORDER BY atualizado_em DESC LIMIT 1",
                        (err2, alteracao) => {
                            if (err2) {
                                console.error("Erro ao buscar última alteração:", err2);
                                return res.send("Erro ao carregar alterações.");
                            }

                            db.query(
                                "SELECT * FROM fornecedores ORDER BY criado_em DESC",
                                (err3, fornecedores) => {
                                    if (err3) {
                                        console.error("Erro ao buscar fornecedores:", err3);
                                        return res.send("Erro ao carregar fornecedores.");
                                    }

                                    const ultimaAlteracao = alteracao.length > 0 ? alteracao[0] : null;

                                    res.send(
                                        tabelaPrecosView(
                                            req.session.user,
                                            caixas,
                                            ultimaAlteracao,
                                            fornecedores,
                                            { page, totalPages, limit, total, q } // <- paginacao completa
                                        )
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

//CADASTRAR CAIXA
router.post("/tabela-precos/nova", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "financeiro") {
        return res.status(403).send("Acesso negado.");
    }

    const { codigo, modelo, preco_parda, preco_branca, fornecedor_id } = req.body;

    db.query(
        "INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'caixa')",
        [`Caixa "${modelo}" foi adicionada/atualizada por ${req.session.user.nome}`]
    );


    db.query(
        "INSERT INTO caixas (codigo, modelo, preco_parda, preco_branca, fornecedor_id, atualizado_em, atualizado_por) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
        [codigo || null, modelo, preco_parda, preco_branca, fornecedor_id || null, req.session.user.nome],
        (err) => {
            if (err) {
                console.error("Erro ao cadastrar caixa:", err);
                return res.send("Erro ao cadastrar caixa.");
            }
            res.redirect("/tabela-precos");
        }
    );
});

//EDITAR CAIXA
router.post("/tabela-precos/editar/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "financeiro") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;
    const { codigo, modelo, preco_parda, preco_branca } = req.body;
    const usuario = req.session.user.nome;

    db.query(
        "UPDATE caixas SET codigo=?, modelo=?, preco_parda=?, preco_branca=?, atualizado_por=? WHERE id=?",
        [codigo || null, modelo, preco_parda, preco_branca, usuario, id],
        (err) => {
            if (err) {
                console.error("Erro ao editar caixa:", err);
            }
            res.redirect("/tabela-precos");
        }
    );
});

//EXCLUIR CAIXA
router.post("/tabela-precos/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "financeiro") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;

    db.query("DELETE FROM caixas WHERE id=?", [id], (err) => {
        if (err) {
            console.error("Erro ao excluir caixa:", err);
        }
        res.redirect("/tabela-precos");
    });
});

module.exports = router;