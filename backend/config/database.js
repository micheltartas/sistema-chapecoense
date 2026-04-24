const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
})

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Conectado ao banco de dados PostgreSQL')
  }
})

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do banco de dados:', err.message)
  process.exit(1)
})

module.exports = pool
