// app.js
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const db = require("./db");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const loginView = require("./views/loginView");
const homeView = require("./views/homeView");
const cadastroView = require("./views/cadastroView");
const tabelaPrecosView = require("./views/tabelaPrecosView");
const checklistMotoristasView = require("./views/checklistMotoristasView");
const veiculosView = require("./views/veiculosView");

const app = express();
const PORT = 3000;

// pasta de uploads pública
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// configura o multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "uploads");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ts = Date.now();
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
        cb(null, `${base}_${ts}${ext}`);
    }
});
const upload = multer({ storage });


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "chave-secreta", // troque por algo seguro
    resave: false,
    saveUninitialized: true
}));

app.get("/login", (req, res) => {
    if (req.session.user) {
        // Se já está logado, vai direto para home
        return res.redirect("/home");
    }

    // Impede cache
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.send(loginView());
});

app.get("/check-session", (req, res) => {
    if (req.session.user) {
        return res.json({ logado: true, usuario: req.session.user });
    }
    res.json({ logado: false });
});


// Rota POST /login -> valida login
app.post("/login", (req, res) => {
    const { email, senha, lembrar } = req.body;

    db.query("SELECT * FROM usuarios WHERE email = ? AND senha = ?", [email, senha], (err, results) => {
        if (err) {
            console.error("Erro no banco:", err);
            return res.send(loginView("Erro interno. Tente novamente."));
        }

        if (results.length > 0) {
            req.session.user = results[0];

            if (lembrar) {
                // Sessão expira em 7 dias
                req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
            } else {
                // Sessão expira ao fechar o navegador
                req.session.cookie.expires = false;
            }

            return res.redirect("/home");
        } else {
            return res.send(loginView("Usuário ou senha inválidos"));
        }
    });
});

app.get("/home", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    res.send(homeView(req.session.user));
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Erro ao encerrar sessão:", err);
        }
        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
});


app.get("/cadastro", (req, res) => {
    if (!req.session.user) return res.redirect("/login");            // precisa estar logado
    if (req.session.user.tipo_usuario !== "admin")                   // só admin acessa
        return res.status(403).send("Acesso negado.");

    db.query("SELECT id, nome, email, tipo_usuario FROM usuarios ORDER BY id DESC", (err, rows) => {
        if (err) {
            console.error("Erro ao listar usuários:", err);
            return res.status(500).send("Erro ao carregar usuários.");
        }
        // >>> PASSA o user aqui <<<
        res.send(cadastroView(req.session.user, rows || []));
    });
});


// CRIAR USUÁRIO
app.post("/usuarios/novo", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { nome, email, senha, tipo_usuario } = req.body;

    db.query(
        "INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)",
        [nome, email, senha, tipo_usuario],
        (err) => {
            if (err) {
                console.error("Erro ao cadastrar:", err);
                // Recarrega a tela de cadastro com a lista e erro
                return db.query(
                    "SELECT id, nome, email, tipo_usuario FROM usuarios ORDER BY id DESC",
                    (erro2, rows) => {
                        if (erro2) return res.status(500).send("Erro no sistema.");
                        // Se sua view aceitar mensagem, passe como 3º arg. Se não, apenas renderize.
                        return res.send(cadastroView(req.session.user, rows || []));
                    }
                );
            }
            return res.redirect("/cadastro");
        }
    );
});

// EDITAR USUÁRIO
app.post("/usuarios/editar/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params;
    const { nome, email, senha, tipo_usuario } = req.body;

    // Se senha vier vazia, não altera a senha
    if (!senha || senha.trim() === "") {
        db.query(
            "UPDATE usuarios SET nome=?, email=?, tipo_usuario=? WHERE id=?",
            [nome, email, tipo_usuario, id],
            (err) => {
                if (err) {
                    console.error("Erro ao editar usuário (sem senha):", err);
                    return res.status(500).send("Erro ao editar usuário.");
                }
                return res.redirect("/cadastro");
            }
        );
    } else {
        db.query(
            "UPDATE usuarios SET nome=?, email=?, senha=?, tipo_usuario=? WHERE id=?",
            [nome, email, senha, tipo_usuario, id],
            (err) => {
                if (err) {
                    console.error("Erro ao editar usuário (com senha):", err);
                    return res.status(500).send("Erro ao editar usuário.");
                }
                return res.redirect("/cadastro");
            }
        );
    }
});

// EXCLUIR USUÁRIO
app.post("/usuarios/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params;

    db.query("DELETE FROM usuarios WHERE id=?", [id], (err) => {
        if (err) {
            console.error("Erro ao excluir usuário:", err);
            return res.status(500).send("Erro ao excluir usuário.");
        }
        return res.redirect("/cadastro");
    });
});


app.get("/tabela-precos", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    db.query(`
  SELECT c.*, f.nome AS fornecedor_nome, f.porcentagem AS fornecedor_pct
  FROM caixas c
  LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
  ORDER BY c.id DESC
`, (err, caixas) => {
        if (err) {
            console.error("Erro ao buscar caixas:", err);
            return res.send("Erro ao carregar caixas.");
        }

        db.query("SELECT atualizado_em, atualizado_por FROM caixas ORDER BY atualizado_em DESC LIMIT 1", (err2, alteracao) => {
            if (err2) {
                console.error("Erro ao buscar última alteração:", err2);
                return res.send("Erro ao carregar alterações.");
            }

            db.query("SELECT * FROM fornecedores ORDER BY criado_em DESC", (err3, fornecedores) => {
                if (err3) {
                    console.error("Erro ao buscar fornecedores:", err3);
                    return res.send("Erro ao carregar fornecedores.");
                }

                const ultimaAlteracao = alteracao.length > 0 ? alteracao[0] : null;

                res.send(tabelaPrecosView(req.session.user, caixas, ultimaAlteracao, fornecedores));
            });
        });
    });

});




app.post("/tabela-precos/nova", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

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


// POST editar caixa
app.post("/tabela-precos/editar/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

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


// POST excluir caixa
app.post("/tabela-precos/excluir/:id", (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM caixas WHERE id=?", [id], (err) => {
        if (err) {
            console.error("Erro ao excluir caixa:", err);
        }
        res.redirect("/tabela-precos");
    });
});

app.get("/checklist-motoristas", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    // Agora tanto motorista quanto admin podem acessar
    if (req.session.user.tipo_usuario !== "motorista" && req.session.user.tipo_usuario !== "admin") {
        return res.status(403).send("Acesso negado.");
    }

    db.query("SELECT * FROM checklists ORDER BY criado_em DESC", (err, results) => {
        if (err) {
            console.error("Erro ao buscar checklists:", err);
            return res.send("Erro ao carregar checklists.");
        }
        res.send(checklistMotoristasView(req.session.user, results));
    });
});


app.post("/checklist-motoristas/novo", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "motorista") return res.status(403).send("Acesso negado.");

    db.query(
        "INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'checklist')",
        [`Checklist do veículo ${veiculo} registrado por ${req.session.user.nome}`]
    );


    const {
        veiculo, oleo, agua, freio, direcao, combustivel,
        pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
        responsavel, motorista
    } = req.body;

    db.query(
        `INSERT INTO checklists 
  (veiculo, oleo, agua, freio, direcao, combustivel, pneu_calibragem, pneu_estado, luzes, ruidos, lixo, responsavel, motorista, registrado_por) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [veiculo, oleo, agua, freio, direcao, combustivel, pneu_calibragem, pneu_estado, luzes, ruidos, lixo, responsavel, motorista, req.session.user.nome],
        (err) => {
            if (err) {
                console.error("Erro ao inserir checklist:", err);
            }
            res.redirect("/checklist-motoristas");
        }
    );
});

app.post("/checklist-motoristas/editar/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "motorista") return res.status(403).send("Acesso negado.");

    const { id } = req.params;
    const {
        veiculo, oleo, agua, freio, direcao, combustivel,
        pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
        responsavel, motorista
    } = req.body;

    db.query(
        `UPDATE checklists SET 
      veiculo=?, oleo=?, agua=?, freio=?, direcao=?, combustivel=?, 
      pneu_calibragem=?, pneu_estado=?, luzes=?, ruidos=?, lixo=?, 
      responsavel=?, motorista=?, atualizado_por=? 
    WHERE id=?`,
        [veiculo, oleo, agua, freio, direcao, combustivel, pneu_calibragem, pneu_estado, luzes, ruidos, lixo, responsavel, motorista, req.session.user.nome, id],
        (err) => {
            if (err) {
                console.error("Erro ao atualizar checklist:", err);
            }
            res.redirect("/checklist-motoristas");
        }
    );
});

app.post("/checklist-motoristas/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "motorista") return res.status(403).send("Acesso negado.");

    const { id } = req.params;

    db.query("DELETE FROM checklists WHERE id=?", [id], (err) => {
        if (err) {
            console.error("Erro ao excluir checklist:", err);
        }
        res.redirect("/checklist-motoristas");
    });
});

app.get("/checklist-motoristas/download/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "motorista") return res.status(403).send("Acesso negado.");

    const { id } = req.params;

    db.query("SELECT * FROM checklists WHERE id=?", [id], async (err, results) => {
        if (err || results.length === 0) {
            console.error("Erro ao gerar planilha:", err);
            return res.send("Erro ao gerar planilha.");
        }

        const checklist = results[0];

        // Criar planilha
        const ExcelJS = require("exceljs");
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Checklist Motorista");

        sheet.columns = [
            { header: "Campo", key: "campo", width: 30 },
            { header: "Valor", key: "valor", width: 40 }
        ];

        // Preencher linhas
        sheet.addRow({ campo: "Veículo", valor: checklist.veiculo });
        sheet.addRow({ campo: "Nível do óleo", valor: checklist.oleo });
        sheet.addRow({ campo: "Nível da água", valor: checklist.agua });
        sheet.addRow({ campo: "Fluído de freio", valor: checklist.freio });
        sheet.addRow({ campo: "Fluído da direção", valor: checklist.direcao });
        sheet.addRow({ campo: "Combustível", valor: checklist.combustivel });
        sheet.addRow({ campo: "Pneus - Calibragem", valor: checklist.pneu_calibragem });
        sheet.addRow({ campo: "Pneus - Estado", valor: checklist.pneu_estado });
        sheet.addRow({ campo: "Luzes", valor: checklist.luzes });
        sheet.addRow({ campo: "Ruídos anormais", valor: checklist.ruidos });
        sheet.addRow({ campo: "Remoção do lixo interno", valor: checklist.lixo });
        sheet.addRow({ campo: "Responsável logístico", valor: checklist.responsavel });
        sheet.addRow({ campo: "Motorista", valor: checklist.motorista });
        sheet.addRow({ campo: "Registrado por", valor: checklist.registrado_por });
        sheet.addRow({ campo: "Criado em", valor: new Date(checklist.criado_em).toLocaleString("pt-BR") });

        // Definir nome do arquivo: motorista + data download
        const dataAgora = new Date().toLocaleString("pt-BR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }).replace(/[\/:]/g, "-").replace(" ", "_");

        const nomeArquivo = `checklist_${checklist.motorista}_${dataAgora}.xlsx`;

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);

        await workbook.xlsx.write(res);
        res.end();
    });
});

app.get("/fornecedores", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    db.query("SELECT * FROM fornecedores ORDER BY criado_em DESC", (err, results) => {
        if (err) {
            console.error("Erro ao buscar fornecedores:", err);
            return res.send("Erro ao carregar fornecedores.");
        }
        res.json(results);
    });
});

app.post("/fornecedores/novo", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

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

app.post("/fornecedores/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { id } = req.params;
    db.query("DELETE FROM fornecedores WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("Erro ao excluir fornecedor:", err);
            return res.send("Erro ao excluir fornecedor.");
        }
        res.redirect("/tabela-precos");
    });
});

app.post("/fornecedores/editar/:id", (req, res) => {
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

app.get("/notificacoes", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    db.query("SELECT * FROM notificacoes ORDER BY criado_em DESC LIMIT 10", (err, results) => {
        if (err) {
            console.error("Erro ao buscar notificações:", err);
            return res.send([]);
        }
        res.json(results);
    });
});

app.post("/notificacoes/excluir/:id", (req, res) => {
    if (!req.session.user) return res.status(401).send("Não autorizado");

    const { id } = req.params;
    db.query("DELETE FROM notificacoes WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("Erro ao excluir notificação:", err);
            return res.status(500).send("Erro ao excluir notificação");
        }
        res.sendStatus(200);
    });
});

// --- Rotas de veículos (somente admin) ---
// Listagem de veículos + checklists (map por veículo)
app.get("/veiculos", (req, res) => {
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

// Novo checklist do veículo
app.post("/veiculos/:id/checklists/novo", upload.single("documento"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params; // veiculo_id
    const { servico, oficina, mecanico, valor, data_servico, km_servico } = req.body;
    const documento = req.file ? req.file.filename : null;

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

app.post("/veiculos/checklists/editar/:chkId", upload.single("documento"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { chkId } = req.params;
    const { servico, oficina, mecanico, valor, data_servico, km_servico } = req.body;
    const novoDoc = req.file ? req.file.filename : null;

    const updateBase = `UPDATE veiculo_checklists
                      SET servico=?, oficina=?, mecanico=?, valor=?, data_servico=?, km_servico=?, atualizado_por=?`;
    const paramsBase = [servico, oficina, mecanico, valor, data_servico, km_servico, req.session.user.nome];

    if (novoDoc) {
        db.query("SELECT documento, veiculo_id FROM veiculo_checklists WHERE id=?", [chkId], (e1, r1) => {
            if (e1 || !r1.length) return res.redirect("/veiculos");
            const old = r1[0].documento;
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

app.post("/veiculos/checklists/excluir/:chkId", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { chkId } = req.params;
    db.query("SELECT documento FROM veiculo_checklists WHERE id=?", [chkId], (e1, r1) => {
        if (e1 || !r1.length) return res.redirect("/veiculos");
        const doc = r1[0].documento;

        db.query("DELETE FROM veiculo_checklists WHERE id=?", [chkId], (err) => {
            if (err) return res.send("Erro ao excluir checklist.");
            if (doc) {
                const p = require("path").join(__dirname, "uploads", doc);
                const fs = require("fs");
                fs.existsSync(p) && fs.unlink(p, () => { });
            }
            res.redirect("/veiculos");
        });
    });
});



app.post("/veiculos/novo", upload.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { marca, modelo, ano, km } = req.body;
    const foto = req.file ? req.file.filename : null;

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

app.post("/veiculos/editar/:id", upload.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params;
    const { marca, modelo, ano, km } = req.body;
    const novaFoto = req.file ? req.file.filename : null;

    if (novaFoto) {
        // atualiza com nova foto (e opcionalmente remove a antiga)
        db.query("SELECT foto FROM veiculos WHERE id = ?", [id], (e1, r1) => {
            if (!e1 && r1.length && r1[0].foto) {
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

app.post("/veiculos/excluir/:id", (req, res) => {
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
            // remove foto do disco (opcional)
            if (foto) {
                const p = path.join(__dirname, "uploads", foto);
                fs.existsSync(p) && fs.unlink(p, () => { });
            }
            db.query("INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'caixa')",
                [`Veículo ${marca} ${modelo} (${ano}) excluído por ${req.session.user.nome}`]);
            res.redirect("/veiculos");
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
