/**
 * Middleware de autorização por perfil.
 *
 * Uso: autorizar('admin')  ou  autorizar('admin', 'professor')
 *
 * Deve ser chamado após o middleware `autenticar`, que injeta req.usuario.
 */
function autorizar(...perfisPermitidos) {
  return (req, res, next) => {
    const perfil = req.usuario?.perfil;

    if (!perfil || !perfisPermitidos.includes(perfil)) {
      return res.status(403).json({
        erro: `Acesso negado. Requer perfil: ${perfisPermitidos.join(' ou ')}.`,
      });
    }

    next();
  };
}

module.exports = { autorizar };