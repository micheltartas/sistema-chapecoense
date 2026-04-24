const jwt = require('jsonwebtoken')

function autenticar(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = payload
    next()
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' })
  }
}

function autorizar(...perfisPermitidos) {
  return (req, res, next) => {
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({
        erro: `Acesso negado. Esta ação requer um dos perfis: ${perfisPermitidos.join(', ')}`
      })
    }
    next()
  }
}

module.exports = { autenticar, autorizar }
