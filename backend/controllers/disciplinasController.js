// Cadastro, listagem, edição e remoção (soft delete) de disciplinas.
// Regras de acesso (definidas nas rotas):
//   - cadastrar / atualizar / remover: somente admin
//   - listar: admin e professor

const Disciplina = require('../models/Disciplina');
const Professor  = require('../models/Professor');
const Curso      = require('../models/Curso');

// POST /api/disciplinas
async function cadastrar(req, res) {
  const { nomeDisciplina, cargaHoraria, professorId, cursoId, semestre } = req.body;

  if (!nomeDisciplina || !cargaHoraria || !semestre) {
    return res.status(400).json({ erro: 'Nome, carga horária e semestre são obrigatórios.' });
  }

  try {
    if (professorId) {
      const prof = await Professor.buscarPorId(professorId);
      if (!prof) return res.status(404).json({ erro: 'Professor não encontrado.' });
    }

    if (cursoId) {
      const curso = await Curso.buscarPorId(cursoId);
      if (!curso) return res.status(404).json({ erro: 'Curso não encontrado.' });
    }

    const disciplina = await Disciplina.criar({
      nomeDisciplina, cargaHoraria,
      professorId: professorId || null,
      cursoId: cursoId || null,
      semestre,
    });
    return res.status(201).json({ mensagem: 'Disciplina cadastrada com sucesso!', disciplina });
  } catch (err) {
    console.error('[disciplinas.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// GET /api/disciplinas
async function listar(req, res) {
  const { perfil, professorId } = req.usuario;

  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));

  try {
    const resultado = await Disciplina.listar({
      pagina,
      limite,
      professorId: perfil === 'professor' ? professorId : null,
    });
    return res.json(resultado);
  } catch (err) {
    console.error('[disciplinas.listar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// PUT /api/disciplinas/:id
async function atualizar(req, res) {
  const { id } = req.params;
  const { nomeDisciplina, cargaHoraria, professorId, cursoId, semestre } = req.body;

  if (!nomeDisciplina || !cargaHoraria || !semestre) {
    return res.status(400).json({ erro: 'Nome, carga horária e semestre são obrigatórios.' });
  }

  try {
    const existente = await Disciplina.buscarPorId(id);
    if (!existente) return res.status(404).json({ erro: 'Disciplina não encontrada.' });

    if (professorId) {
      const prof = await Professor.buscarPorId(professorId);
      if (!prof) return res.status(404).json({ erro: 'Professor não encontrado.' });
    }

    if (cursoId) {
      const curso = await Curso.buscarPorId(cursoId);
      if (!curso) return res.status(404).json({ erro: 'Curso não encontrado.' });
    }

    const disciplina = await Disciplina.atualizar(id, {
      nomeDisciplina, cargaHoraria,
      professorId: professorId || null,
      cursoId: cursoId || null,
      semestre,
    });
    return res.json({ mensagem: 'Disciplina atualizada com sucesso!', disciplina });
  } catch (err) {
    console.error('[disciplinas.atualizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// DELETE /api/disciplinas/:id
async function remover(req, res) {
  const { id } = req.params;
  try {
    const disciplina = await Disciplina.remover(id);
    if (!disciplina) return res.status(404).json({ erro: 'Disciplina não encontrada.' });
    return res.json({ mensagem: 'Disciplina removida com sucesso.', disciplina });
  } catch (err) {
    console.error('[disciplinas.remover]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar, atualizar, remover };