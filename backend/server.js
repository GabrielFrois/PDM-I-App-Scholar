require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const routes  = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
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
  console.log(`>> Rotas disponíveis:`);
  console.log(`   POST /api/login`);
  console.log(`   POST /api/alunos`);
  console.log(`   POST /api/professores`);
  console.log(`   POST /api/disciplinas`);
  console.log(`   GET  /api/boletim/:matricula`);
});