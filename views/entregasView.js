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
                      ? `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-50 shadow-sm" style="font-size:0.65rem;">Entregue</span>`
                      : c.status === "NA_ROTA"
                        ? `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-50 shadow-sm" style="font-size:0.65rem;">Na rota para entrega</span>`
                        : `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-50 shadow-sm" style="font-size:0.65rem;">Não entregue</span>`;
                  
                  const obs =
                    c.observacao && c.observacao.trim() !== ""
                      ? c.observacao.replace(/\n/g, "<br>")
                      : "<em class='text-muted'>Sem observação</em>";

                  // Card do cliente real
                  const clienteCard = `
                    <div class="card chk-item border-custom bg-custom-darker shadow-sm mb-2">
                      <div class="card-body p-2 px-3">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                          <div class="text-truncate me-2" style="max-width: 70%;">
                            <strong class="text-white d-block text-truncate" style="font-size: 0.85rem;" title="${c.cliente_nome}">${c.cliente_nome}</strong>
                            ${badge}
                          </div>
                          <div class="btn-group">
                            <button
                              type="button"
                              class="btn btn-sm btn-outline-secondary border-custom text-warning"
                              data-bs-toggle="modal"
                              data-bs-target="#editarCliente${c.id}"
                              data-bs-dismiss="modal"
                              title="Editar"
                            >
                              <i class="fa-solid fa-pen" style="font-size: 0.75rem;"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-outline-secondary border-custom text-danger ms-1"
                              data-bs-toggle="modal"
                              data-bs-target="#excluirCliente${c.id}"
                              data-bs-dismiss="modal"
                              title="Excluir"
                            >
                              <i class="fa-solid fa-trash" style="font-size: 0.75rem;"></i>
                            </button>
                          </div>
                        </div>
                        <div class="text-muted mb-2" style="font-size: 0.7rem;">
                          Atualizado por <span class="text-light">${c.atualizado_por}</span> em ${fmtDataHora(c.atualizado_em)}
                        </div>
                        <div class="p-2 bg-custom-dark rounded border-custom text-white" style="font-size: 0.75rem; min-height: 30px;">
                          ${obs}
                        </div>
                      </div>
                    </div>
                  `;

                  // Modal EDITAR cliente (Com AJAX)
                  const modalEditar = `
                    <div class="modal fade" id="editarCliente${c.id}" tabindex="-1" data-bs-backdrop="static">
                      <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content erp-modal shadow-lg border-0 bg-custom-darker">
                          <form method="POST" action="/entregas/clientes/editar/${c.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Cliente Atualizado!')">
                            <div class="modal-header bg-custom-darker border-custom">
                              <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-user-pen me-2 text-warning"></i> Editar Cliente</h6>
                              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body text-sm p-4 bg-custom-dark">
                              <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Nome do Cliente</label>
                              <input type="text" name="cliente_nome" class="form-control form-control-sm mb-3 shadow-sm" value="${c.cliente_nome}" required>

                              <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Status da Entrega</label>
                              <select name="status" class="form-select form-select-sm mb-3 shadow-sm text-white" required>
                                <option value="ENTREGUE" ${c.status === "ENTREGUE" ? "selected" : ""}>Entregue</option>
                                <option value="NA_ROTA" ${c.status === "NA_ROTA" ? "selected" : ""}>Na rota para entrega</option>
                                <option value="NAO_ENTREGUE" ${c.status === "NAO_ENTREGUE" ? "selected" : ""}>Não entregue</option>
                              </select>

                              <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Observação (opcional)</label>
                              <textarea name="observacao" class="form-control form-control-sm shadow-sm" rows="3">${c.observacao || ""}</textarea>
                            </div>
                            <div class="modal-footer border-custom bg-custom-darker d-flex flex-nowrap">
                              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
                              <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm text-dark"><i class="fa-solid fa-save me-1"></i> Salvar</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  `;

                  // Modal EXCLUIR cliente (Com AJAX)
                  const modalExcluir = `
                    <div class="modal fade" id="excluirCliente${c.id}" tabindex="-1" data-bs-backdrop="static">
                      <div class="modal-dialog modal-sm modal-dialog-centered">
                        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
                          <form method="POST" action="/entregas/clientes/excluir/${c.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Cliente Removido!')">
                            <div class="modal-body text-center p-4">
                              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3 anim-pulse"></i>
                              <h6 class="mb-2 fw-bold text-white" style="font-size: 0.9rem;">Excluir Cliente?</h6>
                              <p class="text-muted mb-0" style="font-size:0.8rem;">Tem certeza que deseja remover <b>${c.cliente_nome}</b> desta rota?</p>
                            </div>
                            <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
                              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
                              <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Sim, Excluir</button>
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

          // GRELHA AJUSTADA PARA 4 COLUNAS EM TELAS GRANDES (col-xl-3)
          return `
              <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                <div class="card erp-card bg-custom-darker shadow-sm h-100 border-custom transition-hover"
                     style="cursor: pointer;"
                     data-bs-toggle="modal" 
                     data-bs-target="#pedidoModal${p.id}"
                     title="Clique para gerenciar a rota">
                  <div class="card-body p-2 d-flex flex-column">
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <div class="rounded-circle bg-custom-dark border-custom d-flex align-items-center justify-content-center text-accent flex-shrink-0" style="width: 32px; height: 32px; min-width: 32px;">
                            <i class="fa-solid fa-route" style="font-size: 0.85rem;"></i>
                        </div>
                        <h6 class="card-title fw-bold text-white mb-0 text-truncate" style="font-size: 0.85rem;" title="${p.titulo}">${p.titulo}</h6>
                    </div>
                    
                    <div class="mb-2 text-muted" style="font-size:0.75rem;">
                      <div class="mb-1 text-truncate"><i class="fa-regular fa-calendar me-1"></i> ${fmtData(p.data_pedido)}</div>
                      <div class="text-truncate"><i class="fa-solid fa-user-pen me-1"></i> Criado por <span class="text-light">${p.criado_por}</span></div>
                    </div>
                    
                    <div class="mt-auto pt-2 border-top border-custom d-flex justify-content-between align-items-center">
                      <button class="btn btn-sm btn-outline-secondary border-custom text-accent fw-bold flex-grow-1 me-2 shadow-sm py-1" style="font-size: 0.7rem;" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#pedidoModal${p.id}">
                        <i class="fa-solid fa-folder-open me-1"></i> Abrir
                      </button>
                      <button class="btn btn-sm btn-outline-secondary border-custom text-danger shadow-sm py-1 px-2" style="font-size: 0.7rem;" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#excluirPedido${p.id}" title="Excluir Rota">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal fade" id="pedidoModal${p.id}" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                  <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
                    <div class="modal-header bg-custom-darker border-custom">
                      <div>
                        <h6 class="modal-title fw-bold text-white mb-0" style="font-size: 0.85rem;"><i class="fa-solid fa-route me-2 text-accent"></i> Gerenciar Rota</h6>
                        <span class="text-muted" style="font-size:0.75rem;">${p.titulo} (${fmtData(p.data_pedido)})</span>
                      </div>
                      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body bg-custom-dark p-3">
                      ${listaClientes}
                    </div>
                    <div class="modal-footer border-custom bg-custom-darker">
                      <button class="btn btn-sm btn-success w-100 fw-bold shadow-sm text-dark" data-bs-toggle="modal" data-bs-target="#novoCliente${p.id}" data-bs-dismiss="modal">
                        <i class="fa-solid fa-user-plus me-1"></i> Adicionar Cliente à Rota
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal fade" id="novoCliente${p.id}" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content erp-modal shadow-lg border-0 bg-custom-darker">
                    <form method="POST" action="/entregas/${p.id}/clientes/novo" onsubmit="prepararSubmissaoSimples(event, this, 'Cliente Adicionado!')">
                      <div class="modal-header bg-custom-darker border-custom">
                        <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-user-plus me-2 text-success"></i> Adicionar Cliente</h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body text-sm p-4 bg-custom-dark">
                        <div class="mb-4 text-muted bg-custom-darker p-2 border-custom rounded shadow-sm" style="font-size:0.8rem;">
                          Rota selecionada: <strong class="text-white">${p.titulo}</strong>
                        </div>
                        
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Nome do Cliente</label>
                        <input type="text" name="cliente_nome" class="form-control form-control-sm mb-3 shadow-sm" required>

                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Status da Entrega</label>
                        <select name="status" class="form-select form-select-sm mb-3 shadow-sm text-white" required>
                          <option value="NA_ROTA" selected>Na rota para entrega</option>
                          <option value="ENTREGUE">Entregue</option>
                          <option value="NAO_ENTREGUE">Não entregue</option>
                        </select>

                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Observação (opcional)</label>
                        <textarea name="observacao" class="form-control form-control-sm shadow-sm" rows="3"></textarea>
                      </div>
                      <div class="modal-footer border-custom bg-custom-darker d-flex flex-nowrap">
                        <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-success w-100 fw-bold shadow-sm text-dark"><i class="fa-solid fa-check me-1"></i> Salvar Cliente</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div class="modal fade" id="excluirPedido${p.id}" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-sm modal-dialog-centered">
                  <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
                    <form method="POST" action="/entregas/${p.id}/excluir" onsubmit="prepararSubmissaoSimples(event, this, 'Rota Excluída!')">
                      <div class="modal-body text-center p-4">
                        <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3 anim-pulse"></i>
                        <h6 class="mb-2 fw-bold text-white" style="font-size: 0.9rem;">Excluir Rota?</h6>
                        <p class="text-muted mb-0" style="font-size:0.8rem;">Tem certeza que deseja excluir o pedido <b>${p.titulo}</b>? Todos os clientes associados também serão removidos.</p>
                      </div>
                      <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
                        <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Sim, Excluir</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            `;
        })
        .join("")
      : `<div class="col-12 text-center text-muted mt-5 text-center-empty"><i class="fa-solid fa-map-location-dot fa-3x opacity-25 mb-3 d-block"></i><span style="font-size: 0.8rem;">Nenhuma rota/pedido cadastrado para este filtro.</span></div>`;

  // PAGINAÇÃO INTELIGENTE (Delta)
  const pageLinks = (() => {
    const delta = 2;
    let paginas = [];
    let ultima;
    let html = '';

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        paginas.push(i);
      }
    }

    paginas.forEach(p => {
      if (ultima) {
        if (p - ultima === 2) {
          html += `<li class="page-item"><a class="page-link text-white bg-transparent border-secondary" href="/entregas?page=${ultima + 1}&titulo=${encodeURIComponent(filtros.titulo || "")}&data_inicio=${encodeURIComponent(filtros.data_inicio || "")}&data_fim=${encodeURIComponent(filtros.data_fim || "")}" onclick="navegarPagina(event, this.href)">${ultima + 1}</a></li>`;
        } else if (p - ultima > 2) {
          html += `<li class="page-item disabled"><span class="page-link text-muted bg-transparent border-0">...</span></li>`;
        }
      }
      html += `<li class="page-item ${p === page ? "active" : ""}"><a class="page-link text-white ${p === page ? "fw-bold bg-verde border-verde text-dark" : "bg-transparent border-secondary"}" href="/entregas?page=${p}&titulo=${encodeURIComponent(filtros.titulo || "")}&data_inicio=${encodeURIComponent(filtros.data_inicio || "")}&data_fim=${encodeURIComponent(filtros.data_fim || "")}" onclick="navegarPagina(event, this.href)">${p}</a></li>`;
      ultima = p;
    });

    return html;
  })();

  const paginationHtml = totalPages > 1 ? `
    <nav aria-label="Paginação de pedidos" class="mt-4">
      <ul class="pagination pagination-sm justify-content-center mb-0">
        <li class="page-item ${page <= 1 ? "disabled" : ""}">
          <a class="page-link text-white bg-transparent border-secondary" href="/entregas?page=${page - 1}&titulo=${encodeURIComponent(filtros.titulo || "")}&data_inicio=${encodeURIComponent(filtros.data_inicio || "")}&data_fim=${encodeURIComponent(filtros.data_fim || "")}" onclick="navegarPagina(event, this.href)">&laquo;</a>
        </li>
        ${pageLinks}
        <li class="page-item ${page >= totalPages ? "disabled" : ""}">
          <a class="page-link text-white bg-transparent border-secondary" href="/entregas?page=${page + 1}&titulo=${encodeURIComponent(filtros.titulo || "")}&data_inicio=${encodeURIComponent(filtros.data_inicio || "")}&data_fim=${encodeURIComponent(filtros.data_fim || "")}" onclick="navegarPagina(event, this.href)">&raquo;</a>
        </li>
      </ul>
    </nav>
  ` : "";

  const menuHTML = menuLateral(user, "/entregas");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rotas | Ecoflow</title>
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    ${user.tipo_usuario === "admin" ? `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">` : ""}

    <style>
      /* Scrollbars Globais (Dark & Green) */
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
      html, body, .content, .table-responsive, .modal-body, .offcanvas-body { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

      body { 
          display: flex; 
          height: 100vh; 
          margin: 0; 
          background-color: #1f1f1f;
          color: #ffffff;
          font-family: 'Segoe UI', sans-serif;
      }
      
      /* Sidebar */
      .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column;}
      .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s;}
      .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
      
      .content { flex: 1; padding: 24px; overflow-y: auto; background-color: #1f1f1f; }
      
      /* Tema Escuro Customizado */
      .bg-custom-dark { background-color: #2a2a2a !important; }
      .bg-custom-darker { background-color: #222222 !important; }
      .border-custom { border-color: rgba(255,255,255,0.08) !important; border-width: 1px; }
      .text-accent { color: #08c068 !important; }
      .bg-verde { background-color: #08c068 !important; }
      .border-verde { border-color: #08c068 !important; }

      /* Modificadores Bootstrap */
      .text-dark { color: #ffffff !important; }
      .text-muted { color: rgba(255,255,255,0.5) !important; }
      
      .btn-primary, .btn-success { background-color: #08c068; border-color: #08c068; color: #1f1f1f; }
      .btn-primary:hover, .btn-success:hover, .btn-primary:active, .btn-success:active { background-color: #06a055 !important; border-color: #06a055 !important; color: #ffffff !important; }
      .btn-outline-primary, .btn-outline-success { color: #08c068; border-color: #08c068; }
      .btn-outline-primary:hover, .btn-outline-success:hover { background-color: #08c068; color: #1f1f1f; border-color: #08c068; }
      
      .btn-outline-secondary { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }
      .btn-outline-secondary:hover { background-color: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.3); }

      /* Inputs e Selects */
      .form-control, .form-select, .input-group-text { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.8rem; }
      .form-control:focus, .form-select:focus { background-color: #2a2a2a; border-color: #08c068; color: #fff; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }
      .input-group-text { background-color: #2a2a2a; color: rgba(255,255,255,0.6); }

      /* ERP Cards e Animações */
      .erp-card {
          border-radius: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
          overflow: hidden;
      }
      .transition-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.3) !important;
          border-color: rgba(255,255,255,0.15) !important;
      }

      @keyframes pulseIcon {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); opacity: 0.8; }
        100% { transform: scale(1); }
      }
      .anim-pulse { animation: pulseIcon 1.5s infinite ease-in-out; }
      
      /* List items (Clientes) */
      .chk-item { border-left: 3px solid #08c068 !important; transition: background 0.2s; }
      .chk-item:hover { background-color: #333333 !important; }
      
      /* Modals */
      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
      .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }

      /* Pagination */
      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 0.85rem; }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
      .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.05); }
      .pagination .page-link:focus { box-shadow: none; }

      /* Wizard Nova Rota Styles (DARK) */
      .wizard-step-rota { display: none; animation: slideIn 0.3s ease-out forwards; }
      .wizard-step-rota.active { display: block; }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }

      /* TOAST ANIMATION AJAX */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      /* SKELETON LOADING (DARK) */
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
      .skeleton-dark * { visibility: hidden !important; }
      .skeleton-text-view { height: 14px; width: 100%; margin-bottom: 8px; }
      .skeleton-btn-view { height: 26px; width: 32px; border-radius: 4px; display: inline-block; }
      
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

    <div class="offcanvas offcanvas-start text-white" tabindex="-1" id="sidebarMenu">
      <div class="offcanvas-header border-bottom border-custom">
        <h5 class="offcanvas-title ms-2" style="font-size: 0.9rem;"><i class="fa-solid fa-bars text-muted me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2">
            <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid" style="max-width:140px;">
        </div>
        ${menuHTML}
      </div>
    </div>

    <div class="content">
      
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-truck-fast text-muted me-2"></i>Gestão de Rotas</h5>
            </div>
        </div>
      </div>

      <div class="bg-custom-darker p-3 rounded-3 shadow-sm border border-custom mb-4">
        <form class="row g-2 align-items-end" method="GET" action="/entregas" onsubmit="prepararBuscaSimples(event, this, 'Filtros aplicados!')">
          <div class="col-12 col-md-4">
            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Buscar Pedido/Rota</label>
            <div class="input-group input-group-sm shadow-sm">
                <span class="input-group-text border-custom border-end-0 bg-custom-darker"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
                <input type="text" name="titulo" class="form-control border-custom border-start-0 text-white" value="${filtros.titulo || ""}" placeholder="Ex.: Rota Feira de Santana">
            </div>
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Data Inicial</label>
            <input type="date" name="data_inicio" class="form-control form-control-sm shadow-sm" value="${filtros.data_inicio || ""}">
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Data Final</label>
            <input type="date" name="data_fim" class="form-control form-control-sm shadow-sm" value="${filtros.data_fim || ""}">
          </div>
          <div class="col-12 col-md-2 d-flex gap-2 mt-3 mt-md-0">
            <button type="submit" class="btn btn-sm btn-primary flex-grow-1 shadow-sm fw-bold text-dark">Buscar</button>
            <a href="/entregas" class="btn btn-sm btn-outline-secondary border-custom text-danger" title="Limpar Filtros"><i class="fa-solid fa-eraser"></i></a>
          </div>
        </form>
      </div>

      <div class="d-flex flex-wrap gap-2 mb-3">
        <button class="btn btn-sm btn-success shadow-sm text-dark fw-bold" data-bs-toggle="modal" data-bs-target="#novoPedidoModal">
          <i class="fa-solid fa-plus me-1"></i> Criar Nova Rota
        </button>

        ${user.tipo_usuario === "motorista" ? `
        <button id="btnAtivarLocalizacao" class="btn btn-sm btn-primary shadow-sm text-dark fw-bold">
          <i class="fa-solid fa-location-arrow me-1"></i> Ativar Localização
        </button>
        ` : ""}

        ${user.tipo_usuario === "admin" ? `
        <button class="btn btn-sm btn-outline-secondary border-custom shadow-sm text-white fw-bold" data-bs-toggle="modal" data-bs-target="#mapaMotoristasModal">
          <i class="fa-solid fa-map-location-dot text-accent me-1"></i> Rastreio em Tempo Real
        </button>
        ` : ""}
      </div>

      <div class="row g-3" id="listaPedidosContainer">
        ${cards}
      </div>

      ${paginationHtml}
    </div>

    <div class="modal fade" id="novoPedidoModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <form id="wizardRotaForm" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="event.preventDefault();">
          
          <div class="wizard-header bg-custom-darker p-3 border-bottom border-custom rounded-top">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-0 text-white" id="stepTitleRota" style="font-size: 0.85rem;">Passo 1</h6>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" onclick="resetWizardRota()"></button>
            </div>
            <div class="wizard-progress mt-2 border border-custom" style="height: 6px; background-color: #1f1f1f; border-radius: 10px;">
              <div class="wizard-progress-bar" id="progressBarRota" style="height: 100%; background-color: #08c068; width: 33%; transition: width 0.3s ease;"></div>
            </div>
          </div>
          
          <div class="modal-body p-4 bg-custom-dark" style="min-height: 400px;">

            <div class="wizard-step-rota active" data-title="Dados Gerais">
              <div class="text-center mb-4 mt-2">
                 <i class="fa-solid fa-map-location-dot fa-3x text-accent mb-3 opacity-75"></i>
                 <h6 class="fw-bold text-white">Informações da Rota</h6>
                 <p class="text-muted small" style="font-size: 0.8rem;">Defina o nome da rota e a data prevista da entrega.</p>
              </div>
              <div class="mb-3">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Título/Destino da Rota</label>
                  <input type="text" id="rotaTitulo" class="form-control form-control-sm py-2 shadow-sm" required placeholder="Ex: Rota Centro / Camaçari">
              </div>
              <div class="mb-3">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Data Prevista</label>
                  <input type="date" id="rotaData" class="form-control form-control-sm py-2 shadow-sm" required>
              </div>
            </div>

            <div class="wizard-step-rota" data-title="Clientes">
              <div class="text-center mb-3 mt-1">
                 <i class="fa-solid fa-users fa-2x text-success mb-2 opacity-75"></i>
                 <h6 class="fw-bold text-white">Inserir Clientes na Rota</h6>
              </div>
              
              <div class="bg-custom-darker p-3 rounded-3 border-custom mb-3 shadow-sm">
                <div class="row g-2">
                  <div class="col-12 col-md-6">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Nome do Cliente</label>
                    <input type="text" id="tempClienteNome" class="form-control form-control-sm shadow-sm" placeholder="Ex: João da Silva">
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Status da Entrega</label>
                    <select id="tempClienteStatus" class="form-select form-select-sm shadow-sm text-white">
                      <option value="NA_ROTA" selected>Na rota para entrega</option>
                      <option value="ENTREGUE">Entregue</option>
                      <option value="NAO_ENTREGUE">Não entregue</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Observação (opcional)</label>
                    <input type="text" id="tempClienteObs" class="form-control form-control-sm shadow-sm" placeholder="Algum detalhe extra sobre a entrega?">
                  </div>
                  <div class="col-12 mt-2 text-end">
                    <button type="button" class="btn btn-sm btn-primary fw-bold text-dark w-100 shadow-sm" onclick="addClientToWizard()">
                      <i class="fa-solid fa-plus me-1"></i> Adicionar Cliente
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div class="wizard-step-rota" data-title="Gerenciar Rota">
              <div class="text-center mb-3">
                 <i class="fa-solid fa-route fa-2x text-warning mb-2 opacity-75"></i>
                 <h6 class="fw-bold text-white">Revisão Final da Rota</h6>
              </div>
              <div class="bg-custom-darker p-3 rounded-3 shadow-sm border-custom mb-3">
                <p class="mb-1" style="font-size:0.8rem;"><span class="text-muted">Rota:</span> <strong class="text-white" id="resumoRotaTitulo">-</strong></p>
                <p class="mb-0" style="font-size:0.8rem;"><span class="text-muted">Data:</span> <strong class="text-white" id="resumoRotaData">-</strong></p>
              </div>
              
              <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="fw-bold text-white mb-0" style="font-size:0.85rem;">Clientes nesta Rota:</h6>
                  <span id="resumoClientBadge" class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-50">0</span>
              </div>
              
              <div id="resumoClientList" style="max-height: 280px; overflow-y: auto;">
                </div>
            </div>

          </div>

          <div class="modal-footer bg-custom-darker border-custom d-flex justify-content-between p-3 rounded-bottom-3">
            <button type="button" class="btn btn-sm btn-outline-secondary px-4 py-2 text-white" id="prevBtnRota" onclick="nextPrevRota(-1)" style="display:none;">Voltar</button>
            <button type="button" class="btn btn-sm btn-primary text-dark flex-grow-1 ms-2 py-2 fw-bold shadow-sm" id="nextBtnRota" onclick="nextPrevRota(1)">Próximo <i class="fa-solid fa-chevron-right ms-1"></i></button>
          </div>
        </form>
      </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-check fs-5 me-2 text-accent"></i>
                    <strong class="fs-6" id="sucessoTitulo">Concluído!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3">
                <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="sucessoSub">Operação realizada com sucesso.</p>
            </div>
            <div class="toast-timer" id="sucessoTimer" style="display: none;"></div>
        </div>

        <div id="erroToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-xmark fs-5 me-2 text-danger"></i>
                    <strong class="fs-6" id="erroTitulo">Erro!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3">
                <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="erroSub">Ocorreu um erro.</p>
            </div>
            <div class="toast-timer bg-danger" id="erroTimer" style="display: none;"></div>
        </div>
    </div>

    ${clienteModals.join("")}

    ${user.tipo_usuario === "admin" ? `
    <div class="modal fade" id="mapaMotoristasModal" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content erp-modal bg-custom-darker border-0 shadow-lg">
          <div class="modal-header bg-custom-darker border-custom">
            <div>
                <h6 class="modal-title fw-bold text-white mb-0" style="font-size: 0.85rem;"><i class="fa-solid fa-satellite-dish me-2 text-accent"></i> Rastreio de Motoristas</h6>
                <span class="text-muted" style="font-size:0.75rem;">Localização em tempo real</span>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-2 bg-custom-dark">
            <div class="card border-custom shadow-sm overflow-hidden rounded-3 bg-custom-darker">
                <div id="mapaMotoristas" style="height: 65vh; width: 100%; z-index: 1;"></div>
            </div>
            <div class="text-muted mt-2 ps-1" style="font-size:0.7rem;">
              <i class="fa-solid fa-circle-info me-1 text-accent"></i> O mapa atualiza automaticamente. O motorista precisa estar com a localização ativada no aplicativo.
            </div>
          </div>
        </div>
      </div>
    </div>
    ` : ""}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

    <script>
      let isSubmitting = false;

      function mostrarToast(tipo, titulo, mensagem) {
          const toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
          if (toastEl) {
              document.getElementById(tipo === 'sucesso' ? 'sucessoTitulo' : 'erroTitulo').innerText = titulo;
              document.getElementById(tipo === 'sucesso' ? 'sucessoSub' : 'erroSub').innerText = mensagem;

              const timerEl = document.getElementById(tipo === 'sucesso' ? 'sucessoTimer' : 'erroTimer');
              if (timerEl) {
                  timerEl.style.display = 'block';
                  timerEl.style.animation = 'none';
                  timerEl.offsetHeight; 
                  timerEl.style.animation = 'shrinkToast 5s linear forwards';
              }

              const oldInstance = bootstrap.Toast.getInstance(toastEl);
              if (oldInstance) oldInstance.dispose();

              const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
              toast.show();
          }
      }

      function gerarSkeletonCards(quantidade = 12) {
          let html = '';
          for(let i = 0; i < quantidade; i++) {
              html += \`
              <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                  <div class="card erp-card bg-custom-darker border-custom shadow-sm h-100 p-2">
                      <div class="d-flex align-items-center gap-2 mb-2">
                          <div class="skeleton-dark" style="width: 32px; height: 32px; border-radius: 50%;"></div>
                          <div class="skeleton-dark skeleton-text-view" style="width: 60%; margin:0;"></div>
                      </div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="width: 80%;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="width: 50%;"></div>
                      <div class="mt-auto pt-2 border-top border-custom d-flex justify-content-between">
                          <div class="skeleton-dark skeleton-btn-view" style="width: 45%;"></div>
                          <div class="skeleton-dark skeleton-btn-view" style="width: 15%;"></div>
                      </div>
                  </div>
              </div>\`;
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const container = document.getElementById('listaPedidosContainer');
          const emptyState = document.querySelector('.content > .text-center-empty');
          
          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`<div class="row g-3 skeleton-container" id="skeleton-temp-container">\${gerarSkeletonCards(12)}</div>\`;

          if (container && !container.classList.contains('skeleton-container')) {
              container.style.display = 'none';
              container.insertAdjacentHTML('beforebegin', skeletonHTML);
          } else if (emptyState) {
              emptyState.style.display = 'none';
              emptyState.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const container = document.getElementById('listaPedidosContainer');
          const emptyState = document.querySelector('.content > .text-center-empty');

          if (container) container.style.display = 'flex';
          if (emptyState) emptyState.style.display = 'block';
      }

      mostrarSkeletonGlobais();
      if (document.readyState === 'complete') {
          setTimeout(ocultarSkeletonGlobais, 100);
      } else {
          window.addEventListener('load', ocultarSkeletonGlobais);
      }

      async function prepararBuscaSimples(event, form, titleMsg) {
          if (event) event.preventDefault();
          mostrarSkeletonGlobais();

          try {
              const formData = new FormData(form);
              const queryString = new URLSearchParams(formData).toString();
              const url = form.action + '?' + queryString;

              const response = await fetch(url, { method: 'GET' });
              if (response.ok) {
                  const html = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }
                  
                  atualizarModaisDinamicos(doc);
                  window.history.pushState({}, '', url);
                  mostrarToast('sucesso', 'Busca Concluída!', titleMsg);
              } else {
                  mostrarToast('erro', 'Erro', 'Não foi possível realizar a busca.');
              }
          } catch (err) {
              mostrarToast('erro', 'Falha', 'Verifique a sua rede.');
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      async function navegarPagina(event, url) {
          event.preventDefault();
          mostrarSkeletonGlobais();
          try {
              const response = await fetch(url, { method: 'GET' });
              if (response.ok) {
                  const html = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }
                  
                  atualizarModaisDinamicos(doc);
                  window.history.pushState({}, '', url);
              }
          } catch (err) {
              mostrarToast('erro', 'Erro', 'Falha ao carregar a página.');
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      async function prepararSubmissaoSimples(event, form, titleMsg) {
          event.preventDefault();
          if (!form.checkValidity()) {
              form.reportValidity();
              return;
          }
          if (isSubmitting) return;

          // Esconder modais
          const modalEl = form.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }
          document.querySelectorAll('.modal-backdrop').forEach(mb => mb.remove());
          document.body.classList.remove('modal-open');
          document.body.style = '';

          mostrarSkeletonGlobais();
          isSubmitting = true;

          try {
              const formData = new URLSearchParams();
              const fd = new FormData(form);
              for (const [key, value] of fd.entries()) {
                  formData.append(key, value);
              }

              const response = await fetch(form.action, {
                  method: form.method || 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: formData.toString()
              });

              if (response.ok) {
                  recarregarTelaSilenciosamente(titleMsg);
              } else {
                  mostrarToast('erro', 'Erro', 'Não foi possível salvar os dados.');
                  ocultarSkeletonGlobais();
              }
          } catch (err) {
              mostrarToast('erro', 'Falha', 'Verifique a conexão.');
              ocultarSkeletonGlobais();
          } finally {
              isSubmitting = false;
          }
      }

      async function recarregarTelaSilenciosamente(titleMsg) {
          try {
              await new Promise(r => setTimeout(r, 300));
              const freshResponse = await fetch(window.location.href);
              const html = await freshResponse.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');

              const oldContent = document.querySelector('.content');
              const newContent = doc.querySelector('.content');
              if (oldContent && newContent) {
                  oldContent.innerHTML = newContent.innerHTML;
              }

              atualizarModaisDinamicos(doc);
              mostrarToast('sucesso', 'Sucesso!', titleMsg);
          } catch (err) {
             window.location.reload();
          } finally {
             ocultarSkeletonGlobais();
          }
      }

      function atualizarModaisDinamicos(doc) {
          const staticModals = ['novoPedidoModal', 'mapaMotoristasModal', 'sidebarMenu'];
          document.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) m.remove();
          });
          doc.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
          });
      }
    </script>

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
              list.innerHTML = '<div class="text-center text-muted p-4" style="font-size:0.8rem;"><i class="fa-solid fa-users-slash fa-2x mb-2 opacity-50"></i><br>Nenhum cliente cadastrado nesta rota. Adicione clicando em "Voltar".</div>';
              return;
          }
          
          let html = '';
          tempClients.forEach((c, i) => {
              let bClass = c.status === 'ENTREGUE' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-50' : c.status === 'NA_ROTA' ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-50' : 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-50';
              let obs = c.obs ? c.obs : "<em class='text-muted'>Sem observação</em>";

              html += \`
                <div class="card chk-item border-custom bg-custom-darker shadow-sm mb-2">
                  <div class="card-body p-2 px-3">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                      <div class="text-truncate me-2" style="max-width: 70%;">
                        <strong class="text-white d-block text-truncate" style="font-size: 0.85rem;" title="\${c.nome}">\${c.nome}</strong>
                        <span class="badge \${bClass} shadow-sm" style="font-size:0.65rem;">\${c.statusText}</span>
                      </div>
                      <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-warning" title="Editar Cliente" onclick="editClientFromWizard(\${i})">
                          <i class="fa-solid fa-pen" style="font-size:0.75rem;"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger ms-1" title="Remover Cliente" onclick="removeClientFromWizard(\${i})">
                          <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
                        </button>
                      </div>
                    </div>
                    <div class="text-muted mb-2" style="font-size: 0.7rem;">
                      Adicionado agora ao pacote desta rota
                    </div>
                    <div class="p-2 bg-custom-dark rounded border-custom text-white" style="font-size: 0.75rem; min-height: 30px;">
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

      // Função de Salvamento AJAX do Wizard Adaptada
      function saveRouteAndClientsViaAjax() {
          isSubmittingRota = true; 
          mostrarSkeletonGlobais();

          const wizardEl = document.getElementById('novoPedidoModal');
          const wizardModal = bootstrap.Modal.getInstance(wizardEl) || bootstrap.Modal.getOrCreateInstance(wizardEl);
          wizardModal.hide();
          document.querySelectorAll('.modal-backdrop').forEach(mb => mb.remove());
          document.body.classList.remove('modal-open');
          document.body.style = '';

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
              // 2. Busca a rota recém criada
              return fetch('/entregas?titulo=' + encodeURIComponent(tituloRota));
          })
          .then(res => res.text())
          .then(html => {
              const regex = new RegExp('id="pedidoModal(\\\\\\d+)"', 'g');
              const matches = [...html.matchAll(regex)];
              
              if (matches.length > 0) {
                  const ids = matches.map(m => parseInt(m[1]));
                  const newId = Math.max(...ids);
                  
                  if (tempClients.length > 0) {
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
                          recarregarTelaSilenciosamente('Nova rota cadastrada com sucesso!');
                      }).catch(err => {
                          recarregarTelaSilenciosamente('Rota criada, mas com erros nos clientes.');
                      });
                  } else {
                      recarregarTelaSilenciosamente('Nova rota cadastrada com sucesso!');
                  }
              } else {
                  recarregarTelaSilenciosamente('Nova rota cadastrada com sucesso!');
              }
          })
          .catch(err => {
              mostrarToast('erro', 'Erro', 'Falha ao gerar a rota.');
              ocultarSkeletonGlobais();
          });
      }

      function resetWizardRota() {
        currentTabRota = 0;
        tempClients = [];
        showTabRota(0);
        document.getElementById("wizardRotaForm").reset();
      }

      window.addEventListener('load', () => {
        resetWizardRota();
      });
    </script>

    <script>
      window.NOME_USUARIO = "${user.nome}";
    </script>
    <script src="/socket.io/socket.io.js"></script>

    ${user.tipo_usuario === "admin" ? `
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
                  <strong style="color: #08c068; font-size:14px;">\${m.nome || "Motorista"}</strong><br>
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

    ${user.tipo_usuario === "motorista" ? `
      <script src="/script/motoristaTracker.js"></script>
      <script>
        document.getElementById("btnAtivarLocalizacao")?.addEventListener("click", () => {
          if (typeof window.iniciarRastreamento === "function") {
             window.iniciarRastreamento();
             mostrarToast('sucesso', 'Rastreio ativado!', 'Sua localização está sendo enviada.');
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