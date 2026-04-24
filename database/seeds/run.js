require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const bcrypt = require('bcryptjs')
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
})

async function seed() {
  console.log('Inserindo dados iniciais...\n')

  // Planos
  await pool.query(`
    INSERT INTO planos (nome, valor, descricao) VALUES
      ('Sócio Torcedor', 30.00, 'Plano básico — acesso a promoções e descontos em ingressos'),
      ('Sócio Campeão',  60.00, 'Plano completo — ingresso garantido em jogos e benefícios exclusivos')
    ON CONFLICT DO NOTHING
  `)
  console.log('✅ Planos inseridos')

  // Usuário admin
  const senhaAdmin = await bcrypt.hash('admin123', 10)
  await pool.query(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES
      ('Administrador', 'admin@chapecoense.com', $1, 'admin')
    ON CONFLICT (email) DO NOTHING
  `, [senhaAdmin])
  console.log('✅ Usuário admin criado')

  // Usuário secretaria
  const senhaSecretaria = await bcrypt.hash('secretaria123', 10)
  await pool.query(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES
      ('Cláudia Silva', 'claudia@chapecoense.com', $1, 'secretaria')
    ON CONFLICT (email) DO NOTHING
  `, [senhaSecretaria])
  console.log('✅ Usuário secretaria criado (Cláudia)')

  // Usuário financeiro
  const senhaFinanceiro = await bcrypt.hash('financeiro123', 10)
  await pool.query(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES
      ('Rafael Souza', 'rafael@chapecoense.com', $1, 'financeiro')
    ON CONFLICT (email) DO NOTHING
  `, [senhaFinanceiro])
  console.log('✅ Usuário financeiro criado (Rafael)')

  // Sócios de exemplo
  const planos = await pool.query('SELECT id FROM planos ORDER BY valor LIMIT 2')
  const planoTorcedor = planos.rows[0].id
  const planoCampeao = planos.rows[1].id

  await pool.query(`
    INSERT INTO socios (nome, cpf, email, telefone, data_nascimento, plano_id, status, data_cadastro) VALUES
      ('Ana Paula Rodrigues',  '111.222.333-44', 'ana@email.com',    '(49) 99801-1111', '1990-03-15', $1, 'ativo',        '2022-01-10'),
      ('Bruno Costa Lima',     '222.333.444-55', 'bruno@email.com',  '(49) 99801-2222', '1985-07-22', $2, 'ativo',        '2022-02-05'),
      ('Carla Mendes Souza',   '333.444.555-66', 'carla@email.com',  '(49) 99801-3333', '1995-11-30', $1, 'inadimplente', '2021-06-20'),
      ('Diego Ferreira Neto',  '444.555.666-77', NULL,               '(49) 99801-4444', '1988-04-08', $2, 'ativo',        '2023-03-01'),
      ('Elisa Gomes Pereira',  '555.666.777-88', 'elisa@email.com',  '(49) 99801-5555', '2000-09-14', $1, 'inativo',      '2020-11-15')
    ON CONFLICT (cpf) DO NOTHING
  `, [planoTorcedor, planoCampeao])
  console.log('✅ Sócios de exemplo inseridos')

  console.log('\nDados iniciais inseridos com sucesso.')
  console.log('\nCredenciais de acesso:')
  console.log('  Admin      : admin@chapecoense.com  / admin123')
  console.log('  Secretaria : claudia@chapecoense.com / secretaria123')
  console.log('  Financeiro : rafael@chapecoense.com  / financeiro123')

  await pool.end()
}

seed().catch(err => {
  console.error('Erro no seed:', err.message)
  process.exit(1)
})
