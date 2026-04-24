require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
})

async function runMigrations() {
  console.log('Iniciando migrations...\n')

  // Criar tabela de controle de migrations
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL PRIMARY KEY,
      arquivo    VARCHAR(255) NOT NULL UNIQUE,
      executada_em TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  const migrationDir = path.join(__dirname)
  const arquivos = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const arquivo of arquivos) {
    const jaExecutada = await pool.query(
      'SELECT id FROM _migrations WHERE arquivo = $1',
      [arquivo]
    )

    if (jaExecutada.rows.length > 0) {
      console.log(`⏭  ${arquivo} — já executada, pulando`)
      continue
    }

    const sql = fs.readFileSync(path.join(migrationDir, arquivo), 'utf-8')
    try {
      await pool.query(sql)
      await pool.query('INSERT INTO _migrations (arquivo) VALUES ($1)', [arquivo])
      console.log(`✅ ${arquivo} — executada com sucesso`)
    } catch (err) {
      console.error(`❌ ${arquivo} — ERRO: ${err.message}`)
      process.exit(1)
    }
  }

  console.log('\nMigrations concluídas.')
  await pool.end()
}

runMigrations().catch(err => {
  console.error('Erro fatal nas migrations:', err.message)
  process.exit(1)
})
