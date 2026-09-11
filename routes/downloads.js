const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { uploadDownloads } = require("../config/uploadConfig");

// =======================================================
// CONFIGURAÇÃO DO MULTER PARA A CENTRAL DE DOWNLOADS
// =======================================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, "..", "uploads", "downloads");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'ecocaixas-' + uniqueSuffix + ext);
    }
});

const uploadParams = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

// =======================================================
// FUNÇÃO AUXILIAR: BUSCAR BREADCRUMBS E INFOS DA PASTA ATUAL
// =======================================================
async function obterBreadcrumbs(pastaId) {
    let breadcrumbs = [];
    let currId = pastaId;
    while (currId) {
        const [[pasta]] = await db.promise().query("SELECT id, nome, pasta_id, criador_id FROM pastas_download WHERE id = ?", [currId]);
        if (pasta) {
            breadcrumbs.unshift({ id: pasta.id, nome: pasta.nome, criador_id: pasta.criador_id });
            currId = pasta.pasta_id;
        } else {
            break;
        }
    }
    return breadcrumbs;
}

// =======================================================
// LISTAR PASTAS E ARQUIVOS (READ)
// =======================================================
router.get("/downloads", async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");

    try {
        const pastaAtual = req.query.pasta ? parseInt(req.query.pasta) : null;
        const currentUserId = req.session.user.id || 0;
        const isUserAdmin = req.session.user.tipo_usuario === 'admin';
        
        // Proteção backend: Bloqueia visualização do interior da pasta se não tiver permissão
        if (pastaAtual && !isUserAdmin) {
            const [checkBlocked] = await db.promise().query(
                "SELECT 1 FROM pastas_bloqueios WHERE pasta_id = ? AND usuario_id = ?",
                [pastaAtual, currentUserId]
            );
            const [checkCreator] = await db.promise().query(
                "SELECT criador_id FROM pastas_download WHERE id = ?",
                [pastaAtual]
            );
            
            if (checkBlocked.length > 0 && checkCreator[0]?.criador_id !== currentUserId) {
                return res.redirect("/downloads?erro=acesso_negado");
            }
        }

        const page = parseInt(req.query.page || "1", 10);
        const limit = 30;
        const offset = (page - 1) * limit;

        const whereClauseArq = pastaAtual ? "WHERE pasta_id = ?" : "WHERE pasta_id IS NULL";
        const queryParamsArq = pastaAtual ? [pastaAtual] : [];

        // Busca todas as pastas sem filtrar os bloqueios (para podermos mostrar o cadeado na tela)
        let queryPastas = `SELECT * FROM pastas_download WHERE (pasta_id = ? OR (? IS NULL AND pasta_id IS NULL)) ORDER BY nome ASC`;
        let paramsPastas = [pastaAtual, pastaAtual];

        const [pastas] = await db.promise().query(queryPastas, paramsPastas);

        const countQuery = `SELECT COUNT(*) AS total FROM arquivos_download ${whereClauseArq}`;
        const [countResult] = await db.promise().query(countQuery, queryParamsArq);
        const total = countResult[0].total;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        const [arquivos] = await db.promise().query(`
            SELECT * FROM arquivos_download 
            ${whereClauseArq} 
            ORDER BY data_upload DESC 
            LIMIT ? OFFSET ?
        `, [...queryParamsArq, limit, offset]);

        const breadcrumbs = await obterBreadcrumbs(pastaAtual);

        const [usuarios] = await db.promise().query("SELECT id, nome, tipo_usuario FROM usuarios ORDER BY nome ASC");
        const [bloqueios] = await db.promise().query("SELECT pasta_id, usuario_id FROM pastas_bloqueios");

        res.send(require('../views/downloadsView')(req, arquivos, pastas, pastaAtual, breadcrumbs, { page, totalPages, total }, usuarios, bloqueios));

    } catch (error) {
        console.error("[ERRO ROTA DOWNLOADS]:", error);
        res.status(500).send("Erro interno ao carregar a página de downloads.");
    }
});

// =======================================================
// TOGGLE DE BLOQUEIO DE PASTA
// =======================================================
router.post("/api/downloads/pasta/bloqueio", async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ error: "Não autorizado" });
    
    const { pasta_id, usuario_id, bloqueado } = req.body;
    const currentUserId = req.session.user.id || 0;
    const isUserAdmin = req.session.user.tipo_usuario === 'admin';

    try {
        const [[pasta]] = await db.promise().query("SELECT criador_id FROM pastas_download WHERE id = ?", [pasta_id]);
        if (!pasta) return res.status(404).json({ error: "Pasta não encontrada." });

        if (!isUserAdmin && pasta.criador_id !== currentUserId) {
            return res.status(403).json({ error: "Sem permissão para alterar bloqueios desta pasta." });
        }

        if (bloqueado) {
            await db.promise().query("INSERT IGNORE INTO pastas_bloqueios (pasta_id, usuario_id) VALUES (?, ?)", [pasta_id, usuario_id]);
        } else {
            await db.promise().query("DELETE FROM pastas_bloqueios WHERE pasta_id = ? AND usuario_id = ?", [pasta_id, usuario_id]);
        }

        res.json({ success: true });
    } catch (error) {
        console.error("[ERRO BLOQUEIO PASTA]:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// =======================================================
// CRIAR NOVA PASTA
// =======================================================
router.post("/downloads/nova-pasta", async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");

    const nome = req.body.nome_pasta;
    const pastaId = req.body.pasta_id ? parseInt(req.body.pasta_id) : null;
    const criadorId = req.session.user.id || null;

    try {
        if (nome && nome.trim()) {
            await db.promise().query(
                "INSERT INTO pastas_download (nome, pasta_id, criador_id) VALUES (?, ?, ?)",
                [nome.trim(), pastaId, criadorId]
            );
        }
        const redirectUrl = pastaId ? `/downloads?pasta=${pastaId}&sucesso=pasta_criada` : `/downloads?sucesso=pasta_criada`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error("[ERRO AO CRIAR PASTA]:", error);
        const errUrl = pastaId ? `/downloads?pasta=${pastaId}&erro=criar_pasta` : `/downloads?erro=criar_pasta`;
        res.redirect(errUrl);
    }
});

// =======================================================
// RENOMEAR PASTA
// =======================================================
router.post("/api/downloads/pasta/renomear", async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ error: "Não autorizado" });
    const { id, novo_nome } = req.body;

    if (!novo_nome || !novo_nome.trim()) return res.status(400).json({ error: "O nome não pode estar vazio." });

    try {
        await db.promise().query("UPDATE pastas_download SET nome = ? WHERE id = ?", [novo_nome.trim(), id]);
        res.json({ success: true });
    } catch (error) {
        console.error("[ERRO AO RENOMEAR PASTA]:", error);
        res.status(500).json({ error: "Erro ao renomear a pasta no servidor." });
    }
});

// =======================================================
// RENOMEAR ARQUIVO
// =======================================================
router.post("/api/downloads/arquivo/renomear", async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ error: "Não autorizado" });
    const { id, novo_nome } = req.body;

    if (!novo_nome || !novo_nome.trim()) return res.status(400).json({ error: "O nome não pode estar vazio." });

    try {
        await db.promise().query("UPDATE arquivos_download SET nome_original = ? WHERE id = ?", [novo_nome.trim(), id]);
        res.json({ success: true });
    } catch (error) {
        console.error("[ERRO AO RENOMEAR ARQUIVO]:", error);
        res.status(500).json({ error: "Erro ao renomear o arquivo no servidor." });
    }
});

// =======================================================
// MOVER ARQUIVO OU PASTA (DRAG AND DROP)
// =======================================================
router.post("/api/downloads/mover", async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ error: "Não autorizado" });
    
    let { item_id, tipo, destino_id } = req.body;
    if (destino_id === 'null' || !destino_id) destino_id = null;

    try {
        if (tipo === 'arquivo') {
            await db.promise().query("UPDATE arquivos_download SET pasta_id = ? WHERE id = ?", [destino_id, item_id]);
        } else if (tipo === 'pasta') {
            if (item_id == destino_id) {
                return res.status(400).json({ error: "Você não pode mover a pasta para dentro de si mesma." });
            }
            await db.promise().query("UPDATE pastas_download SET pasta_id = ? WHERE id = ?", [destino_id, item_id]);
        }
        res.json({ success: true });
    } catch (error) {
        console.error("[ERRO AO MOVER ITEM]:", error);
        res.status(500).json({ error: "Falha ao mover item no servidor." });
    }
});

// =======================================================
// EXCLUIR PASTA (RECURSIVO)
// =======================================================
async function apagarFicheirosPastaFisicos(pastaId) {
    const [arquivos] = await db.promise().query("SELECT nome_salvo FROM arquivos_download WHERE pasta_id = ?", [pastaId]);
    for (let arq of arquivos) {
        const filePath = path.join(__dirname, "..", "uploads", "downloads", arq.nome_salvo);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    const [subpastas] = await db.promise().query("SELECT id FROM pastas_download WHERE pasta_id = ?", [pastaId]);
    for (let sub of subpastas) {
        await apagarFicheirosPastaFisicos(sub.id);
    }
}

router.post("/downloads/excluir-pasta/:id", async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");
    const { id } = req.params;
    const pastaPai = req.body.pasta_pai ? parseInt(req.body.pasta_pai) : null;

    try {
        await apagarFicheirosPastaFisicos(id);
        await db.promise().query("DELETE FROM pastas_download WHERE id = ?", [id]);
        
        const redirectUrl = pastaPai ? `/downloads?pasta=${pastaPai}&sucesso=pasta_excluida` : `/downloads?sucesso=pasta_excluida`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error("[ERRO AO EXCLUIR PASTA]:", error);
        const errUrl = pastaPai ? `/downloads?pasta=${pastaPai}&erro=excluir` : `/downloads?erro=excluir`;
        res.redirect(errUrl);
    }
});

// =======================================================
// ENVIAR ARQUIVO (CREATE)
// =======================================================
router.post("/downloads/novo", uploadDownloads.single('arquivo'), async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");

    const pastaId = req.body.pasta_id ? parseInt(req.body.pasta_id) : null;

    try {
        if (!req.file) {
            const errNoFile = pastaId ? `/downloads?pasta=${pastaId}&erro=nofile` : `/downloads?erro=nofile`;
            return res.redirect(errNoFile);
        }

        const nomeOriginal = req.file.originalname;
        const nomeSalvo = req.file.filename;
        const tamanho = req.file.size;
        const extensao = path.extname(nomeOriginal).toLowerCase().replace('.', '');
        const responsavel = req.session.user.nome || "Usuário";

        await db.promise().query(
            "INSERT INTO arquivos_download (nome_original, nome_salvo, extensao, tamanho, responsavel, pasta_id) VALUES (?, ?, ?, ?, ?, ?)",
            [nomeOriginal, nomeSalvo, extensao, tamanho, responsavel, pastaId]
        );

        const redirectUrl = pastaId ? `/downloads?pasta=${pastaId}&sucesso=upload` : `/downloads?sucesso=upload`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error("[ERRO AO FAZER UPLOAD]:", error);
        const errUrl = pastaId ? `/downloads?pasta=${pastaId}&erro=upload` : `/downloads?erro=upload`;
        res.redirect(errUrl);
    }
});

// =======================================================
// EXCLUIR ARQUIVO (DELETE)
// =======================================================
router.post("/downloads/excluir/:id", async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");
    const { id } = req.params;
    const pastaId = req.body.pasta_id ? parseInt(req.body.pasta_id) : null;

    try {
        const [[arquivo]] = await db.promise().query("SELECT nome_salvo FROM arquivos_download WHERE id = ?", [id]);
        
        if (arquivo) {
            await db.promise().query("DELETE FROM arquivos_download WHERE id = ?", [id]);
            const filePath = path.join(__dirname, "..", "uploads", "downloads", arquivo.nome_salvo);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        const redirectUrl = pastaId ? `/downloads?pasta=${pastaId}&sucesso=excluido` : `/downloads?sucesso=excluido`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error("[ERRO AO EXCLUIR ARQUIVO]:", error);
        const errUrl = pastaId ? `/downloads?pasta=${pastaId}&erro=excluir` : `/downloads?erro=excluir`;
        res.redirect(errUrl);
    }
});

// =======================================================
// FORÇAR DOWNLOAD DO ARQUIVO
// =======================================================
router.get("/downloads/baixar/:id", async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");
    const { id } = req.params;

    try {
        const [[arquivo]] = await db.promise().query("SELECT nome_original, nome_salvo FROM arquivos_download WHERE id = ?", [id]);
        if (!arquivo) return res.status(404).send("Arquivo não encontrado.");

        const filePath = path.join(__dirname, "..", "uploads", "downloads", arquivo.nome_salvo);
        if (!fs.existsSync(filePath)) return res.status(404).send("O arquivo físico não existe mais no servidor.");

        res.download(filePath, arquivo.nome_original);
    } catch (error) {
        console.error("[ERRO AO BAIXAR ARQUIVO]:", error);
        res.status(500).send("Erro ao processar o download.");
    }
});

module.exports = router;