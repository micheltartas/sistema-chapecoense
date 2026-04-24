const express = require('express')
const pool = require('../config/database')
const { autenticar, autorizar } = require('../middlewares/auth')

const router = express.Router()

router.use(autenticar)

// GET /mensalidades — lista mensalidades com filtros
router.get('/', autorizar('admin', 'financeiro'), async (req, res) => {
  try {
    const { status, mes_referencia } = req.query
    let query = `
      SELECT m.id, m.mes_referencia, m.valor, m.status, m.data_pagamento,
             s.nome AS socio_nome, s.cpf AS socio_cpf,
             p.nome AS plano_nome
      FROM mensalidades m
      JOIN socios s ON m.socio_id = s.id
      JOIN planos p ON m.plano_id = p.id
      WHERE 1=1
    `
    const params = []

    if (status) {
      params.push(status)
      query += ` AND m.status = $${params.length}`
    }
    if (mes_referencia) {
      params.push(mes_referencia)
      query += ` AND m.mes_referencia = $${params.length}`
    }

    query += ' ORDER BY m.mes_referencia DESC, s.nome'
    const resultado = await pool.query(query, params)
    res.json(resultado.rows)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao buscar mensalidades' })
  }
})

// GET /mensalidades/socio/:socio_id — histórico de um sócio
router.get('/socio/:socio_id', autorizar('admin', 'financeiro', 'secretaria'), async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT m.*, p.nome AS plano_nome
       FROM mensalidades m
       JOIN planos p ON m.plano_id = p.id
       WHERE m.socio_id = $1
       ORDER BY m.mes_referencia DESC`,
      [req.params.socio_id]
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao buscar mensalidades do sócio' })
  }
})

// GET /mensalidades/:id
router.get('/:id', autorizar('admin', 'financeiro'), async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT m.*, s.nome AS socio_nome, p.nome AS plano_nome
       FROM mensalidades m
       JOIN socios s ON m.socio_id = s.id
       JOIN planos p ON m.plano_id = p.id
       WHERE m.id = $1`,
      [req.params.id]
    )
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Mensalidade não encontrada' })
    }
    res.json(resultado.rows[0])
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao buscar mensalidade' })
  }
})

// POST /mensalidades — lança nova mensalidade
router.post('/', autorizar('admin', 'financeiro'), async (req, res) => {
  const { socio_id, plano_id, mes_referencia, valor } = req.body

  if (!socio_id || !plano_id || !mes_referencia || !valor) {
    return res.status(400).json({ erro: 'socio_id, plano_id, mes_referencia e valor são obrigatórios' })
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO mensalidades (socio_id, plano_id, mes_referencia, valor, status)
       VALUES ($1, $2, $3, $4, 'pendente')
       RETURNING *`,
      [socio_id, plano_id, mes_referencia, valor]
    )
    res.status(201).json(resultado.rows[0])
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao lançar mensalidade' })
  }
})

// PUT /mensalidades/:id — atualiza status (ex: marcar como paga)
router.put('/:id', autorizar('admin', 'financeiro'), async (req, res) => {
  const { status, data_pagamento, valor } = req.body

  try {
    const resultado = await pool.query(
      `UPDATE mensalidades
       SET status = COALESCE($1, status),
           data_pagamento = COALESCE($2, data_pagamento),
           valor = COALESCE($3, valor)
       WHERE id = $4
       RETURNING *`,
      [status, data_pagamento || null, valor, req.params.id]
    )
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Mensalidade não encontrada' })
    }
    res.json(resultado.rows[0])
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao atualizar mensalidade' })
  }
})

module.exports = router
