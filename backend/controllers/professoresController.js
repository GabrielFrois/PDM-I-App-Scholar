const pool = require('../database/db');

async function cadastrar(req, res) {
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

module.exports = { cadastrar, listar };