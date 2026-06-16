// Camada de acesso ao banco para a tabela cursos.

const pool = require('../database/db');

const Curso = {

  // Cria um novo curso e retorna os dados básicos
  async criar({ nome, area, duracaoSem, coordenadorId, descricao }) {
    const result = await pool.query(
      `INSERT INTO cursos (nome, area, duracao_sem, coordenador_id, descricao)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, area, duracao_sem, coordenador_id, descricao`,
      [nome, area, parseInt(duracaoSem) || 6, coordenadorId || null, descricao || null]
    );
    return result.rows[0];
  },

  // Busca por ID incluindo o nome do coordenador via JOIN
  async buscarPorId(id) {
    const result = await pool.query(
      `SELECT c.id, c.nome, c.area, c.duracao_sem, c.descricao,
              c.coordenador_id, p.nome AS coordenador
         FROM cursos c
         LEFT JOIN professores p ON p.id = c.coordenador_id AND p.deleted_at IS NULL
        WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] ?? null;
  },

  // Lista cursos ativos com paginação + nome do coordenador via JOIN
  async listar({ pagina = 1, limite = 20 } = {}) {
    const offset = (pagina - 1) * limite;
    const [data, count] = await Promise.all([
      pool.query(
        `SELECT c.id, c.nome, c.area, c.duracao_sem, c.descricao,
                c.coordenador_id, p.nome AS coordenador
           FROM cursos c
           LEFT JOIN professores p ON p.id = c.coordenador_id AND p.deleted_at IS NULL
          WHERE c.deleted_at IS NULL
          ORDER BY c.nome
          LIMIT $1 OFFSET $2`,
        [limite, offset]
      ),
      pool.query('SELECT COUNT(*) FROM cursos WHERE deleted_at IS NULL'),
    ]);
    return { dados: data.rows, total: parseInt(count.rows[0].count), pagina, limite };
  },

  // Lista apenas id+nome para usar em SelectFields
  async listarSimples() {
    const result = await pool.query(
      `SELECT id, nome FROM cursos WHERE deleted_at IS NULL ORDER BY nome`
    );
    return result.rows;
  },

  // Atualiza todos os campos e devolve os dados atualizados com JOIN
  async atualizar(id, { nome, area, duracaoSem, coordenadorId, descricao }) {
    const result = await pool.query(
      `UPDATE cursos
          SET nome = $1, area = $2, duracao_sem = $3, coordenador_id = $4, descricao = $5
        WHERE id = $6
       RETURNING id, nome, area, duracao_sem, coordenador_id, descricao`,
      [nome, area, parseInt(duracaoSem) || 6, coordenadorId || null, descricao || null, id]
    );
    return result.rows[0];
  },

  // Soft delete, só marca deleted_at, nunca apaga o registro
  async remover(id) {
    const result = await pool.query(
      `UPDATE cursos SET deleted_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, nome`,
      [id]
    );
    return result.rows[0] ?? null;
  },
};

module.exports = Curso;