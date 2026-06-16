// Regras de acesso (definidas nas rotas):
//   - cadastrar / atualizar / remover: somente admin
//   - listar / listarSimples: admin e professor

const Curso    = require('../models/Curso');
const Professor = require('../models/Professor');

// POST /api/cursos
async function cadastrar(req, res) {
  const { nome, area, duracaoSem, coordenadorId, descricao } = req.body;

  if (!nome || !area || !duracaoSem) {
    return res.status(400).json({ erro: 'Nome, área e duração são obrigatórios.' });
  }

  if (parseInt(duracaoSem) < 1 || parseInt(duracaoSem) > 12) {
    return res.status(400).json({ erro: 'Duração deve ser entre 1 e 12 semestres.' });
  }

  try {
    // Valida coordenador se informado
    if (coordenadorId) {
      const prof = await Professor.buscarPorId(coordenadorId);
      if (!prof) return res.status(404).json({ erro: 'Coordenador não encontrado.' });
    }

    const curso = await Curso.criar({ nome, area, duracaoSem, coordenadorId, descricao });
    return res.status(201).json({ mensagem: 'Curso cadastrado com sucesso!', curso });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Já existe um curso com esse nome.' });
    }
    console.error('[cursos.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// GET /api/cursos
// GET /api/cursos?simples=true  -> retorna apenas { id, nome } para dropdowns
async function listar(req, res) {
  // O parâmetro ?simples=true reduz o payload para uso em SelectField
  if (req.query.simples === 'true') {
    try {
      const cursos = await Curso.listarSimples();
      return res.json(cursos);
    } catch (err) {
      console.error('[cursos.listarSimples]', err.message);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));

  try {
    const resultado = await Curso.listar({ pagina, limite });
    return res.json(resultado);
  } catch (err) {
    console.error('[cursos.listar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// PUT /api/cursos/:id
async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, area, duracaoSem, coordenadorId, descricao } = req.body;

  if (!nome || !area || !duracaoSem) {
    return res.status(400).json({ erro: 'Nome, área e duração são obrigatórios.' });
  }

  try {
    const existente = await Curso.buscarPorId(id);
    if (!existente) return res.status(404).json({ erro: 'Curso não encontrado.' });

    if (coordenadorId) {
      const prof = await Professor.buscarPorId(coordenadorId);
      if (!prof) return res.status(404).json({ erro: 'Coordenador não encontrado.' });
    }

    const curso = await Curso.atualizar(id, { nome, area, duracaoSem, coordenadorId, descricao });
    return res.json({ mensagem: 'Curso atualizado com sucesso!', curso });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Já existe um curso com esse nome.' });
    }
    console.error('[cursos.atualizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// DELETE /api/cursos/:id  (soft delete)
async function remover(req, res) {
  const { id } = req.params;
  try {
    const curso = await Curso.remover(id);
    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado.' });
    return res.json({ mensagem: 'Curso removido com sucesso.', curso });
  } catch (err) {
    console.error('[cursos.remover]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar, atualizar, remover };