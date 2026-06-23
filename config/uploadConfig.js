const path = require("path");
const fs = require("fs");
const multer = require("multer");

const criarStorage = (subPasta) => multer.diskStorage({
    destination: (req, file, cb) => {
        // O ".." foi adicionado aqui para forçar o Node a sair da pasta /config e ir para a raiz
        const dir = subPasta ? path.join(__dirname, "..", "uploads", subPasta) : path.join(__dirname, "..", "uploads");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // 1. TENTA CAPTURAR O ID AUTOMATICAMENTE
        // Procura na URL (req.params.id) ou no formulário (req.body.id)
        let objectId = req.params.id || req.body.id;

        // Se o parâmetro tiver outro nome (ex: /veiculos/:veiculoId), pega o primeiro número que achar na URL
        if (!objectId) {
            const paramValues = Object.values(req.params);
            const numVal = paramValues.find(v => !isNaN(v));
            if (numVal) objectId = numVal;
        }

        const prefixo = objectId ? `id_${objectId}` : "misc";

        const ts = Date.now();
        const ext = path.extname(file.originalname);
        let base = path.basename(file.originalname, ext);
        base = base.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

        cb(null, `${prefixo}_${base}_${ts}${ext}`);
    }
});

const upload = multer({ storage: criarStorage("") });
const uploadKanban = multer({ storage: criarStorage("kanban") });
const uploadUsuarios = multer({ storage: criarStorage("usuarios/perfil") });
const uploadPagamentos = multer({ storage: criarStorage("financeiro/pagamentos") });
const uploadDiaristas = multer({ storage: criarStorage("financeiro/diaristas") });
const uploadProducao = multer({ storage: criarStorage("producao/importacoes") });
const uploadChecklist = multer({ storage: criarStorage("veiculos/checklists") });
const uploadVeiculosManutencao = multer({ storage: criarStorage("veiculos/manutencao") });
const uploadGabaritos = multer({ storage: criarStorage("gabaritos") });
const uploadVeiculosFotos = multer({ storage: criarStorage("veiculos/fotos") });
const uploadWorkspaces = multer({ storage: criarStorage("workspaces") });
const uploadMensagens = multer({ storage: criarStorage("mensagensSistema") });

module.exports = {
    upload,
    uploadKanban,
    uploadUsuarios,
    uploadPagamentos,
    uploadDiaristas,
    uploadProducao,
    uploadChecklist,
    uploadVeiculosManutencao,
    uploadGabaritos,
    uploadVeiculosFotos,
    uploadWorkspaces,
    uploadMensagens
};