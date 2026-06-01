// Middleware de autorização por perfil.
function autorizar(...perfisPermitidos) {
  // Retorna uma função middleware que verifica o perfil do usuário logado
  return (req, res, next) => {
    const perfil = req.usuario?.perfil;

    // Se o perfil do token não estiver na lista de permitidos, bloqueia com 403
    if (!perfil || !perfisPermitidos.includes(perfil)) {
      return res.status(403).json({
        erro: `Acesso negado. Requer perfil: ${perfisPermitidos.join(' ou ')}.`,
      });
    }

    next();
  };
}

module.exports = { autorizar };