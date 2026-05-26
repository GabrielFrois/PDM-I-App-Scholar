const pool = require('../database/db');

/**
 * GET /api/boletim/:matricula
 * Admin e professor: acesso livre a qualquer boletim.
 * Aluno: só pode acessar o próprio boletim (matricula do token === matricula da rota).
 */
async function buscarPorMatricula(req, res) {
  const { matricula } = req.params;
  const { perfil, matricula: matriculaToken } = req.usuario;

  if (perfil === 'aluno' && matriculaToken !== matricula) {
    return res.status(403).json({ erro: 'Você só pode consultar o próprio boletim.' });
  }

  try {
    const alunoResult = await pool.query(
      'SELECT id, nome, matricula, curso FROM alunos WHERE matricula = $1',
      [matricula]
    );

    if (alunoResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    const aluno = alunoResult.rows[0];

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
      aluno:       aluno.nome,
      matricula:   aluno.matricula,
      curso:       aluno.curso,
      disciplinas: notasResult.rows,
    });
  } catch (err) {
    console.error('[boletim.buscarPorMatricula]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { buscarPorMatricula };