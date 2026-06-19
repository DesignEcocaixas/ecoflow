// views/gabaritosView.js
const menuLateral = require("./menuLateral");

module.exports = function renderGabaritos(usuario, gabaritos = []) {
    const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
    const menuHTML = menuLateral(user, "/admin/gabaritos"); 
    
    // Função auxiliar para corrigir caracteres de upload quebrados (ex: alÃ§a -> alça)
    const fixEncoding = (str) => {
        if (!str) return '';
        try {
            // Converte a string de volta para a codificação correta
            return decodeURIComponent(escape(str));
        } catch(e) {
            return str; // Caso não precise de correção
        }
    };

    // Função auxiliar para renderizar os cards dos gabaritos
    const renderGabaritosCards = () => {
        if (gabaritos.length === 0) {
            return `
            <div class="col-12 text-center py-5 bg-custom-darker rounded-3 shadow-sm border border-custom">
                <i class="fa-solid fa-folder-open fa-3x text-muted opacity-25 mb-3"></i>
                <h6 class="fw-bold text-white mb-1" style="font-size: 0.9rem;">Nenhum gabarito encontrado</h6>
                <p class="text-muted small">Faça o upload do seu primeiro arquivo .cdr ou .ai acima.</p>
            </div>`;
        }

        return gabaritos.map(gab => {
            const nomeCorreto = fixEncoding(gab.nome);
            
            const isCorel = nomeCorreto.toLowerCase().endsWith('.cdr');
            const isAi = nomeCorreto.toLowerCase().endsWith('.ai');
            
            const nomeExibicao = nomeCorreto.replace(/\.(cdr|ai)$/i, '');
            
            // Cores dinâmicas para o Dark Mode
            const corTemaTexto = isCorel ? 'text-success' : (isAi ? 'text-warning' : 'text-info');
            const corBadge = isCorel ? 'bg-success bg-opacity-10 text-success border-success border-opacity-50' : (isAi ? 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-50' : 'bg-info bg-opacity-10 text-info border-info border-opacity-50');
            const bgTemaIco = isCorel ? 'bg-success bg-opacity-10 border border-success border-opacity-25' : (isAi ? 'bg-warning bg-opacity-10 border border-warning border-opacity-25' : 'bg-info bg-opacity-10 border border-info border-opacity-25');
            const icone = isCorel ? 'fa-pen-nib' : (isAi ? 'fa-bezier-curve' : 'fa-file-lines');
            const labelTipo = isCorel ? 'CorelDraw' : (isAi ? 'Illustrator' : 'Arquivo');
            const borderLeftColor = isCorel ? '#198754' : (isAi ? '#ffc107' : '#0dcaf0');

            return `
            <div class="col-12 col-sm-6 col-md-4 col-xl-3 gabarito-card mb-3" data-nome="${nomeCorreto.toLowerCase()}">
                <div class="card erp-card shadow-sm h-100 border-custom" style="border-left: 4px solid ${borderLeftColor} !important;">
                    <div class="card-body p-4 flex-grow-1 d-flex flex-column align-items-center text-center position-relative">
                        
                        <span class="badge ${corBadge} border position-absolute top-0 start-0 m-2" style="font-size: 0.65rem;">
                            ${labelTipo}
                        </span>

                        <div class="rounded-circle ${bgTemaIco} d-flex align-items-center justify-content-center mb-3 mt-3 shadow-sm transition-hover-icon" style="width: 60px; height: 60px;">
                            <i class="fa-solid ${icone} fs-4 ${corTemaTexto}"></i>
                        </div>
                        
                        <h6 class="fw-bold text-white mb-1 text-truncate w-100" style="font-size: 0.85rem;" title="${nomeCorreto}">
                            ${nomeExibicao}
                        </h6>
                        <p class="text-muted text-truncate w-100 mb-0" style="font-size: 0.7rem;" title="Arquivo: ${nomeCorreto}">Arquivo: ${nomeCorreto}</p>
                    </div>
                    
                    <div class="card-footer bg-custom-darker border-top border-custom p-3 d-flex gap-2">
                        <a href="${gab.url}" download="${nomeCorreto}" class="btn btn-sm btn-primary flex-grow-1 fw-bold shadow-sm text-dark">
                            <i class="fa-solid fa-download me-1"></i> Baixar
                        </a>
                        
                        <button type="button" class="btn btn-sm btn-outline-danger shadow-sm h-100" data-bs-toggle="modal" data-bs-target="#excluirModal${gab.id}" title="Excluir Gabarito">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    };

    // Modal de exclusão para cada gabarito (evitando o alert padrão)
    const modaisExclusao = gabaritos.map(gab => `
        <div class="modal fade" id="excluirModal${gab.id}" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog modal-sm modal-dialog-centered">
            <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
              <form method="POST" action="/admin/gabaritos/delete/${gab.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Gabarito Excluído!')">
                <div class="modal-body text-center p-4">
                  <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                  <h6 class="mb-2 fw-bold text-white" style="font-size: 0.9rem;">Excluir Gabarito?</h6>
                  <p class="text-muted mb-0" style="font-size:0.8rem;">Tem certeza que deseja excluir permanentemente o arquivo <b>${fixEncoding(gab.nome)}</b>?</p>
                </div>
                <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
                  <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
                  <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Sim, Excluir</button>
                </div>
              </form>
            </div>
          </div>
        </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Gabaritos | Ecoflow</title>
        <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            /* Scrollbars Globais (Dark & Green) */
            ::-webkit-scrollbar { width: 5px; height: 5px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
            html, body, .content, .modal-body, .offcanvas-body { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

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

            /* Estilos Específicos dos Cards de Gabarito */
            .erp-card { border-radius: 12px; transition: transform 0.2s; overflow: hidden; background-color: #2a2a2a; }
            .erp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.3) !important; border-color: rgba(255,255,255,0.15) !important; }
            .transition-hover-icon { transition: transform 0.3s; }
            .erp-card:hover .transition-hover-icon { transform: scale(1.15); }
            
            .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
            .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }

            /* Ajuste visual do Input de Arquivo (Dark Mode) */
            input[type=file]::file-selector-button {
                background: #08c068;
                color: #1f1f1f;
                border: none;
                padding: 0.375rem 0.75rem;
                border-radius: 0.25rem;
                margin-right: 10px;
                cursor: pointer;
                transition: background-color 0.2s;
                font-weight: bold;
                font-size: 0.75rem;
            }
            input[type=file]::file-selector-button:hover { background: #06a055; color: #ffffff; }

            /* ANIMAÇÃO DE ENTRADA E SAÍDA DO TOAST */
            .toast {
                transform: translateX(120%);
                transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important;
            }
            .toast.showing, .toast.show {
                transform: translateX(0);
            }

            /* ANIMAÇÃO DE ENTRADA E SAÍDA DOS MODAIS */
            .modal.fade .modal-dialog {
                transform: scale(0.85) translateY(30px);
                transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            }
            .modal.show .modal-dialog {
                transform: scale(1) translateY(0);
            }

            /* CSS DAS BARRAS DE TEMPO ANIMADAS DOS TOASTS */
            .toast-timer {
                height: 4px;
                background: #08c068;
                width: 100%;
                position: absolute;
                bottom: 0;
                left: 0;
                transform-origin: left;
            }
            @keyframes shrinkToast {
                from { width: 100%; }
                to { width: 0%; }
            }

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
            .skeleton-btn-view { height: 26px; width: 100%; border-radius: 4px; display: inline-block; }
            .skeleton-icon-view { height: 60px; width: 60px; border-radius: 50%; margin: 0 auto 16px auto; }
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
            </div>
        </div>

        <div class="content">
            
            <div class="d-flex align-items-center justify-content-between mb-4">
                <div class="d-flex align-items-center gap-3">
                    <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
                    <div>
                        <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-folder-open text-muted me-2"></i>Gabaritos de Caixas</h5>
                        <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.7rem;">Gerencie os arquivos base (.cdr e .ai) para criação das artes.</span>
                    </div>
                </div>
            </div>

            <div class="bg-custom-darker p-4 rounded-3 shadow-sm border border-custom mb-4">
                <h6 class="text-white fw-bold mb-3 border-bottom border-custom pb-2" style="font-size: 0.85rem;"><i class="fa-solid fa-cloud-arrow-up text-accent me-2"></i> Adicionar Novo Gabarito</h6>
                
                <form action="/admin/gabaritos/upload" method="POST" enctype="multipart/form-data" class="d-flex flex-column flex-md-row gap-3 align-items-md-center" onsubmit="prepararSubmissaoSimples(event, this, 'Gabarito Salvo com Sucesso!')">
                    <div class="flex-grow-1">
                        <input type="file" name="arquivo_gabarito" accept=".cdr, .ai" class="form-control form-control-sm shadow-sm" required>
                    </div>
                    
                    <button type="submit" class="btn btn-sm btn-primary fw-bold shadow-sm px-4 py-2 text-dark text-nowrap">
                        <i class="fa-solid fa-upload me-1"></i> Salvar Gabarito
                    </button>
                </form>
                <div class="text-muted mt-2" style="font-size: 0.7rem;"><i class="fa-solid fa-circle-info me-1"></i> Formatos aceitos: <strong>.cdr</strong> (CorelDraw) e <strong>.ai</strong> (Adobe Illustrator).</div>
            </div>

            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3 border-bottom border-custom pb-3">
                <h6 class="fw-bold text-white mb-0" style="font-size: 0.85rem;"><i class="fa-solid fa-layer-group text-muted me-2"></i> Arquivos Disponíveis</h6>
                
                ${gabaritos.length > 0 ? `
                <div class="input-group input-group-sm w-100 shadow-sm" style="max-width: 300px;">
                    <span class="input-group-text bg-custom-darker border-custom border-end-0"><i class="fa-solid fa-search text-muted"></i></span>
                    <input type="text" id="buscaGabarito" onkeyup="filtrarGabaritos()" class="form-control border-start-0 border-custom bg-custom-darker text-white ps-0" placeholder="Buscar por nome...">
                </div>
                ` : ''}
            </div>
                
            <div class="row g-3" id="gridGabaritos">
                ${renderGabaritosCards()}
            </div>

            <div id="emptySearch" class="col-12 text-center py-5 bg-custom-darker rounded-3 shadow-sm border border-custom mt-3" style="display: none;">
                <i class="fa-solid fa-search fa-3x text-muted opacity-25 mb-3"></i>
                <h6 class="fw-bold text-white" style="font-size: 0.9rem;">Nenhum gabarito encontrado</h6>
                <p class="text-muted small mb-0" style="font-size: 0.75rem;">Tente buscar com outras palavras-chave.</p>
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

        ${modaisExclusao}

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        <script>
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

            function mostrarToastCarregando(mensagem) {
                const successToastEl = document.getElementById('sucessoToast');
                document.getElementById('sucessoTitulo').innerText = "A Processar";
                document.getElementById('sucessoSub').innerText = mensagem;
                successToastEl.setAttribute('data-bs-autohide', 'false');

                const timerEl = document.getElementById('sucessoTimer');
                if (timerEl) timerEl.style.display = 'none';

                const oldInstance = bootstrap.Toast.getInstance(successToastEl);
                if (oldInstance) oldInstance.dispose();
                const successToast = new bootstrap.Toast(successToastEl);
                successToast.show();
            }

            // =======================================================================
            // SKELETON LOADING
            // =======================================================================
            function gerarSkeletonCards(quantidade = 4) {
                let html = '';
                for(let i=0; i<quantidade; i++) {
                    html += \`
                    <div class="col-12 col-sm-6 col-md-4 col-xl-3 mb-3">
                        <div class="card erp-card bg-custom-darker border-custom shadow-sm h-100 p-4">
                            <div class="skeleton-dark skeleton-icon-view"></div>
                            <div class="skeleton-dark skeleton-text-view" style="width: 80%; margin: 0 auto 8px auto;"></div>
                            <div class="skeleton-dark skeleton-text-view" style="width: 60%; margin: 0 auto 20px auto;"></div>
                            <div class="d-flex gap-2 w-100 mt-auto pt-3">
                                <div class="skeleton-dark skeleton-btn-view" style="flex-grow: 1;"></div>
                                <div class="skeleton-dark skeleton-btn-view" style="width: 32px; flex-shrink: 0;"></div>
                            </div>
                        </div>
                    </div>\`;
                }
                return html;
            }

            function mostrarSkeletonGlobais() {
                const gridContainer = document.getElementById('gridGabaritos');
                const emptyState = document.getElementById('emptySearch');
                
                if (document.getElementById('skeleton-temp-container')) return;

                const skeletonHTML = \`
                <div id="skeleton-temp-container" class="row g-3 skeleton-container">
                    \${gerarSkeletonCards(4)}
                </div>\`;

                if (gridContainer && !gridContainer.classList.contains('skeleton-container')) {
                    gridContainer.style.display = 'none';
                    gridContainer.insertAdjacentHTML('beforebegin', skeletonHTML);
                }
                
                if (emptyState) emptyState.style.display = 'none';
            }

            function ocultarSkeletonGlobais() {
                const tempSkeleton = document.getElementById('skeleton-temp-container');
                if (tempSkeleton) tempSkeleton.remove();

                const gridContainer = document.getElementById('gridGabaritos');
                if (gridContainer) gridContainer.style.display = 'flex';
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

            // =======================================================================
            // SUBMISSÃO AJAX (SEM RELOAD DE PÁGINA) COM SUPORTE A ARQUIVOS
            // =======================================================================
            let isSubmitting = false;

            async function prepararSubmissaoSimples(event, form, titleMsg) {
                if (event) event.preventDefault();
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                if (isSubmitting) return;

                // Esconde modal de exclusão (se existir)
                const modalEl = form.closest('.modal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
                    modal.hide();
                }

                document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                document.body.classList.remove('modal-open');
                document.body.style = '';

                mostrarToastCarregando('Por favor, aguarde...');
                isSubmitting = true;

                try {
                    const formData = new FormData(form);

                    const response = await fetch(form.action, {
                        method: form.method || 'POST',
                        body: formData 
                    });

                    if (response.ok) {
                        const html = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');

                        // 1. Atualizar conteúdo principal
                        const oldContent = document.querySelector('.content');
                        const newContent = doc.querySelector('.content');
                        if (oldContent && newContent) {
                            oldContent.innerHTML = newContent.innerHTML;
                        }

                        // 2. Atualizar Modais de Exclusão
                        const staticModals = ['sidebarMenu'];
                        document.querySelectorAll('.modal').forEach(m => {
                            if (!staticModals.includes(m.id)) m.remove();
                        });
                        doc.querySelectorAll('.modal').forEach(m => {
                            if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
                        });

                        form.reset();
                        mostrarToast('sucesso', 'Concluído!', titleMsg);
                    } else {
                        mostrarToast('erro', 'Erro', 'Não foi possível completar a ação no servidor.');
                    }
                } catch (err) {
                    console.error(err);
                    mostrarToast('erro', 'Falha de Conexão', 'Verifique a sua rede e tente novamente.');
                } finally {
                    isSubmitting = false;
                }
            }

            // =======================================================================
            // FUNÇÃO PARA FILTRAR OS CARDS (SEARCH)
            // =======================================================================
            function filtrarGabaritos() {
                const input = document.getElementById('buscaGabarito').value.toLowerCase();
                const cards = document.querySelectorAll('.gabarito-card');
                const emptyState = document.getElementById('emptySearch');
                let visiveis = 0;

                cards.forEach(card => {
                    const nomeArquivo = card.getAttribute('data-nome');
                    if (nomeArquivo.includes(input)) {
                        card.style.display = ''; 
                        visiveis++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                if (emptyState) {
                    emptyState.style.display = visiveis === 0 ? 'block' : 'none';
                }
            }
        </script>
        <script src="./script/checkLogin.js"></script>
    </body>
    </html>
    `;
};