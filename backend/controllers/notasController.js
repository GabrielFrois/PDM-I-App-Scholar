// Lida com listagem e lançamento/atualização de notas por disciplina
// Admin tem acesso irrestrito a todas as disciplinas e alunos
// Professor só pode consultar e lançar notas nas disciplinas onde é professor_id

const Nota       = require('../models/Nota');
const Disciplina = require('../models/Disciplina');
const Aluno      = require('../models/Aluno');

// GET /api/notas/disciplina/:disciplinaId
// Admin: acesso irrestrito
// Professor: só vê notas das disciplinas onde é professor_id
async function listarPorDisciplina(req, res) {
  const { disciplinaId } = req.params;
  const { perfil, professorId } = req.usuario;

  try {
    const disciplina = await Disciplina.buscarPorId(disciplinaId);
    if (!disciplina) {
      return res.status(404).json({ erro: 'Disciplina não encontrada.' });
    }

    // Bloqueia professor que tentou acessar disciplina de outro professor
    if (perfil === 'professor' && disciplina.professor_id !== professorId) {
      return res.status(403).json({ erro: 'Você só pode gerenciar notas das suas disciplinas.' });
    }

    const notas = await Nota.listarPorDisciplina(disciplinaId);
    return res.json({ disciplina: disciplina.nome, notas });
  } catch (err) {
    console.error('[notas.listarPorDisciplina]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// PUT /api/notas
// Lança ou atualiza as notas de um aluno em uma disciplina
// Body esperado: { alunoId, disciplinaId, nota1, nota2 }
async function lancarOuAtualizar(req, res) {
  const { alunoId, disciplinaId, nota1, nota2 } = req.body;
  const { perfil, professorId } = req.usuario;

  // Valida presença dos campos obrigatórios de identificação
  if (alunoId == null || disciplinaId == null) {
    return res.status(400).json({ erro: 'alunoId e disciplinaId são obrigatórios.' });
  }

  // Exige pelo menos uma nota para não fazer um UPDATE vazio
  if (nota1 == null && nota2 == null) {
    return res.status(400).json({ erro: 'Informe ao menos nota1 ou nota2.' });
  }

  // Valida os valores das notas (entre 0 e 10)
  if (nota1 != null && (isNaN(nota1) || nota1 < 0 || nota1 > 10)) {
    return res.status(400).json({ erro: 'nota1 deve estar entre 0 e 10.' });
  }

  if (nota2 != null && (isNaN(nota2) || nota2 < 0 || nota2 > 10)) {
    return res.status(400).json({ erro: 'nota2 deve estar entre 0 e 10.' });
  }

  try {
    const disciplina = await Disciplina.buscarPorId(disciplinaId);
    if (!disciplina) {
      return res.status(404).json({ erro: 'Disciplina não encontrada.' });
    }

    // Professor não pode lançar notas em disciplinas de outro professor
    if (perfil === 'professor' && disciplina.professor_id !== professorId) {
      return res.status(403).json({ erro: 'Você só pode lançar notas nas suas disciplinas.' });
    }

    const aluno = await Aluno.buscarPorId(alunoId);
    if (!aluno) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    // O model usa INSERT ... ON CONFLICT para criar ou atualizar o registro
    const nota = await Nota.lancarOuAtualizar({ alunoId, disciplinaId, nota1, nota2 });
    return res.json({ mensagem: 'Notas lançadas com sucesso!', nota });
  } catch (err) {
    console.error('[notas.lancarOuAtualizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { listarPorDisciplina, lancarOuAtualizar };