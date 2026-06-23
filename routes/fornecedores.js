const express = require("express");
const router = express.Router();
const db = require("../db");

//------------------------------------------------------------------------------ROTAS PARA FORNECEDORES------------------------------------------------------------------------------
//LISTAR FORNECEDORES
router.get("/fornecedores", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "financeiro") {
        return res.status(403).send("Acesso negado.");
    }

    db.query("SELECT * FROM fornecedores ORDER BY criado_em DESC", (err, results) => {
        if (err) {
            console.error("Erro ao buscar fornecedores:", err);
            return res.send("Erro ao carregar fornecedores.");
        }
        res.json(results);
    });
});

//CADASTRAR FORNECEDOR
router.post("/fornecedores/novo", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "financeiro") {
        return res.status(403).send("Acesso negado.");
    }

    const { nome, porcentagem } = req.body;

    db.query(
        "INSERT INTO fornecedores (nome, porcentagem) VALUES (?, ?)",
        [nome, porcentagem],
        (err) => {
            if (err) {
                console.error("Erro ao inserir fornecedor:", err);
                return res.send("Erro ao cadastrar fornecedor.");
            }
            res.redirect("/tabela-precos"); // recarrega a tabela
        }
    );
});

//EDITAR FORNECEDOR
router.post("/fornecedores/editar/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { id } = req.params;
    const { nome, porcentagem } = req.body;

    db.query(
        "UPDATE fornecedores SET nome = ?, porcentagem = ? WHERE id = ?",
        [nome, porcentagem, id],
        (err) => {
            if (err) {
                console.error("Erro ao editar fornecedor:", err);
                return res.send("Erro ao editar fornecedor.");
            }
            res.redirect("/tabela-precos");
        }
    );
});

//EXCLUIR FORNECEDOR
router.post("/fornecedores/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "financeiro") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;
    db.query("DELETE FROM fornecedores WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("Erro ao excluir fornecedor:", err);
            return res.send("Erro ao excluir fornecedor.");
        }
        res.redirect("/tabela-precos");
    });
});

module.exports = router;