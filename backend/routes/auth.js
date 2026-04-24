const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/database')
const { autenticar } = require('../middlewares/auth')

const router = express.Router()

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' })
  }

  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email.toLowerCase().trim()]
    )

    const usuario = resultado.rows[0]

    if (!usuario) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' })
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash)
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' })
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    )

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    })
  } catch (err) {
    console.error('Erro no login:', err.message)
    res.status(500).json({ erro: 'Erro interno do servidor' })
  }
})

// GET /auth/me — retorna dados do usuário autenticado
router.get('/me', autenticar, (req, res) => {
  res.json({ usuario: req.usuario })
})

module.exports = router
