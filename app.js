require("dotenv").config();
const express = require("express");
const session = require("express-session");
const http = require("http");
const bodyParser = require("body-parser");
const path = require("path");
const MySQLStore = require("express-mysql-session")(session);

const db = require("./db");

const { Server } = require("socket.io");
const app = express();
const PORT = process.env.PORT;

const server = http.createServer(app);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Cria o armazenador de sessões aproveitando o seu pool de conexão existente
const sessionStore = new MySQLStore({
    clearExpired: true, // Limpa automaticamente sessões velhas do banco
    checkExpirationInterval: 900000, // Limpa a cada 15 minutos
    expiration: 1000 * 60 * 60 * 12 // Duração de 12 horas
}, db.promise()); // Usa a mesma promessa de conexão do banco

// Configuração da sessão atualizada
app.use(session({
    key: 'ecoflow_cookie',
    secret: process.env.SESSION_SECRET,
    store: sessionStore, // Define o MySQL como motor de gravação
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 12 // 12 horas
    }
}));

// ESCUDO DO DEV LAB (Safe Mode)
app.use((req, res, next) => {
    if (req.headers['x-devlab-safemode'] === 'true') {
        // Deixa os métodos de leitura passarem normalmente
        if (req.method === 'GET') return next();
        
        // Em POST, aborta a requisição antes do controlador para não criar "lixo" no banco,
        // mas devolve 200 OK para o Dev Lab confirmar que a rota e a rede estão ativas.
        if (req.method === 'POST') {
            return res.status(200).json({ 
                success: true, 
                message: "[Safe Mode] Rota alcançada, mas inserção no DB evitada." 
            });
        }
    }
    next(); // Para requisições normais ou testes individuais, segue o fluxo real
});

const io = new Server(server, {
    cors: { origin: "*" }
});

app.set("io", io);

const motoristasOnline = new Map();
// key: nomeFinal (chave fixa)
// value: { id, nome, socketId, lat, lng, accuracy, origem, updatedAt, online }

io.on("connection", (socket) => {
    socket.on("motorista:online", ({ nome }) => {
        const nomeFinal = (nome || socket.data.nome || "Motorista").trim();
        socket.data.nome = nomeFinal;

        const atual = motoristasOnline.get(nomeFinal) || { id: nomeFinal, nome: nomeFinal };

        motoristasOnline.set(nomeFinal, {
            ...atual,
            id: nomeFinal,          // id fixo para o front
            nome: nomeFinal,
            socketId: socket.id,    // guarda o socket atual
            online: true,
            updatedAt: new Date()
        });

        io.to("admins").emit(
            "motoristas:update",
            Array.from(motoristasOnline.values())
        );
    });

    socket.on("motorista:posicao", ({ nome, lat, lng, accuracy, origem }) => {
        const nomeFinal = (nome || socket.data.nome || "Motorista").trim();
        socket.data.nome = nomeFinal;

        if (typeof lat !== "number" || typeof lng !== "number") return;

        const atual = motoristasOnline.get(nomeFinal) || { id: nomeFinal, nome: nomeFinal };

        motoristasOnline.set(nomeFinal, {
            ...atual,
            id: nomeFinal,          // id fixo para o front
            nome: nomeFinal,
            socketId: socket.id,    // atualiza o socket atual (importante ao reconectar)
            lat,
            lng,
            accuracy,
            origem,
            updatedAt: new Date(),
            online: true
        });

        io.to("admins").emit(
            "motoristas:update",
            Array.from(motoristasOnline.values())
        );
    });

    socket.on("admin:join", () => {
        socket.join("admins");
        // manda o snapshot atual quando o admin entrar (com id fixo)
        socket.emit("motoristas:update", Array.from(motoristasOnline.values()));
    });

    socket.on("disconnect", () => {
        const nomeFinal = (socket.data.nome || "").trim();
        if (!nomeFinal) return;

        if (motoristasOnline.has(nomeFinal)) {
            const m = motoristasOnline.get(nomeFinal);

            // Só marca offline se este disconnect for do socket ATUAL daquele motorista
            // (evita ficar offline depois que reconectou)
            if (m && m.socketId === socket.id) {
                motoristasOnline.set(nomeFinal, {
                    ...m,
                    online: false,
                    updatedAt: new Date()
                });
            }
        }

        io.to("admins").emit(
            "motoristas:update",
            Array.from(motoristasOnline.values())
        );
    });
});

//---------------------------------------------------ROTAS DO SISTEMA---------------------------------------------------
const authRoutes = require("./routes/auth");
app.use("/", authRoutes);

const usuariosRoutes = require("./routes/usuarios");
app.use("/", usuariosRoutes);

const caixasRoutes = require("./routes/caixas");
app.use("/", caixasRoutes);

const fornecedoresRoutes = require("./routes/fornecedores");
app.use("/", fornecedoresRoutes);

const checklistMotoristasRoutes = require("./routes/checklistMotoristas");
app.use("/", checklistMotoristasRoutes);

const notificacoesRoutes = require("./routes/notificacoes");
app.use("/", notificacoesRoutes);

const veiculosRoutes = require("./routes/veiculos");
app.use("/", veiculosRoutes);

const entregasRoutes = require("./routes/entregas");
app.use("/", entregasRoutes);

const chapasRoutes = require("./routes/chapas");
app.use("/", chapasRoutes);

const entradasSaidasRoutes = require("./routes/entradasSaidas");
app.use("/", entradasSaidasRoutes);

const cadernosRoutes = require("./routes/cadernos");
app.use("/", cadernosRoutes);

const producaoRoutes = require("./routes/producao");
app.use("/", producaoRoutes);

const propostasRoutes = require("./routes/propostas");
app.use("/", propostasRoutes);

const gabaritosRoutes = require("./routes/gabaritos");
app.use("/", gabaritosRoutes);

const pagamentosRoutes = require("./routes/pagamentos");
app.use("/", pagamentosRoutes);

const diaristasRoutes = require("./routes/diaristas");
app.use("/", diaristasRoutes);

const mensagensRoutes = require("./routes/mensagens");
app.use("/", mensagensRoutes);

const workspacesRoutes = require("./routes/workspaces");
app.use("/", workspacesRoutes);

const kanbanRoutes = require("./routes/kanban");
app.use("/", kanbanRoutes);

// Importando o testador
const testeRoutes = require('./routes/testes');
app.use('/', testeRoutes);

//WEB SOCKETS DO CRUD DO KANBAN
io.on("connection", (socket) => {
    console.log("Novo utilizador conectado ao Kanban");

    // CRIAR NOVA ETIQUETA
    socket.on("nova_etiqueta", (dados) => {
        db.query("INSERT INTO kanban_etiquetas (espaco_id, nome, cor) VALUES (?, ?, ?)", 
        [dados.espaco_id, dados.nome, dados.cor], (err, result) => {
            if (!err) {
                io.emit("nova_etiqueta_criada", { 
                    id: result.insertId, 
                    espaco_id: dados.espaco_id, 
                    nome: dados.nome, 
                    cor: dados.cor 
                });
            } else {
                console.error("Erro ao criar etiqueta:", err);
            }
        });
    });

    // APAGAR ETIQUETA
    socket.on("deletar_etiqueta", (id) => {
        db.query("DELETE FROM kanban_etiquetas WHERE id = ?", [id], (err) => {
            if (!err) {
                io.emit("etiqueta_deletada_global", id);
            } else {
                console.error("Erro ao deletar etiqueta:", err);
            }
        });
    });

    //CRIAR NOVA COLUNA
    socket.on("nova_coluna", (dados) => {
        db.query("SELECT MAX(ordem) as max_ordem FROM kanban_colunas WHERE espaco_id = ?", [dados.espaco_id], (err, result) => {
            const ordem = (result[0].max_ordem || 0) + 1;

            db.query("INSERT INTO kanban_colunas (titulo, ordem, cor, espaco_id) VALUES (?, ?, ?, ?)",
                [dados.titulo, ordem, dados.cor, dados.espaco_id], (err, insertRes) => {
                    if (err) return console.error(err);

                    io.emit("coluna_criada", {
                        id: insertRes.insertId,
                        titulo: dados.titulo,
                        ordem: ordem,
                        cor: dados.cor,
                        espaco_id: dados.espaco_id
                    });
                });
        });
    });

    //EDITAR COR DA COLUNA
    socket.on("atualizar_cor_coluna", (dados) => {
        db.query("UPDATE kanban_colunas SET cor = ? WHERE id = ?", [dados.cor, dados.colunaId], (err) => {
            if (err) return console.error(err);
            // Avisa todos os usuários para pintarem a coluna
            io.emit("cor_coluna_atualizada", dados);
        });
    });

    //EDITAR TÍTULO DA COLUNA 
    socket.on("atualizar_titulo_coluna", (dados) => {
        db.query("UPDATE kanban_colunas SET titulo = ? WHERE id = ?", [dados.titulo, dados.colunaId], (err) => {
            if (err) return console.error(err);
            // Avisa todos os usuários para atualizarem o título da coluna
            io.emit("titulo_coluna_atualizado", dados);
        });
    });

    //APAGAR COLUNA
    socket.on("deletar_coluna", (colunaId) => {
        db.query("DELETE FROM kanban_colunas WHERE id = ?", [colunaId], (err) => {
            if (err) return console.error(err);
            io.emit("coluna_deletada", colunaId);
        });
    });

    //CRIAR CARD
    socket.on("novo_card", (dados) => {
        db.query("INSERT INTO kanban_cards (coluna_id, titulo, descricao, ordem) VALUES (?, ?, ?, 999)",
            [dados.colunaId, dados.titulo, dados.descricao], (err, result) => {
                if (err) return console.error(err);
                const newId = result.insertId;

                // Grava no histórico
                db.query("INSERT INTO kanban_historico (card_id, acao, usuario) VALUES (?, 'Card Criado', ?)", [newId, dados.usuario || 'Sistema']);

                db.query("SELECT * FROM kanban_cards WHERE id = ?", [newId], (err, rows) => {
                    io.emit("card_criado", rows[0]);
                });
            });
    });

    // WEBSOCKET: MOVER E REORDENAR CARDS
    socket.on('mover_card', async (dados) => {
        try {
            // 1. Atualiza a coluna do card movido
            await db.promise().query("UPDATE kanban_cards SET coluna_id = ? WHERE id = ?", [dados.novaColunaId, dados.cardId]);

            // 2. Atualiza a ordem de TODOS os cards daquela coluna
            if (dados.novaOrdemArray && dados.novaOrdemArray.length > 0) {
                for (let i = 0; i < dados.novaOrdemArray.length; i++) {
                    await db.promise().query("UPDATE kanban_cards SET ordem = ? WHERE id = ?", [i, dados.novaOrdemArray[i]]);
                }
            }

            // 3. Regista no histórico com o NOME EXATO da coluna
            const acaoTexto = dados.nomeColuna ? `Movido para ${dados.nomeColuna}` : 'Moveu ou reordenou o card';

            await db.promise().query(
                "INSERT INTO kanban_historico (card_id, acao, usuario) VALUES (?, ?, ?)",
                [dados.cardId, acaoTexto, dados.usuario || 'Sistema']
            );

            // Dispara a reordenação em tempo real para todos os outros ecrãs
            io.emit('card_movido', dados);

        } catch (error) {
            console.error("Erro ao mover e reordenar card:", error);
        }
    });

    // EDITAR CARD KANBAN (ÚNICO E MULTI-DADOS)
    socket.on("atualizar_card", (dados) => {
        // Atualiza todos os campos base, incluindo prazo e prioridade
        const query = "UPDATE kanban_cards SET titulo = ?, descricao = ?, concluido = ?, prazo = ?, prioridade = ? WHERE id = ?";
        const valores = [
            dados.titulo,
            dados.descricao,
            dados.concluido,
            dados.prazo || null,
            dados.prioridade || 'normal', // Usa 'normal' como padrão se vier vazio
            dados.id
        ];

        db.query(query, valores, (err) => {
            if (err) return console.error("Erro ao atualizar card:", err);

            // Se as etiquetas foram enviadas no evento, atualiza as relações no banco de dados
            if (dados.etiquetas !== undefined) {
                // Limpa as etiquetas antigas vinculadas a este card
                db.query("DELETE FROM kanban_cards_etiquetas WHERE card_id = ?", [dados.id], () => {
                    // Insere as novas etiquetas
                    if (dados.etiquetas.length > 0) {
                        const values = dados.etiquetas.map(tagId => [dados.id, tagId]);
                        db.query("INSERT INTO kanban_cards_etiquetas (card_id, etiqueta_id) VALUES ?", [values], () => {
                            io.emit("card_atualizado", dados);
                        });
                    } else {
                        // Nenhuma etiqueta nova para inserir
                        io.emit("card_atualizado", dados);
                    }
                });
            } else {
                // Atualiza sem mexer nas etiquetas
                io.emit("card_atualizado", dados);
            }

            // Gera o histórico de quem alterou o card
            const acao = dados.concluido ? "Marcado como Concluído" : "Informações atualizadas";
            db.query("INSERT INTO kanban_historico (card_id, acao, usuario) VALUES (?, ?, ?)",
                [dados.id, acao, dados.usuario || 'Sistema']);
        });
    });

    //APAGAR CARD
    socket.on("deletar_card", (cardId) => {
        db.query("DELETE FROM kanban_cards WHERE id = ?", [cardId], (err) => {
            if (err) return console.error(err);
            io.emit("card_deletado", cardId);
        });
    });

    socket.on("disconnect", () => {
        console.log("Utilizador desconectado do Kanban");
    });
});

//ROTA PARA PINGAR A SESSÃO ENQUANTO ESTIVER COM ABA ABERTA. EVITA DESCONEXÕES INESPERADAS
app.get("/ping-sessao", (req, res) => {
    if (req.session.user) {
        return res.status(200).json({ status: "ativo" });
    }
    return res.status(401).json({ status: "expirado" });
});

server.listen(PORT, '0.0.0.0', () => console.log("Servidor rodando na porta " + PORT));