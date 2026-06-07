// Relaciona alunos a disciplinas
// Regras de acesso (definidas nas rotas):
//   - matricular / desmatricular: somente admin
//   - listar disciplinas de um aluno: admin, professor ou o próprio aluno
//   - listar alunos de uma disciplina: admin ou professor (usado na tela de Lançamento de Notas)

const pool       = require('../database/db');
const Matricula  = require('../models/Matricula');
const Aluno      = require('../models/Aluno');

async function listarPorAluno(req, res) {
  const { alunoId } = req.params;
  try {
    const aluno = await Aluno.buscarPorId(alunoId);
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

    const [disciplinas, ids] = await Promise.all([
      Matricula.listarPorAluno(alunoId),
      Matricula.idsDisiplinasPorAluno(alunoId),
    ]);

    return res.json({ aluno: aluno.nome, disciplinas, ids });
  } catch (err) {
    console.error('[matriculas.listarPorAluno]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

async function matricular(req, res) {
  const { alunoId, disciplinaIds } = req.body;

  if (!alunoId || !Array.isArray(disciplinaIds) || disciplinaIds.length === 0) {
    return res.status(400).json({ erro: 'alunoId e disciplinaIds (array) são obrigatórios.' });
  }

  try {
    const aluno = await Aluno.buscarPorId(alunoId);
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

    let inseridas = 0;
    for (const disciplinaId of disciplinaIds) {
      const result = await Matricula.matricular(alunoId, disciplinaId);
      if (result) inseridas++;
    }

    return res.json({ mensagem: `${inseridas} matrícula(s) realizada(s) com sucesso.` });
  } catch (err) {
    console.error('[matriculas.matricular]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

async function desmatricular(req, res) {
  const { alunoId, disciplinaId } = req.body;

  if (!alunoId || !disciplinaId) {
    return res.status(400).json({ erro: 'alunoId e disciplinaId são obrigatórios.' });
  }

  try {
    const removida = await Matricula.desmatricular(alunoId, disciplinaId);
    if (!removida) return res.status(404).json({ erro: 'Matrícula não encontrada.' });
    return res.json({ mensagem: 'Matrícula removida com sucesso.' });
  } catch (err) {
    console.error('[matriculas.desmatricular]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// Usa transação: ou tudo salva ou nada é alterado
async function sincronizar(req, res) {
  const { alunoId, disciplinaIds } = req.body;

  if (!alunoId || !Array.isArray(disciplinaIds)) {
    return res.status(400).json({ erro: 'alunoId e disciplinaIds (array) são obrigatórios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const aluno = await Aluno.buscarPorId(alunoId);
    if (!aluno) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    const { rows } = await client.query(
      'SELECT disciplina_id FROM matriculas WHERE aluno_id = $1',
      [alunoId]
    );
    const idsAtuais = rows.map(r => r.disciplina_id);

    const para_adicionar = disciplinaIds.filter(id => !idsAtuais.includes(id));
    const para_remover   = idsAtuais.filter(id => !disciplinaIds.includes(id));

    for (const id of para_adicionar) {
      await client.query(
        'INSERT INTO matriculas (aluno_id, disciplina_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [alunoId, id]
      );
    }

    for (const id of para_remover) {
      await client.query(
        'DELETE FROM matriculas WHERE aluno_id = $1 AND disciplina_id = $2',
        [alunoId, id]
      );
    }

    await client.query('COMMIT');

    return res.json({
      mensagem:    'Matrículas sincronizadas com sucesso.',
      adicionadas: para_adicionar.length,
      removidas:   para_remover.length,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[matriculas.sincronizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
}

module.exports = { listarPorAluno, matricular, desmatricular, sincronizar };