// views/ordemProducaoView.js
const menuLateral = require("./menuLateral");

module.exports = function ordemProducaoView(usuario, rotativa = [], flexo = [], query = {}, rotativaNovas = 0, flexoNovas = 0, historico = [], paginacao = {}) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const menuHTML = menuLateral(user, "/producao");

  function formatarCor(cor) {
    if (!cor || cor === 'N/D') return 'Não definida';
    return cor.replace(/personalização/i, '').trim();
  }

  const badgeStatus = status =>
    status === 'concluido'
      ? '<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-50">Concluído</span>'
      : '<span class="badge bg-custom-darker border-custom text-muted">Pendente</span>';

  // Lógica de Paginação Inteligente
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;
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
          html += `<li class="page-item"><a class="page-link" href="/producao?page=${ultima + 1}">${ultima + 1}</a></li>`;
        } else if (p - ultima > 2) {
          html += `<li class="page-item disabled"><span class="page-link text-muted border-0 bg-transparent">...</span></li>`;
        }
      }
      html += `<li class="page-item ${p === page ? "active" : ""}"><a class="page-link ${p === page ? "fw-bold" : ""}" href="/producao?page=${p}">${p}</a></li>`;
      ultima = p;
    });

    return html;
  })();

  const paginacaoHtml = totalPages > 1 ? `
    <nav aria-label="Paginação" class="mt-4">
      <ul class="pagination pagination-sm justify-content-center mb-0">
        <li class="page-item ${page <= 1 ? "disabled" : ""}">
          <a class="page-link" href="/producao?page=${page - 1}">&laquo;</a>
        </li>
        ${pageLinks}
        <li class="page-item ${page >= totalPages ? "disabled" : ""}">
          <a class="page-link" href="/producao?page=${page + 1}">&raquo;</a>
        </li>
      </ul>
    </nav>
  ` : "";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Produção | Ecoflow</title>
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

    body { display: flex; height: 100vh; margin: 0; background-color: #1f1f1f; color: #ffffff; font-family: 'Segoe UI', sans-serif; }
    .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column; }
    
    .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; background-color: #1f1f1f; }
    
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
    
    .btn-outline-danger { color: #dc3545; border-color: #dc3545; }
    .btn-outline-danger:hover { background-color: #dc3545; color: #fff; }
    
    .btn-info { background-color: #17a2b8; border-color: #17a2b8; color: #fff; }
    .btn-info:hover { background-color: #138496; border-color: #117a8b; color: #fff; }

    /* Inputs e Selects */
    .form-control, .form-select, .input-group-text { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.8rem; }
    .form-control:focus, .form-select:focus { background-color: #2a2a2a; border-color: #08c068; color: #fff; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }
    .input-group-text { background-color: #2a2a2a; color: rgba(255,255,255,0.6); }

    /* ERP Cards (Produção) */
    .erp-card { border-radius: 12px; transition: transform 0.2s; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; background-color: #2a2a2a; color: #fff; }
    .erp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.3) !important; border-color: rgba(255,255,255,0.15); }
    
    .card-concluido { background-color: rgba(8, 192, 104, 0.05) !important; border-left: 4px solid #08c068 !important; }
    .card-pendente { background-color: #2a2a2a !important; border-left: 4px solid #6c757d !important; }
    .info-sm { font-size: 0.75rem; }
    
    /* Tabelas e Modais */
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
    }
    .table tbody td { 
        border-bottom: 1px solid rgba(255,255,255,0.05) !important; 
        background-color: transparent !important; 
        color: #fff !important; 
    }
    .table-hover-row { transition: background-color 0.2s ease; cursor: pointer; }
    .table-hover-row:hover > td, 
    .table-hover > tbody > tr:hover > td, 
    .table-hover > tbody > tr:hover > * { 
        background-color: rgba(255,255,255,0.06) !important; 
        color: #fff !important; 
        box-shadow: inset 0 0 0 9999px rgba(255, 255, 255, 0.03);
    }

    .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
    .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
    
    .list-group-item { background-color: transparent !important; border-color: rgba(255,255,255,0.05); color: #fff; }

    /* Progress Bar */
    .progress { height: 16px; border-radius: 10px; background-color: #1f1f1f; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
    .progress-bar { background-color: #08c068; transition: width 0.4s ease; color: #1f1f1f; }

    /* Pagination */
    .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
    .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; }
    .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
    .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.05); }

    /* ANIMAÇÃO DE ENTRADA E SAÍDA DO TOAST */
    .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
    .toast.showing, .toast.show { transform: translateX(0); }
    .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
    @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

    /* ANIMAÇÃO DE ENTRADA E SAÍDA DOS MODAIS */
    .modal.fade .modal-dialog { transform: scale(0.85) translateY(30px); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
    .modal.show .modal-dialog { transform: scale(1) translateY(0); }

    /* SKELETON LOADING (MODO ESCURO) */
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

    /* Divisória apenas no desktop */
    @media (min-width: 992px) {
      .border-lg-end-custom { border-right: 1px solid rgba(255,255,255,0.08); }
    }

    /* Botão Flutuante de Ajuda */
    .btn-flutuante {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background-color: #08c068;
      color: #1f1f1f;
      border: none;
      box-shadow: 0 4px 15px rgba(8, 192, 104, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      z-index: 1050;
      transition: all 0.3s ease;
    }
    .btn-flutuante:hover {
      transform: scale(1.1);
      background-color: #06a055;
      color: #1f1f1f;
      box-shadow: 0 6px 20px rgba(8, 192, 104, 0.5);
    }
    
    @media (max-width: 767.98px) {
      body { flex-direction: column; }
      .sidebar { display: none; }
      .content { width: 100%; padding: 16px; }
    }
    .offcanvas { background-color: #1f1f1f !important; }
  </style>
</head>
<body>

  <div class="sidebar d-none d-md-flex">
    <div class="text-center mb-4 mt-2"><img src="/img/logo-branca.png" class="img-fluid" style="max-width:130px;"></div>
    <div class="flex-grow-1">${menuHTML}</div>
  </div>

  <div class="offcanvas offcanvas-start text-white" tabindex="-1" id="sidebarMenu">
    <div class="offcanvas-header border-bottom border-custom">
      <h5 class="offcanvas-title ms-2" style="font-size: 0.9rem;"><i class="fa-solid fa-bars text-muted me-2"></i> Menu</h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body">
      <div class="text-center mb-4 mt-2"><img src="/img/logo.png" class="img-fluid" style="max-width:140px;"></div>
      ${menuHTML}
    </div>
  </div>

  <div class="content">
    <div class="d-flex align-items-center gap-3 mb-4">
      <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
      <div>
          <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-industry text-muted me-2"></i>Ordens de Produção</h5>
      </div>
    </div>

    <div class="bg-custom-darker p-4 rounded-3 shadow-sm mb-4 border border-custom">
      <div class="row g-4 align-items-center">
        
        <div class="col-lg-6 border-lg-end-custom pe-lg-4">
          <h6 class="text-muted fw-bold mb-3" style="font-size: 0.75rem;"><i class="fa-solid fa-file-excel me-1"></i> IMPORTAR PLANILHA EXCEL</h6>
          <form action="/importar" method="POST" enctype="multipart/form-data" class="row g-2 align-items-end" id="formImportacao">
            <div class="col-12 col-xl-8">
              <input type="file" name="planilha" accept=".xlsx,.xls" class="form-control form-control-sm shadow-sm" required>
            </div>
            <div class="col-12 col-xl-4 d-flex gap-2">
              <button type="submit" class="btn btn-sm btn-primary flex-grow-1 shadow-sm fw-bold">Gerar Ordens</button>
              <button type="button" class="btn btn-sm btn-outline-danger shadow-sm px-3" data-bs-toggle="modal" data-bs-target="#modalLimpar" title="Limpar Tudo"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </form>
        </div>

        <div class="col-lg-6 ps-lg-4">
          <h6 class="text-muted fw-bold mb-3" style="font-size: 0.75rem;"><i class="fa-solid fa-bars-progress me-1"></i> ACOMPANHAMENTO DA PRODUÇÃO</h6>
          <div class="row g-3">
            
            <div class="col-sm-6">
              <button class="btn btn-outline-primary w-100 py-3 position-relative fw-bold shadow-sm d-flex flex-column align-items-center justify-content-center"
                      data-bs-toggle="modal"
                      data-bs-target="#modalRotativa"
                      style="font-size: 0.85rem;"
                      onclick="marcarVisualizado('rotativa', this)">
                <div class="d-flex align-items-center text-white">
                  <i class="fa-solid fa-gear text-primary me-2"></i> Rotativa / Plana
                  <span class="badge ${rotativaNovas > 0 ? 'bg-danger' : 'bg-primary'} ms-2">${rotativa.length}</span>
                </div>
              </button>
            </div>

            <div class="col-sm-6">
              <button class="btn btn-outline-success w-100 py-3 position-relative fw-bold shadow-sm d-flex flex-column align-items-center justify-content-center"
                      data-bs-toggle="modal"
                      data-bs-target="#modalFlexo"
                      style="font-size: 0.85rem;"
                      onclick="marcarVisualizado('flexografica', this)">
                <div class="d-flex align-items-center text-white">
                  <i class="fa-solid fa-layer-group text-accent me-2"></i> Flexográfica
                  <span class="badge ${flexoNovas > 0 ? 'bg-danger' : 'bg-success'} text-dark ms-2">${flexo.length}</span>
                </div>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>

    <div class="bg-custom-darker p-4 rounded-3 shadow-sm border border-custom">
      <h6 class="text-muted fw-bold mb-3" style="font-size: 0.75rem;"><i class="fa-solid fa-clock-rotate-left me-2"></i>HISTÓRICO DE IMPORTAÇÕES GERADAS</h6>
      
      <div class="table-responsive bg-custom-darker border-custom rounded shadow-sm">
        <table class="table table-sm table-hover align-middle mb-0" style="font-size: 0.8rem;">
          <thead class="table-light">
            <tr>
              <th class="py-2 px-3">Data de Geração das Ordens</th>
              <th class="py-2 px-3 text-center">Ordens Geradas Neste Dia</th>
              <th class="py-2 px-3 text-end">Ação</th>
            </tr>
          </thead>
          <tbody class="border-top-0">
            ${historico.length === 0 ? '<tr><td colspan="3" class="text-center text-muted py-5"><i class="fa-solid fa-inbox fa-2x d-block mb-3 opacity-25"></i><span style="font-size:0.8rem;">Nenhum histórico encontrado.</span></td></tr>' : historico.map(h => `
              <tr class="table-hover-row" onclick="window.open('/exportar/historico?lote=${h.lote_id}', '_blank')" title="Clique para baixar esta geração específica">
                <td class="fw-bold text-white py-2 px-3"><i class="fa-regular fa-clock text-muted me-2"></i> ${h.data_formatada}</td>
                <td class="text-center text-muted py-2 px-3">${h.total_pedidos} registros nesta geração</td>
                <td class="text-end py-2 px-3">
                    <button class="btn btn-sm btn-outline-secondary border-custom text-accent fw-bold shadow-sm py-1 px-2" style="font-size: 0.75rem;"><i class="fa-solid fa-download me-1"></i> Histórico</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      ${paginacaoHtml}
    </div>
  </div>

  <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
      <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
              <div>
                  <i class="fa-solid fa-circle-check fs-5 me-2 text-accent" id="sucessoIcon"></i>
                  <strong class="fs-6" id="sucessoTitulo">Concluído!</strong>
              </div>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
          </div>
          <div class="toast-body pt-1 pb-4 px-3 position-relative">
              <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="sucessoSub">Operação realizada com sucesso.</p>
          </div>
          <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none;"></div>
      </div>

      <div id="erroToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(220,53,69,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
              <div>
                  <i class="fa-solid fa-circle-xmark fs-5 me-2 text-danger"></i>
                  <strong class="fs-6" id="erroTitulo">Erro!</strong>
              </div>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
          </div>
          <div class="toast-body pt-1 pb-4 px-3 position-relative">
              <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="erroSub">Ocorreu um erro ao processar.</p>
          </div>
          <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
      </div>
  </div>

  <button class="btn-flutuante" data-bs-toggle="modal" data-bs-target="#modalInstrucoes" title="Ajuda / Como usar">
    <i class="fa-solid fa-question"></i>
  </button>

  <div class="modal fade" id="modalInstrucoes" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content erp-modal shadow-lg border-0">
        <div class="modal-header bg-custom-darker text-white border-0">
          <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-circle-info text-accent me-2"></i> Como usar este módulo</h6>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4 text-muted bg-custom-dark" style="font-size: 0.8rem;">
          <p class="mb-4">Bem-vindo ao módulo de <strong>Ordens de Produção</strong>. Siga os passos abaixo para o funcionamento correto do sistema:</p>
          
          <ul class="list-group list-group-flush mb-4">
            <li class="list-group-item bg-transparent px-0 border-custom pb-3">
              <strong class="text-white d-block mb-1"><i class="fa-solid fa-file-excel text-success me-2"></i> 1. Importar Planilha</strong>
              Selecione o seu ficheiro Excel (.xlsx) de ordens e clique em "Gerar Ordens". O sistema vai analisar e separar tudo automaticamente em "Rotativa / Plana" e "Flexográfica". <em class="text-muted">Nota: Importar uma nova planilha arquiva automaticamente a anterior no Histórico.</em>
            </li>
            <li class="list-group-item bg-transparent px-0 border-custom py-3">
              <strong class="text-white d-block mb-1"><i class="fa-solid fa-bars-progress text-primary me-2"></i> 2. Acompanhamento & Status</strong>
              Abra os painéis (Rotativa ou Flexográfica). Pode clicar diretamente em qualquer cartão para alterar o estado do pedido entre <span class="badge bg-custom-darker border border-custom text-muted">Pendente</span> e <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-50">Concluído</span>.
            </li>
            <li class="list-group-item bg-transparent px-0 border-custom py-3">
              <strong class="text-white d-block mb-1"><i class="fa-solid fa-share-nodes text-info me-2"></i> 3. Integração Workspaces</strong>
              Dentro dos painéis, clique em "Enviar p/ Workspaces" para exportar as ordens selecionadas diretamente para a coluna do Workspace Produção (Corte ou Pintura).
            </li>
            <li class="list-group-item bg-transparent px-0 border-custom py-3">
              <strong class="text-white d-block mb-1"><i class="fa-solid fa-download text-muted me-2"></i> 4. Exportar Planilhas</strong>
              Dentro dos modais de produção, o botão "Baixar Todas" faz o download do que está visível naquele exato momento.
            </li>
            <li class="list-group-item bg-transparent px-0 border-custom py-3">
              <strong class="text-white d-block mb-1"><i class="fa-solid fa-clock-rotate-left text-secondary me-2"></i> 5. Histórico de Importações</strong>
              No final da página, todas as gerações passadas (Lotes) ficam salvas. Clicar em qualquer linha baixa o relatório com os dados exatos daquele momento.
            </li>
            <li class="list-group-item bg-transparent px-0 border-custom pt-3 border-bottom-0">
              <strong class="text-white d-block mb-1"><i class="fa-solid fa-trash-can text-danger me-2"></i> 6. Limpar Tudo</strong>
              Remove as ordens atuais do ecrã e transfere-as para o painel de Histórico, deixando o sistema em branco para o próximo turno/semana.
            </li>
          </ul>

          <div class="alert bg-custom-darker border-custom text-muted shadow-sm mb-0">
            <i class="fa-solid fa-lightbulb text-warning me-2"></i> <strong>Dica de Pesquisa:</strong> Utilize as barras de pesquisa dentro dos modais para filtrar instantaneamente por Cliente, Vendedor, Modelo ou Status (digite "concluído").
          </div>
        </div>
        <div class="modal-footer border-0 bg-custom-darker">
          <button type="button" class="btn btn-sm btn-primary px-4 fw-bold shadow-sm" data-bs-dismiss="modal">Entendi</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalRotativa" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
      <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
        <div class="modal-header bg-custom-darker border-custom shadow-sm" style="z-index: 10;">
          <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-gear text-primary me-2"></i> Produção Rotativa / Plana</h6>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-3 p-md-4 bg-custom-dark">
          
          <div class="d-flex flex-column flex-sm-row gap-2 mb-4">
            <div class="input-group input-group-sm flex-fill shadow-sm">
              <span class="input-group-text border-custom border-end-0 bg-custom-darker"><i class="fa-solid fa-search text-muted"></i></span>
              <input type="text" class="form-control border-custom border-start-0 border-end-0 bg-custom-darker text-white" placeholder="Buscar por cliente, vendedor, modelo..." oninput="filtrarCards(this, 'rotativa')" id="buscaRotativa">
              <button class="btn btn-outline-secondary border-custom bg-custom-darker text-danger" type="button" onclick="limparBusca('rotativa')" title="Limpar busca"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <button class="btn btn-sm btn-info fw-bold text-nowrap shadow-sm text-white d-flex align-items-center" onclick="prepararEnvioKanban('modalRotativa')" title="Enviar para a coluna Corte no Kanban">
              <i class="fa-solid fa-share-nodes me-1"></i> Enviar p/ Kanban
            </button>
            
            <a href="/exportar/rotativa" target="_blank" class="btn btn-sm btn-success fw-bold text-nowrap shadow-sm text-dark d-flex align-items-center"><i class="fa-solid fa-file-excel me-1"></i> Baixar Todas</a>
          </div>

          <div style="padding-right: 5px;">
            ${rotativa.length === 0 ? '<div class="text-center py-5 text-muted small"><i class="fa-solid fa-inbox fa-2x d-block mb-3 opacity-25"></i><span style="font-size:0.8rem;">Nenhuma ordem carregada</span></div>' : rotativa.map(r => `
              <div class="card erp-card shadow-sm mb-2 ${r.status_producao === 'concluido' ? 'card-concluido' : 'card-pendente'}" 
                   data-id="${r.id}"
                   onclick="alterarStatus('rotativa', ${r.id}, this)"
                   data-search="${r.cliente} ${r.vendedor} ${r.modelo} ${r.tamanho} ${r.status_producao === 'concluido' ? 'concluído' : 'pendente'}">
                <div class="card-body p-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <strong class="d-block text-white" style="font-size: 0.85rem;">${r.cliente}</strong>
                      <div class="info-sm text-muted mt-1">
                        Mod: <span class="text-light">${r.modelo}</span> | Tam: <span class="text-light">${r.tamanho}</span> | <b>Qtd: <span class="text-white">${r.quantidade}</span></b>
                      </div>
                    </div>
                    <div class="d-flex flex-column align-items-end">
                      ${badgeStatus(r.status_producao)}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalFlexo" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
      <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
        <div class="modal-header bg-custom-darker border-custom shadow-sm" style="z-index: 10;">
          <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-layer-group text-accent me-2"></i> Produção Flexográfica</h6>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-3 p-md-4 bg-custom-dark">
          
          <div class="d-flex flex-column flex-sm-row gap-2 mb-4">
            <div class="input-group input-group-sm flex-fill shadow-sm">
              <span class="input-group-text border-custom border-end-0 bg-custom-darker"><i class="fa-solid fa-search text-muted"></i></span>
              <input type="text" class="form-control border-custom border-start-0 border-end-0 bg-custom-darker text-white" placeholder="Buscar por cliente, modelo, cor..." oninput="filtrarCards(this, 'flexo')" id="buscaFlexo">
              <button class="btn btn-outline-secondary border-custom bg-custom-darker text-danger" type="button" onclick="limparBusca('flexo')" title="Limpar busca"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <button class="btn btn-sm btn-info fw-bold text-nowrap shadow-sm text-white d-flex align-items-center" onclick="prepararEnvioKanban('modalFlexo')" title="Enviar para a coluna Pintura no Kanban">
              <i class="fa-solid fa-share-nodes me-1"></i> Enviar p/ Kanban
            </button>
            
            <a href="/exportar/flexografica" target="_blank" class="btn btn-sm btn-success fw-bold text-nowrap shadow-sm text-dark d-flex align-items-center"><i class="fa-solid fa-file-excel me-1"></i> Baixar Todas</a>
          </div>

          <div style="padding-right: 5px;">
            ${flexo.length === 0 ? '<div class="text-center py-5 text-muted small"><i class="fa-solid fa-inbox fa-2x d-block mb-3 opacity-25"></i><span style="font-size:0.8rem;">Nenhuma ordem carregada</span></div>' : flexo.map(f => `
              <div class="card erp-card shadow-sm mb-2 ${f.status_producao === 'concluido' ? 'card-concluido' : 'card-pendente'}" 
                   data-id="${f.id}"
                   onclick="alterarStatus('flexografica', ${f.id}, this)"
                   data-search="${f.cliente} ${f.vendedor} ${f.modelo} ${f.tamanho} ${f.material} ${f.cor_personalizacao} ${f.status_producao === 'concluido' ? 'concluído' : 'pendente'}">
                <div class="card-body p-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <strong class="d-block text-white" style="font-size: 0.85rem;">${f.cliente}</strong>
                      <div class="info-sm text-muted mt-1">
                        Mat: <span class="text-light">${f.material}</span> | Cor: <span class="text-light">${formatarCor(f.cor_personalizacao)}</span> | <b>Qtd: <span class="text-white">${f.quantidade}</span></b>
                      </div>
                    </div>
                    <div class="d-flex flex-column align-items-end">
                      ${badgeStatus(f.status_producao)}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalLimpar" tabindex="-1">
    <div class="modal-dialog modal-sm modal-dialog-centered">
      <div class="modal-content erp-modal border-0 shadow-lg">
        <div class="modal-body text-center p-4 bg-custom-darker">
          <i class="fa-solid fa-trash-can fa-3x text-danger mb-3"></i>
          <h6 class="fw-bold text-white mb-2" style="font-size: 0.9rem;">Limpar tudo?</h6>
          <p class="text-muted mb-4" style="font-size: 0.75rem;">Esta ação arquivará as ordens atuais e limpará o painel. Continuar?</p>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Não</button>
            <form action="/limpar" method="POST" class="w-100 m-0"><button type="submit" class="btn btn-sm btn-danger w-100 fw-bold">Sim, Limpar</button></form>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalProcessamento" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content erp-modal border-0 shadow-lg">
        <div class="modal-body p-4 text-center bg-custom-darker">
          <i class="fa-solid fa-gear fa-spin fa-3x text-accent mb-3"></i>
          <h6 class="fw-bold text-white mb-2" style="font-size: 0.9rem;">Processando Planilha</h6>
          <p id="textoEtapa" class="text-muted mb-4" style="font-size: 0.75rem;">Iniciando leitura dos dados...</p>
          <div class="progress shadow-sm" style="height: 10px;">
            <div id="barraProgresso" class="progress-bar progress-bar-striped progress-bar-animated text-dark" style="width: 0%; font-size: 0.6rem;"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL DE SUGESTÃO DE DOWNLOAD / KANBAN APÓS GERAÇÃO -->
  <div class="modal fade" id="modalSugestaoDownload" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
        <div class="modal-header bg-custom-darker border-custom shadow-sm">
          <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-circle-check text-success me-2"></i> Importação Concluída</h6>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body p-4 bg-custom-dark">
          <div class="d-flex align-items-center mb-4">
             <div class="d-flex align-items-center justify-content-center bg-custom-darker rounded-circle shadow-sm border border-custom me-3" style="width: 60px; height: 60px;">
                 <i class="fa-solid fa-file-excel fa-2x text-accent"></i>
             </div>
             <div>
                 <h6 class="fw-bold text-white mb-1" style="font-size: 0.95rem;">Ordens Geradas com Sucesso</h6>
                 <p class="text-muted mb-0" style="font-size:0.8rem;">A planilha foi processada e as ordens separadas. O que deseja fazer a seguir?</p>
             </div>
          </div>

          <div class="row g-4">
             <!-- Coluna de Exportação -->
             <div class="col-md-6">
                 <div class="p-3 bg-custom-darker border border-custom rounded h-100">
                     <h6 class="text-muted fw-bold mb-3" style="font-size: 0.75rem;"><i class="fa-solid fa-download me-1"></i> EXPORTAR PLANILHAS</h6>
                     <div class="d-flex flex-column gap-2">
                         <a href="/exportar/rotativa" target="_blank" class="btn btn-sm btn-primary fw-bold shadow-sm text-dark text-start" onclick="bootstrap.Modal.getInstance(document.getElementById('modalSugestaoDownload')).hide();">
                             <i class="fa-solid fa-gear me-2"></i> Baixar Rotativa / Plana
                         </a>
                         <a href="/exportar/flexografica" target="_blank" class="btn btn-sm btn-success fw-bold shadow-sm text-dark text-start" onclick="bootstrap.Modal.getInstance(document.getElementById('modalSugestaoDownload')).hide();">
                             <i class="fa-solid fa-layer-group me-2"></i> Baixar Flexográfica
                         </a>
                     </div>
                 </div>
             </div>

             <!-- Coluna de Kanban -->
             <div class="col-md-6">
                 <div class="p-3 bg-custom-darker border border-custom rounded h-100">
                     <h6 class="text-muted fw-bold mb-3" style="font-size: 0.75rem;"><i class="fa-solid fa-share-nodes me-1"></i> INTEGRAÇÃO WORKSPACE</h6>
                     <div class="d-flex flex-column gap-2">
                         <button type="button" class="btn btn-sm btn-outline-info fw-bold shadow-sm text-white text-start" onclick="bootstrap.Modal.getInstance(document.getElementById('modalSugestaoDownload')).hide(); prepararEnvioKanban('modalRotativa');">
                             <i class="fa-solid fa-table-columns me-2"></i> Gerar Cards Rotativa (Corte)
                         </button>
                         <button type="button" class="btn btn-sm btn-outline-info fw-bold shadow-sm text-white text-start" onclick="bootstrap.Modal.getInstance(document.getElementById('modalSugestaoDownload')).hide(); prepararEnvioKanban('modalFlexo');">
                             <i class="fa-solid fa-table-columns me-2"></i> Gerar Cards Flexo (Pintura)
                         </button>
                     </div>
                 </div>
             </div>
          </div>
        </div>
        <div class="modal-footer border-0 bg-custom-darker">
          <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-white fw-bold px-4" data-bs-dismiss="modal">
               Fechar
           </button>
        </div>
      </div>
    </div>
  </div>

  <!-- NOVO MODAL DE CONFIRMAÇÃO KANBAN -->
  <div class="modal fade" id="modalConfirmarKanban" tabindex="-1">
    <div class="modal-dialog modal-sm modal-dialog-centered">
      <div class="modal-content erp-modal border-0 shadow-lg">
        <div class="modal-body text-center p-4 bg-custom-darker">
          <i class="fa-solid fa-share-nodes fa-3x text-info mb-3"></i>
          <h6 class="fw-bold text-white mb-2" style="font-size: 0.9rem;">Integrar com Kanban?</h6>
          <p id="textoConfirmacaoKanban" class="text-muted mb-4" style="font-size: 0.75rem;">Deseja processar e enviar as ordens?</p>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary w-50 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-sm btn-info w-50 fw-bold text-white" onclick="executarEnvioKanban()">Sim, Enviar</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    // =======================================================================
    // INTEGRAÇÃO KANBAN (ENVIO EM MASSA INTELIGENTE C/ MODAL)
    // =======================================================================
    let kanbanEnvioState = { ids: [], tipo: '', modalOrigem: '' };

    function prepararEnvioKanban(modalId) {
        const modal = document.getElementById(modalId);
        if(!modal) return;
        
        const cards = modal.querySelectorAll('.card');
        const idsVisiveis = [];

        // Identifica de onde estamos enviando (Flexo -> Pintura | Rotativa -> Corte)
        const tipoSetor = modalId === 'modalRotativa' ? 'rotativa' : 'flexo';
        const nomeColuna = tipoSetor === 'rotativa' ? 'Corte' : 'Pintura';

        // Pega apenas os IDs dos cartões que NÃO estão escondidos pela busca
        cards.forEach(card => {
            if (card.style.display !== 'none' && card.dataset.id) {
                idsVisiveis.push(parseInt(card.dataset.id));
            }
        });

        if (idsVisiveis.length === 0) {
            return mostrarToast('erro', 'Aviso', 'Nenhuma ordem visível para enviar.');
        }

        // Salva o estado para executar no modal de confirmação
        kanbanEnvioState = { ids: idsVisiveis, tipo: tipoSetor, modalOrigem: modalId };
        
        // Define a mensagem do modal dinamicamente
        document.getElementById('textoConfirmacaoKanban').innerHTML = 
            \`Deseja integrar as <b>\${idsVisiveis.length}</b> ordem(ns) atual(is) para o Kanban na coluna <b>\${nomeColuna}</b>?\`;

        // Mostra o modal customizado em vez do confirm() do Windows
        const confirmModal = new bootstrap.Modal(document.getElementById('modalConfirmarKanban'));
        confirmModal.show();
    }

    async function executarEnvioKanban() {
        // Esconde o modal de confirmação
        const confirmModalEl = document.getElementById('modalConfirmarKanban');
        const confirmModal = bootstrap.Modal.getInstance(confirmModalEl);
        if(confirmModal) confirmModal.hide();

        const { ids, tipo } = kanbanEnvioState;
        if (!ids || ids.length === 0) return;

        mostrarToast('sucesso', 'Aguarde', 'Agrupando e enviando para o Kanban...');

        try {
            const response = await fetch("/producao/integrar-kanban", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    ordens_ids: ids,
                    tipo: tipo
                }) 
            });

            const data = await response.json();

            if (data.success) {
                mostrarToast('sucesso', 'Sucesso!', data.message);
                setTimeout(() => window.location.reload(), 1500);
            } else {
                mostrarToast('erro', 'Erro', data.message);
            }
        } catch (error) {
            console.error(error);
            mostrarToast('erro', 'Falha', 'Verifique sua conexão e tente novamente.');
        }
    }

    // =======================================================================
    // SKELETON LOADING E FUNÇÕES AUXILIARES DA VIEW
    // =======================================================================
    function gerarSkeletonTabela(quantidade = 3) {
        let html = '';
        for(let i=0; i<quantidade; i++) {
            html += \`
            <tr class="align-middle">
                <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 60%; margin: 0;"></div></td>
                <td class="text-center py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 50%; margin: 0 auto;"></div></td>
                <td class="text-end py-2 px-3 d-flex justify-content-end gap-1"><div class="skeleton-dark skeleton-btn-view" style="width: 80px;"></div></td>
            </tr>\`;
        }
        return html;
    }

    function mostrarSkeletonGlobais() {
        const tableContainer = document.querySelector('.content > .bg-custom-darker .table-responsive');
        if (document.getElementById('skeleton-temp-container')) return;

        const skeletonHTML = \`
        <div id="skeleton-temp-container" class="table-responsive bg-custom-darker border-custom rounded shadow-sm skeleton-container">
            <table class="table table-sm align-middle mb-0" style="font-size: 0.8rem;">
               <thead class="table-light">
                 <tr>
                   <th class="py-2 px-3">Data de Geração das Ordens</th>
                   <th class="py-2 px-3 text-center">Ordens Geradas Neste Dia</th>
                   <th class="py-2 px-3 text-end">Ação</th>
                 </tr>
               </thead>
               <tbody class="border-top-0">
                  \${gerarSkeletonTabela(3)}
               </tbody>
            </table>
        </div>\`;

        if (tableContainer && !tableContainer.classList.contains('skeleton-container')) {
            tableContainer.style.display = 'none';
            tableContainer.insertAdjacentHTML('beforebegin', skeletonHTML);
        }
    }

    function ocultarSkeletonGlobais() {
        const tempSkeleton = document.getElementById('skeleton-temp-container');
        if (tempSkeleton) tempSkeleton.remove();
        const tableContainer = document.querySelector('.content > .bg-custom-darker .table-responsive:not(.skeleton-container)');
        if (tableContainer) tableContainer.style.display = '';
    }

    mostrarSkeletonGlobais();
    if (document.readyState === 'complete') {
        setTimeout(ocultarSkeletonGlobais, 100);
    } else {
        window.addEventListener('load', ocultarSkeletonGlobais);
    }

    window.addEventListener('beforeunload', () => mostrarSkeletonGlobais());

    function mostrarToast(tipo, titulo, mensagem) {
        const toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
        if (toastEl) {
            document.getElementById(tipo === 'sucesso' ? 'sucessoTitulo' : 'erroTitulo').innerText = titulo;
            document.getElementById(tipo === 'sucesso' ? 'sucessoSub' : 'erroSub').innerText = mensagem;
            
            toastEl.setAttribute('data-bs-autohide', 'true');
            toastEl.setAttribute('data-bs-delay', '5000');
            
            const timerEl = document.getElementById(tipo === 'sucesso' ? 'sucessoTimer' : 'erroTimer');
            if (timerEl) {
                timerEl.style.display = 'block';
                timerEl.style.animation = 'none';
                timerEl.offsetHeight; 
                timerEl.style.animation = 'shrinkToast 5s linear forwards';
            }

            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }
    }

    window.addEventListener('load', () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('sucesso')) {
            mostrarToast('sucesso', 'Importação Concluída', 'As ordens foram geradas com sucesso.');
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalSugestaoDownload')).show();
        } else if (urlParams.has('limpo')) {
            mostrarToast('sucesso', 'Painel Limpo', 'Todos os dados foram removidos.');
        } else if (urlParams.has('erro')) {
            mostrarToast('erro', 'Erro na Planilha', 'O arquivo enviado é incompatível ou está corrompido.');
        }
        
        if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('sucesso');
            url.searchParams.delete('limpo');
            url.searchParams.delete('erro');
            window.history.replaceState({}, document.title, url.toString());
        }
    });

    const formImportar = document.getElementById('formImportacao');
    if (formImportar) {
        formImportar.addEventListener('submit', () => {
            new bootstrap.Modal(document.getElementById('modalProcessamento')).show();
            const barra = document.getElementById('barraProgresso');
            const texto = document.getElementById('textoEtapa');
            barra.style.width = '0%';
            barra.innerText = '0%';

            const etapas = [
                { v: 30, t: "Limpando registros antigos..." },
                { v: 60, t: "Executando script de processamento Python..." },
                { v: 90, t: "Separando flexo e rotativa/plana..." },
                { v: 98, t: "Finalizando importação..." }
            ];

            let i = 0;
            const interval = setInterval(() => {
                if (i >= etapas.length) { clearInterval(interval); return; }
                barra.style.width = etapas[i].v + "%";
                barra.innerText = etapas[i].v + "%";
                texto.innerText = etapas[i].t;
                i++;
            }, 1200);
        });
    }

    function alterarStatus(tipo, id, card) {
      fetch(\`/status/\${tipo}/\${id}\`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (!data.success) return;
          const badge = card.querySelector('.badge');
          if (data.status === 'concluido') {
            badge.className = 'badge bg-success bg-opacity-10 text-success border border-success border-opacity-50';
            badge.innerText = 'Concluído';
            card.classList.add('card-concluido');
            card.classList.remove('card-pendente');
          } else {
            badge.className = 'badge bg-custom-darker border-custom text-muted';
            badge.innerText = 'Pendente';
            card.classList.remove('card-concluido');
            card.classList.add('card-pendente');
          }
          
          let search = card.dataset.search || '';
          search = search.replace(/pendente|concluido|concluído/gi, '').trim();
          const novoStatus = data.status === 'concluido' ? 'concluído' : 'pendente';
          card.dataset.search = \`\${search} \${novoStatus}\`;
        });
    }

    function marcarVisualizado(tipo, botao) {
      const badge = botao.querySelector('.bg-danger');
      if (!badge) return; 
      fetch(\`/notificacao/\${tipo}\`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
              badge.classList.remove('bg-danger');
              badge.classList.add(tipo === 'rotativa' ? 'bg-primary' : 'bg-success');
          }
        });
    }

    function normalizarTexto(texto) {
      return texto.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    }

    function filtrarCards(input, tipo) {
      const termo = normalizarTexto(input.value);
      const modalId = tipo === 'rotativa' ? 'modalRotativa' : 'modalFlexo';
      const modal = document.getElementById(modalId);
      const cards = modal.querySelectorAll('.card');

      cards.forEach(card => {
        const texto = normalizarTexto(card.dataset.search || '');
        card.style.display = texto.includes(termo) ? '' : 'none';
      });
    }

    function limparBusca(tipo) {
      const inputId = tipo === 'rotativa' ? 'buscaRotativa' : 'buscaFlexo';
      const input = document.getElementById(inputId);
      input.value = '';
      filtrarCards(input, tipo);
    }
  </script>
</body>
</html>
`;
};