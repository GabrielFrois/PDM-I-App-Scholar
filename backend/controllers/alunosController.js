// Regras de acesso (definidas nas rotas):
//   - cadastrar / remover: somente admin
//   - listar: admin, professor e aluno
//   - atualizar: admin (qualquer aluno) ou o próprio aluno (controlado aqui pelo e-mail do token)

const bcrypt = require('bcrypt');
const pool   = require('../database/db');
const Aluno  = require('../models/Aluno');

async function cadastrar(req, res) {
  const { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado, senha } = req.body;

  if (!nome || !matricula || !curso || !email) {
    return res.status(400).json({ erro: 'Nome, matrícula, curso e e-mail são obrigatórios.' });
  }

  if (!senha || senha.trim().length < 6) {
    return res.status(400).json({ erro: 'Informe uma senha inicial com pelo menos 6 caracteres.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const aluno = await Aluno.criar({ nome, matricula, curso, email, telefone, cep, endereco, cidade, estado });

    const senhaHash = await bcrypt.hash(senha, 10);
    // ON CONFLICT DO NOTHING: se o e-mail já existe em `usuarios` (ex: re-cadastro),
    // apenas ignora; a constraint UNIQUE em alunos já vai gerar 409 antes disso
    await client.query(
      `INSERT INTO usuarios (email, senha_hash, perfil) VALUES ($1, $2, 'aluno')
       ON CONFLICT (email) DO NOTHING`,
      [email, senhaHash]
    );

    await client.query('COMMIT');
    return res.status(201).json({ mensagem: 'Aluno cadastrado com sucesso!', aluno });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Matrícula ou e-mail já cadastrado.' });
    }
    console.error('[alunos.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
}

// GET /api/alunos?email=x  -> busca um aluno específico por e-mail (usado em CadastroAlunoScreen para auto-preencher)
// GET /api/alunos?pagina=1&limite=20 -> lista paginada
async function listar(req, res) {
  const { email } = req.query;

  if (email) {
    try {
      const aluno = await Aluno.buscarPorEmail(email);
      return res.json(aluno ?? null);
    } catch (err) {
      console.error('[alunos.listar email]', err.message);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));

  try {
    const resultado = await Aluno.listar({ pagina, limite });
    return res.json(resultado);
  } catch (err) {
    console.error('[alunos.listar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { perfil, email: emailToken } = req.usuario;

  try {
    const existente = await Aluno.buscarPorId(id);
    if (!existente) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    if (perfil === 'aluno' && existente.email !== emailToken) {
      return res.status(403).json({ erro: 'Você só pode editar o próprio cadastro.' });
    }

    const { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado } = req.body;

    if (!nome || !matricula || !curso || !email) {
      return res.status(400).json({ erro: 'Nome, matrícula, curso e e-mail são obrigatórios.' });
    }

    const aluno = await Aluno.atualizar(id, { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado });
    return res.json({ mensagem: 'Dados atualizados com sucesso!', aluno });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Matrícula ou e-mail já cadastrado.' });
    }
    console.error('[alunos.atualizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

async function remover(req, res) {
  const { id } = req.params;

  try {
    const aluno = await Aluno.remover(id);
    if (!aluno) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }
    return res.json({ mensagem: 'Aluno removido com sucesso.', aluno });
  } catch (err) {
    console.error('[alunos.remover]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar, atualizar, remover };