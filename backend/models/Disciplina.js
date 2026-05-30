const pool = require('../database/db');

const Disciplina = {
  async criar({ nomeDisciplina, cargaHoraria, professorId, curso, semestre }) {
    const result = await pool.query(
      `INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, carga_horaria, curso, semestre`,
      [nomeDisciplina, parseInt(cargaHoraria), professorId ?? null, curso, semestre]
    );
    return result.rows[0];
  },

  async buscarPorId(id) {
    const result = await pool.query(
      'SELECT id, nome, professor_id FROM disciplinas WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async listar({ pagina = 1, limite = 20, professorId = null } = {}) {
    const offset    = (pagina - 1) * limite;
    const whereProf = professorId ? 'AND d.professor_id = $3' : '';
    const params    = professorId ? [limite, offset, professorId] : [limite, offset];

    const [data, count] = await Promise.all([
      pool.query(
        `SELECT d.id, d.nome, d.carga_horaria, d.curso, d.semestre,
                p.id AS professor_id, p.nome AS professor
           FROM disciplinas d
           LEFT JOIN professores p ON p.id = d.professor_id
          WHERE d.deleted_at IS NULL ${whereProf}
          ORDER BY d.nome
          LIMIT $1 OFFSET $2`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM disciplinas d WHERE d.deleted_at IS NULL ${whereProf}`,
        professorId ? [professorId] : []
      ),
    ]);
    return { dados: data.rows, total: parseInt(count.rows[0].count), pagina, limite };
  },

  async atualizar(id, { nomeDisciplina, cargaHoraria, professorId, curso, semestre }) {
    const result = await pool.query(
      `UPDATE disciplinas
          SET nome = $1, carga_horaria = $2, professor_id = $3, curso = $4, semestre = $5
        WHERE id = $6
       RETURNING id, nome, carga_horaria, curso, semestre`,
      [nomeDisciplina, parseInt(cargaHoraria), professorId ?? null, curso, semestre, id]
    );
    return result.rows[0];
  },

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