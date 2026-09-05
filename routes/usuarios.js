const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");

const { uploadUsuarios } = require("../config/uploadConfig");
const cadastroView = require("../views/cadastroView");

//------------------------------------------------------------------------------ROTAS PARA USUÁRIOS------------------------------------------------------------------------------
//LISTAR TODOS OS USUÁRIOS
router.get("/cadastro", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin")
        return res.status(403).send("Acesso negado.");

    db.query("SELECT id, nome, email, senha, tipo_usuario, foto, cpf, telefone, pix, banco, termos_aceitos, data_aceite_termos, modulos FROM usuarios ORDER BY id DESC", (err, rows) => {
        if (err) {
            console.error("Erro ao listar usuários:", err);
            return res.status(500).send("Erro ao carregar usuários.");
        }
        res.send(cadastroView(req.session.user, rows || []));
    });
});

// =========================================================================
// ROTA POST: CRIAR USUÁRIO
// =========================================================================
router.post("/usuarios/novo", uploadUsuarios.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { nome, email, senha, tipo_usuario, cpf, telefone, pix, banco, modulos } = req.body;

    const foto = req.file ? "usuarios/perfil/" + req.file.filename : null;

    const isNoLogin = ['motorista_avulso', 'ajudante', 'diarista'].includes(tipo_usuario);
    const finalEmail = (isNoLogin || !email || email.trim() === '') ? null : email;
    const finalSenha = isNoLogin ? null : senha;
    const finalCpf = isNoLogin ? cpf : null;
    const finalTelefone = isNoLogin ? telefone : null;
    const finalPix = isNoLogin ? pix : null;
    const finalBanco = isNoLogin ? banco : null;
    
    const modulosStr = modulos ? (Array.isArray(modulos) ? modulos.join(',') : modulos) : '';

    db.query(
        "INSERT INTO usuarios (nome, email, senha, tipo_usuario, foto, cpf, telefone, pix, banco, modulos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [nome, finalEmail, finalSenha, tipo_usuario, foto, finalCpf, finalTelefone, finalPix, finalBanco, modulosStr],
        (err) => {
            if (err) {
                console.error("Erro ao cadastrar:", err);
                return res.redirect("/cadastro?erro=1");
            }
            return res.redirect("/cadastro?sucesso=1");
        }
    );
});

// =========================================================================
// ROTA POST: EDITAR USUÁRIO (ADMINISTRATIVO)
// =========================================================================
router.post("/usuarios/editar/:id", uploadUsuarios.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params;
    const { nome, email, senha, tipo_usuario, cpf, telefone, pix, banco, modulos } = req.body;

    const novaFoto = req.file ? "usuarios/perfil/" + req.file.filename : null;

    const isNoLogin = ['motorista_avulso', 'ajudante', 'diarista'].includes(tipo_usuario);
    const finalEmail = (isNoLogin || !email || email.trim() === '') ? null : email;
    const finalCpf = isNoLogin ? cpf : null;
    const finalTelefone = isNoLogin ? telefone : null;
    const finalPix = isNoLogin ? pix : null;
    const finalBanco = isNoLogin ? banco : null;

    const modulosStr = modulos ? (Array.isArray(modulos) ? modulos.join(',') : modulos) : '';

    const executarUpdate = () => {
        let sql;
        let params;

        if (!senha || senha.trim() === "" || isNoLogin) {
            if (novaFoto) {
                sql = "UPDATE usuarios SET nome=?, email=?, tipo_usuario=?, foto=?, cpf=?, telefone=?, pix=?, banco=?, modulos=? WHERE id=?";
                params = [nome, finalEmail, tipo_usuario, novaFoto, finalCpf, finalTelefone, finalPix, finalBanco, modulosStr, id];
            } else {
                sql = "UPDATE usuarios SET nome=?, email=?, tipo_usuario=?, cpf=?, telefone=?, pix=?, banco=?, modulos=? WHERE id=?";
                params = [nome, finalEmail, tipo_usuario, finalCpf, finalTelefone, finalPix, finalBanco, modulosStr, id];
            }
        } else {
            if (novaFoto) {
                sql = "UPDATE usuarios SET nome=?, email=?, senha=?, tipo_usuario=?, foto=?, cpf=?, telefone=?, pix=?, banco=?, modulos=? WHERE id=?";
                params = [nome, finalEmail, senha, tipo_usuario, novaFoto, finalCpf, finalTelefone, finalPix, finalBanco, modulosStr, id];
            } else {
                sql = "UPDATE usuarios SET nome=?, email=?, senha=?, tipo_usuario=?, cpf=?, telefone=?, pix=?, banco=?, modulos=? WHERE id=?";
                params = [nome, finalEmail, senha, tipo_usuario, finalCpf, finalTelefone, finalPix, finalBanco, modulosStr, id];
            }
        }

        db.query(sql, params, (err) => {
            if (err) {
                console.error("Erro ao editar usuário:", err);
                return res.status(500).send("Erro ao editar usuário.");
            }

            if (req.session.user && req.session.user.id === parseInt(id)) {
                req.session.user.nome = nome;
                req.session.user.tipo_usuario = tipo_usuario;
                if (novaFoto) {
                    req.session.user.foto = novaFoto;
                }
            }

            return res.redirect("/cadastro?editado=1");
        });
    };

    if (novaFoto) {
        db.query("SELECT foto FROM usuarios WHERE id = ?", [id], (errSel, rows) => {
            if (!errSel && rows.length > 0 && rows[0].foto) {
                const fotoAntiga = rows[0].foto;
                const caminho = path.join(__dirname, "uploads", fotoAntiga);

                const fs = require('fs');
                if (fs.existsSync(caminho)) {
                    fs.unlink(caminho, (errUnlink) => {
                        if (errUnlink) console.warn("Erro ao remover foto antiga:", errUnlink);
                    });
                }
            }
            executarUpdate();
        });
    } else {
        executarUpdate();
    }
});

// =========================================================================
// ROTA POST: EXCLUIR USUÁRIO
// =========================================================================
router.post("/usuarios/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params;

    db.query("SELECT foto FROM usuarios WHERE id = ?", [id], (errSel, rows) => {
        if (!errSel && rows.length > 0 && rows[0].foto) {
            const fotoAntiga = rows[0].foto;
            const caminho = path.join(__dirname, "uploads", fotoAntiga);

            const fs = require('fs');
            if (fs.existsSync(caminho)) {
                fs.unlink(caminho, (errUnlink) => {
                    if (errUnlink) console.warn("Erro ao remover foto do usuário excluído:", errUnlink);
                });
            }
        }

        db.query("DELETE FROM usuarios WHERE id=?", [id], (err) => {
            if (err) {
                console.error("Erro ao excluir usuário:", err);
                return res.status(500).send("Erro ao excluir usuário.");
            }
            return res.redirect("/cadastro?excluido=1");
        });
    });
});

////------------------------------------------------------------------------------ROTAS PARA USUÁRIOS SEM CONTA------------------------------------------------------------------------------
//CRIAR COLABORADOR
router.post("/cadastros/usuarios/novo", uploadUsuarios.single("foto"), async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { nome, tipo_usuario, cpf, telefone, pix, banco, redirect_to } = req.body;

    const foto = req.file ? "usuarios/perfil/" + req.file.filename : null;

    try {
        await db.promise().query(
            "INSERT INTO usuarios (nome, tipo_usuario, cpf, telefone, pix, banco, foto) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [nome, tipo_usuario, cpf || null, telefone || null, pix || null, banco || null, foto]
        );
        res.redirect(redirect_to || "/diaristas");
    } catch (error) {
        console.error("Erro ao cadastrar colaborador:", error);
        res.status(500).send("Erro interno ao salvar colaborador.");
    }
});

//EDITAR COLABORADOR
router.post("/cadastros/usuarios/editar/:id", uploadUsuarios.single("foto"), async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const id = req.params.id;
    const { nome, tipo_usuario, cpf, telefone, pix, banco, redirect_to } = req.body;

    try {
        if (req.file) {
            const novaFoto = "usuarios/perfil/" + req.file.filename;

            const [[oldUser]] = await db.promise().query("SELECT foto FROM usuarios WHERE id = ?", [id]);
            if (oldUser && oldUser.foto) {
                const fs = require('fs');
                const path = require('path');
                const oldFilePath = path.join(__dirname, "uploads", oldUser.foto);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }

            await db.promise().query(
                "UPDATE usuarios SET nome=?, tipo_usuario=?, cpf=?, telefone=?, pix=?, banco=?, foto=? WHERE id=?",
                [nome, tipo_usuario, cpf, telefone, pix, banco, novaFoto, id]
            );
        } else {
            await db.promise().query(
                "UPDATE usuarios SET nome=?, tipo_usuario=?, cpf=?, telefone=?, pix=?, banco=? WHERE id=?",
                [nome, tipo_usuario, cpf, telefone, pix, banco, id]
            );
        }
        res.redirect(redirect_to || "/diaristas");
    } catch (error) {
        console.error("Erro ao editar colaborador:", error);
        res.status(500).send("Erro interno ao atualizar colaborador.");
    }
});

//EXCLUIR COLABORADOR
router.post("/cadastros/usuarios/excluir/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const id = req.params.id;
    const redirect_to = req.body.redirect_to || "/diaristas";

    try {
        const [[oldUser]] = await db.promise().query("SELECT foto FROM usuarios WHERE id = ?", [id]);
        if (oldUser && oldUser.foto) {
            const fs = require('fs');
            const path = require('path');
            const caminho = path.join(__dirname, "uploads", oldUser.foto);
            if (fs.existsSync(caminho)) {
                fs.unlinkSync(caminho);
            }
        }

        await db.promise().query("DELETE FROM usuarios WHERE id = ?", [id]);
        res.redirect(redirect_to);
    } catch (error) {
        console.error("Erro ao excluir colaborador:", error);
        res.status(500).send("Erro ao excluir. Verifique se existem registos dependentes deste colaborador.");
    }
});

// =========================================================================
// ROTA POST: MEU PERFIL (PARA NÃO-ADMINS / ACESSO GERAL VIA MENU) - SUPORTE A AJAX
// =========================================================================
router.post("/usuarios/meu-perfil", uploadUsuarios.single("foto"), (req, res) => {
    if (!req.session.user) {
        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.status(401).json({ success: false, message: "Não logado." });
        }
        return res.status(401).send("Não logado.");
    }

    const id = req.session.user.id;
    const { nome, senha } = req.body;
    const novaFoto = req.file ? "usuarios/perfil/" + req.file.filename : null;

    const executarUpdate = () => {
        let sql;
        let params;

        if (!senha || senha.trim() === "") {
            if (novaFoto) {
                sql = "UPDATE usuarios SET nome=?, foto=? WHERE id=?";
                params = [nome, novaFoto, id];
            } else {
                sql = "UPDATE usuarios SET nome=? WHERE id=?";
                params = [nome, id];
            }
        } else {
            if (novaFoto) {
                sql = "UPDATE usuarios SET nome=?, senha=?, foto=? WHERE id=?";
                params = [nome, senha, novaFoto, id];
            } else {
                sql = "UPDATE usuarios SET nome=?, senha=? WHERE id=?";
                params = [nome, senha, id];
            }
        }

        db.query(sql, params, (err) => {
            if (err) {
                console.error("Erro ao atualizar perfil:", err);
                if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
                    return res.status(500).json({ success: false, message: "Erro ao atualizar perfil." });
                }
                return res.status(500).send("Erro ao atualizar perfil.");
            }

            req.session.user.nome = nome;
            if (novaFoto) {
                req.session.user.foto = novaFoto;
            }

            // Se for chamada via AJAX, retorna JSON
            if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
                return res.json({
                    success: true,
                    nome: req.session.user.nome,
                    fotoUrl: req.session.user.foto ? '/uploads/' + req.session.user.foto : null
                });
            }

            // Fallback clássico
            const referer = req.get('Referrer') || '/home';
            try {
                const url = new URL(referer, `http://${req.headers.host}`);
                url.searchParams.set('perfilEditado', '1');
                return res.redirect(url.pathname + url.search);
            } catch(e) {
                return res.redirect(referer);
            }
        });
    };

    if (novaFoto) {
        db.query("SELECT foto FROM usuarios WHERE id = ?", [id], (errSel, rows) => {
            if (!errSel && rows.length > 0 && rows[0].foto) {
                const fotoAntiga = rows[0].foto;
                const caminho = path.join(__dirname, "uploads", fotoAntiga);
                const fs = require('fs');
                if (fs.existsSync(caminho)) {
                    fs.unlink(caminho, (errUnlink) => {
                        if (errUnlink) console.warn("Erro ao remover foto antiga do perfil:", errUnlink);
                    });
                }
            }
            executarUpdate();
        });
    } else {
        executarUpdate();
    }
});

module.exports = router;