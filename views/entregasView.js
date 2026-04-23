// views/entregasView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");

function entregasView(usuario, pedidos = [], clientesMap = {}, filtros = {}, paginacao = {}) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  // paginação
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  const fmtData = (d) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("pt-BR");
    } catch {
      return d || "-";
    }
  };

  const fmtDataHora = (d) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return d || "-";
    }
  };

  // Acumulador para modais de clientes (editar/excluir) fora dos modais de pedidos
  const clienteModals = [];

  const cards =
    pedidos.length > 0
      ? pedidos
        .map((p) => {
          const clientes = clientesMap[p.id] || [];

          const listaClientes =
            clientes.length > 0
              ? clientes
                .map((c) => {
                  const badge =
                    c.status === "ENTREGUE"
                      ? `<span class="badge bg-success" style="font-size:0.7rem;">Entregue</span>`
                      : c.status === "NA_ROTA"
                        ? `<span class="badge bg-warning text-dark" style="font-size:0.7rem;">Na rota para entrega</span>`
                        : `<span class="badge bg-danger" style="font-size:0.7rem;">Não entregue</span>`;
                  
                  const obs =
                    c.observacao && c.observacao.trim() !== ""
                      ? c.observacao.replace(/\n/g, "<br>")
                      : "<em class='text-muted'>Sem observação</em>";

                  // Card do cliente real (agora com data-bs-dismiss para evitar conflitos de overlay no Bootstrap)
                  const clienteCard = `
                    <div class="card chk-item border-0 shadow-sm mb-2">
                      <div class="card-body p-2 px-3">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                          <div class="text-truncate me-2" style="max-width: 70%;">
                            <strong class="text-dark d-block text-truncate" style="font-size: 0.85rem;" title="${c.cliente_nome}">${c.cliente_nome}</strong>
                            ${badge}
                          </div>
                          <div class="btn-group">
                            <button
                              type="button"
                              class="btn btn-sm btn-light border text-warning"
                              data-bs-toggle="modal"
                              data-bs-target="#editarCliente${c.id}"
                              data-bs-dismiss="modal"
                              title="Editar"
                            >
                              <i class="fa-solid fa-pen"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-light border text-danger"
                              data-bs-toggle="modal"
                              data-bs-target="#excluirCliente${c.id}"
                              data-bs-dismiss="modal"
                              title="Excluir"
                            >
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                        <div class="text-muted mb-2" style="font-size: 0.7rem;">
                          Atualizado por ${c.atualizado_por} em ${fmtDataHora(c.atualizado_em)}
                        </div>
                        <div class="p-2 bg-light rounded border text-dark" style="font-size: 0.75rem; min-height: 30px;">
                          ${obs}
                        </div>
                      </div>
                    </div>
                  `;

                  // Modal EDITAR cliente
                  const modalEditar = `
                    <div class="modal fade" id="editarCliente${c.id}" tabindex="-1">
                      <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content erp-modal">
                          <form method="POST" action="/entregas/clientes/editar/${c.id}">
                            <div class="modal-header bg-light">
                              <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-user-pen me-2 text-warning"></i> Editar Cliente</h6>
                              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body text-sm p-3">
                              <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Nome do Cliente</label>
                              <input type="text" name="cliente_nome" class="form-control form-control-sm mb-3" value="${c.cliente_nome}" required>

                              <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Status da Entrega</label>
                              <select name="status" class="form-select form-select-sm mb-3" required>
                                <option value="ENTREGUE" ${c.status === "ENTREGUE" ? "selected" : ""}>Entregue</option>
                                <option value="NA_ROTA" ${c.status === "NA_ROTA" ? "selected" : ""}>Na rota para entrega</option>
                                <option value="NAO_ENTREGUE" ${c.status === "NAO_ENTREGUE" ? "selected" : ""}>Não entregue</option>
                              </select>

                              <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Observação (opcional)</label>
                              <textarea name="observacao" class="form-control form-control-sm" rows="3">${c.observacao || ""}</textarea>
                            </div>
                            <div class="modal-footer border-top-0 bg-light">
                              <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                              <button type="submit" class="btn btn-sm btn-primary"><i class="fa-solid fa-save me-1"></i> Salvar</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  `;

                  // Modal EXCLUIR cliente
                  const modalExcluir = `
                    <div class="modal fade" id="excluirCliente${c.id}" tabindex="-1">
                      <div class="modal-dialog modal-sm modal-dialog-centered">
                        <div class="modal-content erp-modal border-0">
                          <form method="POST" action="/entregas/clientes/excluir/${c.id}">
                            <div class="modal-body text-center p-4">
                              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3 anim-pulse"></i>
                              <h6 class="mb-2 fw-bold text-dark">Excluir Cliente?</h6>
                              <p class="text-muted mb-0" style="font-size:0.85rem;">Tem certeza que deseja remover <b>${c.cliente_nome}</b> desta rota?</p>
                            </div>
                            <div class="modal-footer justify-content-center bg-light border-0">
                              <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                              <button type="submit" class="btn btn-sm btn-danger">Sim, Excluir</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  `;

                  clienteModals.push(modalEditar, modalExcluir);

                  return clienteCard;
                })
                .join("")
              : `<div class="text-center text-muted p-4" style="font-size:0.85rem;"><i class="fa-solid fa-users-slash fa-2x mb-2 opacity-50"></i><br>Nenhum cliente cadastrado neste pedido.</div>`;

          return `
              <div class="col-12 col-md-6 col-lg-4">
                <div class="card erp-card shadow-sm h-100 border-0 transition-hover"
                     style="cursor: pointer;"
                     data-bs-toggle="modal" 
                     data-bs-target="#pedidoModal${p.id}"
                     title="Clique para gerenciar a rota">
                  <div class="card-body p-3 d-flex flex-column">
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <div class="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary" style="width: 40px; height: 40px; min-width: 40px;">
                            <i class="fa-solid fa-route"></i>
                        </div>
                        <h6 class="card-title fw-bold text-dark mb-0 text-truncate" title="${p.titulo}">${p.titulo}</h6>
                    </div>
                    
                    <div class="mb-3 text-muted" style="font-size:0.8rem;">
                      <div class="mb-1"><i class="fa-regular fa-calendar me-1"></i> ${fmtData(p.data_pedido)}</div>
                      <div><i class="fa-solid fa-user-pen me-1"></i> Criado por ${p.criado_por}</div>
                    </div>
                    
                    <div class="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                      <button class="btn btn-sm btn-light border text-primary fw-medium flex-grow-1 me-2" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#pedidoModal${p.id}">
                        <i class="fa-solid fa-folder-open me-1"></i> Abrir Rota
                      </button>
                      <button class="btn btn-sm btn-light border text-danger" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#excluirPedido${p.id}" title="Excluir Rota">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal fade" id="pedidoModal${p.id}" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                  <div class="modal-content erp-modal">
                    <div class="modal-header bg-light">
                      <div>
                        <h6 class="modal-title fw-bold text-dark mb-0"><i class="fa-solid fa-route me-2 text-primary"></i> Gerenciar Rota</h6>
                        <span class="text-muted" style="font-size:0.8rem;">${p.titulo} (${fmtData(p.data_pedido)})</span>
                      </div>
                      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body bg-light p-3">
                      ${listaClientes}
                    </div>
                    <div class="modal-footer border-top-0">
                      <button class="btn btn-sm btn-success w-100" data-bs-toggle="modal" data-bs-target="#novoCliente${p.id}" data-bs-dismiss="modal">
                        <i class="fa-solid fa-user-plus me-1"></i> Adicionar Cliente à Rota
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal fade" id="novoCliente${p.id}" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content erp-modal">
                    <form method="POST" action="/entregas/${p.id}/clientes/novo">
                      <div class="modal-header bg-light">
                        <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-user-plus me-2 text-success"></i> Adicionar Cliente</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body text-sm p-3">
                        <div class="mb-3 text-muted" style="font-size:0.8rem;">
                          Rota: <strong>${p.titulo}</strong>
                        </div>
                        
                        <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Nome do Cliente</label>
                        <input type="text" name="cliente_nome" class="form-control form-control-sm mb-3" required>

                        <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Status da Entrega</label>
                        <select name="status" class="form-select form-select-sm mb-3" required>
                          <option value="NA_ROTA" selected>Na rota para entrega</option>
                          <option value="ENTREGUE">Entregue</option>
                          <option value="NAO_ENTREGUE">Não entregue</option>
                        </select>

                        <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Observação (opcional)</label>
                        <textarea name="observacao" class="form-control form-control-sm" rows="3"></textarea>
                      </div>
                      <div class="modal-footer border-top-0 bg-light">
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-success"><i class="fa-solid fa-check me-1"></i> Salvar Cliente</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div class="modal fade" id="excluirPedido${p.id}" tabindex="-1">
                <div class="modal-dialog modal-sm modal-dialog-centered">
                  <div class="modal-content erp-modal border-0">
                    <form method="POST" action="/entregas/${p.id}/excluir">
                      <div class="modal-body text-center p-4">
                        <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3 anim-pulse"></i>
                        <h6 class="mb-2 fw-bold text-dark">Excluir Rota?</h6>
                        <p class="text-muted mb-0" style="font-size:0.85rem;">Tem certeza que deseja excluir o pedido <b>${p.titulo}</b>? Todos os clientes associados também serão removidos.</p>
                      </div>
                      <div class="modal-footer justify-content-center bg-light border-0">
                        <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-danger">Sim, Excluir</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            `;
        })
        .join("")
      : `<div class="col-12 text-center text-muted mt-5"><i class="fa-solid fa-map-location-dot fa-3x opacity-25 mb-3"></i><p>Nenhuma rota/pedido cadastrado.</p></div>`;

  const paginationHtml = totalPages > 1 ? `
      <nav aria-label="Paginação de pedidos" class="mt-4">
        <ul class="pagination pagination-sm justify-content-center">
          <li class="page-item ${page <= 1 ? "disabled" : ""}">
            <a class="page-link text-dark" href="/entregas?page=${page - 1}&titulo=${encodeURIComponent(filtros.titulo || "")}&data_inicio=${encodeURIComponent(filtros.data_inicio || "")}&data_fim=${encodeURIComponent(filtros.data_fim || "")}">&laquo;</a>
          </li>

          ${Array.from({ length: totalPages }, (_, i) => {
            const p = i + 1;
            return `
              <li class="page-item ${p === page ? "active" : ""}">
                <a class="page-link ${p === page ? "fw-bold text-dark" : "text-dark"}" href="/entregas?page=${p}&titulo=${encodeURIComponent(filtros.titulo || "")}&data_inicio=${encodeURIComponent(filtros.data_inicio || "")}&data_fim=${encodeURIComponent(filtros.data_fim || "")}">${p}</a>
              </li>
            `;
          }).join("")}

          <li class="page-item ${page >= totalPages ? "disabled" : ""}">
            <a class="page-link text-dark" href="/entregas?page=${page + 1}&titulo=${encodeURIComponent(filtros.titulo || "")}&data_inicio=${encodeURIComponent(filtros.data_inicio || "")}&data_fim=${encodeURIComponent(filtros.data_fim || "")}">&raquo;</a>
          </li>
        </ul>
      </nav>
    ` : "";

  const menuHTML = menuLateral(usuario, "/entregas");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rotas | ERP Ecoflow</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    ${usuario.tipo_usuario === "admin" ? `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">` : ""}

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
      
      /* ERP Cards e Animações */
      .erp-card {
          border-radius: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
          overflow: hidden;
      }
      .transition-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.05) !important;
      }

      @keyframes pulseIcon {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); opacity: 0.8; }
        100% { transform: scale(1); }
      }
      .anim-pulse { animation: pulseIcon 1.5s infinite ease-in-out; }
      
      /* List items (Clientes) */
      .chk-item { border-left: 3px solid #0D5749 !important; transition: background 0.2s; }
      .chk-item:hover { background-color: #f8f9fa; }
      
      /* Modals */
      .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      .erp-modal .modal-header { border-bottom: 1px solid #f0f0f0; }
      .erp-modal .modal-footer { border-top: 1px solid #f0f0f0; }
      .form-control-sm, .form-select-sm { border-radius: 6px; }

      /* Pagination */
      .pagination-sm .page-link { background: transparent; border: none; font-size: 0.85rem; }
      .pagination-sm .page-item.active .page-link { background: transparent; border: none; }
      .pagination-sm .page-link:focus { box-shadow: none; }

      /* Wizard Nova Rota Styles */
      .wizard-step-rota { display: none; animation: slideIn 0.3s ease-out forwards; }
      .wizard-step-rota.active { display: block; }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
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
    ${renderLoaderParticulas("Acessando Rotas...")}

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
      
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-light border d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars"></i></button>
            <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-truck-fast text-muted me-2"></i>Gestão de Rotas</h4>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span class="usuario-badge d-none d-sm-inline-block">
            <i class="fa-solid fa-user-circle me-1"></i> ${usuario.nome}
          </span>
          <a href="/logout" class="btn btn-sm btn-outline-danger d-none d-md-inline-block" title="Sair">
            <i class="fas fa-sign-out-alt"></i>
          </a>
        </div>
      </div>

      <div class="bg-white p-3 rounded-3 shadow-sm border border-light mb-4">
        <form class="row g-2 align-items-end" method="GET" action="/entregas">
          <div class="col-12 col-md-4">
            <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Buscar Pedido/Rota</label>
            <div class="input-group input-group-sm">
                <span class="input-group-text bg-light"><i class="fa-solid fa-magnifying-glass"></i></span>
                <input type="text" name="titulo" class="form-control" value="${filtros.titulo || ""}" placeholder="Ex.: Rota Feira de Santana">
            </div>
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Data Inicial</label>
            <input type="date" name="data_inicio" class="form-control form-control-sm" value="${filtros.data_inicio || ""}">
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Data Final</label>
            <input type="date" name="data_fim" class="form-control form-control-sm" value="${filtros.data_fim || ""}">
          </div>
          <div class="col-12 col-md-2 d-flex gap-2 mt-3 mt-md-0">
            <button type="submit" class="btn btn-sm btn-primary flex-grow-1 shadow-sm">Buscar</button>
            <a href="/entregas" class="btn btn-sm btn-light border text-secondary" title="Limpar Filtros"><i class="fa-solid fa-eraser"></i></a>
          </div>
        </form>
      </div>

      <div class="d-flex flex-wrap gap-2 mb-3">
        <button class="btn btn-sm btn-success shadow-sm" data-bs-toggle="modal" data-bs-target="#novoPedidoModal">
          <i class="fa-solid fa-plus me-1"></i> Criar Nova Rota
        </button>

        ${usuario.tipo_usuario === "motorista" ? `
        <button id="btnAtivarLocalizacao" class="btn btn-sm btn-primary shadow-sm">
          <i class="fa-solid fa-location-arrow me-1"></i> Ativar Localização
        </button>
        ` : ""}

        ${usuario.tipo_usuario === "admin" ? `
        <button class="btn btn-sm btn-outline-primary shadow-sm" data-bs-toggle="modal" data-bs-target="#mapaMotoristasModal">
          <i class="fa-solid fa-map-location-dot me-1"></i> Rastreio em Tempo Real
        </button>
        ` : ""}
      </div>

      <div class="row g-3">
        ${cards}
      </div>

      ${paginationHtml}
    </div>

    <div class="modal fade" id="novoPedidoModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <form id="wizardRotaForm" class="modal-content erp-modal" onsubmit="event.preventDefault();">
          
          <div class="wizard-header bg-light p-3 border-bottom rounded-top">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-0 text-dark" id="stepTitleRota" style="font-size: 0.9rem;">Passo 1</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" onclick="resetWizardRota()"></button>
            </div>
            <div class="wizard-progress mt-2" style="height: 6px; background-color: #e9ecef; border-radius: 10px;">
              <div class="wizard-progress-bar" id="progressBarRota" style="height: 100%; background-color: #0D5749; width: 33%; transition: width 0.3s ease;"></div>
            </div>
          </div>
          
          <div class="modal-body p-4" style="min-height: 400px; background: #fcfcfc;">

            <div class="wizard-step-rota active" data-title="Dados Gerais">
              <div class="text-center mb-4 mt-2">
                 <i class="fa-solid fa-map-location-dot fa-3x text-primary mb-3 opacity-75"></i>
                 <h6 class="fw-bold text-dark">Informações da Rota</h6>
                 <p class="text-muted small">Defina o nome da rota e a data prevista da entrega.</p>
              </div>
              <div class="mb-3">
                  <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Título/Destino da Rota</label>
                  <input type="text" id="rotaTitulo" class="form-control form-control-sm py-2" required placeholder="Ex: Rota Centro / Camaçari">
              </div>
              <div class="mb-3">
                  <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Data Prevista</label>
                  <input type="date" id="rotaData" class="form-control form-control-sm py-2" required>
              </div>
            </div>

            <div class="wizard-step-rota" data-title="Clientes">
              <div class="text-center mb-3 mt-1">
                 <i class="fa-solid fa-users fa-2x text-success mb-2 opacity-75"></i>
                 <h6 class="fw-bold text-dark">Inserir Clientes na Rota</h6>
              </div>
              
              <div class="bg-white p-3 rounded-3 border mb-3 shadow-sm">
                <div class="row g-2">
                  <div class="col-12 col-md-6">
                    <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Nome do Cliente</label>
                    <input type="text" id="tempClienteNome" class="form-control form-control-sm" placeholder="Ex: João da Silva">
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Status da Entrega</label>
                    <select id="tempClienteStatus" class="form-select form-select-sm">
                      <option value="NA_ROTA" selected>Na rota para entrega</option>
                      <option value="ENTREGUE">Entregue</option>
                      <option value="NAO_ENTREGUE">Não entregue</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Observação (opcional)</label>
                    <input type="text" id="tempClienteObs" class="form-control form-control-sm" placeholder="Algum detalhe extra sobre a entrega?">
                  </div>
                  <div class="col-12 mt-2 text-end">
                    <button type="button" class="btn btn-sm btn-primary w-100" onclick="addClientToWizard()">
                      <i class="fa-solid fa-plus me-1"></i> Adicionar Cliente
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div class="wizard-step-rota" data-title="Gerenciar Rota">
              <div class="text-center mb-3">
                 <i class="fa-solid fa-route fa-2x text-warning mb-2 opacity-75"></i>
                 <h6 class="fw-bold text-dark">Revisão Final da Rota</h6>
              </div>
              <div class="bg-white p-3 rounded-3 shadow-sm border mb-3">
                <p class="mb-1" style="font-size:0.85rem;"><span class="text-muted">Rota:</span> <strong id="resumoRotaTitulo">-</strong></p>
                <p class="mb-0" style="font-size:0.85rem;"><span class="text-muted">Data:</span> <strong id="resumoRotaData">-</strong></p>
              </div>
              
              <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="fw-bold text-dark mb-0" style="font-size:0.85rem;">Clientes nesta Rota:</h6>
                  <span id="resumoClientBadge" class="badge bg-success">0</span>
              </div>
              
              <div id="resumoClientList" style="max-height: 280px; overflow-y: auto;">
                </div>
            </div>

          </div>

          <div class="modal-footer bg-light border-0 d-flex justify-content-between p-3 rounded-bottom-3">
            <button type="button" class="btn btn-sm btn-outline-secondary px-4 py-2" id="prevBtnRota" onclick="nextPrevRota(-1)" style="display:none;">Voltar</button>
            <button type="button" class="btn btn-sm btn-primary flex-grow-1 ms-2 py-2 fw-bold shadow-sm" id="nextBtnRota" onclick="nextPrevRota(1)">Próximo <i class="fa-solid fa-chevron-right ms-1"></i></button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="sucessoRotaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0">
          <div class="modal-body text-center p-5">
            <i class="fa-solid fa-circle-check fa-4x text-success mb-3 anim-pulse"></i>
            <h5 class="fw-bold text-dark mb-2">Rota Salva!</h5>
            <p class="text-muted mb-0" style="font-size:0.85rem;">Salvando os dados, por favor aguarde...</p>
          </div>
        </div>
      </div>
    </div>

    ${clienteModals.join("")}

    ${usuario.tipo_usuario === "admin" ? `
    <div class="modal fade" id="mapaMotoristasModal" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content erp-modal">
          <div class="modal-header bg-light">
            <div>
                <h6 class="modal-title fw-bold text-dark mb-0"><i class="fa-solid fa-satellite-dish me-2 text-primary"></i> Rastreamento de Motoristas</h6>
                <span class="text-muted" style="font-size:0.8rem;">Localização em tempo real</span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-2 bg-light">
            <div class="card border-0 shadow-sm overflow-hidden rounded-3">
                <div id="mapaMotoristas" style="height: 65vh; width: 100%; z-index: 1;"></div>
            </div>
            <div class="text-muted mt-2 ps-1" style="font-size:0.75rem;">
              <i class="fa-solid fa-circle-info me-1"></i> O mapa atualiza automaticamente. O motorista precisa estar com a localização ativada no aplicativo.
            </div>
          </div>
        </div>
      </div>
    </div>
    ` : ""}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

    <script>
      let isSubmittingRota = false;
      let currentTabRota = 0;
      let tempClients = [];

      function showTabRota(n) {
        const steps = document.getElementsByClassName("wizard-step-rota");
        for (let i = 0; i < steps.length; i++) {
          steps[i].style.display = "none";
          steps[i].classList.remove("active");
        }
        steps[n].style.display = "block";
        steps[n].classList.add("active");
        
        const title = steps[n].getAttribute("data-title");
        document.getElementById("stepTitleRota").innerText = "Passo " + (n + 1) + " de " + steps.length + " - " + title;
        
        const progress = ((n + 1) / steps.length) * 100;
        document.getElementById("progressBarRota").style.width = progress + "%";

        document.getElementById("prevBtnRota").style.display = (n === 0) ? "none" : "inline-block";

        const nextBtn = document.getElementById("nextBtnRota");
        
        if (n === 1) { 
            nextBtn.innerHTML = 'Ir para Gerenciar Rota <i class="fa-solid fa-chevron-right ms-1"></i>';
            nextBtn.classList.replace("btn-success", "btn-primary");
        }
        else if (n === (steps.length - 1)) { 
          nextBtn.innerHTML = 'Salvar Rota Completa <i class="fa-solid fa-save ms-1"></i>';
          nextBtn.classList.replace("btn-primary", "btn-success");
          
          document.getElementById("resumoRotaTitulo").innerText = document.getElementById("rotaTitulo").value;
          
          let dataStr = document.getElementById("rotaData").value;
          if(dataStr) {
             const dtParts = dataStr.split("-");
             document.getElementById("resumoRotaData").innerText = dtParts[2] + "/" + dtParts[1] + "/" + dtParts[0];
          }
          
          renderResumoList();

        } else {
          nextBtn.innerHTML = 'Próximo <i class="fa-solid fa-chevron-right ms-1"></i>';
          nextBtn.classList.replace("btn-success", "btn-primary");
        }
      }

      function validateFormRota(tabIndex) {
        const step = document.getElementsByClassName("wizard-step-rota")[tabIndex];
        const inputs = step.querySelectorAll("input[required], select[required], textarea[required]");
        let valid = true;
        for (let i = 0; i < inputs.length; i++) {
          if (!inputs[i].checkValidity()) {
            inputs[i].reportValidity();
            valid = false;
            break;
          }
        }
        return valid;
      }

      function editClientFromWizard(index) {
           const c = tempClients[index];
           document.getElementById("tempClienteNome").value = c.nome;
           document.getElementById("tempClienteStatus").value = c.status;
           document.getElementById("tempClienteObs").value = c.obs;
           removeClientFromWizard(index); 
           showTabRota(1); 
      }

      function addClientToWizard() {
         const nome = document.getElementById("tempClienteNome").value.trim();
         const status = document.getElementById("tempClienteStatus").value;
         const statusText = document.getElementById("tempClienteStatus").options[document.getElementById("tempClienteStatus").selectedIndex].text;
         const obs = document.getElementById("tempClienteObs").value.trim();

         if(!nome) {
             alert("Por favor, preencha o nome do cliente.");
             return;
         }

         tempClients.push({ nome, status, statusText, obs });
         
         document.getElementById("tempClienteNome").value = "";
         document.getElementById("tempClienteObs").value = "";
         document.getElementById("tempClienteNome").focus();
         
         nextPrevRota(1); 
      }

      function removeClientFromWizard(index) {
          tempClients.splice(index, 1);
          renderResumoList(); 
      }

      function renderResumoList() {
          const list = document.getElementById("resumoClientList");
          const badge = document.getElementById("resumoClientBadge");
          
          badge.innerText = tempClients.length;

          if(tempClients.length === 0) {
              list.innerHTML = '<div class="text-center text-muted p-4" style="font-size:0.85rem;"><i class="fa-solid fa-users-slash fa-2x mb-2 opacity-50"></i><br>Nenhum cliente cadastrado nesta rota. Adicione clicando em "Voltar".</div>';
              return;
          }
          
          let html = '';
          tempClients.forEach((c, i) => {
              let bClass = c.status === 'ENTREGUE' ? 'bg-success' : c.status === 'NA_ROTA' ? 'bg-warning text-dark' : 'bg-danger';
              let obs = c.obs ? c.obs : "<em class='text-muted'>Sem observação</em>";

              html += \`
                <div class="card chk-item border-0 shadow-sm mb-2">
                  <div class="card-body p-2 px-3">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                      <div class="text-truncate me-2" style="max-width: 70%;">
                        <strong class="text-dark d-block text-truncate" style="font-size: 0.85rem;" title="\${c.nome}">\${c.nome}</strong>
                        <span class="badge \${bClass}" style="font-size:0.7rem;">\${c.statusText}</span>
                      </div>
                      <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-light border text-warning" title="Editar Cliente" onclick="editClientFromWizard(\${i})">
                          <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-light border text-danger" title="Remover Cliente" onclick="removeClientFromWizard(\${i})">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div class="text-muted mb-2" style="font-size: 0.7rem;">
                      Adicionado agora ao pacote desta rota
                    </div>
                    <div class="p-2 bg-light rounded border text-dark" style="font-size: 0.75rem; min-height: 30px;">
                      \${obs}
                    </div>
                  </div>
                </div>
              \`;
          });
          list.innerHTML = html;
      }

      function nextPrevRota(n) {
        const steps = document.getElementsByClassName("wizard-step-rota");
        
        if (n === 1 && !validateFormRota(currentTabRota)) return false;
        
        currentTabRota = currentTabRota + n;
        
        if (currentTabRota >= steps.length) {
          saveRouteAndClientsViaAjax();
          return false;
        }
        
        showTabRota(currentTabRota);
      }

      // Função de Salvamento AJAX
      function saveRouteAndClientsViaAjax() {
          isSubmittingRota = true; 

          // Exibe o modal de Sucesso Animado
          const wizardEl = document.getElementById('novoPedidoModal');
          const wizardModal = bootstrap.Modal.getOrCreateInstance(wizardEl);
          wizardModal.hide();

          const successEl = document.getElementById('sucessoRotaModal');
          const successModal = bootstrap.Modal.getOrCreateInstance(successEl);
          successModal.show();

          const tituloRota = document.getElementById('rotaTitulo').value;
          const dataRota = document.getElementById('rotaData').value;
          
          const routeData = new URLSearchParams();
          routeData.append('titulo', tituloRota);
          routeData.append('data_pedido', dataRota);

          // 1. Cria a rota
          fetch('/entregas/novo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: routeData.toString()
          })
          .then(() => {
              // 2. Busca a rota recém criada para descobrir o ID gerado pelo banco
              return fetch('/entregas?titulo=' + encodeURIComponent(tituloRota));
          })
          .then(res => res.text())
          .then(html => {
              // RegExp segura para capturar os IDs de pedidos retornados na busca
              const regex = new RegExp('id="pedidoModal(\\\\\\d+)"', 'g');
              const matches = [...html.matchAll(regex)];
              
              if (matches.length > 0) {
                  const ids = matches.map(m => parseInt(m[1]));
                  const newId = Math.max(...ids);
                  
                  if (tempClients.length > 0) {
                      // 3. Cadastra os clientes 1 a 1 na nova rota usando o endpoint nativo
                      const promises = tempClients.map(c => {
                          const cData = new URLSearchParams();
                          cData.append('cliente_nome', c.nome);
                          cData.append('status', c.status);
                          cData.append('observacao', c.obs);
                          
                          return fetch('/entregas/' + newId + '/clientes/novo', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                              body: cData.toString()
                          });
                      });
                      
                      Promise.all(promises).then(() => {
                          setTimeout(() => window.location.reload(), 600);
                      }).catch(err => {
                          console.error(err);
                          window.location.reload();
                      });
                  } else {
                      setTimeout(() => window.location.reload(), 600);
                  }
              } else {
                  window.location.reload();
              }
          })
          .catch(err => {
              console.error(err);
              window.location.reload();
          });
      }

      function resetWizardRota() {
        currentTabRota = 0;
        tempClients = [];
        showTabRota(0);
      }

      window.addEventListener('load', () => {
        const modalEl = document.getElementById('novoPedidoModal');
        if(modalEl) {
           modalEl.addEventListener('hidden.bs.modal', function () {
             if (!isSubmittingRota) {
               document.getElementById("wizardRotaForm").reset();
               resetWizardRota();
             }
           });
        }
        resetWizardRota();
      });
    </script>

    <script>
      window.NOME_USUARIO = "${usuario.nome}";
    </script>
    <script src="/socket.io/socket.io.js"></script>

    ${usuario.tipo_usuario === "admin" ? `
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
      (() => {
        let map;
        let markers = new Map(); 
        let ultimaLista = [];
        const socket = io();

        socket.emit("admin:join");

        function initMap() {
          if (map) return;

          map = L.map("mapaMotoristas").setView([-12.9714, -38.5014], 11);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19
          }).addTo(map);
        }

        function render(lista) {
          if (!map) return;

          const idsAtuais = new Set(lista.map(x => x.id || x.nome));

          for (const [id, mk] of markers.entries()) {
            if (!idsAtuais.has(id)) {
              map.removeLayer(mk);
              markers.delete(id);
            }
          }

          lista.forEach(m => {
            const key = m.id || m.nome;
            const pos = [m.lat, m.lng];

            const label = \`
              <div style="font-family: 'Segoe UI', sans-serif;">
                  <strong style="color: #0D5749; font-size:14px;">\${m.nome || "Motorista"}</strong><br>
                  <span style="font-size:11px; color:#666;">\${m.updatedAt ? new Date(m.updatedAt).toLocaleString("pt-BR") : ""}</span>
                  \${m.accuracy ? \`<br><span style="font-size:11px; color:#888;">Precisão: \${Math.round(m.accuracy)}m</span>\` : ""}
              </div>
            \`;

            if (markers.has(key)) {
              markers.get(key).setLatLng(pos).setPopupContent(label);
            } else {
              const mk = L.marker(pos).addTo(map).bindPopup(label);
              markers.set(key, mk);
            }
          });
        }

        const modal = document.getElementById("mapaMotoristasModal");
        modal?.addEventListener("shown.bs.modal", () => {
          initMap();
          setTimeout(() => {
            map.invalidateSize();
            render(ultimaLista);
          }, 200);
        });

        socket.on("motoristas:update", (lista) => {
          ultimaLista = Array.isArray(lista) ? lista : [];
          render(ultimaLista);
        });
      })();
      </script>
    ` : ""}

    ${usuario.tipo_usuario === "motorista" ? `
      <script src="/script/motoristaTracker.js"></script>
      <script>
        document.getElementById("btnAtivarLocalizacao")?.addEventListener("click", () => {
          if (typeof window.iniciarRastreamento === "function") {
             window.iniciarRastreamento();
          } else {
             console.log("Ativar localização clicado (fallback)");
          }
        });
      </script>
    ` : ""}

  </body>
  </html>
  `;
}

module.exports = entregasView;