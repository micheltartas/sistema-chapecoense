// dashboard.js

const Dashboard = (() => {
  async function renderizar(container) {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-title">Dashboard</h2>
          <p class="page-subtitle">Visão geral da gestão de sócios</p>
        </div>
      </div>
      <div id="dash-conteudo">
        <div class="estado-vazio"><i class="bi bi-hourglass-split"></i><p>Carregando...</p></div>
      </div>
    `

    const { dados, erro } = await API.get('/dashboard')
    const el = document.getElementById('dash-conteudo')

    if (erro) {
      el.innerHTML = `<div class="alert alert-danger">${erro}</div>`
      return
    }

    const s = dados.socios
    const m = dados.mensalidades
    const receita = parseFloat(m.receita_mes_atual).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL'
    })

    el.innerHTML = `
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="dash-stat verde">
            <span class="dash-stat-icone"><i class="bi bi-people-fill"></i></span>
            <div class="dash-stat-valor">${s.total}</div>
            <div class="dash-stat-label">Total de sócios</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="dash-stat verde">
            <span class="dash-stat-icone"><i class="bi bi-person-check-fill"></i></span>
            <div class="dash-stat-valor">${s.ativos}</div>
            <div class="dash-stat-label">Sócios ativos</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="dash-stat vermelho">
            <span class="dash-stat-icone"><i class="bi bi-exclamation-triangle-fill"></i></span>
            <div class="dash-stat-valor">${s.inadimplentes}</div>
            <div class="dash-stat-label">Inadimplentes</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="dash-stat amarelo">
            <span class="dash-stat-icone"><i class="bi bi-clock-fill"></i></span>
            <div class="dash-stat-valor">${m.atrasadas}</div>
            <div class="dash-stat-label">Mensalidades atrasadas</div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-4">
          <div class="dash-stat cinza">
            <span class="dash-stat-icone"><i class="bi bi-cash-stack"></i></span>
            <div class="dash-stat-valor" style="font-size:20px">${receita}</div>
            <div class="dash-stat-label">Receita do mês atual</div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="card h-100">
            <div class="card-header-chap">
              <i class="bi bi-card-list"></i> Planos disponíveis
            </div>
            <div class="card-body p-0">
              <table class="table mb-0">
                <thead>
                  <tr>
                    <th>Plano</th>
                    <th>Valor mensal</th>
                  </tr>
                </thead>
                <tbody>
                  ${dados.planos.map(p => `
                    <tr>
                      <td><i class="bi bi-tag-fill text-success me-2"></i>${p.nome}</td>
                      <td><strong>${parseFloat(p.valor).toLocaleString('pt-BR', {style:'currency',currency:'BRL'})}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `
  }

  return { renderizar }
})()
