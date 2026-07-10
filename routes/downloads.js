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
        // Caminho seguro para a pasta de uploads/downloads
        const dir = path.join(__dirname, "..", "uploads", "downloads");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Gera um nome único mantendo a extensão original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'ecocaixas-' + uniqueSuffix + ext);
    }
});

const uploadParams = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Limite de 50MB por ficheiro (ajuste se necessário)
});

// =======================================================
// LISTAR ARQUIVOS (READ)
// =======================================================
router.get("/downloads", async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");

    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = 12;
        const offset = (page - 1) * limit;

        const countQuery = "SELECT COUNT(*) AS total FROM arquivos_download";
        const [countResult] = await db.promise().query(countQuery);
        const total = countResult[0].total;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        const [arquivos] = await db.promise().query(`
            SELECT * FROM arquivos_download 
            ORDER BY data_upload DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Manda os dados para a View
        res.send(require('../views/downloadsView')(req, arquivos, { page, totalPages, total }));

    } catch (error) {
        console.error("[ERRO ROTA DOWNLOADS]:", error);
        res.status(500).send("Erro interno ao carregar a página de downloads.");
    }
});

// =======================================================
// ENVIAR ARQUIVO (CREATE)
// =======================================================
router.post("/downloads/novo", uploadDownloads.single('arquivo'), async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");

    try {
        if (!req.file) {
            return res.redirect("/downloads?erro=nofile");
        }

        const nomeOriginal = req.file.originalname;
        const nomeSalvo = req.file.filename;
        const tamanho = req.file.size;
        const extensao = path.extname(nomeOriginal).toLowerCase().replace('.', '');
        const responsavel = req.session.user.nome || "Usuário";

        await db.promise().query(
            "INSERT INTO arquivos_download (nome_original, nome_salvo, extensao, tamanho, responsavel) VALUES (?, ?, ?, ?, ?)",
            [nomeOriginal, nomeSalvo, extensao, tamanho, responsavel]
        );

        res.redirect("/downloads?sucesso=upload");
    } catch (error) {
        console.error("[ERRO AO FAZER UPLOAD]:", error);
        res.redirect("/downloads?erro=upload");
    }
});

// =======================================================
// EXCLUIR ARQUIVO (DELETE)
// =======================================================
router.post("/downloads/excluir/:id", async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");
    const { id } = req.params;

    try {
        const [[arquivo]] = await db.promise().query("SELECT nome_salvo FROM arquivos_download WHERE id = ?", [id]);
        
        if (arquivo) {
            // Apaga do banco de dados
            await db.promise().query("DELETE FROM arquivos_download WHERE id = ?", [id]);
            
            // Apaga o ficheiro físico do servidor
            const filePath = path.join(__dirname, "..", "uploads", "downloads", arquivo.nome_salvo);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.redirect("/downloads?sucesso=excluido");
    } catch (error) {
        console.error("[ERRO AO EXCLUIR ARQUIVO]:", error);
        res.redirect("/downloads?erro=excluir");
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
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).send("O arquivo físico não existe mais no servidor.");
        }

        // Força o navegador a baixar o arquivo com o nome original
        res.download(filePath, arquivo.nome_original);
    } catch (error) {
        console.error("[ERRO AO BAIXAR ARQUIVO]:", error);
        res.status(500).send("Erro ao processar o download.");
    }
});

module.exports = router;