// views/checklistMotoristasView.js
const menuLateral = require("./menuLateral");

function checklistMotoristasView(usuario, itens = [], paginacao = {}) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  const fmtDataHora = (d) => {
    try {
      return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return d || "-";
    }
  };

  const cards = itens.map(item => `
    <div class="col-12 col-md-6 col-lg-4 col-xl-3">
      <div class="card erp-card shadow-sm border-0 h-100" 
           style="cursor: pointer;" 
           data-bs-toggle="modal" 
           data-bs-target="#editarModal${item.id}"
           title="Clique para editar este checklist">
        <div class="card-body p-3 d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="text-truncate">
              <h6 class="fw-bold text-dark mb-0 text-truncate" title="${item.motorista || "Motorista não informado"}">
                <i class="fa-solid fa-id-card text-primary me-2"></i>${item.motorista || "Motorista não informado"}
              </h6>
              <small class="text-muted" style="font-size:0.75rem;">
                <i class="fa-regular fa-clock me-1"></i> ${fmtDataHora(item.criado_em)}
              </small>
            </div>
          </div>
          
          <div class="mb-3 mt-1 text-muted" style="font-size:0.8rem;">
            <div class="mb-1 text-truncate" title="Veículo: ${item.veiculo}"><i class="fa-solid fa-car-side me-2"></i> ${item.veiculo || "-"}</div>
            <div class="text-truncate" title="Registrado por: ${item.registrado_por}"><i class="fa-solid fa-user-pen me-2"></i> ${item.registrado_por || "Desconhecido"}</div>
          </div>

          <div class="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
            <a href="/checklist-motoristas/download/${item.id}" 
               class="btn btn-sm btn-light border text-success fw-medium flex-grow-1 me-2 d-flex justify-content-center align-items-center gap-2" 
               title="Baixar Planilha Excel"
               onclick="event.stopPropagation();">
              <i class="fa-solid fa-file-excel"></i> Planilha
            </a>
            <div class="btn-group">
              <button class="btn btn-sm btn-light border text-warning" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#editarModal${item.id}" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-light border text-danger" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#excluirModal${item.id}" title="Excluir">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="editarModal${item.id}" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <form method="POST" action="/checklist-motoristas/editar/${item.id}" enctype="multipart/form-data" class="modal-content erp-modal">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Checklist</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body text-sm bg-light p-3">
            <div class="card border-0 shadow-sm p-3 mb-3">
              <h6 class="fw-bold mb-3" style="font-size:0.85rem; color:#0D5749;">Informações Gerais</h6>
              <div class="row g-2">
                <div class="col-12 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Motorista</label>
                  <select name="motorista" class="form-select form-select-sm" required autocomplete="off">
                    <option value="Flávio" ${item.motorista === "Flávio" ? "selected" : ""}>Flávio</option>
                    <option value="Thiago" ${item.motorista === "Thiago" ? "selected" : ""}>Thiago</option>
                  </select>
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Veículo</label>
                  <select name="veiculo" class="form-select form-select-sm" required>
                    <option ${item.veiculo === "Master" ? "selected" : ""}>Master</option>
                    <option ${item.veiculo === "Strada" ? "selected" : ""}>Strada</option>
                    <option ${item.veiculo === "Fiorino" ? "selected" : ""}>Fiorino</option>
                  </select>
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Responsável Logístico</label>
                  <select name="responsavel" class="form-select form-select-sm" required>
                    <option ${item.responsavel === "Eliege" ? "selected" : ""}>Eliege</option>
                    <option ${item.responsavel === "Mário" ? "selected" : ""}>Mário</option>
                    <option ${item.responsavel === "Mirna" ? "selected" : ""}>Mirna</option>
                    <option ${item.responsavel === "Renilson" ? "selected" : ""}>Renilson</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="card border-0 shadow-sm p-3 mb-3">
              <h6 class="fw-bold mb-3" style="font-size:0.85rem; color:#0D5749;">Inspeção do Veículo</h6>
              <div class="row g-2">
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Óleo</label>
                  <select name="oleo" class="form-select form-select-sm" required>
                    <option ${item.oleo === "Baixo" ? "selected" : ""}>Baixo</option>
                    <option ${item.oleo === "Médio" ? "selected" : ""}>Médio</option>
                    <option ${item.oleo === "Apto" ? "selected" : ""}>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Água Radiador</label>
                  <select name="agua" class="form-select form-select-sm" required>
                    <option ${item.agua === "Baixo" ? "selected" : ""}>Baixo</option>
                    <option ${item.agua === "Médio" ? "selected" : ""}>Médio</option>
                    <option ${item.agua === "Apto" ? "selected" : ""}>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Fluído de Freio</label>
                  <select name="freio" class="form-select form-select-sm" required>
                    <option ${item.freio === "Baixo" ? "selected" : ""}>Baixo</option>
                    <option ${item.freio === "Médio" ? "selected" : ""}>Médio</option>
                    <option ${item.freio === "Apto" ? "selected" : ""}>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Direção Hidráulica</label>
                  <select name="direcao" class="form-select form-select-sm" required>
                    <option ${item.direcao === "Baixo" ? "selected" : ""}>Baixo</option>
                    <option ${item.direcao === "Médio" ? "selected" : ""}>Médio</option>
                    <option ${item.direcao === "Apto" ? "selected" : ""}>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Combustível</label>
                  <select name="combustivel" class="form-select form-select-sm" required>
                    <option ${item.combustivel === "Reserva" ? "selected" : ""}>Reserva</option>
                    <option ${item.combustivel === "Abaixo de meio tanque" ? "selected" : ""}>Abaixo de meio tanque</option>
                    <option ${item.combustivel === "Meio tanque" ? "selected" : ""}>Meio tanque</option>
                    <option ${item.combustivel === "Acima de meio tanque" ? "selected" : ""}>Acima de meio tanque</option>
                    <option ${item.combustivel === "Completo" ? "selected" : ""}>Completo</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Pneus (Calibragem)</label>
                  <select name="pneu_calibragem" class="form-select form-select-sm" required>
                    <option ${item.pneu_calibragem === "Baixo" ? "selected" : ""}>Baixo</option>
                    <option ${item.pneu_calibragem === "Médio" ? "selected" : ""}>Médio</option>
                    <option ${item.pneu_calibragem === "Apto" ? "selected" : ""}>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Pneus (Estado)</label>
                  <select name="pneu_estado" class="form-select form-select-sm" required>
                    <option ${item.pneu_estado === "Desgastado" ? "selected" : ""}>Desgastado</option>
                    <option ${item.pneu_estado === "Meia vida" ? "selected" : ""}>Meia vida</option>
                    <option ${item.pneu_estado === "Apto" ? "selected" : ""}>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Luzes</label>
                  <select name="luzes" class="form-select form-select-sm" required>
                    <option ${item.luzes === "Defeito pisca" ? "selected" : ""}>Defeito pisca</option>
                    <option ${item.luzes === "Defeito lanterna" ? "selected" : ""}>Defeito lanterna</option>
                    <option ${item.luzes === "Defeito farol" ? "selected" : ""}>Defeito farol</option>
                    <option ${item.luzes === "Todos Aptos" ? "selected" : ""}>Todos Aptos</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Ruídos</label>
                  <select name="ruidos" class="form-select form-select-sm" required>
                    <option ${item.ruidos === "Sem ruídos anormais" ? "selected" : ""}>Sem ruídos anormais</option>
                    <option ${item.ruidos === "Ruído motor" ? "selected" : ""}>Ruído motor</option>
                    <option ${item.ruidos === "Ruído suspensão" ? "selected" : ""}>Ruído suspensão</option>
                    <option ${item.ruidos === "Ruído portas" ? "selected" : ""}>Ruído portas</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Lixo Interno</label>
                  <select name="lixo" class="form-select form-select-sm" required>
                    <option ${item.lixo === "Pendente" ? "selected" : ""}>Pendente</option>
                    <option ${item.lixo === "Feito" ? "selected" : ""}>Feito</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="card border-0 shadow-sm p-3 mb-1">
              <h6 class="fw-bold mb-3" style="font-size:0.85rem; color:#0D5749;">Observações e Anexos</h6>
              <div class="row g-2">
                <div class="col-12 col-md-7">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Observação Extra</label>
                  <textarea name="observacao" class="form-control form-control-sm" rows="3" placeholder="Algo a reportar?">${item.observacao || ""}</textarea>
                </div>
                <div class="col-12 col-md-5">
                  <label class="form-label text-muted mb-1 d-block" style="font-size:0.8rem;">Foto em Anexo</label>
                  ${item.foto
                    ? `
                      <a href="/uploads/${item.foto}" target="_blank" class="btn btn-sm btn-outline-success w-100 mb-2">
                        <i class="fa-solid fa-image me-1"></i> Visualizar Foto Atual
                      </a>
                      `
                    : `<div class="text-muted border rounded p-1 text-center mb-2" style="font-size:0.75rem;"><i class="fa-solid fa-image-slash me-1"></i>Nenhuma foto anexada</div>`
                  }
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Substituir Foto</label>
                  <input type="file" name="foto" class="form-control form-control-sm" accept="image/*">
                </div>
              </div>
            </div>

          </div>
          
          <div class="modal-footer border-top-0 bg-light">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary"><i class="fa-solid fa-save me-1"></i> Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${item.id}" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal">
          <form method="POST" action="/checklist-motoristas/excluir/${item.id}">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="mb-2">Excluir Checklist?</h6>
              <p class="text-muted mb-0" style="font-size:0.85rem;">Deseja excluir o checklist do motorista <b>${item.motorista}</b>?</p>
            </div>
            <div class="modal-footer justify-content-center bg-light border-0">
              <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger">Sim, Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `).join("");

  // Paginação minimalista ERP
  const pageLinks = (() => {
    const delta = 2; // páginas ao redor da atual
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
          html += `<li class="page-item"><a class="page-link text-dark" href="/checklist-motoristas?page=${ultima + 1}">${ultima + 1}</a></li>`;
        } else if (p - ultima > 2) {
          html += `<li class="page-item disabled"><span class="page-link text-muted">...</span></li>`;
        }
      }
      html += `<li class="page-item ${p === page ? "active" : ""}"><a class="page-link ${p === page ? "fw-bold text-dark" : "text-dark"}" href="/checklist-motoristas?page=${p}">${p}</a></li>`;
      ultima = p;
    });

    return html;
  })();

  const paginacaoHtml = totalPages > 1 ? `
    <nav aria-label="Paginação de checklists" class="mt-4">
      <ul class="pagination pagination-sm justify-content-center mb-4">
        <li class="page-item ${page <= 1 ? "disabled" : ""}">
          <a class="page-link text-dark" href="/checklist-motoristas?page=${page - 1}">&laquo;</a>
        </li>
        ${pageLinks}
        <li class="page-item ${page >= totalPages ? "disabled" : ""}">
          <a class="page-link text-dark" href="/checklist-motoristas?page=${page + 1}">&raquo;</a>
        </li>
      </ul>
    </nav>
  ` : "";

  // INTEGRAÇÃO MENU LATERAL
  const menuHTML = menuLateral(user, "/checklist-motoristas");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checklist Motoristas | ERP Ecoflow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
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

      /* Modals */
      .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      .erp-modal .modal-header { border-bottom: 1px solid #f0f0f0; }
      .erp-modal .modal-footer { border-top: 1px solid #f0f0f0; }
      .form-control-sm, .form-select-sm { border-radius: 6px; }

      /* Paginação ERP */
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
            <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-clipboard-list text-muted me-2"></i>Checklist Diário</h4>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span class="usuario-badge d-none d-sm-inline-block">
            <i class="fa-solid fa-user-circle me-1"></i> ${user.nome}
          </span>
          <a href="/logout" class="btn btn-sm btn-outline-danger d-none d-md-inline-block" title="Sair">
            <i class="fas fa-sign-out-alt"></i>
          </a>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-3 shadow-sm border border-light">
        <div>
            <h6 class="mb-0 text-muted" style="font-size:0.85rem;">Histórico Recente</h6>
        </div>
        <button class="btn btn-sm btn-success px-3 shadow-sm" data-bs-toggle="modal" data-bs-target="#novoChecklistModal">
          <i class="fa-solid fa-plus me-1"></i> Novo Lançamento
        </button>
      </div>

      <div class="row g-3">
        ${itens.length > 0 ? cards : `<div class="col-12 text-center text-muted mt-5"><i class="fa-solid fa-clipboard fa-3x opacity-25 mb-3"></i><p>Nenhum checklist registrado ainda.</p></div>`}
      </div>

      ${paginacaoHtml}
    </div>

    <div class="modal fade" id="novoChecklistModal" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <form method="POST" action="/checklist-motoristas/novo" enctype="multipart/form-data" autocomplete="off" class="modal-content erp-modal">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-clipboard-check me-2 text-success"></i> Novo Checklist</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          
          <div class="modal-body text-sm bg-light p-3">
            
            <div class="card border-0 shadow-sm p-3 mb-3">
              <h6 class="fw-bold mb-3" style="font-size:0.85rem; color:#0D5749;">Informações Gerais</h6>
              <div class="row g-2">
                <div class="col-12 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Motorista</label>
                  <select name="motorista" class="form-select form-select-sm" required autocomplete="off">
                    <option value="" selected disabled>Selecione...</option>
                    <option value="Flávio">Flávio</option>
                    <option value="Thiago">Thiago</option>
                  </select>
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Veículo</label>
                  <select name="veiculo" class="form-select form-select-sm" required>
                    <option value="" selected disabled>Selecione...</option>
                    <option value="Master">Master</option>
                    <option value="Strada">Strada</option>
                    <option value="Fiorino">Fiorino</option>
                  </select>
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Responsável Logístico</label>
                  <select name="responsavel" class="form-select form-select-sm" required>
                    <option value="" selected disabled>Selecione...</option>
                    <option value="Eliege">Eliege</option>
                    <option value="Mário">Mário</option>
                    <option value="Mirna">Mirna</option>
                    <option value="Renilson">Renilson</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="card border-0 shadow-sm p-3 mb-3">
              <h6 class="fw-bold mb-3" style="font-size:0.85rem; color:#0D5749;">Inspeção do Veículo</h6>
              <div class="row g-2">
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Óleo</label>
                  <select name="oleo" class="form-select form-select-sm" required>
                    <option>Baixo</option>
                    <option>Médio</option>
                    <option selected>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Água Radiador</label>
                  <select name="agua" class="form-select form-select-sm" required>
                    <option>Baixo</option>
                    <option>Médio</option>
                    <option selected>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Fluído de Freio</label>
                  <select name="freio" class="form-select form-select-sm" required>
                    <option>Baixo</option>
                    <option>Médio</option>
                    <option selected>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Direção Hidráulica</label>
                  <select name="direcao" class="form-select form-select-sm" required>
                    <option>Baixo</option>
                    <option>Médio</option>
                    <option selected>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Combustível</label>
                  <select name="combustivel" class="form-select form-select-sm" required>
                    <option>Reserva</option>
                    <option>Abaixo de meio tanque</option>
                    <option selected>Meio tanque</option>
                    <option>Acima de meio tanque</option>
                    <option>Completo</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Pneus (Calibragem)</label>
                  <select name="pneu_calibragem" class="form-select form-select-sm" required>
                    <option>Baixo</option>
                    <option>Médio</option>
                    <option selected>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Pneus (Estado)</label>
                  <select name="pneu_estado" class="form-select form-select-sm" required>
                    <option>Desgastado</option>
                    <option>Meia vida</option>
                    <option selected>Apto</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Luzes</label>
                  <select name="luzes" class="form-select form-select-sm" required>
                    <option>Defeito pisca</option>
                    <option>Defeito lanterna</option>
                    <option>Defeito farol</option>
                    <option selected>Todos Aptos</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Ruídos</label>
                  <select name="ruidos" class="form-select form-select-sm" required>
                    <option selected>Sem ruídos anormais</option>
                    <option>Ruído motor</option>
                    <option>Ruído suspensão</option>
                    <option>Ruído portas</option>
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Lixo Interno</label>
                  <select name="lixo" class="form-select form-select-sm" required>
                    <option>Pendente</option>
                    <option selected>Feito</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="card border-0 shadow-sm p-3 mb-1">
              <h6 class="fw-bold mb-3" style="font-size:0.85rem; color:#0D5749;">Observações e Anexos</h6>
              <div class="row g-2">
                <div class="col-12 col-md-7">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Observação Extra</label>
                  <textarea name="observacao" class="form-control form-control-sm" rows="3" placeholder="Algo a reportar?"></textarea>
                </div>
                <div class="col-12 col-md-5">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Anexar Foto</label>
                  <input type="file" name="foto" class="form-control form-control-sm" accept="image/*">
                </div>
              </div>
            </div>

          </div>
          
          <div class="modal-footer border-top-0 bg-light">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success"><i class="fa-solid fa-check me-1"></i> Salvar Lançamento</button>
          </div>
        </form>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = checklistMotoristasView;