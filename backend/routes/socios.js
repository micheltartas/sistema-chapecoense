const express = require('express')
const pool = require('../config/database')
const { autenticar, autorizar } = require('../middlewares/auth')

const router = express.Router()

// Todas as rotas de sócios exigem autenticação
router.use(autenticar)

// GET /socios — lista todos os sócios
router.get('/', async (req, res) => {
  try {
    const { status, plano_id } = req.query
    let query = `
      SELECT s.id, s.nome, s.cpf, s.email, s.telefone, s.status,
             s.data_cadastro, p.nome AS plano
      FROM socios s
      LEFT JOIN planos p ON s.plano_id = p.id
      WHERE 1=1
    `
    const params = []

    if (status) {
      params.push(status)
      query += ` AND s.status = $${params.length}`
    }
    if (plano_id) {
      params.push(plano_id)
      query += ` AND s.plano_id = $${params.length}`
    }

    query += ' ORDER BY s.nome'
    const resultado = await pool.query(query, params)
    res.json(resultado.rows)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao buscar sócios' })
  }
})

// GET /socios/busca?q= — busca por nome ou CPF
router.get('/busca', async (req, res) => {
  const { q } = req.query
  if (!q) return res.status(400).json({ erro: 'Parâmetro de busca obrigatório' })

  try {
    const resultado = await pool.query(
      `SELECT s.id, s.nome, s.cpf, s.email, s.status, p.nome AS plano
       FROM socios s
       LEFT JOIN planos p ON s.plano_id = p.id
       WHERE s.nome ILIKE $1 OR s.cpf LIKE $2
       ORDER BY s.nome
       LIMIT 20`,
      [`%${q}%`, `%${q}%`]
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro na busca' })
  }
})

// GET /socios/:id — busca sócio por ID
router.get('/:id', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT s.*, p.nome AS plano_nome, p.valor AS plano_valor
       FROM socios s
       LEFT JOIN planos p ON s.plano_id = p.id
       WHERE s.id = $1`,
      [req.params.id]
    )
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Sócio não encontrado' })
    }
    res.json(resultado.rows[0])
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao buscar sócio' })
  }
})

// POST /socios — cadastra novo sócio (secretaria e admin)
router.post('/', autorizar('admin', 'secretaria'), async (req, res) => {
  const { nome, cpf, email, telefone, data_nascimento, plano_id } = req.body

  if (!nome || !cpf || !plano_id) {
    return res.status(400).json({ erro: 'Nome, CPF e plano são obrigatórios' })
  }

  try {
    const cpfExiste = await pool.query('SELECT id FROM socios WHERE cpf = $1', [cpf])
    if (cpfExiste.rows.length > 0) {
      return res.status(409).json({ erro: 'CPF já cadastrado' })
    }

    const resultado = await pool.query(
      `INSERT INTO socios (nome, cpf, email, telefone, data_nascimento, plano_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ativo')
       RETURNING *`,
      [nome, cpf, email || null, telefone || null, data_nascimento || null, plano_id]
    )
    res.status(201).json(resultado.rows[0])
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao cadastrar sócio' })
  }
})

// PUT /socios/:id — atualiza sócio (secretaria e admin)
router.put('/:id', autorizar('admin', 'secretaria'), async (req, res) => {
  const { nome, email, telefone, data_nascimento, plano_id, status } = req.body

  try {
    const resultado = await pool.query(
      `UPDATE socios
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           telefone = COALESCE($3, telefone),
           data_nascimento = COALESCE($4, data_nascimento),
           plano_id = COALESCE($5, plano_id),
           status = COALESCE($6, status)
       WHERE id = $7
       RETURNING *`,
      [nome, email, telefone, data_nascimento, plano_id, status, req.params.id]
    )
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Sócio não encontrado' })
    }
    res.json(resultado.rows[0])
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao atualizar sócio' })
  }
})

// DELETE /socios/:id — somente admin
router.delete('/:id', autorizar('admin'), async (req, res) => {
  try {
    const resultado = await pool.query(
      'DELETE FROM socios WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Sócio não encontrado' })
    }
    res.json({ mensagem: 'Sócio removido com sucesso' })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao remover sócio' })
  }
})

module.exports = router
