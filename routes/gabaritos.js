const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");

const { uploadGabaritos } = require("../config/uploadConfig");

//------------------------------------------------------------------------------ROTAS PARA GABARITOS------------------------------------------------------------------------------
//LISTAR GAABRITOS
router.get('/admin/gabaritos', (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "design") {
        return res.status(403).send("Acesso negado.");
    }

    db.query("SELECT * FROM gabaritos ORDER BY id DESC", (err, gabaritos) => {
        if (err) {
            console.error("Erro ao buscar gabaritos:", err);
            return res.status(500).send("Erro interno");
        }
        res.send(require('../views/gabaritosView')(req.session.user, gabaritos));
    });
});

// CADASTRAR GABARITO
router.post('/admin/gabaritos/upload', uploadGabaritos.single('arquivo_gabarito'), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "design") {
        return res.status(403).send("Acesso negado.");
    }

    if (!req.file) return res.redirect('/admin/gabaritos');

    const nome = req.file.originalname;

    // A MÁGICA AQUI: Mantém o padrão `/uploads/`, mas insere a nova subpasta `gabaritos/`
    const url = `/uploads/gabaritos/${req.file.filename}`;

    db.query("INSERT INTO gabaritos (nome, url) VALUES (?, ?)", [nome, url], (err) => {
        if (err) console.error("Erro ao salvar gabarito:", err);
        res.redirect('/admin/gabaritos');
    });
});

// EXCLUIR GABARITO
router.post('/admin/gabaritos/delete/:id', (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "design") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;

    db.query("SELECT url FROM gabaritos WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) return res.redirect('/admin/gabaritos');

        const urlArquivo = results[0].url;

        const filename = urlArquivo.replace('/uploads/', '');
        const filepath = path.join(__dirname, 'uploads', filename);

        // Apaga o ficheiro físico do disco
        const fs = require('fs');
        if (fs.existsSync(filepath)) {
            fs.unlink(filepath, (errUnlink) => {
                if (errUnlink) console.error("Erro ao excluir arquivo físico:", errUnlink);
            });
        }

        // Apaga o registo do banco de dados
        db.query("DELETE FROM gabaritos WHERE id = ?", [id], (errDel) => {
            if (errDel) console.error("Erro ao excluir gabarito do BD:", errDel);
            res.redirect('/admin/gabaritos');
        });
    });
});

module.exports = router;