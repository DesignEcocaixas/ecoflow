// views/enviosView.js
const menuLateral = require("./menuLateral");
const termosComponent = require("./termosComponent");

function enviosView(req, cadernosPendentes = [], logsEnvio = [], whatsappStatus = { isReady: false }, paginacaoCadernos = {}, paginacaoLogs = {}) {
  const usuarioObj = (req && req.session) ? req.session.user : req;
  const termosHTML = termosComponent(usuarioObj);
  const user = usuarioObj || { nome: "Usuário", tipo_usuario: "admin" };

  const pageC = paginacaoCadernos.page || 1;
  const totalPagesC = paginacaoCadernos.totalPages || 1;

  const pageL = paginacaoLogs.page || 1;
  const totalPagesL = paginacaoLogs.totalPages || 1;

  const fmtData = (d) => {
    try {
      if(!d) return "-";
      const dt = new Date(d);
      return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    } catch {
      return d || "-";
    }
  };

  const menuHTML = menuLateral(user, "/envios-whatsapp");

  // Lista de Cadernos com verificação de status vindo direto do Banco de Dados
  const linhasCadernos = cadernosPendentes.map(c => {
    const isEnviado = (c.whatsapp_ativo == 0); 
    const estiloRiscado = isEnviado ? 'text-decoration: line-through;' : '';
    const opacidade = isEnviado ? '0.35' : '1';
    const btnClasse = isEnviado ? 'btn btn-xs btn-success py-0 px-2 btn-marcar-enviado' : 'btn btn-xs btn-outline-secondary border-custom py-0 px-2 btn-marcar-enviado';
    const btnIcone = isEnviado ? '<i class="fa-solid fa-check-double"></i>' : '<i class="fa-solid fa-check"></i>';

    return `
    <tr class="align-middle table-hover-row fila-caderno" id="cadernoRow-${c.id}" style="font-size: 0.72rem; transition: all 0.3s ease; opacity: ${opacidade};">
      <td class="py-1 px-3" style="width: 30px;">
        <input type="checkbox" name="cadernos_selecionados[]" value="${c.id}" class="form-check-input check-caderno border-secondary shadow-sm" ${isEnviado ? 'disabled' : ''}>
      </td>
      <td class="text-muted fw-medium py-1 px-2 c-data" style="${estiloRiscado}"><i class="fa-regular fa-calendar-check me-1"></i> ${fmtData(c.data_criacao)}</td>
      <td class="text-white fw-bold py-1 px-2 c-manifesto" style="${estiloRiscado}">Manifesto #${c.id}</td>
      <td class="text-white py-1 px-2 text-truncate c-motorista" style="max-width: 110px; ${estiloRiscado}"><i class="fa-solid fa-id-card text-muted me-1"></i> ${c.motorista}</td>
      <td class="text-center py-1 px-2 c-badge">
        <span class="badge text-dark bg-verde-tag" style="background-color: #08c068; font-size: 0.62rem; padding: 0.25em 0.5em;">
           ${c.total_entregas || 0} Locais
        </span>
      </td>
      <td class="text-end py-1 px-3" style="width: 50px;">
        <button type="button" class="btn ${btnClasse}" style="font-size: 0.65rem; height: 20px;" onclick="marcarLinhaComoEnviada(${c.id}, this)" title="Marcar caderno como enviado">
          ${btnIcone}
        </button>
      </td>
    </tr>
    `;
  }).join("");

  const linhasLogs = logsEnvio.map(log => {
    const statusBadge = log.sucesso 
      ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-1.5 py-0.5" style="font-size:0.6rem;"><i class="fa-solid fa-check-double me-1"></i> Enviado</span>`
      : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-1.5 py-0.5" style="font-size:0.6rem;"><i class="fa-solid fa-triangle-exclamation me-1"></i> Falhou</span>`;
    
    return `
      <tr class="align-middle" style="font-size: 0.72rem;">
        <td class="text-muted py-1 px-2" style="font-size:0.68rem;">${fmtData(log.data_envio)}</td>
        <td class="text-white fw-medium py-1 px-2 text-truncate" style="max-width: 120px;">${(log.cliente || '').toUpperCase()}</td>
        <td class="text-muted py-1 px-2" style="font-size:0.68rem;">${log.contato || '-'}</td>
        <td class="py-1 px-2 text-end">${statusBadge}</td>
      </tr>
    `;
  }).join("");

  const linksCadernosPages = (() => {
    let html = '';
    for (let i = 1; i <= totalPagesC; i++) {
        html += `<li class="page-item ${i === pageC ? "active" : ""}"><a class="page-link" href="/envios-whatsapp?pageCadernos=${i}&pageLogs=${pageL}" onclick="navegarTabela(event, this.href)">${i}</a></li>`;
    }
    return html;
  })();

  const linksLogsPages = (() => {
    let html = '';
    for (let i = 1; i <= totalPagesL; i++) {
        html += `<li class="page-item ${i === pageL ? "active" : ""}"><a class="page-link" href="/envios-whatsapp?pageCadernos=${pageC}&pageLogs=${i}" onclick="navegarTabela(event, this.href)">${i}</a></li>`;
    }
    return html;
  })();

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Envios WhatsApp | Ecoflow</title>
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
      html, body, .content, .table-responsive, .modal-body { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

      body { display: flex; height: 100vh; margin: 0; background-color: #1f1f1f; color: #ffffff; font-family: 'Segoe UI', sans-serif; }
      .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column; }
      .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; background-color: #1f1f1f; }
      
      .bg-custom-dark { background-color: #2a2a2a !important; }
      .bg-custom-darker { background-color: #222222 !important; }
      .border-custom { border-color: rgba(255,255,255,0.08) !important; border-width: 1px; }
      .text-accent { color: #08c068 !important; }
      .text-dark { color: #ffffff !important; }
      .text-muted { color: rgba(255,255,255,0.5) !important; }
      
      .btn-primary, .btn-success { background-color: #08c068; border-color: #08c068; color: #1f1f1f; }
      .btn-primary:hover, .btn-success:hover { background-color: #06a055 !important; border-color: #06a055 !important; color: #ffffff !important; }
      .btn-outline-primary { color: #08c068; border-color: rgba(8,192,104,0.3); background: transparent; }
      .btn-outline-primary:hover { background-color: #08c068; color: #1f1f1f; border-color: #08c068; }
      .btn-outline-secondary { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }
      .btn-outline-secondary:hover { background-color: rgba(255,255,255,0.1); color: #fff; }

      .table { --bs-table-bg: transparent; --bs-table-color: #fff; --bs-table-hover-bg: rgba(255,255,255,0.04); color: #fff; margin-bottom: 0; }
      .table thead Th { background-color: #222 !important; color: rgba(255,255,255,0.6) !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; font-weight: 600; font-size: 0.75rem; }
      .table tbody td { border-bottom: 1px solid rgba(255,255,255,0.04) !important; background-color: transparent !important; color: #fff !important; white-space: nowrap; }

      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); cursor: pointer; padding: 0.25rem 0.5rem; font-size: 0.7rem; }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; font-weight: bold; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }

      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; }
      .erp-modal .modal-header, .erp-modal .modal-footer { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
      
      .status-indicator { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
      .status-online { background-color: #08c068; box-shadow: 0 0 8px #08c068; }
      .status-offline { background-color: #dc3545; box-shadow: 0 0 8px #dc3545; }

      .terminal-box { background-color: #151515; border: 1px solid rgba(255,255,255,0.1); font-family: 'Courier New', Courier, monospace; font-size: 0.75rem; color: #08c068; max-height: 200px; overflow-y: auto; padding: 10px; border-radius: 6px; }

      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: rgba(255, 255, 255, 0.4); width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }
      
      .custom-tooltip .tooltip-inner { background-color: #222222; color: #ffffff; border: 1px solid rgba(8, 192, 104, 0.3); font-size: 0.7rem; padding: 8px 12px; text-align: left; max-width: 240px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
      .custom-tooltip .style-arrow::before { border-top-color: #222222; }

      /* SKELETON LOADING CLASSES */
      .skeleton-dark { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%) !important; background-size: 200% 100% !important; animation: skeleton-loading-view 1.5s infinite linear !important; border-radius: 4px; color: transparent !important; border-color: transparent !important; box-shadow: none !important; pointer-events: none; }
      .skeleton-dark * { visibility: hidden !important; }
      .skeleton-text-view { height: 14px; width: 100%; margin-bottom: 8px; }
      .skeleton-btn-view { height: 20px; width: 32px; border-radius: 4px; display: inline-block; }
      @keyframes skeleton-loading-view { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    </style>
  </head>
  <body>

    <div class="sidebar d-none d-md-flex">
      <div class="text-center mb-4 mt-2"><img src="/img/logo-branca.png" class="img-fluid" style="max-width:130px;"></div>
      <div class="flex-grow-1">${menuHTML}</div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 class="mb-0 fw-bold text-white"><i class="fa-brands fa-whatsapp text-success me-2"></i>Painel do Servidor WhatsApp</h5>
          <span class="text-muted mt-1" style="font-size:0.7rem;">Gerencie pareamento, logs de confirmação e disparos manuais</span>
        </div>
        
        <div class="bg-custom-darker border-custom px-3 py-2 rounded shadow-sm d-flex align-items-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <span id="whatsappStatusDot" class="status-indicator ${whatsappStatus.isReady ? 'status-online' : 'status-offline'}"></span>
            <span id="whatsappStatusText" class="small fw-bold text-white">${whatsappStatus.isReady ? 'CONECTADO' : 'DESCONECTADO'}</span>
          </div>
          <button class="btn btn-xs btn-outline-primary py-1 px-2 border-custom" style="font-size:0.7rem;" data-bs-toggle="modal" data-bs-target="#modalQrCode" onclick="carregarQrCodeInfo()">
            <i class="fa-solid fa-qrcode me-1"></i> Conexões
          </button>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-12 col-xl-7">
          <form id="formDisparoManual" onsubmit="executarDisparoManual(event)">
            <div class="bg-custom-darker p-3 rounded-3 shadow-sm border-custom mb-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
              <div class="d-flex align-items-center gap-2">
                <h6 class="fw-bold text-white mb-0" style="font-size: 0.85rem;"><i class="fa-solid fa-truck-ramp-box text-accent me-2"></i> Disparar Mensagens Manuais</h6>
                <i class="fa-regular fa-circle-question text-muted" 
                   style="cursor: help; font-size: 0.8rem;" 
                   data-bs-toggle="tooltip" 
                   data-bs-custom-class="custom-tooltip"
                   data-bs-placement="top" 
                   title="Selecione os cadernos desejados e clique em disparar. O sistema enviará mensagens automáticas para o WhatsApp dos clientes contendo a relação dos itens, quantidade e o valor em aberto.">
                </i>
              </div>
              <button type="submit" id="btnDisparoManual" class="btn btn-sm btn-success fw-bold shadow-sm" ${cadernosPendentes.length === 0 ? 'disabled' : ''}>
                <i class="fa-solid fa-paper-plane me-1"></i> Disparar Mensagens
              </button>
            </div>

            <div class="table-responsive bg-custom-darker rounded-3 shadow-sm border-custom">
              <table class="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th class="py-2 px-3" style="width: 30px;"><input type="checkbox" id="checkAllCadernos" class="form-check-input border-secondary shadow-sm" onchange="toggleSelectAllCadernos(this)"></th>
                    <th class="py-2 px-2">Data de Saída</th>
                    <th class="py-2 px-2">Caderno</th>
                    <th class="py-2 px-2">Motorista</th>
                    <th class="py-2 px-2 text-center">Entregas</th>
                    <th class="py-2 px-3 text-end">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  ${linhasCadernos || `<tr><td colspan="6" class="text-center text-muted py-4"><i class="fa-solid fa-circle-check fa-xl opacity-25 mb-2 d-block"></i>Nenhum manifesto encontrado.</td></tr>`}
                </tbody>
              </table>
            </div>

            ${totalPagesC > 1 ? `
              <div class="d-flex justify-content-center mt-3 div-paginacao">
                <nav><ul class="pagination pagination-sm mb-0 shadow-sm">
                  ${linksCadernosPages}
                </ul></nav>
              </div>
            ` : ""}
          </form>
        </div>

        <div class="col-12 col-xl-5">
          <div class="bg-custom-darker p-3 rounded-3 shadow-sm border-custom mb-3">
            <h6 class="fw-bold text-white mb-0" style="font-size: 0.85rem;"><i class="fa-solid fa-clipboard-list text-accent me-2"></i> Confirmações de Envio</h6>
          </div>
          
          <div class="table-responsive bg-custom-darker rounded-3 shadow-sm border-custom">
            <table class="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th class="py-2 px-2">Horário</th>
                  <th class="py-2 px-2">Cliente</th>
                  <th class="py-2 px-2">Contato</th>
                  <th class="py-2 px-2 text-end">Status</th>
                </tr>
              </thead>
              <tbody id="listaLogsEnvioBody">
                ${linhasLogs || `<tr><td colspan="4" class="text-center text-muted py-4">Nenhuma mensagem registrada.</td></tr>`}
              </tbody>
            </table>
          </div>

          ${totalPagesL > 1 ? `
            <div class="d-flex justify-content-center mt-3 div-paginacao">
              <nav><ul class="pagination pagination-sm mb-0 shadow-sm">
                ${linksLogsPages}
              </ul></nav>
            </div>
          ` : ""}
        </div>
      </div>
    </div>

    <div class="modal fade" id="modalQrCode" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg">
          <div class="modal-header bg-custom-darker border-0 text-white">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-robot text-accent me-2"></i> Conexão com o Servidor WhatsApp</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body bg-custom-dark p-4 text-center">
            <div id="containerMonitoramentoQr">
              <p class="text-muted small mb-3">Se o bot for desconectado, aponte a câmera do WhatsApp da empresa para o código abaixo:</p>
              <div id="areaImagemQr" class="bg-white p-3 rounded d-inline-block shadow-sm mb-3" style="width: 200px; height: 200px;">
                <div class="d-flex align-items-center justify-content-center h-100 text-dark small"><i class="fa-solid fa-circle-notch fa-spin text-accent fa-2x"></i></div>
              </div>
            </div>
            
            <div class="mb-3 d-flex flex-column gap-2">
              <button type="button" class="btn btn-sm btn-danger fw-bold shadow-sm px-3 w-100" id="btnDesconectarBotManual" onclick="desconectarWhatsappServidor(this)">
                  <i class="fa-solid fa-power-off me-1"></i> Desconectar Sessão (Apenas Logout)
              </button>
              
              <button type="button" class="btn btn-sm btn-outline-warning text-warning fw-bold shadow-sm px-3 w-100 border-warning" id="btnHardResetBot" onclick="hardResetWhatsappServidor(this)" style="background: rgba(255, 193, 7, 0.1);">
                  <i class="fa-solid fa-triangle-exclamation me-1"></i> Hard Reset (Limpar Cache e Reiniciar VPS)
              </button>
            </div>

            <div class="text-start mt-2">
              <span class="text-white fw-bold d-block mb-1 shadow-sm" style="font-size:0.7rem;"><i class="fa-solid fa-terminal me-1 text-muted"></i> Logs do Módulo:</span>
              <div class="terminal-box" id="terminalLogsBox">
                [SISTEMA] Aguardando leitura de logs...
              </div>
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-0 d-flex justify-content-end">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white fw-bold px-4" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div><i class="fa-solid fa-circle-check fs-5 me-2 text-accent"></i><strong class="fs-6" id="sucessoTitulo">Concluído!</strong></div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3"><p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="sucessoSub"></p></div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 4px; background: #08c068;"></div>
        </div>

        <div id="erroToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(220,53,69,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div><i class="fa-solid fa-circle-xmark fs-5 me-2 text-danger"></i><strong class="fs-6" id="erroTitulo">Erro!</strong></div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3"><p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="erroSub"></p></div>
            <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
        </div>
    </div>

    ${termosHTML}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      // ==========================================
      // CONTROLES GLOBAIS DE SKELETON
      // ==========================================
      function mostrarSkeletonGlobais() {
          if (document.querySelector('.skeleton-container')) return;

          const containers = document.querySelectorAll('.table-responsive:not(.skeleton-container)');
          
          containers.forEach((container, idx) => {
              const isLogs = container.closest('.col-xl-5') !== null;
              
              let thead = '';
              if(isLogs) {
                  thead = '<tr><th class="py-2 px-2">Horário</th><th class="py-2 px-2">Cliente</th><th class="py-2 px-2">Contato</th><th class="py-2 px-2 text-end">Status</th></tr>';
              } else {
                  thead = '<tr><th class="py-2 px-3" style="width: 30px;"></th><th class="py-2 px-2">Data de Saída</th><th class="py-2 px-2">Caderno</th><th class="py-2 px-2">Motorista</th><th class="py-2 px-2 text-center">Entregas</th><th class="py-2 px-3 text-end">Ação</th></tr>';
              }

              let htmlBody = '';
              for(let i=0; i<5; i++) {
                  if(isLogs) {
                      htmlBody += \`
                      <tr class="align-middle" style="height: 38px;">
                          <td class="py-2 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 80%; margin: 0;"></div></td>
                          <td class="py-2 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 60%; margin: 0;"></div></td>
                          <td class="py-2 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 70%; margin: 0;"></div></td>
                          <td class="py-2 px-2 text-end"><div class="skeleton-dark skeleton-btn-view" style="width:50px;"></div></td>
                      </tr>\`;
                  } else {
                      htmlBody += \`
                      <tr class="align-middle" style="height: 38px;">
                          <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 15px; margin: 0;"></div></td>
                          <td class="py-2 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 80%; margin: 0;"></div></td>
                          <td class="py-2 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 60%; margin: 0;"></div></td>
                          <td class="py-2 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 70%; margin: 0;"></div></td>
                          <td class="py-2 px-2 text-center"><div class="skeleton-dark skeleton-text-view" style="width: 40px; margin: 0 auto;"></div></td>
                          <td class="py-2 px-3 text-end"><div class="skeleton-dark skeleton-btn-view"></div></td>
                      </tr>\`;
                  }
              }

              const skeletonHTML = \`
              <div class="table-responsive bg-custom-darker rounded-3 shadow-sm border-custom skeleton-container" id="skeleton-temp-\${idx}">
                  <table class="table table-sm align-middle mb-0">
                     <thead>\${thead}</thead>
                     <tbody>\${htmlBody}</tbody>
                  </table>
              </div>\`;

              container.style.display = 'none';
              container.insertAdjacentHTML('beforebegin', skeletonHTML);
          });
          
          document.querySelectorAll('.div-paginacao').forEach(nav => nav.style.display = 'none');
      }

      function ocultarSkeletonGlobais() {
          document.querySelectorAll('.skeleton-container').forEach(el => el.remove());
          document.querySelectorAll('.table-responsive').forEach(el => el.style.display = '');
          document.querySelectorAll('.div-paginacao').forEach(nav => nav.style.display = '');
      }

      mostrarSkeletonGlobais();

      if (document.readyState === 'complete') {
          setTimeout(ocultarSkeletonGlobais, 100);
      } else {
          window.addEventListener('load', ocultarSkeletonGlobais);
      }

      window.addEventListener('beforeunload', () => {
          mostrarSkeletonGlobais();
      });

      // ==========================================
      // FUNCIONALIDADES ORIGINAIS DA VIEW
      // ==========================================

      document.addEventListener("DOMContentLoaded", function() {
          const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
          tooltipTriggerList.map(function (tooltipTriggerEl) {
              return new bootstrap.Tooltip(tooltipTriggerEl);
          });
      });

      function toggleSelectAllCadernos(master) {
          document.querySelectorAll('.check-caderno').forEach(cb => cb.checked = master.checked);
      }

      function mostrarToast(tipo, titulo, message) {
          const toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
          if (toastEl) {
              document.getElementById(tipo === 'sucesso' ? 'sucessoTitulo' : 'erroTitulo').innerText = titulo;
              document.getElementById(tipo === 'sucesso' ? 'sucessoSub' : 'erroSub').innerText = message;

              const timerEl = document.getElementById(tipo === 'sucesso' ? 'sucessoTimer' : 'erroTimer');
              if (timerEl) {
                  timerEl.style.display = 'block';
                  timerEl.style.animation = 'none';
                  timerEl.offsetHeight; 
                  timerEl.style.animation = 'shrinkToast 5s linear forwards';
              }

              const oldInstance = bootstrap.Toast.getInstance(toastEl);
              if (oldInstance) oldInstance.dispose();

              new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 }).show();
          }
      }

      async function navegarTabela(event, url) {
          event.preventDefault();
          mostrarSkeletonGlobais(); // Aciona o Skeleton durante a navegação Ajax
          try {
              const response = await fetch(url);
              if (response.ok) {
                  const html = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  document.querySelector('.content').innerHTML = doc.querySelector('.content').innerHTML;
                  window.history.pushState({}, '', url);

                  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                  tooltipTriggerList.map(function (tooltipTriggerEl) {
                      return new bootstrap.Tooltip(tooltipTriggerEl);
                  });
              } else {
                  mostrarToast('erro', 'Erro', 'Falha ao mudar de página.');
              }
          } catch (err) {
              mostrarToast('erro', 'Erro de Conexão', 'Não foi possível carregar a página.');
          }
      }

      async function marcarLinhaComoEnviada(id, btnElement) {
          const row = document.getElementById('cadernoRow-' + id);
          if (!row) return;

          const jáEstavaEnviado = (row.style.opacity === '0.35');
          const novoEstadoEnviado = !jáEstavaEnviado;

          btnElement.disabled = true;

          try {
              const response = await fetch('/api/cadernos/atualizar-status-envio', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: id, enviado: novoEstadoEnviado })
              });

              if (response.ok) {
                  if (novoEstadoEnviado) {
                      row.style.opacity = '0.35';
                      row.querySelectorAll('.c-data, .c-manifesto, .c-motorista').forEach(el => {
                          el.style.textDecoration = 'line-through';
                      });
                      btnElement.className = "btn btn-xs btn-success py-0 px-2 btn-marcar-enviado";
                      btnElement.innerHTML = \`<i class="fa-solid fa-check-double"></i>\`;
                      
                      const chk = row.querySelector('.check-caderno');
                      if(chk) { chk.checked = false; chk.disabled = true; }
                      
                      mostrarToast('sucesso', 'Concluído!', 'Manifesto #' + id + ' marcado como enviado no DB.');
                  } else {
                      row.style.opacity = '1';
                      row.querySelectorAll('.c-data, .c-manifesto, .c-motorista').forEach(el => {
                          el.style.textDecoration = 'none';
                      });
                      btnElement.className = "btn btn-xs btn-outline-secondary border-custom py-0 px-2 btn-marcar-enviado";
                      btnElement.innerHTML = \`<i class="fa-solid fa-check"></i>\`;
                      
                      const chk = row.querySelector('.check-caderno');
                      if(chk) { chk.disabled = false; }
                      
                      mostrarToast('sucesso', 'Restaurado!', 'Manifesto #' + id + ' voltou para pendente.');
                  }
              } else {
                  mostrarToast('erro', 'Erro', 'Não foi possível salvar o status no servidor.');
              }
          } catch (err) {
              mostrarToast('erro', 'Erro de Conexão', 'Falha de rede ao tentar atualizar o caderno.');
          } finally {
              btnElement.disabled = false;
          }
      }

      async function desconectarWhatsappServidor(btn) {
          if (!confirm("Tem certeza que deseja encerrar a sessão do WhatsApp e desconectar o robô?")) return;

          const iconeOriginal = \`<i class="fa-solid fa-power-off me-1"></i> Desconectar Sessão do WhatsApp\`;
          btn.disabled = true;
          btn.innerHTML = \`<i class="fa-solid fa-spinner fa-spin me-1"></i> Desconectando e reiniciando robô...\`;

          try {
              const res = await fetch('/api/whatsapp/desconectar', { method: 'POST' });
              
              if (res.ok) {
                  btn.disabled = false;
                  btn.innerHTML = iconeOriginal;
                  
                  mostrarToast('sucesso', 'Desconectado!', 'A sessão foi encerrada. O robô está abrindo um novo navegador, aguarde o QR Code.');
                  
                  let tentativasReboot = 0;
                  const checkInstante = setInterval(async () => {
                      await carregarQrCodeInfo();
                      tentativasReboot++;
                      
                      if (tentativasReboot > 8) {
                          clearInterval(checkInstante);
                      }
                  }, 1500);
              } else {
                  mostrarToast('erro', 'Falha', 'Não foi possível desconectar a sessão no servidor.');
                  btn.disabled = false;
                  btn.innerHTML = iconeOriginal;
              }
          } catch (err) {
              mostrarToast('erro', 'Erro de Conexão', 'Falha ao se comunicar com o painel.');
              btn.disabled = false;
              btn.innerHTML = iconeOriginal;
          }
      }

      async function executarDisparoManual(e) {
          e.preventDefault();
          const btn = document.getElementById('btnDisparoManual');
          const selecionados = Array.from(document.querySelectorAll('.check-caderno:checked')).map(cb => cb.value);

          if (selecionados.length === 0) {
              mostrarToast('erro', 'Aviso', 'Selecione ao menos um caderno para realizar o disparo.');
              return;
          }

          btn.disabled = true;
          btn.innerHTML = \`<i class="fa-solid fa-spinner fa-spin me-1"></i> Disparando...\`;

          try {
              const response = await fetch('/caderno-entregas/disparar-manual', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ids: selecionados })
              });

              if (response.ok) {
                  mostrarToast('sucesso', 'Sucesso!', 'Disparo em lote iniciado. Os cadernos serão riscados automaticamente ao finalizar.');
                  
                  selecionados.forEach(id => {
                      const row = document.getElementById('cadernoRow-' + id);
                      if (row) {
                          row.style.opacity = '0.35';
                          row.querySelectorAll('.c-data, .c-manifesto, .c-motorista').forEach(el => el.style.textDecoration = 'line-through');
                          const chk = row.querySelector('.check-caderno');
                          if(chk) { chk.checked = false; chk.disabled = true; }
                          const btnMarcar = row.querySelector('.btn-marcar-enviado');
                          if(btnMarcar) {
                              btnMarcar.className = "btn btn-xs btn-success py-0 px-2 btn-marcar-enviado";
                              btnMarcar.innerHTML = \`<i class="fa-solid fa-check-double"></i>\`;
                          }
                      }
                  });

                  setTimeout(async () => {
                      await carregarQrCodeInfo();
                  }, 1000);

                  setTimeout(() => {
                      btn.disabled = false;
                      btn.innerHTML = \`<i class="fa-solid fa-paper-plane me-1"></i> Disparar Mensagens\`;
                      document.getElementById('checkAllCadernos').checked = false;
                  }, 2000);

              } else {
                  mostrarToast('erro', 'Falha no Servidor', 'Ocorreu um problema ao enviar o lote.');
                  btn.disabled = false;
                  btn.innerHTML = \`<i class="fa-solid fa-paper-plane me-1"></i> Disparar Mensagens\`;
              }
          } catch (err) {
              mostrarToast('erro', 'Erro de Conexão', 'Verifique a rede.');
              btn.disabled = false;
              btn.innerHTML = \`<i class="fa-solid fa-paper-plane me-1"></i> Disparar Mensagens\`;
          }
      }

      // FUNÇÃO DE MONITORAMENTO REFORMULADA COM APPEND COMPATÍVEL E TRATAMENTO DE SERIALIZED IDS
      async function carregarQrCodeInfo() {
          const areaQr = document.getElementById('areaImagemQr');
          const terminal = document.getElementById('terminalLogsBox');
          const tabelaLogsBody = document.getElementById('listaLogsEnvioBody');
          
          const statusDot = document.getElementById('whatsappStatusDot');
          const statusText = document.getElementById('whatsappStatusText');
          const btnDesconectar = document.getElementById('btnDesconectarBotManual');
          
          try {
              const res = await fetch('/api/whatsapp/status-monitor');
              if (res.ok) {
                  const dados = await res.json();
                  
                  if (typeof window.estadoConexaoAnterior === 'undefined') {
                      window.estadoConexaoAnterior = dados.isReady;
                  }

                  if (!window.estadoConexaoAnterior && dados.isReady) {
                      mostrarToast('sucesso', 'Conectado!', 'Robô do WhatsApp conectado com sucesso!');
                  }
                  
                  window.estadoConexaoAnterior = dados.isReady;

                  if (dados.isReady) {
                      if(statusDot) { statusDot.className = "status-indicator status-online"; }
                      if(statusText) { statusText.innerText = "CONECTADO"; }
                      
                      if(areaQr) {
                          areaQr.innerHTML = \`<div class="d-flex flex-column align-items-center justify-content-center h-100 text-success text-center px-2"><i class="fa-solid fa-circle-check fa-2x mb-2"></i><span style="font-size:0.75rem; font-weight:bold;">O Whatsapp já está conectado!</span></div>\`;
                      }
                  } else {
                      if(statusDot) { statusDot.className = "status-indicator status-offline"; }
                      if(statusText) { statusText.innerText = "DESCONECTADO"; }
                      
                      if(areaQr) {
                          if (dados.qrCodeBase64) {
                              areaQr.innerHTML = \`<img src="\${dados.qrCodeBase64}" class="img-fluid" style="width:100%; height:100%; object-fit:contain;" alt="QR Code para Pareamento">\`;
                          } else {
                              areaQr.innerHTML = \`<div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted small text-center p-2"><i class="fa-solid fa-circle-notch fa-spin text-accent mb-2 fa-2x"></i><span>Iniciando servidor...<br><span style="font-size:0.6rem; opacity:0.6;">Aguardando QR Code da Meta</span></span></div>\`;
                          }
                      }
                  }

                  if (tabelaLogsBody && dados.logs && dados.logs.length > 0) {
                      const logsEnvioMensagens = dados.logs.filter(l => l.includes('✅ Mensagem enviada') || l.includes('❌ Erro crítico') || l.includes('⚠️ WhatsApp ainda não está pronto'));
                      
                      // 🛡️ TRAVA PARA IMPEDIR LOGS DUPLICADOS NA ATUALIZAÇÃO DE PÁGINA (F5)
                      let primeiraLeitura = false;
                      if (!window.logsInjetadosNoFront) {
                          window.logsInjetadosNoFront = [];
                          primeiraLeitura = true;
                      }

                      logsEnvioMensagens.forEach(log => {
                          // Se já existe na memória, apenas ignora
                          if (window.logsInjetadosNoFront.includes(log)) return;
                          
                          // Adiciona na memória para ser ignorado nas próximas passagens
                          window.logsInjetadosNoFront.push(log);

                          // Se for a primeira vez que a página carrega, encerra o bloco aqui 
                          // para não duplicar, pois a rota original já injetou a tabela vinda do BD
                          if (primeiraLeitura) return;

                          const dataCompleta = new Date().toLocaleDateString('pt-BR');
                          let horario = log.match(/\\[(.*?)\\]/)?.[1] || new Date().toLocaleTimeString('pt-BR');
                          
                          // 🕒 REMOVE OS SEGUNDOS (Transforma "19:16:06" em "19:16")
                          if (horario && horario.split(':').length >= 3) {
                              horario = horario.split(':').slice(0, 2).join(':');
                          }

                          const isSucesso = log.includes('✅');
                          
                          let rawDestino = 'Disparo Manual';
                          if (log.includes('para:')) {
                              rawDestino = log.split('para:')[1].trim();
                          } else if (log.includes('para ')) {
                              rawDestino = log.split('para ')[1].trim();
                          }

                          let nomeExibicao = "DISPARO INSTANTÂNEO";
                          let contatoExibicao = rawDestino;

                          // 🛡️ TRATAMENTO LENDO O PADRÃO "NOME | NUMERO"
                          if (rawDestino.includes('|')) {
                              const partes = rawDestino.split('|');
                              nomeExibicao = partes[0] ? partes[0].trim() : "Cliente";
                              
                              const apenasNumero = partes[1] ? partes[1].trim() : "";
                              
                              if (apenasNumero.startsWith('55') && apenasNumero.length >= 12) {
                                  const ddd = apenasNumero.slice(2, 4);
                                  const p1 = apenasNumero.slice(4, 5);
                                  const p2 = apenasNumero.slice(5, 9);
                                  const p3 = apenasNumero.slice(9);
                                  contatoExibicao = \`(\${ddd}) \${p1} \${p2}-\${p3}\`;
                              } else {
                                  contatoExibicao = apenasNumero;
                              }
                          } else if (rawDestino.includes('@')) {
                              const apenasNumero = rawDestino.split('@')[0];
                              if (apenasNumero.startsWith('55') && apenasNumero.length >= 12) {
                                  const ddd = apenasNumero.slice(2, 4);
                                  const p1 = apenasNumero.slice(4, 5);
                                  const p2 = apenasNumero.slice(5, 9);
                                  const p3 = apenasNumero.slice(9);
                                  contatoExibicao = \`(\${ddd}) \${p1} \${p2}-\${p3}\`;
                              } else {
                                  contatoExibicao = apenasNumero;
                              }
                          }

                          const linhaVazia = tabelaLogsBody.querySelector('tr td.text-center');
                          if (linhaVazia && linhaVazia.closest('tr')) {
                              linhaVazia.closest('tr').remove();
                          }

                          const statusBadge = isSucesso 
                            ? \`<span class="badge bg-success-subtle text-success border border-success-subtle px-1.5 py-0.5" style="font-size:0.6rem;"><i class="fa-solid fa-check-double me-1"></i> Enviado</span>\`
                            : \`<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-1.5 py-0.5" style="font-size:0.6rem;"><i class="fa-solid fa-triangle-exclamation me-1"></i> Falhou</span>\`;
                          
                          const novaLinhaHTML = \`
                            <tr class="align-middle" style="font-size: 0.72rem; animation: fadeIn 0.3s ease; background-color: rgba(8, 192, 104, 0.04);">
                              <td class="text-muted py-1 px-2" style="font-size:0.68rem;">\${dataCompleta} \${horario}</td>
                              <td class="text-white fw-medium py-1 px-2 text-truncate" style="max-width: 120px;">\${nomeExibicao}</td>
                              <td class="text-muted py-1 px-2" style="font-size:0.68rem;">\${contatoExibicao}</td>
                              <td class="py-1 px-2 text-end">\${statusBadge}</td>
                            </tr>
                          \`;
                          
                          tabelaLogsBody.insertAdjacentHTML('afterbegin', novaLinhaHTML);
                      });
                  }

                  if (terminal && dados.logs && dados.logs.length > 0) {
                      terminal.innerHTML = dados.logs.map(l => \`<div>\${l}</div>\`).join('');
                      terminal.scrollTop = terminal.scrollHeight;
                  }
              }
          } catch (err) {
              console.error("[AJAX MONITOR ERROR]:", err);
          }
      }

      async function hardResetWhatsappServidor(btn) {
          if (!confirm("⚠️ ATENÇÃO: Isso vai excluir a sessão salva, apagar o cache corrompido e reiniciar o serviço do Ecoflow na VPS. O painel pode ficar fora do ar por 5 a 10 segundos.\\n\\nDeseja continuar?")) return;

          const iconeOriginal = \`<i class="fa-solid fa-triangle-exclamation me-1"></i> Hard Reset (Limpar Cache e Reiniciar VPS)\`;
          
          btn.disabled = true;
          document.getElementById('btnDesconectarBotManual').disabled = true;
          btn.innerHTML = \`<i class="fa-solid fa-spinner fa-spin me-1"></i> Apagando sessão e reiniciando servidor...\`;

          try {
              const res = await fetch('/api/whatsapp/hard-reset', { method: 'POST' });
              
              if (res.ok) {
                  mostrarToast('sucesso', 'Hard Reset Iniciado!', 'O servidor está reiniciando. Aguarde alguns segundos...');
                  
                  // Fica "pingando" o servidor de 2 em 2 segundos para saber quando o PM2 subiu o Node de volta
                  let tentativasReboot = 0;
                  const checkInstante = setInterval(async () => {
                      try {
                          const ping = await fetch('/api/whatsapp/status-monitor');
                          if (ping.ok) {
                              clearInterval(checkInstante);
                              btn.disabled = false;
                              document.getElementById('btnDesconectarBotManual').disabled = false;
                              btn.innerHTML = iconeOriginal;
                              mostrarToast('sucesso', 'Servidor Online!', 'O robô foi reiniciado do zero. Aguarde o novo QR Code.');
                              carregarQrCodeInfo();
                          }
                      } catch (e) {
                          // Se der catch, significa que o Node ainda está reiniciando (offline)
                      }
                      
                      tentativasReboot++;
                      if (tentativasReboot > 20) { // Desiste de tentar atualizar o botão após 40s
                          clearInterval(checkInstante);
                          btn.innerHTML = iconeOriginal;
                      }
                  }, 2000);

              } else {
                  mostrarToast('erro', 'Falha', 'Não foi possível executar o Hard Reset.');
                  btn.disabled = false;
                  document.getElementById('btnDesconectarBotManual').disabled = false;
                  btn.innerHTML = iconeOriginal;
              }
          } catch (err) {
              mostrarToast('erro', 'Aviso', 'O servidor já está reiniciando, aguarde a volta...');
          }
      }

      setInterval(() => {
          carregarQrCodeInfo();
      }, 4000);
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = enviosView;