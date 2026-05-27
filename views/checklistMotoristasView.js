// views/checklistMotoristasView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");

function checklistMotoristasView(usuario, itens = [], paginacao = {}, filtrosDb = []) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;
  
  // Parâmetros de Filtro
  const data_inicio = paginacao.data_inicio || "";
  const data_fim = paginacao.data_fim || "";
  
  // Constrói a string de query parameters para não perder o filtro na paginação
  const qParam = (data_inicio ? `&data_inicio=${encodeURIComponent(data_inicio)}` : "") + 
                 (data_fim ? `&data_fim=${encodeURIComponent(data_fim)}` : "");

  // Recebe os dados de relacionamento unificado do banco de dados
  const filtrosData = Array.isArray(filtrosDb) ? filtrosDb : [];
  const motoristasUnicos = [...new Set(filtrosData.map(f => f.motorista))].sort();

  const fmtDataHora = (d) => {
    try {
      return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return d || "-";
    }
  };

  // 1. GERAR OS CARDS COMPACTOS COM CORES DINÂMICAS POR VEÍCULO
  const cards = itens.map(item => {
    // Lógica para definir cores diferentes para cada tipo de veículo
    let badgeClass = "bg-light text-dark border shadow-sm";
    let iconClass = "text-muted";
    
    if (item.veiculo === "Master") {
        badgeClass = "bg-primary text-white shadow-sm border-0";
        iconClass = "text-white-50";
    } else if (item.veiculo === "Strada") {
        badgeClass = "bg-warning text-dark shadow-sm border-0";
        iconClass = "text-dark-50";
    } else if (item.veiculo === "Fiorino") {
        badgeClass = "bg-danger text-white shadow-sm border-0";
        iconClass = "text-white-50";
    }

    return `
    <div class="col-12 col-md-6 col-lg-4 col-xl-3">
      <div class="card erp-card shadow-sm border-0 h-100 transition-hover" 
           style="cursor: pointer;" 
           data-bs-toggle="modal" 
           data-bs-target="#editarModal${item.id}"
           title="Clique para editar este checklist">
        <div class="card-body p-2 d-flex flex-column">
          
          <div class="d-flex justify-content-between align-items-start mb-1">
            <h6 class="fw-bold text-dark mb-0 text-truncate" style="font-size:0.9rem;" title="${item.motorista || "Não informado"}">
              <i class="fa-solid fa-id-card text-primary me-1"></i> ${item.motorista || "Não informado"}
            </h6>
            <span class="badge ${badgeClass}" style="font-size:0.7rem;">
              <i class="fa-solid fa-car-side ${iconClass} me-1"></i> ${item.veiculo || "-"}
            </span>
          </div>
          
          <div class="text-muted mb-2" style="font-size:0.75rem;">
            <div class="text-truncate mb-1"><i class="fa-regular fa-clock me-1"></i> ${fmtDataHora(item.criado_em)}</div>
            <div class="text-truncate"><i class="fa-solid fa-user-pen me-1"></i> Por: ${item.registrado_por || "-"}</div>
          </div>

          <div class="mt-auto border-top pt-2 d-flex justify-content-between align-items-center gap-2">
            <a href="/checklist-motoristas/download/${item.id}" 
               class="btn btn-sm btn-light border text-success fw-medium flex-grow-1 d-flex justify-content-center align-items-center py-1" 
               title="Baixar Planilha Excel"
               onclick="event.stopPropagation();">
              <i class="fa-solid fa-file-excel me-1"></i> Planilha
            </a>
            <div class="btn-group">
              <button type="button" class="btn btn-sm btn-light border text-warning py-1" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#editarModal${item.id}" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button type="button" class="btn btn-sm btn-light border text-danger py-1" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#excluirModal${item.id}" title="Excluir">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `}).join("");

  // 2. GERAR OS MODAIS DE EDIÇÃO E EXCLUSÃO
  const modais = itens.map(item => `
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
                  <select name="motorista" class="form-select form-select-sm" required>
                    <option value="Flávio" ${item.motorista === "Flávio" ? "selected" : ""}>Flávio</option>
                    <option value="Alexandre" ${item.motorista === "Alexandre" ? "selected" : ""}>Alexandre</option>
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
                    <option ${item.responsavel === "Mirna" ? "selected" : ""}>Mirna</option>
                    <option ${item.responsavel === "Renilson" ? "selected" : ""}>Renilson</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="card border-0 shadow-sm p-3 mb-3">
                <h6 class="fw-bold mb-3" style="font-size:0.85rem; color:#0D5749;">Estado do Veículo</h6>
                <div class="row g-2">
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.8rem;">Óleo</label><select name="oleo" class="form-select form-select-sm"><option ${item.oleo === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${item.oleo === 'Médio' ? 'selected' : ''}>Médio</option><option ${item.oleo === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.8rem;">Água</label><select name="agua" class="form-select form-select-sm"><option ${item.agua === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${item.agua === 'Médio' ? 'selected' : ''}>Médio</option><option ${item.agua === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.8rem;">Freio</label><select name="freio" class="form-select form-select-sm"><option ${item.freio === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${item.freio === 'Médio' ? 'selected' : ''}>Médio</option><option ${item.freio === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.8rem;">Direção</label><select name="direcao" class="form-select form-select-sm"><option ${item.direcao === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${item.direcao === 'Médio' ? 'selected' : ''}>Médio</option><option ${item.direcao === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.8rem;">Combustível</label><select name="combustivel" class="form-select form-select-sm"><option ${item.combustivel === 'Reserva' ? 'selected' : ''}>Reserva</option><option ${item.combustivel === 'Abaixo de meio tanque' ? 'selected' : ''}>Abaixo de meio tanque</option><option ${item.combustivel === 'Meio tanque' ? 'selected' : ''}>Meio tanque</option><option ${item.combustivel === 'Acima de meio tanque' ? 'selected' : ''}>Acima de meio tanque</option><option ${item.combustivel === 'Completo' ? 'selected' : ''}>Completo</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.8rem;">Luzes</label><select name="luzes" class="form-select form-select-sm"><option ${item.luzes === 'Todos Aptos' ? 'selected' : ''}>Todos Aptos</option><option ${item.luzes === 'Defeito pisca' ? 'selected' : ''}>Defeito pisca</option><option ${item.luzes === 'Defeito lanterna' ? 'selected' : ''}>Defeito lanterna</option><option ${item.luzes === 'Defeito farol' ? 'selected' : ''}>Defeito farol</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.8rem;">Pneu Calibragem</label><select name="pneu_calibragem" class="form-select form-select-sm"><option ${item.pneu_calibragem === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${item.pneu_calibragem === 'Médio' ? 'selected' : ''}>Médio</option><option ${item.pneu_calibragem === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.8rem;">Pneu Estado</label><select name="pneu_estado" class="form-select form-select-sm"><option ${item.pneu_estado === 'Desgastado' ? 'selected' : ''}>Desgastado</option><option ${item.pneu_estado === 'Meia vida' ? 'selected' : ''}>Meia vida</option><option ${item.pneu_estado === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.8rem;">Ruídos</label><select name="ruidos" class="form-select form-select-sm"><option ${item.ruidos === 'Sem ruídos anormais' ? 'selected' : ''}>Sem ruídos anormais</option><option ${item.ruidos === 'Ruído motor' ? 'selected' : ''}>Ruído motor</option><option ${item.ruidos === 'Ruído suspensão' ? 'selected' : ''}>Ruído suspensão</option><option ${item.ruidos === 'Ruído portas' ? 'selected' : ''}>Ruído portas</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.8rem;">Lixo Interno</label><select name="lixo" class="form-select form-select-sm"><option ${item.lixo === 'Pendente' ? 'selected' : ''}>Pendente</option><option ${item.lixo === 'Feito' ? 'selected' : ''}>Feito</option></select></div>
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
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Anexar Foto</label><br>
                  ${item.foto ? `<a href="/uploads/${item.foto}" target="_blank" class="btn btn-sm btn-outline-success w-100 mb-2"><i class="fa-solid fa-image me-1"></i> Ver Foto Atual</a>` : ""}
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
          html += `<li class="page-item"><a class="page-link text-dark" href="/checklist-motoristas?page=${ultima + 1}${qParam}">${ultima + 1}</a></li>`;
        } else if (p - ultima > 2) {
          html += `<li class="page-item disabled"><span class="page-link text-muted border-0 bg-transparent">...</span></li>`;
        }
      }
      html += `<li class="page-item ${p === page ? "active" : ""}"><a class="page-link ${p === page ? "fw-bold text-dark" : "text-dark"}" href="/checklist-motoristas?page=${p}${qParam}">${p}</a></li>`;
      ultima = p;
    });

    return html;
  })();

  const paginacaoHtml = totalPages > 1 ? `
    <nav aria-label="Paginação" class="mt-4">
      <ul class="pagination pagination-sm justify-content-center mb-4">
        <li class="page-item ${page <= 1 ? "disabled" : ""}">
          <a class="page-link text-dark" href="/checklist-motoristas?page=${page - 1}${qParam}">&laquo;</a>
        </li>
        ${pageLinks}
        <li class="page-item ${page >= totalPages ? "disabled" : ""}">
          <a class="page-link text-dark" href="/checklist-motoristas?page=${page + 1}${qParam}">&raquo;</a>
        </li>
      </ul>
    </nav>
  ` : "";

  const menuHTML = menuLateral(user, "/checklist-motoristas");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Checklist Motoristas | ERP Ecoflow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      body { display: flex; height: 100vh; margin: 0; background-color: #f4f7f6; font-family: 'Segoe UI', sans-serif; }
      .sidebar { width: 240px; background-color: #0D5749; color: white; padding: 20px; display: flex; flex-direction: column; }
      .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s; }
      .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
      .content { flex: 1; padding: 24px; overflow-y: auto; }
      
      /* Restauração da borda da badge de usuário */
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
      
      .erp-card { border-radius: 12px; transition: transform 0.2s; overflow: hidden; }
      .transition-hover:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.05) !important; }
      .erp-modal { border-radius: 12px; border: none; }
      
      /* Wizard Styles */
      .wizard-step { display: none; animation: slideIn 0.3s ease-out forwards; }
      .wizard-step.active { display: block; }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .slide-img-container {
        width: 100%;
        height: 180px;
        background: #e9ecef;
        border-radius: 10px;
        margin-bottom: 20px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #dee2e6;
      }
      .slide-img-container img { width: 100%; height: 100%; object-fit: cover; }
      .wizard-header { background: #f8f9fa; border-bottom: 1px solid #e9ecef; padding: 15px 20px; border-radius: 12px 12px 0 0; }
      .wizard-progress { height: 6px; background-color: #e9ecef; border-radius: 10px; overflow: hidden; margin-top: 10px; }
      .wizard-progress-bar { height: 100%; background-color: #0D5749; width: 0%; transition: width 0.3s ease; }

      /* Animação do Modal de Sucesso */
      @keyframes pulseIcon {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); opacity: 0.8; }
        100% { transform: scale(1); }
      }
      .anim-pulse { animation: pulseIcon 1.5s infinite ease-in-out; }

      @media (max-width: 767.98px) {
        body { flex-direction: column; } .sidebar { display: none; } .content { padding: 16px; }
      }
    </style>
  </head>
  <body>
    
    ${renderLoaderParticulas("Organizando checklists")}

    <div class="sidebar d-none d-md-flex">
      <div class="text-center mb-4 mt-2"><img src="/img/logo-branca.png" class="img-fluid" style="max-width:130px;"></div>
      <div class="flex-grow-1">${menuHTML}</div>
    </div>

    <div class="offcanvas offcanvas-start bg-dark text-white" tabindex="-1" id="sidebarMenu">
      <div class="offcanvas-header border-bottom border-secondary">
        <h5 class="offcanvas-title ms-2"><i class="fa-solid fa-bars text-muted me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2"><img src="/img/logo.png" class="img-fluid" style="max-width:140px;"></div>
        ${menuHTML}
        <hr class="bg-secondary mt-4">
        <a href="/logout" class="text-danger mt-2"><i class="fas fa-sign-out-alt me-2"></i>Sair do Sistema</a>
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-light border d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars"></i></button>
            <div>
              <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-clipboard-list text-muted me-2"></i>Checklist Diário</h4>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Controle e inspeção de frota</span>
            </div>
        </div>
      </div>

      <!-- BARRA DE FERRAMENTAS INTEGRADA (Filtros + Botões) -->
      <div class="bg-white p-3 rounded-3 shadow-sm border border-light mb-4">
        <div class="row g-3 align-items-end">
          
          <!-- FILTROS -->
          <div class="col-12 col-lg-8">
            <form method="GET" action="/checklist-motoristas" class="row g-2 align-items-end">
              <div class="col-12 col-sm-5">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Data Inicial (De:)</label>
                <input type="date" name="data_inicio" class="form-control form-control-sm" value="${data_inicio}">
              </div>
              <div class="col-12 col-sm-5">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Data Final (Até:)</label>
                <input type="date" name="data_fim" class="form-control form-control-sm" value="${data_fim}">
              </div>
              <div class="col-12 col-sm-2 d-flex gap-2 mt-2 mt-sm-0">
                <button type="submit" class="btn btn-sm btn-primary flex-grow-1 shadow-sm px-0">Buscar</button>
                <a href="/checklist-motoristas" class="btn btn-sm btn-light border text-secondary px-2" title="Limpar Filtros"><i class="fa-solid fa-eraser"></i></a>
              </div>
            </form>
          </div>

          <!-- BOTÕES DE AÇÃO -->
          <div class="col-12 col-lg-4 d-flex justify-content-lg-end gap-2">
              <button class="btn btn-sm btn-success shadow-sm flex-grow-1 flex-lg-grow-0 text-nowrap" data-bs-toggle="modal" data-bs-target="#novoChecklistModal">
                <i class="fa-solid fa-plus me-1"></i> Novo Checklist
              </button>
              <button class="btn btn-sm btn-primary shadow-sm flex-grow-1 flex-lg-grow-0 text-nowrap" data-bs-toggle="modal" data-bs-target="#relatorioModal">
                <i class="fa-solid fa-file-excel me-1"></i> Relatório
              </button>
          </div>

        </div>
      </div>

      <div class="row g-3">
        ${itens.length > 0 ? cards : `<div class="col-12 text-center text-muted mt-4"><i class="fa-solid fa-clipboard fa-3x opacity-25 mb-3"></i><p style="font-size:0.9rem;">Nenhum checklist encontrado.</p></div>`}
      </div>
      
      ${paginacaoHtml}
    </div>

    <!-- MODAL NOVO CHECKLIST (WIZARD) -->
    <div class="modal fade" id="novoChecklistModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form id="wizardForm" method="POST" action="/checklist-motoristas/novo" enctype="multipart/form-data" class="modal-content erp-modal">
          
          <div class="wizard-header">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-0 text-dark" id="stepTitle" style="font-size: 0.9rem;">Passo 1</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" onclick="resetWizard()"></button>
            </div>
            <div class="wizard-progress">
              <div class="wizard-progress-bar" id="progressBar"></div>
            </div>
          </div>
          
          <div class="modal-body p-4" style="min-height: 480px;">

            <div class="wizard-step active" data-title="Identificação">
              <div class="slide-img-container">
                <img src="/img/motorista.png" onerror="this.src='./img/motorista.png'" alt="Identificação">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Motorista</label>
                <select name="motorista" class="form-select form-select-sm" required>
                  <option value="" disabled selected>Quem está dirigindo?</option>
                  <option value="Flávio">Flávio</option>
                  <option value="Alexandre">Alexandre</option>
                  <option value="Thiago">Thiago</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Veículo</label>
                <select name="veiculo" class="form-select form-select-sm" required>
                  <option value="" disabled selected>Qual veículo?</option>
                  <option value="Master">Renault Master</option>
                  <option value="Strada">Fiat Strada</option>
                  <option value="Fiorino">Fiat Fiorino</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Responsável Logístico</label>
                <select name="responsavel" class="form-select form-select-sm" required>
                  <option value="" disabled selected>Quem liberou o carro?</option>
                  <option value="Eliege">Eliege</option>
                  <option value="Mirna">Mirna</option>
                  <option value="Renilson">Renilson</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Nível de Óleo e Água">
              <div class="slide-img-container">
                <img src="./img/oleo-e-agua.png" onerror="this.src='./img/oleo-e-agua.png'" alt="Motor">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Como está o nível do Óleo?</label>
                <select name="oleo" class="form-select form-select-sm fw-medium" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto (Normal)</option>
                  <option value="Médio">Médio</option>
                  <option value="Baixo">Baixo (Crítico)</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Como está a Água do Radiador?</label>
                <select name="agua" class="form-select form-select-sm fw-medium" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto (Normal)</option>
                  <option value="Médio">Médio</option>
                  <option value="Baixo">Baixo (Crítico)</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Fluidos Complementares">
              <div class="slide-img-container">
                <img src="./img/freio.png" onerror="this.src='./img/freio.png'" alt="Fluidos">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Fluido de Freio</label>
                <select name="freio" class="form-select form-select-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto</option>
                  <option value="Médio">Médio</option>
                  <option value="Baixo">Baixo</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Fluido de Direção Hidráulica</label>
                <select name="direcao" class="form-select form-select-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto</option>
                  <option value="Médio">Médio</option>
                  <option value="Baixo">Baixo</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Pneus">
              <div class="slide-img-container">
                <img src="./img/pneus.png" onerror="this.src='./img/pneus.png'" alt="Pneus">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Calibragem dos Pneus</label>
                <select name="pneu_calibragem" class="form-select form-select-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto (Calibrados)</option>
                  <option value="Médio">Médio</option>
                  <option value="Baixo">Baixo (Murchos)</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Estado de Conservação</label>
                <select name="pneu_estado" class="form-select form-select-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto (Bons)</option>
                  <option value="Meia vida">Meia vida</option>
                  <option value="Desgastado">Desgastados (Carecas)</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Sinalização e Mecânica">
              <div class="slide-img-container">
                <img src="/img/luzes-e-ruidos.png" onerror="this.src='./img/luzes-e-ruidos.png'" alt="Luzes e Motor">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Luzes e Lanternas</label>
                <select name="luzes" class="form-select form-select-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Todos Aptos">Todos Aptos (Funcionando)</option>
                  <option value="Defeito pisca">Defeito no Pisca</option>
                  <option value="Defeito lanterna">Defeito na Lanterna</option>
                  <option value="Defeito farol">Defeito no Farol</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Ruídos Anormais no Veículo</label>
                <select name="ruidos" class="form-select form-select-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Sem ruídos anormais">Sem ruídos (Normal)</option>
                  <option value="Ruído motor">Barulho no Motor</option>
                  <option value="Ruído suspensão">Barulho na Suspensão</option>
                  <option value="Ruído portas">Barulho nas Portas</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Interior e Autonomia">
              <div class="slide-img-container">
                <img src="/img/limpeza-e-combustivel.png" onerror="this.src='./img/limpeza-e-combustivel.png'" alt="Interior">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Nível de Combustível</label>
                <select name="combustivel" class="form-select form-select-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Completo">Tanque Cheio</option>
                  <option value="Acima de meio tanque">Acima de meio tanque</option>
                  <option value="Meio tanque">Meio tanque</option>
                  <option value="Abaixo de meio tanque">Abaixo de meio tanque</option>
                  <option value="Reserva">Reserva</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Limpeza: Lixo interno removido?</label>
                <select name="lixo" class="form-select form-select-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Feito">Sim, Feito (Limpo)</option>
                  <option value="Pendente">Pendente (Sujo)</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Finalização">
              <div class="slide-img-container text-muted bg-light border-0">
                 <img src="/img/observacoes.png" onerror="this.src='./img/observacoes.png'" alt="Foto">
              </div>
              <div class="mb-3">
                <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Anexar Foto do Veículo</label>
                <input type="file" name="foto" class="form-control form-control-sm shadow-sm" accept="image/*">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Observações Extras</label>
                <textarea name="observacao" class="form-control form-control-sm" rows="3" placeholder="Algo mais a reportar? Descreva aqui..."></textarea>
              </div>
            </div>

          </div>

          <div class="modal-footer bg-light border-0 d-flex justify-content-between p-3 rounded-bottom-3">
            <button type="button" class="btn btn-sm btn-outline-secondary px-3 py-1" id="prevBtn" onclick="nextPrev(-1)" style="display:none;">Voltar</button>
            <button type="button" class="btn btn-sm btn-primary flex-grow-1 ms-2 py-1 fw-bold shadow-sm" id="nextBtn" onclick="nextPrev(1)">Próximo <i class="fa-solid fa-chevron-right ms-1"></i></button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL DE RELATÓRIO (COM SELECTS DINÂMICOS CASCATA) -->
    <div class="modal fade" id="relatorioModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content erp-modal border-0">
          <form method="GET" action="/checklist-motoristas/relatorio" target="_blank">
            <div class="modal-header bg-light border-bottom-0 pb-0">
              <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-file-excel text-success me-2"></i> Relatório Mensal</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <p class="text-muted mb-3" style="font-size:0.8rem;">Filtre os dados para gerar a planilha consolidada.</p>
              
              <div class="mb-3">
                <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Motorista</label>
                <select id="relatorioMotorista" name="motorista" class="form-select form-select-sm">
                  <option value="">Todos os Motoristas</option>
                  ${motoristasUnicos.map(m => `<option value="${m}">${m}</option>`).join("")}
                </select>
              </div>

              <div class="row g-2 mb-2">
                <div class="col-6">
                  <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Ano</label>
                  <select id="relatorioAno" name="ano" class="form-select form-select-sm">
                    <option value="">Todos</option>
                    <!-- Preenchido via JavaScript -->
                  </select>
                </div>
                <div class="col-6">
                  <label class="form-label text-muted fw-medium mb-1" style="font-size:0.8rem;">Mês</label>
                  <select id="relatorioMes" name="mes" class="form-select form-select-sm">
                    <option value="">Todos</option>
                    <!-- Preenchido via JavaScript -->
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer bg-light border-0 d-flex justify-content-between">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-success w-100 mt-2 m-0"><i class="fa-solid fa-download me-1"></i> Gerar Excel</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL DE SUCESSO AO CONCLUIR -->
    <div class="modal fade" id="sucessoChecklistModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0">
          <div class="modal-body text-center p-5">
            <i class="fa-solid fa-circle-check fa-4x text-success mb-3 anim-pulse"></i>
            <h5 class="fw-bold text-dark mb-2">Checklist Concluído!</h5>
            <p class="text-muted mb-0" style="font-size:0.85rem;">Salvando os dados, por favor aguarde...</p>
          </div>
        </div>
      </div>
    </div>

    ${modais}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      
      // ==========================================
      // LÓGICA CASCATA DO FILTRO (MOTORISTA -> ANO -> MÊS)
      // ==========================================
      const filtrosData = ${JSON.stringify(filtrosData)};
      const nomesMesesJs = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];

      const selectMot = document.getElementById('relatorioMotorista');
      const selectAno = document.getElementById('relatorioAno');
      const selectMes = document.getElementById('relatorioMes');

      function atualizaFiltros(e) {
          if(!selectMot || !selectAno || !selectMes) return;

          const changedElement = e ? e.target.id : null;
          const motSel = selectMot.value;
          const anoSel = selectAno.value;
          const mesSel = selectMes.value;

          // 1. Dados filtrados pelo Motorista
          let dadosFiltradosMot = filtrosData;
          if (motSel) {
              dadosFiltradosMot = filtrosData.filter(f => f.motorista === motSel);
          }

          // 2. Atualiza Select de Ano se a mudança foi no motorista ou na inicialização
          if (changedElement === 'relatorioMotorista' || !changedElement) {
              const anosDisponiveis = [...new Set(dadosFiltradosMot.map(f => f.ano))].sort((a,b) => b - a);
              const keepsAno = anosDisponiveis.includes(Number(anoSel));
              
              selectAno.innerHTML = '<option value="">Todos</option>';
              anosDisponiveis.forEach(a => {
                  selectAno.innerHTML += \`<option value="\${a}" \${keepsAno && anoSel == a ? 'selected' : ''}>\${a}</option>\`;
              });
          }

          // 3. Dados filtrados pelo Ano 
          const anoAtualizado = selectAno.value;
          let dadosFiltradosAno = dadosFiltradosMot;
          if (anoAtualizado) {
              dadosFiltradosAno = dadosFiltradosMot.filter(f => f.ano == anoAtualizado);
          }

          // 4. Atualizar select de Mês sempre
          const mesesDisponiveis = [...new Set(dadosFiltradosAno.map(f => f.mes))].sort((a,b) => a - b);
          const keepsMes = mesesDisponiveis.includes(Number(mesSel));

          selectMes.innerHTML = '<option value="">Todos</option>';
          mesesDisponiveis.forEach(m => {
              const valStr = String(m).padStart(2, '0');
              const nomeM = nomesMesesJs[m - 1];
              selectMes.innerHTML += \`<option value="\${valStr}" \${keepsMes && Number(mesSel) == m ? 'selected' : ''}>\${nomeM}</option>\`;
          });
      }

      if (selectMot && selectAno && selectMes) {
          selectMot.addEventListener('change', atualizaFiltros);
          selectAno.addEventListener('change', atualizaFiltros);
          atualizaFiltros(); // Inicializa o estado assim que a página carrega
      }


      // ==========================================
      // LÓGICA DO WIZARD ANIMADO
      // ==========================================
      let isSubmitting = false; 
      let currentTab = 0;

      function showTab(n) {
        const steps = document.getElementsByClassName("wizard-step");
        for (let i = 0; i < steps.length; i++) {
          steps[i].classList.remove("active");
        }
        steps[n].classList.add("active");
        
        // Atualiza Título
        const title = steps[n].getAttribute("data-title");
        document.getElementById("stepTitle").innerText = "Passo " + (n + 1) + " de " + steps.length + " - " + title;
        
        // Atualiza Barra de Progresso
        const progress = ((n + 1) / steps.length) * 100;
        document.getElementById("progressBar").style.width = progress + "%";

        // Controla Botão Voltar
        if (n === 0) {
          document.getElementById("prevBtn").style.display = "none";
        } else {
          document.getElementById("prevBtn").style.display = "inline-block";
        }

        // Controla Botão Avançar/Concluir
        const nextBtn = document.getElementById("nextBtn");
        if (n === (steps.length - 1)) {
          nextBtn.innerHTML = 'Finalizar e Enviar <i class="fa-solid fa-check ms-1"></i>';
          nextBtn.classList.replace("btn-primary", "btn-success");
        } else {
          nextBtn.innerHTML = 'Próximo <i class="fa-solid fa-chevron-right ms-1"></i>';
          nextBtn.classList.replace("btn-success", "btn-primary");
        }
      }

      function validateForm(tabIndex) {
        const step = document.getElementsByClassName("wizard-step")[tabIndex];
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

      function nextPrev(n) {
        const steps = document.getElementsByClassName("wizard-step");
        
        if (n === 1 && !validateForm(currentTab)) return false;
        
        currentTab = currentTab + n;
        
        if (currentTab >= steps.length) {
          isSubmitting = true; 

          const wizardEl = document.getElementById('novoChecklistModal');
          const wizardModal = bootstrap.Modal.getOrCreateInstance(wizardEl);
          wizardModal.hide();

          const successEl = document.getElementById('sucessoChecklistModal');
          const successModal = bootstrap.Modal.getOrCreateInstance(successEl);
          successModal.show();

          setTimeout(() => {
            document.getElementById("wizardForm").submit();
          }, 1500);

          return false;
        }
        
        showTab(currentTab);
      }

      function resetWizard() {
        currentTab = 0;
        showTab(0);
      }

      window.addEventListener('load', () => {
        const modalEl = document.getElementById('novoChecklistModal');
        if(modalEl) {
           modalEl.addEventListener('hidden.bs.modal', function () {
             if (!isSubmitting) {
               document.getElementById("wizardForm").reset();
               resetWizard();
             }
           });
        }
        resetWizard(); 
      });
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = checklistMotoristasView;