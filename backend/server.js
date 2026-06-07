// Carrega as variáveis do arquivo .env (DB_PASSWORD, JWT_SECRET, PORT etc.)
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const routes  = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 3000;

// Origens explicitamente permitidas
const origensPermitidas = [
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  /^http:\/\/(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: curl, Postman, apps nativos)
    if (!origin) return callback(null, true);
    const permitido = origensPermitidas.some((regex) => regex.test(origin));
    callback(permitido ? null : new Error('CORS bloqueado'), permitido);
  },
  credentials: true,
}));

// Permite que o Express leia o corpo das requisições em formato JSON
app.use(express.json());

// Todas as rotas da API ficam sob o prefixo /api
app.use('/api', routes);

// Rota raiz apenas para verificar se o servidor está no ar
app.get('/', (req, res) => {
  res.json({ status: 'ok', mensagem: 'App Scholar API rodando!' });
});

// Middleware final: captura qualquer rota não definida e retorna 404
app.use((req, res) => {
  res.status(404).json({ erro: `Rota ${req.method} ${req.path} não encontrada.` });
});

// Inicia o servidor na porta definida
app.listen(PORT, () => {
  console.log(`>>> Servidor rodando em http://localhost:${PORT}`);
});