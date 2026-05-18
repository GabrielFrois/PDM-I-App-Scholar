require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const routes  = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
// Aceita requisições de localhost e de qualquer IP local (ex: 192.168.x.x)
// usado quando o Expo roda em dispositivo físico na mesma rede
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // ferramentas como curl/Postman
    const local = /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);
    callback(local ? null : new Error('CORS bloqueado'), local);
  },
  credentials: true,
}));
app.use(express.json());

// Rotas
app.use('/api', routes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', mensagem: 'App Scholar API rodando!' });
});

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ erro: `Rota ${req.method} ${req.path} não encontrada.` });
});

// Inicializa o servidor 
app.listen(PORT, () => {
  console.log(`>>> Servidor rodando em http://localhost:${PORT}`);
});