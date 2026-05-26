const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DB_PASSWORD) {
  throw new Error('Variável de ambiente DB_PASSWORD não definida. Configure o arquivo .env');
}

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'appscholar',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('>> Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('>> Erro na conexão com o banco:', err.message);
});

module.exports = pool;