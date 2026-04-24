// mensalidades.js

const Mensalidades = (() => {
  function badgeStatus(status) {
    return `<span class="status-badge badge-${status}">${status}</span>`
  }

  async function renderizar(container) {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-title">Mensalidades</h2>
          <p class="page-subtitle">Controle de pagamentos dos sócios</p>
        </div>
      </div>
      <div class="card">
        <div class="card-header-chap">
          <i class="bi bi-cash-coin"></i> Lançamentos
        </div>
        <div class="card-body">
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <select id="filtro-status" class="form-select" style="max-width:200px">
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="paga">Paga</option>
              <option value="atrasada">Atrasada</option>
            </select>
            <button class="btn btn-chap-outline" id="btn-filtrar">
              <i class="bi bi-funnel me-1"></i>Filtrar
            </button>
          </div>
          <div id="tabela-mensalidades">
            <div class="estado-vazio"><i class="bi bi-hourglass-split"></i><p>Carregando...</p></div>
          </div>
        </div>
      </div>
    `
    document.getElementById('btn-filtrar').onclick = listar
    await listar()
  }

  async function listar() {
    const status = document.getElementById('filtro-status').value
    const url = status ? `/mensalidades?status=${status}` : '/mensalidades'
    const { dados, erro } = await API.get(url)
    const el = document.getElementById('tabela-mensalidades')

    if (erro) { el.innerHTML = `<div class="alert alert-danger">${erro}</div>`; return }
    if (!dados.length) {
      el.innerHTML = `<div class="estado-vazio"><i class="bi bi-cash-coin"></i><p>Nenhuma mensalidade encontrada.</p></div>`
      return
    }

    const podeEditar = Auth.temPerfil('admin', 'financeiro')

    el.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Sócio</th>
              <th>Plano</th>
              <th>Referência</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Pagamento</th>
              ${podeEditar ? '<th></th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${dados.map(m => `
              <tr>
                <td>${m.socio_nome}</td>
                <td>${m.plano_nome}</td>
                <td><code>${m.mes_referencia}</code></td>
                <td><strong>${parseFloat(m.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></td>
                <td>${badgeStatus(m.status)}</td>
                <td>${m.data_pagamento ? new Date(m.data_pagamento).toLocaleDateString('pt-BR') : '—'}</td>
                ${podeEditar ? `
                <td>
                  ${m.status !== 'paga' ? `
                    <button class="btn btn-sm btn-success" onclick="Mensalidades.marcarPaga(${m.id})">
                      <i class="bi bi-check-circle me-1"></i>Marcar paga
                    </button>` : ''}
                </td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="px-2 pb-1 text-muted" style="font-size:12px">${dados.length} registro(s)</div>
    `
  }

  async function marcarPaga(id) {
    const hoje = new Date().toISOString().split('T')[0]
    const { erro } = await API.put(`/mensalidades/${id}`, { status: 'paga', data_pagamento: hoje })
    if (erro) return alert(erro)
    listar()
  }

  return { renderizar, marcarPaga }
})()
