// Retorna o boletim completo de um aluno (notas, médias e situação por disciplina)

const Aluno = require('../models/Aluno');
const Nota  = require('../models/Nota');

// GET /api/boletim/:matricula
// Admin e professor: acesso livre a qualquer boletim
// Aluno: só pode acessar o próprio boletim - a matrícula da rota deve bater com a do token
async function buscarPorMatricula(req, res) {
  const { matricula } = req.params;
  const { perfil, matricula: matriculaToken } = req.usuario;

  // Bloqueia o aluno que tentou consultar o boletim de outra matrícula
  if (perfil === 'aluno' && matriculaToken !== matricula) {
    return res.status(403).json({ erro: 'Você só pode consultar o próprio boletim.' });
  }

  try {
    // Busca os dados do aluno pelo número de matrícula
    const aluno = await Aluno.buscarPorMatricula(matricula);
    if (!aluno) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    // Busca todas as notas do aluno com nome da disciplina, nota1, nota2, media e situacao
    const disciplinas = await Nota.listarPorAluno(aluno.id);

    // Retorna o boletim no formato esperado pelo frontend
    return res.json({
      aluno:      aluno.nome,
      matricula:  aluno.matricula,
      curso:      aluno.curso,
      disciplinas,
    });
  } catch (err) {
    console.error('[boletim.buscarPorMatricula]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { buscarPorMatricula };