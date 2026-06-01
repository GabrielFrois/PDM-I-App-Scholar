// Camada de acesso ao banco para a tabela professores

const pool = require('../database/db');

const Professor = {
  // Insere um novo professor; parseInt converte tempoDocencia de string para número
  async criar({ nome, titulacao, areaAtuacao, tempoDocencia, email }) {
    const result = await pool.query(
      `INSERT INTO professores (nome, titulacao, area, tempo_docencia, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, titulacao, area, tempo_docencia, email`,
      [nome, titulacao, areaAtuacao, parseInt(tempoDocencia) || 0, email]
    );
    return result.rows[0];
  },

  // Busca professor por e-mail, ignorando deletados
  async buscarPorEmail(email) {
    const result = await pool.query(
      `SELECT id, nome, titulacao, area, tempo_docencia, email
         FROM professores WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return result.rows[0] ?? null;
  },

  // Busca professor por id, ignorando deletados
  async buscarPorId(id) {
    const result = await pool.query(
      'SELECT * FROM professores WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] ?? null;
  },

  // Lista professores ativos com paginação (dados + total em paralelo)
  async listar({ pagina = 1, limite = 20 } = {}) {
    const offset = (pagina - 1) * limite;
    const [data, count] = await Promise.all([
      pool.query(
        `SELECT id, nome, titulacao, area, tempo_docencia, email
           FROM professores WHERE deleted_at IS NULL
           ORDER BY nome LIMIT $1 OFFSET $2`,
        [limite, offset]
      ),
      pool.query('SELECT COUNT(*) FROM professores WHERE deleted_at IS NULL'),
    ]);
    return { dados: data.rows, total: parseInt(count.rows[0].count), pagina, limite };
  },

  // Atualiza todos os campos do professor
  async atualizar(id, { nome, titulacao, areaAtuacao, tempoDocencia, email }) {
    const result = await pool.query(
      `UPDATE professores
          SET nome = $1, titulacao = $2, area = $3, tempo_docencia = $4, email = $5
        WHERE id = $6
       RETURNING id, nome, titulacao, area, tempo_docencia, email`,
      [nome, titulacao, areaAtuacao, parseInt(tempoDocencia) || 0, email, id]
    );
    return result.rows[0];
  },

  // Soft delete: marca deleted_at, não apaga o registro
  async remover(id) {
    const result = await pool.query(
      `UPDATE professores SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, nome`,
      [id]
    );
    return result.rows[0] ?? null;
  },
};

module.exports = Professor;