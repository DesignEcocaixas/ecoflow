const express = require("express");
const router = express.Router();
const db = require("../db");

// Views
const loginView = require("../views/loginView");
const homeView = require("../views/homeView");

// Middlewares
const { verificarHierarquia } = require("../middlewares/authMiddleware");

//ROTA PRINCIPAL
router.get("/", (req, res) => {
    res.redirect("/login");
});

//FAZER LOGIN
router.get("/login", verificarHierarquia, (req, res) => {
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

router.post("/login", (req, res) => {
    const { email, senha } = req.body;

    db.query("SELECT * FROM usuarios WHERE email=? AND senha=?", [email, senha], (err, rows) => {
        if (err) {
            console.error("Erro no login:", err);
            return res.redirect("/login?erro=servidor");
        }

        if (rows.length > 0) {
            const user = rows[0];

            req.session.user = {
                id: user.id,
                nome: user.nome,
                tipo_usuario: user.tipo_usuario,
                foto: user.foto
            };

            return res.redirect("/home");
        } else {
            // REDIRECIONA COM A FLAG DE ERRO EM VEZ DE DAR SEND()
            return res.redirect("/login?erro=credenciais");
        }
    });
});

router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Erro ao encerrar sessão:", err);
        }
        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
});

router.get("/check-session", (req, res) => {
    if (req.session.user) {
        return res.json({ logado: true, usuario: req.session.user });
    }
    res.json({ logado: false });
});

//HOME
router.get("/home", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const dataAtual = new Date();
    let mesFiltro = req.query.mes ? parseInt(req.query.mes) : dataAtual.getMonth() + 1;
    let anoFiltro = req.query.ano ? parseInt(req.query.ano) : dataAtual.getFullYear();
    const modoFiltro = req.query.modo === 'mensal' ? 'mensal' : 'diario'; // Novo Modo

    // 1. NOVA BUSCA: Notificação Global Ativa
    db.query("SELECT * FROM notificacoes_globais WHERE status = 'ATIVA' ORDER BY criado_em DESC LIMIT 1", (errGlobal, resultGlobal) => {
        if (errGlobal) console.error("Erro ao buscar notificação global:", errGlobal);
        const notificacaoAtiva = (resultGlobal && resultGlobal.length > 0) ? resultGlobal[0] : null;

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
                                SELECT DISTINCT MONTH(data_criacao) AS mes, YEAR(data_criacao) AS ano 
                                FROM caderno_entregas 
                                ORDER BY ano DESC, mes DESC
                            `, (errMeses, mesesRows) => {
                                if (errMeses) {
                                    console.error("Erro ao buscar meses disponíveis:", errMeses);
                                    mesRows = [];
                                }

                                const mesesDisponiveis = mesesRows.map(row => {
                                    const dateObj = new Date(row.ano, row.mes - 1, 1);
                                    const mesNome = dateObj.toLocaleString('pt-BR', { month: 'long' });
                                    return {
                                        mes: row.mes,
                                        ano: row.ano,
                                        label: mesNome.charAt(0).toUpperCase() + mesNome.slice(1) + ' ' + row.ano
                                    };
                                });

                                if (!req.query.mes && !req.query.ano && mesesDisponiveis.length > 0) {
                                    const mesAtualTemDados = mesesDisponiveis.some(m => m.mes === mesFiltro && m.ano === anoFiltro);
                                    if (!mesAtualTemDados) {
                                        mesFiltro = mesesDisponiveis[0].mes;
                                        anoFiltro = mesesDisponiveis[0].ano;
                                    }
                                }

                                let queryGrafico = '';
                                let queryRanking = '';
                                let parametrosSQL = [];

                                if (modoFiltro === 'mensal') {
                                    // Agrupa por Mês
                                    queryGrafico = `
                                        SELECT MONTH(ce.data_criacao) AS chave, SUM(cei.quantidade) AS total_quantidade
                                        FROM caderno_entregas ce
                                        JOIN caderno_entregas_itens cei ON ce.id = cei.caderno_id
                                        WHERE YEAR(ce.data_criacao) = ?
                                        GROUP BY MONTH(ce.data_criacao)
                                        ORDER BY chave ASC
                                    `;
                                    queryRanking = `
                                        SELECT MONTH(ce.data_criacao) AS chave, cei.local_entrega AS cliente_nome, SUM(cei.quantidade) AS quantidade
                                        FROM caderno_entregas ce
                                        JOIN caderno_entregas_itens cei ON ce.id = cei.caderno_id
                                        WHERE YEAR(ce.data_criacao) = ?
                                        GROUP BY MONTH(ce.data_criacao), cei.local_entrega
                                        ORDER BY chave ASC, quantidade DESC
                                    `;
                                    parametrosSQL = [anoFiltro];
                                } else {
                                    // Agrupa por Dia
                                    queryGrafico = `
                                        SELECT DAY(ce.data_criacao) AS chave, SUM(cei.quantidade) AS total_quantidade
                                        FROM caderno_entregas ce
                                        JOIN caderno_entregas_itens cei ON ce.id = cei.caderno_id
                                        WHERE MONTH(ce.data_criacao) = ? AND YEAR(ce.data_criacao) = ?
                                        GROUP BY DAY(ce.data_criacao)
                                        ORDER BY chave ASC
                                    `;
                                    queryRanking = `
                                        SELECT DAY(ce.data_criacao) AS chave, cei.local_entrega AS cliente_nome, SUM(cei.quantidade) AS quantidade
                                        FROM caderno_entregas ce
                                        JOIN caderno_entregas_itens cei ON ce.id = cei.caderno_id
                                        WHERE MONTH(ce.data_criacao) = ? AND YEAR(ce.data_criacao) = ?
                                        GROUP BY DAY(ce.data_criacao), cei.local_entrega
                                        ORDER BY chave ASC, quantidade DESC
                                    `;
                                    parametrosSQL = [mesFiltro, anoFiltro];
                                }

                                db.query(queryGrafico, parametrosSQL, (errGrafico, graficoRows) => {
                                    if (errGrafico) console.error("Erro gráfico:", errGrafico);

                                    let labels = [];
                                    let dadosGrafico = [];
                                    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

                                    if (modoFiltro === 'mensal') {
                                        labels = nomesMeses;
                                        dadosGrafico = new Array(12).fill(0);
                                        if (graficoRows) {
                                            graficoRows.forEach(row => {
                                                if (row.chave >= 1 && row.chave <= 12) {
                                                    dadosGrafico[row.chave - 1] = Number(row.total_quantidade) || 0;
                                                }
                                            });
                                        }
                                    } else {
                                        const diasNoMes = new Date(anoFiltro, mesFiltro, 0).getDate();
                                        labels = Array.from({ length: diasNoMes }, (_, i) => String(i + 1).padStart(2, '0'));
                                        dadosGrafico = new Array(diasNoMes).fill(0);
                                        if (graficoRows) {
                                            graficoRows.forEach(row => {
                                                if (row.chave >= 1 && row.chave <= diasNoMes) {
                                                    dadosGrafico[row.chave - 1] = Number(row.total_quantidade) || 0;
                                                }
                                            });
                                        }
                                    }

                                    db.query(queryRanking, parametrosSQL, (errRanking, rankingRows) => {
                                        if (errRanking) console.error("Erro ranking:", errRanking);

                                        const rankingObj = {};
                                        if (rankingRows) {
                                            rankingRows.forEach(row => {
                                                let chaveStr = modoFiltro === 'mensal' ? nomesMeses[row.chave - 1] : String(row.chave).padStart(2, '0');
                                                if (!rankingObj[chaveStr]) rankingObj[chaveStr] = [];
                                                rankingObj[chaveStr].push({
                                                    cliente_nome: row.cliente_nome || "Desconhecido",
                                                    quantidade: Number(row.quantidade) || 0
                                                });
                                            });
                                        }

                                        const graficoMensal = { labels, data: dadosGrafico, ranking: rankingObj };

                                        db.query(`SELECT * FROM entregas_pedidos ORDER BY criado_em DESC, id DESC LIMIT 1`, (errRota, rotaRows) => {
                                            if (errRota) console.error("Erro rota:", errRota);
                                            const rota = rotaRows && rotaRows.length ? rotaRows[0] : null;

                                            if (!rota) {
                                                return res.send(homeView(req.session.user, notificacoes, {
                                                    veiculos, checklists, precos, rota: null,
                                                    graficoMensal, mesesDisponiveis, mesSelecionado: { mes: mesFiltro, ano: anoFiltro, modo: modoFiltro }
                                                }, notificacaoAtiva)); // REPASSANDO notificacaoAtiva AQUI
                                            }

                                            db.query(`SELECT id, pedido_id, cliente_nome, status, observacao, atualizado_por, atualizado_em FROM entregas_clientes WHERE pedido_id = ? ORDER BY id DESC`, [rota.id], (errClientes, clientes) => {
                                                if (errClientes) console.error("Erro clientes rota:", errClientes);
                                                return res.send(homeView(req.session.user, notificacoes, {
                                                    veiculos, checklists, precos, graficoMensal, mesesDisponiveis,
                                                    mesSelecionado: { mes: mesFiltro, ano: anoFiltro, modo: modoFiltro },
                                                    rota: { ...rota, clientes: clientes || [] }
                                                }, notificacaoAtiva)); // E REPASSANDO notificacaoAtiva AQUI
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
        );
    });
});

//DADOS DO GRÁFICO DA HOME
router.get("/api/dashboard-chart", (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "Não autorizado" });

    const dataAtual = new Date();
    let mesFiltro = req.query.mes ? parseInt(req.query.mes) : dataAtual.getMonth() + 1;
    let anoFiltro = req.query.ano ? parseInt(req.query.ano) : dataAtual.getFullYear();
    const modoFiltro = req.query.modo === 'mensal' ? 'mensal' : 'diario';

    let queryGrafico = '';
    let queryRanking = '';
    let parametrosSQL = [];

    if (modoFiltro === 'mensal') {
        queryGrafico = `
            SELECT MONTH(ce.data_criacao) AS chave, SUM(cei.quantidade) AS total_quantidade
            FROM caderno_entregas ce
            JOIN caderno_entregas_itens cei ON ce.id = cei.caderno_id
            WHERE YEAR(ce.data_criacao) = ?
            GROUP BY MONTH(ce.data_criacao)
            ORDER BY chave ASC
        `;
        queryRanking = `
            SELECT MONTH(ce.data_criacao) AS chave, cei.local_entrega AS cliente_nome, SUM(cei.quantidade) AS quantidade
            FROM caderno_entregas ce
            JOIN caderno_entregas_itens cei ON ce.id = cei.caderno_id
            WHERE YEAR(ce.data_criacao) = ?
            GROUP BY MONTH(ce.data_criacao), cei.local_entrega
            ORDER BY chave ASC, quantidade DESC
        `;
        parametrosSQL = [anoFiltro];
    } else {
        queryGrafico = `
            SELECT DAY(ce.data_criacao) AS chave, SUM(cei.quantidade) AS total_quantidade
            FROM caderno_entregas ce
            JOIN caderno_entregas_itens cei ON ce.id = cei.caderno_id
            WHERE MONTH(ce.data_criacao) = ? AND YEAR(ce.data_criacao) = ?
            GROUP BY DAY(ce.data_criacao)
            ORDER BY chave ASC
        `;
        queryRanking = `
            SELECT DAY(ce.data_criacao) AS chave, cei.local_entrega AS cliente_nome, SUM(cei.quantidade) AS quantidade
            FROM caderno_entregas ce
            JOIN caderno_entregas_itens cei ON ce.id = cei.caderno_id
            WHERE MONTH(ce.data_criacao) = ? AND YEAR(ce.data_criacao) = ?
            GROUP BY DAY(ce.data_criacao), cei.local_entrega
            ORDER BY chave ASC, quantidade DESC
        `;
        parametrosSQL = [mesFiltro, anoFiltro];
    }

    db.query(queryGrafico, parametrosSQL, (errGrafico, graficoRows) => {
        if (errGrafico) return res.status(500).json({ error: "Erro ao consultar gráfico" });

        let labels = [];
        let dadosGrafico = [];
        const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        if (modoFiltro === 'mensal') {
            labels = nomesMeses;
            dadosGrafico = new Array(12).fill(0);
            if (graficoRows) {
                graficoRows.forEach(row => {
                    if (row.chave >= 1 && row.chave <= 12) {
                        dadosGrafico[row.chave - 1] = Number(row.total_quantidade) || 0;
                    }
                });
            }
        } else {
            const diasNoMes = new Date(anoFiltro, mesFiltro, 0).getDate();
            labels = Array.from({ length: diasNoMes }, (_, i) => String(i + 1).padStart(2, '0'));
            dadosGrafico = new Array(diasNoMes).fill(0);
            if (graficoRows) {
                graficoRows.forEach(row => {
                    if (row.chave >= 1 && row.chave <= diasNoMes) {
                        dadosGrafico[row.chave - 1] = Number(row.total_quantidade) || 0;
                    }
                });
            }
        }

        db.query(queryRanking, parametrosSQL, (errRanking, rankingRows) => {
            if (errRanking) return res.status(500).json({ error: "Erro ao consultar ranking" });

            const rankingObj = {};
            if (rankingRows) {
                rankingRows.forEach(row => {
                    let chaveStr = modoFiltro === 'mensal' ? nomesMeses[row.chave - 1] : String(row.chave).padStart(2, '0');
                    if (!rankingObj[chaveStr]) rankingObj[chaveStr] = [];
                    rankingObj[chaveStr].push({
                        cliente_nome: row.cliente_nome || "Desconhecido",
                        quantidade: Number(row.quantidade) || 0
                    });
                });
            }

            // Devolve as informações puras em JSON (AJAX)
            return res.json({
                graficoMensal: { labels, data: dadosGrafico, ranking: rankingObj },
                mesSelecionado: { mes: mesFiltro, ano: anoFiltro, modo: modoFiltro }
            });
        });
    });
});

module.exports = router;