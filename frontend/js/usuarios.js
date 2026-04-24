// usuarios.js

const Usuarios = (() => {
  function abrirModal(usuario = null) {
    document.getElementById('modal-usuario-overlay')?.remove()
    const titulo = usuario ? 'Editar usuário' : 'Novo usuário'
    const perfis = ['admin', 'secretaria', 'financeiro']

    const el = document.createElement('div')
    el.id = 'modal-usuario-overlay'
    el.innerHTML = `
      <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.45)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-person-gear me-2"></i>${titulo}</h5>
              <button type="button" class="btn-close" id="btn-fechar-u"></button>
            </div>
            <div class="modal-body">
              <div id="modal-u-erro" class="alert alert-danger d-none"></div>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Nome *</label>
                  <input type="text" class="form-control" id="u-nome" value="${usuario ? usuario.nome : ''}">
                </div>
                <div class="col-12">
                  <label class="form-label">E-mail *</label>
                  <input type="email" class="form-control" id="u-email" value="${usuario ? usuario.email : ''}">
                </div>
                <div class="col-12">
                  <label class="form-label">${usuario ? 'Nova senha (deixe vazio para manter)' : 'Senha *'}</label>
                  <input type="password" class="form-control" id="u-senha" placeholder="••••••••">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Perfil *</label>
                  <select class="form-select" id="u-perfil">
                    ${perfis.map(p => `<option value="${p}" ${usuario && usuario.perfil === p ? 'selected' : ''}>${p}</option>`).join('')}
                  </select>
                </div>
                ${usuario ? `
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="u-ativo">
                    <option value="true"  ${usuario.ativo ? 'selected' : ''}>Ativo</option>
                    <option value="false" ${!usuario.ativo ? 'selected' : ''}>Inativo</option>
                  </select>
                </div>` : ''}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" id="btn-cancelar-u">Cancelar</button>
              <button class="btn btn-chap" id="btn-salvar-u">
                <i class="bi bi-check-lg me-1"></i>Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(el)

    const fechar = () => el.remove()
    document.getElementById('btn-fechar-u').onclick = fechar
    document.getElementById('btn-cancelar-u').onclick = fechar
    el.querySelector('.modal').addEventListener('click', e => { if (e.target === e.currentTarget) fechar() })

    document.getElementById('btn-salvar-u').onclick = async () => {
      const body = {
        nome:   document.getElementById('u-nome').value.trim(),
        email:  document.getElementById('u-email').value.trim(),
        perfil: document.getElementById('u-perfil').value,
      }
      const senha = document.getElementById('u-senha').value
      if (senha) body.senha = senha
      if (usuario) body.ativo = document.getElementById('u-ativo').value === 'true'

      const { erro } = usuario
        ? await API.put(`/usuarios/${usuario.id}`, body)
        : await API.post('/usuarios', body)

      if (erro) {
        const erroEl = document.getElementById('modal-u-erro')
        erroEl.textContent = erro
        erroEl.classList.remove('d-none')
        return
      }
      fechar()
      renderizar(document.getElementById('pagina-usuarios'))
    }
  }

  async function renderizar(container) {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-title">Usuários do sistema</h2>
          <p class="page-subtitle">Gerenciamento de acessos e perfis</p>
        </div>
        <button class="btn btn-chap" id="btn-novo-usuario">
          <i class="bi bi-person-plus-fill me-2"></i>Novo usuário
        </button>
      </div>
      <div class="card">
        <div class="card-header-chap">
          <i class="bi bi-person-gear"></i> Usuários cadastrados
        </div>
        <div class="card-body p-0">
          <div id="tabela-usuarios">
            <div class="estado-vazio"><i class="bi bi-hourglass-split"></i><p>Carregando...</p></div>
          </div>
        </div>
      </div>
    `
    document.getElementById('btn-novo-usuario').onclick = () => abrirModal()
    await listar()
  }

  async function listar() {
    const { dados, erro } = await API.get('/usuarios')
    const el = document.getElementById('tabela-usuarios')

    if (erro) { el.innerHTML = `<div class="alert alert-danger m-3">${erro}</div>`; return }
    if (!dados.length) {
      el.innerHTML = `<div class="estado-vazio"><i class="bi bi-people"></i><p>Nenhum usuário encontrado.</p></div>`
      return
    }

    el.innerHTML = `
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${dados.map(u => `
              <tr>
                <td><i class="bi bi-person-circle text-secondary me-2"></i>${u.nome}</td>
                <td>${u.email}</td>
                <td><span class="status-badge badge-${u.perfil}">${u.perfil}</span></td>
                <td><span class="status-badge ${u.ativo ? 'badge-ativo' : 'badge-inativo'}">${u.ativo ? 'ativo' : 'inativo'}</span></td>
                <td>
                  <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-secondary" onclick="Usuarios.editar(${u.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="Usuarios.excluir(${u.id}, '${u.nome}')"><i class="bi bi-trash"></i></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  async function editar(id) {
    const { dados, erro } = await API.get('/usuarios')
    if (erro) return alert(erro)
    const usuario = dados.find(u => u.id === id)
    if (usuario) abrirModal(usuario)
  }

  async function excluir(id, nome) {
    if (!confirm(`Remover o usuário "${nome}"?`)) return
    const { erro } = await API.delete(`/usuarios/${id}`)
    if (erro) return alert(erro)
    renderizar(document.getElementById('pagina-usuarios'))
  }

  return { renderizar, editar, excluir }
})()
