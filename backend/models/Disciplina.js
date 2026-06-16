// Camada de acesso ao banco para a tabela disciplinas

const pool = require('../database/db');

const Disciplina = {

  // Insere uma disciplina; professorId e cursoId podem ser null
  async criar({ nomeDisciplina, cargaHoraria, professorId, cursoId, semestre }) {
    const result = await pool.query(
      `INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso_id, semestre)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, carga_horaria, curso_id, semestre`,
      [nomeDisciplina, parseInt(cargaHoraria), professorId ?? null, cursoId ?? null, semestre]
    );
    return result.rows[0];
  },

  // Busca uma disciplina pelo id (usado para validação antes de atualizar/remover)
  async buscarPorId(id) {
    const result = await pool.query(
      'SELECT id, nome, professor_id, curso_id FROM disciplinas WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] ?? null;
  },

  // Lista disciplinas ativas com paginação + nome do professor e do curso via JOIN
  async listar({ pagina = 1, limite = 20, professorId = null } = {}) {
    const offset = (pagina - 1) * limite;

    const whereProf  = professorId ? 'AND d.professor_id = $3' : '';
    const whereCount = professorId ? 'AND d.professor_id = $1' : '';
    const params      = professorId ? [limite, offset, professorId] : [limite, offset];
    const paramsCount = professorId ? [professorId] : [];

    const [data, count] = await Promise.all([
      pool.query(
        `SELECT d.id, d.nome, d.carga_horaria, d.semestre,
                p.id   AS professor_id, p.nome AS professor,
                c.id   AS curso_id,    c.nome AS curso
           FROM disciplinas d
           LEFT JOIN professores p ON p.id = d.professor_id
           LEFT JOIN cursos      c ON c.id = d.curso_id AND c.deleted_at IS NULL
          WHERE d.deleted_at IS NULL ${whereProf}
          ORDER BY d.nome
          LIMIT $1 OFFSET $2`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM disciplinas d WHERE d.deleted_at IS NULL ${whereCount}`,
        paramsCount
      ),
    ]);

    return { dados: data.rows, total: parseInt(count.rows[0].count), pagina, limite };
  },

  // Atualiza todos os campos de uma disciplina
  async atualizar(id, { nomeDisciplina, cargaHoraria, professorId, cursoId, semestre }) {
    const result = await pool.query(
      `UPDATE disciplinas
          SET nome = $1, carga_horaria = $2, professor_id = $3, curso_id = $4, semestre = $5
        WHERE id = $6
       RETURNING id, nome, carga_horaria, curso_id, semestre`,
      [nomeDisciplina, parseInt(cargaHoraria), professorId ?? null, cursoId ?? null, semestre, id]
    );
    return result.rows[0];
  },

  // Soft delete
  async remover(id) {
    const result = await pool.query(
      `UPDATE disciplinas SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, nome`,
      [id]
    );
    return result.rows[0] ?? null;
  },
};

module.exports = Disciplina;