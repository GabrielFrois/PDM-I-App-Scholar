// Responsável pelo login: valida credenciais e gera o token JWT

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const pool   = require('../database/db');

async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  try {
    // Busca o usuário na tabela de autenticação (não na tabela alunos/professores)
    const usuarioResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    const usuario = usuarioResult.rows[0];

    if (!usuario) {
      // Retorna a mesma mensagem para e-mail inválido e senha errada
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    // bcrypt.compare compara a senha digitada com o hash armazenado
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    let matricula   = null;
    let professorId = null;
    let nome        = email.split('@')[0]; // fallback de nome antes de buscar a tabela

    // Se for aluno, busca a matrícula para incluir no token (usada no boletim)
    if (usuario.perfil === 'aluno') {
      const alunoResult = await pool.query(
        'SELECT nome, matricula FROM alunos WHERE email = $1 AND deleted_at IS NULL',
        [email]
      );
      if (alunoResult.rows.length > 0) {
        matricula = alunoResult.rows[0].matricula;
        nome      = alunoResult.rows[0].nome;
      }
    }

    // Se for professor, busca o id para filtrar disciplinas e notas
    if (usuario.perfil === 'professor') {
      const profResult = await pool.query(
        'SELECT id, nome FROM professores WHERE email = $1 AND deleted_at IS NULL',
        [email]
      );
      if (profResult.rows.length > 0) {
        professorId = profResult.rows[0].id;
        nome        = profResult.rows[0].nome;
      }
    }

    // Gera o token JWT com 8 horas de validade
    // O payload fica disponível em req.usuario após o middleware autenticar
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, perfil: usuario.perfil, professorId, matricula },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      usuario: { nome, perfil: usuario.perfil, email: usuario.email, matricula, professorId },
    });
  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = { login };