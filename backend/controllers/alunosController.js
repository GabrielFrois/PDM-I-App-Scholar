const pool = require('../database/db');

async function cadastrar(req, res) {
  const { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado } = req.body;

  if (!nome || !matricula || !curso || !email) {
    return res.status(400).json({ erro: 'Nome, matrícula, curso e e-mail são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO alunos (nome, matricula, curso, email, telefone, cep, endereco, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, nome, matricula, curso, email`,
      [nome, matricula, curso, email, telefone, cep, endereco, cidade, estado]
    );

    return res.status(201).json({
      mensagem: 'Aluno cadastrado com sucesso!',
      aluno:    result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Matrícula ou e-mail já cadastrado.' });
    }
    console.error('[alunos.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

/**
 * GET /api/alunos
 * ?email=... → retorna um aluno específico
 * ?pagina=&limite= → listagem paginada
 */
async function listar(req, res) {
  const { email } = req.query;

  if (email) {
    try {
      const result = await pool.query(
        `SELECT id, nome, matricula, curso, email, telefone, cep, endereco, cidade, estado
           FROM alunos
          WHERE email = $1 AND deleted_at IS NULL`,
        [email]
      );
      return res.json(result.rows[0] ?? null);
    } catch (err) {
      console.error('[alunos.listar email]', err.message);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));
  const offset = (pagina - 1) * limite;

  try {
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, nome, matricula, curso, email, cidade, estado
           FROM alunos
          WHERE deleted_at IS NULL
          ORDER BY nome
          LIMIT $1 OFFSET $2`,
        [limite, offset]
      ),
      pool.query('SELECT COUNT(*) FROM alunos WHERE deleted_at IS NULL'),
    ]);

    return res.json({
      dados:  dataResult.rows,
      total:  parseInt(countResult.rows[0].count),
      pagina,
      limite,
    });
  } catch (err) {
    console.error('[alunos.listar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { perfil, email: emailToken } = req.usuario;

  try {
    const existente = await pool.query(
      'SELECT * FROM alunos WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (existente.rows.length === 0) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    if (perfil === 'aluno' && existente.rows[0].email !== emailToken) {
      return res.status(403).json({ erro: 'Você só pode editar o próprio cadastro.' });
    }

    const { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado } = req.body;

    if (!nome || !matricula || !curso || !email) {
      return res.status(400).json({ erro: 'Nome, matrícula, curso e e-mail são obrigatórios.' });
    }

    const result = await pool.query(
      `UPDATE alunos
          SET nome = $1, matricula = $2, curso = $3, email = $4,
              telefone = $5, cep = $6, endereco = $7, cidade = $8, estado = $9
        WHERE id = $10
       RETURNING id, nome, matricula, curso, email`,
      [nome, matricula, curso, email, telefone, cep, endereco, cidade, estado, id]
    );

    return res.json({ mensagem: 'Dados atualizados com sucesso!', aluno: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Matrícula ou e-mail já cadastrado.' });
    }
    console.error('[alunos.atualizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

/** DELETE /api/alunos/:id — somente admin. Soft delete. */
async function remover(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE alunos SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, nome`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    return res.json({ mensagem: 'Aluno removido com sucesso.', aluno: result.rows[0] });
  } catch (err) {
    console.error('[alunos.remover]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar, atualizar, remover };