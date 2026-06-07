// Camada de acesso ao banco para a tabela `notas`
// Cada registro de nota pertence a um par (aluno_id, disciplina_id) e armazena nota1, nota2 e as colunas geradas automaticamente media e situacao

const pool = require('../database/db');

const Nota = {

  // Retorna todos os alunos matriculados em uma disciplina com suas notas (se já lançadas)
  // LEFT JOIN em notas: alunos sem nota ainda aparecem com nota1/nota2/media/situacao = null
  // Usado na tela de Lançamento de Notas do professor
  async listarPorDisciplina(disciplinaId) {
    const result = await pool.query(
      `SELECT
         a.id        AS aluno_id,
         a.nome      AS aluno,
         a.matricula,
         n.id,
         n.nota1,
         n.nota2,
         n.media,
         n.situacao
       FROM matriculas m
       JOIN alunos a ON a.id = m.aluno_id AND a.deleted_at IS NULL
       LEFT JOIN notas n ON n.aluno_id = a.id AND n.disciplina_id = m.disciplina_id
       WHERE m.disciplina_id = $1
       ORDER BY a.nome`,
      [disciplinaId]
    );
    return result.rows;
  },

  // Retorna todas as disciplinas em que o aluno está matriculado, com suas notas (se lançadas)
  // Usado no boletim acadêmico.
  async listarPorAluno(alunoId) {
    const result = await pool.query(
      `SELECT
         n.id,
         d.nome      AS disciplina,
         d.semestre,
         n.nota1,
         n.nota2,
         n.media,
         n.situacao
       FROM matriculas m
       JOIN disciplinas d ON d.id = m.disciplina_id AND d.deleted_at IS NULL
       LEFT JOIN notas n ON n.aluno_id = m.aluno_id AND n.disciplina_id = m.disciplina_id
       WHERE m.aluno_id = $1
       ORDER BY d.semestre, d.nome`,
      [alunoId]
    );
    return result.rows;
  },

  // Insere ou atualiza as notas de um aluno em uma disciplina.
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