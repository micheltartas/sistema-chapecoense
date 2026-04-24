// auth.js — login, logout e controle de sessão

const Auth = (() => {
  function getUsuario() {
    const raw = localStorage.getItem('chap_usuario')
    return raw ? JSON.parse(raw) : null
  }

  function salvarSessao(token, usuario) {
    localStorage.setItem('chap_token', token)
    localStorage.setItem('chap_usuario', JSON.stringify(usuario))
  }

  function limparSessao() {
    localStorage.removeItem('chap_token')
    localStorage.removeItem('chap_usuario')
  }

  function estaLogado() {
    return !!localStorage.getItem('chap_token')
  }

  function temPerfil(...perfis) {
    const usuario = getUsuario()
    return usuario && perfis.includes(usuario.perfil)
  }

  async function login(email, senha) {
    const { dados, erro } = await API.post('/auth/login', { email, senha })
    if (erro) return { erro }
    salvarSessao(dados.token, dados.usuario)
    return { dados }
  }

  function logout() {
    limparSessao()
    location.reload()
  }

  return { login, logout, estaLogado, getUsuario, temPerfil }
})()
