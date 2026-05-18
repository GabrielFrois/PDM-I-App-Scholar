const pool = require('../database/db');

async function cadastrar(req, res) {
  // Somente admin pode cadastrar alunos
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

/**
 * PUT /api/alunos/:id
 * Admin: pode atualizar qualquer aluno.
 * Aluno: só pode atualizar o próprio registro (verifica pelo email do token).
 */
async function atualizar(req, res) {
  const { id } = req.params;
  const { perfil, email: emailToken } = req.usuario;

  try {
    const existente = await pool.query('SELECT * FROM alunos WHERE id = $1', [id]);
    if (existente.rows.length === 0) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    if (perfil === 'aluno' && existente.rows[0].email !== emailToken) {
      return res.status(403).json({ erro: 'Você só pode editar o próprio cadastro.' });
    }

    const { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado } = req.body;

    if (!nome || !matricula || !curso || !email) {
      return res.status(400).json({ erro: 'Nome, matrícula, curso e e-mail são obrigatórios.' });
    }

    const result = await pool.query(
      `UPDATE alunos
          SET nome = $1, matricula = $2, curso = $3, email = $4,
              telefone = $5, cep = $6, endereco = $7, cidade = $8, estado = $9
        WHERE id = $10
       RETURNING id, nome, matricula, curso, email`,
      [nome, matricula, curso, email, telefone, cep, endereco, cidade, estado, id]
    );

    return res.json({
      mensagem: 'Dados atualizados com sucesso!',
      aluno: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Matrícula ou e-mail já cadastrado.' });
    }
    console.error('[alunos.atualizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar, atualizar };