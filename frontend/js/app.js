// app.js — inicialização e navegação

document.addEventListener('DOMContentLoaded', () => {
  // Registrar o listener do formulário SEMPRE — independente de estar logado
  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn  = document.getElementById('btn-login')
    const erro = document.getElementById('login-erro')

    btn.disabled = true
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...'
    erro.classList.add('d-none')

    const { erro: erroLogin } = await Auth.login(
      document.getElementById('email').value,
      document.getElementById('senha').value
    )

    if (erroLogin) {
      erro.textContent = erroLogin
      erro.classList.remove('d-none')
      btn.disabled = false
      btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Entrar'
      return
    }

    iniciarApp()
  })

  // Verificar sessão após registrar o listener
  if (Auth.estaLogado()) {
    iniciarApp()
  } else {
    mostrarLogin()
  }
})

function mostrarLogin() {
  document.getElementById('tela-login').classList.remove('d-none')
  document.getElementById('app').classList.add('d-none')
}

function iniciarApp() {
  document.getElementById('tela-login').classList.add('d-none')
  document.getElementById('app').classList.remove('d-none')

  const usuario = Auth.getUsuario()

  document.getElementById('info-usuario').innerHTML = `
    <strong>${usuario.nome}</strong>
    <span class="badge-perfil">${usuario.perfil}</span>
  `

  if (usuario.perfil === 'admin' || usuario.perfil === 'financeiro') {
    document.querySelectorAll('.nav-financeiro').forEach(el => el.classList.remove('d-none'))
  }
  if (usuario.perfil === 'admin') {
    document.querySelectorAll('.nav-admin').forEach(el => el.classList.remove('d-none'))
  }

  document.getElementById('btn-logout').onclick = Auth.logout

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault()
      navegarPara(item.dataset.pagina)
    })
  })

  navegarPara('dashboard')
}

function navegarPara(pagina) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.pagina === pagina)
  })

  document.querySelectorAll('.pagina').forEach(p => p.classList.add('d-none'))

  const container = document.getElementById(`pagina-${pagina}`)
  if (!container) return
  container.classList.remove('d-none')

  switch (pagina) {
    case 'dashboard':    Dashboard.renderizar(container);    break
    case 'socios':       Socios.renderizar(container);       break
    case 'mensalidades': Mensalidades.renderizar(container); break
    case 'usuarios':     Usuarios.renderizar(container);     break
  }
}
