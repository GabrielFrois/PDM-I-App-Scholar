// Mesma estrutura do alunosController, adaptada para professores

const Professor = require('../models/Professor');

// POST /api/professores - somente admin
async function cadastrar(req, res) {
  const { nome, titulacao, areaAtuacao, tempoDocencia, email } = req.body;

  if (!nome || !titulacao || !areaAtuacao || !email) {
    return res.status(400).json({ erro: 'Nome, titulação, área e e-mail são obrigatórios.' });
  }

  try {
    const professor = await Professor.criar({ nome, titulacao, areaAtuacao, tempoDocencia, email });
    return res.status(201).json({ mensagem: 'Professor cadastrado com sucesso!', professor });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }
    console.error('[professores.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// GET /api/professores
// Com ?email=... -> retorna um professor específico (usado pelo professor para carregar seus dados)
// Sem parâmetro -> listagem paginada
async function listar(req, res) {
  const { email } = req.query;

  if (email) {
    try {
      const professor = await Professor.buscarPorEmail(email);
      return res.json(professor ?? null);
    } catch (err) {
      console.error('[professores.listar email]', err.message);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));

  try {
    const resultado = await Professor.listar({ pagina, limite });
    return res.json(resultado);
  } catch (err) {
    console.error('[professores.listar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// PUT /api/professores/:id - admin ou o próprio professor
async function atualizar(req, res) {
  const { id } = req.params;
  const { perfil, email: emailToken } = req.usuario;

  try {
    const existente = await Professor.buscarPorId(id);
    if (!existente) {
      return res.status(404).json({ erro: 'Professor não encontrado.' });
    }

    // Professor só pode editar o próprio cadastro
    if (perfil === 'professor' && existente.email !== emailToken) {
      return res.status(403).json({ erro: 'Você só pode editar o próprio cadastro.' });
    }

    const { nome, titulacao, areaAtuacao, tempoDocencia, email } = req.body;

    if (!nome || !titulacao || !areaAtuacao || !email) {
      return res.status(400).json({ erro: 'Nome, titulação, área e e-mail são obrigatórios.' });
    }

    const professor = await Professor.atualizar(id, { nome, titulacao, areaAtuacao, tempoDocencia, email });
    return res.json({ mensagem: 'Dados atualizados com sucesso!', professor });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }
    console.error('[professores.atualizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// DELETE /api/professores/:id — somente admin (soft delete)
async function remover(req, res) {
  const { id } = req.params;

  try {
    const professor = await Professor.remover(id);
    if (!professor) {
      return res.status(404).json({ erro: 'Professor não encontrado.' });
    }
    return res.json({ mensagem: 'Professor removido com sucesso.', professor });
  } catch (err) {
    console.error('[professores.remover]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar, atualizar, remover };