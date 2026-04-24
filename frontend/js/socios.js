// socios.js

const Socios = (() => {
  let planos = []

  async function carregarPlanos() {
    const { dados } = await API.get('/planos')
    planos = dados || []
  }

  function badgeStatus(status) {
    return `<span class="status-badge badge-${status}">${status}</span>`
  }

  function abrirModal(socio = null) {
    document.getElementById('modal-socio-overlay')?.remove()

    const titulo = socio ? 'Editar sócio' : 'Novo sócio'
    const opcoesPlanos = planos.map(p =>
      `<option value="${p.id}" ${socio && socio.plano_id === p.id ? 'selected' : ''}>${p.nome}</option>`
    ).join('')
    const opcoesStatus = ['ativo','inativo','inadimplente'].map(s =>
      `<option value="${s}" ${socio && socio.status === s ? 'selected' : ''}>${s}</option>`
    ).join('')

    const el = document.createElement('div')
    el.id = 'modal-socio-overlay'
    el.innerHTML = `
      <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.45)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-person-plus me-2"></i>${titulo}</h5>
              <button type="button" class="btn-close" id="btn-fechar-socio"></button>
            </div>
            <div class="modal-body">
              <div id="modal-socio-erro" class="alert alert-danger d-none"></div>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Nome *</label>
                  <input type="text" class="form-control" id="s-nome" value="${socio ? socio.nome : ''}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">CPF *</label>
                  <input type="text" class="form-control" id="s-cpf" value="${socio ? socio.cpf : ''}" placeholder="000.000.000-00" ${socio ? 'disabled' : ''}>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Telefone</label>
                  <input type="text" class="form-control" id="s-telefone" value="${socio && socio.telefone ? socio.telefone : ''}" placeholder="(49) 99999-0000">
                </div>
                <div class="col-md-8">
                  <label class="form-label">E-mail</label>
                  <input type="email" class="form-control" id="s-email" value="${socio && socio.email ? socio.email : ''}">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Nascimento</label>
                  <input type="date" class="form-control" id="s-nascimento" value="${socio && socio.data_nascimento ? socio.data_nascimento.split('T')[0] : ''}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Plano *</label>
                  <select class="form-select" id="s-plano">${opcoesPlanos}</select>
                </div>
                ${socio ? `
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="s-status">${opcoesStatus}</select>
                </div>` : ''}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" id="btn-cancelar-socio">Cancelar</button>
              <button class="btn btn-chap" id="btn-salvar-socio">
                <i class="bi bi-check-lg me-1"></i>Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(el)

    const fechar = () => el.remove()
    document.getElementById('btn-fechar-socio').onclick = fechar
    document.getElementById('btn-cancelar-socio').onclick = fechar
    el.querySelector('.modal').addEventListener('click', e => { if (e.target === e.currentTarget) fechar() })

    document.getElementById('btn-salvar-socio').onclick = async () => {
      const body = {
        nome:            document.getElementById('s-nome').value.trim(),
        email:           document.getElementById('s-email').value.trim() || null,
        telefone:        document.getElementById('s-telefone').value.trim() || null,
        data_nascimento: document.getElementById('s-nascimento').value || null,
        plano_id:        parseInt(document.getElementById('s-plano').value),
      }
      if (!socio) body.cpf = document.getElementById('s-cpf').value.trim()
      if (socio)  body.status = document.getElementById('s-status').value

      const { erro } = socio
        ? await API.put(`/socios/${socio.id}`, body)
        : await API.post('/socios', body)

      if (erro) {
        const erroEl = document.getElementById('modal-socio-erro')
        erroEl.textContent = erro
        erroEl.classList.remove('d-none')
        return
      }
      fechar()
      renderizar(document.getElementById('pagina-socios'))
    }
  }

  async function renderizar(container) {
    await carregarPlanos()
    const podeEditar = Auth.temPerfil('admin', 'secretaria')

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-title">Sócios</h2>
          <p class="page-subtitle">Cadastro e gestão de sócios do clube</p>
        </div>
        ${podeEditar ? `
        <button class="btn btn-chap" id="btn-novo-socio">
          <i class="bi bi-person-plus-fill me-2"></i>Novo sócio
        </button>` : ''}
      </div>

      <div class="card">
        <div class="card-header-chap">
          <i class="bi bi-people-fill"></i> Lista de sócios
        </div>
        <div class="card-body">
          <div class="busca-wrapper">
            <input type="text" class="form-control" id="busca-socio" placeholder="Buscar por nome ou CPF...">
            <button class="btn btn-chap-outline" id="btn-buscar">
              <i class="bi bi-search"></i>
            </button>
          </div>
          <div id="tabela-socios">
            <div class="estado-vazio"><i class="bi bi-hourglass-split"></i><p>Carregando...</p></div>
          </div>
        </div>
      </div>
    `

    if (podeEditar) {
      document.getElementById('btn-novo-socio').onclick = () => abrirModal()
    }
    document.getElementById('btn-buscar').onclick = buscar
    document.getElementById('busca-socio').addEventListener('keydown', e => {
      if (e.key === 'Enter') buscar()
    })

    await listarTodos()
  }

  async function buscar() {
    const q = document.getElementById('busca-socio').value.trim()
    if (!q) return listarTodos()
    const { dados, erro } = await API.get(`/socios/busca?q=${encodeURIComponent(q)}`)
    renderTabela(dados || [], erro)
  }

  async function listarTodos() {
    const { dados, erro } = await API.get('/socios')
    renderTabela(dados || [], erro)
  }

  function renderTabela(lista, erro) {
    const el = document.getElementById('tabela-socios')
    if (erro) { el.innerHTML = `<div class="alert alert-danger">${erro}</div>`; return }
    if (!lista.length) {
      el.innerHTML = `<div class="estado-vazio"><i class="bi bi-person-x"></i><p>Nenhum sócio encontrado.</p></div>`
      return
    }

    const podeEditar  = Auth.temPerfil('admin', 'secretaria')
    const podeExcluir = Auth.temPerfil('admin')

    el.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Cadastro</th>
              ${(podeEditar || podeExcluir) ? '<th></th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${lista.map(s => `
              <tr>
                <td><i class="bi bi-person-circle text-secondary me-2"></i>${s.nome}</td>
                <td><code>${s.cpf}</code></td>
                <td>${s.plano || '—'}</td>
                <td>${badgeStatus(s.status)}</td>
                <td>${s.data_cadastro ? new Date(s.data_cadastro).toLocaleDateString('pt-BR') : '—'}</td>
                ${(podeEditar || podeExcluir) ? `
                <td>
                  <div class="d-flex gap-1">
                    ${podeEditar ? `<button class="btn btn-sm btn-outline-secondary" onclick="Socios.editar(${s.id})"><i class="bi bi-pencil"></i></button>` : ''}
                    ${podeExcluir ? `<button class="btn btn-sm btn-outline-danger" onclick="Socios.excluir(${s.id}, '${s.nome}')"><i class="bi bi-trash"></i></button>` : ''}
                  </div>
                </td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="px-2 pb-1 text-muted" style="font-size:12px">${lista.length} registro(s) encontrado(s)</div>
    `
  }

  async function editar(id) {
    const { dados, erro } = await API.get(`/socios/${id}`)
    if (erro) return alert(erro)
    abrirModal(dados)
  }

  async function excluir(id, nome) {
    if (!confirm(`Remover o sócio "${nome}"? Esta ação não pode ser desfeita.`)) return
    const { erro } = await API.delete(`/socios/${id}`)
    if (erro) return alert(erro)
    renderizar(document.getElementById('pagina-socios'))
  }

  return { renderizar, editar, excluir }
})()
