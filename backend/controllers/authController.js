const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const pool   = require('../database/db');

async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const usuarioResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    const usuario = usuarioResult.rows[0];

    if (!usuario) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    let matricula   = null;
    let professorId = null;
    let nome        = email.split('@')[0];

    if (usuario.perfil === 'aluno') {
      const alunoResult = await pool.query(
        'SELECT nome, matricula FROM alunos WHERE email = $1',
        [email]
      );
      if (alunoResult.rows.length > 0) {
        matricula = alunoResult.rows[0].matricula;
        nome      = alunoResult.rows[0].nome;
      }
    }

    if (usuario.perfil === 'professor') {
      const profResult = await pool.query(
        'SELECT id, nome FROM professores WHERE email = $1',
        [email]
      );
      if (profResult.rows.length > 0) {
        professorId = profResult.rows[0].id;
        nome        = profResult.rows[0].nome;
      }
    }

    // matricula incluída no payload para validação no boletim
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