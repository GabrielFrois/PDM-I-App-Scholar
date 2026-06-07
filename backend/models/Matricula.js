// Camada de acesso ao banco para a tabela `matriculas`
// Relacionamento N:N entre alunos e disciplinas
// ON CONFLICT é usado no INSERT para evitar duplicatas sem lançar erro

const pool = require('../database/db');

const Matricula = {
  // Matricula um aluno em uma disciplina
  // Retorna null se a matrícula já existir (conflito silencioso)
  async matricular(alunoId, disciplinaId) {
    const result = await pool.query(
      `INSERT INTO matriculas (aluno_id, disciplina_id)
       VALUES ($1, $2)
       ON CONFLICT (aluno_id, disciplina_id) DO NOTHING
       RETURNING id, aluno_id, disciplina_id`,
      [alunoId, disciplinaId]
    );
    return result.rows[0] ?? null;
  },

  // Remove a matrícula de um aluno em uma disciplina
  // Retorna o registro removido ou null se não existia
  async desmatricular(alunoId, disciplinaId) {
    const result = await pool.query(
      `DELETE FROM matriculas
       WHERE aluno_id = $1 AND disciplina_id = $2
       RETURNING id`,
      [alunoId, disciplinaId]
    );
    return result.rows[0] ?? null;
  },

  // Lista todas as disciplinas em que um aluno está matriculado
  async listarPorAluno(alunoId) {
    const result = await pool.query(
      `SELECT
         d.id,
         d.nome,
         d.semestre,
         d.carga_horaria,
         d.curso,
         p.nome AS professor
       FROM matriculas m
       JOIN disciplinas d ON d.id = m.disciplina_id AND d.deleted_at IS NULL
       LEFT JOIN professores p ON p.id = d.professor_id
       WHERE m.aluno_id = $1
       ORDER BY d.semestre, d.nome`,
      [alunoId]
    );
    return result.rows;
  },

  // Lista todos os alunos matriculados em uma disciplina
  async listarPorDisciplina(disciplinaId) {
    const result = await pool.query(
      `SELECT
         a.id,
         a.nome,
         a.matricula
       FROM matriculas m
       JOIN alunos a ON a.id = m.aluno_id AND a.deleted_at IS NULL
       WHERE m.disciplina_id = $1
       ORDER BY a.nome`,
      [disciplinaId]
    );
    return result.rows;
  },

  // Retorna os ids de disciplinas em que o aluno está matriculado
  // Usado para pré-marcar os checkboxes na tela de matrícula
  async idsDisiplinasPorAluno(alunoId) {
    const result = await pool.query(
      'SELECT disciplina_id FROM matriculas WHERE aluno_id = $1',
      [alunoId]
    );
    return result.rows.map(r => r.disciplina_id);
  },
};

module.exports = Matricula;