// views/downloadsView.js
const menuLateral = require("./menuLateral");
const termosComponent = require("./termosComponent");

function downloadsView(req, arquivos = [], paginacao = {}) {
  const usuarioObj = (req && req.session) ? req.session.user : req;
  const termosHTML = termosComponent(usuarioObj);
  const user = usuarioObj || { nome: "Usuário", tipo_usuario: "admin" };
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  const fmtData = (d) => {
    try {
      if(!d) return "-";
      const dt = new Date(d);
      return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    } catch {
      return d || "-";
    }
  };

  const formatarTamanho = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = 2;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const obterIconeEcor = (extensao) => {
      const ext = String(extensao).toLowerCase();
      if (['pdf'].includes(ext)) return { icone: 'fa-file-pdf', cor: 'text-danger' };
      if (['doc', 'docx'].includes(ext)) return { icone: 'fa-file-word', cor: 'text-primary' };
      if (['xls', 'xlsx'].includes(ext)) return { icone: 'fa-file-excel', cor: 'text-success' };
      if (['cdr', 'ai', 'eps', 'svg'].includes(ext)) return { icone: 'fa-bezier-curve', cor: 'text-warning' };
      if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return { icone: 'fa-file-image', cor: 'text-info' };
      if (['zip', 'rar', '7z'].includes(ext)) return { icone: 'fa-file-zipper', cor: 'text-secondary' };
      return { icone: 'fa-file', cor: 'text-white-50' };
  };

  const linhas = arquivos.map(arq => {
    const infoFicheiro = obterIconeEcor(arq.extensao);
    
    return `
    <tr class="align-middle table-hover-row">
      <td class="text-center py-1 px-2" style="width: 40px;">
        <i class="fa-solid ${infoFicheiro.icone} fa-lg ${infoFicheiro.cor}"></i>
      </td>
      <td class="py-1 px-2">
        <div class="text-truncate text-white fw-bold" style="max-width: 280px; font-size: 0.8rem;" title="${arq.nome_original}">
          ${arq.nome_original}
        </div>
        <div class="text-white-50" style="font-size: 0.65rem;">
            Enviado por: ${arq.responsavel || 'Sistema'}
        </div>
      </td>
      <td class="text-white-50 py-1 px-2">
        <span class="badge bg-custom-darker border border-custom text-white-50 text-uppercase" style="font-size: 0.65rem; padding: 0.25em 0.5em;">${arq.extensao}</span>
      </td>
      <td class="text-white-50 py-1 px-2" style="font-size: 0.75rem;">${formatarTamanho(arq.tamanho)}</td>
      <td class="text-white-50 fw-medium py-1 px-2" style="font-size: 0.75rem;"><i class="fa-regular fa-calendar-check me-1"></i> ${fmtData(arq.data_upload)}</td>
      <td class="text-end py-1 px-2">
        <div class="btn-group">
          <a href="/downloads/baixar/${arq.id}" class="btn btn-xs btn-outline-success border-custom py-1 px-2 shadow-sm fw-bold" title="Baixar Arquivo" onclick="mostrarToast('sucesso', 'Download Iniciado', 'A transferência do arquivo começou.')">
            <i class="fa-solid fa-download me-1"></i> Baixar
          </a>
          <button type="button" class="btn btn-xs btn-outline-secondary border-custom text-danger py-1 px-2 shadow-sm" 
                  onclick="event.stopPropagation(); bootstrap.Modal.getOrCreateInstance(document.getElementById('excluirModal${arq.id}')).show();" title="Excluir Arquivo">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
    `;
  }).join("");

  const modaisExclusao = arquivos.map(arq => `
    <div class="modal fade" id="excluirModal${arq.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <form method="POST" action="/downloads/excluir/${arq.id}">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="fw-bold text-white mb-2" style="font-size: 0.95rem;">Excluir Ficheiro?</h6>
              <p class="text-white-50 mb-0" style="font-size:0.8rem; word-break: break-all;">${arq.nome_original}</p>
              <p class="text-danger mt-2 fw-bold" style="font-size:0.75rem;">Esta ação não pode ser desfeita.</p>
            </div>
            <div class="modal-footer modal-footer-dark border-0 justify-content-center d-flex flex-nowrap pt-0">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm" onclick="this.innerHTML='<i class=\\'fa-solid fa-spinner fa-spin\\'></i> Apagando...'; this.disabled=true; this.form.submit();">Sim, Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `).join("");

  // Paginação Inteligente Resolvida no Servidor (Sem necessidade de escapes de cliente)
  const pageLinks = (() => {
    let html = '';
    const maxVisible = 5;
    const addPage = (num) => {
        html += `<li class="page-item ${num === page ? 'active' : ''}"><a class="page-link ${num === page ? 'fw-bold text-white' : ''}" href="/downloads?page=${num}" onclick="navegarPagina(event, this.href)">${num}</a></li>`;
    };
    const addEllipsis = () => {
        html += `<li class="page-item disabled"><a class="page-link">...</a></li>`;
    };

    if (totalPages <= maxVisible + 2) {
        for (let i = 1; i <= totalPages; i++) addPage(i);
    } else {
        addPage(1);
        if (page > 3) addEllipsis();
        let limInf = Math.max(2, page - 1);
        let limSup = Math.min(totalPages - 1, page + 1);
        if (page <= 2) limSup = 3;
        if (page >= totalPages - 1) limInf = totalPages - 2;
        for (let i = limInf; i <= limSup; i++) addPage(i);
        if (page < totalPages - 2) addEllipsis();
        addPage(totalPages);
    }
    return html;
  })();

  const paginacaoHtml = totalPages > 1 ? `
    <div class="d-flex flex-column align-items-center justify-content-center mt-4 gap-2 text-white-50 small w-100 pagnacao-container">
        <nav><ul class="pagination pagination-sm mb-0 shadow-sm">
            <li class="page-item ${page <= 1 ? "disabled" : ""}"><a class="page-link" href="/downloads?page=${page - 1}" onclick="navegarPagina(event, this.href)">«</a></li>
            ${pageLinks}
            <li class="page-item ${page >= totalPages ? "disabled" : ""}"><a class="page-link" href="/downloads?page=${page + 1}" onclick="navegarPagina(event, this.href)">»</a></li>
        </ul></nav>
    </div>
  ` : "";

  const menuHTML = menuLateral(user, "/downloads");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Central de Downloads | Ecoflow</title>
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
      html, body, .content, .table-responsive, .modal-body, .offcanvas-body { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

      body { display: flex; height: 100vh; margin: 0; background-color: #1f1f1f; color: #ffffff; font-family: 'Segoe UI', sans-serif; }
      .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column; }
      .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; background-color: #1f1f1f; }
      
      .bg-custom-dark { background-color: #2a2a2a !important; }
      .bg-custom-darker { background-color: #222222 !important; }
      .border-custom { border-color: rgba(255,255,255,0.08) !important; border-width: 1px; }
      .text-accent { color: #08c068 !important; }

      .btn-primary, .btn-success { background-color: #08c068; border-color: #08c068; color: #1f1f1f; }
      .btn-primary:hover, .btn-success:hover { background-color: #06a055 !important; border-color: #06a055 !important; color: #ffffff !important; }
      
      .btn-outline-secondary { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }
      .btn-outline-secondary:hover { background-color: rgba(255,255,255,0.1); color: #fff; }
      
      .btn-outline-success { color: #08c068; border-color: rgba(8, 192, 104, 0.3); background: transparent; }
      .btn-outline-success:hover { background-color: #08c068; color: #1f1f1f; border-color: #08c068; }

      .btn-xs { padding: 0.15rem 0.4rem; font-size: 0.7rem; border-radius: 0.2rem; }

      .form-control { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.8rem; }
      .form-control:focus { background-color: #2a2a2a; border-color: #08c068; color: #fff; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }
      .form-control::file-selector-button { background-color: #151515; color: #fff; border: none; border-right: 1px solid rgba(255,255,255,0.1); padding: 0.375rem 0.75rem; margin-right: 1rem; transition: 0.2s; cursor: pointer; }
      .form-control::file-selector-button:hover { background-color: #08c068; color: #1f1f1f; }

      .table { --bs-table-bg: transparent; --bs-table-color: #fff; --bs-table-hover-bg: rgba(255,255,255,0.06); color: #fff; margin-bottom: 0; }
      .table thead th { background-color: #222 !important; color: rgba(255,255,255,0.6) !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; font-weight: 600; font-size: 0.75rem; }
      .table tbody td { border-bottom: 1px solid rgba(255,255,255,0.05) !important; background-color: transparent !important; color: #fff !important; }
      .table-hover-row { transition: background-color 0.2s ease; }
      .table-hover-row:hover > td, .table-hover-row:hover > * { background-color: rgba(255,255,255,0.06) !important; box-shadow: inset 0 0 0 9999px rgba(255, 255, 255, 0.03); }

      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .erp-modal .modal-header, .erp-modal .modal-footer { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; border-top: 1px solid rgba(255,255,255,0.08); }

      /* Paginação */
      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); cursor: pointer; }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; font-weight: bold; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
      .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.25); border-color: rgba(255,255,255,0.05); }

      /* Toasts */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; background-color: #2a2a2a !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.08) !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }
      .modal.fade .modal-dialog { transform: scale(0.85) translateY(30px); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
      .modal.show .modal-dialog { transform: scale(1) translateY(0); }

      /* Skeleton Loading Classes */
      .skeleton-dark { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%) !important; background-size: 200% 100% !important; animation: skeleton-loading-view 1.5s infinite linear !important; border-radius: 4px; color: transparent !important; border-color: transparent !important; box-shadow: none !important; pointer-events: none; }
      .skeleton-dark * { visibility: hidden !important; }
      .skeleton-text-view { height: 14px; width: 100%; margin-bottom: 8px; }
      .skeleton-btn-view { height: 26px; width: 32px; border-radius: 4px; display: inline-block; }
      @keyframes skeleton-loading-view { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

      @media (max-width: 767.98px) { body { flex-direction: column; } .sidebar { display: none; } .content { padding: 16px; } }
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
        <h5 class="offcanvas-title ms-2" style="font-size: 0.9rem;"><i class="fa-solid fa-bars text-white-50 me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2"><img src="/img/logo.png" class="img-fluid" style="max-width:140px;"></div>
        ${menuHTML}
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-cloud-arrow-down text-accent me-2"></i>Central de Downloads</h5>
              <span class="text-white-50 d-none d-sm-block mt-1" style="font-size:0.7rem;">Arquivos Word/Excel ou pdf, instruções internas e documentos da Ecocaixas</span>
            </div>
        </div>
        <button class="btn btn-sm btn-success shadow-sm fw-bold px-3 py-2" data-bs-toggle="modal" data-bs-target="#novoArquivoModal">
            <i class="fa-solid fa-cloud-arrow-up me-1"></i> <span class="d-none d-sm-inline">Enviar Arquivo</span>
        </button>
      </div>

      <span class="text-white-50 d-block w-100 text-end mb-2" style="font-size: 0.75rem;">Exibindo página ${page} de ${totalPages}</span>

      ${arquivos.length > 0 
        ? `<div class="table-responsive bg-custom-darker rounded-3 shadow-sm border-custom mb-4">
             <table class="table table-sm align-middle mb-0" style="font-size: 0.75rem; border-collapse: separate; border-spacing: 0;">
               <thead>
                 <tr>
                   <th class="py-1 px-2 text-center border-0">Formato</th>
                   <th class="py-1 px-2 border-0">Nome do Arquivo</th>
                   <th class="py-1 px-2 border-0">Extensão</th>
                   <th class="py-1 px-2 border-0">Tamanho</th>
                   <th class="py-1 px-2 border-0">Data de Envio</th>
                   <th class="py-1 px-2 text-end border-0">Ações</th>
                 </tr>
               </thead>
               <tbody class="border-top-0">
                 ${linhas}
               </tbody>
             </table>
           </div>` 
        : `<div class="col-12 text-center text-white-50 mt-5 text-center-empty">
             <i class="fa-solid fa-folder-open fa-3x opacity-25 mb-3 d-block"></i>
             <p style="font-size:0.85rem;">Nenhum arquivo disponível no momento.</p>
             <button class="btn btn-sm btn-outline-success mt-2 fw-bold" data-bs-toggle="modal" data-bs-target="#novoArquivoModal">Faça o primeiro upload</button>
           </div>`
      }

      ${paginacaoHtml}
    </div>

    <div class="modal fade" id="novoArquivoModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form method="POST" action="/downloads/novo" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0" onsubmit="mostrarToastCarregando('A Enviar arquivo ao servidor...'); document.getElementById('btnSubmitUpload').disabled = true; document.getElementById('btnSubmitUpload').innerHTML = '<i class=\\'fa-solid fa-spinner fa-spin me-1\\'></i> A Enviar...';">
          <div class="modal-header bg-custom-darker text-white border-custom">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-cloud-arrow-up text-accent me-2"></i> Adicionar ao Repositório</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            
            <div class="alert bg-custom-darker border-custom text-white-50 shadow-sm" style="font-size:0.8rem;">
              <i class="fa-solid fa-circle-info text-accent me-2"></i> Você pode fazer o upload de documentos PDF, arquivos Word/Excel como instruções internas e regulamentos, bem como arquivos de design (.cdr, .ai, .eps, imagens). Limite de 50MB.
            </div>

            <div class="mb-3 mt-4">
              <label class="form-label text-white-50 fw-bold mb-2" style="font-size:0.75rem;">Selecione o arquivo do seu computador:</label>
              <input type="file" name="arquivo" class="form-control shadow-sm p-2" required accept=".pdf,.doc,.docx,.xls,.xlsx,.cdr,.ai,.eps,.svg,.png,.jpg,.jpeg,.zip,.rar">
            </div>

          </div>
          <div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap gap-2 pt-3 pb-3">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" id="btnSubmitUpload" class="btn btn-sm btn-primary text-dark fw-bold w-100 shadow-sm"><i class="fa-solid fa-upload me-1"></i> Fazer Upload</button>
          </div>
        </form>
      </div>
    </div>

    ${modaisExclusao}

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div><i class="fa-solid fa-circle-check fs-5 me-2 text-accent" id="sucessoIcon"></i><strong class="fs-6" id="sucessoTitulo">Concluído!</strong></div>
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
      // TOASTS
      // ==========================================
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

              new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 }).show();
          }
      }

      function mostrarToastCarregando(mensagem) {
          const successToastEl = document.getElementById('sucessoToast');
          if(!successToastEl) return;
          document.getElementById('sucessoIcon').className = "fa-solid fa-circle-notch fa-spin fs-5 me-2 text-accent";
          document.getElementById('sucessoTitulo').innerText = "A Processar...";
          document.getElementById('sucessoSub').innerText = mensagem;

          successToastEl.setAttribute('data-bs-autohide', 'false');
          const timerEl = document.getElementById('sucessoTimer');
          if (timerEl) timerEl.style.display = 'none';

          const oldInstance = bootstrap.Toast.getInstance(successToastEl);
          if (oldInstance) oldInstance.dispose();
          new bootstrap.Toast(successToastEl).show();
      }

      // ==========================================
      // SKELETON LOADING À PROVA DE BALAS (SEM CRASE/TEMPLATE STRING NO CLIENTE)
      // ==========================================
      function gerarSkeletonTabela(quantidade) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += '<tr class="align-middle">' +
                      '<td class="text-center py-1 px-2"><div class="skeleton-dark skeleton-btn-view" style="width: 20px; height: 20px;"></div></td>' +
                      '<td class="py-1 px-2">' +
                          '<div class="skeleton-dark skeleton-text-view" style="width: 60%; height: 12px; margin-bottom: 4px;"></div>' +
                          '<div class="skeleton-dark skeleton-text-view" style="width: 40%; height: 8px; margin-bottom: 0;"></div>' +
                      '</td>' +
                      '<td class="py-1 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 50%; height: 12px;"></div></td>' +
                      '<td class="py-1 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 40%; height: 12px;"></div></td>' +
                      '<td class="py-1 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 70%; height: 12px;"></div></td>' +
                      '<td class="text-end py-1 px-2"><div class="skeleton-dark skeleton-btn-view" style="width: 60px; height: 22px;"></div></td>' +
                      '</tr>';
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const tableContainer = document.querySelector('.content > .table-responsive');
          const emptyState = document.querySelector('.content > .text-center-empty');
          const paginacao = document.querySelector('.content > .pagnacao-container');

          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = '<div id="skeleton-temp-container" class="table-responsive bg-custom-darker rounded-3 shadow-sm border-custom mb-4 skeleton-container">' +
              '<table class="table table-sm align-middle mb-0" style="font-size: 0.75rem; border-collapse: separate; border-spacing: 0;">' +
                 '<thead>' +
                   '<tr>' +
                     '<th class="py-1 px-2 text-center border-0">Formato</th>' +
                     '<th class="py-1 px-2 border-0">Nome do Arquivo</th>' +
                     '<th class="py-1 px-2 border-0">Extensão</th>' +
                     '<th class="py-1 px-2 border-0">Tamanho</th>' +
                     '<th class="py-1 px-2 border-0">Data de Envio</th>' +
                     '<th class="py-1 px-2 text-end border-0">Ações</th>' +
                   '</tr>' +
                 '</thead>' +
                 '<tbody class="border-top-0">' +
                    gerarSkeletonTabela(5) +
                 '</tbody>' +
              '</table>' +
          '</div>';

          if (tableContainer && !tableContainer.classList.contains('skeleton-container')) {
              tableContainer.style.display = 'none';
              tableContainer.insertAdjacentHTML('beforebegin', skeletonHTML);
          } else if (emptyState) {
              emptyState.style.display = 'none';
              emptyState.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
          
          if (paginacao) paginacao.style.display = 'none';
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const tableContainer = document.querySelector('.content > .table-responsive');
          const emptyState = document.querySelector('.content > .text-center-empty');
          const paginacao = document.querySelector('.content > .pagnacao-container');

          if (tableContainer) tableContainer.style.display = '';
          if (emptyState) emptyState.style.display = '';
          if (paginacao) paginacao.style.display = '';
      }

      // Mostra o skeleton instantaneamente na carga (se necessário) e limpa logo a seguir
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
      // NAVEGAÇÃO AJAX (PAGINAÇÃO)
      // ==========================================
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
              } else {
                  mostrarToast('erro', 'Erro', 'Falha ao carregar a página.');
              }
          } catch (err) {
              mostrarToast('erro', 'Erro de Conexão', 'Falha ao carregar os dados. Verifique a rede.');
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      function atualizarModaisDinamicos(doc) {
          const staticModals = ['novoArquivoModal', 'sidebarMenu'];
          document.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) m.remove();
          });
          doc.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
          });
      }

      // ==========================================
      // RESPOSTAS E AVISOS DA URL
      // ==========================================
      document.addEventListener("DOMContentLoaded", () => {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('sucesso')) {
              const acao = urlParams.get('sucesso');
              if (acao === 'upload') {
                  mostrarToast('sucesso', 'Upload Concluído!', 'O arquivo foi enviado para o servidor com sucesso.');
              } else if (acao === 'excluido') {
                  mostrarToast('sucesso', 'Arquivo Apagado', 'O arquivo foi removido do servidor permanentemente.');
              }
              const url = new URL(window.location.href);
              url.searchParams.delete('sucesso');
              window.history.replaceState({}, document.title, url.toString());
          }

          if (urlParams.has('erro')) {
              const erro = urlParams.get('erro');
              if (erro === 'nofile') mostrarToast('erro', 'Atenção', 'Não selecionou nenhum arquivo para envio.');
              else mostrarToast('erro', 'Falha na Operação', 'Ocorreu um erro no servidor ao processar o seu pedido.');
              
              const url = new URL(window.location.href);
              url.searchParams.delete('erro');
              window.history.replaceState({}, document.title, url.toString());
          }
      });
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = downloadsView;