const express = require('express')
const pool = require('../config/database')
const { autenticar } = require('../middlewares/auth')

const router = express.Router()

router.use(autenticar)

// GET /dashboard — resumo geral do sistema
router.get('/', async (req, res) => {
  try {
    const [socios, mensalidades, planos] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'ativo') AS ativos,
          COUNT(*) FILTER (WHERE status = 'inativo') AS inativos,
          COUNT(*) FILTER (WHERE status = 'inadimplente') AS inadimplentes,
          COUNT(*) AS total
        FROM socios
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pendente') AS pendentes,
          COUNT(*) FILTER (WHERE status = 'atrasada') AS atrasadas,
          COUNT(*) FILTER (WHERE status = 'paga') AS pagas,
          COALESCE(SUM(valor) FILTER (WHERE status = 'paga' AND mes_referencia = TO_CHAR(NOW(), 'YYYY-MM')), 0) AS receita_mes_atual
        FROM mensalidades
      `),
      pool.query(`SELECT id, nome, valor FROM planos WHERE ativo = true ORDER BY valor`)
    ])

    res.json({
      socios: socios.rows[0],
      mensalidades: mensalidades.rows[0],
      planos: planos.rows,
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ erro: 'Erro ao carregar dashboard' })
  }
})

module.exports = router
