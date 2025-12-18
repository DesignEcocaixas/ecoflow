// app.js
const express = require("express");
const http = require("http");
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
const entregasView = require("./views/entregasView");

const { Server } = require("socket.io");
const app = express();
const PORT = 3000;

const server = http.createServer(app);

// pasta de uploads pública
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const io = new Server(server, {
    cors: { origin: "*" } // se for mesmo domínio, pode deixar padrão
});

// Guarda localização em memória (simples e rápido)
const motoristasOnline = new Map();
// key: socket.id
// value: { nome, lat, lng, updatedAt }

io.on("connection", (socket) => {
    socket.on("motorista:online", ({ nome }) => {
        socket.data.nome = nome || "Motorista";
    });

    socket.on("motorista:posicao", ({ nome, lat, lng, accuracy, origem }) => {
        const nomeFinal = nome || socket.data.nome || "Motorista";
        socket.data.nome = nomeFinal;

        if (typeof lat !== "number" || typeof lng !== "number") return;

        motoristasOnline.set(socket.id, {
            id: socket.id,              // <<< importante pro front identificar
            nome: nomeFinal,
            lat,
            lng,
            accuracy: accuracy ?? null, // opcional
            origem: origem ?? null,     // opcional
            updatedAt: new Date()
        });

        io.to("admins").emit("motoristas:update", Array.from(motoristasOnline.values()));
    });


    socket.on("admin:join", () => {
        socket.join("admins");
        // manda o snapshot atual quando o admin entrar
        socket.emit("motoristas:update", Array.from(motoristasOnline.values()));
    });

    socket.on("disconnect", () => {
        motoristasOnline.delete(socket.id);
        io.to("admins").emit("motoristas:update", Array.from(motoristasOnline.values()));
    });

});

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
    secret: "chave-super-secreta",   // troque por uma chave forte (ex.: gerada pelo openssl)
    resave: false,                   // não salva sessão se nada mudou
    saveUninitialized: false,        // não cria sessões "em branco"
    cookie: {
        httpOnly: true,              // impede acesso por JS no browser
        secure: false,               // true só se usar HTTPS
        maxAge: 1000 * 60 * 60       // 1 hora
    }
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

function isLogged(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect("/login");
    }
    next();
}

app.get("/check-session", (req, res) => {
    if (req.session.user) {
        return res.json({ logado: true, usuario: req.session.user });
    }
    res.json({ logado: false });
});

app.get("/", (req, res) => {
    res.redirect("/login");
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
    if (!req.session.user) return res.redirect("/login");

    db.query(
        "SELECT id, mensagem, tipo, criado_em FROM notificacoes ORDER BY criado_em DESC",
        (err, rows) => {
            if (err) {
                console.error("Erro ao buscar notificações:", err);
                // Se der erro, manda a home sem notificações
                return res.send(homeView(req.session.user, []));
            }

            res.send(homeView(req.session.user, rows || []));
        }
    );
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

    if (
        req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "financeiro"
    ) {
        return res.status(403).send("Acesso negado.");
    }

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = 7;
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


app.post("/tabela-precos/nova", (req, res) => {
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

// POST editar caixa
app.post("/tabela-precos/editar/:id", (req, res) => {
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


// POST excluir caixa
app.post("/tabela-precos/excluir/:id", (req, res) => {
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

app.get("/checklist-motoristas", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const usuario = req.session.user;

    // página atual vinda da query (?page=2)
    const page = parseInt(req.query.page || "1", 10);
    const limit = 4;
    const offset = (page - 1) * limit;

    // Se você quiser que motorista veja só os próprios checklists:
    const where = [];
    const paramsBase = [];

    // ✅ CORREÇÃO: NÃO filtrar por usuario.nome, pois "motorista" é o nome selecionado no formulário.
    // Isso fazia motoristas novos não enxergarem os checklists existentes.
    // if (usuario.tipo_usuario === "motorista") {
    //     where.push("motorista = ?");
    //     paramsBase.push(usuario.nome);
    // }

    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    // 1ª consulta: total de registros (pra calcular páginas)
    const sqlCount = `
    SELECT COUNT(*) AS total
    FROM checklists
    ${whereSql}
  `;

    db.query(sqlCount, paramsBase, (errCount, rowsCount) => {
        if (errCount) {
            console.error("Erro ao contar checklists:", errCount);
            return res.status(500).send("Erro ao carregar checklists.");
        }

        const total = rowsCount[0].total || 0;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        // Garante que page não passe do limite
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        const currentOffset = (currentPage - 1) * limit;

        // 2ª consulta: lista paginada
        const sqlLista = `
      SELECT *
      FROM checklists
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

        const paramsLista = paramsBase.concat([limit, currentOffset]);

        db.query(sqlLista, paramsLista, (errLista, checklists) => {
            if (errLista) {
                console.error("Erro ao buscar checklists:", errLista);
                return res.status(500).send("Erro ao carregar checklists.");
            }

            // Envia pra view, incluindo dados da paginação
            res.send(
                checklistMotoristasView(usuario, checklists, {
                    page: currentPage,
                    totalPages,
                    total,
                })
            );
        });
    });
});




app.post("/checklist-motoristas/novo", upload.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const {
        veiculo, oleo, agua, freio, direcao, combustivel,
        pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
        responsavel, motorista, observacao,
    } = req.body;

    // ✅ CORREÇÃO: motorista é O NOME SELECIONADO NO FORM
    if (!motorista || motorista.trim() === "") {
        return res.status(400).send("Selecione o motorista no formulário.");
    }

    const foto = req.file ? req.file.filename : null;

    db.query(
        "INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'checklist')",
        [`Checklist do veículo ${veiculo} registrado por ${req.session.user.nome}`],
        (errNotif) => {
            if (errNotif) console.error("Erro ao registrar notificação de checklist:", errNotif);
        }
    );

    const sql = `
    INSERT INTO checklists 
      (veiculo, oleo, agua, freio, direcao, combustivel,
       pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
       responsavel, motorista, registrado_por, observacao, foto) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const params = [
        veiculo, oleo, agua, freio, direcao, combustivel,
        pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
        responsavel,
        motorista.trim(),                 // ✅ do formulário
        req.session.user.nome,            // ✅ quem registrou (logado)
        observacao && observacao.trim() !== "" ? observacao : null,
        foto,
    ];

    db.query(sql, params, (err) => {
        if (err) {
            console.error("Erro ao inserir checklist:", err);
            return res.status(500).send("Erro ao inserir checklist.");
        }
        return res.redirect("/checklist-motoristas");
    });
});




app.post("/checklist-motoristas/editar/:id", upload.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;

    // Garante que req.body existe
    const {
        veiculo,
        oleo,
        agua,
        freio,
        direcao,
        combustivel,
        pneu_calibragem,
        pneu_estado,
        luzes,
        ruidos,
        lixo,
        responsavel,
        motorista,
        observacao,
    } = req.body || {};

    const novaFoto = req.file ? req.file.filename : null;

    // Se o usuário enviou uma nova foto, precisamos:
    // 1) buscar a foto antiga
    // 2) apagar do disco (se existir)
    // 3) atualizar o registro com a nova foto
    if (novaFoto) {
        db.query(
            "SELECT foto FROM checklists WHERE id = ?",
            [id],
            (errSel, rows) => {
                if (errSel) {
                    console.error("Erro ao buscar checklist para substituir foto:", errSel);
                    return res.status(500).send("Erro ao atualizar checklist.");
                }

                if (rows.length && rows[0].foto) {
                    const fotoAntiga = rows[0].foto;
                    const caminho = path.join(__dirname, "uploads", fotoAntiga);
                    if (fs.existsSync(caminho)) {
                        fs.unlink(caminho, (errUnlink) => {
                            if (errUnlink) {
                                console.warn("Erro ao remover foto antiga:", errUnlink);
                            }
                        });
                    }
                }

                // Agora atualiza tudo, incluindo a nova foto
                db.query(
                    `UPDATE checklists
           SET veiculo = ?, oleo = ?, agua = ?, freio = ?, direcao = ?, combustivel = ?,
               pneu_calibragem = ?, pneu_estado = ?, luzes = ?, ruidos = ?, lixo = ?,
               responsavel = ?, motorista = ?, observacao = ?, foto = ?
           WHERE id = ?`,
                    [
                        veiculo,
                        oleo,
                        agua,
                        freio,
                        direcao,
                        combustivel,
                        pneu_calibragem,
                        pneu_estado,
                        luzes,
                        ruidos,
                        lixo,
                        responsavel,
                        motorista,
                        observacao && observacao.trim() !== "" ? observacao : null,
                        novaFoto,
                        id,
                    ],
                    (errUpd) => {
                        if (errUpd) {
                            console.error("Erro ao atualizar checklist (com nova foto):", errUpd);
                            return res.status(500).send("Erro ao atualizar checklist.");
                        }
                        return res.redirect("/checklist-motoristas");
                    }
                );
            }
        );
    } else {
        // Sem nova foto: não mexe na coluna foto
        db.query(
            `UPDATE checklists
       SET veiculo = ?, oleo = ?, agua = ?, freio = ?, direcao = ?, combustivel = ?,
           pneu_calibragem = ?, pneu_estado = ?, luzes = ?, ruidos = ?, lixo = ?,
           responsavel = ?, motorista = ?, observacao = ?
       WHERE id = ?`,
            [
                veiculo,
                oleo,
                agua,
                freio,
                direcao,
                combustivel,
                pneu_calibragem,
                pneu_estado,
                luzes,
                ruidos,
                lixo,
                responsavel,
                motorista,
                observacao && observacao.trim() !== "" ? observacao : null,
                id,
            ],
            (errUpd) => {
                if (errUpd) {
                    console.error("Erro ao atualizar checklist (sem nova foto):", errUpd);
                    return res.status(500).send("Erro ao atualizar checklist.");
                }
                return res.redirect("/checklist-motoristas");
            }
        );
    }
});

app.post("/checklist-motoristas/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

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

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

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

app.post("/fornecedores/novo", (req, res) => {
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

app.post("/fornecedores/excluir/:id", (req, res) => {
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

/*------------------------SISTEMA DE NOTIFICAÇÕES---------------------------------*/

// Remover uma notificação
app.post("/notificacoes/:id/excluir", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { id } = req.params;
    db.query("DELETE FROM notificacoes WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("Erro ao remover notificação:", err);
        }
        res.redirect("/home");
    });
});

// Limpar todas as notificações
app.post("/notificacoes/limpar", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    db.query("DELETE FROM notificacoes", (err) => {
        if (err) {
            console.error("Erro ao limpar notificações:", err);
        }
        res.redirect("/home");
    });
});


/*app.get("/notificacoes", (req, res) => {
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
});*/

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

// LISTAR ENTREGAS (pedidos + clientes)
app.get("/entregas", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const usuario = req.session.user;

    // Filtros vindos da query string ou formulário (method="GET")
    const { titulo, data_inicio, data_fim } = req.query;

    // Paginação
    const page = parseInt(req.query.page || "1", 10);
    const limit = 5; // nº de pedidos por página

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



// CRIAR NOVO PEDIDO
app.post("/entregas/novo", isLogged, (req, res) => {
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

// EXCLUIR PEDIDO (cascade apaga clientes)
app.post("/entregas/:id/excluir", isLogged, /* onlyAdmin, */(req, res) => {
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

// ADICIONAR CLIENTE AO PEDIDO
app.post("/entregas/:id/clientes/novo", isLogged, (req, res) => {
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

// EDITAR CLIENTE (status/observação/nome)
app.post("/entregas/clientes/editar/:cid", isLogged, (req, res) => {
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

// EXCLUIR CLIENTE DO PEDIDO
app.post("/entregas/clientes/excluir/:cid", /*isLogged*/ /* onlyAdmin, */(req, res) => {
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

app.get("/health", (req, res) => {
    res.send("OK");
});

server.listen(PORT, '0.0.0.0', () => console.log("Servidor rodando na porta}"));