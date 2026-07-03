// views/qrGeneratorView.js
const menuLateral = require("./menuLateral");

function qrGeneratorView(usuario, qrCodes = []) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const menuHTML = menuLateral(user, "/qr-generator");

  const fmtData = (d) => {
    try {
      if (!d) return "-";
      const dt = new Date(d);
      return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    } catch {
      return d || "-";
    }
  };

  const escapeHtmlAttr = (str) => {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const qrCodesJsonStr = escapeHtmlAttr(JSON.stringify(qrCodes));

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Gerador de QR Codes | ERP Ecoflow</title>
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

      body { display: flex; height: 100vh; margin: 0; background-color: #1f1f1f; color: #ffffff; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
      .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column; }
      .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; background-color: #1f1f1f; display: flex; flex-direction: column; }
      
      /* Tema Escuro Customizado */
      .bg-custom-dark { background-color: #2a2a2a !important; }
      .bg-custom-darker { background-color: #222222 !important; }
      .border-custom { border-color: rgba(255,255,255,0.08) !important; border-width: 1px; }
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
      .form-control::placeholder { color: rgba(255, 255, 255, 0.38) !important; opacity: 1; }

      /* ERP Cards (Efeito Hover Removido e Tamanho Reduzido) */
      .erp-card { border-radius: 10px; overflow: hidden; background-color: #2a2a2a; border: 1px solid rgba(255,255,255,0.08); }
      
      /* Modals */
      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
      .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }

      /* QR Code Box Compacta */
      .qr-preview-box { background: #ffffff; padding: 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.25); }
      .qr-preview-box img { max-width: 110px; height: auto !important; }

      /* Paginação Centralizada */
      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); font-size: 0.8rem; cursor: pointer; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; border-color: rgba(255,255,255,0.2); }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f; font-weight: bold; }
      .pagination .page-item.disabled .page-link { background-color: #1a1a1a; color: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.05); }

      /* ANIMAÇÕES GLOBAIS */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      .modal.fade .modal-dialog { transform: scale(0.85) translateY(30px); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
      .modal.show .modal-dialog { transform: scale(1) translateY(0); }

      /* SKELETON LOADING */
      .skeleton-dark {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%) !important;
          background-size: 200% 100% !important;
          animation: skeleton-loading-view 1.5s infinite linear !important;
          border-radius: 4px; color: transparent !important; border-color: transparent !important; pointer-events: none;
      }
      .skeleton-dark * { visibility: hidden !important; }
      @keyframes skeleton-loading-view { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 16px; }
      }
      .offcanvas { background-color: #1f1f1f !important; }
    </style>
  </head>
  <body>
    <input type="hidden" id="qrcodes-data-input" value="${qrCodesJsonStr}">

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
      
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-qrcode text-accent me-2"></i>Gerador de QR Codes</h5>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Crie, gerencie e baixe QR Codes vetoriais (SVG) para os seus links</span>
            </div>
        </div>
        <button class="btn btn-sm btn-success px-3 shadow-sm fw-bold text-dark" style="font-size: 0.8rem;" data-bs-toggle="modal" data-bs-target="#modalCriarQRCode">
            <i class="fa-solid fa-plus me-1"></i> Criar QR Code
        </button>
      </div>

      <div class="card bg-custom-darker p-3 rounded-3 shadow-sm border border-custom mb-4">
        <div class="row g-2 align-items-center justify-content-between">
          <div class="col-12 col-md-6 col-lg-5">
            <div class="input-group input-group-sm shadow-sm">
              <span class="input-group-text bg-custom-dark border-custom text-accent"><i class="fa-solid fa-magnifying-glass"></i></span>
              <input type="text" id="searchInputQR" class="form-control border-custom bg-custom-dark text-white" placeholder="Pesquisar por título ou link..." oninput="filtrarQRCodes()">
              <button class="btn btn-outline-secondary border-custom bg-custom-dark text-danger" type="button" id="clearSearchBtn" onclick="limparPesquisaQR()" style="display: none;"><i class="fa-solid fa-xmark"></i></button>
            </div>
          </div>
          <div class="col-12 col-md-auto text-md-end mt-2 mt-md-0">
            <span class="text-muted" style="font-size:0.8rem;">Exibindo <strong class="text-white" id="countExibidos">0</strong> de <strong class="text-white" id="countTotal">0</strong> QR Codes</span>
          </div>
        </div>
      </div>

      <div class="row g-3 flex-grow-1 align-content-start" id="gridQRCodes">
        </div>

      <div id="emptyStateQR" class="text-center text-muted py-5 my-auto d-none">
        <i class="fa-solid fa-qrcode fa-3x opacity-25 mb-3 d-block"></i>
        <span style="font-size: 0.85rem;">Nenhum QR Code encontrado.</span>
        <p class="text-muted small mt-1">Clique em "Criar QR Code" para gerar o seu primeiro link.</p>
      </div>

      <nav class="mt-4 d-flex flex-column align-items-center justify-content-center gap-2 border-top border-custom pt-3" id="paginationContainer">
        <ul class="pagination pagination-sm mb-0 shadow-sm" id="paginationList"></ul>
        <div class="text-muted" style="font-size: 0.72rem;" id="paginationInfo">Página 1 de 1</div>
      </nav>

    </div>

    <div class="modal fade" id="modalCriarQRCode" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form method="POST" action="/qr-generator/novo" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" id="formNovoQRCode" onsubmit="salvarQRCodeSistema(event, this)">
          <div class="modal-header bg-custom-darker border-custom">
            <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-wand-magic-sparkles text-accent me-2"></i> Criar Novo QR Code</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" onclick="resetFormQR()"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            
            <div class="mb-3">
              <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Título</label>
              <input type="text" name="titulo" id="inputTituloQR" class="form-control form-control-sm shadow-sm" placeholder="Ex: Catálogo de Produtos 2026" required maxlength="100">
            </div>

            <div class="mb-3">
              <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Link/URL</label>
              <div class="input-group input-group-sm shadow-sm">
                <span class="input-group-text bg-custom-darker border-custom text-muted"><i class="fa-solid fa-link"></i></span>
                <input type="url" name="link" id="inputLinkQR" class="form-control border-custom bg-custom-darker text-white" placeholder="https://seudominio.com.br/pagina" required oninput="gerarPreviewInstantaneo()">
              </div>
            </div>

            <div class="row g-2 mb-4">
              <div class="col-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Cor Principal</label>
                <input type="color" id="inputCorQR" class="form-control form-control-sm form-control-color w-100 bg-custom-darker border-custom" value="#000000" onchange="gerarPreviewInstantaneo()">
              </div>
              <div class="col-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Nível de Correção</label>
                <select id="inputCorrecaoQR" class="form-select form-select-sm bg-custom-darker border-custom text-white" onchange="gerarPreviewInstantaneo()">
                  <option value="H" selected>Alto (Melhor p/ impressão)</option>
                  <option value="M">Médio (Padrão)</option>
                  <option value="L">Baixo (Mais compacto)</option>
                </select>
              </div>
            </div>

            <div class="text-center p-3 border border-custom rounded bg-custom-darker position-relative">
              <span class="text-muted d-block fw-bold mb-2" style="font-size:0.7rem;"><i class="fa-solid fa-eye text-accent me-1"></i> PRÉ-VISUALIZAÇÃO</span>
              
              <div id="previewQRBox" class="qr-preview-box my-2" style="display: none;">
                <div id="qrcodePreview"></div>
              </div>

              <div id="placeholderPreview" class="text-muted py-4 small">
                Digite um link acima para gerar o vetor SVG no servidor.
              </div>

              <div class="mt-3 justify-content-center gap-2" id="boxDownloadPreview" style="display: none !important;">
                <button type="button" class="btn btn-sm btn-outline-success fw-bold px-3 shadow-sm" onclick="baixarSVGPreview()">
                  <i class="fa-solid fa-download me-1"></i> Baixar SVG
                </button>
              </div>
            </div>

          </div>
          <div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal" onclick="resetFormQR()">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary fw-bold text-dark w-100 shadow-sm" id="btnSalvarQR"><i class="fa-solid fa-save me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="modalExcluirQR" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <form method="POST" action="" id="formExcluirQR" class="modal-content erp-modal border-0 shadow-lg bg-custom-darker" onsubmit="prepararExclusaoQR(event, this)">
          <div class="modal-body text-center p-4">
            <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
            <h6 class="mb-2 fw-bold text-white" style="font-size: 0.9rem;">Excluir QR Code?</h6>
            <p class="text-muted mb-0" style="font-size:0.8rem;">Tem certeza que deseja remover o item <b id="nomeExcluirQR"></b>?</p>
          </div>
          <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-danger fw-bold w-100 shadow-sm">Excluir</button>
          </div>
        </form>
      </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 3000;">
      <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
          <div><i class="fa-solid fa-circle-check fs-5 me-2 text-accent"></i><strong class="fs-6" id="sucessoTitulo">Concluído!</strong></div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body pt-1 pb-4 px-3"><p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="sucessoSub">Operação realizada com sucesso.</p></div>
        <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none;"></div>
      </div>

      <div id="erroToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(220,53,69,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
          <div><i class="fa-solid fa-circle-xmark fs-5 me-2 text-danger"></i><strong class="fs-6" id="erroTitulo">Erro!</strong></div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body pt-1 pb-4 px-3"><p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="erroSub">Ocorreu um erro ao processar.</p></div>
        <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

    <script>
      // ==========================================
      // ESCAPE CLIENT-SIDE (Evita erros em atributos HTML)
      // ==========================================
      function escapeHtmlAttr(str) {
        return String(str || '')
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }

      let listaQRCodes = JSON.parse(document.getElementById('qrcodes-data-input').value || '[]');
      let listaFiltrada = [...listaQRCodes];
      let paginaAtual = 1;
      const itensPorPagina = 8; // 8 cards por página

      // ==========================================
      // TOAST E SKELETON
      // ==========================================
      function mostrarToast(tipo, titulo, mensagem) {
        const toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
        if (toastEl) {
          document.getElementById(tipo === 'sucesso' ? 'sucessoTitulo' : 'erroTitulo').innerText = titulo;
          document.getElementById(tipo === 'sucesso' ? 'sucessoSub' : 'erroSub').innerText = mensagem;
          const timerEl = document.getElementById(tipo === 'sucesso' ? 'sucessoTimer' : 'erroTimer');
          if (timerEl) { timerEl.style.display = 'block'; timerEl.style.animation = 'none'; void timerEl.offsetWidth; timerEl.style.animation = 'shrinkToast 5s linear forwards'; }
          const oldInstance = bootstrap.Toast.getInstance(toastEl);
          if (oldInstance) oldInstance.dispose();
          new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 }).show();
        }
      }

      function mostrarSkeleton() {
        const grid = document.getElementById('gridQRCodes');
        let html = '';
        for(let i = 0; i < 4; i++) {
          html += \`
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
              <div class="card erp-card p-2 h-100">
                <div class="skeleton-dark mb-2 mx-auto" style="width: 110px; height: 110px; border-radius: 6px;"></div>
                <div class="skeleton-dark mb-2" style="height: 16px; width: 80%;"></div>
                <div class="skeleton-dark mb-2" style="height: 12px; width: 100%;"></div>
                <div class="skeleton-dark mt-auto" style="height: 28px; width: 100%;"></div>
              </div>
            </div>\`;
        }
        grid.innerHTML = html;
      }

      // ==========================================
      // PREVIEW VIA NODE.JS (SVG)
      // ==========================================
      let previewTimeout = null;

      function gerarPreviewInstantaneo() {
        const link = document.getElementById('inputLinkQR').value.trim();
        const cor = document.getElementById('inputCorQR').value || '#000000';
        const correcao = document.getElementById('inputCorrecaoQR').value || 'H';
        const boxDownload = document.getElementById('boxDownloadPreview');
        const placeholder = document.getElementById('placeholderPreview');
        const previewBox = document.getElementById('previewQRBox');
        const previewContainer = document.getElementById('qrcodePreview');

        if (!link) {
          previewContainer.innerHTML = '';
          previewBox.style.display = 'none';
          placeholder.style.display = 'block';
          boxDownload.style.setProperty('display', 'none', 'important');
          return;
        }

        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(async () => {
          try {
            const resp = await fetch('/qr-generator/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ link, cor, correcao })
            });
            const data = await resp.json();

            if (data.success && data.image) {
              placeholder.style.display = 'none';
              previewBox.style.display = 'inline-flex';
              boxDownload.style.setProperty('display', 'flex', 'important');
              previewContainer.innerHTML = \`<img id="previewImgElement" src="\${data.image}" class="img-fluid rounded" style="max-width: 140px;">\`;
            }
          } catch (err) {
            console.error("Erro na busca do preview:", err);
          }
        }, 300);
      }

      function baixarSVGPreview() {
        const img = document.getElementById('previewImgElement');
        const titulo = document.getElementById('inputTituloQR').value.trim() || 'sem-titulo';
        const tituloLimpo = titulo.replace(/[^a-zA-Z0-9À-ÿ_-]/g, '-').replace(/-+/g, '-').toLowerCase();
        const nomeArquivo = \`qr-code-\${tituloLimpo}.svg\`;

        if (img && img.src) {
          const link = document.createElement('a');
          link.download = nomeArquivo;
          link.href = img.src;
          link.click();
          mostrarToast('sucesso', 'Download Concluído', 'O vetor SVG foi salvo.');
        }
      }

      function resetFormQR() {
        document.getElementById('formNovoQRCode').reset();
        document.getElementById('qrcodePreview').innerHTML = '';
        document.getElementById('previewQRBox').style.display = 'none';
        document.getElementById('placeholderPreview').style.display = 'block';
        document.getElementById('boxDownloadPreview').style.setProperty('display', 'none', 'important');
      }

      // ==========================================
      // RENDERIZAÇÃO DOS CARDS COMPACTOS
      // ==========================================
      function renderizarGrid() {
        const grid = document.getElementById('gridQRCodes');
        const emptyState = document.getElementById('emptyStateQR');
        const paginationContainer = document.getElementById('paginationContainer');

        document.getElementById('countTotal').innerText = listaQRCodes.length;
        document.getElementById('countExibidos').innerText = listaFiltrada.length;

        if (listaFiltrada.length === 0) {
          grid.innerHTML = '';
          emptyState.classList.remove('d-none');
          paginationContainer.classList.add('d-none');
          return;
        }

        emptyState.classList.add('d-none');
        paginationContainer.classList.remove('d-none');

        const totalPaginas = Math.ceil(listaFiltrada.length / itensPorPagina) || 1;
        if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

        const inicio = (paginaAtual - 1) * itensPorPagina;
        const itensPagina = listaFiltrada.slice(inicio, inicio + itensPorPagina);

        grid.innerHTML = itensPagina.map(item => {
          const dataCriacao = item.criado_em ? new Date(item.criado_em).toLocaleDateString('pt-BR') : 'Hoje';
          const imgHtml = item.imagemBase64 
            ? \`<img src="\${item.imagemBase64}" alt="QR Code" class="img-fluid" style="max-width: 110px;">\` 
            : \`<span class="text-muted small">Gerando...</span>\`;
          
          return \`
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
              <div class="card erp-card shadow-sm h-100 d-flex flex-column p-2">
                
                <div class="text-center my-2">
                  <div class="qr-preview-box">
                    \${imgHtml}
                  </div>
                </div>

                <div class="px-1 flex-grow-1">
                  <h6 class="fw-bold text-white text-truncate mb-1" style="font-size:0.82rem;" title="\${escapeHtmlAttr(item.titulo)}">\${escapeHtmlAttr(item.titulo)}</h6>
                  
                  <a href="\${item.link}" target="_blank" class="text-accent text-truncate d-block text-decoration-none" style="font-size:0.72rem;" title="Abrir link no navegador">
                    <i class="fa-solid fa-external-link-alt me-1" style="font-size:0.65rem;"></i>\${escapeHtmlAttr(item.link)}
                  </a>
                  <span class="text-muted d-block mt-1 mb-2" style="font-size: 0.65rem;"><i class="fa-regular fa-calendar me-1"></i>Criado em \${dataCriacao}</span>
                </div>

                <div class="pt-2 border-top border-custom d-flex gap-1">
                  <button type="button" class="btn btn-sm btn-primary fw-bold flex-grow-1 text-dark shadow-sm py-1" style="font-size:0.75rem;" onclick="baixarQRCodeCard('\${item.imagemBase64}', '\${escapeHtmlAttr(item.titulo)}')">
                    <i class="fa-solid fa-download me-1"></i> Baixar SVG
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger px-2 py-1" style="font-size:0.75rem;" onclick="abrirModalExcluir(\${item.id}, '\${escapeHtmlAttr(item.titulo)}')">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>

              </div>
            </div>\`;
        }).join('');

        renderizarControlesPaginacao(totalPaginas);
      }

      function baixarQRCodeCard(base64, titulo) {
        if (!base64 || base64 === 'undefined') return;
        const tituloLimpo = (titulo || 'sem-titulo').replace(/[^a-zA-Z0-9À-ÿ_-]/g, '-').replace(/-+/g, '-').toLowerCase();
        const nomeArquivo = \`qr-code-\${tituloLimpo}.svg\`;
        
        const link = document.createElement('a');
        link.download = nomeArquivo;
        link.href = base64;
        link.click();
        mostrarToast('sucesso', 'Download Concluído', 'O arquivo ' + nomeArquivo + ' foi salvo.');
      }

      function renderizarControlesPaginacao(totalPaginas) {
        const ul = document.getElementById('paginationList');
        document.getElementById('paginationInfo').innerText = \`Página \${paginaAtual} de \${totalPaginas}\`;

        let botoes = '';
        botoes += \`<li class="page-item \${paginaAtual === 1 ? 'disabled' : ''}"><a class="page-link" onclick="mudarPagina(\${paginaAtual - 1})"><i class="fa-solid fa-chevron-left"></i></a></li>\`;

        let inicioPag = Math.max(1, paginaAtual - 2);
        let fimPag = Math.min(totalPaginas, inicioPag + 4);
        if (fimPag - inicioPag < 4) inicioPag = Math.max(1, fimPag - 4);

        for (let p = inicioPag; p <= fimPag; p++) {
          botoes += \`<li class="page-item \${p === paginaAtual ? 'active' : ''}"><a class="page-link" onclick="mudarPagina(\${p})">\${p}</a></li>\`;
        }

        botoes += \`<li class="page-item \${paginaAtual === totalPaginas ? 'disabled' : ''}"><a class="page-link" onclick="mudarPagina(\${paginaAtual + 1})"><i class="fa-solid fa-chevron-right"></i></a></li>\`;
        ul.innerHTML = botoes;
      }

      function mudarPagina(novaPagina) {
        const totalPaginas = Math.ceil(listaFiltrada.length / itensPorPagina) || 1;
        if (novaPagina < 1 || novaPagina > totalPaginas || novaPagina === paginaAtual) return;
        paginaAtual = novaPagina;
        renderizarGrid();
        document.querySelector('.content').scrollTo({ top: 0, behavior: 'smooth' });
      }

      // ==========================================
      // PESQUISA E FILTROS
      // ==========================================
      function filtrarQRCodes() {
        const termo = document.getElementById('searchInputQR').value.toLowerCase().trim();
        const clearBtn = document.getElementById('clearSearchBtn');

        clearBtn.style.display = termo.length > 0 ? 'block' : 'none';

        if (!termo) {
          listaFiltrada = [...listaQRCodes];
        } else {
          listaFiltrada = listaQRCodes.filter(item => 
            (item.titulo && item.titulo.toLowerCase().includes(termo)) ||
            (item.link && item.link.toLowerCase().includes(termo))
          );
        }

        paginaAtual = 1;
        renderizarGrid();
      }

      function limparPesquisaQR() {
        document.getElementById('searchInputQR').value = '';
        filtrarQRCodes();
      }

      // ==========================================
      // AÇÕES AJAX (SALVAR E EXCLUIR)
      // ==========================================
      async function salvarQRCodeSistema(e, form) {
        e.preventDefault();
        const titulo = document.getElementById('inputTituloQR').value.trim();
        const link = document.getElementById('inputLinkQR').value.trim();
        const cor = document.getElementById('inputCorQR').value;

        if (!titulo || !link) return;

        try {
          const resp = await fetch('/qr-generator/novo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, link, cor })
          });

          if (resp.ok) {
            const novoItem = await resp.json();
            if (novoItem.success && novoItem.qrCode) {
              listaQRCodes.unshift(novoItem.qrCode);
            } else {
              window.location.reload();
              return;
            }
          }
        } catch (err) {
          console.error("Erro ao salvar:", err);
        }

        bootstrap.Modal.getInstance(document.getElementById('modalCriarQRCode')).hide();
        resetFormQR();
        limparPesquisaQR();
        mostrarToast('sucesso', 'QR Code Gerado!', 'O novo link foi adicionado em formato SVG.');
      }

      function abrirModalExcluir(id, titulo) {
        document.getElementById('nomeExcluirQR').innerText = titulo;
        document.getElementById('formExcluirQR').action = '/qr-generator/excluir/' + id;
        document.getElementById('formExcluirQR').dataset.deleteId = id;
        new bootstrap.Modal(document.getElementById('modalExcluirQR')).show();
      }

      async function prepararExclusaoQR(e, form) {
        e.preventDefault();
        const id = Number(form.dataset.deleteId);

        try {
          await fetch(form.action, { method: 'POST' });
        } catch (err) { console.error("Erro na exclusão:", err); }

        listaQRCodes = listaQRCodes.filter(item => item.id !== id);
        bootstrap.Modal.getInstance(document.getElementById('modalExcluirQR')).hide();
        filtrarQRCodes();
        mostrarToast('sucesso', 'Item Removido', 'O QR Code foi excluído da lista.');
      }

      // Inicialização
      document.addEventListener('DOMContentLoaded', () => {
        mostrarSkeleton();
        setTimeout(renderizarGrid, 200);
      });
    </script>
  </body>
  </html>
  `;
}

module.exports = qrGeneratorView;