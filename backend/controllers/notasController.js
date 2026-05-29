const pool = require('../database/db');

/**
 * GET /api/notas/disciplina/:disciplinaId
 * Professor: lista notas de uma disciplina que lhe pertence.
 * Admin: acesso irrestrito.
 */
async function listarPorDisciplina(req, res) {
  const { disciplinaId } = req.params;
  const { perfil, professorId } = req.usuario;

  try {
    // deleted_at IS NULL para ignorar disciplinas removidas
    const discResult = await pool.query(
      'SELECT id, nome, professor_id FROM disciplinas WHERE id = $1 AND deleted_at IS NULL',
      [disciplinaId]
    );

    if (discResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Disciplina não encontrada.' });
    }

    if (perfil === 'professor' && discResult.rows[0].professor_id !== professorId) {
      return res.status(403).json({ erro: 'Você só pode gerenciar notas das suas disciplinas.' });
    }

    const result = await pool.query(
      `SELECT
         n.id,
         a.id        AS aluno_id,
         a.nome      AS aluno,
         a.matricula,
         n.nota1,
         n.nota2,
         n.media,
         n.situacao
       FROM notas n
       JOIN alunos a ON a.id = n.aluno_id AND a.deleted_at IS NULL
       WHERE n.disciplina_id = $1
       ORDER BY a.nome`,
      [disciplinaId]
    );

    return res.json({
      disciplina: discResult.rows[0].nome,
      notas: result.rows,
    });
  } catch (err) {
    console.error('[notas.listarPorDisciplina]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

/**
 * PUT /api/notas
 * Lança ou atualiza notas de um aluno em uma disciplina.
 * Professor: só pode mexer em disciplinas onde é professor_id.
 * Admin: acesso irrestrito.
 *
 * Body: { alunoId, disciplinaId, nota1, nota2 }
 */
async function lancarOuAtualizar(req, res) {
  const { alunoId, disciplinaId, nota1, nota2 } = req.body;
  const { perfil, professorId } = req.usuario;

  if (alunoId == null || disciplinaId == null) {
    return res.status(400).json({ erro: 'alunoId e disciplinaId são obrigatórios.' });
  }

  if (nota1 == null && nota2 == null) {
    return res.status(400).json({ erro: 'Informe ao menos nota1 ou nota2.' });
  }

  if (nota1 != null && (isNaN(nota1) || nota1 < 0 || nota1 > 10)) {
    return res.status(400).json({ erro: 'nota1 deve estar entre 0 e 10.' });
  }
  if (nota2 != null && (isNaN(nota2) || nota2 < 0 || nota2 > 10)) {
    return res.status(400).json({ erro: 'nota2 deve estar entre 0 e 10.' });
  }

  try {
    // deleted_at IS NULL para bloquear notas em disciplinas removidas
    const discResult = await pool.query(
      'SELECT id, professor_id FROM disciplinas WHERE id = $1 AND deleted_at IS NULL',
      [disciplinaId]
    );

    if (discResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Disciplina não encontrada.' });
    }

    if (perfil === 'professor' && discResult.rows[0].professor_id !== professorId) {
      return res.status(403).json({ erro: 'Você só pode lançar notas nas suas disciplinas.' });
    }

    const alunoResult = await pool.query(
      'SELECT id FROM alunos WHERE id = $1 AND deleted_at IS NULL',
      [alunoId]
    );
    if (alunoResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    const result = await pool.query(
      `INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (aluno_id, disciplina_id) DO UPDATE
         SET nota1 = COALESCE($3, notas.nota1),
             nota2 = COALESCE($4, notas.nota2)
       RETURNING id, nota1, nota2, media, situacao`,
      [alunoId, disciplinaId, nota1 ?? null, nota2 ?? null]
    );

    return res.json({
      mensagem: 'Notas lançadas com sucesso!',
      nota: result.rows[0],
    });
  } catch (err) {
    console.error('[notas.lancarOuAtualizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { listarPorDisciplina, lancarOuAtualizar };