// views/homeView.js
const menuLateral = require("./menuLateral");

function homeView(usuario, notificacoes = [], dashboard = {}, notificacaoAtiva = null) {
  const qtdNotificacoes = notificacoes.length;
  const isMotorista = usuario && usuario.tipo_usuario === "motorista";

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
      return `<span class="badge bg-success" style="font-size:0.65rem;">ENTREGUE</span>`;
    }
    if (status === "NA_ROTA") {
      return `<span class="badge bg-warning text-dark" style="font-size:0.65rem;">NA ROTA</span>`;
    }
    if (status === "NAO_ENTREGUE") {
      return `<span class="badge bg-danger" style="font-size:0.65rem;">NÃO ENTREGUE</span>`;
    }
    return `<span class="badge bg-secondary" style="font-size:0.65rem;">${status || "SEM STATUS"}</span>`;
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
              <span class="d-block fw-bold text-white text-truncate" style="font-size: 0.8rem;">${v.marca || "-"} ${v.modelo || "-"}</span>
              <div class="d-flex gap-3 text-muted mt-1" style="font-size: 0.7rem;">
                <span class="text-truncate"><i class="fa-solid fa-wrench me-1"></i> ${v.servico || "Sem manutenção"}</span>
                <span><i class="fa-regular fa-calendar me-1"></i> ${v.data_servico ? fmtData(v.data_servico) : "-"}</span>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-accent opacity-50" style="font-size:0.75rem;"></i>
          </div>
        </div>
      `).join("")
    : `<div class="text-center text-muted p-3" style="font-size:0.8rem;"><i class="fa-solid fa-inbox mb-2 fa-xl opacity-25"></i><br>Sem dados</div>`;

  const cardsChecklist = checklists.length
    ? checklists.slice(0, 3).map((c, i) => `
        <div class="card chk-item border-0 shadow-sm mb-2" data-bs-toggle="modal" data-bs-target="#modalChecklist${i}" style="cursor:pointer; border-left-color: #0d6efd !important;">
          <div class="card-body p-2 px-3 d-flex justify-content-between align-items-center">
            <div class="text-truncate me-3" style="max-width: 85%;">
              <span class="d-block fw-bold text-white text-truncate" style="font-size: 0.8rem;">Motorista: ${c.motorista || "-"}</span>
              <div class="d-flex gap-3 text-muted mt-1" style="font-size: 0.7rem;">
                <span class="text-truncate"><i class="fa-solid fa-car-side me-1"></i> ${c.veiculo || "-"}</span>
                <span><i class="fa-regular fa-clock me-1"></i> ${fmtData(c.criado_em)}</span>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-accent opacity-50" style="font-size:0.75rem;"></i>
          </div>
        </div>
      `).join("")
    : `<div class="text-center text-muted p-3" style="font-size:0.8rem;"><i class="fa-solid fa-inbox mb-2 fa-xl opacity-25"></i><br>Sem dados</div>`;

  const cardsPrecos = precos.length
    ? precos.slice(0, 3).map((p, i) => `
        <div class="card chk-item border-0 shadow-sm mb-2" data-bs-toggle="modal" data-bs-target="#modalPreco${i}" style="cursor:pointer; border-left-color: #198754 !important;">
          <div class="card-body p-2 px-3 d-flex justify-content-between align-items-center">
            <div class="text-truncate me-3" style="max-width: 85%;">
              <span class="d-block fw-bold text-white text-truncate" style="font-size: 0.8rem;">Modelo: ${p.modelo || "-"}</span>
              <div class="d-flex gap-3 text-muted mt-1" style="font-size: 0.7rem;">
                <span class="text-truncate"><i class="fa-solid fa-user-pen me-1"></i> ${p.atualizado_por || "-"}</span>
                <span><i class="fa-solid fa-clock-rotate-left me-1"></i> ${fmtDataHora(p.atualizado_em)}</span>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-accent opacity-50" style="font-size:0.75rem;"></i>
          </div>
        </div>
      `).join("")
    : `<div class="text-center text-muted p-3" style="font-size:0.8rem;"><i class="fa-solid fa-inbox mb-2 fa-xl opacity-25"></i><br>Sem dados</div>`;

  const cardRota = rota
    ? `
      <div class="card chk-item border-0 shadow-sm mb-2" data-bs-toggle="modal" data-bs-target="#modalRota" style="cursor:pointer; border-left-color: #ffc107 !important;">
        <div class="card-body p-2 px-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="text-truncate me-3">
              <span class="d-block fw-bold text-white text-truncate" style="font-size: 0.8rem;">${rota.titulo || "-"}</span>
              <span class="text-muted" style="font-size: 0.7rem;"><i class="fa-regular fa-calendar me-1"></i> ${fmtData(rota.data_pedido)}</span>
            </div>
            <i class="fa-solid fa-chevron-right text-accent opacity-50" style="font-size:0.75rem;"></i>
          </div>
          <div class="bg-custom-darker rounded p-2 border-custom">
            ${(rotaClientes.slice(0, 3)).map(c => `
              <div class="d-flex align-items-center justify-content-between border-bottom border-custom pb-1 mb-1 last-border-0">
                <span class="text-truncate text-white" style="font-size:0.7rem; max-width:70%;">${c.cliente_nome || "-"}</span>
                ${badgeStatusEntrega(c.status)}
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `
    : `<div class="text-center text-muted p-3" style="font-size:0.8rem;"><i class="fa-solid fa-inbox mb-2 fa-xl opacity-25"></i><br>Sem rotas</div>`;

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

  if (!isMotorista) {
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
  let selectMesesHTML = `<select id="selectMesDashboard" class="form-select form-select-sm w-auto bg-custom-darker border-custom text-white" onchange="mudarFiltroDashboard(null, this.value)">`;
  
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
                <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-wrench me-2 text-accent"></i> Detalhes da Manutenção</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body text-sm">
                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Veículo</span>
                    <span class="fw-medium text-white">${v.marca || "-"} ${v.modelo || "-"}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Ano / KM Atual</span>
                    <span class="fw-medium text-white">${v.ano || "-"} / ${v.km || "-"} km</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Data do Serviço</span>
                    <span class="fw-medium text-white">${fmtData(v.data_servico)}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">KM do Serviço</span>
                    <span class="fw-medium text-white">${v.km_servico || "-"} km</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Oficina / Mecânico</span>
                    <span class="fw-medium text-white">${v.oficina || "-"} / ${v.mecanico || "-"}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Valor</span>
                    <span class="fw-bold text-success">${fmtMoeda(v.valor)}</span>
                  </div>
                </div>
                <div class="p-2 bg-custom-darker rounded border-custom mb-3">
                  <span class="text-muted d-block mb-1" style="font-size:0.7rem;">Serviço Realizado</span>
                  <span class="text-white">${(v.servico || "-").replace(/\n/g, "<br>")}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <span class="text-muted d-block" style="font-size:0.7rem;">Atualizado por</span>
                    <span class="fw-medium text-white" style="font-size:0.75rem;">${v.atualizado_por || "-"}</span>
                  </div>
                  <div>
                  ${v.documento
                      ? `<a href="/uploads/${v.documento}" target="_blank" class="btn btn-sm btn-outline-success">
                          <i class="fa-solid fa-paperclip me-1"></i>Ver Documento
                         </a>`
                      : `<span class="text-muted" style="font-size:0.75rem;"><i class="fa-solid fa-file-excel me-1"></i>Sem anexo</span>`
                  }
                  </div>
                </div>
              </div>
              <div class="modal-footer bg-custom-darker">
                <button type="button" class="btn btn-sm btn-outline-secondary text-white" data-bs-dismiss="modal">Fechar</button>
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
                <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-clipboard-check me-2 text-accent"></i> Detalhes do Checklist</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body text-sm">
                <div class="row g-2 mb-3">
                  <div class="col-12 col-md-4">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Motorista / Veículo</span>
                    <span class="fw-bold text-white">${c.motorista || "-"} / ${c.veiculo || "-"}</span>
                  </div>
                  <div class="col-6 col-md-4">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Registrado em</span>
                    <span class="fw-medium text-white">${fmtDataHora(c.criado_em)}</span>
                  </div>
                  <div class="col-6 col-md-4">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Responsável Lógistico</span>
                    <span class="fw-medium text-white">${c.responsavel || "-"}</span>
                  </div>
                </div>
                
                <h6 class="fw-bold mt-3 mb-2" style="font-size:0.8rem; color:#08c068;">Itens Inspecionados</h6>
                <div class="row g-2 bg-custom-darker p-2 rounded border-custom mb-3">
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.65rem;">Óleo</span><span class="fw-medium text-white" style="font-size:0.75rem;">${c.oleo || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.65rem;">Água Radiador</span><span class="fw-medium text-white" style="font-size:0.75rem;">${c.agua || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.65rem;">Fluído Freio</span><span class="fw-medium text-white" style="font-size:0.75rem;">${c.freio || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.65rem;">Direção Hidráulica</span><span class="fw-medium text-white" style="font-size:0.75rem;">${c.direcao || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.65rem;">Combustível</span><span class="fw-medium text-white" style="font-size:0.75rem;">${c.combustivel || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.65rem;">Pneu (Calibragem)</span><span class="fw-medium text-white" style="font-size:0.75rem;">${c.pneu_calibragem || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.65rem;">Pneu (Estado)</span><span class="fw-medium text-white" style="font-size:0.75rem;">${c.pneu_estado || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.65rem;">Luzes</span><span class="fw-medium text-white" style="font-size:0.75rem;">${c.luzes || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.65rem;">Ruídos</span><span class="fw-medium text-white" style="font-size:0.75rem;">${c.ruidos || "-"}</span></div>
                  <div class="col-6 col-md-3"><span class="text-muted d-block" style="font-size:0.65rem;">Lixo Interno</span><span class="fw-medium text-white" style="font-size:0.75rem;">${c.lixo || "-"}</span></div>
                </div>

                <div class="row g-2">
                  <div class="col-12 col-md-8">
                    <span class="text-muted d-block mb-1" style="font-size:0.7rem;">Observação</span>
                    <div class="p-2 bg-custom-darker rounded border-custom text-white" style="font-size:0.75rem; min-height:40px;">
                      ${c.observacao ? c.observacao.replace(/\n/g, "<br>") : "<em class='text-muted'>Sem observação</em>"}
                    </div>
                  </div>
                  <div class="col-12 col-md-4 d-flex align-items-end justify-content-md-end mt-2 mt-md-0">
                    ${c.foto
                        ? `<a href="/uploads/${c.foto}" target="_blank" class="btn btn-sm btn-outline-success w-100">
                            <i class="fa-solid fa-image me-1"></i>Ver Foto
                           </a>`
                        : `<span class="text-muted w-100 text-center p-2 border-custom rounded" style="font-size:0.75rem;"><i class="fa-solid fa-image-slash me-1"></i>Sem foto</span>`
                    }
                  </div>
                </div>
              </div>
              <div class="modal-footer bg-custom-darker">
                <button type="button" class="btn btn-sm btn-outline-secondary text-white" data-bs-dismiss="modal">Fechar</button>
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
                <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-tags me-2 text-success"></i> Detalhes do Preço</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body text-sm">
                <div class="row g-2">
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Código</span>
                    <span class="fw-medium text-white">${p.codigo || "-"}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Modelo</span>
                    <span class="fw-bold text-white">${p.modelo || "-"}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Preço Parda</span>
                    <span class="fw-bold text-success">${fmtMoeda(p.preco_parda)}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Preço Branca</span>
                    <span class="fw-bold text-success">${fmtMoeda(p.preco_branca)}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">Fornecedor</span>
                    <span class="fw-medium text-white">${p.fornecedor_nome || "-"}</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted d-block" style="font-size:0.7rem;">% Fornecedor</span>
                    <span class="fw-medium text-white">${p.fornecedor_pct != null ? `${p.fornecedor_pct}%` : "-"}</span>
                  </div>
                </div>
                <hr class="my-3 border-custom">
                <div class="d-flex justify-content-between text-muted" style="font-size:0.75rem;">
                  <span><i class="fa-solid fa-user-pen me-1"></i> Atualizado por: ${p.atualizado_por || "-"}</span>
                  <span><i class="fa-regular fa-clock me-1"></i> ${fmtDataHora(p.atualizado_em)}</span>
                </div>
              </div>
              <div class="modal-footer bg-custom-darker">
                <button type="button" class="btn btn-sm btn-outline-secondary text-white" data-bs-dismiss="modal">Fechar</button>
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
              <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-route me-2 text-warning"></i> Detalhes da Rota</h6>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-sm">
              <div class="row g-2 mb-3 bg-custom-darker p-2 rounded border-custom">
                <div class="col-12 col-md-4">
                  <span class="text-muted d-block" style="font-size:0.7rem;">Título da Rota</span>
                  <span class="fw-bold text-white">${rota.titulo || "-"}</span>
                </div>
                <div class="col-6 col-md-4">
                  <span class="text-muted d-block" style="font-size:0.7rem;">Data do Pedido</span>
                  <span class="fw-medium text-white">${fmtData(rota.data_pedido)}</span>
                </div>
                <div class="col-6 col-md-4">
                  <span class="text-muted d-block" style="font-size:0.7rem;">Criado por</span>
                  <span class="fw-medium text-white">${rota.criado_por || "-"}</span>
                </div>
              </div>

              <h6 class="fw-bold mb-3" style="font-size:0.8rem; color:#08c068;">Clientes na Rota</h6>
              ${
                rotaClientes.length
                  ? `
                    <div class="row g-2">
                      ${rotaClientes.map(c => `
                        <div class="col-12 col-md-6">
                          <div class="border-custom rounded p-2 h-100 bg-custom-dark">
                            <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                              <strong class="text-truncate text-white" style="font-size:0.8rem;" title="${c.cliente_nome || "-"}">${c.cliente_nome || "-"}</strong>
                              ${badgeStatusEntrega(c.status)}
                            </div>
                            <div class="text-muted mb-2" style="font-size:0.65rem;">
                              Atualizado por ${c.atualizado_por || "-"} em ${fmtDataHora(c.atualizado_em)}
                            </div>
                            <div class="bg-custom-darker p-1 rounded text-white" style="font-size:0.7rem; min-height:30px;">
                              ${c.observacao && c.observacao.trim() ? c.observacao.replace(/\n/g, "<br>") : "<em class='text-muted'>Sem observação</em>"}
                            </div>
                          </div>
                        </div>
                      `).join("")}
                    </div>
                  `
                  : `<p class="text-muted mb-0" style="font-size:0.8rem;">Nenhum cliente associado a esta rota.</p>`
              }
            </div>
            <div class="modal-footer bg-custom-darker">
              <button type="button" class="btn btn-sm btn-outline-secondary text-white" data-bs-dismiss="modal">Fechar</button>
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
            <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-trophy me-2 text-warning"></i> Ranking <span id="spanDiaModal"></span></h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0 text-sm" id="corpoModalRanking">
            </div>
          <div class="modal-footer bg-custom-darker">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white" data-bs-dismiss="modal">Fechar</button>
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
        /* Scrollbars (Dark & Green) */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
        html, body, .content { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

        body { 
          display: flex; 
          height: 100vh; 
          margin: 0; 
          background-color: #1f1f1f;
          color: #ffffff;
          font-family: 'Roboto', system-ui, -apple-system, sans-serif;
        }
        
        /* Sidebar (Override para ter certeza) */
        .sidebar { width: 240px; background-color: #1f1f1f !important; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column;}
        
        .content { flex: 1; padding: 24px; overflow-y: auto; background-color: #1f1f1f; }
        
        /* Tema Escuro Customizado */
        .bg-custom-dark { background-color: #2a2a2a !important; }
        .bg-custom-darker { background-color: #222222 !important; }
        .border-custom { border-color: rgba(255,255,255,0.08) !important; border-width: 1px; }
        .text-accent { color: #08c068 !important; }

        /* Substituindo as cores base do Bootstrap */
        .text-dark { color: #ffffff !important; }
        .text-muted { color: rgba(255,255,255,0.5) !important; }

        /* Botões */
        .btn-primary { background-color: #08c068; border-color: #08c068; color: #1f1f1f; }
        .btn-primary:hover, .btn-primary:focus, .btn-primary:active { background-color: #06a055 !important; border-color: #06a055 !important; color: #ffffff !important; }
        .btn-outline-secondary { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }
        .btn-outline-secondary:hover { background-color: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.3); }

        /* Topbar / Badges */
        .usuario-badge {
            background-color: #2a2a2a;
            color: #08c068;
            padding: 4px 12px;
            border-radius: 20px;
            border: 1px solid rgba(8,192,104,0.3);
            font-size: 0.8rem;
            font-weight: 500;
        }

        /* Inputs e Selects */
        .form-select, .form-control { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.8rem; }
        .form-select:focus, .form-control:focus { background-color: #2a2a2a; border-color: #08c068; color: #fff; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }
        
        /* ERP Cards */
        .dashboard-section-card {
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.05);
            background-color: #2a2a2a;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .dashboard-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: #08c068;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* List items */
        .chk-item { background-color: #2a2a2a; border-left: 2px solid #08c068 !important; border: 1px solid rgba(255,255,255,0.05); transition: background 0.2s; }
        .chk-item:hover { background-color: #333333; }
        
        /* Animação suave para os cards do Carousel */
        .carousel-indicators [data-bs-target] { background-color: #08c068; }
        .carousel-item { transition: transform 0.6s ease-in-out, opacity 0.6s ease-out; }

        /* Modals */
        .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
        .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
        .list-group-item { background-color: transparent !important; border-color: rgba(255,255,255,0.05); color: #fff;}

        /* SKELETON LOADING (CORRIGIDO PARA MODO ESCURO TRANSPARENTE) */
        .skeleton-dark {
            background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%) !important;
            background-size: 200% 100% !important;
            animation: skeleton-loading-view 1.5s infinite linear !important;
            border-radius: 4px;
            color: transparent !important;
            border-color: transparent !important;
            box-shadow: none !important;
            pointer-events: none;
        }
        .skeleton-dark * {
            visibility: hidden !important;
        }
        .skeleton-text-view { height: 14px; width: 100%; margin-bottom: 8px; }
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
        .offcanvas { background-color: #1f1f1f !important; }
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
      <div class="offcanvas-header border-bottom border-custom">
        <h5 class="offcanvas-title ms-2"><i class="fa-solid fa-bars text-muted me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2">
            <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid" style="max-width:140px;">
        </div>
        ${menuHTML}
        <hr class="border-custom mt-4">
        <a href="/logout" class="text-danger mt-2" style="font-size: 0.85rem;"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>
      </div>
    </div>

    <div class="content">
      
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border d-md-none shadow-sm" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">
                <i class="fa-solid fa-bars text-white"></i>
            </button>
            <div>
              <h4 class="mb-0 fw-bold text-white fs-5">Painel de Controle</h4>
              <span class="text-muted d-none d-sm-block" style="font-size:0.75rem;">Sistema de gestão Ecocaixas</span>
            </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="${isMotorista ? 'col-12' : 'col-12 col-lg-5'}">
          <div class="card dashboard-section-card h-100 bg-custom-dark">
            <div class="card-body p-3 d-flex flex-column pb-4">
              <div id="dashboardCarousel" class="carousel slide carousel-fade flex-grow-1" data-bs-ride="carousel" data-bs-interval="6000">
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

        ${!isMotorista ? `
        <div class="col-12 col-lg-7">
          <div class="card dashboard-section-card h-100 bg-custom-dark">
            <div class="card-body p-3 d-flex flex-column">
              
              <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h6 class="dashboard-title mb-0"><i class="fa-solid fa-chart-column text-accent me-2"></i> Volume de Pedidos</h6>
                
                <div class="d-flex align-items-center gap-2">
                    <div class="btn-group shadow-sm" role="group">
                        <button id="btn-diario" type="button" class="btn btn-sm ${modoVisao === 'diario' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}" onclick="mudarFiltroDashboard('diario', null)">Diário</button>
                        <button id="btn-mensal" type="button" class="btn btn-sm ${modoVisao === 'mensal' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}" onclick="mudarFiltroDashboard('mensal', null)">Mensal</button>
                    </div>
                    ${selectMesesHTML}
                </div>
              </div>

              <div class="flex-grow-1 position-relative w-100" style="min-height: 250px;">
                <canvas id="graficoMensalCanvas"></canvas>
              </div>
              <small id="dica-grafico" class="text-muted text-center mt-2" style="font-size: 0.7rem;">
                <i class="fa-solid fa-hand-pointer me-1"></i> Clique em uma barra para ver o ranking de clientes do ${modoVisao === 'diario' ? 'dia' : 'mês'}.
              </small>
            </div>
          </div>
        </div>
        ` : ''}
      </div>

    </div>

    <div class="modal fade" id="notificacoesModal" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content erp-modal">
          <div class="modal-header">
            <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-bell me-2 text-warning"></i> Central de Notificações</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0 bg-custom-darker">
            ${qtdNotificacoes > 0
              ? `
                <div class="list-group list-group-flush text-sm">
                  ${notificacoes.map(n => `
                    <div class="list-group-item d-flex justify-content-between align-items-start p-3 border-custom border-bottom">
                      <div>
                        <div class="fw-bold text-white mb-1" style="font-size:0.8rem;">
                           ${n.tipo === "checklist" ? '<i class="fa-solid fa-clipboard-check text-accent me-1"></i> Checklist' : 
                             n.tipo === "caixa" ? '<i class="fa-solid fa-box text-success me-1"></i> Cadastro/Tabela' : 
                             n.tipo === "veiculo" ? '<i class="fa-solid fa-car text-info me-1"></i> Veículo' :
                             n.tipo === "entrega" ? '<i class="fa-solid fa-route text-warning me-1"></i> Entrega' :
                             '<i class="fa-solid fa-circle-info text-secondary me-1"></i> Notificação'}
                        </div>
                        <div class="text-muted mb-1" style="font-size:0.75rem;">${n.mensagem}</div>
                        <small class="text-muted" style="font-size:0.7rem;">
                          <i class="fa-regular fa-clock me-1"></i> ${new Date(n.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </small>
                      </div>
                      <form method="POST" action="/notificacoes/${n.id}/excluir" class="ms-3 mt-1">
                        <button type="submit" class="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center" title="Remover" style="width:26px; height:26px; padding:0;">
                          <i class="fas fa-times" style="font-size:0.75rem;"></i>
                        </button>
                      </form>
                    </div>
                  `).join("")}
                </div>
              `
              : `<div class="text-center text-muted p-5">
                   <i class="fa-regular fa-bell-slash fa-2x mb-3 opacity-25"></i>
                   <p class="mb-0" style="font-size:0.8rem;">Nenhuma notificação no momento.</p>
                 </div>`
            }
          </div>
          <div class="modal-footer bg-custom-darker">
            ${qtdNotificacoes > 0
              ? `
                <form method="POST" action="/notificacoes/limpar" class="me-auto">
                  <button type="submit" class="btn btn-sm btn-outline-danger" style="font-size:0.75rem;">
                    <i class="fas fa-trash-alt me-1"></i> Limpar todas
                  </button>
                </form>
              `
              : ""
            }
            <button type="button" class="btn btn-sm btn-outline-secondary text-white" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    ${modaisManutencao}
    ${modaisChecklist}
    ${modaisPrecos}
    ${modalRota}
    ${modalRankingDia}

    ${notificacaoAtiva ? `
    <div class="modal fade" id="modalAvisoGlobal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content erp-modal shadow-lg border-0" style="border-radius: 12px; overflow: hidden;">
          <div class="modal-header text-white border-0 p-3" style="background-color: #0D5749;">
            <h6 class="modal-title fw-bold" style="font-size:0.95rem;"><i class="fa-solid fa-bullhorn me-2"></i> Mensagem do sistema</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-darker text-center">
            ${notificacaoAtiva.imagem ? `<img src="/uploads/mensagensSistema/${notificacaoAtiva.imagem}" class="img-fluid rounded border-custom mb-4 shadow-sm" style="max-height: 500px; width: 100%; object-fit: contain; background-color: rgba(0,0,0,0.15);">` : '<i class="fa-solid fa-circle-exclamation fa-3x text-accent mb-4 opacity-50"></i>'}
            <h5 class="fw-bold text-white mb-3">${notificacaoAtiva.titulo}</h5>
            <p class="text-muted mb-0" style="font-size: 0.95rem; white-space: pre-wrap; text-align: left; line-height: 1.6;">${notificacaoAtiva.mensagem}</p>
          </div>
          <div class="modal-footer bg-custom-dark border-0 justify-content-center p-3">
            <button type="button" class="btn btn-primary px-5 py-2 fw-bold shadow-sm" data-bs-dismiss="modal">Entendido</button>
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
      // Configurações globais do Chart.js para Dark Mode
      Chart.defaults.color = 'rgba(255,255,255,0.6)';
      Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';

      // Variáveis globais para armazenar o estado atual
      let mesSelecionadoJS = ${JSON.stringify(mesSelecionado)};
      let chartData = ${JSON.stringify(graficoMensal)};
      let chartInstance = null;

      // Função AJAX para buscar e atualizar os dados do gráfico
      async function mudarFiltroDashboard(novoModo, novoValorSelect) {
          let mes = mesSelecionadoJS.mes;
          let ano = mesSelecionadoJS.ano;
          let modo = novoModo || mesSelecionadoJS.modo || 'diario';

          if (novoValorSelect) {
              const parts = novoValorSelect.split('-');
              mes = parts[0];
              ano = parts[1];
          }

          // Atualiza o aspeto visual dos botões
          const btnDiario = document.getElementById('btn-diario');
          const btnMensal = document.getElementById('btn-mensal');
          
          if (btnDiario && btnMensal) {
              if (modo === 'diario') {
                  btnDiario.className = 'btn btn-sm btn-primary fw-bold';
                  btnMensal.className = 'btn btn-sm btn-outline-secondary';
              } else {
                  btnMensal.className = 'btn btn-sm btn-primary fw-bold';
                  btnDiario.className = 'btn btn-sm btn-outline-secondary';
              }
          }
          
          // Atualiza a dica no rodapé do gráfico
          const dicaObj = document.getElementById('dica-grafico');
          if (dicaObj) {
              dicaObj.innerHTML = \`<i class="fa-solid fa-hand-pointer me-1"></i> Clique em uma barra para ver o ranking de clientes do \${modo === 'diario' ? 'dia' : 'mês'}.\`;
          }

          try {
              // Requisição AJAX para o novo endpoint
              const response = await fetch(\`/api/dashboard-chart?mes=\${mes}&ano=\${ano}&modo=\${modo}\`);
              if (!response.ok) throw new Error('Falha ao buscar dados do gráfico');
              
              const dadosResposta = await response.json();
              
              // Atualiza o estado global para que o Modal leia a informação correta ao clicar
              chartData = dadosResposta.graficoMensal;
              mesSelecionadoJS = dadosResposta.mesSelecionado;

              // Atualiza as opções e os dados do Chart.js
              if (chartInstance) {
                  chartInstance.data.labels = chartData.labels;
                  chartInstance.data.datasets[0].data = chartData.data;
                  chartInstance.update();
              }

          } catch (error) {
              console.error("Erro na requisição AJAX:", error);
              alert("Não foi possível atualizar o gráfico. Tente novamente.");
          }
      }

      document.addEventListener('DOMContentLoaded', function() {
        const canvasObj = document.getElementById('graficoMensalCanvas');
        if (!canvasObj) return; // Segurança para perfil Motorista que não exibe o gráfico

        Chart.register(ChartDataLabels);

        const ctx = canvasObj.getContext('2d');
        
        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: chartData.labels,
            datasets: [{
              label: 'Quantidade Total de Pedidos',
              data: chartData.data,
              backgroundColor: '#08c068',
              borderRadius: 4,
              barPercentage: 0.6,
              hoverBackgroundColor: '#06a055'
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
                const chaveClicada = chart.data.labels[index]; 
                
                // Vai buscar os dados ao objeto global atualizado via AJAX
                const rankingData = chartData.ranking ? chartData.ranking[chaveClicada] : [];
                
                if (mesSelecionadoJS.modo === 'mensal') {
                    document.getElementById('spanDiaModal').textContent = \`do Mês \${chaveClicada}/\${mesSelecionadoJS.ano}\`;
                } else {
                    const mesFormatadoModal = String(mesSelecionadoJS.mes).padStart(2, '0') + '/' + mesSelecionadoJS.ano;
                    document.getElementById('spanDiaModal').textContent = \`do Dia \${chaveClicada}/\${mesFormatadoModal}\`;
                }
                
                let htmlRanking = '';
                if (rankingData && rankingData.length > 0) {
                    htmlRanking = '<ul class="list-group list-group-flush bg-custom-darker">';
                    rankingData.forEach((item, i) => {
                        let medalha = '';
                        if(i === 0) medalha = '<i class="fa-solid fa-medal text-warning me-2 fa-lg"></i>';
                        else if(i === 1) medalha = '<i class="fa-solid fa-medal text-secondary me-2 fa-lg"></i>';
                        else if(i === 2) medalha = '<i class="fa-solid fa-medal me-2 fa-lg" style="color: #cd7f32;"></i>';
                        else medalha = \`<span class="me-2 text-muted fw-bold ms-1" style="width:20px; display:inline-block; font-size:0.75rem;">\${i+1}º</span>\`;

                        htmlRanking += \`
                        <li class="list-group-item d-flex justify-content-between align-items-center px-3 py-2 border-custom border-bottom">
                            <div style="font-size:0.8rem;">\${medalha} <strong class="text-white">\${item.cliente_nome}</strong></div>
                            <span class="badge bg-success rounded-pill px-2 py-1" style="font-size:0.65rem;">\${item.quantidade} un.</span>
                        </li>\`;
                    });
                    htmlRanking += '</ul>';
                } else {
                    htmlRanking = '<div class="text-center text-muted p-4"><i class="fa-solid fa-box-open mb-3 fa-lg opacity-25"></i><br><span style="font-size:0.8rem;">Nenhum pedido ou ranking encontrado.</span></div>';
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
                color: '#ffffff',
                font: { weight: 'bold', size: 10 },
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
                  font: { size: window.innerWidth < 768 ? 9 : 10 }
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
              <div class="card border-0 bg-custom-darker shadow-sm mb-2 p-2">
                  <div class="d-flex justify-content-between align-items-center">
                      <div style="width: 80%;">
                          <div class="skeleton-dark skeleton-text-view" style="width: 100%;"></div>
                          <div class="skeleton-dark skeleton-text-view" style="width: 60%; margin-bottom: 0;"></div>
                      </div>
                      <div class="skeleton-dark skeleton-text-view" style="width: 20px; margin-bottom: 0;"></div>
                  </div>
              </div>\`;
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const mainContainer = document.querySelector('.content > .row.g-3');
          if (document.getElementById('skeleton-temp-container')) return;

          const isMotoristaStr = ${isMotorista};

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="row g-3 skeleton-container">
              <div class="\${isMotoristaStr ? 'col-12' : 'col-12 col-lg-5'}">
                  <div class="card dashboard-section-card h-100 bg-custom-dark">
                      <div class="card-body p-3">
                          <div class="skeleton-dark skeleton-text-view mb-3" style="width: 60%; height: 20px;"></div>
                          \${gerarSkeletonCard()}
                      </div>
                  </div>
              </div>
              \${!isMotoristaStr ? \`
              <div class="col-12 col-lg-7">
                  <div class="card dashboard-section-card h-100 bg-custom-dark">
                      <div class="card-body p-3 d-flex flex-column">
                          <div class="d-flex justify-content-between mb-3">
                              <div class="skeleton-dark skeleton-text-view mb-0" style="width: 40%; height: 24px;"></div>
                              <div class="skeleton-dark skeleton-text-view mb-0" style="width: 15%; height: 24px; border-radius: 12px;"></div>
                          </div>
                          <div class="skeleton-dark w-100 flex-grow-1" style="min-height: 250px; border-radius: 8px;"></div>
                      </div>
                  </div>
              </div>
              \` : ''}
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

    ${notificacaoAtiva ? `
    <script>
      window.addEventListener('load', () => {
          // Identificador único para a notificação atual
          const notifId = 'aviso_${notificacaoAtiva.id}';
          
          // Verifica se o aviso já foi mostrado nesta sessão
          if (!sessionStorage.getItem(notifId)) {
              setTimeout(() => {
                  const modalEl = document.getElementById('modalAvisoGlobal');
                  if (modalEl) {
                      const modal = new bootstrap.Modal(modalEl);
                      modal.show();
                      // Regista no navegador que o utilizador já visualizou
                      sessionStorage.setItem(notifId, 'true');
                  }
              }, 600); // 600ms de atraso para a página terminar as suas próprias animações
          }
      });
    </script>
    ` : ''}

    <script>
      window.addEventListener('load', () => {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('erro')) {
              const tipoErro = urlParams.get('erro');
              if (tipoErro === 'acesso_negado') {
                  // Reutiliza a lógica de modal/toast existente do sistema
                  alert('Acesso Restrito! O seu perfil não tem permissão para aceder a esta funcionalidade.');
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