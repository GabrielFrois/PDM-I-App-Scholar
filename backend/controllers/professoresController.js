// Cadastro, listagem, edição e remoção (soft delete)
// Regras de acesso (definidas nas rotas):
//   - cadastrar / remover: somente admin
//   - listar: admin e professor
//   - atualizar: admin (qualquer professor) ou o próprio professor (controlado aqui pelo e-mail do token)

const bcrypt    = require('bcrypt');
const pool      = require('../database/db');
const Professor = require('../models/Professor');

async function cadastrar(req, res) {
  const { nome, titulacao, areaAtuacao, tempoDocencia, email, senha } = req.body;

  if (!nome || !titulacao || !areaAtuacao || !email) {
    return res.status(400).json({ erro: 'Nome, titulação, área e e-mail são obrigatórios.' });
  }

  if (!senha || senha.trim().length < 6) {
    return res.status(400).json({ erro: 'Informe uma senha inicial com pelo menos 6 caracteres.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const professor = await Professor.criar({ nome, titulacao, areaAtuacao, tempoDocencia, email });

    const senhaHash = await bcrypt.hash(senha, 10);
    await client.query(
      `INSERT INTO usuarios (email, senha_hash, perfil) VALUES ($1, $2, 'professor')
       ON CONFLICT (email) DO NOTHING`,
      [email, senhaHash]
    );

    await client.query('COMMIT');
    return res.status(201).json({ mensagem: 'Professor cadastrado com sucesso!', professor });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }
    console.error('[professores.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
}

// GET /api/professores?email=x -> busca um professor por e-mail (auto-preencher no cadastro)
// GET /api/professores?pagina=1&limite=20 -> lista paginada
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

async function atualizar(req, res) {
  const { id } = req.params;
  const { perfil, email: emailToken } = req.usuario;

  try {
    const existente = await Professor.buscarPorId(id);
    if (!existente) {
      return res.status(404).json({ erro: 'Professor não encontrado.' });
    }

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