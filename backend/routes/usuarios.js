const express = require('express')
const bcrypt = require('bcryptjs')
const pool = require('../config/database')
const { autenticar, autorizar } = require('../middlewares/auth')

const router = express.Router()

router.use(autenticar)
router.use(autorizar('admin'))

// GET /usuarios
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, nome, email, perfil, ativo, created_at FROM usuarios ORDER BY nome'
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao buscar usuários' })
  }
})

// POST /usuarios — cria novo usuário
router.post('/', async (req, res) => {
  const { nome, email, senha, perfil } = req.body

  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ erro: 'Nome, email, senha e perfil são obrigatórios' })
  }

  const perfisValidos = ['admin', 'secretaria', 'financeiro']
  if (!perfisValidos.includes(perfil)) {
    return res.status(400).json({ erro: `Perfil inválido. Use: ${perfisValidos.join(', ')}` })
  }

  try {
    const emailExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()])
    if (emailExiste.rows.length > 0) {
      return res.status(409).json({ erro: 'Email já cadastrado' })
    }

    const senha_hash = await bcrypt.hash(senha, 10)
    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, perfil, ativo, created_at`,
      [nome, email.toLowerCase(), senha_hash, perfil]
    )
    res.status(201).json(resultado.rows[0])
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao criar usuário' })
  }
})

// PUT /usuarios/:id — atualiza usuário
router.put('/:id', async (req, res) => {
  const { nome, email, senha, perfil, ativo } = req.body

  try {
    let senha_hash = undefined
    if (senha) {
      senha_hash = await bcrypt.hash(senha, 10)
    }

    const resultado = await pool.query(
      `UPDATE usuarios
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           senha_hash = COALESCE($3, senha_hash),
           perfil = COALESCE($4, perfil),
           ativo = COALESCE($5, ativo)
       WHERE id = $6
       RETURNING id, nome, email, perfil, ativo`,
      [nome, email, senha_hash || null, perfil, ativo, req.params.id]
    )
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' })
    }
    res.json(resultado.rows[0])
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao atualizar usuário' })
  }
})

// DELETE /usuarios/:id
router.delete('/:id', async (req, res) => {
  if (parseInt(req.params.id) === req.usuario.id) {
    return res.status(400).json({ erro: 'Você não pode remover seu próprio usuário' })
  }

  try {
    const resultado = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' })
    }
    res.json({ mensagem: 'Usuário removido com sucesso' })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao remover usuário' })
  }
})

module.exports = router
