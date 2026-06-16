// Script executado uma única vez para criar as tabelas no banco

require('dotenv').config();

const { Client } = require('pg');
const fs   = require('fs');
const path = require('path');

if (!process.env.DB_PASSWORD) {
  throw new Error('Variável de ambiente DB_PASSWORD não definida. Configure o arquivo .env');
}

const client = new Client({
  host:     process.env.DB_HOST || 'localhost',
  port:     process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'appscholar',
  user:     process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  try {
    console.log('[migrate] Conectando ao PostgreSQL...');
    await client.connect();

    console.log('[migrate] Lendo schema.sql...');
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    console.log('[migrate] Executando migrations...');
    await client.query(sql);

    console.log('[migrate] Concluído com sucesso!');
    console.log('[migrate] Tabelas criadas: usuarios, professores, cursos, alunos, disciplinas, matriculas, notas');
  } catch (err) {
    console.error('[migrate] Erro:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();