// app.js
const express = require("express");
// const bodyParser = require("body-parser");
// const session = require("express-session");
// const db = require("./db");
// const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
// const multer = require("multer");
// const loginView = require("./views/loginView");
// const homeView = require("./views/homeView");
// const cadastroView = require("./views/cadastroView");
// const tabelaPrecosView = require("./views/tabelaPrecosView");
// const checklistMotoristasView = require("./views/checklistMotoristasView");
// const veiculosView = require("./views/veiculosView");

const app = express();
const PORT = 3000;

// pasta de uploads pública (mantida porque é simples e não depende de db)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// rota de health check
app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
