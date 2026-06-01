const Disciplina = require('../models/Disciplina');
const Professor  = require('../models/Professor');

// POST /api/disciplinas - somente admin
async function cadastrar(req, res) {
  const { nomeDisciplina, cargaHoraria, professorId, curso, semestre } = req.body;

  if (!nomeDisciplina || !cargaHoraria || !curso || !semestre) {
    return res.status(400).json({ erro: 'Nome, carga horária, curso e semestre são obrigatórios.' });
  }

  try {
    // Se um professorId foi informado, verifica se ele existe antes de salvar
    if (professorId) {
      const prof = await Professor.buscarPorId(professorId);
      if (!prof) {
        return res.status(404).json({ erro: 'Professor não encontrado.' });
      }
    }

    const disciplina = await Disciplina.criar({ nomeDisciplina, cargaHoraria, professorId: professorId || null, curso, semestre });
    return res.status(201).json({ mensagem: 'Disciplina cadastrada com sucesso!', disciplina });
  } catch (err) {
    console.error('[disciplinas.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// GET /api/disciplinas
// Admin recebe todas as disciplinas
// Professor recebe apenas as disciplinas onde é o professor_id (filtro via professorId do token)
async function listar(req, res) {
  const { perfil, professorId } = req.usuario;

  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));

  try {
    const resultado = await Disciplina.listar({
      pagina,
      limite,
      // Se for professor, passa o id para filtrar; se for admin, passa null (sem filtro)
      professorId: perfil === 'professor' ? professorId : null,
    });
    return res.json(resultado);
  } catch (err) {
    console.error('[disciplinas.listar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// PUT /api/disciplinas/:id - somente admin
async function atualizar(req, res) {
  const { id } = req.params;
  const { nomeDisciplina, cargaHoraria, professorId, curso, semestre } = req.body;

  if (!nomeDisciplina || !cargaHoraria || !curso || !semestre) {
    return res.status(400).json({ erro: 'Nome, carga horária, curso e semestre são obrigatórios.' });
  }

  try {
    const existente = await Disciplina.buscarPorId(id);
    if (!existente) {
      return res.status(404).json({ erro: 'Disciplina não encontrada.' });
    }

    if (professorId) {
      const prof = await Professor.buscarPorId(professorId);
      if (!prof) {
        return res.status(404).json({ erro: 'Professor não encontrado.' });
      }
    }

    const disciplina = await Disciplina.atualizar(id, { nomeDisciplina, cargaHoraria, professorId: professorId || null, curso, semestre });
    return res.json({ mensagem: 'Disciplina atualizada com sucesso!', disciplina });
  } catch (err) {
    console.error('[disciplinas.atualizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// DELETE /api/disciplinas/:id - somente admin (soft delete)
async function remover(req, res) {
  const { id } = req.params;

  try {
    const disciplina = await Disciplina.remover(id);
    if (!disciplina) {
      return res.status(404).json({ erro: 'Disciplina não encontrada.' });
    }
    return res.json({ mensagem: 'Disciplina removida com sucesso.', disciplina });
  } catch (err) {
    console.error('[disciplinas.remover]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar, atualizar, remover };