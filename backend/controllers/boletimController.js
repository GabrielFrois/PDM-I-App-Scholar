const pool = require('../database/db');

async function buscarPorMatricula(req, res) {
  const { matricula } = req.params;

  try {
    // Busca o aluno
    const alunoResult = await pool.query(
      'SELECT id, nome, matricula, curso FROM alunos WHERE matricula = $1',
      [matricula]
    );

    if (alunoResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    const aluno = alunoResult.rows[0];

    // Busca as notas com nome da disciplina
    const notasResult = await pool.query(
      `SELECT
         n.id,
         d.nome  AS disciplina,
         n.nota1,
         n.nota2,
         n.media,
         n.situacao
       FROM notas n
       JOIN disciplinas d ON d.id = n.disciplina_id
       WHERE n.aluno_id = $1
       ORDER BY d.nome`,
      [aluno.id]
    );

    return res.json({
      aluno: aluno.nome,
      matricula: aluno.matricula,
      curso: aluno.curso,
      disciplinas: notasResult.rows,
    });
  } catch (err) {
    console.error('[boletim.buscarPorMatricula]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { buscarPorMatricula };