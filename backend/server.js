require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth')
const sociosRoutes = require('./routes/socios')
const mensalidadesRoutes = require('./routes/mensalidades')
const usuariosRoutes = require('./routes/usuarios')
const dashboardRoutes = require('./routes/dashboard')
const planosRoutes = require('./routes/planos')

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares globais
app.use(cors())
app.use(express.json())

// Servir frontend estático
app.use(express.static(path.join(__dirname, '..', 'frontend')))

// Rotas da API
app.use('/auth', authRoutes)
app.use('/socios', sociosRoutes)
app.use('/mensalidades', mensalidadesRoutes)
app.use('/usuarios', usuariosRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/planos', planosRoutes)

// Rota de saúde — útil para validar se o servidor está no ar
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    ambiente: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// Qualquer rota não encontrada na API retorna 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' })
})

// Fallback para o frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'))
})

// Tratamento de erros globais
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err.message)
  const mensagem = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : err.message
  res.status(500).json({ erro: mensagem })
})

app.listen(PORT, () => {
  console.log(`\nSistema Chapecoense rodando`)
  console.log(`Ambiente : ${process.env.NODE_ENV || 'development'}`)
  console.log(`Endereço : http://localhost:${PORT}`)
  console.log(`Saúde    : http://localhost:${PORT}/health\n`)
})
