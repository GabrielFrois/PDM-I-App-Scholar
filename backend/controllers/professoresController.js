const pool = require('../database/db');

async function cadastrar(req, res) {
  // Somente admin pode cadastrar professores (enforced na rota)
  const { nome, titulacao, areaAtuacao, tempoDocencia, email } = req.body;

  if (!nome || !titulacao || !areaAtuacao || !email) {
    return res.status(400).json({ erro: 'Nome, titulação, área e e-mail são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO professores (nome, titulacao, area, tempo_docencia, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, titulacao, area, email`,
      [nome, titulacao, areaAtuacao, parseInt(tempoDocencia) || 0, email]
    );

    return res.status(201).json({
      mensagem: 'Professor cadastrado com sucesso!',
      professor: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }
    console.error('[professores.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

async function listar(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, nome, titulacao, area, tempo_docencia, email FROM professores ORDER BY nome'
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[professores.listar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

/**
 * PUT /api/professores/:id
 * Admin: pode atualizar qualquer professor.
 * Professor: só pode atualizar o próprio registro (verifica pelo email do token).
 */
async function atualizar(req, res) {
  const { id } = req.params;
  const { perfil, email: emailToken } = req.usuario;

  try {
    const existente = await pool.query('SELECT * FROM professores WHERE id = $1', [id]);
    if (existente.rows.length === 0) {
      return res.status(404).json({ erro: 'Professor não encontrado.' });
    }

    if (perfil === 'professor' && existente.rows[0].email !== emailToken) {
      return res.status(403).json({ erro: 'Você só pode editar o próprio cadastro.' });
    }

    const { nome, titulacao, areaAtuacao, tempoDocencia, email } = req.body;

    if (!nome || !titulacao || !areaAtuacao || !email) {
      return res.status(400).json({ erro: 'Nome, titulação, área e e-mail são obrigatórios.' });
    }

    const result = await pool.query(
      `UPDATE professores
          SET nome = $1, titulacao = $2, area = $3, tempo_docencia = $4, email = $5
        WHERE id = $6
       RETURNING id, nome, titulacao, area, tempo_docencia, email`,
      [nome, titulacao, areaAtuacao, parseInt(tempoDocencia) || 0, email, id]
    );

    return res.json({
      mensagem: 'Dados atualizados com sucesso!',
      professor: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }
    console.error('[professores.atualizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar, atualizar };