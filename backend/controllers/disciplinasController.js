const pool = require('../database/db');

/**
 * POST /api/disciplinas
 * Body: { nomeDisciplina, cargaHoraria, professorId, curso, semestre }
 * Agora recebe professorId (número) em vez de nome do professor.
 */
async function cadastrar(req, res) {
  const { nomeDisciplina, cargaHoraria, professorId, curso, semestre } = req.body;

  if (!nomeDisciplina || !cargaHoraria || !curso || !semestre) {
    return res.status(400).json({ erro: 'Nome, carga horária, curso e semestre são obrigatórios.' });
  }

  try {
    let profIdFinal = null;
    if (professorId) {
      const prof = await pool.query('SELECT id FROM professores WHERE id = $1', [professorId]);
      if (prof.rows.length === 0) {
        return res.status(404).json({ erro: 'Professor não encontrado.' });
      }
      profIdFinal = prof.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, carga_horaria, curso, semestre`,
      [nomeDisciplina, parseInt(cargaHoraria), profIdFinal, curso, semestre]
    );

    return res.status(201).json({
      mensagem:   'Disciplina cadastrada com sucesso!',
      disciplina: result.rows[0],
    });
  } catch (err) {
    console.error('[disciplinas.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

/** GET /api/disciplinas — paginado, ?pagina=&limite= */
async function listar(req, res) {
  const { perfil, professorId } = req.usuario;

  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));
  const offset = (pagina - 1) * limite;

  try {
    const baseWhere = perfil === 'professor' ? 'WHERE d.professor_id = $1' : '';
    const params    = perfil === 'professor' ? [professorId, limite, offset] : [limite, offset];
    const p1        = perfil === 'professor' ? '$2' : '$1';
    const p2        = perfil === 'professor' ? '$3' : '$2';

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT d.id, d.nome, d.carga_horaria, d.curso, d.semestre,
                p.id AS professor_id, p.nome AS professor
           FROM disciplinas d
           LEFT JOIN professores p ON p.id = d.professor_id
          ${baseWhere}
          ORDER BY d.nome
          LIMIT ${p1} OFFSET ${p2}`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM disciplinas d ${baseWhere}`,
        perfil === 'professor' ? [professorId] : []
      ),
    ]);

    return res.json({
      dados:  dataResult.rows,
      total:  parseInt(countResult.rows[0].count),
      pagina,
      limite,
    });
  } catch (err) {
    console.error('[disciplinas.listar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

/** DELETE /api/disciplinas/:id — somente admin. Soft delete. */
async function remover(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE disciplinas SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, nome`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Disciplina não encontrada.' });
    }

    return res.json({ mensagem: 'Disciplina removida com sucesso.', disciplina: result.rows[0] });
  } catch (err) {
    console.error('[disciplinas.remover]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar, remover };