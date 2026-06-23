const mysql = require("mysql2");

// Cria um pool de conexões (em vez de uma única conexão)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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