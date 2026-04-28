const pool = require('../database/db');

async function cadastrar(req, res) {
  const { nomeDisciplina, cargaHoraria, professorResponsavel, curso, semestre } = req.body;

  if (!nomeDisciplina || !cargaHoraria || !curso || !semestre) {
    return res.status(400).json({ erro: 'Nome, carga horária, curso e semestre são obrigatórios.' });
  }

  try {
    // Busca o professor pelo nome
    let professorId = null;
    if (professorResponsavel) {
      const prof = await pool.query(
        'SELECT id FROM professores WHERE nome ILIKE $1 LIMIT 1',
        [`%${professorResponsavel}%`]
      );
      if (prof.rows.length > 0) {
        professorId = prof.rows[0].id;
      }
    }

    const result = await pool.query(
      `INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, carga_horaria, curso, semestre`,
      [nomeDisciplina, parseInt(cargaHoraria), professorId, curso, semestre]
    );

    return res.status(201).json({
      mensagem: 'Disciplina cadastrada com sucesso!',
      disciplina: result.rows[0],
    });
  } catch (err) {
    console.error('[disciplinas.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

async function listar(req, res) {
  try {
    const result = await pool.query(
      `SELECT d.id, d.nome, d.carga_horaria, d.curso, d.semestre, p.nome AS professor
       FROM disciplinas d
       LEFT JOIN professores p ON p.id = d.professor_id
       ORDER BY d.nome`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[disciplinas.listar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar };