// Garante que JWT_SECRET está definido antes de qualquer requisição chegar
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('Variável de ambiente JWT_SECRET não definida. Configure o arquivo .env');
}

// Middleware que verifica se a requisição contém um token JWT válido
// O token deve vir no header: Authorization: Bearer <token>
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Extrai só o token
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token não informado.' });
  }

  try {
    // Verifica a assinatura e decodifica o payload
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Injeta os dados do usuário logado na requisição para uso nos controllers
    req.usuario = payload;
    next();
  } catch {
    return res.status(403).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = { autenticar };