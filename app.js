// app.js
const express = require("express");
const pdfkit = require("pdfkit");
const axios = require("axios");
const { exec } = require('child_process');
const http = require("http");
const bodyParser = require("body-parser");
const session = require("express-session");
const db = require("./db");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const MySQLStore = require("express-mysql-session")(session);
const loginView = require("./views/loginView");
const homeView = require("./views/homeView");
const cadastroView = require("./views/cadastroView");
const tabelaPrecosView = require("./views/tabelaPrecosView");
const checklistMotoristasView = require("./views/checklistMotoristasView");
const veiculosView = require("./views/veiculosView");
const entregasView = require("./views/entregasView");
const chapasView = require("./views/chapasView");
const entradasSaidasView = require("./views/entradasSaidasView");
const ordemProducaoView = require('./views/ordemProducaoView');

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

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Cria o armazenador de sessões aproveitando o seu pool de conexão existente
const sessionStore = new MySQLStore({
    clearExpired: true, // Limpa automaticamente sessões velhas do banco
    checkExpirationInterval: 900000, // Limpa a cada 15 minutos
    expiration: 1000 * 60 * 60 * 12 // Duração de 12 horas
}, db.promise()); // Usa a mesma promessa de conexão do banco

// Configuração da sessão atualizada
app.use(session({
    key: 'ecoflow_cookie',
    secret: "sua_chave_secreta_aqui",
    store: sessionStore, // Define o MySQL como motor de gravação
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 12 // 12 horas
    }
}));

// =======================================================
// ROTEIRIZAÇÃO COM A NOVA GOOGLE ROUTES API (MODERNA)
// =======================================================
const GOOGLE_MAPS_API_KEY = "AIzaSyCTqm520ZD70o6T3ub9tcTsjYdBcjNpQ6g";
const ENDERECO_FABRICA = "-12.7036939, -38.2923817";

// 1. Função de extração (Burlar bloqueios e capturar o PINO EXATO)
async function obterLocalizacao(nome, link) {
    if (link && link.includes("http")) {
        try {
            const response = await axios.get(link, {
                maxRedirects: 10,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                validateStatus: () => true
            });
            const finalUrl = response.request.res ? response.request.res.responseUrl : link;
            const htmlData = typeof response.data === 'string' ? response.data : '';

            // PRIORIDADE 1: Pino exato do estabelecimento (!3d e !4d)
            let matchPin = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
            if (matchPin) return `${matchPin[1]},${matchPin[2]}`;

            matchPin = finalUrl.match(/query=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (matchPin) return `${matchPin[1]},${matchPin[2]}`;

            // PRIORIDADE 2: Pino exato oculto nas meta tags do HTML
            let metaPin = htmlData.match(/preview\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (metaPin) return `${metaPin[1]},${metaPin[2]}`;

            const metaRefresh = htmlData.match(/URL='([^']+)'/i);
            if (metaRefresh) {
                let refPin = metaRefresh[1].match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                if (refPin) return `${refPin[1]},${refPin[2]}`;

                refPin = metaRefresh[1].match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
                if (refPin) return `${refPin[1]},${refPin[2]}`;
            }

            // PRIORIDADE 3: Centro da tela do usuário (@) - Fallback
            let matchViewport = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (matchViewport) return `${matchViewport[1]},${matchViewport[2]}`;

            // PRIORIDADE 4: Nome do lugar
            const matchPlace = finalUrl.match(/\/maps\/place\/([^\/]+)/) || finalUrl.match(/\/maps\/search\/([^\/]+)/);
            if (matchPlace) return decodeURIComponent(matchPlace[1].replace(/\+/g, ' '));

        } catch (e) {
            console.error(`[Aviso] Falha ao decodificar link de ${nome}:`, e.message);
        }
    }
    return `${nome}, Camaçari, Bahia, Brasil`;
}

// 2. Converte as coordenadas ou texto para o formato estrito da Nova Routes API
function formatarParaRoutesAPI(local) {
    // Verifica se a string tem cara de coordenada (ex: -12.1234, -38.1234)
    const coords = local.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
    if (coords) {
        return {
            location: {
                latLng: {
                    latitude: parseFloat(coords[1]),
                    longitude: parseFloat(coords[2])
                }
            }
        };
    }
    // Se não for coordenada exata, envia como texto de endereço
    return { address: local };
}

// ---------------------------------------------------------
// FUNÇÕES MATEMÁTICAS PARA FORÇAR "OS MAIS PERTOS PRIMEIRO"
// ---------------------------------------------------------
function extrairLatLon(texto) {
    const match = String(texto).match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
    if (match) return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    return null;
}

// Calcula a distância em linha reta (Raio) entre 2 coordenadas em KM
function calcularDistanciaReta(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 3. Comunica com a nova Google Routes API (Ponto mais distante como Destino Fixo)
async function otimizarRotaGoogleAPI(entregas) {
    // Validação cega: Se houver apenas 1 entrega, não há o que otimizar
    if (!entregas || entregas.length <= 1) return entregas;

    try {
        // Usa a coordenada da fábrica ou o centro de Camaçari por padrão
        const coordFabrica = extrairLatLon(ENDERECO_FABRICA) || { lat: -12.6974, lon: -38.3241 };

        let indiceMaisDistante = 0;
        let maiorDistancia = -1;

        // 1. O Sistema descobre matematicamente qual é o cliente mais longe da fábrica
        for (let i = 0; i < entregas.length; i++) {
            if (!entregas[i]) continue;
            const coordEntrega = extrairLatLon(entregas[i].queryLocation);
            if (coordEntrega) {
                const dist = calcularDistanciaReta(coordFabrica.lat, coordFabrica.lon, coordEntrega.lat, coordEntrega.lon);
                if (dist > maiorDistancia) {
                    maiorDistancia = dist;
                    indiceMaisDistante = i;
                }
            }
        }

        // Proteção extra de índice
        if (!entregas[indiceMaisDistante]) indiceMaisDistante = 0;

        // 2. Extrai o mais distante e o define como PONTO FINAL obrigatório
        const entregaDestino = entregas[indiceMaisDistante];
        const entregasIntermediarias = entregas.filter((_, index) => index !== indiceMaisDistante && entregas[index]);

        // Se após remover o destino não sobrar mais nada na rota, retorna
        if (entregasIntermediarias.length === 0) return [entregaDestino];

        // 3. Monta a requisição: Origem -> Intermediários (Misturados) -> Destino Fixo (Mais Longe)
        const originAPI = formatarParaRoutesAPI(ENDERECO_FABRICA);
        const destinationAPI = formatarParaRoutesAPI(entregaDestino.queryLocation);
        const intermediatesAPI = entregasIntermediarias.map(e => formatarParaRoutesAPI(e.queryLocation));

        const requestBody = {
            origin: originAPI,
            destination: destinationAPI,
            intermediates: intermediatesAPI,
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_AWARE",
            optimizeWaypointOrder: true
        };

        const res = await axios.post(
            'https://routes.googleapis.com/directions/v2:computeRoutes',
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                    'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex'
                }
            }
        );

        if (res.data && res.data.routes && res.data.routes.length > 0) {
            const ordemOtimizada = res.data.routes[0].optimizedIntermediateWaypointIndex;
            let entregasReordenadas = [];

            // Verifica se a API devolveu a ordem dos intermediários de forma íntegra
            if (Array.isArray(ordemOtimizada) && ordemOtimizada.length === entregasIntermediarias.length) {
                for (let i = 0; i < ordemOtimizada.length; i++) {
                    const wpIndex = ordemOtimizada[i];
                    if (entregasIntermediarias[wpIndex]) {
                        entregasReordenadas.push(entregasIntermediarias[wpIndex]);
                    }
                }
            } else {
                // Caso o Google não tenha reordenado (ex: havia só 1 intermediário)
                entregasReordenadas = [...entregasIntermediarias];
            }

            // Por fim, anexa a entrega mais distante obrigatoriamente na ÚLTIMA posição
            entregasReordenadas.push(entregaDestino);

            return entregasReordenadas;
        }

        return entregas;
    } catch (error) {
        console.error("Erro na Google Routes API:", error.response ? JSON.stringify(error.response.data) : error.message);
        return entregas; // Retorna intacto para não causar crash
    }
}
// =======================================================
// NOVA FUNÇÃO: DESCOBRIR CIDADE PELAS COORDENADAS
// =======================================================
async function obterCidadeDasCoordenadas(coordenadas) {
    if (!coordenadas || !coordenadas.includes(',')) return null;
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordenadas.replace(/\s/g, '')}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await axios.get(url);

        if (response.data.status === 'OK') {
            for (let result of response.data.results) {
                for (let component of result.address_components) {
                    // Procura o tipo 'locality' (Cidade) ou 'administrative_area_level_2' (Município)
                    if (component.types.includes('administrative_area_level_2') || component.types.includes('locality')) {
                        return component.long_name;
                    }
                }
            }
        } else {
            // Se o Google bloquear, ele vai gritar aqui no seu VS Code!
            console.error("⚠️ [GEOCODING API BLOQUEADA]:", response.data.status, response.data.error_message);
        }
    } catch (e) {
        console.error("❌ Erro interno ao buscar cidade:", e.message);
    }
    return null;
}
// =======================================================
// =======================================================

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

app.post("/login", (req, res) => {
    const { email, senha } = req.body;

    // Certifique-se de que o SELECT busca a foto (ou use SELECT *)
    db.query("SELECT * FROM usuarios WHERE email=? AND senha=?", [email, senha], (err, rows) => {
        if (err) {
            console.error("Erro no login:", err);
            return res.status(500).send("Erro no servidor.");
        }

        if (rows.length > 0) {
            const user = rows[0];

            // Aqui está o detalhe: guardar a foto na sessão!
            req.session.user = {
                id: user.id,
                nome: user.nome,
                tipo_usuario: user.tipo_usuario,
                foto: user.foto
            };

            return res.redirect("/home"); // ou o redirecionamento padrão do seu sistema
        } else {
            return res.status(401).send("Credenciais inválidas.");
        }
    });
});

app.get("/home", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    db.query(
        "SELECT id, mensagem, tipo, criado_em FROM notificacoes ORDER BY criado_em DESC",
        (errNotif, notificacoes) => {
            if (errNotif) {
                console.error("Erro ao buscar notificações:", errNotif);
                notificacoes = [];
            }

            db.query(`
                SELECT 
                    v.id,
                    v.marca,
                    v.modelo,
                    v.ano,
                    v.km,
                    c.servico,
                    c.oficina,
                    c.mecanico,
                    c.valor,
                    c.data_servico,
                    c.km_servico,
                    c.documento,
                    c.atualizado_por
                FROM veiculos v
                LEFT JOIN veiculo_checklists c 
                    ON c.id = (
                        SELECT vc.id
                        FROM veiculo_checklists vc
                        WHERE vc.veiculo_id = v.id
                        ORDER BY vc.data_servico DESC, vc.id DESC
                        LIMIT 1
                    )
                ORDER BY c.data_servico DESC, v.id DESC
                LIMIT 5
            `, (errVeiculos, veiculos) => {
                if (errVeiculos) {
                    console.error("Erro veículos:", errVeiculos);
                    veiculos = [];
                }

                db.query(`
                    SELECT 
                        id,
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
                        foto,
                        registrado_por,
                        criado_em,
                        atualizado_em,
                        atualizado_por
                    FROM checklists
                    ORDER BY criado_em DESC
                    LIMIT 5
                `, (errCheck, checklists) => {
                    if (errCheck) {
                        console.error("Erro checklists:", errCheck);
                        checklists = [];
                    }

                    db.query(`
                        SELECT 
                            c.id,
                            c.codigo,
                            c.modelo,
                            c.preco_parda,
                            c.preco_branca,
                            c.atualizado_em,
                            c.atualizado_por,
                            f.nome AS fornecedor_nome,
                            f.porcentagem AS fornecedor_pct
                        FROM caixas c
                        LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
                        ORDER BY c.atualizado_em DESC, c.id DESC
                        LIMIT 5
                    `, (errPreco, precos) => {
                        if (errPreco) {
                            console.error("Erro preços:", errPreco);
                            precos = [];
                        }

                        db.query(`
                            SELECT *
                            FROM entregas_pedidos
                            ORDER BY criado_em DESC, id DESC
                            LIMIT 1
                        `, (errRota, rotaRows) => {
                            if (errRota) {
                                console.error("Erro rota:", errRota);
                                return res.send(homeView(req.session.user, notificacoes, {
                                    veiculos,
                                    checklists,
                                    precos,
                                    rota: null
                                }));
                            }

                            const rota = rotaRows && rotaRows.length ? rotaRows[0] : null;

                            if (!rota) {
                                return res.send(homeView(req.session.user, notificacoes, {
                                    veiculos,
                                    checklists,
                                    precos,
                                    rota: null
                                }));
                            }

                            db.query(`
                                SELECT 
                                    id,
                                    pedido_id,
                                    cliente_nome,
                                    status,
                                    observacao,
                                    atualizado_por,
                                    atualizado_em
                                FROM entregas_clientes
                                WHERE pedido_id = ?
                                ORDER BY id DESC
                            `, [rota.id], (errClientes, clientes) => {
                                if (errClientes) {
                                    console.error("Erro clientes da rota:", errClientes);
                                    clientes = [];
                                }

                                const dashboard = {
                                    veiculos,
                                    checklists,
                                    precos,
                                    rota: {
                                        ...rota,
                                        clientes
                                    }
                                };

                                return res.send(homeView(req.session.user, notificacoes, dashboard));
                            });
                        });
                    });
                });
            });
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


// GET /cadastro
app.get("/cadastro", (req, res) => {
    if (!req.session.user) return res.redirect("/login");            // precisa estar logado
    if (req.session.user.tipo_usuario !== "admin")                   // só admin acessa
        return res.status(403).send("Acesso negado.");

    // Atualizado para incluir a coluna 'foto' no SELECT
    db.query("SELECT id, nome, email, tipo_usuario, foto FROM usuarios ORDER BY id DESC", (err, rows) => {
        if (err) {
            console.error("Erro ao listar usuários:", err);
            return res.status(500).send("Erro ao carregar usuários.");
        }
        // >>> PASSA o user aqui <<<
        res.send(cadastroView(req.session.user, rows || []));
    });
});


// CRIAR USUÁRIO
app.post("/usuarios/novo", upload.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { nome, email, senha, tipo_usuario } = req.body;
    const foto = req.file ? req.file.filename : null; // Captura a foto do middleware

    db.query(
        "INSERT INTO usuarios (nome, email, senha, tipo_usuario, foto) VALUES (?, ?, ?, ?, ?)",
        [nome, email, senha, tipo_usuario, foto],
        (err) => {
            if (err) {
                console.error("Erro ao cadastrar:", err);
                // Recarrega a tela de cadastro com a lista e erro (incluindo a coluna foto)
                return db.query(
                    "SELECT id, nome, email, tipo_usuario, foto FROM usuarios ORDER BY id DESC",
                    (erro2, rows) => {
                        if (erro2) return res.status(500).send("Erro no sistema.");
                        return res.send(cadastroView(req.session.user, rows || []));
                    }
                );
            }
            return res.redirect("/cadastro");
        }
    );
});


// EDITAR USUÁRIO
app.post("/usuarios/editar/:id", upload.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params;
    const { nome, email, senha, tipo_usuario } = req.body;
    const novaFoto = req.file ? req.file.filename : null;

    // Função interna para rodar o UPDATE dependendo do cenário (com/sem senha, com/sem foto)
    const executarUpdate = () => {
        let sql;
        let params;

        if (!senha || senha.trim() === "") {
            // NÃO altera a senha
            if (novaFoto) {
                sql = "UPDATE usuarios SET nome=?, email=?, tipo_usuario=?, foto=? WHERE id=?";
                params = [nome, email, tipo_usuario, novaFoto, id];
            } else {
                sql = "UPDATE usuarios SET nome=?, email=?, tipo_usuario=? WHERE id=?";
                params = [nome, email, tipo_usuario, id];
            }
        } else {
            // ALTERA a senha
            if (novaFoto) {
                sql = "UPDATE usuarios SET nome=?, email=?, senha=?, tipo_usuario=?, foto=? WHERE id=?";
                params = [nome, email, senha, tipo_usuario, novaFoto, id];
            } else {
                sql = "UPDATE usuarios SET nome=?, email=?, senha=?, tipo_usuario=? WHERE id=?";
                params = [nome, email, senha, tipo_usuario, id];
            }
        }

        db.query(sql, params, (err) => {
            if (err) {
                console.error("Erro ao editar usuário:", err);
                return res.status(500).send("Erro ao editar usuário.");
            }

            // --- ATUALIZA A SESSÃO EM TEMPO REAL ---
            if (req.session.user && req.session.user.id === parseInt(id)) {
                req.session.user.nome = nome;
                req.session.user.tipo_usuario = tipo_usuario;
                if (novaFoto) {
                    req.session.user.foto = novaFoto;
                }
            }
            // ---------------------------------------

            return res.redirect("/cadastro");
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
        // Se não houver foto nova, apenas atualizamos os campos de texto
        executarUpdate();
    }
});


// EXCLUIR USUÁRIO
app.post("/usuarios/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin") return res.status(403).send("Acesso negado.");

    const { id } = req.params;

    // Primeiro busca a foto para excluí-la do diretório 'uploads'
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
            return res.redirect("/cadastro");
        });
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
    const limit = 12;
    const offset = (page - 1) * limit;

    // Filtros de Data
    const { data_inicio, data_fim } = req.query;

    const where = [];
    const paramsBase = [];

    if (data_inicio && data_inicio.trim() !== "") {
        where.push("DATE(criado_em) >= ?");
        paramsBase.push(data_inicio.trim());
    }

    if (data_fim && data_fim.trim() !== "") {
        where.push("DATE(criado_em) <= ?");
        paramsBase.push(data_fim.trim());
    }

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

        // 2ª consulta: lista paginada filtrada
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

            // NOVA CONSULTA UNIFICADA: Busca Motorista, Ano e Mês agrupados
            db.query(`
                SELECT DISTINCT 
                    motorista, 
                    YEAR(criado_em) AS ano, 
                    MONTH(criado_em) AS mes 
                FROM checklists 
                WHERE motorista IS NOT NULL AND motorista != '' AND criado_em IS NOT NULL 
                ORDER BY motorista ASC, ano DESC, mes DESC
            `, (errFiltros, rowsFiltros) => {

                const filtrosData = rowsFiltros && !errFiltros ? rowsFiltros : [];

                res.send(
                    checklistMotoristasView(
                        usuario,
                        checklists,
                        { page: currentPage, totalPages, total, data_inicio, data_fim },
                        filtrosData // Passando os dados exatos de relacionamento para a View
                    )
                );
            });
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
        kit_pneu, acessorios_cabine, // Novos campos
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
       kit_pneu, acessorios_cabine,
       responsavel, motorista, registrado_por, observacao, foto) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const params = [
        veiculo, oleo, agua, freio, direcao, combustivel,
        pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
        kit_pneu, acessorios_cabine,                      // Novos campos
        responsavel,
        motorista.trim(),                                 // ✅ do formulário
        req.session.user.nome,                            // ✅ quem registrou (logado)
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
        veiculo, oleo, agua, freio, direcao, combustivel,
        pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
        kit_pneu, acessorios_cabine, // Novos campos
        responsavel, motorista, observacao,
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
               kit_pneu = ?, acessorios_cabine = ?,
               responsavel = ?, motorista = ?, observacao = ?, foto = ?
           WHERE id = ?`,
                    [
                        veiculo, oleo, agua, freio, direcao, combustivel,
                        pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
                        kit_pneu, acessorios_cabine,
                        responsavel, motorista,
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
           kit_pneu = ?, acessorios_cabine = ?,
           responsavel = ?, motorista = ?, observacao = ?
       WHERE id = ?`,
            [
                veiculo, oleo, agua, freio, direcao, combustivel,
                pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
                kit_pneu, acessorios_cabine,
                responsavel, motorista,
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

app.post("/notificacoes/:id/excluir", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ sucesso: false, erro: "Não autorizado" });
    }

    const { id } = req.params;

    db.query("DELETE FROM notificacoes WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("Erro ao remover notificação:", err);
            return res.status(500).json({
                sucesso: false,
                erro: "Erro ao remover notificação"
            });
        }

        res.json({ sucesso: true });
    });
});

app.post("/notificacoes/limpar", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ sucesso: false, erro: "Não autorizado" });
    }

    db.query("DELETE FROM notificacoes", (err) => {
        if (err) {
            console.error("Erro ao limpar notificações:", err);
            return res.status(500).json({
                sucesso: false,
                erro: "Erro ao limpar notificações"
            });
        }

        res.json({ sucesso: true });
    });
});

app.get("/notificacoes", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ erro: "Não autorizado" });
    }

    db.query(
        "SELECT id, mensagem, tipo, criado_em FROM notificacoes ORDER BY criado_em DESC LIMIT 20",
        (err, results) => {
            if (err) {
                console.error("Erro ao buscar notificações:", err);
                return res.status(500).json({ erro: "Erro ao buscar notificações" });
            }

            res.json(results || []);
        }
    );
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

// === ROTAS DE CHAPAS ===

// Listar Chapas
app.get("/chapas", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario === "motorista") return res.status(403).send("Acesso negado.");

    db.query("SELECT * FROM chapas ORDER BY id DESC", (err, chapas) => {
        if (err) {
            console.error("Erro ao buscar chapas:", err);
            return res.status(500).send("Erro interno");
        }
        res.send(chapasView(req.session.user, chapas));
    });
});

// Criar Nova Chapa
app.post("/chapas/novo", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario === "motorista") return res.status(403).send("Acesso negado.");

    const { material, modelo, fornecedor, medida, quantidade } = req.body;

    db.query(
        "INSERT INTO chapas (material, modelo, fornecedor, medida, quantidade) VALUES (?, ?, ?, ?, ?)",
        [material, modelo, fornecedor, medida, quantidade],
        (err) => {
            if (err) console.error("Erro ao cadastrar chapa:", err);
            res.redirect("/chapas");
        }
    );
});

// Editar Chapa
app.post("/chapas/editar/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario === "motorista") return res.status(403).send("Acesso negado.");

    const { id } = req.params;
    const { material, modelo, fornecedor, medida, quantidade } = req.body;

    db.query(
        "UPDATE chapas SET material=?, modelo=?, fornecedor=?, medida=?, quantidade=? WHERE id=?",
        [material, modelo, fornecedor, medida, quantidade, id],
        (err) => {
            if (err) console.error("Erro ao editar chapa:", err);
            res.redirect("/chapas");
        }
    );
});

// Excluir Chapa
app.post("/chapas/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario === "motorista") return res.status(403).send("Acesso negado.");

    const { id } = req.params;

    db.query("DELETE FROM chapas WHERE id=?", [id], (err) => {
        if (err) console.error("Erro ao excluir chapa:", err);
        res.redirect("/chapas");
    });
});

// ==========================================
// EXPORTAR RELATÓRIO EXCEL (CHAPAS)
// ==========================================
app.get('/exportar/chapas', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        // Busca todos os dados do estoque de chapas
        const [dados] = await db.promise().query(`
            SELECT material, modelo, fornecedor, medida, quantidade 
            FROM chapas 
            ORDER BY material ASC, modelo ASC
        `);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Estoque de Chapas');

        sheet.columns = [
            { header: 'MATERIAL', key: 'material', width: 20 },
            { header: 'MODELO', key: 'modelo', width: 30 },
            { header: 'FORNECEDOR', key: 'fornecedor', width: 30 },
            { header: 'MEDIDA', key: 'medida', width: 20 },
            { header: 'QUANTIDADE', key: 'quantidade', width: 15 }
        ];

        // Estiliza o cabeçalho
        sheet.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Preenche os dados
        dados.forEach(c => {
            const row = sheet.addRow({
                material: c.material,
                modelo: c.modelo,
                fornecedor: c.fornecedor,
                medida: c.medida,
                quantidade: Number(c.quantidade) || 0
            });

            // Destaca quantidades críticas (abaixo de 5000)
            if (Number(c.quantidade) < 5000) {
                row.getCell('quantidade').font = { color: { argb: 'FFDC3545' }, bold: true };
            }
        });

        // Aplica bordas em todas as células
        sheet.eachRow(row => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Estoque_Chapas_${dataHoje}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('[ERRO EXPORTAR CHAPAS]', err);
        res.status(500).send('Erro ao gerar relatório de chapas');
    }
});

app.get("/checklist-motoristas/relatorio", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const { motorista, mes, ano } = req.query;

    let where = [];
    let params = [];

    if (motorista) {
        where.push("motorista = ?");
        params.push(motorista);
    }
    if (mes) {
        where.push("MONTH(criado_em) = ?");
        params.push(mes);
    }
    if (ano) {
        where.push("YEAR(criado_em) = ?");
        params.push(ano);
    }

    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    db.query(`SELECT * FROM checklists ${whereSql} ORDER BY criado_em ASC`, params, async (err, results) => {
        if (err) {
            console.error("Erro ao gerar relatório:", err);
            return res.send("Erro ao gerar relatório.");
        }

        if (results.length === 0) {
            return res.send("<script>alert('Nenhum dado encontrado para os filtros selecionados.'); window.close();</script>");
        }

        const ExcelJS = require("exceljs");
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Relatório Geral");

        // 1. Define as colunas primeiro (gera os cabeçalhos inicialmente na linha 1)
        sheet.columns = [
            { header: "Data/Hora", key: "data", width: 20 },
            { header: "Motorista", key: "motorista", width: 25 },
            { header: "Veículo", key: "veiculo", width: 15 },
            { header: "Nível do óleo", key: "oleo", width: 15 },
            { header: "Nível da água", key: "agua", width: 15 },
            { header: "Fluído de freio", key: "freio", width: 15 },
            { header: "Fluído direção", key: "direcao", width: 15 },
            { header: "Combustível", key: "combustivel", width: 20 },
            { header: "Pneus (Calibragem)", key: "pneu_calibragem", width: 20 },
            { header: "Pneus (Estado)", key: "pneu_estado", width: 20 },
            { header: "Luzes", key: "luzes", width: 20 },
            { header: "Ruídos", key: "ruidos", width: 20 },
            { header: "Lixo", key: "lixo", width: 15 },
            { header: "Responsável", key: "responsavel", width: 20 },
            { header: "Registrado por", key: "registrado_por", width: 20 },
            { header: "Observação", key: "obs", width: 40 }
        ];

        // Formata os cabeçalhos das colunas
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Fonte branca
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0D5749' } // Fundo Verde padrão do sistema
            };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        });

        // 2. Adiciona uma nova linha no topo (empurrando o cabeçalho para a linha 2)
        sheet.spliceRows(1, 0, []);

        // 3. Formata e mescla a primeira linha (agora em branco) para o título
        sheet.mergeCells('A1:P1');
        const tituloRow = sheet.getCell('A1');

        // Cria o título dinâmico com Mês e Ano
        const nomesMesesJs = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        let periodoStr = "";
        if (mes && ano) {
            periodoStr = ` - ${nomesMesesJs[parseInt(mes) - 1]} de ${ano}`;
        } else if (mes) {
            periodoStr = ` - ${nomesMesesJs[parseInt(mes) - 1]}`;
        } else if (ano) {
            periodoStr = ` - ${ano}`;
        }

        tituloRow.value = `RELATÓRIO DE CHECKLISTS${periodoStr.toUpperCase()}`;
        tituloRow.alignment = { horizontal: 'center', vertical: 'middle' };
        tituloRow.font = { bold: true, size: 16, color: { argb: 'FF0D5749' } };
        tituloRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF4F7F6' } // Fundo cinza claro
        };
        sheet.getRow(1).height = 35; // Aumenta a altura da linha do título

        // 4. Preencher as linhas de dados com cores diferentes por veículo
        results.forEach(c => {
            const row = sheet.addRow({
                data: new Date(c.criado_em).toLocaleString("pt-BR"),
                motorista: c.motorista || "-",
                veiculo: c.veiculo || "-",
                oleo: c.oleo || "-",
                agua: c.agua || "-",
                freio: c.freio || "-",
                direcao: c.direcao || "-",
                combustivel: c.combustivel || "-",
                pneu_calibragem: c.pneu_calibragem || "-",
                pneu_estado: c.pneu_estado || "-",
                luzes: c.luzes || "-",
                ruidos: c.ruidos || "-",
                lixo: c.lixo || "-",
                responsavel: c.responsavel || "-",
                registrado_por: c.registrado_por || "-",
                obs: c.observacao || ""
            });

            // Determina a cor de fundo com base no veículo
            let corFundo = 'FFFFFFFF'; // Padrão: Branco
            if (c.veiculo === 'Master') {
                corFundo = 'FFE9F2FE'; // Azul Claro
            } else if (c.veiculo === 'Strada') {
                corFundo = 'FFFFF4CC'; // Amarelo Claro
            } else if (c.veiculo === 'Fiorino') {
                corFundo = 'FFFDE2E2'; // Vermelho Claro
            }

            // Aplica o estilo em cada célula da linha inserida
            row.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: corFundo }
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            });
        });

        // Nome do arquivo com base no mês escolhido no relatório
        const mesNumero = parseInt(mes, 10);
        let mesNomeArquivo = "Geral";
        if (!isNaN(mesNumero) && mesNumero >= 1 && mesNumero <= 12) {
            mesNomeArquivo = nomesMesesJs[mesNumero - 1];
        }
        const nomeArquivo = `relatorio_checklist_${mesNomeArquivo}.xlsx`;

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);

        await workbook.xlsx.write(res);
        res.end();
    });
});

// =======================================================
// ROTAS DE ENTRADAS E SAÍDAS (FINANCEIRO / PORTARIA)
// =======================================================

// 1. Rota principal - Listagem com Paginação e Filtro (Data e Tipo)
app.get("/entradas-saidas", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "financeiro") {
        console.warn(`[Segurança] Usuário ${req.session.user.nome} tentou acessar /entradas-saidas sem permissão.`);
        return res.status(403).send("Acesso negado.");
    }

    const usuario = req.session.user;

    let page = parseInt(req.query.page || "1", 10);
    if (isNaN(page) || page < 1) {
        console.warn(`[Aviso] Parâmetro 'page' inválido recebido: ${req.query.page}. Revertendo para página 1.`);
        page = 1;
    }

    const limit = 20;

    const { data_inicio, data_fim, tipo } = req.query;
    let where = [];
    let params = [];

    if (data_inicio) {
        where.push("data >= ?");
        params.push(data_inicio);
    }
    if (data_fim) {
        where.push("data <= ?");
        params.push(data_fim);
    }
    if (tipo === "entrada" || tipo === "saida") {
        where.push("tipo = ?");
        params.push(tipo);
    }

    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    console.log(`[Filtros] SQL Dinâmico: ${whereSql || "Nenhum filtro aplicado"} | Parâmetros:`, params);

    // NOVO: Query para buscar a SOMA TOTAL REAL do banco, ignorando a paginação!
    db.query(`
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) AS total_entradas,
            SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) AS total_saidas
        FROM movimentacoes ${whereSql}
    `, params, (errCount, rowsCount) => {
        if (errCount) {
            console.error("[Erro Banco de Dados] Falha ao contar movimentações e somar totais:", errCount);
            return res.status(500).send("Erro interno do servidor.");
        }

        if (!rowsCount || rowsCount.length === 0) {
            console.warn("[Aviso] A consulta de totais retornou indefinida ou vazia.");
        }

        const total = rowsCount[0]?.total || 0;
        const totalEntradas = rowsCount[0]?.total_entradas || 0;
        const totalSaidas = rowsCount[0]?.total_saidas || 0;
        const totalCaixa = totalEntradas - totalSaidas;

        console.log(`[Cálculos de Caixa] Entradas: ${totalEntradas} | Saídas: ${totalSaidas} | Saldo: ${totalCaixa}`);

        const totalPages = Math.max(1, Math.ceil(total / limit));
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        const currentOffset = (currentPage - 1) * limit;

        console.log(`[Paginação] Total Itens: ${total} | Páginas: ${totalPages} | Atual: ${currentPage} | Offset: ${currentOffset}`);

        const queryParams = [...params, limit, currentOffset];

        db.query(`SELECT * FROM movimentacoes ${whereSql} ORDER BY data DESC, id DESC LIMIT ? OFFSET ?`,
            queryParams,
            (errMov, movimentacoes) => {
                if (errMov) {
                    console.error("[Erro Banco de Dados] Falha ao buscar as movimentações paginadas:", errMov);
                    return res.status(500).send("Erro interno do servidor.");
                }

                try {
                    console.log(`[Sucesso] Renderizando view com ${movimentacoes.length} registros para o usuário ${usuario.nome}.`);
                    // Repassando os valores corretos calculados no banco para a view
                    res.send(require('./views/entradasSaidasView')(
                        usuario,
                        movimentacoes,
                        { page: currentPage, totalPages, total, totalEntradas, totalSaidas, totalCaixa },
                        { data_inicio, data_fim, tipo }
                    ));
                } catch (renderError) {
                    console.error("[Erro Crítico] Falha na renderização da View 'entradasSaidasView':", renderError);
                    res.status(500).send("Ocorreu um erro interno ao tentar exibir a interface.");
                }
            });
    });
});

// 1. SALVAR NOVO REGISTO
app.post('/movimentacoes/novo', async (req, res) => {
    // Agora capturamos o 'nome_assinante' do formulário
    const { tipo, data, valor, descricao, observacao, assinatura_base64, nome_assinante } = req.body;
    // O responsavel real é extraído de quem está logado no sistema
    const responsavel = req.session.user ? req.session.user.nome : "Sistema";

    try {
        await db.promise().query(`
            INSERT INTO movimentacoes (tipo, data, valor, descricao, observacao, assinatura_base64, responsavel, nome_assinante)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [tipo, data, valor, descricao, observacao, assinatura_base64, responsavel, nome_assinante]);

        res.redirect('/entradas-saidas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao salvar movimentação');
    }
});

// 2. EDITAR REGISTO
app.post('/movimentacoes/editar/:id', async (req, res) => {
    const { id } = req.params;
    const { data, valor, descricao, observacao, nome_assinante } = req.body;

    try {
        await db.promise().query(`
            UPDATE movimentacoes 
            SET data = ?, valor = ?, descricao = ?, observacao = ?, nome_assinante = ?
            WHERE id = ?
        `, [data, valor, descricao, observacao, nome_assinante, id]);

        res.redirect('/entradas-saidas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar movimentação');
    }
});

// 4. Rota para EXCLUIR registro
app.post("/movimentacoes/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "financeiro") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;

    db.query("DELETE FROM movimentacoes WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("Erro ao excluir movimentação:", err);
            return res.status(500).send("Erro ao excluir movimentação.");
        }
        res.redirect("/entradas-saidas");
    });
});

// ==========================================
// MÓDULO: CADERNO DE ENTREGAS (ATUALIZADO)
// ==========================================

// 1. Listar Cadernos (Agora busca o histórico fixo de clientes e catálogo de itens)
app.get("/caderno-entregas", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = 20;
        const offset = (page - 1) * limit;
        const { data_inicio, data_fim } = req.query;

        let where = [];
        let params = [];

        if (data_inicio) { where.push("DATE(data_criacao) >= ?"); params.push(data_inicio); }
        if (data_fim) { where.push("DATE(data_criacao) <= ?"); params.push(data_fim); }

        const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
        const countQuery = `SELECT COUNT(*) AS total FROM caderno_entregas ${whereSql}`;
        const [countResult] = await db.promise().query(countQuery, params);

        const total = countResult[0].total;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        const queryParams = [...params, limit, offset];
        const [cadernos] = await db.promise().query(`
            SELECT c.*, v.modelo as veiculo_modelo 
            FROM caderno_entregas c
            LEFT JOIN veiculos v ON c.veiculo_id = v.id
            ${whereSql}
            ORDER BY c.data_criacao DESC LIMIT ? OFFSET ?
        `, queryParams);

        for (let c of cadernos) {
            // MUDANÇA: Faz um JOIN para buscar também as coordenadas salvas na tabela de histórico
            const [itens] = await db.promise().query(`
                SELECT i.*, ch.coordenadas 
                FROM caderno_entregas_itens i
                LEFT JOIN clientes_historico ch ON i.local_entrega = ch.nome
                WHERE i.caderno_id = ?
                ORDER BY i.id ASC
            `, [c.id]);
            c.entregas = itens;
        }

        const [veiculos] = await db.promise().query("SELECT id, modelo FROM veiculos ORDER BY modelo ASC");

        // NOVO: Busca o histórico fixo de clientes imune à exclusão (com a Cidade para a tag azul)
        const [clientesDB] = await db.promise().query("SELECT nome, link_endereco, coordenadas, cidade FROM clientes_historico ORDER BY nome ASC");

        // NOVO: Busca o catálogo de itens do pedido (as dezenas de caixas que inserimos via script SQL)
        const [itensCatalogo] = await db.promise().query("SELECT nome FROM itens_catalogo ORDER BY nome ASC");

        res.send(require('./views/cadernoEntregasView')(
            req.session.user,
            cadernos,
            veiculos,
            clientesDB,
            { page, totalPages, total },
            { data_inicio, data_fim },
            itensCatalogo // <--- Passando o catálogo mágico para a View final!
        ));
    } catch (error) {
        console.error("Erro no Caderno de Entregas:", error);
        res.status(500).send("Erro interno ao carregar cadernos.");
    }
});

// 2. Salvar Novo Caderno
// 2. Salvar Novo Caderno Otimizado via API
app.post("/caderno-entregas/novo", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const { motorista, ajudante, veiculo_id, local, link, itens_pedido, quantidade, valor_aberto } = req.body;

    try {
        const [result] = await db.promise().query(
            "INSERT INTO caderno_entregas (motorista, ajudante, veiculo_id, status) VALUES (?, ?, ?, 'Pendente')",
            [motorista, ajudante || null, veiculo_id || null]
        );
        const cadernoId = result.insertId;

        if (local) {
            // O QUE MUDA NAS ROTAS POST /novo e POST /editar/:id
            const locais = Array.isArray(local) ? local : [local];
            const links = Array.isArray(link) ? link : [link];
            const itens = Array.isArray(itens_pedido) ? itens_pedido : [itens_pedido];
            const quantidades = Array.isArray(quantidade) ? quantidade : [quantidade];
            const valores = Array.isArray(valor_aberto) ? valor_aberto : [valor_aberto];
            // NOVO: Puxa o array de coordenadas preenchido dinamicamente na tela
            const coordsForm = Array.isArray(req.body.coordenadas_rota) ? req.body.coordenadas_rota : [req.body.coordenadas_rota];

            let entregasParaProcessar = [];
            for (let i = 0; i < locais.length; i++) {
                const nomeCli = locais[i].trim();
                const linkCli = links[i] || null;
                let coordCli = (coordsForm[i] && coordsForm[i].trim() !== '') ? coordsForm[i].trim() : null;

                if (nomeCli !== '') {
                    // Se não preencheu coordenada na tela, mas tem link, o servidor caça a coordenada sozinho
                    if (!coordCli && linkCli) {
                        const localizacaoResolvida = await obterLocalizacao(nomeCli, linkCli);
                        if (localizacaoResolvida && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(localizacaoResolvida.trim())) {
                            coordCli = localizacaoResolvida.trim();
                        }
                    }

                    // Se encontrou a coordenada, descobre a CIDADE na hora
                    let cidadeCli = null;
                    if (coordCli) {
                        cidadeCli = await obterCidadeDasCoordenadas(coordCli);
                    }

                    // Salva no banco de dados o Cliente + Link + Coordenadas + Cidade Automática
                    await db.promise().query(`
                        INSERT INTO clientes_historico (nome, link_endereco, coordenadas, cidade) VALUES (?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE 
                            link_endereco = COALESCE(?, link_endereco),
                            coordenadas = COALESCE(?, coordenadas),
                            cidade = COALESCE(?, cidade)
                    `, [nomeCli, linkCli, coordCli, cidadeCli, linkCli, coordCli, cidadeCli]);

                    entregasParaProcessar.push({
                        nome: nomeCli,
                        link: linkCli,
                        itens: itens[i] || null,
                        qtd: quantidades[i] && quantidades[i].trim() !== '' ? parseInt(quantidades[i], 10) : null,
                        valor: valores[i] && valores[i].trim() !== '' ? parseFloat(valores[i]) : null,
                        queryLocation: coordCli || await obterLocalizacao(nomeCli, linkCli)
                    });
                }
            }

            // A MÁGICA ACONTECE AQUI: A API do Google devolve o array ordenado com trânsito real
            const rotaFinal = await otimizarRotaGoogleAPI(entregasParaProcessar);

            for (let item of rotaFinal) {
                await db.promise().query(
                    "INSERT INTO caderno_entregas_itens (caderno_id, local_entrega, link_endereco, itens_pedido, quantidade, valor_aberto) VALUES (?, ?, ?, ?, ?, ?)",
                    [cadernoId, item.nome, item.link, item.itens, item.qtd, item.valor]
                );
            }
        }
        res.redirect("/caderno-entregas");
    } catch (error) {
        console.error("Erro ao salvar caderno:", error);
        res.status(500).send("Erro ao salvar.");
    }
});

// 3. Editar Caderno Otimizado via API
app.post("/caderno-entregas/editar/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const { id } = req.params;
    const { motorista, ajudante, veiculo_id, local, link, itens_pedido, quantidade, valor_aberto } = req.body;

    try {
        await db.promise().query(
            "UPDATE caderno_entregas SET motorista = ?, ajudante = ?, veiculo_id = ? WHERE id = ?",
            [motorista, ajudante || null, veiculo_id || null, id]
        );

        await db.promise().query("DELETE FROM caderno_entregas_itens WHERE caderno_id = ?", [id]);

        if (local) {
            // O QUE MUDA NAS ROTAS POST /novo e POST /editar/:id
            const locais = Array.isArray(local) ? local : [local];
            const links = Array.isArray(link) ? link : [link];
            const itens = Array.isArray(itens_pedido) ? itens_pedido : [itens_pedido];
            const quantidades = Array.isArray(quantidade) ? quantidade : [quantidade];
            const valores = Array.isArray(valor_aberto) ? valor_aberto : [valor_aberto];
            // NOVO: Puxa o array de coordenadas preenchido dinamicamente na tela
            const coordsForm = Array.isArray(req.body.coordenadas_rota) ? req.body.coordenadas_rota : [req.body.coordenadas_rota];

            let entregasParaProcessar = [];
            for (let i = 0; i < locais.length; i++) {
                const nomeCli = locais[i].trim();
                const linkCli = links[i] || null;
                let coordCli = (coordsForm[i] && coordsForm[i].trim() !== '') ? coordsForm[i].trim() : null;

                if (nomeCli !== '') {
                    // Se não preencheu coordenada na tela, mas tem link, o servidor caça a coordenada sozinho
                    if (!coordCli && linkCli) {
                        const localizacaoResolvida = await obterLocalizacao(nomeCli, linkCli);
                        if (localizacaoResolvida && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(localizacaoResolvida.trim())) {
                            coordCli = localizacaoResolvida.trim();
                        }
                    }

                    // Se encontrou a coordenada, descobre a CIDADE na hora
                    let cidadeCli = null;
                    if (coordCli) {
                        cidadeCli = await obterCidadeDasCoordenadas(coordCli);
                    }

                    // Salva no banco de dados o Cliente + Link + Coordenadas + Cidade Automática
                    await db.promise().query(`
                        INSERT INTO clientes_historico (nome, link_endereco, coordenadas, cidade) VALUES (?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE 
                            link_endereco = COALESCE(?, link_endereco),
                            coordenadas = COALESCE(?, coordenadas),
                            cidade = COALESCE(?, cidade)
                    `, [nomeCli, linkCli, coordCli, cidadeCli, linkCli, coordCli, cidadeCli]);

                    entregasParaProcessar.push({
                        nome: nomeCli,
                        link: linkCli,
                        itens: itens[i] || null,
                        qtd: quantidades[i] && quantidades[i].trim() !== '' ? parseInt(quantidades[i], 10) : null,
                        valor: valores[i] && valores[i].trim() !== '' ? parseFloat(valores[i]) : null,
                        queryLocation: coordCli || await obterLocalizacao(nomeCli, linkCli)
                    });
                }
            }

            const rotaFinal = await otimizarRotaGoogleAPI(entregasParaProcessar);

            for (let item of rotaFinal) {
                await db.promise().query(
                    "INSERT INTO caderno_entregas_itens (caderno_id, local_entrega, link_endereco, itens_pedido, quantidade, valor_aberto) VALUES (?, ?, ?, ?, ?, ?)",
                    [id, item.nome, item.link, item.itens, item.qtd, item.valor]
                );
            }
        }
        res.redirect("/caderno-entregas");
    } catch (error) {
        console.error("Erro editar caderno:", error);
        res.status(500).send("Erro ao editar.");
    }
});
// ==========================================
// EXCLUIR CADERNO DE ENTREGAS
// ==========================================
app.post("/caderno-entregas/excluir/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { id } = req.params;

    try {
        // Deleta o caderno principal.
        // Nota: Se você usou "ON DELETE CASCADE" na criação da tabela de itens, 
        // os locais de entrega vinculados a este caderno serão apagados automaticamente pelo banco!
        await db.promise().query("DELETE FROM caderno_entregas WHERE id = ?", [id]);

        res.redirect("/caderno-entregas");
    } catch (error) {
        console.error("[ERRO AO EXCLUIR CADERNO]:", error);
        res.status(500).send("Erro interno ao tentar excluir o caderno de entregas.");
    }
});

// ==========================================
// CADASTRAR NOVO CLIENTE / LINK MAPS / COORDENADAS
// ==========================================
app.post("/caderno-entregas/clientes/novo", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    let { nome, link_endereco, coordenadas } = req.body;

    try {
        if (nome && nome.trim() !== '') {
            // SE A COORDENADA VEIO VAZIA, MAS TEM LINK: O servidor decodifica o link curto agora mesmo!
            if ((!coordenadas || coordenadas.trim() === '') && link_endereco && link_endereco.trim() !== '') {
                const localizacaoResolvida = await obterLocalizacao(nome, link_endereco);

                // Valida se o que foi retornado segue o padrão de coordenadas numéricas (lat,lng)
                if (localizacaoResolvida && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(localizacaoResolvida.trim())) {
                    coordenadas = localizacaoResolvida.trim();
                }
            }

            await db.promise().query(`
                INSERT INTO clientes_historico (nome, link_endereco, coordenadas) VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                    link_endereco = COALESCE(?, link_endereco), 
                    coordenadas = COALESCE(?, coordenadas)
            `, [
                nome.trim(),
                link_endereco || null,
                coordenadas || null,
                link_endereco || null,
                coordenadas || null
            ]);
        }
        res.redirect("/caderno-entregas");
    } catch (error) {
        console.error("[ERRO AO CADASTRAR CLIENTE]:", error);
        res.status(500).send("Erro interno ao tentar salvar o cliente.");
    }
});

// ==========================================
// EDITAR CLIENTE DO HISTÓRICO
// ==========================================
app.post("/caderno-entregas/clientes/editar", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    let { nomeOriginal, nomeNovo, link_endereco, coordenadas } = req.body;

    try {
        if (nomeOriginal && nomeNovo) {
            // SE NA EDIÇÃO A COORDENADA FICOU VAZIA, MAS FOI PASSADO UM LINK: Decodifica também!
            if ((!coordenadas || coordenadas.trim() === '') && link_endereco && link_endereco.trim() !== '') {
                const localizacaoResolvida = await obterLocalizacao(nomeNovo, link_endereco);

                if (localizacaoResolvida && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(localizacaoResolvida.trim())) {
                    coordenadas = localizacaoResolvida.trim();
                }
            }

            await db.promise().query(`
                UPDATE clientes_historico 
                SET nome = ?, link_endereco = ?, coordenadas = ? 
                WHERE nome = ?
            `, [nomeNovo.trim(), link_endereco || null, coordenadas || null, nomeOriginal.trim()]);

            await db.promise().query(`
                UPDATE caderno_entregas_itens 
                SET local_entrega = ? 
                WHERE local_entrega = ?
            `, [nomeNovo.trim(), nomeOriginal.trim()]);
        }
        res.redirect("/caderno-entregas");
    } catch (error) {
        console.error("[ERRO AO EDITAR CLIENTE]:", error);
        res.status(500).send("Erro interno ao tentar atualizar o cliente.");
    }
});

// ==========================================
// EXCLUIR CLIENTE DO HISTÓRICO
// ==========================================
app.post("/caderno-entregas/clientes/excluir", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const { nome } = req.body;

    try {
        if (nome) {
            await db.promise().query("DELETE FROM clientes_historico WHERE nome = ?", [nome.trim()]);
        }
        res.redirect("/caderno-entregas");
    } catch (error) {
        console.error("[ERRO AO EXCLUIR CLIENTE]:", error);
        res.status(500).send("Erro interno ao tentar excluir o cliente.");
    }
});

// 3. EXPORTAR RELATÓRIO EXCEL COMPLETO DOS CADERNOS
app.get('/exportar/caderno-entregas', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const { data_inicio, data_fim } = req.query;
        let where = [];
        let params = [];

        if (data_inicio) { where.push("DATE(c.data_criacao) >= ?"); params.push(data_inicio); }
        if (data_fim) { where.push("DATE(c.data_criacao) <= ?"); params.push(data_fim); }
        const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

        const [dados] = await db.promise().query(`
            SELECT c.id, c.data_criacao, c.motorista, c.ajudante, v.modelo AS veiculo,
                   i.local_entrega, i.link_endereco, i.status AS item_status
            FROM caderno_entregas c
            LEFT JOIN veiculos v ON c.veiculo_id = v.id
            LEFT JOIN caderno_entregas_itens i ON i.caderno_id = c.id
            ${whereSql}
            ORDER BY c.data_criacao ASC, c.id ASC
        `, params);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Caderno de Entregas');

        sheet.columns = [
            { header: 'ID CADERNO', key: 'id', width: 12 },
            { header: 'DATA/HORA CRIAÇÃO', key: 'data_criacao', width: 22 },
            { header: 'MOTORISTA', key: 'motorista', width: 25 },
            { header: 'AJUDANTE', key: 'ajudante', width: 25 },
            { header: 'VEÍCULO', key: 'veiculo', width: 20 },
            { header: 'LOCAL / PIZZARIA', key: 'local_entrega', width: 30 },
            { header: 'STATUS ENTREGA', key: 'item_status', width: 18 },
            { header: 'LINK ENDEREÇO (MAPS)', key: 'link_endereco', width: 45 }
        ];

        sheet.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        dados.forEach(m => {
            sheet.addRow({
                id: m.id,
                data_criacao: new Date(m.data_criacao).toLocaleString('pt-BR'),
                motorista: m.motorista,
                ajudante: m.ajudante || '-',
                veiculo: m.veiculo || '-',
                local_entrega: m.local_entrega || 'Nenhum local atribuído',
                item_status: m.item_status || '-',
                link_endereco: m.link_endereco || '-'
            });
        });

        sheet.eachRow(row => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Caderno_Entregas_${dataHoje}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('[ERRO EXPORTAR CADERNOS]', err);
        res.status(500).send('Erro ao gerar relatório');
    }
});

// =======================================================
// 3. EXPORTAR RELATÓRIO EXCEL COMPLETO DOS CADERNOS
// =======================================================
app.get('/exportar/caderno-entregas', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const { data_inicio, data_fim } = req.query;
        let where = [];
        let params = [];

        if (data_inicio) { where.push("DATE(c.data_criacao) >= ?"); params.push(data_inicio); }
        if (data_fim) { where.push("DATE(c.data_criacao) <= ?"); params.push(data_fim); }
        const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

        const [dados] = await db.promise().query(`
            SELECT c.id, c.data_criacao, c.motorista, c.ajudante, v.modelo AS veiculo,
                   i.local_entrega, i.link_endereco, i.status AS item_status,
                   i.itens_pedido, i.quantidade, i.valor_aberto
            FROM caderno_entregas c
            LEFT JOIN veiculos v ON c.veiculo_id = v.id
            LEFT JOIN caderno_entregas_itens i ON i.caderno_id = c.id
            ${whereSql}
            ORDER BY c.data_criacao ASC, c.id ASC
        `, params);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Caderno de Entregas');

        // Adicionadas as novas colunas
        sheet.columns = [
            { header: 'ID CADERNO', key: 'id', width: 12 },
            { header: 'DATA/HORA CRIAÇÃO', key: 'data_criacao', width: 22 },
            { header: 'MOTORISTA', key: 'motorista', width: 25 },
            { header: 'AJUDANTE', key: 'ajudante', width: 25 },
            { header: 'VEÍCULO', key: 'veiculo', width: 20 },
            { header: 'LOCAL / PIZZARIA', key: 'local_entrega', width: 30 },
            { header: 'ITENS DO PEDIDO', key: 'itens_pedido', width: 35 },
            { header: 'QTD', key: 'quantidade', width: 10 },
            { header: 'VALOR EM ABERTO', key: 'valor_aberto', width: 20 },
            { header: 'STATUS ENTREGA', key: 'item_status', width: 18 },
            { header: 'LINK ENDEREÇO (MAPS)', key: 'link_endereco', width: 45 }
        ];

        sheet.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        dados.forEach(m => {
            sheet.addRow({
                id: m.id,
                data_criacao: new Date(m.data_criacao).toLocaleString('pt-BR'),
                motorista: m.motorista,
                ajudante: m.ajudante || '-',
                veiculo: m.veiculo || '-',
                local_entrega: m.local_entrega || 'Nenhum local atribuído',
                itens_pedido: m.itens_pedido || '-',
                quantidade: m.quantidade || '-',
                valor_aberto: m.valor_aberto ? parseFloat(m.valor_aberto) : '',
                item_status: m.item_status || '-',
                link_endereco: m.link_endereco || '-'
            });
        });

        // Aplica a formatação de Moeda na coluna de Valor
        sheet.getColumn('valor_aberto').numFmt = '"R$ " #,##0.00';

        sheet.eachRow(row => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Caderno_Entregas_${dataHoje}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('[ERRO EXPORTAR CADERNOS]', err);
        res.status(500).send('Erro ao gerar relatório');
    }
});

// =======================================================
// EXPORTAR CADERNO DE ENTREGAS EM PDF PARA IMPRESSÃO
// =======================================================
app.get("/caderno-entregas/pdf/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { id } = req.params;

    try {
        // 1. Busca os dados principais do caderno (capa)
        const [cadernoRows] = await db.promise().query(`
            SELECT c.*, v.modelo as veiculo_modelo 
            FROM caderno_entregas c
            LEFT JOIN veiculos v ON c.veiculo_id = v.id
            WHERE c.id = ?
        `, [id]);

        if (cadernoRows.length === 0) {
            return res.status(404).send("Caderno não encontrado.");
        }

        const caderno = cadernoRows[0];

        // 2. Busca todos os locais de entrega associados ao caderno + coordenadas e cidade salvas no histórico
        const [itens] = await db.promise().query(`
            SELECT i.*, ch.coordenadas, ch.cidade 
            FROM caderno_entregas_itens i
            LEFT JOIN clientes_historico ch ON i.local_entrega = ch.nome
            WHERE i.caderno_id = ? 
            ORDER BY i.id ASC
        `, [id]);

        const PDFDocument = require('pdfkit');
        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');

        // =======================================================
        // CONSTRÓI A URL DA ROTA INTELIGENTE COMPLETA (TODAS AS PARADAS)
        // =======================================================
        let linkRotaCompleta = "#";
        if (itens.length > 0) {
            const paradasUrl = itens.map(e => {
                if (e.coordenadas && e.coordenadas.trim() !== '') {
                    return encodeURIComponent(e.coordenadas.trim().replace(/\s/g, ''));
                }
                return encodeURIComponent(e.local_entrega + ", Camaçari, BA");
            }).join('/');

            // Truque de concatenação
            const baseDirUrl = "https://www" + ".google.com/maps/dir//";
            linkRotaCompleta = baseDirUrl + paradasUrl;
        }

        // =======================================================
        // FUNÇÕES AUXILIARES PARA ORGANIZAR ITENS POR TAMANHO
        // =======================================================
        function extrairTamanhoDoItem(texto = '') {
            const item = String(texto).toUpperCase();
            const match = item.match(/\b(N\d{1,3}|PP\d*|P\d*|M\d*|G\d*|GG|C\d+|A\d+|L\d+|\d+\s*CM|\d+\s*MM|\d+)\b/);
            return match ? match[0].replace(/\s+/g, '') : '';
        }

        // Fórmula de ordenação sequencial de caixas (PP -> GG)
        function pesoTamanho(tamanho = '') {
            const t = String(tamanho).toUpperCase().replace(/\s+/g, '');
            const ordemLetras = {
                'MINI': 1, 'PP': 2, 'PP1': 3, 'PP2': 4, 'PP3': 5,
                'P': 10, 'M': 20, 'G': 30, 'GG': 40
            };

            if (ordemLetras[t]) return ordemLetras[t];

            const numero = t.match(/\d+/);
            if (numero) return parseInt(numero[0], 10);

            return 9999;
        }

        function organizarItensPorTamanho(itensPedido = '') {
            if (!itensPedido || String(itensPedido).trim() === '') {
                return ['-'];
            }

            let texto = String(itensPedido)
                .replace(/\r/g, '')
                .replace(/\n+/g, ';')
                .replace(/\s+\+\s+/g, ';')
                .replace(/\s+\/\s+/g, ';')
                .replace(/\s*\|\s*/g, ';');

            texto = texto.replace(/,\s*(?=(CX|CAIXA|PIZZA|N\d{1,3}|PP|P\b|M\b|G\b|GG\b|RETANGULAR|QUADRADA|SMART|OITAVADA))/gi, ';');

            const lista = texto
                .split(';')
                .map(item => item.trim())
                .filter(Boolean);

            return lista.sort((a, b) => {
                const tamanhoA = extrairTamanhoDoItem(a);
                const tamanhoB = extrairTamanhoDoItem(b);

                const pesoA = pesoTamanho(tamanhoA);
                const pesoB = pesoTamanho(tamanhoB);

                if (pesoA !== pesoB) return pesoA - pesoB;
                return a.localeCompare(b, 'pt-BR');
            });
        }

        // =======================================================
        // FUNÇÃO AUXILIAR PARA CAMPO DE RECEBIMENTO
        // =======================================================
        function desenharCamposRecebimento(doc, x, y) {
            doc.font('Helvetica-Bold')
                .fontSize(6.8)
                .fillColor('#333333');

            doc.text('Dinheiro [   ]', x + 42, y, { lineBreak: false });
            doc.text('Pix [   ]', x + 100, y, { lineBreak: false });
            doc.text('Cartão [   ]', x + 138, y, { lineBreak: false });
        }

        // Inicializa o documento em tamanho A4 com margens
        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        // Gera o nome do ficheiro dinâmico com a data
        const dataGerado = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        // Configura os cabeçalhos para o browser abrir o PDF diretamente
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=caderno(${dataGerado}).pdf`);
        doc.pipe(res);

        // --- DESIGN DO MANIFESTO (Estilo Ecoflow) ---
        doc.rect(0, 0, 600, 15).fill('#0D5749');

        // Inserção da Logo da Ecocaixas
        const logoPath = path.join(process.cwd(), 'public', 'img', 'logo-ecocaixas.png');
        let titleX = 40;

        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 25, { width: 110 });
            titleX = 170;
        }

        // Título Principal
        doc.fillColor('#222222')
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('MANIFESTO DE CARGA E ROTAS', titleX, 35);

        // Dados da Equipe (Em bloco compacto abaixo do título)
        doc.font('Helvetica-Bold')
            .fontSize(9.5)
            .fillColor('#333333');

        let infoY = 58;
        const colLabelX = titleX;
        const colValueX = titleX + 65;

        // Motorista
        doc.text('Motorista:', colLabelX, infoY);
        doc.font('Helvetica').fillColor('#555555').text((caderno.motorista || '').toUpperCase(), colValueX, infoY);
        infoY += 14;

        // Ajudante
        doc.font('Helvetica-Bold').fillColor('#333333').text('Ajudante:', colLabelX, infoY);
        doc.font('Helvetica').fillColor('#555555').text((caderno.ajudante || 'SEM AJUDANTE').toUpperCase(), colValueX, infoY);
        infoY += 14;

        // Veículo
        doc.font('Helvetica-Bold').fillColor('#333333').text('Veículo:', colLabelX, infoY);
        doc.font('Helvetica').fillColor('#555555').text((caderno.veiculo_modelo || 'NÃO INFORMADO').toUpperCase(), colValueX, infoY);
        infoY += 16;

        // Data de Geração
        doc.font('Helvetica-Oblique').fontSize(8).fillColor('#888888').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, colLabelX, infoY);

        // =======================================================
        // QR CODE DA ROTA COMPLETA BEM MAIOR (110x110)
        // =======================================================
        if (linkRotaCompleta !== "#") {
            try {
                // Solicita o tamanho 250x250 da API externa para garantir densidade e nitidez máxima no papel
                const qrUrlGeral = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(linkRotaCompleta)}`;
                const responseGeral = await axios.get(qrUrlGeral, { responseType: 'arraybuffer' });
                const qrBufferGeral = Buffer.from(responseGeral.data, 'binary');

                // Desenha o QR Code mestre ampliado no canto superior direito
                doc.image(qrBufferGeral, 445, 25, { width: 110, height: 110 });
                doc.font('Helvetica-Bold')
                    .fontSize(7.5)
                    .fillColor('#0D5749')
                    .text('ROTA COMPLETA NO MAPS (GPS)', 435, 140, { width: 130, align: 'center' });
            } catch (errQrGeral) {
                console.error("[Erro] Falha ao injetar QR Code Geral no PDF:", errQrGeral.message);
            }
        }

        // =======================================================
        // CAIXA DE ALERTA VERMELHO DE ARRUMAÇÃO DE CARGA
        // =======================================================
        doc.rect(40, 155, 515, 30).fill('#FFF5F5');
        doc.lineWidth(1).strokeColor('#F5B7B7').rect(40, 155, 515, 30).stroke();

        doc.fillColor('#D32F2F')
            .font('Helvetica-Bold')
            .fontSize(9.5)
            .text('ORDEM DE CARREGAMENTO: CARREGUE O VEÍCULO DO ÚLTIMO PARA O PRIMEIRO ITEM', 45, 165, { align: 'center', width: 505 });

        // Linha divisória pós-alerta antes de iniciar a listagem das paradas
        doc.moveTo(40, 200).lineTo(555, 200).stroke('#dddddd');

        doc.fillColor('#0D5749')
            .font('Helvetica-Bold')
            .fontSize(13)
            .text('RELAÇÃO ORDENADA DE ENTREGAS', 40, 212);

        // Posição Y inicial de renderização das caixas ajustada de forma limpa
        let yPosition = 237;

        // Loop para desenhar as caixas de cada entrega com os novos dados e QR Code individual
        for (let i = 0; i < itens.length; i++) {
            const item = itens[i];
            const itensOrganizados = organizarItensPorTamanho(item.itens_pedido);

            const alturaLinhaItem = 11;
            const alturaItens = Math.max(14, itensOrganizados.length * alturaLinhaItem);

            const qtdY = yPosition + 43 + alturaItens;
            const idY = qtdY + 30;

            const boxHeight = Math.max(108, idY - yPosition + 22);

            // Proteção de Quebra de Página Inteligente
            if (yPosition + boxHeight > doc.page.height - 45) {
                doc.addPage();
                doc.rect(0, 0, 600, 12).fill('#0D5749');
                yPosition = 40;
            }

            // Recalcula posições após possível quebra de página
            const itensStartY = yPosition + 35;
            const qtdStartY = yPosition + 43 + alturaItens;
            const idStartY = qtdStartY + 30;

            // Caixa delimitadora da entrega
            doc.rect(40, yPosition, 515, boxHeight).stroke('#e5e5e5');

            // Formatação do Nome do Cliente e da Cidade
            const cidadeFormatada = item.cidade && item.cidade.trim() !== '' ? ` (${item.cidade.trim().toUpperCase()})` : '';
            const nomeClienteFinal = `${(item.local_entrega || '').toUpperCase()}${cidadeFormatada}`;

            // Nome do Cliente / Localização
            doc.fillColor('#111111')
                .font('Helvetica-Bold')
                .fontSize(11)
                .text(`[   ]  ${i + 1}. ${nomeClienteFinal}`, 55, yPosition + 15, {
                    width: 390,
                    lineBreak: false
                });

            // Listagem de Itens
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor('#444444')
                .text('Itens:', 55, itensStartY);

            doc.font('Helvetica')
                .fontSize(8.7)
                .fillColor('#333333');

            itensOrganizados.forEach((linha, index) => {
                doc.text(`• ${linha}`, 90, itensStartY + (index * alturaLinhaItem), {
                    width: 330,
                    lineBreak: false
                });
            });

            // Quantidades Totais
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor('#444444')
                .text('Qtd Total:', 55, qtdStartY);

            doc.font('Helvetica')
                .fillColor('#333333')
                .text((item.quantidade || '-'), 110, qtdStartY);

            // Valores Financeiros em Aberto
            if (item.valor_aberto && parseFloat(item.valor_aberto) > 0) {
                const valorFormatado = parseFloat(item.valor_aberto).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });

                doc.font('Helvetica-Bold')
                    .fontSize(9)
                    .fillColor('#444444')
                    .text('A Receber:', 145, qtdStartY);

                doc.font('Helvetica-Bold')
                    .fontSize(9)
                    .fillColor('#0D5749')
                    .text(`R$ ${valorFormatado}`, 202, qtdStartY);

                desenharCamposRecebimento(doc, 270, qtdStartY + 1);
            }

            // Metadados de ID e Rastreio
            doc.font('Helvetica')
                .fontSize(8)
                .fillColor('#999999')
                .text(`ID Registo: #${item.id}  |  Manifesto Base: #${id}`, 55, idStartY);

            // QR Code Individual da Parada (Usa Coordenadas se existirem, senão link)
            const searchBaseUrl = "https://www" + ".google.com/maps/search/?api=1&query=";
            const targetLink = (item.coordenadas && item.coordenadas.trim() !== '')
                ? searchBaseUrl + encodeURIComponent(item.coordenadas.trim().replace(/\s/g, ''))
                : item.link_endereco;

            if (targetLink) {
                doc.font('Helvetica-Bold')
                    .fontSize(8)
                    .fillColor('#0D5749')
                    .text('Endereço ->', 385, yPosition + 45);

                try {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(targetLink)}`;
                    const response = await axios.get(qrUrl, { responseType: 'arraybuffer' });
                    const qrBuffer = Buffer.from(response.data, 'binary');

                    doc.image(qrBuffer, 470, yPosition + 12, {
                        width: 70,
                        height: 70
                    });
                } catch (errorQr) {
                    console.error("Falha ao injetar QR Code individual no PDF:", errorQr.message);
                    doc.fillColor('#dc3545')
                        .fontSize(8)
                        .text('[Erro QR Code]', 430, yPosition + 32);
                }
            } else {
                doc.font('Helvetica-Oblique')
                    .fontSize(8.5)
                    .fillColor('#999999')
                    .text('Nenhum link ou rota GPS associada a este destino.', 55, idStartY, {
                        align: 'right',
                        width: 490
                    });
            }

            yPosition += boxHeight + 15;
        }

        // Finaliza o documento PDF
        doc.end();

    } catch (error) {
        console.error('[ERRO PDF MANIFESTO]', error);
        if (!res.headersSent) {
            res.status(500).send('Erro crítico interno ao processar o PDF de impressão. Verifique os logs.');
        }
    }
});

// =======================================================
// ROTA TEMPORÁRIA: MIGRAR COORDENADAS E CIDADES
// =======================================================
app.get("/caderno-entregas/migrar-coordenadas", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        // Busca clientes que não têm coordenada OU que não têm a cidade salva
        const [clientes] = await db.promise().query(`
            SELECT nome, link_endereco, coordenadas 
            FROM clientes_historico 
            WHERE link_endereco IS NOT NULL 
              AND link_endereco != '' 
              AND (coordenadas IS NULL OR coordenadas = '' OR cidade IS NULL OR cidade = '')
        `);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        if (clientes.length === 0) {
            return res.send(`
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                    <h3 style="color: #0D5749;">Tudo pronto!</h3>
                    <p>Não há clientes precisando de atualização de GPS ou Cidade.</p>
                </div>
            `);
        }

        res.write(' '.repeat(1024));

        res.write(`
            <style>
                body { font-family: 'Segoe UI', sans-serif; font-size: 14px; color: #333; padding: 10px; margin: 0; background: #f8f9fa; }
                .linha { margin: 5px 0; padding: 8px; border-radius: 4px; border-left: 4px solid #ccc; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .sucesso { border-left-color: #198754; }
                .aviso { border-left-color: #ffc107; }
                .erro { border-left-color: #dc3545; }
            </style>
            <h3>Sincronizando GPS e Cidade de ${clientes.length} clientes...</h3>
            <p>Por favor, não feche o modal até a conclusão.</p>
            <hr style="border: 1px solid #ddd;">
        `);

        let atualizados = 0;

        for (let c of clientes) {
            try {
                let coordCli = c.coordenadas;
                let atualizouAlgo = false;

                // Se não tem coordenada, decodifica o link
                if (!coordCli || coordCli.trim() === '') {
                    const localizacaoResolvida = await obterLocalizacao(c.nome, c.link_endereco);
                    if (localizacaoResolvida && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(localizacaoResolvida.trim())) {
                        coordCli = localizacaoResolvida.trim();
                        atualizouAlgo = true;
                    }
                }

                // Se temos a coordenada na mão, buscamos a cidade
                if (coordCli && coordCli.trim() !== '') {
                    const cidade = await obterCidadeDasCoordenadas(coordCli);

                    await db.promise().query(
                        "UPDATE clientes_historico SET coordenadas = ?, cidade = ? WHERE nome = ?",
                        [coordCli, cidade || null, c.nome]
                    );

                    atualizados++;
                    res.write(`<div class="linha sucesso">✅ <b>${c.nome}:</b> GPS: ${coordCli} | Cidade: <b>${cidade || 'Não localizada'}</b></div>`);
                } else {
                    res.write(`<div class="linha aviso">⚠️ <b>${c.nome}:</b> Link não revelou a coordenada.</div>`);
                }
            } catch (err) {
                res.write(`<div class="linha erro">❌ <b>Erro em ${c.nome}:</b> ${err.message}</div>`);
            }

            res.write(`<script>window.scrollTo(0, document.body.scrollHeight);</script>`);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        res.write(`
            <hr style="border: 1px solid #ddd;">
            <div style="text-align: center; padding: 20px 0;">
                <h4 style="color: #0D5749; margin-bottom: 5px;">🎉 Sincronização Concluída!</h4>
                <p><b>${atualizados}</b> clientes foram atualizados com sucesso.</p>
            </div>
            <script>window.scrollTo(0, document.body.scrollHeight);</script>
        `);
        res.end();

    } catch (error) {
        console.error("[ERRO NA MIGRAÇÃO]:", error);
        if (!res.headersSent) res.status(500).send("Erro interno ao tentar rodar a migração.");
    }
});

// 1. ROTA PRINCIPAL (Filtrando apenas ordens ATIVAS para o painel)
app.get('/producao', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario === "motorista") return res.status(403).send("Acesso negado.");

    try {
        // Busca apenas o que está ATIVO (ativo = 1) para os modais de produção
        const [rotativa] = await db.promise().query('SELECT * FROM pedidos_rotativa WHERE ativo = 1 ORDER BY status_producao ASC, created_at DESC');
        const [flexo] = await db.promise().query('SELECT * FROM pedidos_flexografica WHERE ativo = 1 ORDER BY status_producao ASC, created_at DESC');

        const [[rotativaNovas]] = await db.promise().query('SELECT COUNT(*) as total FROM pedidos_rotativa WHERE notificado = 1 AND ativo = 1');
        const [[flexoNovas]] = await db.promise().query('SELECT COUNT(*) as total FROM pedidos_flexografica WHERE notificado = 1 AND ativo = 1');

        const page = parseInt(req.query.page || "1", 10);
        const limit = 10;
        const offset = (page - 1) * limit;

        // Contagem agora baseada em lotes únicos
        const queryHistoricoCount = `
            SELECT COUNT(DISTINCT lote) AS total_datas FROM (
                SELECT lote FROM pedidos_rotativa WHERE lote IS NOT NULL
                UNION ALL
                SELECT lote FROM pedidos_flexografica WHERE lote IS NOT NULL
            ) AS t
        `;
        const [[countResult]] = await db.promise().query(queryHistoricoCount);
        const total = countResult.total_datas || 0;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        const currentOffset = (currentPage - 1) * limit;

        // O histórico agora agrupa por LOTE (geração única) e mostra a hora exata
        const queryHistoricoList = `
            SELECT lote as lote_id, 
                   DATE_FORMAT(MAX(created_at), '%d/%m/%Y %H:%i') as data_formatada,
                   COUNT(*) as total_pedidos
            FROM (
                SELECT lote, created_at FROM pedidos_rotativa WHERE lote IS NOT NULL
                UNION ALL
                SELECT lote, created_at FROM pedidos_flexografica WHERE lote IS NOT NULL
            ) AS t
            GROUP BY lote
            ORDER BY lote DESC
            LIMIT ? OFFSET ?
        `;

        const [historico] = await db.promise().query(queryHistoricoList, [limit, currentOffset]);

        res.send(require('./views/ordemProducaoView')(
            req.session.user,
            rotativa,
            flexo,
            req.query,
            rotativaNovas.total,
            flexoNovas.total,
            historico,
            { page: currentPage, totalPages }
        ));
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar produção');
    }
});

// ADICIONE ESTA NOVA ROTA PARA EXPORTAR PELO HISTÓRICO
app.get('/exportar/historico', async (req, res) => {
    const loteAlvo = req.query.lote; // agora recebe o ID do lote

    if (!loteAlvo) return res.status(400).send("Lote não especificado.");

    try {
        const [rotativa] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, quantidade, previsao_faturamento, status_producao
            FROM pedidos_rotativa 
            WHERE lote = ? 
            ORDER BY 
                modelo,
                CAST(REGEXP_REPLACE(tamanho, '[^0-9]', '') AS UNSIGNED),
                cliente`, [loteAlvo]
        );

        const [flexo] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, material, qtd_cores, cor_personalizacao, quantidade, status_pedido, previsao_faturamento, status_producao
            FROM pedidos_flexografica 
            WHERE lote = ? 
            ORDER BY cliente`, [loteAlvo]
        );

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();

        // Transforma o timestamp do lote numa data legível para os títulos do Excel
        const dataDoLote = new Date(parseInt(loteAlvo));
        const dataFormatadaStr = isNaN(dataDoLote) ? loteAlvo : dataDoLote.toLocaleDateString('pt-BR');

        // ==========================================
        // ABA 1: ROTATIVA / PLANA
        // ==========================================
        if (rotativa.length > 0) {
            const sheetRot = workbook.addWorksheet('Rotativa');

            sheetRot.pageSetup = {
                orientation: 'landscape',
                scale: 95,
                fitToPage: false,
                margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
            };

            sheetRot.columns = [
                { header: 'MODELO', key: 'modelo', width: 25 },
                { header: 'TAMANHO', key: 'tamanho', width: 12 },
                { header: 'CLIENTE', key: 'cliente', width: 30 },
                { header: 'QUANTIDADE', key: 'quantidade', width: 15 },
                { header: 'VENDEDOR', key: 'vendedor', width: 25 },
                { header: 'DATA', key: 'previsao_faturamento', width: 15 },
                { header: 'OPERADOR', key: 'operador', width: 20 },
                { header: 'STATUS', key: 'status', width: 15 }
            ];

            sheetRot.insertRow(1, []);
            sheetRot.mergeCells(1, 1, 1, sheetRot.columns.length);

            const tituloCell = sheetRot.getCell('A1');
            tituloCell.value = `ROTATIVA/PLANA (HISTÓRICO) - ${dataFormatadaStr}`;
            tituloCell.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
            tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
            sheetRot.getRow(1).height = 25;

            const headerRow = sheetRot.getRow(2);
            headerRow.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            let modeloAtual = null;
            let tamanhoAtual = null;

            rotativa.forEach(d => {
                if (modeloAtual !== null && modeloAtual !== d.modelo) {
                    sheetRot.addRow({});
                    sheetRot.addRow({});
                }

                if (tamanhoAtual !== null && tamanhoAtual !== d.tamanho && modeloAtual === d.modelo) {
                    sheetRot.addRow({});
                }

                sheetRot.addRow({
                    modelo: modeloAtual === d.modelo ? '' : d.modelo,
                    tamanho: tamanhoAtual === d.tamanho && modeloAtual === d.modelo ? '' : d.tamanho,
                    cliente: d.cliente,
                    quantidade: d.quantidade,
                    vendedor: d.vendedor,
                    previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                    operador: '',
                    status: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente'
                });

                modeloAtual = d.modelo;
                tamanhoAtual = d.tamanho;
            });

            sheetRot.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
            sheetRot.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
            sheetRot.getColumn('modelo').alignment = { horizontal: 'center' };
            sheetRot.getColumn('tamanho').alignment = { horizontal: 'center' };
            sheetRot.getColumn('quantidade').alignment = { horizontal: 'center' };

            sheetRot.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            });
        }

        // ==========================================
        // ABA 2: FLEXOGRÁFICA
        // ==========================================
        if (flexo.length > 0) {
            const sheetFlexo = workbook.addWorksheet('Flexográfica');

            sheetFlexo.pageSetup = {
                orientation: 'landscape',
                scale: 70,
                fitToPage: false,
                margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
            };

            sheetFlexo.columns = [
                { header: 'CLIENTE', key: 'cliente', width: 30 },
                { header: 'VENDEDOR', key: 'vendedor', width: 15 },
                { header: 'MODELO', key: 'modelo', width: 20 },
                { header: 'TAMANHO', key: 'tamanho', width: 10 },
                { header: 'MATERIAL', key: 'material', width: 12 },
                { header: 'QTD CORES', key: 'qtd_cores', width: 12 },
                { header: 'COR PERSONALIZAÇÃO', key: 'cor_personalizacao', width: 35 },
                { header: 'QTD', key: 'quantidade', width: 10 },
                { header: 'STATUS PEDIDO', key: 'status_pedido', width: 25 },
                { header: 'PREV. FAT.', key: 'previsao_faturamento', width: 15 },
                { header: 'OPERADOR', key: 'operador', width: 20 },
                { header: 'STATUS PROD.', key: 'status_producao', width: 15 }
            ];

            sheetFlexo.insertRow(1, []);
            sheetFlexo.mergeCells(1, 1, 1, sheetFlexo.columns.length);
            const tituloCellFlexo = sheetFlexo.getCell('A1');
            tituloCellFlexo.value = `FLEXOGRÁFICA (HISTÓRICO) - ${dataFormatadaStr}`;
            tituloCellFlexo.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
            tituloCellFlexo.alignment = { horizontal: 'center', vertical: 'middle' };
            sheetFlexo.getRow(1).height = 25;

            const headerRowFlexo = sheetFlexo.getRow(2);
            headerRowFlexo.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            let clienteAnterior = null;

            flexo.forEach(d => {
                if (clienteAnterior && d.cliente !== clienteAnterior) {
                    sheetFlexo.addRow({});
                }

                sheetFlexo.addRow({
                    ...d,
                    previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                    status_producao: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente',
                    operador: ''
                });

                clienteAnterior = d.cliente;
            });

            sheetFlexo.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
            sheetFlexo.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
            sheetFlexo.getColumn('quantidade').alignment = { horizontal: 'center' };
            sheetFlexo.getColumn('qtd_cores').alignment = { horizontal: 'center' };

            sheetFlexo.eachRow((row) => {
                row.eachCell(cell => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            });
        }

        if (rotativa.length === 0 && flexo.length === 0) {
            return res.status(404).send("Nenhum dado encontrado para a geração especificada.");
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Historico_Producao_Lote_${loteAlvo}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao exportar histórico');
    }
});

// ADICIONE ESTA NOVA ROTA PARA EXPORTAR PELO HISTÓRICO
app.get('/exportar/historico', async (req, res) => {
    const dataAlvo = req.query.data; // formato YYYY-MM-DD

    if (!dataAlvo) return res.status(400).send("Data não especificada.");

    try {
        const [rotativa] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, quantidade, previsao_faturamento, status_producao
            FROM pedidos_rotativa 
            WHERE DATE(created_at) = ? 
            ORDER BY 
                modelo,
                CAST(REGEXP_REPLACE(tamanho, '[^0-9]', '') AS UNSIGNED),
                cliente`, [dataAlvo]
        );

        const [flexo] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, material, qtd_cores, cor_personalizacao, quantidade, status_pedido, previsao_faturamento, status_producao
            FROM pedidos_flexografica 
            WHERE DATE(created_at) = ? 
            ORDER BY cliente`, [dataAlvo]
        );

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const dataFormatadaStr = dataAlvo.split('-').reverse().join('-');

        // ==========================================
        // ABA 1: ROTATIVA / PLANA
        // ==========================================
        if (rotativa.length > 0) {
            const sheetRot = workbook.addWorksheet('Rotativa');

            sheetRot.pageSetup = {
                orientation: 'landscape',
                scale: 95,
                fitToPage: false,
                margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
            };

            sheetRot.columns = [
                { header: 'MODELO', key: 'modelo', width: 25 },
                { header: 'TAMANHO', key: 'tamanho', width: 12 },
                { header: 'CLIENTE', key: 'cliente', width: 30 },
                { header: 'QUANTIDADE', key: 'quantidade', width: 15 },
                { header: 'VENDEDOR', key: 'vendedor', width: 25 },
                { header: 'DATA', key: 'previsao_faturamento', width: 15 },
                { header: 'OPERADOR', key: 'operador', width: 20 },
                { header: 'STATUS', key: 'status', width: 15 }
            ];

            sheetRot.insertRow(1, []);
            sheetRot.mergeCells(1, 1, 1, sheetRot.columns.length);

            const tituloCell = sheetRot.getCell('A1');
            tituloCell.value = `ROTATIVA/PLANA (HISTÓRICO) - ${dataFormatadaStr}`;
            tituloCell.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
            tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
            sheetRot.getRow(1).height = 25;

            const headerRow = sheetRot.getRow(2);
            headerRow.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            let modeloAtual = null;
            let tamanhoAtual = null;

            rotativa.forEach(d => {
                if (modeloAtual !== null && modeloAtual !== d.modelo) {
                    sheetRot.addRow({});
                    sheetRot.addRow({});
                }

                if (tamanhoAtual !== null && tamanhoAtual !== d.tamanho && modeloAtual === d.modelo) {
                    sheetRot.addRow({});
                }

                sheetRot.addRow({
                    modelo: modeloAtual === d.modelo ? '' : d.modelo,
                    tamanho: tamanhoAtual === d.tamanho && modeloAtual === d.modelo ? '' : d.tamanho,
                    cliente: d.cliente,
                    quantidade: d.quantidade,
                    vendedor: d.vendedor,
                    previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                    operador: '',
                    status: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente'
                });

                modeloAtual = d.modelo;
                tamanhoAtual = d.tamanho;
            });

            sheetRot.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
            sheetRot.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
            sheetRot.getColumn('modelo').alignment = { horizontal: 'center' };
            sheetRot.getColumn('tamanho').alignment = { horizontal: 'center' };
            sheetRot.getColumn('quantidade').alignment = { horizontal: 'center' };

            sheetRot.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            });
        }

        // ==========================================
        // ABA 2: FLEXOGRÁFICA
        // ==========================================
        if (flexo.length > 0) {
            const sheetFlexo = workbook.addWorksheet('Flexográfica');

            sheetFlexo.pageSetup = {
                orientation: 'landscape',
                scale: 70,
                fitToPage: false,
                margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
            };

            sheetFlexo.columns = [
                { header: 'CLIENTE', key: 'cliente', width: 30 },
                { header: 'VENDEDOR', key: 'vendedor', width: 15 },
                { header: 'MODELO', key: 'modelo', width: 20 },
                { header: 'TAMANHO', key: 'tamanho', width: 10 },
                { header: 'MATERIAL', key: 'material', width: 12 },
                { header: 'QTD CORES', key: 'qtd_cores', width: 12 },
                { header: 'COR PERSONALIZAÇÃO', key: 'cor_personalizacao', width: 35 },
                { header: 'QTD', key: 'quantidade', width: 10 },
                { header: 'STATUS PEDIDO', key: 'status_pedido', width: 25 },
                { header: 'PREV. FAT.', key: 'previsao_faturamento', width: 15 },
                { header: 'OPERADOR', key: 'operador', width: 20 },
                { header: 'STATUS PROD.', key: 'status_producao', width: 15 }
            ];

            sheetFlexo.insertRow(1, []);
            sheetFlexo.mergeCells(1, 1, 1, sheetFlexo.columns.length);
            const tituloCellFlexo = sheetFlexo.getCell('A1');
            tituloCellFlexo.value = `FLEXOGRÁFICA (HISTÓRICO) - ${dataFormatadaStr}`;
            tituloCellFlexo.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
            tituloCellFlexo.alignment = { horizontal: 'center', vertical: 'middle' };
            sheetFlexo.getRow(1).height = 25;

            const headerRowFlexo = sheetFlexo.getRow(2);
            headerRowFlexo.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            let clienteAnterior = null;

            flexo.forEach(d => {
                if (clienteAnterior && d.cliente !== clienteAnterior) {
                    sheetFlexo.addRow({});
                }

                sheetFlexo.addRow({
                    ...d,
                    previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                    status_producao: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente',
                    operador: ''
                });

                clienteAnterior = d.cliente;
            });

            sheetFlexo.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
            sheetFlexo.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
            sheetFlexo.getColumn('quantidade').alignment = { horizontal: 'center' };
            sheetFlexo.getColumn('qtd_cores').alignment = { horizontal: 'center' };

            sheetFlexo.eachRow((row) => {
                row.eachCell(cell => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            });
        }

        // Se por algum motivo a data não tiver registros nas duas tabelas (caso raro), previne corrupção de excel vazio
        if (rotativa.length === 0 && flexo.length === 0) {
            return res.status(404).send("Nenhum dado encontrado para a data especificada.");
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Historico_Producao_${dataFormatadaStr}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao exportar histórico');
    }
});

// =======================================================
// ROTA IMPORTAR CORRIGIDA (ARQUIVA DADOS ANTERIORES)
// =======================================================
app.post('/importar', upload.single('planilha'), async (req, res) => {
    if (!req.file) return res.redirect('/producao?erro=arquivo');

    const caminhoArquivo = req.file.path;
    const lote = Date.now(); // Gera o ID único da importação
    const pythonPath = process.platform === "win32" ? `"C:\\Python313\\python.exe"` : "python3";

    exec(`${pythonPath} app.py "${caminhoArquivo}" ${lote}`, async (error, stdout, stderr) => {
        console.log('----- OUTPUT DO PYTHON -----');
        console.log(stdout);

        // Verifica se houve erro de execução ou erro tratado pelo Python
        if (error || stdout.includes("Erro:")) {
            console.error('----- ERRO DO PYTHON -----');
            console.error(error || stdout);

            // Em caso de erro, removemos apenas a "metade" que tentou entrar
            await db.promise().query('DELETE FROM pedidos_rotativa WHERE lote = ?', [lote]);
            await db.promise().query('DELETE FROM pedidos_flexografica WHERE lote = ?', [lote]);

            return res.redirect('/producao?erro=planilha');
        }

        try {
            // MÁGICA AQUI: Arquiva (limpa do painel) todos os dados que estavam ativos antes desta importação
            await db.promise().query('UPDATE pedidos_rotativa SET ativo = 0 WHERE ativo = 1 AND lote != ?', [lote]);
            await db.promise().query('UPDATE pedidos_flexografica SET ativo = 0 WHERE ativo = 1 AND lote != ?', [lote]);

            // Redireciona com sucesso
            res.redirect('/producao?sucesso=1');
        } catch (dbErr) {
            console.error('[ERRO DB UPDATE ATIVO]', dbErr);
            res.redirect('/producao?erro=planilha');
        }
    });
});

// ALTERAR STATUS (AJAX)
app.post('/status/:tipo/:id', isLogged, async (req, res) => {
    const { tipo, id } = req.params;
    const tabela = tipo === 'rotativa' ? 'pedidos_rotativa' : 'pedidos_flexografica';
    try {
        await db.promise().query(`UPDATE ${tabela} SET status_producao = CASE WHEN status_producao = 'pendente' THEN 'concluido' ELSE 'pendente' END WHERE id = ?`, [id]);
        const [rows] = await db.promise().query(`SELECT status_producao FROM ${tabela} WHERE id = ?`, [id]);
        res.json({ success: true, status: rows[0].status_producao });
    } catch (err) { res.status(500).json({ success: false }); }
});

// 2. ROTA LIMPAR (Agora ela apenas "desativa" as ordens, não apaga)
app.post('/limpar', async (req, res) => {
    try {
        // Em vez de TRUNCATE, marcamos como inativo
        await db.promise().query('UPDATE pedidos_rotativa SET ativo = 0 WHERE ativo = 1');
        await db.promise().query('UPDATE pedidos_flexografica SET ativo = 0 WHERE ativo = 1');

        res.redirect('/producao?limpo=1');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao limpar os dados');
    }
});

// =======================================================
// EXPORTAÇÃO PARA EXCEL (PRODUÇÃO)
// =======================================================

// Exportar Rotativa / Plana
app.get('/exportar/rotativa', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const [dados] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, quantidade, previsao_faturamento, status_producao
            FROM pedidos_rotativa
            WHERE ativo = 1
            ORDER BY 
                modelo,
                CAST(REGEXP_REPLACE(tamanho, '[^0-9]', '') AS UNSIGNED),
                cliente
        `);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Rotativa');
        const hoje = new Date();
        const dataFormatada = hoje.toLocaleDateString('pt-BR');

        sheet.pageSetup = {
            orientation: 'landscape',
            scale: 95,
            fitToPage: false,
            margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
        };

        sheet.columns = [
            { header: 'MODELO', key: 'modelo', width: 25 },
            { header: 'TAMANHO', key: 'tamanho', width: 12 },
            { header: 'CLIENTE', key: 'cliente', width: 30 },
            { header: 'QUANTIDADE', key: 'quantidade', width: 15 },
            { header: 'VENDEDOR', key: 'vendedor', width: 25 },
            { header: 'DATA', key: 'previsao_faturamento', width: 15 },
            { header: 'OPERADOR', key: 'operador', width: 20 },
            { header: 'STATUS', key: 'status', width: 15 }
        ];

        sheet.insertRow(1, []);
        sheet.mergeCells(1, 1, 1, sheet.columns.length);

        const tituloCell = sheet.getCell('A1');
        tituloCell.value = `ROTATIVA/PLANA - ${dataFormatada}`;
        tituloCell.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 25;

        const headerRow = sheet.getRow(2);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        let modeloAtual = null;
        let tamanhoAtual = null;

        dados.forEach(d => {
            if (modeloAtual !== null && modeloAtual !== d.modelo) {
                sheet.addRow({});
                sheet.addRow({});
            }

            if (tamanhoAtual !== null && tamanhoAtual !== d.tamanho && modeloAtual === d.modelo) {
                sheet.addRow({});
            }

            sheet.addRow({
                modelo: modeloAtual === d.modelo ? '' : d.modelo,
                tamanho: tamanhoAtual === d.tamanho && modeloAtual === d.modelo ? '' : d.tamanho,
                cliente: d.cliente,
                quantidade: d.quantidade,
                vendedor: d.vendedor,
                previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                operador: '',
                status: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente'
            });

            modeloAtual = d.modelo;
            tamanhoAtual = d.tamanho;
        });

        sheet.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
        sheet.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
        sheet.getColumn('modelo').alignment = { horizontal: 'center' };
        sheet.getColumn('tamanho').alignment = { horizontal: 'center' };
        sheet.getColumn('quantidade').alignment = { horizontal: 'center' };

        sheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=rotativa_plana_${dataFormatada.replace(/\//g, '-')}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('[ERRO EXPORTAR ROTATIVA]', err);
        res.status(500).send('Erro ao gerar planilha');
    }
});

// Exportar Flexográfica
app.get('/exportar/flexografica', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const [dados] = await db.promise().query(`
            SELECT cliente, vendedor, modelo, tamanho, material,
                   qtd_cores, cor_personalizacao, quantidade,
                   status_pedido, previsao_faturamento, status_producao
            FROM pedidos_flexografica
            WHERE ativo = 1
            ORDER BY cliente
        `);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Flexografica');
        const hoje = new Date();
        const dataFormatada = hoje.toLocaleDateString('pt-BR');

        sheet.pageSetup = {
            orientation: 'landscape',
            scale: 70,
            fitToPage: false,
            margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }
        };

        sheet.columns = [
            { header: 'CLIENTE', key: 'cliente', width: 30 },
            { header: 'VENDEDOR', key: 'vendedor', width: 15 },
            { header: 'MODELO', key: 'modelo', width: 20 },
            { header: 'TAMANHO', key: 'tamanho', width: 10 },
            { header: 'MATERIAL', key: 'material', width: 12 },
            { header: 'QTD CORES', key: 'qtd_cores', width: 12 },
            { header: 'COR PERSONALIZAÇÃO', key: 'cor_personalizacao', width: 35 },
            { header: 'QTD', key: 'quantidade', width: 10 },
            { header: 'STATUS PEDIDO', key: 'status_pedido', width: 25 },
            { header: 'PREV. FAT.', key: 'previsao_faturamento', width: 15 },
            { header: 'OPERADOR', key: 'operador', width: 20 },
            { header: 'STATUS PROD.', key: 'status_producao', width: 15 }
        ];

        sheet.insertRow(1, []);
        sheet.mergeCells(1, 1, 1, sheet.columns.length);
        const tituloCell = sheet.getCell('A1');
        tituloCell.value = `FLEXOGRÁFICA - ${dataFormatada}`;
        tituloCell.font = { bold: true, size: 14, color: { argb: 'FF0D5749' } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 25;

        const headerRow = sheet.getRow(2);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        let clienteAnterior = null;

        dados.forEach(d => {
            if (clienteAnterior && d.cliente !== clienteAnterior) {
                sheet.addRow({});
            }

            sheet.addRow({
                ...d,
                previsao_faturamento: d.previsao_faturamento ? new Date(d.previsao_faturamento) : null,
                status_producao: d.status_producao === 'concluido' ? 'Concluído' : 'Pendente',
                operador: ''
            });

            clienteAnterior = d.cliente;
        });

        sheet.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
        sheet.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };
        sheet.getColumn('quantidade').alignment = { horizontal: 'center' };
        sheet.getColumn('qtd_cores').alignment = { horizontal: 'center' };

        sheet.eachRow((row) => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=flexografica_${dataFormatada.replace(/\//g, '-')}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('[ERRO EXPORTAR FLEXO]', err);
        res.status(500).send('Erro ao gerar planilha');
    }
});

// ==========================================
// API PARA BUSCAR PERÍODOS DE MOVIMENTAÇÕES
// ==========================================
app.get('/api/movimentacoes/periodos', async (req, res) => {
    if (!req.session.user) return res.status(401).json([]);
    try {
        const [rows] = await db.promise().query(`
            SELECT DISTINCT YEAR(data) as ano, MONTH(data) as mes 
            FROM movimentacoes 
            ORDER BY ano DESC, mes DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar períodos:", error);
        res.status(500).json([]);
    }
});

// ==========================================
// EXPORTAR RELATÓRIO EXCEL (Atualizado com Filtro e Ordem Crescente)
// ==========================================
app.get('/exportar/movimentacoes', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const { mes, ano } = req.query;
        let whereClause = '';
        const queryParams = [];

        // Filtra por mês e ano se o usuário selecionar no Modal
        if (mes && ano) {
            whereClause = 'WHERE MONTH(data) = ? AND YEAR(data) = ?';
            queryParams.push(mes, ano);
        }

        // Alterado ORDER BY para ASC (Crescente: do dia 1 ao último dia)
        const [dados] = await db.promise().query(`
            SELECT data, tipo, valor, responsavel, nome_assinante, descricao, observacao 
            FROM movimentacoes 
            ${whereClause}
            ORDER BY data ASC, id ASC
        `, queryParams);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Movimentações de Caixa');

        sheet.columns = [
            { header: 'DATA', key: 'data', width: 15 },
            { header: 'TIPO', key: 'tipo', width: 18 },
            { header: 'VALOR (R$)', key: 'valor', width: 15 },
            { header: 'REGISTRADO POR (SISTEMA)', key: 'responsavel', width: 25 },
            { header: 'ASSINANTE (QUEM MOVIMENTOU)', key: 'nome_assinante', width: 30 },
            { header: 'DESCRIÇÃO', key: 'descricao', width: 35 },
            { header: 'OBSERVAÇÕES', key: 'observacao', width: 35 }
        ];

        sheet.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
        });

        let totalEntradas = 0;
        let totalSaidas = 0;

        dados.forEach(m => {
            const valorCalculo = parseFloat(m.valor) || 0;

            if (m.tipo === 'entrada') {
                totalEntradas += valorCalculo;
            } else if (m.tipo === 'saida') {
                totalSaidas += valorCalculo;
            }

            const row = sheet.addRow({
                data: new Date(m.data),
                tipo: m.tipo.toUpperCase(),
                valor: valorCalculo,
                responsavel: m.responsavel || '-',
                nome_assinante: m.nome_assinante || 'Não informado',
                descricao: m.descricao,
                observacao: m.observacao || '-'
            });

            const corStatus = m.tipo === 'entrada' ? 'FF28A745' : 'FFDC3545';
            row.getCell('tipo').font = { color: { argb: corStatus }, bold: true };
        });

        sheet.getColumn('valor').numFmt = '"R$ " #,##0.00';
        sheet.getColumn('data').numFmt = 'dd/mm/yyyy';

        sheet.eachRow(row => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        sheet.addRow([]);

        const saldoFinal = totalEntradas - totalSaidas;

        const rowEntradas = sheet.addRow({ tipo: 'TOTAL ENTRADAS:', valor: totalEntradas });
        const rowSaidas = sheet.addRow({ tipo: 'TOTAL SAÍDAS:', valor: totalSaidas });
        const rowSaldo = sheet.addRow({ tipo: 'SALDO FINAL:', valor: saldoFinal });

        [rowEntradas, rowSaidas, rowSaldo].forEach(row => {
            row.getCell('tipo').font = { bold: true };
            row.getCell('tipo').alignment = { horizontal: 'right' };
            row.getCell('tipo').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            row.getCell('valor').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        rowEntradas.getCell('valor').font = { bold: true, color: { argb: 'FF28A745' } };
        rowSaidas.getCell('valor').font = { bold: true, color: { argb: 'FFDC3545' } };
        rowSaldo.getCell('valor').font = { bold: true, color: { argb: saldoFinal >= 0 ? 'FF000000' : 'FFDC3545' } };

        const compNome = (mes && ano) ? `${mes}_${ano}` : `Geral`;
        const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Caixa_${compNome}_${dataHoje}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('[ERRO EXPORTAR CAIXA]', err);
        res.status(500).send('Erro ao gerar relatório');
    }
});


// =======================================================
// ROTAS – MÓDULO DE PROPOSTAS DE DESIGN E CLICHÊS
// =======================================================

function tratarData(valor) {
    if (!valor) return null;
    if (typeof valor === 'string' && valor.trim() === '') return null;
    return valor;
}

// 1. Criar Proposta
app.post('/propostas', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        const { cliente, designer, data_inicio, data_fim, observacao, data_solicitacao_cliche, data_chegada_cliche, modificacoes = [] } = req.body;

        const [result] = await db.promise().query(
            `INSERT INTO propostas (cliente, designer, data_inicio, data_fim, observacao, data_solicitacao_cliche, data_chegada_cliche) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [cliente, designer || null, tratarData(data_inicio), tratarData(data_fim), observacao || null, tratarData(data_solicitacao_cliche), tratarData(data_chegada_cliche)]
        );

        const propostaId = result.insertId;

        for (const m of modificacoes) {
            if (m.descricao) {
                await db.promise().query(
                    `INSERT INTO proposta_modificacoes (proposta_id, descricao, data_modificacao) VALUES (?, ?, ?)`,
                    [propostaId, m.descricao, tratarData(m.data_modificacao)]
                );
            }
        }
        return res.json({ success: true, id: propostaId });
    } catch (err) {
        console.error('Erro ao criar proposta:', err);
        return res.status(500).json({ success: false });
    }
});

// 2. Buscar Propostas (Paginado)
app.get('/propostas/lista', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        const { cliente, data_inicio, data_fim, page = 1 } = req.query;
        const limit = 12; // <--- ALTERADO PARA 12 POR PÁGINA
        const offset = (page - 1) * limit;

        let where = 'WHERE 1=1';
        const params = [];

        if (cliente) {
            where += ' AND p.cliente LIKE ?';
            params.push(`%${cliente}%`);
        }

        if (data_inicio && data_fim) {
            where += ' AND p.data_inicio >= ? AND p.data_fim <= ?';
            params.push(data_inicio, data_fim);
        }

        const [[{ total }]] = await db.promise().query(`SELECT COUNT(DISTINCT p.id) AS total FROM propostas p ${where}`, params);

        const [rows] = await db.promise().query(
            `SELECT p.*, COUNT(m.id) AS total_modificacoes
             FROM propostas p
             LEFT JOIN proposta_modificacoes m ON m.proposta_id = p.id
             ${where}
             GROUP BY p.id ORDER BY p.criada_em DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return res.json({ data: rows, pagination: { total, page: Number(page), totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
});

// 3. Buscar Uma Proposta (Para Edição)
app.get('/propostas/detalhe/:id', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        const { id } = req.params;
        const [[proposta]] = await db.promise().query('SELECT * FROM propostas WHERE id = ?', [id]);
        if (!proposta) return res.status(404).json({ success: false, error: 'Proposta não encontrada' });

        const [modificacoes] = await db.promise().query('SELECT * FROM proposta_modificacoes WHERE proposta_id = ? ORDER BY data_modificacao ASC', [id]);
        return res.json({ proposta, modificacoes });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
});

// 4. Atualizar Proposta
app.put('/propostas/:id', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        const { id } = req.params;
        const { cliente, designer, data_inicio, data_fim, observacao, data_solicitacao_cliche, data_chegada_cliche, modificacoes = [] } = req.body;

        await db.promise().query(
            `UPDATE propostas SET cliente = ?, designer = ?, data_inicio = ?, data_fim = ?, observacao = ?, data_solicitacao_cliche = ?, data_chegada_cliche = ? WHERE id = ?`,
            [cliente, designer || null, tratarData(data_inicio), tratarData(data_fim), observacao || null, tratarData(data_solicitacao_cliche), tratarData(data_chegada_cliche), id]
        );

        await db.promise().query('DELETE FROM proposta_modificacoes WHERE proposta_id = ?', [id]);
        for (const m of modificacoes) {
            if (m.descricao) {
                await db.promise().query(`INSERT INTO proposta_modificacoes (proposta_id, descricao, data_modificacao) VALUES (?, ?, ?)`, [id, m.descricao, tratarData(m.data_modificacao)]);
            }
        }
        return res.json({ success: true });
    } catch (err) {
        console.error('Erro ao atualizar proposta:', err);
        return res.status(500).json({ success: false });
    }
});

// 5. Excluir Proposta
app.delete('/propostas/:id', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        await db.promise().query('DELETE FROM propostas WHERE id = ?', [req.params.id]);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
});

// 6. API Períodos Disponíveis (Para modal do Excel)
app.get('/admin/api/periodos-disponiveis', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Não autorizado' });
    try {
        const [rows] = await db.promise().query(`SELECT DISTINCT MONTH(data_inicio) as mes, YEAR(data_inicio) as ano FROM propostas WHERE data_inicio IS NOT NULL ORDER BY ano DESC, mes DESC`);
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Erro' });
    }
});

// 7. Rota de Renderização da View
app.get('/propostas', (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    return res.send(require('./views/propostasView')(req.session.user));
});

// 8. EXPORTAR RELATÓRIO EXCEL
app.get('/propostas/exportar/excel', async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    try {
        const { mes, ano } = req.query;
        let whereClause = '';
        const queryParams = [];

        if (mes && ano) {
            whereClause = 'WHERE MONTH(p.data_inicio) = ? AND YEAR(p.data_inicio) = ?';
            queryParams.push(mes, ano);
        }

        const query = `
            SELECT p.cliente, p.designer, p.data_inicio, p.data_fim, p.data_solicitacao_cliche, p.data_chegada_cliche, COUNT(m.id) AS total_modificacoes
            FROM propostas p LEFT JOIN proposta_modificacoes m ON m.proposta_id = p.id
            ${whereClause} GROUP BY p.id ORDER BY p.data_inicio DESC
        `;

        const [rows] = await db.promise().query(query, queryParams);

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Relatório');

        worksheet.columns = [
            { header: 'Mês / Ano', key: 'mesAno', width: 15 },
            { header: 'Cliente', key: 'cliente', width: 35 },
            { header: 'Designer', key: 'designer', width: 20 },
            { header: 'Alterações', key: 'alteracoes', width: 15 },
            { header: 'Duração da Arte (Dias)', key: 'diasArte', width: 25 },
            { header: 'Logística Clichê (Dias)', key: 'diasCliche', width: 25 },
            { header: 'Status', key: 'status', width: 20 }
        ];

        const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        worksheet.getRow(1).eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D5749' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = borderStyle;
        });

        if (rows.length === 0) {
            worksheet.addRow({ mesAno: 'Nenhum registro encontrado para este período.' });
            worksheet.mergeCells('A2:G2');
            worksheet.getCell('A2').alignment = { horizontal: 'center' };
            worksheet.getCell('A2').border = borderStyle;
        } else {
            let somaAlteracoes = 0, somaDiasArte = 0, countDiasArte = 0, somaDiasCliche = 0, countDiasCliche = 0;

            rows.forEach(row => {
                let mesAno = '-', diasArteTexto = '-', diasClicheTexto = '-', status = 'Em andamento';
                let diasArteNum = 0, diasClicheNum = 0;

                if (row.data_inicio) {
                    const d = new Date(row.data_inicio);
                    mesAno = (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
                }

                if (row.data_inicio && row.data_fim) {
                    const ms = new Date(row.data_fim) - new Date(row.data_inicio);
                    diasArteNum = Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
                    diasArteTexto = diasArteNum;
                    status = 'Concluída';
                    somaDiasArte += diasArteNum; countDiasArte++;
                }

                if (row.data_solicitacao_cliche && row.data_chegada_cliche) {
                    const ms = new Date(row.data_chegada_cliche) - new Date(row.data_solicitacao_cliche);
                    diasClicheNum = Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
                    diasClicheTexto = diasClicheNum;
                    somaDiasCliche += diasClicheNum; countDiasCliche++;
                }

                somaAlteracoes += (row.total_modificacoes || 0);

                const novaLinha = worksheet.addRow({
                    mesAno: mesAno, cliente: row.cliente || '', designer: row.designer || '-',
                    alteracoes: row.total_modificacoes || 0, diasArte: diasArteTexto, diasCliche: diasClicheTexto, status: status
                });

                novaLinha.alignment = { horizontal: 'center' };

                // === NOVA LÓGICA DE CORES DA LINHA EXCEL ===
                let corFundo = null;
                // Se algum estourar 2 dias, mantém a linha branca (null)
                if (diasArteNum > 2 || diasClicheNum > 2) {
                    corFundo = null;
                }
                // Se não estourou, e algum tem pelo menos 1 dia (até 2), fica verde
                else if ((diasArteNum > 0 && diasArteNum <= 2) || (diasClicheNum > 0 && diasClicheNum <= 2)) {
                    corFundo = 'FFE2EFDA'; // Verde claro
                }

                novaLinha.eachCell((cell) => {
                    cell.border = borderStyle;
                    if (corFundo) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: corFundo } };
                    }
                    if (typeof cell.value === 'number') cell.font = { bold: true, color: { argb: 'FF000000' } };
                });
            });

            const mediaAlteracoes = parseFloat((somaAlteracoes / rows.length).toFixed(1));
            const mediaDiasArte = countDiasArte > 0 ? parseFloat((somaDiasArte / countDiasArte).toFixed(1)) : '-';
            const mediaDiasCliche = countDiasCliche > 0 ? parseFloat((somaDiasCliche / countDiasCliche).toFixed(1)) : '-';

            const rowMedia = worksheet.addRow({
                mesAno: 'MÉDIAS', cliente: '-', designer: '-', alteracoes: mediaAlteracoes,
                diasArte: mediaDiasArte, diasCliche: mediaDiasCliche, status: '-'
            });

            rowMedia.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FF1E293B' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
                cell.alignment = { horizontal: 'center' };
                cell.border = borderStyle;
            });
        }

        const fileName = (mes && ano) ? `relatorio_propostas_${mes}_${ano}.xlsx` : `relatorio_propostas.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        await workbook.xlsx.write(res);
        return res.end();

    } catch (err) {
        return res.status(500).send('Erro ao gerar relatório');
    }
});

// =======================================================
// ROTAS – MÓDULO DE GABARITOS (DESIGN)
// =======================================================

// 1. Listar Gabaritos
app.get('/admin/gabaritos', (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "design") {
        return res.status(403).send("Acesso negado.");
    }

    db.query("SELECT * FROM gabaritos ORDER BY id DESC", (err, gabaritos) => {
        if (err) {
            console.error("Erro ao buscar gabaritos:", err);
            return res.status(500).send("Erro interno");
        }
        res.send(require('./views/gabaritosView')(req.session.user, gabaritos));
    });
});

// 2. Fazer Upload de Gabarito
app.post('/admin/gabaritos/upload', upload.single('arquivo_gabarito'), (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.tipo_usuario !== "admin" && req.session.user.tipo_usuario !== "design") {
        return res.status(403).send("Acesso negado.");
    }

    if (!req.file) return res.redirect('/admin/gabaritos');

    const nome = req.file.originalname;
    const url = `/uploads/${req.file.filename}`; // Usa a pasta nativa do multer do seu Ecoflow

    db.query("INSERT INTO gabaritos (nome, url) VALUES (?, ?)", [nome, url], (err) => {
        if (err) console.error("Erro ao salvar gabarito:", err);
        res.redirect('/admin/gabaritos');
    });
});

// 3. Excluir Gabarito
app.post('/admin/gabaritos/delete/:id', (req, res) => {
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

// Rota de Keep-Alive para manter a sessão ativa enquanto a aba estiver aberta
app.get("/ping-sessao", (req, res) => {
    if (req.session.user) {
        return res.status(200).json({ status: "ativo" });
    }
    return res.status(401).json({ status: "expirado" });
});

app.get("/health", (req, res) => {
    res.send("OK");
});

server.listen(PORT, '0.0.0.0', () => console.log("Servidor rodando na porta " + PORT)); 