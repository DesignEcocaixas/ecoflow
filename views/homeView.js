// views/homeView.js
const menuLateral = require("./menuLateral");

function homeView(usuario, notificacoes = [], dashboard = {}) {
  const qtdNotificacoes = notificacoes.length;

  const fmtData = (data) => {
    if (!data) return "-";
    try {
      return new Date(data).toLocaleDateString("pt-BR");
    } catch {
      return "-";
    }
  };

  const fmtDataHora = (data) => {
    if (!data) return "-";
    try {
      return new Date(data).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
      });
    } catch {
      return "-";
    }
  };

  const fmtMoeda = (valor) => {
    const numero = Number(valor || 0);
    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const badgeStatusEntrega = (status) => {
    if (status === "ENTREGUE") {
      return `<span class="badge bg-success" style="font-size:0.7rem;">ENTREGUE</span>`;
    }
    if (status === "NA_ROTA") {
      return `<span class="badge bg-warning text-dark" style="font-size:0.7rem;">NA ROTA</span>`;
    }
    if (status === "NAO_ENTREGUE") {
      return `<span class="badge bg-danger" style="font-size:0.7rem;">NÃO ENTREGUE</span>`;
    }
    return `<span class="badge bg-secondary" style="font-size:0.7rem;">${status || "SEM STATUS"}</span>`;
  };

  const veiculos = Array.isArray(dashboard.veiculos) ? dashboard.veiculos : [];
  const checklists = Array.isArray(dashboard.checklists) ? dashboard.checklists : [];
  const precos = Array.isArray(dashboard.precos) ? dashboard.precos : [];
  const rota = dashboard.rota || null;
  const rotaClientes = Array.isArray(rota?.clientes) ? rota.clientes : [];

  // Dados para o Gráfico Mensal e Select vindos do backend
  const graficoMensal = dashboard.graficoMensal || { labels: [], data: [], ranking: {} };
  const mesesDisponiveis = Array.isArray(dashboard.mesesDisponiveis) ? dashboard.mesesDisponiveis : [];
  const mesSelecionado = dashboard.mesSelecionado || { mes: new Date().getMonth() + 1, ano: new Date().getFullYear(), modo: 'diario' };
  const modoVisao = mesSelecionado.modo || 'diario';

  // --- COMPONENTES DO DASHBOARD (Listas) ---
  const cardsManutencao = veiculos.length
    ? veiculos.slice(0, 3).map((v, i) => `
        <div class="card chk-item border-0 shadow-sm mb-2" data-bs-toggle="modal" data-bs-target="#modalManutencao${i}" style="cursor:pointer;">
          <div class="card-body p-2 px-3 d-flex justify-content-between align-items-center">
            <div class="text-truncate me-3" style="max-width: 85%;">
              <span class="d-block fw-bold text-dark text-truncate" style="font-size: 0.85rem;">${v.marca || "-"} ${v.modelo || "-"}</span>
              <div class="d-flex gap-3 text-muted mt-1" style="font-size: 0.75rem;">
                <span class="text-truncate"><i class="fa-solid fa-wrench me-1"></i> ${v.servico || "Sem manutenção"}</span>
                <span><i class="fa-regular fa-calendar me-1"></i> ${v.data_servico ? fmtData(v.data_servico) : "-"}</span>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-primary opacity-50" style="font-size:0.8rem;"></i>
          </div>
        </div>
      `).join("")
    : `<div class="text-center text-muted p-3" style="font-size:0.85rem;"><i class="fa-solid fa-inbox mb-2 fa-2x opacity-25"></i><br>Sem dados</div>`;

  const cardsChecklist = checklists.length
    ? checklists.slice(0, 3).map((c, i) => `
        <div class="card chk-item border-0 shadow-sm mb-2" data-bs-toggle="modal" data-bs-target="#modalChecklist${i}" style="cursor:pointer; border-left-color: #0d6efd !important;">
          <div class="card-body p-2 px-3 d-flex justify-content-between align-items-center">
            <div class="text-truncate me-3" style="max-width: 85%;">
              <span class="d-block fw-bold text-dark text-truncate" style="font-size: 0.85rem;">Motorista: ${c.motorista || "-"}</span>
              <div class="d-flex gap-3 text-muted mt-1" style="font-size: 0.75rem;">
                <span class="text-truncate"><i class="fa-solid fa-car-side me-1"></i> ${c.veiculo || "-"}</span>
                <span><i class="fa-regular fa-clock me-1"></i> ${fmtData(c.criado_em)}</span>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-primary opacity-50" style="font-size:0.8rem;"></i>
          </div>
        </div>
      `).join("")
    : `<div class="text-center text-muted p-3" style="font-size:0.85rem;"><i class="fa-solid fa-inbox mb-2 fa-2x opacity-25"></i><br>Sem dados</div>`;

  const cardsPrecos = precos.length
    ? precos.slice(0, 3).map((p, i) => `
        <div class="card chk-item border-0 shadow-sm mb-2" data-bs-toggle="modal" data-bs-target="#modalPreco${i}" style="cursor:pointer; border-left-color: #198754 !important;">
          <div class="card-body p-2 px-3 d-flex justify-content-between align-items-center">
            <div class="text-truncate me-3" style="max-width: 85%;">
              <span class="d-block fw-bold text-dark text-truncate" style="font-size: 0.85rem;">Modelo: ${p.modelo || "-"}</span>
              <div class="d-flex gap-3 text-muted mt-1" style="font-size: 0.75rem;">
                <span class="text-truncate"><i class="fa-solid fa-user-pen me-1"></i> ${p.atualizado_por || "-"}</span>
                <span><i class="fa-solid fa-clock-rotate-left me-1"></i> ${fmtDataHora(p.atualizado_em)}</span>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-primary opacity-50" style="font-size:0.8rem;"></i>
          </div>
        </div>
      `).join("")
    : `<div class="text-center text-muted p-3" style="font-size:0.85rem;"><i class="fa-solid fa-inbox mb-2 fa-2x opacity-25"></i><br>Sem dados</div>`;

  const cardRota = rota
    ? `
      <div class="card chk-item border-0 shadow-sm mb-2" data-bs-toggle="modal" data-bs-target="#modalRota" style="cursor:pointer; border-left-color: #ffc107 !important;">
        <div class="card-body p-2 px-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="text-truncate me-3">
              <span class="d-block fw-bold text-dark text-truncate" style="font-size: 0.85rem;">${rota.titulo || "-"}</span>
              <span class="text-muted" style="font-size: 0.75rem;"><i class="fa-regular fa-calendar me-1"></i> ${fmtData(rota.data_pedido)}</span>
            </div>
            <i class="fa-solid fa-chevron-right text-primary opacity-50" style="font-size:0.8rem;"></i>
          </div>
          <div class="bg-light rounded p-2 border">
            ${(rotaClientes.slice(0, 3)).map(c => `
              <div class="d-flex align-items-center justify-content-between border-bottom pb-1 mb-1 last-border-0">
                <span class="text-truncate" style="font-size:0.75rem; max-width:70%;">${c.cliente_nome || "-"}</span>
                ${badgeStatusEntrega(c.status)}
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `
    : `<div class="text-center text-muted p-3" style="font-size:0.85rem;"><i class="fa-solid fa-inbox mb-2 fa-2x opacity-25"></i><br>Sem rotas</div>`;

  // --- MONTAGEM DOS ITENS DO CAROUSEL ---
  const carouselItemsHTML = [
    `
    <div class="carousel-item active h-100">
      <h6 class="dashboard-title"><i class="fa-solid fa-wrench"></i> Últimas Manutenções</h6>
      ${cardsManutencao}
    </div>
    `,
    `
    <div class="carousel-item h-100">
      <h6 class="dashboard-title"><i class="fa-solid fa-clipboard-list"></i> Últimos Checklists</h6>
      ${cardsChecklist}
    </div>
    `
  ];

  if (usuario.tipo_usuario !== "motorista") {
    carouselItemsHTML.push(`
    <div class="carousel-item h-100">
      <h6 class="dashboard-title"><i class="fa-solid fa-tags"></i> Atualizações de Preço</h6>
      ${cardsPrecos}
    </div>
    `);
  }

  carouselItemsHTML.push(`
    <div class="carousel-item h-100">
      <h6 class="dashboard-title"><i class="fa-solid fa-truck-fast"></i> Última Rota</h6>
      ${cardRota}
    </div>
  `);

  const carouselIndicators = carouselItemsHTML.map((_, index) => 
    `<button type="button" data-bs-target="#dashboardCarousel" data-bs-slide-to="${index}" class="${index === 0 ? 'active' : ''}" aria-current="${index === 0 ? 'true' : 'false'}"></button>`
  ).join('');

  // --- MONTAGEM DO SELECT DE MESES ---
  let selectMesesHTML = `<select id="selectMesDashboard" class="form-select form-select-sm w-auto bg-primary text-white border-0 shadow-sm fw-bold px-3 py-2" style="border-radius: 20px; cursor: pointer;" onchange="mudarFiltroDashboard(null, this.value)">`;
  
  if (mesesDisponiveis.length === 0) {
      const mesAtualStr = new Date().toLocaleString('pt-BR', { month: 'long' });
      const labelFallback = (mesAtualStr.charAt(0).toUpperCase() + mesAtualStr.slice(1)) + ' ' + new Date().getFullYear();
      selectMesesHTML += `<option value="">${labelFallback}</option>`;
  } else {
      mesesDisponiveis.forEach(m => {
          const isSelected = (m.mes == mesSelecionado.mes && m.ano == mesSelecionado.ano) ? "selected" : "";
          selectMesesHTML += `<option value="${m.mes}-${m.ano}" ${isSelected}>${m.label}</option>`;
      });
  }
  selectMesesHTML += `</select>`;

  // --- MODAIS DO DASHBOARD ---
  const modaisManutencao = veiculos.length
    ? veiculos.slice(0, 3).map((v, i) => `
        <div class="modal fade" id="modalManutencao${i}" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content erp-modal">
              <div class="modal-header">
                <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-wrench me-2 text-primary"></i> Detalhes da Manutenção</h6>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body text-sm">
                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Veículo</span>
                    <span class="fw-medium">${v.marca || "-"} ${v.modelo || "-"}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Ano / KM Atual</span>
                    <span class="fw-medium">${v.ano || "-"} / ${v.km || "-"} km</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Data do Serviço</span>
                    <span class="fw-medium">${fmtData(v.data_servico)}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">KM do Serviço</span>
                    <span class="fw-medium">${v.km_servico || "-"} km</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Oficina / Mecânico</span>
                    <span class="fw-medium">${v.oficina || "-"} / ${v.mecanico || "-"}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Valor</span>
                    <span class="fw-bold text-success">${fmtMoeda(v.valor)}</span>
                  </div>
                </div>
                <div class="p-2 bg-light rounded border mb-3">
                  <span class="text-muted d-block mb-1" style="font-size:0.75rem;">Serviço Realizado</span>
                  ${(v.servico || "-").replace(/\n/g, "<br>")}
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <span class="text-muted d-block" style="font-size:0.75rem;">Atualizado por</span>
                    <span class="fw-medium" style="font-size:0.8rem;">${v.atualizado_por || "-"}</span>
                  </div>
                  <div>
                  ${v.documento
                      ? `<a href="/uploads/${v.documento}" target="_blank" class="btn btn-sm btn-outline-success">
                          <i class="fa-solid fa-paperclip me-1"></i>Ver Documento
                         </a>`
                      : `<span class="text-muted" style="font-size:0.8rem;"><i class="fa-solid fa-file-excel me-1"></i>Sem anexo</span>`
                  }
                  </div>
                </div>
              </div>
              <div class="modal-footer bg-light">
                <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      `).join("") : "";

  const modaisChecklist = checklists.length
    ? checklists.slice(0, 3).map((c, i) => `
        <div class="modal fade" id="modalChecklist${i}" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content erp-modal">
              <div class="modal-header">
                <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-clipboard-check me-2 text-primary"></i> Detalhes do Checklist</h6>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body text-sm">
                <div class="row g-2 mb-3">
                  <div class="col-12 col-md-4">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Motorista / Veículo</span>
                    <span class="fw-bold">${c.motorista || "-"} / ${c.veiculo || "-"}</span>
                  </div>
                  <div class="col-6 col-md-4">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Registrado em</span>
                    <span class="fw-medium">${fmtDataHora(c.criado_em)}</span>
                  </div>
                  <div class="col-6 col-md-4">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Responsável Lógistico</span>
                    <span class="fw-medium">${c.responsavel || "-"}</span>
                  </div>
                </div>
                
                <h6 class="fw-bold mt-3 mb-2" style="font-size:0.85rem; color:#0D5749;">Itens Inspecionados</h6>
                <div class="row g-2 bg-light p-2 rounded border mb-3">
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.7rem;">Óleo</span><span class="fw-medium" style="font-size:0.8rem;">${c.oleo || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.7rem;">Água Radiador</span><span class="fw-medium" style="font-size:0.8rem;">${c.agua || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.7rem;">Fluído Freio</span><span class="fw-medium" style="font-size:0.8rem;">${c.freio || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.7rem;">Direção Hidráulica</span><span class="fw-medium" style="font-size:0.8rem;">${c.direcao || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.7rem;">Combustível</span><span class="fw-medium" style="font-size:0.8rem;">${c.combustivel || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.7rem;">Pneu (Calibragem)</span><span class="fw-medium" style="font-size:0.8rem;">${c.pneu_calibragem || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.7rem;">Pneu (Estado)</span><span class="fw-medium" style="font-size:0.8rem;">${c.pneu_estado || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.7rem;">Luzes</span><span class="fw-medium" style="font-size:0.8rem;">${c.luzes || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.7rem;">Ruídos</span><span class="fw-medium" style="font-size:0.8rem;">${c.ruidos || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.7rem;">Lixo Interno</span><span class="fw-medium" style="font-size:0.8rem;">${c.lixo || "-"}</span></div>
                </div>

                <div class="row g-2">
                  <div class="col-12 col-md-8">
                    <span class="text-muted d-block mb-1" style="font-size:0.75rem;">Observação</span>
                    <div class="p-2 bg-light rounded border" style="font-size:0.8rem; min-height:40px;">
                      ${c.observacao ? c.observacao.replace(/\n/g, "<br>") : "<em class='text-muted'>Sem observação</em>"}
                    </div>
                  </div>
                  <div class="col-12 col-md-4 d-flex align-items-end justify-content-md-end mt-2 mt-md-0">
                    ${c.foto
                        ? `<a href="/uploads/${c.foto}" target="_blank" class="btn btn-sm btn-outline-success w-100">
                            <i class="fa-solid fa-image me-1"></i>Ver Foto Anexa
                           </a>`
                        : `<span class="text-muted w-100 text-center p-2 border rounded" style="font-size:0.8rem;"><i class="fa-solid fa-image-slash me-1"></i>Sem foto</span>`
                    }
                  </div>
                </div>
              </div>
              <div class="modal-footer bg-light">
                <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      `).join("") : "";

  const modaisPrecos = precos.length
    ? precos.slice(0, 3).map((p, i) => `
        <div class="modal fade" id="modalPreco${i}" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content erp-modal">
              <div class="modal-header">
                <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-tags me-2 text-success"></i> Detalhes do Preço</h6>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body text-sm">
                <div class="row g-2">
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Código</span>
                    <span class="fw-medium">${p.codigo || "-"}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Modelo</span>
                    <span class="fw-bold">${p.modelo || "-"}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Preço Parda</span>
                    <span class="fw-bold text-dark">${fmtMoeda(p.preco_parda)}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Preço Branca</span>
                    <span class="fw-bold text-dark">${fmtMoeda(p.preco_branca)}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">Fornecedor</span>
                    <span class="fw-medium">${p.fornecedor_nome || "-"}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.75rem;">% Fornecedor</span>
                    <span class="fw-medium">${p.fornecedor_pct != null ? `${p.fornecedor_pct}%` : "-"}</span>
                  </div>
                </div>
                <hr class="my-3 text-secondary">
                <div class="d-flex justify-content-between text-muted" style="font-size:0.8rem;">
                  <span><i class="fa-solid fa-user-pen me-1"></i> Atualizado por: ${p.atualizado_por || "-"}</span>
                  <span><i class="fa-regular fa-clock me-1"></i> ${fmtDataHora(p.atualizado_em)}</span>
                </div>
              </div>
              <div class="modal-footer bg-light">
                <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      `).join("") : "";

  const modalRota = rota
    ? `
      <div class="modal fade" id="modalRota" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content erp-modal">
            <div class="modal-header">
              <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-route me-2 text-warning"></i> Detalhes da Rota</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-sm">
              <div class="row g-2 mb-3 bg-light p-2 rounded border">
                <div class="col-12 col-md-4">
                  <span class="text-muted d-block" style="font-size:0.75rem;">Título da Rota</span>
                  <span class="fw-bold">${rota.titulo || "-"}</span>
                </div>
                <div class="col-6 col-md-4">
                  <span class="text-muted d-block" style="font-size:0.75rem;">Data do Pedido</span>
                  <span class="fw-medium">${fmtData(rota.data_pedido)}</span>
                </div>
                <div class="col-6 col-md-4">
                  <span class="text-muted d-block" style="font-size:0.75rem;">Criado por</span>
                  <span class="fw-medium">${rota.criado_por || "-"}</span>
                </div>
              </div>

              <h6 class="fw-bold mb-3" style="font-size:0.85rem; color:#0D5749;">Clientes na Rota</h6>
              ${
                rotaClientes.length
                  ? `
                    <div class="row g-2">
                      ${rotaClientes.map(c => `
                        <div class="col-12 col-md-6">
                          <div class="border rounded p-2 h-100 bg-white">
                            <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                              <strong class="text-truncate" style="font-size:0.85rem;" title="${c.cliente_nome || "-"}">${c.cliente_nome || "-"}</strong>
                              ${badgeStatusEntrega(c.status)}
                            </div>
                            <div class="text-muted mb-2" style="font-size:0.7rem;">
                              Atualizado por ${c.atualizado_por || "-"} em ${fmtDataHora(c.atualizado_em)}
                            </div>
                            <div class="bg-light p-1 rounded" style="font-size:0.75rem; min-height:30px;">
                              ${c.observacao && c.observacao.trim() ? c.observacao.replace(/\n/g, "<br>") : "<em class='text-muted'>Sem observação</em>"}
                            </div>
                          </div>
                        </div>
                      `).join("")}
                    </div>
                  `
                  : `<p class="text-muted mb-0" style="font-size:0.85rem;">Nenhum cliente associado a esta rota.</p>`
              }
            </div>
            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
            </div>
          </div>
        </div>
      </div>
    `
    : "";

  // Modal para exibir o Ranking dos clientes ao clicar na barra do gráfico
  const modalRankingDia = `
    <div class="modal fade" id="modalRankingDia" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal">
          <div class="modal-header">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-trophy me-2 text-warning"></i> Ranking <span id="spanDiaModal"></span></h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0 text-sm" id="corpoModalRanking">
            </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const menuHTML = menuLateral(usuario, "/home");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">
      <meta http-equiv="Pragma" content="no-cache">
      <meta http-equiv="Expires" content="0">
      <link rel="icon" type="image/x-icon" href="/img/favicon.ico">

      <title>Início | Ecoflow</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>

      <style>
        body { 
          display: flex; 
          height: 100vh; 
          margin: 0; 
          background-color: #f4f7f6;
          font-family: 'Roboto', system-ui, -apple-system, sans-serif;
        }
        
        /* Sidebar */
        .sidebar { width: 240px; background-color: #0D5749; color: white; padding: 20px; display: flex; flex-direction: column;}
        .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s;}
        .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
        
        .content { flex: 1; padding: 24px; overflow-y: auto; }
        
        /* Utilities */
        .text-sm { font-size: 0.875rem; }
        .disabled-link { pointer-events: none; }
        .last-border-0:last-child { border-bottom: 0 !important; padding-bottom: 0 !important; margin-bottom: 0 !important; }
        
        /* Topbar / Badges */
        .usuario-badge {
            background-color: white;
            color: #0D5749;
            padding: 6px 14px;
            border-radius: 20px;
            border: 1px solid rgba(13,87,73,0.2);
            font-size: 0.85rem;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .notificacao-btn {
            border: 1px solid rgba(13,87,73,0.2);
            background: white;
            color: #0D5749;
            border-radius: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .notificacao-btn:hover { background: #f8f9fa; color: #0D5749; }
        
        /* ERP Cards */
        .erp-card {
            border-radius: 12px;
            transition: transform 0.2s, box-shadow 0.2s;
            overflow: hidden;
        }
        .erp-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 15px rgba(0,0,0,0.05) !important;
        }

        /* Dashboard Section Card */
        .dashboard-section-card {
            border-radius: 12px;
            border: 1px solid rgba(0,0,0,0.05);
            box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .dashboard-title {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0D5749;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* List items */
        .chk-item { border-left: 3px solid #0D5749 !important; transition: background 0.2s; }
        .chk-item:hover { background-color: #f8f9fa; }
        
        /* Animação suave para os cards do Carousel */
        .carousel-item {
            transition: transform 0.6s ease-in-out, opacity 0.6s ease-out;
        }

        /* Modals */
        .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .erp-modal .modal-header { border-bottom: 1px solid #f0f0f0; }
        .erp-modal .modal-footer { border-top: 1px solid #f0f0f0; }

        /* Estilização para que o Select pareça nativo, mas com a cor do badge */
        #selectMesDashboard {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 0.75rem center;
            background-size: 16px 12px;
        }

        /* SKELETON LOADING */
        .skeleton-view {
            background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
            background-size: 200% 100%;
            animation: skeleton-loading-view 1.5s infinite linear;
            border-radius: 4px;
        }
        .skeleton-text-view { height: 16px; width: 100%; margin-bottom: 8px; }
        @keyframes skeleton-loading-view {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        /* Offcanvas Mobile */
        @media (max-width: 767.98px) {
          body { flex-direction: column; }
          .sidebar { display: none; }
          .content { width: 100%; padding: 16px; }
        }
        .offcanvas-body a { display: block; text-align: left; padding: 12px 15px; color: white; text-decoration: none; margin: 4px 0; border-radius: 6px;}
        .offcanvas-body a:hover, .offcanvas-body a.active { background-color: rgba(255,255,255,0.1); }
      </style>
  </head>

  <body>

    <div class="sidebar d-none d-md-flex">
      <div class="text-center mb-4 mt-2">
        <img src="/img/logo-branca.png" alt="Logo da Empresa" class="img-fluid" style="max-width:130px;">
      </div>
      <div class="flex-grow-1">
        ${menuHTML}
      </div>
    </div>

    <div class="offcanvas offcanvas-start bg-dark text-white" tabindex="-1" id="sidebarMenu">
      <div class="offcanvas-header border-bottom border-secondary">
        <h5 class="offcanvas-title ms-2"><i class="fa-solid fa-bars text-muted me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2">
            <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid" style="max-width:140px;">
        </div>
        ${menuHTML}
        <hr class="bg-secondary mt-4">
        <a href="/logout" class="text-danger mt-2"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>
      </div>
    </div>

    <div class="content">
      
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-light border d-md-none shadow-sm" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">
                <i class="fa-solid fa-bars"></i>
            </button>
            <div>
              <h4 class="mb-0 fw-bold text-dark">Painel de Controle</h4>
              <span class="text-muted d-none d-sm-block" style="font-size:0.85rem;">Sistema de gestão Ecocaixas</span>
            </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-12 col-lg-5">
          <div class="card dashboard-section-card h-100 bg-white">
            <div class="card-body p-3 d-flex flex-column pb-4">
              <div id="dashboardCarousel" class="carousel carousel-dark slide carousel-fade flex-grow-1" data-bs-ride="carousel" data-bs-interval="6000">
                <div class="carousel-indicators mb-0" style="bottom: -20px;">
                  ${carouselIndicators}
                </div>
                <div class="carousel-inner h-100">
                  ${carouselItemsHTML.join("")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-7">
          <div class="card dashboard-section-card h-100 bg-white">
            <div class="card-body p-3 d-flex flex-column">
              
              <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h6 class="dashboard-title mb-0"><i class="fa-solid fa-chart-column text-primary me-2"></i> Volume de Pedidos</h6>
                
                <div class="d-flex align-items-center gap-2">
                    <div class="btn-group shadow-sm" role="group">
                        <button type="button" class="btn btn-sm ${modoVisao === 'diario' ? 'btn-primary fw-bold' : 'btn-light border text-muted'}" onclick="mudarFiltroDashboard('diario', null)">Diário</button>
                        <button type="button" class="btn btn-sm ${modoVisao === 'mensal' ? 'btn-primary fw-bold' : 'btn-light border text-muted'}" onclick="mudarFiltroDashboard('mensal', null)">Mensal</button>
                    </div>
                    ${selectMesesHTML}
                </div>
              </div>

              <div class="flex-grow-1 position-relative w-100" style="min-height: 250px;">
                <canvas id="graficoMensalCanvas"></canvas>
              </div>
              <small class="text-muted text-center mt-2" style="font-size: 0.75rem;">
                <i class="fa-solid fa-hand-pointer me-1"></i> Clique em uma barra para ver o ranking de clientes do ${modoVisao === 'diario' ? 'dia' : 'mês'}.
              </small>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div class="modal fade" id="notificacoesModal" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content erp-modal">
          <div class="modal-header">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-bell me-2 text-warning"></i> Central de Notificações</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0">
            ${qtdNotificacoes > 0
              ? `
                <div class="list-group list-group-flush text-sm">
                  ${notificacoes.map(n => `
                    <div class="list-group-item d-flex justify-content-between align-items-start p-3 border-bottom">
                      <div>
                        <div class="fw-bold text-dark mb-1">
                           ${n.tipo === "checklist" ? '<i class="fa-solid fa-clipboard-check text-primary me-1"></i> Checklist' : 
                             n.tipo === "caixa" ? '<i class="fa-solid fa-box text-success me-1"></i> Cadastro/Tabela' : 
                             n.tipo === "veiculo" ? '<i class="fa-solid fa-car text-info me-1"></i> Veículo' :
                             n.tipo === "entrega" ? '<i class="fa-solid fa-route text-warning me-1"></i> Entrega' :
                             '<i class="fa-solid fa-circle-info text-secondary me-1"></i> Notificação'}
                        </div>
                        <div class="text-muted mb-1" style="font-size:0.85rem;">${n.mensagem}</div>
                        <small class="text-muted" style="font-size:0.75rem;">
                          <i class="fa-regular fa-clock me-1"></i> ${new Date(n.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </small>
                      </div>
                      <form method="POST" action="/notificacoes/${n.id}/excluir" class="ms-3 mt-1">
                        <button type="submit" class="btn btn-sm btn-light border text-danger rounded-circle" title="Remover" style="width:30px; height:30px; padding:0;">
                          <i class="fas fa-times"></i>
                        </button>
                      </form>
                    </div>
                  `).join("")}
                </div>
              `
              : `<div class="text-center text-muted p-5">
                   <i class="fa-regular fa-bell-slash fa-3x mb-3 opacity-25"></i>
                   <p class="mb-0" style="font-size:0.85rem;">Nenhuma notificação no momento.</p>
                 </div>`
            }
          </div>
          <div class="modal-footer bg-light">
            ${qtdNotificacoes > 0
              ? `
                <form method="POST" action="/notificacoes/limpar" class="me-auto">
                  <button type="submit" class="btn btn-sm btn-outline-danger">
                    <i class="fas fa-trash-alt me-1"></i> Limpar todas
                  </button>
                </form>
              `
              : ""
            }
            <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    ${modaisManutencao}
    ${modaisChecklist}
    ${modaisPrecos}
    ${modalRota}
    ${modalRankingDia}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
      const mesSelecionadoJS = ${JSON.stringify(mesSelecionado)};

      // Função para mudar a URL quando o modo (diario/mensal) ou o mês for alterado
      function mudarFiltroDashboard(novoModo, novoValorSelect) {
          let mes = mesSelecionadoJS.mes;
          let ano = mesSelecionadoJS.ano;
          let modo = novoModo || mesSelecionadoJS.modo || 'diario';

          if (novoValorSelect) {
              const parts = novoValorSelect.split('-');
              mes = parts[0];
              ano = parts[1];
          }

          window.location.href = \`/home?mes=\${mes}&ano=\${ano}&modo=\${modo}\`;
      }

      document.addEventListener('DOMContentLoaded', function() {
        Chart.register(ChartDataLabels);

        const ctx = document.getElementById('graficoMensalCanvas').getContext('2d');
        const chartData = ${JSON.stringify(graficoMensal)};
        
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: chartData.labels,
            datasets: [{
              label: 'Quantidade Total de Pedidos',
              data: chartData.data,
              backgroundColor: '#0D5749',
              borderRadius: 4,
              barPercentage: 0.6,
              hoverBackgroundColor: '#093c32'
            }]
          },
          plugins: [ChartDataLabels],
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: { top: 25 }
            },
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            onClick: (event, elements, chart) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                const chaveClicada = chart.data.labels[index]; // Pode ser "05" (dia) ou "Mai" (Mês)
                
                const rankingData = chartData.ranking ? chartData.ranking[chaveClicada] : [];
                
                if (mesSelecionadoJS.modo === 'mensal') {
                    // Clicou no Mês (ex: Mai/2026)
                    document.getElementById('spanDiaModal').textContent = \`do Mês \${chaveClicada}/\${mesSelecionadoJS.ano}\`;
                } else {
                    // Clicou no Dia (ex: 05/05/2026)
                    const mesFormatadoModal = String(mesSelecionadoJS.mes).padStart(2, '0') + '/' + mesSelecionadoJS.ano;
                    document.getElementById('spanDiaModal').textContent = \`do Dia \${chaveClicada}/\${mesFormatadoModal}\`;
                }
                
                let htmlRanking = '';
                if (rankingData && rankingData.length > 0) {
                    htmlRanking = '<ul class="list-group list-group-flush">';
                    rankingData.forEach((item, i) => {
                        let medalha = '';
                        if(i === 0) medalha = '<i class="fa-solid fa-medal text-warning me-2 fa-lg"></i>';
                        else if(i === 1) medalha = '<i class="fa-solid fa-medal text-secondary me-2 fa-lg"></i>';
                        else if(i === 2) medalha = '<i class="fa-solid fa-medal me-2 fa-lg" style="color: #cd7f32;"></i>';
                        else medalha = \`<span class="me-2 text-muted fw-bold ms-1" style="width:20px; display:inline-block;">\${i+1}º</span>\`;

                        htmlRanking += \`
                        <li class="list-group-item d-flex justify-content-between align-items-center px-3 py-3">
                            <div>\${medalha} <strong class="text-dark">\${item.cliente_nome}</strong></div>
                            <span class="badge bg-primary rounded-pill px-2 py-1">\${item.quantidade} un.</span>
                        </li>\`;
                    });
                    htmlRanking += '</ul>';
                } else {
                    htmlRanking = '<div class="text-center text-muted p-4"><i class="fa-solid fa-box-open mb-3 fa-2x opacity-25"></i><br>Nenhum pedido ou ranking encontrado.</div>';
                }
                
                document.getElementById('corpoModalRanking').innerHTML = htmlRanking;
                const modal = new bootstrap.Modal(document.getElementById('modalRankingDia'));
                modal.show();
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.parsed.y + ' caixas solicitadas';
                  }
                }
              },
              datalabels: {
                anchor: 'end',
                align: 'top',
                color: '#0D5749',
                font: { weight: 'bold', size: 11 },
                formatter: function(value) { return value > 0 ? value : ''; }
              }
            },
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0 } },
              x: {
                grid: { display: false },
                ticks: {
                  autoSkip: false,
                  maxRotation: window.innerWidth < 768 ? 90 : 0,
                  minRotation: 0,
                  font: { size: window.innerWidth < 768 ? 9 : 11 }
                }
              }
            }
          }
        });
      });
    </script>

    <script>
      // =======================================================================
      // SKELETON LOADING
      // =======================================================================
      function gerarSkeletonCard() {
          let html = '';
          for(let i=0; i<3; i++) {
              html += \`
              <div class="card border-0 shadow-sm mb-2 p-2">
                  <div class="d-flex justify-content-between align-items-center">
                      <div style="width: 80%;">
                          <div class="skeleton-view skeleton-text-view" style="width: 100%;"></div>
                          <div class="skeleton-view skeleton-text-view" style="width: 60%; margin-bottom: 0;"></div>
                      </div>
                      <div class="skeleton-view skeleton-text-view" style="width: 20px; margin-bottom: 0;"></div>
                  </div>
              </div>\`;
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const mainContainer = document.querySelector('.content > .row.g-3');
          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="row g-3 skeleton-container">
              <div class="col-12 col-lg-5">
                  <div class="card dashboard-section-card h-100 bg-white">
                      <div class="card-body p-3">
                          <div class="skeleton-view skeleton-text-view mb-3" style="width: 60%; height: 20px;"></div>
                          \${gerarSkeletonCard()}
                      </div>
                  </div>
              </div>
              <div class="col-12 col-lg-7">
                  <div class="card dashboard-section-card h-100 bg-white">
                      <div class="card-body p-3 d-flex flex-column">
                          <div class="d-flex justify-content-between mb-3">
                              <div class="skeleton-view skeleton-text-view mb-0" style="width: 40%; height: 24px;"></div>
                              <div class="skeleton-view skeleton-text-view mb-0" style="width: 15%; height: 24px; border-radius: 12px;"></div>
                          </div>
                          <div class="skeleton-view w-100 flex-grow-1" style="min-height: 250px; border-radius: 8px;"></div>
                      </div>
                  </div>
              </div>
          </div>\`;

          if (mainContainer && !mainContainer.classList.contains('skeleton-container')) {
              mainContainer.style.display = 'none';
              mainContainer.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const mainContainer = document.querySelector('.content > .row.g-3:not(.skeleton-container)');
          if (mainContainer) mainContainer.style.display = 'flex';
      }

      mostrarSkeletonGlobais();

      if (document.readyState === 'complete') {
          setTimeout(ocultarSkeletonGlobais, 100);
      } else {
          window.addEventListener('load', ocultarSkeletonGlobais);
      }

      window.addEventListener('beforeunload', () => {
          mostrarSkeletonGlobais();
      });
    </script>

    <script>
      window.addEventListener('load', () => {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('erro')) {
              const tipoErro = urlParams.get('erro');
              if (tipoErro === 'acesso_negado') {
                  mostrarToast('erro', 'Acesso Restrito!', 'O seu perfil de utilizador não tem permissão para aceder a esta funcionalidade.');
              }
              if (window.history.replaceState) {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('erro');
                  window.history.replaceState({}, document.title, url.toString());
              }
          }
      });
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = homeView;