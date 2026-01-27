const { Pool } = require("pg");
require("dotenv").config();

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || "cloud.digitalrf.com.br",
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "drfpedido",
  user: process.env.DB_USER || "drfpedido",
  password: process.env.DB_PASSWORD || "A@gTY73AH6df",
});

// Testar conexão
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Erro ao conectar ao PostgreSQL:", err.stack);
  } else {
    console.log("✅ Conectado ao PostgreSQL com sucesso!");
    release();
  }
});

module.exports = pool;
