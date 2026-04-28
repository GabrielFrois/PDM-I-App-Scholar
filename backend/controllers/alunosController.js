const pool = require('../database/db');

async function cadastrar(req, res) {
  const { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado } = req.body;

  if (!nome || !matricula || !curso || !email) {
    return res.status(400).json({ erro: 'Nome, matrícula, curso e e-mail são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO alunos (nome, matricula, curso, email, telefone, cep, endereco, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, nome, matricula, curso, email`,
      [nome, matricula, curso, email, telefone, cep, endereco, cidade, estado]
    );

    return res.status(201).json({
      mensagem: 'Aluno cadastrado com sucesso!',
      aluno: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Matrícula ou e-mail já cadastrado.' });
    }
    console.error('[alunos.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

async function listar(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, nome, matricula, curso, email, cidade, estado FROM alunos ORDER BY nome'
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[alunos.listar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar };