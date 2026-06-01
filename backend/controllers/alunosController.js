// Processa as requisições HTTP para o recurso alunos e delega ao model

const Aluno = require('../models/Aluno');

// POST /api/alunos - somente admin
async function cadastrar(req, res) {
  const { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado } = req.body;

  // Validação mínima dos campos obrigatórios
  if (!nome || !matricula || !curso || !email) {
    return res.status(400).json({ erro: 'Nome, matrícula, curso e e-mail são obrigatórios.' });
  }

  try {
    const aluno = await Aluno.criar({ nome, matricula, curso, email, telefone, cep, endereco, cidade, estado });
    return res.status(201).json({ mensagem: 'Aluno cadastrado com sucesso!', aluno });
  } catch (err) {
    // Código 23505 = violação de UNIQUE no PostgreSQL (matrícula ou e-mail duplicado)
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Matrícula ou e-mail já cadastrado.' });
    }
    console.error('[alunos.cadastrar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// GET /api/alunos
// Com ?email=... -> retorna um aluno específico (usado pelo aluno para carregar seus dados)
// Sem parâmetro -> listagem paginada via ?pagina=&limite=
async function listar(req, res) {
  const { email } = req.query;

  if (email) {
    try {
      const aluno = await Aluno.buscarPorEmail(email);
      return res.json(aluno ?? null);
    } catch (err) {
      console.error('[alunos.listar email]', err.message);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Garante que pagina >= 1 e limite entre 1 e 100
  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 20));

  try {
    const resultado = await Aluno.listar({ pagina, limite });
    return res.json(resultado);
  } catch (err) {
    console.error('[alunos.listar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// PUT /api/alunos/:id - admin ou o próprio aluno
async function atualizar(req, res) {
  const { id } = req.params;
  const { perfil, email: emailToken } = req.usuario; // dados do token JWT

  try {
    const existente = await Aluno.buscarPorId(id);
    if (!existente) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    // Aluno só pode editar o próprio cadastro (compara o e-mail do token com o do registro)
    if (perfil === 'aluno' && existente.email !== emailToken) {
      return res.status(403).json({ erro: 'Você só pode editar o próprio cadastro.' });
    }

    const { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado } = req.body;

    if (!nome || !matricula || !curso || !email) {
      return res.status(400).json({ erro: 'Nome, matrícula, curso e e-mail são obrigatórios.' });
    }

    const aluno = await Aluno.atualizar(id, { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado });
    return res.json({ mensagem: 'Dados atualizados com sucesso!', aluno });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Matrícula ou e-mail já cadastrado.' });
    }
    console.error('[alunos.atualizar]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

// DELETE /api/alunos/:id - somente admin (soft delete)
async function remover(req, res) {
  const { id } = req.params;

  try {
    const aluno = await Aluno.remover(id);
    if (!aluno) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }
    return res.json({ mensagem: 'Aluno removido com sucesso.', aluno });
  } catch (err) {
    console.error('[alunos.remover]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastrar, listar, atualizar, remover };