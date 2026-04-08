// views/entregasView.js
const menuLateral = require("./menuLateral");

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

                  // Card do cliente (aparece dentro do modal do pedido)
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
                              class="btn btn-sm btn-light border text-warning"
                              data-bs-toggle="modal"
                              data-bs-target="#editarCliente${c.id}"
                              title="Editar"
                            >
                              <i class="fa-solid fa-pen"></i>
                            </button>
                            <button
                              class="btn btn-sm btn-light border text-danger"
                              data-bs-toggle="modal"
                              data-bs-target="#excluirCliente${c.id}"
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

                  // Modal EDITAR cliente (fora do modal de pedido)
                  const modalEditar = `
                    <div class="modal fade" id="editarCliente${c.id}" tabindex="-1">
                      <div class="modal-dialog">
                        <div class="modal-content erp-modal">
                          <form method="POST" action="/entregas/clientes/editar/${c.id}">
                            <div class="modal-header">
                              <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-user-pen me-2 text-warning"></i> Editar Cliente</h6>
                              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body text-sm">
                              <label class="form-label" style="font-size:0.8rem;">Nome do Cliente</label>
                              <input type="text" name="cliente_nome" class="form-control form-control-sm mb-2" value="${c.cliente_nome}" required>

                              <label class="form-label" style="font-size:0.8rem;">Status da Entrega</label>
                              <select name="status" class="form-select form-select-sm mb-2" required>
                                <option value="ENTREGUE" ${c.status === "ENTREGUE" ? "selected" : ""}>Entregue</option>
                                <option value="NA_ROTA" ${c.status === "NA_ROTA" ? "selected" : ""}>Na rota para entrega</option>
                                <option value="NAO_ENTREGUE" ${c.status === "NAO_ENTREGUE" ? "selected" : ""}>Não entregue</option>
                              </select>

                              <label class="form-label" style="font-size:0.8rem;">Observação (opcional)</label>
                              <textarea name="observacao" class="form-control form-control-sm" rows="3">${c.observacao || ""}</textarea>
                            </div>
                            <div class="modal-footer bg-light">
                              <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                              <button type="submit" class="btn btn-sm btn-primary"><i class="fa-solid fa-save me-1"></i> Salvar</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  `;

                  // Modal EXCLUIR cliente (fora do modal de pedido)
                  const modalExcluir = `
                    <div class="modal fade" id="excluirCliente${c.id}" tabindex="-1">
                      <div class="modal-dialog modal-sm modal-dialog-centered">
                        <div class="modal-content erp-modal">
                          <form method="POST" action="/entregas/clientes/excluir/${c.id}">
                            <div class="modal-body text-center p-4">
                              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                              <h6 class="mb-2">Excluir Cliente?</h6>
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

                  // Guardamos os modais para renderizar fora do modal de pedido
                  clienteModals.push(modalEditar, modalExcluir);

                  return clienteCard;
                })
                .join("")
              : `<div class="text-center text-muted p-4" style="font-size:0.85rem;"><i class="fa-solid fa-users-slash fa-2x mb-2 opacity-50"></i><br>Nenhum cliente cadastrado neste pedido.</div>`;

          return `
              <div class="col-12 col-md-6 col-lg-4">
                <div class="card erp-card shadow-sm h-100 border-0"
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
                <div class="modal-dialog">
                  <div class="modal-content erp-modal">
                    <form method="POST" action="/entregas/${p.id}/clientes/novo">
                      <div class="modal-header">
                        <h6 class="modal-title fw-bold"><i class="fa-solid fa-user-plus me-2 text-success"></i> Adicionar Cliente</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body text-sm">
                        <div class="mb-3 text-muted" style="font-size:0.8rem;">
                          Rota: <strong>${p.titulo}</strong>
                        </div>
                        
                        <label class="form-label" style="font-size:0.8rem;">Nome do Cliente</label>
                        <input type="text" name="cliente_nome" class="form-control form-control-sm mb-2" required>

                        <label class="form-label" style="font-size:0.8rem;">Status da Entrega</label>
                        <select name="status" class="form-select form-select-sm mb-2" required>
                          <option value="NA_ROTA" selected>Na rota para entrega</option>
                          <option value="ENTREGUE">Entregue</option>
                          <option value="NAO_ENTREGUE">Não entregue</option>
                        </select>

                        <label class="form-label" style="font-size:0.8rem;">Observação (opcional)</label>
                        <textarea name="observacao" class="form-control form-control-sm" rows="3"></textarea>
                      </div>
                      <div class="modal-footer bg-light">
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-success"><i class="fa-solid fa-check me-1"></i> Salvar Cliente</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div class="modal fade" id="excluirPedido${p.id}" tabindex="-1">
                <div class="modal-dialog modal-sm modal-dialog-centered">
                  <div class="modal-content erp-modal">
                    <form method="POST" action="/entregas/${p.id}/excluir">
                      <div class="modal-body text-center p-4">
                        <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                        <h6 class="mb-2">Excluir Rota?</h6>
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

  // HTML da paginação minimalista
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
    <title>Entregas e Rotas | ERP Ecoflow</title>

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

    <div class="modal fade" id="novoPedidoModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content erp-modal">
          <form method="POST" action="/entregas/novo">
            <div class="modal-header">
              <h6 class="modal-title fw-bold"><i class="fa-solid fa-route text-success me-2"></i> Criar Nova Rota</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-sm">
              <div class="mb-3">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Título/Cidade da Rota</label>
                  <input type="text" name="titulo" class="form-control form-control-sm" required placeholder="Ex: Rota Centro">
              </div>
              <div>
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Data Prevista</label>
                  <input type="date" name="data_pedido" class="form-control form-control-sm" required>
              </div>
            </div>
            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-success"><i class="fa-solid fa-check me-1"></i> Salvar Rota</button>
            </div>
          </form>
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
      window.NOME_USUARIO = "${usuario.nome}";
    </script>
    <script src="/socket.io/socket.io.js"></script>

    ${usuario.tipo_usuario === "admin" ? `
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
      (() => {
        let map;
        let markers = new Map(); // key = id do motorista (socket.id) ou nome (fallback)
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