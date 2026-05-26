const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('Variável de ambiente JWT_SECRET não definida. Configure o arquivo .env');
}

function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token não informado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch {
    return res.status(403).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = { autenticar };