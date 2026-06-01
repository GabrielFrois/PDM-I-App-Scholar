// Camada de acesso ao banco para a tabela alunos
// Cada método monta e executa uma query SQL específica

const pool = require('../database/db');

const Aluno = {
  // Insere um novo aluno e retorna os dados básicos do registro criado
  async criar({ nome, matricula, curso, email, telefone, cep, endereco, cidade, estado }) {
    const result = await pool.query(
      `INSERT INTO alunos (nome, matricula, curso, email, telefone, cep, endereco, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, nome, matricula, curso, email`,
      [nome, matricula, curso, email, telefone, cep, endereco, cidade, estado]
    );
    return result.rows[0];
  },

  // Busca um aluno pelo e-mail; ignora registros com soft delete (deleted_at IS NULL)
  async buscarPorEmail(email) {
    const result = await pool.query(
      `SELECT id, nome, matricula, curso, email, telefone, cep, endereco, cidade, estado
         FROM alunos WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    // ?? null: retorna null se não encontrar (em vez de undefined)
    return result.rows[0] ?? null;
  },

  // Busca um aluno pelo id; ignora deletados
  async buscarPorId(id) {
    const result = await pool.query(
      'SELECT * FROM alunos WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] ?? null;
  },

  // Busca um aluno pela matrícula; usado no boletim
  async buscarPorMatricula(matricula) {
    const result = await pool.query(
      'SELECT id, nome, matricula, curso FROM alunos WHERE matricula = $1 AND deleted_at IS NULL',
      [matricula]
    );
    return result.rows[0] ?? null;
  },

  // Lista alunos ativos com paginação
  // Promise.all executa as duas queries (dados + contagem total) em paralelo
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

  // Atualiza todos os campos de um aluno e retorna os dados atualizados
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

  // Soft delete: não apaga o registro, apenas marca deleted_at com a data/hora atual
  // Retorna null se o aluno não existir ou já estiver deletado
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