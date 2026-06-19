// views/chapasView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");

function chapasView(usuario, chapas = []) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  // --- LÓGICA DE SAÚDE DO ESTOQUE (COM CONTAINER RETRÁTIL E DEGRADÊ E ÍCONES ANIMADOS NO MODO ESCURO) ---
  let containerSaude = "";
  if (chapas.length > 0) {
    const chapasBaixoEstoque = chapas.filter(c => Number(c.quantidade) < 5000);
    
    if (chapasBaixoEstoque.length > 0) {
      const alertasDetalhados = chapasBaixoEstoque.map(c => {
        const qtd = Number(c.quantidade) || 0;
        const porcentagem = Math.min((qtd / 5000) * 100, 100);

        return `
          <div class="col-12 col-md-6 col-lg-4 col-xl-3">
            <div class="bg-custom-darker border border-warning border-opacity-25 rounded-3 p-3 shadow-sm h-100 d-flex flex-column justify-content-center transition-hover">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <strong class="text-white text-truncate pe-2" style="font-size: 0.85rem; max-width: 70%;" title="${c.material} - ${c.modelo}">
                  ${c.material} <br> <span class="text-muted fw-normal">${c.modelo}</span>
                </strong>
                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-50" style="font-size: 0.75rem;">
                  ${qtd} un
                </span>
              </div>
              <div class="text-muted mb-2" style="font-size: 0.75rem;"><i class="fa-solid fa-ruler-combined me-1"></i> ${c.medida}</div>
              
              <div class="mt-auto pt-2">
                <div class="d-flex justify-content-between text-muted mb-1" style="font-size: 0.7rem;">
                  <span>Atual</span>
                  <span>Meta: 5.000</span>
                </div>
                <div class="progress bg-custom-dark border border-custom" style="height: 6px; border-radius: 10px;">
                  <div class="progress-bar bg-danger rounded-pill" role="progressbar" style="width: ${porcentagem}%" aria-valuenow="${qtd}" aria-valuemin="0" aria-valuemax="5000"></div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("");
      
      containerSaude = `
        <div class="alert alert-warning alert-dismissible fade show shadow-sm border-warning border-opacity-25 p-3 p-md-4 mb-4 position-relative" role="alert" style="border-radius: 12px; background: linear-gradient(145deg, #2a2211 0%, #1f1a0e 100%); color: rgba(255,255,255,0.85);">
          <div class="d-flex flex-column flex-sm-row align-items-start gap-3">
            <div class="bg-warning text-dark p-3 rounded-circle d-flex align-items-center justify-content-center shadow-sm d-none d-sm-flex" style="width: 50px; height: 50px; flex-shrink: 0;">
              <i class="fa-solid fa-triangle-exclamation fa-xl anim-pulse"></i>
            </div>
            <div class="flex-grow-1 w-100">
              <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2 pe-4 gap-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa-solid fa-triangle-exclamation fa-lg text-warning d-sm-none anim-pulse"></i>
                  <h6 class="alert-heading fw-bold mb-0 text-white" style="font-size: 1.05rem;">Atenção: Reabastecimento Necessário</h6>
                </div>
                <span class="badge bg-warning bg-opacity-25 text-warning shadow-sm border border-warning border-opacity-50">${chapasBaixoEstoque.length} iten(s) em nível crítico</span>
              </div>
              <p class="text-muted mb-3" style="font-size: 0.85rem;">
                Os seguintes materiais estão abaixo da margem de segurança recomendada de <strong class="text-white">5.000 unidades</strong>. Considere emitir uma ordem de compra.
              </p>
              
              <div class="alert-collapse-wrapper position-relative" id="alertContentWrapper">
                <div class="row g-3 pb-2" id="alertCardsContainer">
                  ${alertasDetalhados}
                </div>
                <div class="alert-fade-overlay" id="alertFadeOverlay" style="background: linear-gradient(to bottom, rgba(31, 26, 14, 0) 0%, rgba(31, 26, 14, 1) 100%);"></div>
              </div>
              
              <div class="text-center mt-2" id="alertToggleContainer" style="display: none;">
                <button class="btn btn-sm btn-link text-warning fw-bold text-decoration-none" id="btnToggleAlert" type="button" style="font-size: 0.85rem;">
                  Exibir tudo <i class="fa-solid fa-chevron-down ms-1"></i>
                </button>
              </div>

            </div>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Close" title="Fechar alerta"></button>
        </div>
      `;
    } else {
      containerSaude = `
        <div class="alert alert-success alert-dismissible fade show shadow-sm border-success border-opacity-25 d-flex align-items-center gap-3 mb-4 p-3" role="alert" style="border-radius: 12px; background: linear-gradient(145deg, #0a2114 0%, #0d281a 100%); color: rgba(255,255,255,0.85);">
          <div class="bg-success text-white p-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px; flex-shrink: 0;">
            <i class="fa-solid fa-shield fa-lg anim-pulse text-dark"></i>
          </div>
          <div class="pe-4">
            <h6 class="alert-heading fw-bold mb-1 text-success" style="font-size: 0.95rem;">Saúde do Estoque: Excelente</h6>
            <span class="text-muted" style="font-size: 0.85rem;">Todos os <strong class="text-white">${chapas.length}</strong> materiais operam acima de 5.000 unidades.</span>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Close" title="Fechar alerta"></button>
        </div>
      `;
    }
  }

  // --- GERADOR DE LINHAS DA TABELA (COMPACTA) ---
  const linhas = chapas.map(c => {
    const qtd = Number(c.quantidade) || 0;

    return `
    <tr class="align-middle chapa-row table-hover-row" style="cursor: pointer;" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('editarModal${c.id}')).show();" title="Clique na linha para editar">
      <td class="text-white py-2 px-3 text-nowrap">${c.material || "-"}</td>
      <td class="text-white py-2 px-3 text-nowrap">${c.modelo || "-"}</td>
      <td class="text-muted py-2 px-3 text-nowrap"><i class="fa-solid fa-truck-fast text-muted me-1 opacity-50" style="font-size: 0.75rem;"></i> ${c.fornecedor || "-"}</td>
      <td class="text-muted py-2 px-3 text-nowrap">${c.medida || "-"}</td>
      <td class="text-center py-2 px-3 ${qtd < 5000 ? 'text-danger fw-bold' : 'text-accent fw-medium'}">${qtd}</td>
      <td class="text-end text-nowrap py-2 px-3">
        <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger py-1 px-2 shadow-sm" data-bs-toggle="modal" data-bs-target="#excluirModal${c.id}" title="Excluir" onclick="event.stopPropagation();">
          <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
        </button>
      </td>
    </tr>
    `;
  }).join("");

  const modais = chapas.map(c => `
    <div class="modal fade" id="editarModal${c.id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/chapas/editar/${c.id}" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="showSuccessModal(event, this, 'Chapa Atualizada!')">
          <div class="modal-header bg-custom-darker border-custom">
            <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Chapa</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Material</label>
                <select name="material" class="form-select form-select-sm py-2 shadow-sm text-white" required>
                  <option value="Pardo" ${c.material === 'Pardo' ? 'selected' : ''}>Pardo</option>
                  <option value="Branco" ${c.material === 'Branco' ? 'selected' : ''}>Branco</option>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Modelo</label>
                <input type="text" name="modelo" value="${c.modelo || ""}" class="form-control form-control-sm py-2 shadow-sm" required>
              </div>
              <div class="col-12">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Fornecedor</label>
                <input type="text" name="fornecedor" value="${c.fornecedor || ""}" class="form-control form-control-sm py-2 shadow-sm" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Medida da Chapa</label>
                <input type="text" name="medida" value="${c.medida || ""}" class="form-control form-control-sm py-2 shadow-sm" placeholder="Ex: 2000x1000" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Quantidade (Qtd)</label>
                <input type="number" name="quantidade" value="${c.quantidade || 0}" class="form-control form-control-sm py-2 shadow-sm" required>
              </div>
            </div>
          </div>
          <div class="modal-footer border-custom bg-custom-darker d-flex flex-nowrap pt-3">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary w-100 w-sm-auto text-dark fw-bold shadow-sm"><i class="fa-solid fa-save me-1"></i> Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${c.id}" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 bg-custom-darker shadow-lg">
          <form method="POST" action="/chapas/excluir/${c.id}">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="mb-2 fw-bold text-white">Excluir Chapa?</h6>
              <p class="text-muted mb-0" style="font-size:0.8rem;">Deseja remover o material <b class="text-white">${c.material} - ${c.modelo}</b> do stock?</p>
            </div>
            <div class="modal-footer justify-content-center bg-custom-darker border-0 flex-nowrap pt-2 pb-3 px-3">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Sim, Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `).join("");

  const menuHTML = menuLateral(user, "/chapas");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Chapas | Ecoflow</title>
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
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
      .border-custom { border-color: rgba(255,255,255,0.08) !important; border-style: solid; border-width: 1px; }
      .text-accent { color: #08c068 !important; }

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

      /* Utilities */
      .text-sm { font-size: 0.875rem; }
      .help-icon { cursor: help; }
      
      .transition-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .transition-hover:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }

      /* ANIMAÇÕES DOS ÍCONES DE ALERTA & SUCESSO */
      @keyframes pulseIcon {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); opacity: 0.8; }
        100% { transform: scale(1); }
      }
      .anim-pulse { 
        animation: pulseIcon 1.5s infinite ease-in-out; 
      }

      /* CLASSES DO ALERTA RETRÁTIL */
      .alert-collapse-wrapper {
          max-height: 150px; 
          overflow: hidden;
          transition: max-height 0.4s ease;
      }
      .alert-collapse-wrapper.expanded {
          max-height: 3000px; 
      }
      .alert-fade-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 60px;
          pointer-events: none;
          transition: opacity 0.3s ease;
      }
      .alert-collapse-wrapper.expanded .alert-fade-overlay {
          opacity: 0; 
      }

      /* Tabelas e Modais */
      .erp-card {
          border-radius: 12px;
          background: #2a2a2a;
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          overflow: hidden;
      }
      
      .table { 
          --bs-table-bg: transparent; 
          --bs-table-color: #fff; 
          --bs-table-hover-bg: rgba(255,255,255,0.06);
          --bs-table-hover-color: #fff;
          color: #fff; 
          margin-bottom: 0;
      }
      .table thead th { 
          background-color: #222 !important; 
          color: rgba(255,255,255,0.6) !important; 
          border-bottom: 1px solid rgba(255,255,255,0.1) !important; 
          font-weight: 600; 
          font-size: 0.75rem;
          text-transform: uppercase;
      }
      .table tbody td { 
          border-bottom: 1px solid rgba(255,255,255,0.05) !important; 
          background-color: transparent !important; 
          color: #fff !important; 
      }
      
      /* Hover forcado para as linhas da tabela */
      .table-hover-row { transition: background-color 0.2s; }
      .table-hover-row:hover > td {
          background-color: rgba(255,255,255,0.06) !important;
      }

      .col-min-md { min-width: 140px; }
      .col-min-sm { min-width: 110px; }
      .col-filter { min-width: 110px; font-size: 0.8rem;}

      /* Modals */
      .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5); background-color: #2a2a2a; }
      .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); }
      .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); }

      /* Offcanvas Mobile */
      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 16px; }
        .btn-mobile-full { width: 100%; display: block; margin-bottom: 10px; text-align: center;}
        .w-sm-auto { width: auto !important; }
      }
      @media (min-width: 768px) {
        .w-sm-auto { width: auto !important; }
      }
      .offcanvas { background-color: #1f1f1f !important; }
      .offcanvas-body a { display: block; text-align: left; padding: 12px 15px; color: white; text-decoration: none; margin: 4px 0; border-radius: 6px;}
      .offcanvas-body a:hover, .offcanvas-body a.active { background-color: rgba(255,255,255,0.1); }
    </style>
  </head>
  <body>
    
    ${renderLoaderParticulas("Consultando estoque")}

    <div class="sidebar d-none d-md-flex">
      <div class="text-center mb-4 mt-2">
        <img src="/img/logo-branca.png" alt="Logo da Empresa" class="img-fluid" style="max-width: 130px;">
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
        <hr class="border-custom mt-4">
        <a href="/logout" class="text-danger mt-2" style="font-size: 0.85rem;"><i class="fas fa-sign-out-alt me-2"></i>Sair do Sistema</a>
      </div>
    </div>

    <div class="content">
      
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-layer-group text-muted me-2"></i>Estoque de Chapas</h5>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.7rem;">Gestão de materiais e medidas</span>
            </div>
        </div>
      </div>

      ${containerSaude}

      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 bg-custom-darker p-3 rounded-3 shadow-sm border border-custom gap-3">
        <div class="d-flex gap-2 flex-wrap w-100 w-sm-auto">
          <button class="btn btn-sm btn-success shadow-sm btn-mobile-full text-dark fw-bold" data-bs-toggle="modal" data-bs-target="#novaChapaModal">
            <i class="fa-solid fa-plus me-1"></i> Cadastrar Nova Chapa
          </button>
          <button class="btn btn-sm btn-primary shadow-sm btn-mobile-full fw-bold text-dark" data-bs-toggle="modal" data-bs-target="#calcChapaModal">
            <i class="fa-solid fa-calculator me-1"></i> Calculadora
          </button>
          <a href="/exportar/chapas" target="_blank" class="btn btn-sm btn-outline-success shadow-sm btn-mobile-full fw-bold" title="Exportar para Excel">
            <i class="fa-solid fa-file-excel me-1"></i> Relatório
          </a>
        </div>
        <div class="text-start text-sm-end w-100 w-sm-auto border-top border-custom border-sm-0 pt-3 pt-sm-0">
          <h6 class="mb-0 text-muted" style="font-size:0.8rem;">Total de Registos: <strong class="text-white" id="totalRegistos">${chapas.length}</strong></h6>
        </div>
      </div>

      <div class="erp-card border-custom">
        <div class="table-responsive" style="min-height: 350px;">
          <table class="table table-sm align-middle mb-0" id="tabelaChapas" style="font-size: 0.8rem; border-collapse: separate; border-spacing: 0;">
            <thead class="table-light">
              <tr>
                <th class="text-start col-min-md py-2 px-3 border-0">
                  Material 
                  <i class="fa-solid fa-circle-info text-muted ms-1 help-icon" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Pardo ou branco"></i>
                </th>
                <th class="text-start col-min-md py-2 px-3 border-0">
                  Modelo
                  <i class="fa-solid fa-circle-info text-muted ms-1 help-icon" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Modelo ou modelos de caixas que são feitos com a chapa"></i>
                </th>
                <th class="col-min-md py-2 px-3 border-0">
                  Fornecedor
                  <i class="fa-solid fa-circle-info text-muted ms-1 help-icon" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Nome da empresa que distribui a chapa."></i>
                </th>
                <th class="col-min-sm py-2 px-3 border-0">
                  Medida
                  <i class="fa-solid fa-circle-info text-muted ms-1 help-icon" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Dimensões (comprimento x largura) da chapa."></i>
                </th>
                <th class="text-center col-min-sm py-2 px-3 border-0">
                  Qtd. Chapa
                  <i class="fa-solid fa-circle-info text-muted ms-1 help-icon" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Quantidade física atual existente em estoque."></i>
                </th>
                <th class="text-end py-2 px-3 border-0">Ações</th>
              </tr>
              <tr class="bg-custom-darker border-bottom border-custom">
                <th class="py-1 px-3 border-0"><input type="text" class="form-control form-control-sm col-filter fw-normal shadow-none" data-col="0" placeholder="Pesquisar material..."></th>
                <th class="py-1 px-3 border-0"><input type="text" class="form-control form-control-sm col-filter fw-normal shadow-none" data-col="1" placeholder="Pesquisar modelo..."></th>
                <th class="py-1 px-3 border-0"><input type="text" class="form-control form-control-sm col-filter fw-normal shadow-none" data-col="2" placeholder="Pesquisar fornecedor..."></th>
                <th class="py-1 px-3 border-0"><input type="text" class="form-control form-control-sm col-filter fw-normal shadow-none" data-col="3" placeholder="Ex: 2000x1000..."></th>
                <th class="py-1 px-3 border-0"><input type="number" class="form-control form-control-sm col-filter fw-normal text-center shadow-none" data-col="4" placeholder="Filtrar Qtd..."></th>
                <th class="py-1 px-3 border-0"></th>
              </tr>
            </thead>
            <tbody class="border-top-0">
              ${linhas || "<tr><td colspan='6' class='text-center text-muted py-5'><i class='fa-solid fa-layer-group fa-2x mb-3 opacity-25'></i><br>Nenhuma chapa cadastrada no sistema.</td></tr>"}
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <div class="modal fade" id="novaChapaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/chapas/novo" class="modal-content erp-modal border-0 shadow-lg bg-custom-darker" onsubmit="showSuccessModal(event, this, 'Chapa Cadastrada!')">
          <div class="modal-header bg-custom-darker border-custom">
            <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-layer-group me-2 text-success"></i> Cadastrar Nova Chapa</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="row g-3">
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Material</label>
                <select name="material" class="form-select form-select-sm py-2 shadow-sm text-white" required>
                    <option value="" disabled selected>Selecione...</option>
                    <option value="Pardo">Pardo</option>
                    <option value="Branco">Branco</option>
                </select>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Modelos feitos com a chapa</label>
                <input type="text" name="modelo" class="form-control form-control-sm py-2 shadow-sm" placeholder="Ex: N20 e N26" required>
              </div>
              <div class="col-12">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Fornecedor</label>
                <input type="text" name="fornecedor" class="form-control form-control-sm py-2 shadow-sm" placeholder="Empresa Fornecedora" required>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Medida da Chapa</label>
                <input type="text" name="medida" class="form-control form-control-sm py-2 shadow-sm" placeholder="Ex: 2000x1000" required>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Quantidade Inicial</label>
                <input type="number" name="quantidade" class="form-control form-control-sm py-2 shadow-sm" value="0" required>
              </div>
            </div>
          </div>
          <div class="modal-footer border-custom bg-custom-darker d-flex flex-nowrap pt-3">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success w-100 text-dark fw-bold shadow-sm"><i class="fa-solid fa-check me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="calcChapaModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <div class="modal-header bg-custom-darker border-custom">
            <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-calculator me-2 text-primary"></i> Calculadora de Chapa</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="row g-2 mb-3">
              <div class="col-4">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Comp. (C)</label>
                <input type="number" id="calcC" class="form-control form-control-sm shadow-sm" placeholder="mm">
              </div>
              <div class="col-4">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Largura (L)</label>
                <input type="number" id="calcL" class="form-control form-control-sm shadow-sm" placeholder="mm">
              </div>
              <div class="col-4">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Altura (A)</label>
                <input type="number" id="calcA" class="form-control form-control-sm shadow-sm" placeholder="mm">
              </div>
            </div>
            <button type="button" id="btnCalcular" class="btn btn-sm btn-primary w-100 mb-3 fw-bold text-dark shadow-sm py-2">Calcular Medidas</button>
            
            <div class="p-3 bg-custom-darker rounded border-custom shadow-sm">
                <h6 class="fw-bold text-white mb-3" style="font-size:0.8rem;">Resultado:</h6>
                <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Comprimento da Chapa:</span>
                    <strong class="text-accent"><span id="resComp">-</span> mm</strong>
                </div>
                <div class="d-flex justify-content-between">
                    <span class="text-muted">Largura da Chapa:</span>
                    <strong class="text-accent"><span id="resLarg">-</span> mm</strong>
                </div>
                <div class="text-muted mt-3 pt-2 border-top border-custom" style="font-size: 0.7rem;">
                    <span class="d-block mb-1 text-white opacity-75">Fórmulas utilizadas:</span>
                    Comp = (C + L) * 2 + 54<br>
                    Largura = L + A + 24
                </div>
            </div>
          </div>
          <div class="modal-footer border-custom bg-custom-darker">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Fechar Calculadora</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="sucessoChapaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 bg-custom-darker shadow-lg">
          <div class="modal-body text-center p-5">
            <i class="fa-solid fa-circle-check fa-4x text-success mb-3 anim-pulse"></i>
            <h5 class="fw-bold text-white mb-2" style="font-size: 1.1rem;" id="sucessoChapaTitulo">Sucesso!</h5>
            <p class="text-muted mb-0" style="font-size:0.8rem;">Salvando os dados, por favor aguarde...</p>
          </div>
        </div>
      </div>
    </div>

    ${modais}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

    <script>
      // Função global para exibir modal animado e submeter form (usado em Novo e Editar)
      let isSubmitting = false;

      function showSuccessModal(event, formElement, titleMsg) {
        if (isSubmitting) return; // Evita duplo envio acidental
        
        event.preventDefault(); // Segura o envio padrao para mostrar a animação
        
        // Esconde o modal de cadastro/edição que está aberto
        const parentModalEl = formElement.closest('.modal');
        if (parentModalEl) {
            const parentModal = bootstrap.Modal.getInstance(parentModalEl) || bootstrap.Modal.getOrCreateInstance(parentModalEl);
            parentModal.hide();
        }
        
        // Configura título e mostra o modal de sucesso
        document.getElementById('sucessoChapaTitulo').innerText = titleMsg;
        const successModalEl = document.getElementById('sucessoChapaModal');
        const successModal = bootstrap.Modal.getOrCreateInstance(successModalEl);
        successModal.show();
        
        isSubmitting = true;

        // Submete de fato o formulário após 1.5s
        setTimeout(() => {
            formElement.submit();
        }, 1500);
      }

      document.addEventListener("DOMContentLoaded", function() {
        
        // Lógica da Calculadora de Chapa
        const btnCalcular = document.getElementById('btnCalcular');
        if (btnCalcular) {
            btnCalcular.addEventListener('click', () => {
                const c = Number(document.getElementById('calcC').value) || 0;
                const l = Number(document.getElementById('calcL').value) || 0;
                const a = Number(document.getElementById('calcA').value) || 0;
                
                const comp = (c + l) * 2 + 54;
                const larg = l + a + 24;
                
                document.getElementById('resComp').innerText = comp;
                document.getElementById('resLarg').innerText = larg;
            });
        }

        // Lógica do Botão Retrátil (Exibir Tudo)
        const wrapper = document.getElementById('alertContentWrapper');
        const containerCards = document.getElementById('alertCardsContainer');
        const btnToggle = document.getElementById('btnToggleAlert');
        const toggleContainer = document.getElementById('alertToggleContainer');

        if (wrapper && containerCards && btnToggle) {
          if (containerCards.scrollHeight > wrapper.clientHeight) {
            toggleContainer.style.display = 'block'; 
            btnToggle.addEventListener('click', function() {
              wrapper.classList.toggle('expanded');
              if (wrapper.classList.contains('expanded')) {
                btnToggle.innerHTML = 'Ocultar <i class="fa-solid fa-chevron-up ms-1"></i>';
              } else {
                btnToggle.innerHTML = 'Exibir tudo <i class="fa-solid fa-chevron-down ms-1"></i>';
              }
            });
          } else {
            document.getElementById('alertFadeOverlay').style.display = 'none';
          }
        }

        // Inicializar Tooltips do Bootstrap
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

        // Lógica de Filtro Multicoluna
        const filters = document.querySelectorAll('.col-filter');
        const tableRows = document.querySelectorAll('#tabelaChapas tbody tr.chapa-row');
        const counter = document.getElementById('totalRegistos');

        filters.forEach(filter => {
          filter.addEventListener('click', function(e) {
            e.stopPropagation();
          });

          filter.addEventListener('input', function() {
            let visiveis = 0;

            tableRows.forEach(row => {
              let showRow = true;

              filters.forEach(f => {
                const colIdx = f.getAttribute('data-col');
                const filterValue = f.value.toLowerCase().trim();
                
                if (filterValue !== "") {
                  const cell = row.querySelectorAll('td')[colIdx];
                  if (cell) {
                    const cellText = cell.textContent.toLowerCase();
                    if (!cellText.includes(filterValue)) {
                      showRow = false;
                    }
                  }
                }
              });

              row.style.display = showRow ? '' : 'none';
              if (showRow) visiveis++;
            });

            if (counter) counter.innerText = visiveis;
          });
        });
      });
    </script>
  </body>
  </html>
  `;
}

module.exports = chapasView;