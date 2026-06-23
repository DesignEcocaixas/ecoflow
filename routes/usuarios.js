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

    // Atualizado para incluir as novas colunas no SELECT
    db.query("SELECT id, nome, email, tipo_usuario, foto, cpf, telefone, pix, banco FROM usuarios ORDER BY id DESC", (err, rows) => {
        if (err) {
            console.error("Erro ao listar usuários:", err);
            return res.status(500).send("Erro ao carregar usuários.");
        }
        // >>> PASSA o user aqui <<<
        res.send(cadastroView(req.session.user, rows || []));
    });
});

// =========================================================================
// ROTA POST: CRIAR USUÁRIO
// =========================================================================
router.post("/usuarios/novo", uploadUsuarios.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { nome, email, senha, tipo_usuario, cpf, telefone, pix, banco } = req.body;

    // Salva com o prefixo da pasta correspondente
    const foto = req.file ? "usuarios/perfil/" + req.file.filename : null;

    // Lógica para perfis com/sem login
    const isNoLogin = ['motorista_avulso', 'ajudante', 'diarista'].includes(tipo_usuario);
    const finalEmail = (isNoLogin || !email || email.trim() === '') ? null : email;
    const finalSenha = isNoLogin ? null : senha;
    const finalCpf = isNoLogin ? cpf : null;
    const finalTelefone = isNoLogin ? telefone : null;
    const finalPix = isNoLogin ? pix : null;
    const finalBanco = isNoLogin ? banco : null;

    db.query(
        "INSERT INTO usuarios (nome, email, senha, tipo_usuario, foto, cpf, telefone, pix, banco) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [nome, finalEmail, finalSenha, tipo_usuario, foto, finalCpf, finalTelefone, finalPix, finalBanco],
        (err) => {
            if (err) {
                console.error("Erro ao cadastrar:", err);
                return db.query(
                    "SELECT id, nome, email, tipo_usuario, foto, cpf, telefone, pix, banco FROM usuarios ORDER BY id DESC",
                    (erro2, rows) => {
                        if (erro2) return res.status(500).send("Erro no sistema.");
                        return res.send(cadastroView(req.session.user, rows || []));
                    }
                );
            }
            return res.redirect("/cadastro?sucesso=1");
        }
    );
});

// =========================================================================
// ROTA POST: EDITAR USUÁRIO
// =========================================================================
router.post("/usuarios/editar/:id", uploadUsuarios.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params;
    const { nome, email, senha, tipo_usuario, cpf, telefone, pix, banco } = req.body;

    // Salva com o prefixo da pasta. O Multer automaticamente renomeará para id_X_nome.jpg
    const novaFoto = req.file ? "usuarios/perfil/" + req.file.filename : null;

    // Lógica para perfis com/sem login
    const isNoLogin = ['motorista_avulso', 'ajudante', 'diarista'].includes(tipo_usuario);
    const finalEmail = (isNoLogin || !email || email.trim() === '') ? null : email;
    const finalCpf = isNoLogin ? cpf : null;
    const finalTelefone = isNoLogin ? telefone : null;
    const finalPix = isNoLogin ? pix : null;
    const finalBanco = isNoLogin ? banco : null;

    // Função interna para rodar o UPDATE
    const executarUpdate = () => {
        let sql;
        let params;

        if (!senha || senha.trim() === "" || isNoLogin) {
            if (novaFoto) {
                sql = "UPDATE usuarios SET nome=?, email=?, tipo_usuario=?, foto=?, cpf=?, telefone=?, pix=?, banco=? WHERE id=?";
                params = [nome, finalEmail, tipo_usuario, novaFoto, finalCpf, finalTelefone, finalPix, finalBanco, id];
            } else {
                sql = "UPDATE usuarios SET nome=?, email=?, tipo_usuario=?, cpf=?, telefone=?, pix=?, banco=? WHERE id=?";
                params = [nome, finalEmail, tipo_usuario, finalCpf, finalTelefone, finalPix, finalBanco, id];
            }
        } else {
            if (novaFoto) {
                sql = "UPDATE usuarios SET nome=?, email=?, senha=?, tipo_usuario=?, foto=?, cpf=?, telefone=?, pix=?, banco=? WHERE id=?";
                params = [nome, finalEmail, senha, tipo_usuario, novaFoto, finalCpf, finalTelefone, finalPix, finalBanco, id];
            } else {
                sql = "UPDATE usuarios SET nome=?, email=?, senha=?, tipo_usuario=?, cpf=?, telefone=?, pix=?, banco=? WHERE id=?";
                params = [nome, finalEmail, senha, tipo_usuario, finalCpf, finalTelefone, finalPix, finalBanco, id];
            }
        }

        db.query(sql, params, (err) => {
            if (err) {
                console.error("Erro ao editar usuário:", err);
                return res.status(500).send("Erro ao editar usuário.");
            }

            // Atualiza a sessão em tempo real
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

    // Se o usuário fez upload de uma foto nova, removemos a antiga do disco primeiro
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

    // Primeiro busca a foto para excluí-la do disco de forma segura
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

        // Em seguida, apaga o registro do banco de dados
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

    // A MÁGICA AQUI: Salva com o prefixo da pasta
    const foto = req.file ? "usuarios/perfil/" + req.file.filename : null;

    try {
        await db.promise().query(
            "INSERT INTO usuarios (nome, tipo_usuario, cpf, telefone, pix, banco, foto) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [nome, tipo_usuario, cpf || null, telefone || null, pix || null, banco || null, foto]
        );
        // O redirect_to garante que a requisição AJAX da view sabe para onde voltar
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

            // 1. Busca a foto antiga para apagá-la do disco (evita acúmulo de lixo)
            const [[oldUser]] = await db.promise().query("SELECT foto FROM usuarios WHERE id = ?", [id]);
            if (oldUser && oldUser.foto) {
                const fs = require('fs');
                const path = require('path');
                const oldFilePath = path.join(__dirname, "uploads", oldUser.foto);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }

            // 2. Atualiza todos os dados INCLUINDO a nova foto
            await db.promise().query(
                "UPDATE usuarios SET nome=?, tipo_usuario=?, cpf=?, telefone=?, pix=?, banco=?, foto=? WHERE id=?",
                [nome, tipo_usuario, cpf, telefone, pix, banco, novaFoto, id]
            );
        } else {
            // Atualiza os dados MANTENDO a foto antiga
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
        // Primeiro busca a foto para excluí-la do diretório 'uploads'
        const [[oldUser]] = await db.promise().query("SELECT foto FROM usuarios WHERE id = ?", [id]);
        if (oldUser && oldUser.foto) {
            const fs = require('fs');
            const path = require('path');
            const caminho = path.join(__dirname, "uploads", oldUser.foto);
            if (fs.existsSync(caminho)) {
                fs.unlinkSync(caminho);
            }
        }

        // Depois apaga o registro do banco
        await db.promise().query("DELETE FROM usuarios WHERE id = ?", [id]);
        res.redirect(redirect_to);
    } catch (error) {
        console.error("Erro ao excluir colaborador:", error);
        res.status(500).send("Erro ao excluir. Verifique se existem registos dependentes deste colaborador.");
    }
});

module.exports = router;