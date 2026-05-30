const pool = require('../database/db');

const Nota = {
  async listarPorDisciplina(disciplinaId) {
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
    return result.rows;
  },

  async listarPorAluno(alunoId) {
    const result = await pool.query(
      `SELECT
         n.id,
         d.nome AS disciplina,
         n.nota1,
         n.nota2,
         n.media,
         n.situacao
       FROM notas n
       JOIN disciplinas d ON d.id = n.disciplina_id AND d.deleted_at IS NULL
       WHERE n.aluno_id = $1
       ORDER BY d.nome`,
      [alunoId]
    );
    return result.rows;
  },

  async lancarOuAtualizar({ alunoId, disciplinaId, nota1, nota2 }) {
    const result = await pool.query(
      `INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (aluno_id, disciplina_id) DO UPDATE
         SET nota1 = COALESCE($3, notas.nota1),
             nota2 = COALESCE($4, notas.nota2)
       RETURNING id, nota1, nota2, media, situacao`,
      [alunoId, disciplinaId, nota1 ?? null, nota2 ?? null]
    );
    return result.rows[0];
  },
};

module.exports = Nota;