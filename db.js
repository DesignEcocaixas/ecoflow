// db.js
const mysql = require("mysql2");

// Cria um pool de conexões (em vez de uma única conexão)
const pool = mysql.createPool({
  host: "localhost",
  user: "appuser",
  password: "23!Bestdavidx",
  database: "sistema_gestao",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error("Erro ao conectar ao MySQL (pool):", err);
  } else {
    console.log("Pool MySQL pronto!");
    conn.release();
  }
});

module.exports = pool;

// db.js
/* const mysql = require("mysql2");
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "sistema_gestao",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error("Erro ao conectar ao MySQL (pool):", err);
  } else {
    console.log("Pool MySQL pronto!");
    conn.release();
  }
});

module.exports = pool; */