// scripts/migrar-socios-csv.js
// -------------------------------------------------------
// Script de migração de sócios a partir de arquivo CSV
// Usado no exercício do Módulo V — Migração de dados
//
// Uso:
//   node scripts/migrar-socios-csv.js scripts/socios-planilha.csv
// -------------------------------------------------------

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

// Lê o CSV manualmente (sem dependência extra)
function lerCSV(caminho) {
  const conteudo = fs.readFileSync(caminho, 'utf-8')
  const linhas = conteudo.trim().split('\n')
  const cabecalho = linhas[0].split(',').map(c => c.trim().replace(/"/g, ''))

  return linhas.slice(1).map(linha => {
    const valores = linha.split(',').map(v => v.trim().replace(/"/g, ''))
    const obj = {}
    cabecalho.forEach((col, i) => {
      obj[col] = valores[i] || ''
    })
    return obj
  })
}

// Tenta converter data do formato DD/MM/YYYY para YYYY-MM-DD
function converterData(str) {
  if (!str) return null
  const partes = str.split('/')
  if (partes.length === 3) {
    const [dia, mes, ano] = partes
    const data = new Date(`${ano}-${mes}-${dia}`)
    if (!isNaN(data.getTime())) return `${ano}-${mes}-${dia}`
  }
  return null
}

// Normaliza CPF removendo pontos e traços
function normalizarCPF(cpf) {
  return cpf ? cpf.replace(/[^\d]/g, '') : ''
}

async function migrar(arquivoCSV) {
  if (!arquivoCSV) {
    console.error('Uso: node scripts/migrar-socios-csv.js <caminho-do-csv>')
    process.exit(1)
  }

  if (!fs.existsSync(arquivoCSV)) {
    console.error(`Arquivo não encontrado: ${arquivoCSV}`)
    process.exit(1)
  }

  // Buscar planos disponíveis
  const planosResult = await pool.query('SELECT id, nome FROM planos WHERE ativo = true')
  const planos = planosResult.rows
  const planoMap = {}
  planos.forEach(p => { planoMap[p.nome.toLowerCase()] = p.id })

  console.log(`Planos disponíveis: ${planos.map(p => p.nome).join(', ')}\n`)

  const registros = lerCSV(arquivoCSV)
  console.log(`Total de registros no CSV: ${registros.length}\n`)

  let sucesso = 0
  let falha = 0
  const erros = []

  for (const reg of registros) {
    const cpfLimpo = normalizarCPF(reg.cpf)

    // Validações básicas
    if (!reg.nome || !cpfLimpo) {
      erros.push({ registro: reg, motivo: 'Nome ou CPF ausente' })
      falha++
      continue
    }

    if (cpfLimpo.length !== 11) {
      erros.push({ registro: reg, motivo: `CPF inválido: "${reg.cpf}"` })
      falha++
      continue
    }

    // Resolver plano
    const planoNome = (reg.plano || '').toLowerCase()
    let planoId = planoMap[planoNome]
    if (!planoId) {
      // Tenta encontrar por correspondência parcial
      const chave = Object.keys(planoMap).find(k => k.includes(planoNome) || planoNome.includes(k))
      planoId = chave ? planoMap[chave] : planos[0].id // fallback para o primeiro plano
    }

    const dataNascimento = converterData(reg.data_nascimento)

    try {
      // Verifica se CPF já existe
      const existe = await pool.query('SELECT id FROM socios WHERE cpf = $1', [cpfLimpo])
      if (existe.rows.length > 0) {
        erros.push({ registro: reg, motivo: 'CPF já cadastrado no sistema' })
        falha++
        continue
      }

      await pool.query(
        `INSERT INTO socios (nome, cpf, email, telefone, data_nascimento, plano_id, status, data_cadastro)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          reg.nome.trim(),
          cpfLimpo,
          reg.email || null,
          reg.telefone || null,
          dataNascimento,
          planoId,
          reg.status || 'ativo',
          converterData(reg.data_cadastro) || new Date().toISOString().split('T')[0],
        ]
      )
      sucesso++
    } catch (err) {
      erros.push({ registro: reg, motivo: err.message })
      falha++
    }
  }

  // Relatório
  console.log('─'.repeat(50))
  console.log('RELATÓRIO DE MIGRAÇÃO')
  console.log('─'.repeat(50))
  console.log(`✅ Migrados com sucesso : ${sucesso}`)
  console.log(`❌ Com falha            : ${falha}`)
  console.log(`📊 Total processado     : ${registros.length}`)

  if (erros.length > 0) {
    const arquivoErros = path.join(path.dirname(arquivoCSV), 'erros_migracao.json')
    fs.writeFileSync(arquivoErros, JSON.stringify(erros, null, 2))
    console.log(`\n⚠️  Detalhes dos erros salvos em: ${arquivoErros}`)
    console.log('\nPrimeiros erros encontrados:')
    erros.slice(0, 5).forEach(e => {
      console.log(`   - ${e.registro.nome || '(sem nome)'} : ${e.motivo}`)
    })
  }

  console.log('─'.repeat(50))
  await pool.end()
}

const arquivoCSV = process.argv[2]
migrar(arquivoCSV).catch(err => {
  console.error('Erro fatal na migração:', err.message)
  process.exit(1)
})
