// views/propostasView.js
const menuLateral = require("./menuLateral");

module.exports = function propostasView(usuario) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const menuHTML = menuLateral(user, "/propostas"); 

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Propostas | Ecoflow</title>
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
    .border-custom { border-color: rgba(255,255,255,0.08) !important; border-width: 1px; }
    .text-accent { color: #08c068 !important; }

    /* Modificadores Bootstrap */
    .text-dark { color: #ffffff !important; }
    .text-muted { color: rgba(255,255,255,0.5) !important; }
    
    /* Botões */
    .btn-primary, .btn-brand { background-color: #08c068; border-color: #08c068; color: #1f1f1f; }
    .btn-primary:hover, .btn-brand:hover, .btn-primary:active, .btn-brand:active { background-color: #06a055 !important; border-color: #06a055 !important; color: #ffffff !important; }
    .btn-outline-primary, .btn-outline-success { color: #08c068; border-color: #08c068; }
    .btn-outline-primary:hover, .btn-outline-success:hover { background-color: #08c068; color: #1f1f1f; border-color: #08c068; }
    
    .btn-outline-secondary { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }
    .btn-outline-secondary:hover { background-color: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.3); }

    /* Inputs e Selects */
    .form-control, .form-select, .input-group-text { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.8rem; }
    .form-control:focus, .form-select:focus { background-color: #2a2a2a; border-color: #08c068; color: #fff; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }
    .input-group-text { background-color: #2a2a2a; color: rgba(255,255,255,0.6); }

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
    .table-hover-row { transition: background-color 0.2s ease; }
    .table-hover-row:hover > td, 
    .table-hover > tbody > tr:hover > td, 
    .table-hover > tbody > tr:hover > * { 
        background-color: rgba(255,255,255,0.06) !important; 
        color: #fff !important; 
        box-shadow: inset 0 0 0 9999px rgba(255, 255, 255, 0.03);
    }
    
    /* Efeito de Tabela Específico para Propostas (<= 2 dias) */
    .table-success-custom > td { background-color: rgba(8, 192, 104, 0.08) !important; border-color: rgba(8, 192, 104, 0.2) !important; }
    .table-success-custom:hover > td { background-color: rgba(8, 192, 104, 0.15) !important; }

    .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
    .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }

    /* Pagination */
    .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
    .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; }
    .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
    .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.05); }

    /* Modais Animados */
    @keyframes pulseIcon {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); opacity: 0.8; }
      100% { transform: scale(1); }
    }
    .anim-pulse { animation: pulseIcon 1.5s infinite ease-in-out; }

    /* ANIMAÇÃO DE ENTRADA E SAÍDA DO TOAST E MODAIS */
    .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
    .toast.showing, .toast.show { transform: translateX(0); }
    .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
    @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }
    
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
    @keyframes skeleton-loading-view {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    @media (max-width: 767.98px) {
      body { flex-direction: column; } .sidebar { display: none; } .content { padding: 16px; }
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
      <hr class="border-custom mt-4">
      <a href="/logout" class="text-danger mt-2" style="font-size: 0.85rem;"><i class="fas fa-sign-out-alt me-2"></i>Sair do Sistema</a>
    </div>
  </div>

  <div class="content">
    
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div class="d-flex align-items-center gap-3">
          <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
          <div>
            <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-file-signature text-muted me-2"></i>Gestão de Propostas</h5>
            <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Acompanhamento de Design e Clichês</span>
          </div>
      </div>
    </div>

    <div class="bg-custom-darker p-3 rounded-3 shadow-sm border border-custom mb-4">
      
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom border-custom">
        <h6 class="mb-0 text-white fw-bold" style="font-size:0.85rem;"><i class="fa-solid fa-filter text-accent me-1"></i> Filtros e Ações</h6>
        <div class="d-flex gap-2 mt-2 mt-sm-0">
          <button class="btn btn-sm btn-outline-success shadow-sm fw-bold" onclick="abrirModalRelatorio()"><i class="fa-solid fa-file-excel me-1"></i> Relatório</button>
          <button class="btn btn-sm btn-brand shadow-sm fw-bold text-dark" onclick="abrirModalProposta()"><i class="fa-solid fa-plus me-1"></i> Nova Proposta</button>
        </div>
      </div>

      <form class="row g-2 align-items-end" onsubmit="event.preventDefault(); buscarPropostas(1, 'Filtros aplicados com sucesso!');">
        <div class="col-12 col-md-4">
          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Buscar Cliente</label>
          <div class="input-group input-group-sm shadow-sm">
            <span class="input-group-text border-custom border-end-0"><i class="fa-solid fa-search text-muted"></i></span>
            <input type="text" id="filtroCliente" class="form-control border-start-0" placeholder="Nome do cliente...">
          </div>
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Período De</label>
          <input type="date" id="filtroInicio" class="form-control form-control-sm shadow-sm">
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Até</label>
          <input type="date" id="filtroFim" class="form-control form-control-sm shadow-sm">
        </div>
        <div class="col-12 col-md-2 d-flex gap-2">
          <button type="submit" class="btn btn-sm btn-brand flex-grow-1 shadow-sm fw-bold text-dark">Filtrar</button>
          <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger shadow-sm" onclick="limparFiltros()"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </form>
    </div>

    <div id="listaPropostas" class="table-responsive bg-custom-darker rounded-3 shadow-sm border border-custom mb-4" style="display: none;"></div>

    <nav aria-label="Paginação">
      <ul id="paginacaoPropostas" class="pagination pagination-sm justify-content-center"></ul>
    </nav>

  </div>

  <div class="modal fade" id="modalRelatorio" tabindex="-1">
    <div class="modal-dialog modal-sm modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg erp-modal">
        <div class="modal-header bg-custom-darker border-custom">
          <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-file-excel text-success me-2"></i> Exportar Relatório</h6>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4 bg-custom-dark">
          <div class="mb-3">
            <label class="form-label text-muted fw-bold small mb-1">Ano Base</label>
            <select id="relatorioAno" class="form-select form-select-sm shadow-sm"></select>
          </div>
          <div class="mb-4">
            <label class="form-label text-muted fw-bold small mb-1">Mês Base</label>
            <select id="relatorioMes" class="form-select form-select-sm shadow-sm"></select>
          </div>
          <button type="button" onclick="baixarRelatorioExcel()" class="btn btn-sm btn-success w-100 fw-bold text-dark shadow-sm"><i class="fa-solid fa-download me-1"></i> Baixar Planilha</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalProposta" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content border-0 shadow-lg erp-modal">
        <div class="modal-header bg-custom-darker border-custom">
          <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-file-signature text-accent me-2"></i> Formulário de Proposta</h6>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        
        <div class="modal-body p-4 bg-custom-dark">
          <input type="hidden" id="propostaId">

          <div class="p-3 bg-custom-darker rounded-3 border border-custom shadow-sm mb-4">
            <h6 class="fw-bold text-muted mb-3" style="font-size: 0.75rem;">IDENTIFICAÇÃO</h6>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Cliente *</label>
                <input type="text" id="cliente" class="form-control form-control-sm shadow-sm" required>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Designer Responsável</label>
                <select id="designer" class="form-select form-select-sm shadow-sm">
                  <option value="">Selecione...</option>
                  <option value="David">David</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
          </div>

          <div class="p-3 bg-custom-darker rounded-3 border border-custom shadow-sm mb-4">
            <h6 class="fw-bold text-muted mb-3" style="font-size: 0.75rem;">CRONOGRAMA DE ARTE</h6>
            <div class="row g-3 align-items-end">
              <div class="col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Data Início</label>
                <input type="date" id="dataInicio" class="form-control form-control-sm shadow-sm calc-trigger">
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Data Fim</label>
                <input type="date" id="dataFim" class="form-control form-control-sm shadow-sm calc-trigger">
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Duração da Arte</label>
                <div id="duracaoBadge" class="form-control form-control-sm bg-custom-dark text-white border-custom text-center fw-bold py-1 shadow-sm">—</div>
              </div>
            </div>
          </div>

          <div class="p-3 bg-custom-darker rounded-3 border border-custom shadow-sm mb-4">
            <h6 class="fw-bold text-muted mb-3" style="font-size: 0.75rem;">LOGÍSTICA DE CLICHÊ</h6>
            <div class="row g-3 align-items-end">
              <div class="col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Data Solicitação</label>
                <input type="date" id="dataSolicitacaoCliche" class="form-control form-control-sm shadow-sm calc-trigger">
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Data Chegada</label>
                <input type="date" id="dataChegadaCliche" class="form-control form-control-sm shadow-sm calc-trigger">
              </div>
              <div class="col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Tempo de Trânsito</label>
                <div id="prazoClicheBadge" class="form-control form-control-sm bg-custom-dark text-white border-custom text-center fw-bold py-1 shadow-sm">—</div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">OBSERVAÇÕES GERAIS</label>
            <textarea id="observacao" rows="2" class="form-control form-control-sm shadow-sm"></textarea>
          </div>

          <div class="mb-2">
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom border-custom pb-2">
              <h6 class="fw-bold text-white mb-0" style="font-size: 0.8rem;"><i class="fa-solid fa-clock-rotate-left text-muted me-1"></i> Histórico de Modificações</h6>
              <button type="button" class="btn btn-sm btn-outline-primary shadow-sm py-0 fw-bold text-nowrap" style="font-size: 0.75rem;" onclick="addNovaModificacao()"><i class="fa-solid fa-plus me-1"></i> Adicionar</button>
            </div>
            <div id="listaModificacoes" class="d-flex flex-column gap-2 mt-3"></div>
          </div>

        </div>

        <div class="modal-footer bg-custom-darker border-custom d-flex justify-content-between">
          <button type="button" id="btnExcluirProposta" class="btn btn-sm btn-outline-danger shadow-sm d-none" onclick="confirmarExclusao()"><i class="fa-solid fa-trash me-1"></i> Excluir</button>
          <div class="d-flex gap-2 ms-auto">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white shadow-sm" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-sm btn-brand fw-bold px-4 shadow-sm text-dark" onclick="salvarProposta()">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="excluirModal" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-sm modal-dialog-centered">
      <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
        <div class="modal-body text-center p-4">
          <i class="fa-solid fa-circle-exclamation fa-3x text-danger mb-3 anim-pulse"></i>
          <h6 class="fw-bold text-white">Excluir proposta?</h6>
          <p class="text-muted mb-0" style="font-size:0.8rem;">Esta ação é irreversível e removerá todo o histórico de alterações.</p>
        </div>
        <div class="modal-footer bg-custom-darker border-0 d-flex flex-nowrap">
          <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" onclick="voltarParaProposta()">Não</button>
          <button type="button" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm" onclick="executarExclusao()">Sim, Excluir</button>
        </div>
      </div>
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
          <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 4px; background: #08c068;"></div>
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

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

  <script>
    let periodosCache = [];

    async function fetchSeguro(url, options = {}) {
        const res = await fetch(url, options);
        if (res.status === 401) {
            window.location.href = '/login';
            return null; 
        }
        return res;
    }

    // =======================================================================
    // FUNÇÃO GENÉRICA DE TOASTS
    // =======================================================================
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

            const toast = new bootstrap.Toast(toastEl, {
                autohide: true,
                delay: 5000
            });
            
            toast.show();
        }
    }

    // =======================================================================
    // SKELETON LOADING (MODO ESCURO)
    // =======================================================================
    function gerarSkeletonTabela(quantidade = 5) {
        let html = '';
        for(let i=0; i<quantidade; i++) {
            html += \`
            <tr class="align-middle">
                <td class="py-3 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 80%; margin: 0;"></div></td>
                <td class="py-3 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 60%; margin: 0;"></div></td>
                <td class="py-3 px-3 text-center"><div class="skeleton-dark skeleton-text-view" style="width: 30px; margin: 0 auto;"></div></td>
                <td class="py-3 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 70%; margin: 0;"></div></td>
                <td class="py-3 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 70%; margin: 0;"></div></td>
            </tr>\`;
        }
        return html;
    }

    function mostrarSkeletonGlobais() {
        const listContainer = document.getElementById('listaPropostas');
        
        if (document.getElementById('skeleton-temp-container')) return;

        const skeletonHTML = \`
        <div id="skeleton-temp-container" class="table-responsive bg-custom-darker border-custom rounded-3 shadow-sm mb-4 skeleton-container">
            <table class="table table-sm align-middle mb-0" style="border-collapse: separate; border-spacing: 0;">
                <thead>
                    <tr>
                        <th class="px-3 py-2 text-muted border-0" style="font-size:0.75rem;">Cliente</th>
                        <th class="px-3 py-2 text-muted border-0" style="font-size:0.75rem;">Designer</th>
                        <th class="px-3 py-2 text-muted border-0 text-center" style="font-size:0.75rem;">Alterações</th>
                        <th class="px-3 py-2 text-muted border-0" style="font-size:0.75rem;">Tempo de Arte</th>
                        <th class="px-3 py-2 text-muted border-0" style="font-size:0.75rem;">Prazo Clichê</th>
                    </tr>
                </thead>
                <tbody class="border-top-0">
                    \${gerarSkeletonTabela(5)}
                </tbody>
            </table>
        </div>\`;

        if (listContainer) {
            listContainer.style.display = 'none';
            listContainer.insertAdjacentHTML('beforebegin', skeletonHTML);
        }
    }

    function ocultarSkeletonGlobais() {
        const tempSkeleton = document.getElementById('skeleton-temp-container');
        if (tempSkeleton) tempSkeleton.remove();

        const listContainer = document.getElementById('listaPropostas');
        if (listContainer) listContainer.style.display = 'block';
    }

    // ==========================================
    // CÁLCULO DE DATAS E DIAS
    // ==========================================
    function parseDataFixa(dataStr) {
        if (!dataStr) return null;
        const partes = dataStr.split('T')[0].split('-');
        return new Date(partes[0], partes[1] - 1, partes[2]);
    }

    function calcularDiasReal(i, f) {
        if (!i || !f) return null;
        const d1 = parseDataFixa(i);
        const d2 = parseDataFixa(f);
        if (d2 >= d1) {
            const diff = d2.getTime() - d1.getTime();
            return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
        }
        return -1; 
    }

    // Badge mantido com lógica original, adaptado pro Dark Theme
    function gerarBadgeDias(dias) {
        if (dias === null) return '<span class="text-muted" style="font-size:0.75rem;"><i class="fa-regular fa-clock me-1"></i>Pendente</span>';
        if (dias === -1) return '<span class="text-danger" style="font-size:0.75rem;">Erro</span>';
        
        if (dias > 2) {
            return \`<span class="badge bg-danger bg-opacity-10 border border-danger text-danger px-2 py-1 shadow-sm" style="font-size:0.65rem;"><i class="fa-solid fa-triangle-exclamation me-1"></i>\${dias} d</span>\`;
        }
        return \`<span class="badge bg-success bg-opacity-10 border border-success text-success px-2 py-1 shadow-sm" style="font-size:0.65rem;"><i class="fa-solid fa-check-double me-1"></i>\${dias} d</span>\`;
    }

    function calcularDiferencaDias(idInicio, idFim, idBadge) {
        const i = document.getElementById(idInicio).value;
        const f = document.getElementById(idFim).value;
        const badge = document.getElementById(idBadge);
        
        const dias = calcularDiasReal(i, f);
        
        if (dias === null) {
            badge.innerText = "—";
            badge.className = "form-control form-control-sm bg-custom-dark text-white border-custom text-center fw-bold py-1 shadow-sm";
        } else if (dias === -1) {
            badge.innerText = "Erro";
            badge.className = "form-control form-control-sm bg-danger bg-opacity-10 border border-danger text-danger fw-bold text-center py-1 shadow-sm";
        } else {
            badge.innerText = dias + (dias === 1 ? " dia" : " dias");
            if (dias > 2) {
                badge.className = "form-control form-control-sm bg-danger bg-opacity-10 border border-danger text-danger fw-bold text-center py-1 shadow-sm";
            } else {
                badge.className = "form-control form-control-sm bg-success bg-opacity-10 border border-success text-success fw-bold text-center py-1 shadow-sm";
            }
        }
    }

    document.querySelectorAll('.calc-trigger').forEach(input => {
        input.addEventListener('change', () => {
            calcularDiferencaDias('dataInicio', 'dataFim', 'duracaoBadge');
            calcularDiferencaDias('dataSolicitacaoCliche', 'dataChegadaCliche', 'prazoClicheBadge');
        });
    });

    // ==========================================
    // GESTÃO DO HISTÓRICO DE MODIFICAÇÕES
    // ==========================================
    function addNovaModificacao(desc = '', data = '') {
        const container = document.getElementById('listaModificacoes');
        const idUnico = 'mod_' + Date.now();
        const hoje = new Date().toISOString().split('T')[0];
        
        const html = \`
            <div id="\${idUnico}" class="modificacao-item bg-custom-darker border-custom p-1 rounded-2 d-flex gap-2 align-items-center shadow-sm">
                <input type="date" class="form-control form-control-sm w-auto mod-data shadow-none" value="\${data || hoje}" required>
                <input type="text" class="form-control form-control-sm mod-desc shadow-none" placeholder="Descreva a alteração feita..." value="\${desc}" required>
                <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger" onclick="document.getElementById('\${idUnico}').remove()"><i class="fa-solid fa-xmark"></i></button>
            </div>
        \`;
        container.insertAdjacentHTML('beforeend', html);
    }

    function extrairModificacoes() {
        const mods = [];
        document.querySelectorAll('.modificacao-item').forEach(el => {
            const data = el.querySelector('.mod-data').value;
            const desc = el.querySelector('.mod-desc').value;
            if(desc.trim() !== '') {
                mods.push({ data_modificacao: data, descricao: desc });
            }
        });
        return mods;
    }

    // ==========================================
    // CRUD E RENDERIZAÇÃO DA TABELA 
    // ==========================================
    async function buscarPropostas(page = 1, toastMsg = null) {
        mostrarSkeletonGlobais();

        const cliente = document.getElementById('filtroCliente').value;
        const inicio = document.getElementById('filtroInicio').value;
        const fim = document.getElementById('filtroFim').value;

        let url = \`/propostas/lista?page=\${page}\`;
        if (cliente) url += \`&cliente=\${cliente}\`;
        if (inicio && fim) url += \`&data_inicio=\${inicio}&data_fim=\${fim}\`;

        try {
            const res = await fetchSeguro(url);
            if (!res) return;
            const json = await res.json();
            
            renderTable(json.data);
            renderPaginacao(json.pagination);

            if(toastMsg) mostrarToast('sucesso', 'Busca Concluída', toastMsg);
        } catch (error) {
            console.error("Erro ao buscar propostas", error);
            mostrarToast('erro', 'Erro', 'Falha ao buscar as propostas no servidor.');
        } finally {
            ocultarSkeletonGlobais();
        }
    }

    function renderTable(propostas) {
        const container = document.getElementById('listaPropostas');
        
        if (propostas.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-5"><i class="fa-solid fa-inbox fa-3x mb-3 opacity-25"></i><br>Nenhuma proposta encontrada.</div>';
            return;
        }

        const linhas = propostas.map(p => {
            const diasArte = calcularDiasReal(p.data_inicio, p.data_fim);
            const diasCliche = calcularDiasReal(p.data_solicitacao_cliche, p.data_chegada_cliche);
            
            // Define a cor de fundo da linha: > 2 Permanece Transparente | <= 2 Fica Verde Translúcido
            let rowClass = 'table-hover-row';
            if (diasArte > 2 || diasCliche > 2) {
                // Não adiciona classe = permanece normal
            } else if ((diasArte !== null && diasArte <= 2 && diasArte !== -1) || 
                       (diasCliche !== null && diasCliche <= 2 && diasCliche !== -1)) {
                rowClass += ' table-success-custom';
            }

            const qtdAlt = p.total_modificacoes || 0;
            const modBadge = qtdAlt > 0 
                ? \`<span class="badge bg-danger rounded-pill shadow-sm" style="font-size:0.65rem;" title="\${qtdAlt} alterações registradas">\${qtdAlt}</span>\` 
                : \`<span class="text-muted" style="font-size:0.75rem;">-</span>\`;

            return \`
            <tr style="cursor: pointer;" class="align-middle \${rowClass}" onclick="abrirModalProposta(\${p.id})">
                <td class="py-2 px-3">
                    <strong class="text-white d-block text-truncate" style="max-width: 250px; font-size: 0.8rem;">\${p.cliente}</strong>
                </td>
                <td class="py-2 px-3 text-muted" style="font-size: 0.8rem;">
                    <i class="fa-solid fa-user-pen me-1 opacity-75"></i> \${p.designer || '-'}
                </td>
                <td class="py-2 px-3 text-center">
                    \${modBadge}
                </td>
                <td class="py-2 px-3">
                    <span class="text-muted d-block mb-1" style="font-size: 0.65rem;">Produção da Arte:</span>
                    \${gerarBadgeDias(diasArte)}
                </td>
                <td class="py-2 px-3">
                    <span class="text-muted d-block mb-1" style="font-size: 0.65rem;">Logística Clichê:</span>
                    \${gerarBadgeDias(diasCliche)}
                </td>
            </tr>
            \`;
        }).join('');

        container.innerHTML = \`
            <table class="table table-sm align-middle mb-0" style="border-collapse: separate; border-spacing: 0;">
                <thead>
                    <tr>
                        <th class="px-3 py-2 text-muted fw-bold border-0" style="font-size:0.75rem;">Cliente</th>
                        <th class="px-3 py-2 text-muted fw-bold border-0" style="font-size:0.75rem;">Designer</th>
                        <th class="px-3 py-2 text-muted fw-bold border-0 text-center" style="font-size:0.75rem;">Alterações</th>
                        <th class="px-3 py-2 text-muted fw-bold border-0" style="font-size:0.75rem;">Tempo de Arte</th>
                        <th class="px-3 py-2 text-muted fw-bold border-0" style="font-size:0.75rem;">Prazo Clichê</th>
                    </tr>
                </thead>
                <tbody class="border-top-0">
                    \${linhas}
                </tbody>
            </table>
        \`;
    }

    // ==========================================
    // PAGINAÇÃO INTELIGENTE
    // ==========================================
    function renderPaginacao(pag) {
        const container = document.getElementById('paginacaoPropostas');
        if (pag.totalPages <= 1) { container.innerHTML = ''; return; }

        let html = '';
        
        html += \`<li class="page-item \${pag.page <= 1 ? 'disabled' : ''}">
                    <button class="page-link text-white border-0" onclick="buscarPropostas(\${pag.page - 1})">&laquo;</button>
                 </li>\`;
        
        const delta = 2; 
        let paginas = [];
        let ultima;

        for (let i = 1; i <= pag.totalPages; i++) {
            if (i === 1 || i === pag.totalPages || (i >= pag.page - delta && i <= pag.page + delta)) {
                paginas.push(i);
            }
        }

        paginas.forEach(p => {
            if (ultima) {
                if (p - ultima === 2) {
                    html += \`<li class="page-item"><button class="page-link text-white border-0" onclick="buscarPropostas(\${ultima + 1})">\${ultima + 1}</button></li>\`;
                } else if (p - ultima > 2) {
                    html += \`<li class="page-item disabled"><span class="page-link text-muted border-0 bg-transparent">...</span></li>\`;
                }
            }
            html += \`<li class="page-item \${pag.page === p ? 'active' : ''}">
                        <button class="page-link \${pag.page === p ? 'bg-primary border-primary text-dark fw-bold' : 'text-white border-0'}" onclick="buscarPropostas(\${p})">\${p}</button>
                     </li>\`;
            ultima = p;
        });
        
        html += \`<li class="page-item \${pag.page >= pag.totalPages ? 'disabled' : ''}">
                    <button class="page-link text-white border-0" onclick="buscarPropostas(\${pag.page + 1})">&raquo;</button>
                 </li>\`;
                 
        container.innerHTML = html;
    }

    function limparFiltros() {
        document.getElementById('filtroCliente').value = '';
        document.getElementById('filtroInicio').value = '';
        document.getElementById('filtroFim').value = '';
        buscarPropostas(1, 'Os filtros foram removidos!');
    }

    // ==========================================
    // SALVAR / ABRIR / EXCLUIR PROPOSTA
    // ==========================================
    async function abrirModalProposta(id = null) {
        document.getElementById('propostaId').value = '';
        document.getElementById('cliente').value = '';
        document.getElementById('designer').value = '';
        document.getElementById('dataInicio').value = '';
        document.getElementById('dataFim').value = '';
        document.getElementById('dataSolicitacaoCliche').value = '';
        document.getElementById('dataChegadaCliche').value = '';
        document.getElementById('observacao').value = '';
        document.getElementById('listaModificacoes').innerHTML = '';
        document.getElementById('btnExcluirProposta').classList.add('d-none');
        
        calcularDiferencaDias('dataInicio', 'dataFim', 'duracaoBadge');
        calcularDiferencaDias('dataSolicitacaoCliche', 'dataChegadaCliche', 'prazoClicheBadge');

        if (id) {
            try {
                const res = await fetchSeguro(\`/propostas/detalhe/\${id}\`);
                if (!res) return;
                const json = await res.json();
                if(json.success !== false) {
                    const p = json.proposta;
                    document.getElementById('propostaId').value = p.id;
                    document.getElementById('cliente').value = p.cliente;
                    document.getElementById('designer').value = p.designer;
                    if(p.data_inicio) document.getElementById('dataInicio').value = p.data_inicio.split('T')[0];
                    if(p.data_fim) document.getElementById('dataFim').value = p.data_fim.split('T')[0];
                    if(p.data_solicitacao_cliche) document.getElementById('dataSolicitacaoCliche').value = p.data_solicitacao_cliche.split('T')[0];
                    if(p.data_chegada_cliche) document.getElementById('dataChegadaCliche').value = p.data_chegada_cliche.split('T')[0];
                    document.getElementById('observacao').value = p.observacao;
                    document.getElementById('btnExcluirProposta').classList.remove('d-none');

                    json.modificacoes.forEach(m => addNovaModificacao(m.descricao, m.data_modificacao.split('T')[0]));
                    
                    calcularDiferencaDias('dataInicio', 'dataFim', 'duracaoBadge');
                    calcularDiferencaDias('dataSolicitacaoCliche', 'dataChegadaCliche', 'prazoClicheBadge');
                }
            } catch (e) {
                console.error("Erro ao carregar", e);
            }
        }

        new bootstrap.Modal(document.getElementById('modalProposta')).show();
    }

    async function salvarProposta() {
        const id = document.getElementById('propostaId').value;
        const payload = {
            cliente: document.getElementById('cliente').value,
            designer: document.getElementById('designer').value,
            data_inicio: document.getElementById('dataInicio').value,
            data_fim: document.getElementById('dataFim').value,
            data_solicitacao_cliche: document.getElementById('dataSolicitacaoCliche').value,
            data_chegada_cliche: document.getElementById('dataChegadaCliche').value,
            observacao: document.getElementById('observacao').value,
            modificacoes: extrairModificacoes()
        };

        if(!payload.cliente) {
            mostrarToast('erro', 'Atenção', 'O nome do cliente é obrigatório!');
            return;
        }

        const method = id ? 'PUT' : 'POST';
        const url = id ? \`/propostas/\${id}\` : '/propostas';

        try {
            const res = await fetchSeguro(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if(!res) return;
            const json = await res.json();
            
            if(json.success) {
                bootstrap.Modal.getInstance(document.getElementById('modalProposta')).hide();
                mostrarToast('sucesso', 'Concluído!', 'A proposta foi salva com sucesso no sistema.');
                buscarPropostas();
            } else {
                mostrarToast('erro', 'Erro', 'Erro ao guardar proposta no servidor.');
            }
        } catch (e) {
            console.error(e);
            mostrarToast('erro', 'Falha de Conexão', 'Erro de comunicação com o servidor.');
        }
    }

    function confirmarExclusao() {
        bootstrap.Modal.getInstance(document.getElementById('modalProposta')).hide();
        new bootstrap.Modal(document.getElementById('excluirModal')).show();
    }

    function voltarParaProposta() {
        bootstrap.Modal.getInstance(document.getElementById('excluirModal')).hide();
        new bootstrap.Modal(document.getElementById('modalProposta')).show();
    }

    async function executarExclusao() {
        const id = document.getElementById('propostaId').value;
        
        try {
            const res = await fetchSeguro(\`/propostas/\${id}\`, { method: 'DELETE' });
            if(!res) return;
            
            bootstrap.Modal.getInstance(document.getElementById('excluirModal')).hide();
            mostrarToast('sucesso', 'Excluído!', 'A proposta foi removida permanentemente.');
            buscarPropostas();
        } catch(e) {
            console.error(e);
            mostrarToast('erro', 'Falha', 'Não foi possível excluir a proposta.');
        }
    }

    // ==========================================
    // EXPORTAÇÃO EXCEL
    // ==========================================
    async function abrirModalRelatorio() {
        const anoSelect = document.getElementById('relatorioAno');
        const mesSelect = document.getElementById('relatorioMes');
        
        try {
            const res = await fetchSeguro('/admin/api/periodos-disponiveis');
            if(!res) return;
            periodosCache = await res.json();
            
            if (periodosCache.length === 0) {
                anoSelect.innerHTML = '<option value="">Sem dados</option>';
                mesSelect.innerHTML = '<option value="">Sem dados</option>';
            } else {
                const anos = [...new Set(periodosCache.map(p => p.ano))];
                anoSelect.innerHTML = anos.map(a => \`<option value="\${a}">\${a}</option>\`).join('');
                
                anoSelect.onchange = () => {
                    const anoAtual = parseInt(anoSelect.value);
                    const meses = periodosCache.filter(p => p.ano === anoAtual).map(p => p.mes);
                    const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                    mesSelect.innerHTML = meses.map(m => \`<option value="\${m}">\${nomes[m-1]}</option>\`).join('');
                };
                anoSelect.onchange(); 
            }
        } catch(e) { console.error(e); }
        
        new bootstrap.Modal(document.getElementById('modalRelatorio')).show();
    }

    function baixarRelatorioExcel() {
        const mes = document.getElementById('relatorioMes').value;
        const ano = document.getElementById('relatorioAno').value;
        if(mes && ano) {
            window.open(\`/propostas/exportar/excel?mes=\${mes}&ano=\${ano}\`, '_blank');
            bootstrap.Modal.getInstance(document.getElementById('modalRelatorio')).hide();
            mostrarToast('sucesso', 'Download Iniciado!', 'O seu relatório Excel está sendo gerado e baixado.');
        }
    }

    window.addEventListener('load', () => buscarPropostas());
  </script>
</body>
</html>
  `;
}