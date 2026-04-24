const express = require('express')
const pool = require('../config/database')
const { autenticar, autorizar } = require('../middlewares/auth')

const router = express.Router()

router.use(autenticar)

// GET /planos — lista todos os planos ativos
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM planos WHERE ativo = true ORDER BY valor'
    )
    res.json(resultado.rows)
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar planos' })
  }
})

// POST /planos — somente admin
router.post('/', autorizar('admin'), async (req, res) => {
  const { nome, valor, descricao } = req.body
  if (!nome || !valor) {
    return res.status(400).json({ erro: 'Nome e valor são obrigatórios' })
  }
  try {
    const resultado = await pool.query(
      'INSERT INTO planos (nome, valor, descricao) VALUES ($1, $2, $3) RETURNING *',
      [nome, valor, descricao || null]
    )
    res.status(201).json(resultado.rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar plano' })
  }
})

module.exports = router
