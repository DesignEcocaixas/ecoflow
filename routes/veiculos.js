const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");

const { uploadVeiculosFotos, uploadVeiculosManutencao } = require("../config/uploadConfig");
const veiculosView = require("../views/veiculosView");

//------------------------------------------------------------------------------ROTAS PARA VEÍCULOS------------------------------------------------------------------------------
//LISTAR VEÍCULOS
router.get("/veiculos", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    db.query("SELECT * FROM veiculos ORDER BY id DESC", (err, veiculos) => {
        if (err) {
            console.error("Erro ao listar veículos:", err);
            return res.send("Erro ao carregar veículos.");
        }
        if (!veiculos.length) return res.send(veiculosView(req.session.user, [], {}));

        const ids = veiculos.map(v => v.id);
        db.query(
            "SELECT * FROM veiculo_checklists WHERE veiculo_id IN (?) ORDER BY data_servico DESC, id DESC",
            [ids],
            (e2, rows) => {
                if (e2) {
                    console.error("Erro ao buscar checklists de veículos:", e2);
                    return res.send(veiculosView(req.session.user, veiculos, {}));
                }
                const map = {};
                rows.forEach(r => {
                    if (!map[r.veiculo_id]) map[r.veiculo_id] = [];
                    map[r.veiculo_id].push(r);
                });
                res.send(veiculosView(req.session.user, veiculos, map));
            }
        );
    });
});

// CADASTRAR VEÍCULO
router.post("/veiculos/novo", uploadVeiculosFotos.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { marca, modelo, ano, km } = req.body;

    // Salva com o prefixo da pasta
    const foto = req.file ? "veiculos/fotos/" + req.file.filename : null;

    db.query(
        "INSERT INTO veiculos (marca, modelo, ano, km, foto, atualizado_por) VALUES (?, ?, ?, ?, ?, ?)",
        [marca, modelo, Number(ano), Number(km), foto, req.session.user.nome],
        (err) => {
            if (err) {
                console.error("Erro ao cadastrar veículo:", err);
                return res.send("Erro ao cadastrar veículo.");
            }
            // notificação opcional
            db.query("INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'caixa')",
                [`Veículo ${marca} ${modelo} (${ano}) cadastrado por ${req.session.user.nome}`]);
            res.redirect("/veiculos");
        }
    );
});

// EDITAR VEÍCULO
router.post("/veiculos/editar/:id", uploadVeiculosFotos.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params;
    const { marca, modelo, ano, km } = req.body;

    // Salva com o prefixo da pasta
    const novaFoto = req.file ? "veiculos/fotos/" + req.file.filename : null;

    if (novaFoto) {
        // atualiza com nova foto (e remove a antiga fisicamente)
        db.query("SELECT foto FROM veiculos WHERE id = ?", [id], (e1, r1) => {
            if (!e1 && r1.length && r1[0].foto) {
                const fs = require("fs");
                const path = require("path");
                const oldPath = path.join(__dirname, "uploads", r1[0].foto);
                fs.existsSync(oldPath) && fs.unlink(oldPath, () => { });
            }
            db.query(
                "UPDATE veiculos SET marca=?, modelo=?, ano=?, km=?, foto=?, atualizado_por=? WHERE id=?",
                [marca, modelo, Number(ano), Number(km), novaFoto, req.session.user.nome, id],
                (err) => {
                    if (err) {
                        console.error("Erro ao editar veículo:", err);
                        return res.send("Erro ao editar veículo.");
                    }
                    db.query("INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'caixa')",
                        [`Veículo ${marca} ${modelo} (${ano}) editado por ${req.session.user.nome}`]);
                    res.redirect("/veiculos");
                }
            );
        });
    } else {
        // atualiza sem mexer na foto
        db.query(
            "UPDATE veiculos SET marca=?, modelo=?, ano=?, km=?, atualizado_por=? WHERE id=?",
            [marca, modelo, Number(ano), Number(km), req.session.user.nome, id],
            (err) => {
                if (err) {
                    console.error("Erro ao editar veículo:", err);
                    return res.send("Erro ao editar veículo.");
                }
                db.query("INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'caixa')",
                    [`Veículo ${marca} ${modelo} (${ano}) editado por ${req.session.user.nome}`]);
                res.redirect("/veiculos");
            }
        );
    }
});

// EXCLUIR VEÍCULO
router.post("/veiculos/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params;
    db.query("SELECT foto, marca, modelo, ano FROM veiculos WHERE id = ?", [id], (e1, r1) => {
        if (e1 || !r1.length) {
            console.error("Erro ao buscar veículo para excluir:", e1);
            return res.redirect("/veiculos");
        }
        const { foto, marca, modelo, ano } = r1[0];

        db.query("DELETE FROM veiculos WHERE id=?", [id], (err) => {
            if (err) {
                console.error("Erro ao excluir veículo:", err);
                return res.send("Erro ao excluir veículo.");
            }
            // remove foto do disco de forma segura
            if (foto) {
                const fs = require("fs");
                const path = require("path");
                const p = path.join(__dirname, "uploads", foto);
                fs.existsSync(p) && fs.unlink(p, () => { });
            }
            db.query("INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'caixa')",
                [`Veículo ${marca} ${modelo} (${ano}) excluído por ${req.session.user.nome}`]);
            res.redirect("/veiculos");
        });
    });
});

//------------------------------------------------------------------------------ROTAS PARA CHECKLISTS DE VEÍCULOS------------------------------------------------------------------------------
// CADASTRAR CHECKLIST DE VEÍCULO
router.post("/veiculos/:id/checklists/novo", uploadVeiculosManutencao.single("documento"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params; // veiculo_id
    const { servico, oficina, mecanico, valor, data_servico, km_servico } = req.body;

    // A MÁGICA AQUI: Salva com o prefixo da pasta
    const documento = req.file ? "veiculos/manutencao/" + req.file.filename : null;

    db.query(
        `INSERT INTO veiculo_checklists
     (veiculo_id, servico, oficina, mecanico, valor, data_servico, km_servico, documento, atualizado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, servico, oficina, mecanico, valor, data_servico, km_servico, documento, req.session.user.nome],
        (err) => {
            if (err) {
                console.error("Erro ao inserir checklist do veículo:", err);
                return res.send("Erro ao cadastrar checklist do veículo.");
            }
            db.query("INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'veiculo')",
                [`Checklist (${oficina}) adicionado ao veículo #${id} por ${req.session.user.nome}`]);
            res.redirect("/veiculos");
        }
    );
});

// EDITAR CHECKLIST DE VEÍCULO
router.post("/veiculos/checklists/editar/:chkId", uploadVeiculosManutencao.single("documento"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { chkId } = req.params;
    const { servico, oficina, mecanico, valor, data_servico, km_servico } = req.body;

    // A MÁGICA AQUI: Salva com o prefixo da pasta
    const novoDoc = req.file ? "veiculos/manutencao/" + req.file.filename : null;

    const updateBase = `UPDATE veiculo_checklists
                      SET servico=?, oficina=?, mecanico=?, valor=?, data_servico=?, km_servico=?, atualizado_por=?`;
    const paramsBase = [servico, oficina, mecanico, valor, data_servico, km_servico, req.session.user.nome];

    if (novoDoc) {
        db.query("SELECT documento, veiculo_id FROM veiculo_checklists WHERE id=?", [chkId], (e1, r1) => {
            if (e1 || !r1.length) return res.redirect("/veiculos");
            const old = r1[0].documento;

            // Apaga o documento antigo fisicamente (suporta antigas na raiz e novas na subpasta)
            if (old) {
                const p = require("path").join(__dirname, "uploads", old);
                const fs = require("fs");
                fs.existsSync(p) && fs.unlink(p, () => { });
            }

            db.query(updateBase + `, documento=? WHERE id=?`, [...paramsBase, novoDoc, chkId], (err) => {
                if (err) return res.send("Erro ao editar checklist.");
                res.redirect("/veiculos");
            });
        });
    } else {
        db.query(updateBase + ` WHERE id=?`, [...paramsBase, chkId], (err) => {
            if (err) return res.send("Erro ao editar checklist.");
            res.redirect("/veiculos");
        });
    }
});

// EXCLUIR CHECKLIST DE VEÍCULO
router.post("/veiculos/checklists/excluir/:chkId", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { chkId } = req.params;
    db.query("SELECT documento FROM veiculo_checklists WHERE id=?", [chkId], (e1, r1) => {
        if (e1 || !r1.length) return res.redirect("/veiculos");
        const doc = r1[0].documento;

        db.query("DELETE FROM veiculo_checklists WHERE id=?", [chkId], (err) => {
            if (err) return res.send("Erro ao excluir checklist.");

            // Apaga o documento antigo fisicamente
            if (doc) {
                const p = require("path").join(__dirname, "uploads", doc);
                const fs = require("fs");
                fs.existsSync(p) && fs.unlink(p, () => { });
            }
            res.redirect("/veiculos");
        });
    });
});

module.exports = router;