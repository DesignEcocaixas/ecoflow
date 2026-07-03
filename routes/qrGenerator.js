const express = require("express");
const router = express.Router();
const db = require("../db");
const QRCode = require("qrcode");
const { isLogged } = require("../middlewares/authMiddleware");

const qrGeneratorView = require("../views/qrGeneratorView");

// Função auxiliar para gerar SVG em Base64 Data URL
async function gerarSvgBase64(link, cor, correcao = "H") {
    try {
        const svgString = await QRCode.toString(link, {
            type: "svg",
            width: 200,
            margin: 1,
            errorCorrectionLevel: correcao,
            color: {
                dark: cor || "#000000",
                light: "#FFFFFF"
            }
        });
        return `data:image/svg+xml;base64,${Buffer.from(svgString).toString("base64")}`;
    } catch (e) {
        console.error("Erro na geração do SVG:", e);
        return "";
    }
}

// 1. ROTA PRINCIPAL: LISTAR E GERAR SVG NO BACK-END
router.get("/qr-generator", isLogged, (req, res) => {
    const query = "SELECT * FROM qr_codes ORDER BY criado_em DESC";

    db.query(query, async (err, qrCodes) => {
        if (err) {
            console.error("Erro ao listar QR Codes:", err);
            return res.status(500).send("Erro interno ao carregar o gerador de QR Codes.");
        }

        const lista = qrCodes || [];

        const listaComImagens = await Promise.all(
            lista.map(async (item) => {
                const base64Svg = await gerarSvgBase64(item.link, item.cor);
                return { ...item, imagemBase64: base64Svg };
            })
        );

        res.send(qrGeneratorView(req.session.user, listaComImagens));
    });
});

// 2. ROTA API PARA O PREVIEW EM TEMPO REAL NO MODAL
router.post("/qr-generator/preview", isLogged, async (req, res) => {
    const { link, cor, correcao } = req.body;
    if (!link) return res.json({ success: false });

    try {
        const base64Svg = await gerarSvgBase64(link.trim(), cor, correcao);
        res.json({ success: true, image: base64Svg });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erro ao gerar preview" });
    }
});

// 3. ROTA DE CRIAÇÃO: SALVAR NOVO QR CODE
router.post("/qr-generator/novo", isLogged, (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Não autorizado" });

    const { titulo, link, cor } = req.body;

    if (!titulo || !link) {
        return res.status(400).json({ success: false, message: "Título e link são obrigatórios." });
    }

    const corFinal = cor || "#000000";
    const query = "INSERT INTO qr_codes (titulo, link, cor) VALUES (?, ?, ?)";

    db.query(query, [titulo.trim(), link.trim(), corFinal], async (err, result) => {
        if (err) {
            console.error("Erro ao criar QR Code:", err);
            return res.status(500).json({ success: false, message: "Erro ao salvar no banco de dados." });
        }

        const base64Svg = await gerarSvgBase64(link.trim(), corFinal);

        const novoQRCode = {
            id: result.insertId,
            titulo: titulo.trim(),
            link: link.trim(),
            cor: corFinal,
            imagemBase64: base64Svg,
            criado_em: new Date().toISOString()
        };

        if (req.headers["content-type"] && req.headers["content-type"].includes("application/json")) {
            return res.json({ success: true, qrCode: novoQRCode });
        }

        res.redirect("/qr-generator?sucesso=1");
    });
});

// 4. ROTA DE EXCLUSÃO
router.post("/qr-generator/excluir/:id", isLogged, (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Não autorizado" });

    db.query("DELETE FROM qr_codes WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

module.exports = router;