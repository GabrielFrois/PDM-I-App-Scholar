const pool = require('../database/db');

const Aluno = {
  async criar({ nome, matricula, curso, email, telefone, cep, endereco, cidade, estado }) {
    const result = await pool.query(
      `INSERT INTO alunos (nome, matricula, curso, email, telefone, cep, endereco, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, nome, matricula, curso, email`,
      [nome, matricula, curso, email, telefone, cep, endereco, cidade, estado]
    );
    return result.rows[0];
  },

  async buscarPorEmail(email) {
    const result = await pool.query(
      `SELECT id, nome, matricula, curso, email, telefone, cep, endereco, cidade, estado
         FROM alunos WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return result.rows[0] ?? null;
  },

  async buscarPorId(id) {
    const result = await pool.query(
      'SELECT * FROM alunos WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async buscarPorMatricula(matricula) {
    const result = await pool.query(
      'SELECT id, nome, matricula, curso FROM alunos WHERE matricula = $1 AND deleted_at IS NULL',
      [matricula]
    );
    return result.rows[0] ?? null;
  },

  async listar({ pagina = 1, limite = 20 } = {}) {
    const offset = (pagina - 1) * limite;
    const [data, count] = await Promise.all([
      pool.query(
        `SELECT id, nome, matricula, curso, email, cidade, estado
           FROM alunos WHERE deleted_at IS NULL
           ORDER BY nome LIMIT $1 OFFSET $2`,
        [limite, offset]
      ),
      pool.query('SELECT COUNT(*) FROM alunos WHERE deleted_at IS NULL'),
    ]);
    return { dados: data.rows, total: parseInt(count.rows[0].count), pagina, limite };
  },

  async atualizar(id, { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado }) {
    const result = await pool.query(
      `UPDATE alunos
          SET nome = $1, matricula = $2, curso = $3, email = $4,
              telefone = $5, cep = $6, endereco = $7, cidade = $8, estado = $9
        WHERE id = $10
       RETURNING id, nome, matricula, curso, email`,
      [nome, matricula, curso, email, telefone, cep, endereco, cidade, estado, id]
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