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

// Teste opcional ao subir o servidor (não é obrigatório)
pool.getConnection((err, conn) => {
  if (err) {
    console.error("Erro ao conectar ao MySQL (pool):", err);
  } else {
    console.log("Pool MySQL pronto!");
    conn.release();
  }
});

// Exporta o pool: continua podendo usar db.query(sql, params, callback)
module.exports = pool;

/*  Se quiser usar async/await em algumas rotas:
    const promisePool = pool.promise();
    module.exports = { pool, promisePool };
*/
