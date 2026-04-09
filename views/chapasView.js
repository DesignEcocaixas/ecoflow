// views/chapasView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");

function chapasView(usuario, chapas = []) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  // --- LÓGICA DE SAÚDE DO ESTOQUE (COM CONTAINER RETRÁTIL E DEGRADÊ E ÍCONES ANIMADOS) ---
  let containerSaude = "";
  if (chapas.length > 0) {
    const chapasBaixoEstoque = chapas.filter(c => Number(c.quantidade) < 5000);
    
    if (chapasBaixoEstoque.length > 0) {
      const alertasDetalhados = chapasBaixoEstoque.map(c => {
        const qtd = Number(c.quantidade) || 0;
        const porcentagem = Math.min((qtd / 5000) * 100, 100);

        return `
          <div class="col-12 col-md-6 col-lg-4 col-xl-3">
            <div class="bg-white border border-warning border-opacity-50 rounded-3 p-3 shadow-sm h-100 d-flex flex-column justify-content-center transition-hover">
              <div class="d-flex justify-content-between align-items-start mb-1">
                <strong class="text-dark text-truncate pe-2" style="font-size: 0.85rem; max-width: 70%;" title="${c.material} - ${c.modelo}">
                  ${c.material} <br> <span class="text-muted fw-normal">${c.modelo}</span>
                </strong>
                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25" style="font-size: 0.75rem;">
                  ${qtd} un
                </span>
              </div>
              <div class="text-muted mb-2" style="font-size: 0.75rem;"><i class="fa-solid fa-ruler-combined me-1"></i> ${c.medida}</div>
              
              <div class="mt-auto">
                <div class="d-flex justify-content-between text-muted mb-1" style="font-size: 0.7rem;">
                  <span>Atual</span>
                  <span>Meta: 5.000</span>
                </div>
                <div class="progress bg-warning bg-opacity-25" style="height: 6px; border-radius: 10px;">
                  <div class="progress-bar bg-danger rounded-pill" role="progressbar" style="width: ${porcentagem}%" aria-valuenow="${qtd}" aria-valuemin="0" aria-valuemax="5000"></div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("");
      
      containerSaude = `
        <div class="alert alert-warning alert-dismissible fade show shadow-sm border-warning border-opacity-50 p-3 p-md-4 mb-4 position-relative" role="alert" style="border-radius: 12px; background: linear-gradient(145deg, #fffcf5 0%, #fff8e6 100%);">
          <div class="d-flex flex-column flex-sm-row align-items-start gap-3">
            <div class="bg-warning text-white p-3 rounded-circle d-flex align-items-center justify-content-center shadow-sm d-none d-sm-flex" style="width: 50px; height: 50px; flex-shrink: 0;">
              <i class="fa-solid fa-triangle-exclamation fa-xl anim-pulse"></i>
            </div>
            <div class="flex-grow-1 w-100">
              <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2 pe-4 gap-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa-solid fa-triangle-exclamation fa-lg text-warning d-sm-none anim-pulse"></i>
                  <h6 class="alert-heading fw-bold mb-0 text-dark" style="font-size: 1.05rem;">Atenção: Reabastecimento Necessário</h6>
                </div>
                <span class="badge bg-warning text-dark shadow-sm border border-warning-subtle">${chapasBaixoEstoque.length} iten(s) em nível crítico</span>
              </div>
              <p class="text-muted mb-3" style="font-size: 0.85rem;">
                Os seguintes materiais estão abaixo da margem de segurança recomendada de <strong>5.000 unidades</strong>. Considere emitir uma ordem de compra.
              </p>
              
              <div class="alert-collapse-wrapper position-relative" id="alertContentWrapper">
                <div class="row g-3 pb-2" id="alertCardsContainer">
                  ${alertasDetalhados}
                </div>
                <div class="alert-fade-overlay" id="alertFadeOverlay"></div>
              </div>
              
              <div class="text-center mt-1" id="alertToggleContainer" style="display: none;">
                <button class="btn btn-sm btn-link text-warning-emphasis fw-bold text-decoration-none" id="btnToggleAlert" type="button" style="font-size: 0.85rem;">
                  Exibir tudo <i class="fa-solid fa-chevron-down ms-1"></i>
                </button>
              </div>

            </div>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" title="Fechar alerta"></button>
        </div>
      `;
    } else {
      containerSaude = `
        <div class="alert alert-success alert-dismissible fade show shadow-sm border-success border-opacity-25 d-flex align-items-center gap-3 mb-4 p-3" role="alert" style="border-radius: 12px; background: linear-gradient(145deg, #f6fdf9 0%, #eefbf3 100%);">
          <div class="bg-success text-white p-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px; flex-shrink: 0;">
            <i class="fa-solid fa-shield fa-lg anim-pulse"></i>
          </div>
          <div class="pe-4">
            <h6 class="alert-heading fw-bold mb-1 text-success" style="font-size: 0.95rem;">Saúde do Estoque: Excelente</h6>
            <span class="text-dark text-opacity-75" style="font-size: 0.85rem;">Todos os <strong>${chapas.length}</strong> materiais operam acima de 5.000 unidades.</span>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" title="Fechar alerta"></button>
        </div>
      `;
    }
  }

  // --- GERADOR DE LINHAS DA TABELA ---
  const linhas = chapas.map(c => {
    const qtd = Number(c.quantidade) || 0;

    return `
    <tr class="align-middle chapa-row" style="cursor: pointer; transition: background-color 0.2s;" data-bs-toggle="modal" data-bs-target="#editarModal${c.id}" title="Clique na linha para editar">
      <td class="fw-medium text-dark text-nowrap">${c.material || "-"}</td>
      <td class="text-nowrap">${c.modelo || "-"}</td>
      <td class="text-muted text-nowrap"><i class="fa-solid fa-truck-fast me-1" style="font-size: 0.75rem;"></i> ${c.fornecedor || "-"}</td>
      <td class="text-nowrap">${c.medida || "-"}</td>
      <td class="text-center fw-medium ${qtd < 5000 ? 'text-danger' : 'text-dark'}">${qtd}</td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-light border text-danger" data-bs-toggle="modal" data-bs-target="#excluirModal${c.id}" title="Excluir" onclick="event.stopPropagation();">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
    `;
  }).join("");

  const modais = chapas.map(c => `
    <div class="modal fade" id="editarModal${c.id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/chapas/editar/${c.id}" class="modal-content erp-modal">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Chapa</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-3">
            <div class="row g-2">
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Material</label>
                <select name="material" class="form-select form-select-sm" required>
                  <option value="Pardo" ${c.material === 'Pardo' ? 'selected' : ''}>Pardo</option>
                  <option value="Branco" ${c.material === 'Branco' ? 'selected' : ''}>Branco</option>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Modelo</label>
                <input type="text" name="modelo" value="${c.modelo || ""}" class="form-control form-control-sm" required>
              </div>
              <div class="col-12">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Fornecedor</label>
                <input type="text" name="fornecedor" value="${c.fornecedor || ""}" class="form-control form-control-sm" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Medida da Chapa</label>
                <input type="text" name="medida" value="${c.medida || ""}" class="form-control form-control-sm" placeholder="Ex: 2000x1000" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Quantidade (Qtd)</label>
                <input type="number" name="quantidade" value="${c.quantidade || 0}" class="form-control form-control-sm" required>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top-0 bg-light">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary w-100 w-sm-auto"><i class="fa-solid fa-save me-1"></i> Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${c.id}" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal">
          <form method="POST" action="/chapas/excluir/${c.id}">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="mb-2">Excluir Chapa?</h6>
              <p class="text-muted mb-0" style="font-size:0.85rem;">Deseja remover o material <b>${c.material} - ${c.modelo}</b> do stock?</p>
            </div>
            <div class="modal-footer justify-content-center bg-light border-0 flex-nowrap">
              <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger w-100">Sim, Excluir</button>
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
    <title>Estoque de Chapas | ERP Ecoflow</title>
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
      .help-icon { cursor: help; }
      
      .transition-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .transition-hover:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.08)!important; }

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

      /* ANIMAÇÕES DOS ÍCONES DE ALERTA */
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
          max-height: 150px; /* Altura ideal para 1 linha de cards */
          overflow: hidden;
          transition: max-height 0.4s ease;
      }
      .alert-collapse-wrapper.expanded {
          max-height: 3000px; /* Expande para exibir tudo */
      }
      .alert-fade-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 60px;
          /* Degradê transparente para a cor de fundo do alerta warning (#fff8e6) */
          background: linear-gradient(to bottom, rgba(255, 248, 230, 0) 0%, rgba(255, 248, 230, 1) 100%);
          pointer-events: none;
          transition: opacity 0.3s ease;
      }
      .alert-collapse-wrapper.expanded .alert-fade-overlay {
          opacity: 0; /* Esconde o degradê quando expandido */
      }

      /* ERP Cards & Tables */
      .erp-card {
          border-radius: 12px;
          background: #fff;
          border: none;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          overflow: hidden;
      }
      
      .table > :not(caption) > * > * {
          padding: 10px 16px;
          border-bottom-color: #f0f0f0;
          vertical-align: middle;
      }
      .table thead th {
          background-color: #fafbfc;
          color: #6c757d;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e9ecef;
          padding: 12px 16px !important;
          white-space: nowrap;
      }
      .table tbody tr.chapa-row:hover {
          background-color: #f8f9fa;
      }

      .col-min-md { min-width: 140px; }
      .col-min-sm { min-width: 110px; }
      .col-filter { min-width: 110px; font-size: 0.85rem;}

      /* Modals */
      .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      .erp-modal .modal-header { border-bottom: 1px solid #f0f0f0; }
      .erp-modal .modal-footer { border-top: 1px solid #f0f0f0; }
      .form-control-sm, .form-select-sm { border-radius: 6px; }

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
            <div>
              <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-layer-group text-muted me-2"></i>Estoque de Chapas</h4>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Gestão de materiais e medidas</span>
            </div>
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

      ${containerSaude}

      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 bg-white p-3 rounded-3 shadow-sm border border-light gap-3">
        <div class="d-flex gap-2 flex-wrap w-100 w-sm-auto">
          <button class="btn btn-sm btn-success shadow-sm btn-mobile-full" data-bs-toggle="modal" data-bs-target="#novaChapaModal">
            <i class="fa-solid fa-plus me-1"></i> Cadastrar Nova Chapa
          </button>
          <button class="btn btn-sm btn-primary shadow-sm btn-mobile-full" data-bs-toggle="modal" data-bs-target="#calcChapaModal">
            <i class="fa-solid fa-calculator me-1"></i> Calculadora
          </button>
        </div>
        <div class="text-start text-sm-end w-100 w-sm-auto border-top border-sm-0 pt-2 pt-sm-0">
          <h6 class="mb-0 text-muted" style="font-size:0.85rem;">Total de Registos: <strong id="totalRegistos">${chapas.length}</strong></h6>
        </div>
      </div>

      <div class="erp-card">
        <div class="table-responsive" style="min-height: 350px;">
          <table class="table table-hover align-middle mb-0" id="tabelaChapas">
            <thead>
              <tr>
                <th class="text-start col-min-md">
                  Material 
                  <i class="fa-solid fa-circle-info text-muted ms-1 help-icon" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Pardo ou branco"></i>
                </th>
                <th class="text-start col-min-md">
                  Modelo
                  <i class="fa-solid fa-circle-info text-muted ms-1 help-icon" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Modelo ou modelos de caixas que são feitos com a chapa"></i>
                </th>
                <th class="col-min-md">
                  Fornecedor
                  <i class="fa-solid fa-circle-info text-muted ms-1 help-icon" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Nome da empresa que distribui a chapa."></i>
                </th>
                <th class="col-min-sm">
                  Medida
                  <i class="fa-solid fa-circle-info text-muted ms-1 help-icon" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Dimensões (comprimento x largura) da chapa."></i>
                </th>
                <th class="text-center col-min-sm">
                  Qtd. Chapa
                  <i class="fa-solid fa-circle-info text-muted ms-1 help-icon" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Quantidade física atual existente em estoque."></i>
                </th>
                <th class="text-end">Ações</th>
              </tr>
              <tr class="bg-light">
                <th class="p-2"><input type="text" class="form-control form-control-sm col-filter fw-normal" data-col="0" placeholder="Pesquisar material..."></th>
                <th class="p-2"><input type="text" class="form-control form-control-sm col-filter fw-normal" data-col="1" placeholder="Pesquisar modelo..."></th>
                <th class="p-2"><input type="text" class="form-control form-control-sm col-filter fw-normal" data-col="2" placeholder="Pesquisar fornecedor..."></th>
                <th class="p-2"><input type="text" class="form-control form-control-sm col-filter fw-normal" data-col="3" placeholder="Ex: 2000x1000..."></th>
                <th class="p-2"><input type="number" class="form-control form-control-sm col-filter fw-normal text-center" data-col="4" placeholder="Filtrar Qtd..."></th>
                <th class="p-2"></th>
              </tr>
            </thead>
            <tbody>
              ${linhas || "<tr><td colspan='6' class='text-center text-muted py-5'><i class='fa-solid fa-layer-group fa-2x mb-3 opacity-25'></i><br>Nenhuma chapa cadastrada no sistema.</td></tr>"}
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <div class="modal fade" id="novaChapaModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/chapas/novo" class="modal-content erp-modal">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-layer-group me-2 text-success"></i> Cadastrar Nova Chapa</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-3">
            <div class="row g-3">
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Material</label>
                <select name="material" class="form-select form-select-sm py-2" required>
                    <option value="" disabled selected>Selecione...</option>
                    <option value="Pardo">Pardo</option>
                    <option value="Branco">Branco</option>
                </select>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Modelos feitos com a chapa</label>
                <input type="text" name="modelo" class="form-control form-control-sm py-2" placeholder="Ex: N20 e N26" required>
              </div>
              <div class="col-12">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Fornecedor</label>
                <input type="text" name="fornecedor" class="form-control form-control-sm py-2" placeholder="Empresa Fornecedora" required>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Medida da Chapa</label>
                <input type="text" name="medida" class="form-control form-control-sm py-2" placeholder="Ex: 2000x1000" required>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-medium" style="font-size:0.8rem;">Quantidade Inicial</label>
                <input type="number" name="quantidade" class="form-control form-control-sm py-2" value="0" required>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top-0 bg-light d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success w-100"><i class="fa-solid fa-check me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="calcChapaModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content erp-modal">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-calculator me-2 text-primary"></i> Calculadora de Chapa</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-3">
            <div class="row g-2 mb-3">
              <div class="col-4">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Comp. (C)</label>
                <input type="number" id="calcC" class="form-control form-control-sm" placeholder="mm">
              </div>
              <div class="col-4">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Largura (L)</label>
                <input type="number" id="calcL" class="form-control form-control-sm" placeholder="mm">
              </div>
              <div class="col-4">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Altura (A)</label>
                <input type="number" id="calcA" class="form-control form-control-sm" placeholder="mm">
              </div>
            </div>
            <button type="button" id="btnCalcular" class="btn btn-sm btn-primary w-100 mb-3">Calcular Medidas</button>
            
            <div class="p-3 bg-light rounded border">
                <h6 class="fw-bold text-dark mb-2" style="font-size:0.85rem;">Resultado:</h6>
                <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted">Comprimento da Chapa:</span>
                    <strong class="text-success"><span id="resComp">-</span> mm</strong>
                </div>
                <div class="d-flex justify-content-between">
                    <span class="text-muted">Largura da Chapa:</span>
                    <strong class="text-success"><span id="resLarg">-</span> mm</strong>
                </div>
                <div class="text-muted mt-3" style="font-size: 0.7rem;">
                    Fórmulas utilizadas:<br>
                    Comp = (C + L) * 2 + 54<br>
                    Largura = L + A + 24
                </div>
            </div>
          </div>
          <div class="modal-footer border-top-0 bg-light">
            <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    ${modais}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

    <script>
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

        // 1. Lógica do Botão Retrátil (Exibir Tudo)
        const wrapper = document.getElementById('alertContentWrapper');
        const containerCards = document.getElementById('alertCardsContainer');
        const btnToggle = document.getElementById('btnToggleAlert');
        const toggleContainer = document.getElementById('alertToggleContainer');

        if (wrapper && containerCards && btnToggle) {
          // Verifica se o conteúdo real excede a altura máxima do wrapper (aprox 150px)
          if (containerCards.scrollHeight > wrapper.clientHeight) {
            toggleContainer.style.display = 'block'; // Mostra o botão

            btnToggle.addEventListener('click', function() {
              wrapper.classList.toggle('expanded');
              if (wrapper.classList.contains('expanded')) {
                btnToggle.innerHTML = 'Ocultar <i class="fa-solid fa-chevron-up ms-1"></i>';
              } else {
                btnToggle.innerHTML = 'Exibir tudo <i class="fa-solid fa-chevron-down ms-1"></i>';
              }
            });
          } else {
            // Se não exceder (ex: só tem 1 ou 2 cards), esconde o degradê
            document.getElementById('alertFadeOverlay').style.display = 'none';
          }
        }

        // 2. Inicializar Tooltips do Bootstrap
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

        // 3. Lógica de Filtro Multicoluna
        const filters = document.querySelectorAll('.col-filter');
        const tableRows = document.querySelectorAll('#tabelaChapas tbody tr.chapa-row');
        const counter = document.getElementById('totalRegistos');

        filters.forEach(filter => {
          // Previne que clicar no filtro da tabela abra o modal de edição
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