// Camada de acesso ao banco para a tabela alunos
// Cada método monta e executa uma query SQL específica

const pool = require('../database/db');

const Aluno = {
  // curso_id é a FK para a tabela cursos
  async criar({ nome, matricula, cursoId, email, telefone, cep, endereco, cidade, estado }) {
    const result = await pool.query(
      `INSERT INTO alunos (nome, matricula, curso_id, email, telefone, cep, endereco, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, nome, matricula, curso_id, email`,
      [nome, matricula, cursoId || null, email, telefone, cep, endereco, cidade, estado]
    );
    return result.rows[0];
  },

  async buscarPorEmail(email) {
    const result = await pool.query(
      `SELECT a.id, a.nome, a.matricula, a.curso_id, c.nome AS curso,
              a.email, a.telefone, a.cep, a.endereco, a.cidade, a.estado
         FROM alunos a
         LEFT JOIN cursos c ON c.id = a.curso_id AND c.deleted_at IS NULL
        WHERE a.email = $1 AND a.deleted_at IS NULL`,
      [email]
    );
    return result.rows[0] ?? null;
  },

  async buscarPorId(id) {
    const result = await pool.query(
      `SELECT a.*, c.nome AS curso
         FROM alunos a
         LEFT JOIN cursos c ON c.id = a.curso_id AND c.deleted_at IS NULL
        WHERE a.id = $1 AND a.deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] ?? null;
  },

  async buscarPorMatricula(matricula) {
    const result = await pool.query(
      `SELECT a.id, a.nome, a.matricula, c.nome AS curso
         FROM alunos a
         LEFT JOIN cursos c ON c.id = a.curso_id AND c.deleted_at IS NULL
        WHERE a.matricula = $1 AND a.deleted_at IS NULL`,
      [matricula]
    );
    return result.rows[0] ?? null;
  },

  async listar({ pagina = 1, limite = 20 } = {}) {
    const offset = (pagina - 1) * limite;
    const [data, count] = await Promise.all([
      pool.query(
        `SELECT a.id, a.nome, a.matricula, a.curso_id, c.nome AS curso,
                a.email, a.cidade, a.estado
           FROM alunos a
           LEFT JOIN cursos c ON c.id = a.curso_id AND c.deleted_at IS NULL
          WHERE a.deleted_at IS NULL
          ORDER BY a.nome LIMIT $1 OFFSET $2`,
        [limite, offset]
      ),
      pool.query('SELECT COUNT(*) FROM alunos WHERE deleted_at IS NULL'),
    ]);
    return { dados: data.rows, total: parseInt(count.rows[0].count), pagina, limite };
  },

  async atualizar(id, { nome, matricula, cursoId, email, telefone, cep, endereco, cidade, estado }) {
    const result = await pool.query(
      `UPDATE alunos
          SET nome = $1, matricula = $2, curso_id = $3, email = $4,
              telefone = $5, cep = $6, endereco = $7, cidade = $8, estado = $9
        WHERE id = $10
       RETURNING id, nome, matricula, curso_id, email`,
      [nome, matricula, cursoId || null, email, telefone, cep, endereco, cidade, estado, id]
    );
    return result.rows[0];
  },

  async remover(id) {
    const result = await pool.query(
      `UPDATE alunos SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, nome`,
      [id]
    );
    return result.rows[0] ?? null;
  },
};

module.exports = Aluno;