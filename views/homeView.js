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

      <title>Dashboard | ERP Ecoflow</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

      <style>
        body { 
          display: flex; 
          height: 100vh; 
          margin: 0; 
          background-color: #f4f7f6;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
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
        
        /* Modals */
        .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .erp-modal .modal-header { border-bottom: 1px solid #f0f0f0; }
        .erp-modal .modal-footer { border-top: 1px solid #f0f0f0; }

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
    <div id="preloader" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; backdrop-filter: blur(4px); background: rgba(244, 247, 246, 0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; transition: opacity .3s ease;">
        <div class="spinner-border" style="color: #0D5749; width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Carregando...</span>
        </div>
    </div>

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
        <a href="/logout" class="text-danger mt-2"><i class="fas fa-sign-out-alt me-2"></i>Sair do Sistema</a>
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
        
        <div class="d-flex align-items-center gap-3">
          <button type="button"
            class="btn btn-sm notificacao-btn position-relative"
            data-bs-toggle="modal"
            data-bs-target="#notificacoesModal"
            title="Notificações"
          >
            <i class="fas fa-bell"></i>
            ${qtdNotificacoes > 0 ? `
              <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size:0.65rem;">
                ${qtdNotificacoes}
              </span>
            ` : ""}
          </button>

          <span class="usuario-badge d-none d-sm-inline-block">
            <i class="fa-solid fa-user-circle me-1"></i> ${usuario.nome}
          </span>
          
          <a href="/logout" class="btn btn-sm btn-outline-danger d-none d-md-inline-block" title="Sair">
            <i class="fas fa-sign-out-alt"></i>
          </a>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-12 col-lg-6">
          <div class="card dashboard-section-card h-100 bg-white">
            <div class="card-body p-3">
              <h6 class="dashboard-title"><i class="fa-solid fa-wrench"></i> Últimas Manutenções</h6>
              ${cardsManutencao}
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-6">
          <div class="card dashboard-section-card h-100 bg-white">
            <div class="card-body p-3">
              <h6 class="dashboard-title"><i class="fa-solid fa-clipboard-list"></i> Últimos Checklists</h6>
              ${cardsChecklist}
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-6">
          <div class="card dashboard-section-card h-100 bg-white">
            <div class="card-body p-3">
              <h6 class="dashboard-title"><i class="fa-solid fa-tags"></i> Atualizações de Preço</h6>
              ${cardsPrecos}
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-6">
          <div class="card dashboard-section-card h-100 bg-white">
            <div class="card-body p-3">
              <h6 class="dashboard-title"><i class="fa-solid fa-truck-fast"></i> Última Rota</h6>
              ${cardRota}
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

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = homeView;