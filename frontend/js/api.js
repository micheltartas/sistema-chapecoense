// api.js — cliente HTTP para a API REST
// Todas as funções retornam { dados, erro }

const API = (() => {
  function getToken() {
    return localStorage.getItem('chap_token')
  }

  function headers() {
    const token = getToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  async function request(method, url, body = null) {
    try {
      const opcoes = { method, headers: headers() }
      if (body) opcoes.body = JSON.stringify(body)

      const res = await fetch(url, opcoes)
      const json = await res.json()

      if (!res.ok) {
        return { dados: null, erro: json.erro || `Erro ${res.status}` }
      }
      return { dados: json, erro: null }
    } catch (err) {
      return { dados: null, erro: 'Não foi possível conectar ao servidor' }
    }
  }

  return {
    get:    (url)        => request('GET',    url),
    post:   (url, body)  => request('POST',   url, body),
    put:    (url, body)  => request('PUT',    url, body),
    delete: (url)        => request('DELETE', url),
    getToken,
  }
})()
