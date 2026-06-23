// views/testesView.js
const menuLateral = require("./menuLateral");

function renderTestesView(usuarioLogado, rotasEncontradas) {
    const user = usuarioLogado || { nome: "Desenvolvedor", tipo_usuario: "admin" };
    const menuHTML = menuLateral(user, "/dev/testes");

    // 1. Motor de Agrupamento Dinâmico Inteligente
    const gruposMapeados = {};

    rotasEncontradas.forEach(r => {
        let nomeGrupo = 'Geral'; 
        
        const stringBase = (r.prefixoAuto && r.prefixoAuto !== '/') ? r.prefixoAuto : r.rota;

        if (stringBase && stringBase !== '/') {
            const partes = stringBase.split('/').filter(p => p.trim() !== '' && !p.includes(':'));
            if (partes.length > 0) {
                nomeGrupo = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
            }
        }

        if (!gruposMapeados[nomeGrupo]) {
            gruposMapeados[nomeGrupo] = [];
        }

        gruposMapeados[nomeGrupo].push(r);
    });

    // 2. Função auxiliar geradora da lista de rotas
    const gerarHtmlListaRotas = (listaRotas, idGrupo) => {
        if (listaRotas.length === 0) return '';

        return listaRotas.map((r, index) => {
            let badgeColorClass = 'badge-secondary';
            if (r.metodo === 'GET') badgeColorClass = 'badge-get';
            if (r.metodo === 'POST') badgeColorClass = 'badge-post';
            if (['PUT', 'PATCH'].includes(r.metodo)) badgeColorClass = 'badge-put';
            if (r.metodo === 'DELETE') badgeColorClass = 'badge-delete';

            const prefixoInfo = r.prefixoAuto 
                ? `<span class="badge bg-custom-darker border border-custom text-info shadow-sm ms-2" style="font-size:0.6rem;">Prefixo: ${r.prefixoAuto}</span>` 
                : `<span class="badge bg-custom-darker border border-custom text-white-50 shadow-sm ms-2" style="font-size:0.6rem;">Raiz '/'</span>`;

            let inputsParamsHTML = '';
            if (r.params && r.params.length > 0) {
                r.params.forEach(p => {
                    inputsParamsHTML += `
                        <div class="col-12 col-md-4 mb-2">
                            <label class="form-label text-white-50 fw-bold mb-1" style="font-size: 0.65rem;">${p} (Param)</label>
                            <input type="text" class="form-control form-control-sm text-info font-monospace param-input p-1 px-2" data-param="${p}" placeholder="Ex: 1">
                        </div>
                    `;
                });
            }

            const bodyHTML = ['POST', 'PUT', 'PATCH'].includes(r.metodo) ? `
                <div class="col-12 mb-2 mt-1">
                    <label class="form-label text-white-50 fw-bold mb-1" style="font-size: 0.65rem;">Payload (JSON Body)</label>
                    <textarea class="form-control form-control-sm font-monospace shadow-sm payload-input p-2" style="color: #08c068 !important; min-height: 90px; font-size: 0.75rem;">${r.payloadDefault}</textarea>
                </div>
            ` : '';

            return `
            <div class="accordion-item mb-2 bg-custom-dark border border-custom rounded shadow-sm overflow-hidden" style="border-radius: 6px !important;">
                <h2 class="accordion-header" id="heading_${idGrupo}_${index}">
                    <button class="accordion-button collapsed bg-custom-dark text-white p-2 px-3 shadow-none border-0" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_${idGrupo}_${index}">
                        <div class="d-flex w-100 flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 pe-3">
                            <div class="d-flex align-items-center w-100 overflow-hidden">
                                <span class="badge ${badgeColorClass} shadow-sm text-center flex-shrink-0" style="width: 55px; font-size: 0.6rem;">${r.metodo}</span>
                                <span class="fw-bold text-white font-monospace text-truncate ms-2" style="font-size: 0.8rem;">${r.rota}</span>
                                ${prefixoInfo}
                            </div>
                            <span class="text-white-50 d-flex align-items-center mt-1 mt-md-0 flex-shrink-0" style="font-size: 0.65rem;">
                                <i class="fa-solid fa-file-code text-accent me-1"></i> ${r.arquivo}
                            </span>
                        </div>
                    </button>
                </h2>
                
                <div id="collapse_${idGrupo}_${index}" class="accordion-collapse collapse bg-custom-darker" data-bs-parent="#accordion_${idGrupo}">
                    <div class="accordion-body border-top border-custom p-3 test-container" data-rota="${r.rota}" data-metodo="${r.metodo}">
                        
                        <div class="row g-2">
                            <div class="col-12 col-md-4 mb-2">
                                <label class="form-label text-white-50 fw-bold mb-1" style="font-size: 0.65rem;">Prefixo da Rota</label>
                                <input type="text" class="form-control form-control-sm text-info font-monospace prefix-input p-1 px-2" value="${r.prefixoAuto}" placeholder="Ex: /api">
                            </div>
                            ${inputsParamsHTML}
                            ${bodyHTML}
                        </div>

                        <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-custom">
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-sm btn-outline-secondary fw-bold text-white py-1 px-2" style="font-size: 0.7rem;" onclick="limparTeste(this)">
                                    <i class="fa-solid fa-eraser me-1"></i> Limpar
                                </button>
                                <button type="button" class="btn btn-sm btn-success fw-bold text-dark shadow-sm py-1 px-2" style="font-size: 0.7rem;" onclick="executarTeste(this)">
                                    <i class="fa-solid fa-play me-1"></i> Executar Rota
                                </button>
                            </div>
                            <div class="status-resposta response-status text-white-50 fw-bold" style="font-size: 0.7rem;">Aguardando...</div>
                        </div>

                        <div class="mt-2 position-relative response-area" style="display: none;">
                            <h6 class="fw-bold text-white mb-1" style="font-size: 0.7rem;"><i class="fa-solid fa-terminal text-white-50 me-1"></i> Resposta do Servidor</h6>
                            <div class="loading-overlay position-absolute w-100 h-100 d-flex justify-content-center align-items-center bg-custom-darker bg-opacity-75 z-2" style="display: none !important; border-radius: 6px;">
                                <i class="fa-solid fa-circle-notch fa-spin text-accent" style="font-size: 1.5rem;"></i>
                            </div>
                            <pre class="m-0 shadow-sm p-2" style="max-height: 250px;"><code class="codigo-resposta" style="font-size: 0.7rem;"></code></pre>
                        </div>

                    </div>
                </div>
            </div>
            `;
        }).join('');
    };

    // 3. Monta o Grid com os Cards de cada Módulo
    let blocosModulosHTML = '';
    
    const nomesDosGrupos = Object.keys(gruposMapeados).sort((a, b) => {
        if (a === 'Geral') return 1;
        if (b === 'Geral') return -1;
        return a.localeCompare(b);
    });

    nomesDosGrupos.forEach(nomeGrupo => {
        const rotasDoGrupo = gruposMapeados[nomeGrupo];
        const idLimpo = nomeGrupo.replace(/[^a-zA-Z0-9]/g, ''); 
        
        rotasDoGrupo.sort((a, b) => {
            const ordem = { 'GET': 1, 'POST': 2, 'PUT': 3, 'PATCH': 4, 'DELETE': 5 };
            return (ordem[a.metodo] || 99) - (ordem[b.metodo] || 99);
        });

        const htmlRotasList = gerarHtmlListaRotas(rotasDoGrupo, idLimpo);

        blocosModulosHTML += `
        <div class="col-12 col-xl-6 mb-3">
            <div class="p-3 bg-custom-darker border border-custom rounded-3 shadow-sm h-100">
                <div class="d-flex align-items-center justify-content-between mb-3 border-bottom border-custom pb-2">
                    <h6 class="fw-bold text-white mb-0 d-flex align-items-center gap-2" style="font-size: 0.9rem;">
                        <i class="fa-solid fa-folder-open text-accent"></i> Módulo <span class="text-accent">${nomeGrupo}</span>
                    </h6>
                    <span class="badge bg-custom-dark text-white border border-custom shadow-sm" style="font-size: 0.65rem;">${rotasDoGrupo.length} endpoints</span>
                </div>
                
                <div class="accordion" id="accordion_${idLimpo}">
                    ${htmlRotasList}
                </div>
            </div>
        </div>
        `;
    });

    // 4. Estrutura final da View
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Laboratório de Rotas | Ecoflow</title>
        <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        
        <style>
            ::-webkit-scrollbar { width: 5px; height: 5px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
            html, body, .content, .modal-body, .offcanvas-body { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

            body { display: flex; height: 100vh; margin: 0; background-color: #151515; color: #ffffff; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
            .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column; z-index: 1000; }
            .content { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; background-color: #151515; position: relative; }

            .bg-custom-dark { background-color: #2a2a2a !important; }
            .bg-custom-darker { background-color: #222222 !important; }
            .border-custom { border-color: rgba(255,255,255,0.08) !important; border-width: 1px; }
            .text-accent { color: #08c068 !important; }
            
            .btn-primary, .btn-success { background-color: #08c068; border-color: #08c068; color: #1f1f1f; }
            .btn-primary:hover, .btn-success:hover { background-color: #06a055 !important; border-color: #06a055 !important; color: #ffffff !important; }
            .btn-outline-success { color: #08c068; border-color: #08c068; }
            .btn-outline-success:hover { background-color: #08c068; color: #1f1f1f; border-color: #08c068; }
            .btn-outline-secondary { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }
            .btn-outline-secondary:hover { background-color: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.3); }
            .btn-outline-danger { color: #dc3545; border-color: #dc3545; }
            .btn-outline-danger:hover { background-color: #dc3545; color: #fff; border-color: #dc3545; }

            /* Badges */
            .badge-get { background-color: rgba(13, 110, 253, 0.15); color: #6ea8fe; border: 1px solid rgba(13, 110, 253, 0.3); }
            .badge-post { background-color: rgba(8, 192, 104, 0.15); color: #08c068; border: 1px solid rgba(8, 192, 104, 0.3); }
            .badge-put { background-color: rgba(255, 193, 7, 0.15); color: #ffc107; border: 1px solid rgba(255, 193, 7, 0.3); }
            .badge-delete { background-color: rgba(220, 53, 69, 0.15); color: #ea868f; border: 1px solid rgba(220, 53, 69, 0.3); }
            .badge-secondary { background-color: rgba(108, 117, 125, 0.15); color: #adb5bd; border: 1px solid rgba(108, 117, 125, 0.3); }

            /* Inputs */
            .form-control { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #ffffff !important; }
            .form-control:focus { background-color: #2a2a2a; border-color: #08c068; color: #ffffff !important; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }
            .form-control::placeholder { color: rgba(255, 255, 255, 0.4) !important; }
            
            /* Acordeão Otimizado (Sem lag) */
            .accordion-button { border-radius: 6px !important; transition: background-color 0.2s, color 0.2s; }
            .accordion-button:not(.collapsed) { background-color: #222 !important; box-shadow: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .accordion-button::after { filter: brightness(0) invert(1); opacity: 0.5; transition: transform 0.2s ease; }
            .accordion-button:not(.collapsed)::after { opacity: 1; filter: invert(50%) sepia(80%) saturate(400%) hue-rotate(90deg); transform: rotate(-180deg); }
            .accordion-collapse { will-change: height; } 

            /* Modais */
            .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #1f1f1f !important; padding: 12px 16px; }
            .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); background-color: #1f1f1f !important; padding: 10px 16px; }
            .list-group-item { background-color: transparent !important; border-color: rgba(255,255,255,0.05); color: #e0e0e0 !important; }
            
            /* Area de Resposta */
            pre { background-color: #0d0d0d; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); overflow-y: auto; color: #08c068; white-space: pre-wrap; word-wrap: break-word; }
            .response-status { font-family: monospace; }

            /* Toasts */
            .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); background-color: #2a2a2a !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.08) !important; }
            .toast.showing, .toast.show { transform: translateX(0); }
            .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
            @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

            /* Botão Flutuante (Direita) */
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
            .btn-flutuante:hover { transform: scale(1.1); background-color: #06a055; box-shadow: 0 6px 20px rgba(8, 192, 104, 0.5); }

            @media (max-width: 767.98px) {
                body { flex-direction: column; } 
                .sidebar { display: none; } 
                .content { padding: 12px; }
                .btn-flutuante { right: 20px; bottom: 20px; }
            }
        </style>
    </head>
    <body>

        <div class="sidebar d-none d-md-flex">
            <div class="text-center mb-4 mt-2"><img src="/img/logo-branca.png" class="img-fluid" style="max-width:130px;"></div>
            <div class="flex-grow-1">${menuHTML}</div>
        </div>

        <div class="offcanvas offcanvas-start text-white" tabindex="-1" id="sidebarMenu" style="background-color: #1f1f1f;">
            <div class="offcanvas-header border-bottom border-custom">
                <h6 class="offcanvas-title ms-2" style="font-size: 0.9rem;"><i class="fa-solid fa-bars text-white-50 me-2"></i> Menu</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body">
                <div class="text-center mb-4 mt-2"><img src="/img/logo.png" class="img-fluid" style="max-width:140px;"></div>
                ${menuHTML}
            </div>
        </div>

        <div class="content">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3">
                <div class="d-flex align-items-center gap-3">
                    <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
                    <div>
                        <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-vial-virus text-accent me-2"></i> Laboratório de Rotas</h5>
                        <span class="text-white-50" style="font-size: 0.75rem;">Ecossistema de endpoints (${rotasEncontradas.length} identificados)</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-primary fw-bold px-3 py-1 shadow-sm d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#modalTestAll">
                    <i class="fa-solid fa-forward-fast"></i> Executar Bateria
                </button>
            </div>

            <div class="row g-3">
                ${blocosModulosHTML}
            </div>
        </div>

        <button class="btn-flutuante" data-bs-toggle="modal" data-bs-target="#modalInstrucoesTestes" title="Ajuda / Instruções">
            <i class="fa-solid fa-question"></i>
        </button>

        <div class="modal fade" id="modalInstrucoesTestes" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content erp-modal shadow-lg border-0">
                    <div class="modal-header bg-custom-darker text-white border-0">
                        <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-circle-info text-accent me-2"></i> Como usar o Dev Lab</h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4 bg-custom-dark text-light" style="font-size: 0.8rem;">
                        <p class="mb-4 text-white">Este painel lê dinamicamente o código do sistema e permite testar as rotas da API em tempo real.</p>
                        
                        <ul class="list-group list-group-flush mb-4">
                            <li class="list-group-item bg-transparent px-0 border-custom pb-3 text-white-50">
                                <strong class="text-white d-block mb-1"><i class="fa-solid fa-flask text-success me-2"></i> 1. Testes Individuais</strong>
                                Abra a aba de qualquer rota. O sistema já pré-preenche o <strong>Prefixo</strong> e cria campos para os <strong>Parâmetros</strong> da URL (ex: <code>:id</code>). Se for um método POST/PUT, um <strong>JSON de exemplo</strong> também será gerado. Edite os valores e clique em "Executar Rota".
                            </li>
                            <li class="list-group-item bg-transparent px-0 border-custom py-3 text-white-50">
                                <strong class="text-white d-block mb-1"><i class="fa-solid fa-forward-fast text-primary me-2"></i> 2. Bateria em Lote (Modo Seguro)</strong>
                                O botão no topo permite testar <strong>todas as rotas do sistema sequencialmente</strong> num único clique. Para proteger o seu banco de dados em produção, o modo seguro está ativado por padrão. Isso significa que métodos de exclusão receberão um <strong>ID Fantasma</strong> (ex: 999999) para não deletar clientes ou ordens reais.
                            </li>
                            <li class="list-group-item bg-transparent px-0 border-custom py-3 border-bottom-0 text-white-50">
                                <strong class="text-white d-block mb-1"><i class="fa-solid fa-code text-info me-2"></i> 3. Resultados Esperados</strong>
                                <span class="badge bg-success bg-opacity-10 text-success border border-success mb-1">Status 200/201:</span> A rota respondeu com sucesso.<br>
                                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger mb-1">Status 401/403:</span> Acesso Negado (A rota exige permissões que a sua sessão não tem ou falta de token).<br>
                                <span class="badge bg-warning bg-opacity-10 text-warning border border-warning mb-1">Status 404/500:</span> Erro na sintaxe do seu JSON ou falha interna no script do backend.
                            </li>
                        </ul>
                    </div>
                    <div class="modal-footer border-0 bg-custom-darker">
                        <button type="button" class="btn btn-sm btn-primary px-4 fw-bold shadow-sm" data-bs-dismiss="modal">Entendi</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalTestAll" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
                    <div class="modal-header border-custom">
                        <div class="d-flex align-items-center gap-2">
                            <i class="fa-solid fa-list-check text-accent fs-6"></i>
                            <h6 class="modal-title fw-bold text-white mb-0" style="font-size: 0.9rem;">Execução em Lote</h6>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body p-0 bg-custom-dark d-flex flex-column">
                        
                        <div class="p-3 border-bottom border-custom bg-custom-darker flex-shrink-0 z-1 shadow-sm">
                            
                            <div class="d-flex justify-content-between align-items-center mb-2 px-1">
                                <div class="form-check form-switch ps-0 d-flex align-items-center gap-2 m-0">
                                    <input class="form-check-input m-0" type="checkbox" role="switch" id="safeModeToggle" checked style="cursor:pointer;">
                                    <label class="form-check-label fw-bold text-white-50" for="safeModeToggle" style="font-size:0.7rem; cursor:pointer;" title="Protege o banco de dados contra exclusões reais usando IDs fantasmas.">
                                        <i class="fa-solid fa-shield-halved text-success me-1"></i> Modo Seguro Ativado
                                    </label>
                                </div>
                            </div>

                            <div class="progress mb-3 rounded-pill bg-custom-dark border border-custom" style="height: 12px;">
                                <div id="testProgress" class="progress-bar rounded-pill bg-primary progress-bar-striped progress-bar-animated" style="width: 0%; transition: width 0.3s ease;"></div>
                            </div>
                            
                            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 px-1">
                                
                                <div class="d-flex align-items-center flex-grow-1 overflow-hidden pe-2 w-100 w-md-auto">
                                    <span id="testStatusText" class="text-white-50 small fw-bold text-truncate" style="font-size: 0.75rem;">Aguardando disparo...</span>
                                    <span class="badge bg-custom-dark border border-custom text-white font-monospace ms-2 flex-shrink-0" id="testCounterBadge">0 / ${rotasEncontradas.length}</span>
                                </div>
                                
                                <div class="btn-group btn-group-sm shadow-sm flex-shrink-0" role="group">
                                    <input type="radio" class="btn-check filter-btn" name="filterResult" id="filterAll" value="all" autocomplete="off" checked onchange="filtrarResultadosLote()">
                                    <label class="btn btn-outline-secondary text-white border-custom fw-bold px-2 py-1" style="font-size: 0.65rem;" for="filterAll">Todos</label>

                                    <input type="radio" class="btn-check filter-btn" name="filterResult" id="filterSuccess" value="success" autocomplete="off" onchange="filtrarResultadosLote()">
                                    <label class="btn btn-outline-success fw-bold px-2 py-1" style="font-size: 0.65rem;" for="filterSuccess">Sucesso</label>

                                    <input type="radio" class="btn-check filter-btn" name="filterResult" id="filterError" value="error" autocomplete="off" onchange="filtrarResultadosLote()">
                                    <label class="btn btn-outline-danger fw-bold px-2 py-1" style="font-size: 0.65rem;" for="filterError">Erro</label>
                                </div>
                            </div>
                        </div>

                        <div id="testResultsList" class="p-3 d-flex flex-column gap-2 flex-grow-1 overflow-auto" style="min-height: 300px; scroll-behavior: smooth;">
                            <div id="placeholderLoteMsg" class="text-center py-5 text-white-50 small border border-custom rounded bg-custom-darker">
                                <i class="fa-solid fa-network-wired text-white-50 opacity-50 d-block mb-3 fa-2x"></i>
                                Clique em Iniciar Bateria para testar todas as rotas.<br>Use os filtros acima para organizar os resultados.
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer border-custom bg-custom-darker d-flex justify-content-between">
                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="limparResultadosLote()">
                                <i class="fa-solid fa-trash-can"></i> Limpar
                            </button>
                        </div>
                        <button type="button" id="btnStartBatch" class="btn btn-sm btn-primary fw-bold px-4" onclick="iniciarTestesEmLote()">
                            <i class="fa-solid fa-play"></i> Iniciar Bateria
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 3000;">
            <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-2 px-3 text-white d-flex justify-content-between">
                    <div>
                        <i class="fa-solid fa-circle-check fs-6 me-2 text-accent" id="sucessoIcon"></i>
                        <strong class="fs-6" id="sucessoTitulo" style="font-size: 0.85rem !important;">Concluído!</strong>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body pt-1 pb-3 px-3 position-relative">
                    <p class="text-white mb-0" style="font-size:0.75rem; opacity: 0.8;" id="sucessoSub">Operação realizada com sucesso.</p>
                </div>
                <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 4px; background: #08c068;"></div>
            </div>

            <div id="erroToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(220,53,69,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-2 px-3 text-white d-flex justify-content-between">
                    <div>
                        <i class="fa-solid fa-circle-xmark fs-6 me-2 text-danger"></i>
                        <strong class="fs-6" id="erroTitulo" style="font-size: 0.85rem !important;">Erro!</strong>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body pt-1 pb-3 px-3 position-relative">
                    <p class="text-white mb-0" style="font-size:0.75rem; opacity: 0.8;" id="erroSub">Ocorreu um erro ao processar.</p>
                </div>
                <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        
        <script>
            let rotasAtuaisData = ${JSON.stringify(rotasEncontradas).replace(/</g, '\\u003c')};

            function mostrarToast(tipo, titulo, mensagem) {
                const toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
                if (toastEl) {
                    document.getElementById(tipo === 'sucesso' ? 'sucessoTitulo' : 'erroTitulo').innerText = titulo;
                    document.getElementById(tipo === 'sucesso' ? 'sucessoSub' : 'erroSub').innerText = mensagem;
                    
                    toastEl.setAttribute('data-bs-autohide', 'true');
                    toastEl.setAttribute('data-bs-delay', '4000');
                    
                    const timerEl = document.getElementById(tipo === 'sucesso' ? 'sucessoTimer' : 'erroTimer');
                    if (timerEl) {
                        timerEl.style.display = 'block';
                        timerEl.style.animation = 'none';
                        void timerEl.offsetWidth; 
                        timerEl.style.animation = 'shrinkToast 4s linear forwards';
                    }

                    const toast = new bootstrap.Toast(toastEl);
                    toast.show();
                }
            }

            function limparTeste(btn) {
                const container = btn.closest('.test-container');
                const statusEl = container.querySelector('.status-resposta');
                const codeEl = container.querySelector('.codigo-resposta');
                
                statusEl.innerText = "Aguardando...";
                statusEl.className = "status-resposta response-status text-white-50 fw-bold";
                codeEl.innerText = '';
                codeEl.style.color = '#08c068';
                container.querySelector('.response-area').style.display = 'none';
                
                mostrarToast('sucesso', 'Limpo!', 'Teste individual resetado.');
            }

            async function executarTeste(btn) {
                const container = btn.closest('.test-container');
                const metodo = container.dataset.metodo;
                let rota = container.dataset.rota;
                let prefixo = container.querySelector('.prefix-input').value.trim();
                
                const safeModeToggle = document.getElementById('safeModeToggle');
                const safeMode = safeModeToggle ? safeModeToggle.checked : false;
                
                if (prefixo) {
                    if (!prefixo.startsWith('/')) prefixo = '/' + prefixo;
                    if (prefixo.endsWith('/')) prefixo = prefixo.slice(0, -1);
                    rota = rota.startsWith('/') ? prefixo + rota : prefixo + '/' + rota;
                }

                container.querySelectorAll('.param-input').forEach(input => {
                    let valorParam = input.value || '1';
                    if (safeMode && ['PUT', 'PATCH', 'DELETE'].includes(metodo)) {
                        valorParam = '999999999';
                    }
                    rota = rota.replace(input.dataset.param, valorParam);
                });

                let bodyData = null;
                if (['POST', 'PUT', 'PATCH'].includes(metodo)) {
                    const payloadInput = container.querySelector('.payload-input');
                    if (payloadInput && payloadInput.value.trim() !== '') {
                        try { bodyData = JSON.stringify(JSON.parse(payloadInput.value)); } 
                        catch (e) { mostrarToast('erro', 'Aviso', 'Sintaxe inválida no Payload JSON!'); return; }
                    }
                }

                const loadingOverlay = container.querySelector('.loading-overlay');
                const statusEl = container.querySelector('.status-resposta');
                const responseArea = container.querySelector('.response-area');
                const codeEl = container.querySelector('.codigo-resposta');

                loadingOverlay.style.setProperty('display', 'flex', 'important');
                responseArea.style.display = 'block';
                statusEl.innerText = "Processando...";
                statusEl.className = "status-resposta response-status text-warning fw-bold";

                try {
                    const startTime = Date.now();
                    const options = { method: metodo, headers: { 'Accept': 'application/json, text/plain, */*' } };
                    
                    if (safeMode) {
                        options.headers['X-DevLab-SafeMode'] = 'true';
                    }

                    if (bodyData) {
                        options.headers['Content-Type'] = 'application/json';
                        options.body = bodyData;
                    }

                    const response = await fetch(rota, options);
                    const ms = Date.now() - startTime;

                    let responseData;
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        responseData = JSON.stringify(await response.json(), null, 2);
                    } else {
                        const text = await response.text();
                        responseData = text.substring(0, 2000) + (text.length > 2000 ? '\\n\\n...[Conteúdo Truncado]...' : '');
                    }

                    loadingOverlay.style.setProperty('display', 'none', 'important');
                    codeEl.innerText = responseData;

                    if (response.ok) {
                        codeEl.style.color = '#08c068';
                        statusEl.innerHTML = \`<i class="fa-solid fa-circle-check"></i> \${response.status} • \${ms}ms\`;
                        statusEl.className = "status-resposta response-status text-success fw-bold";
                        
                        if (safeMode && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo)) {
                            mostrarToast('sucesso', 'Safe Mode', 'Simulação bem-sucedida. Nada foi alterado.');
                        } else {
                            mostrarToast('sucesso', 'Concluído!', 'Rota testada com sucesso.');
                        }
                    } else {
                        codeEl.style.color = '#ea868f';
                        statusEl.innerHTML = \`<i class="fa-solid fa-circle-xmark"></i> \${response.status} • \${ms}ms\`;
                        statusEl.className = "status-resposta response-status text-danger fw-bold";
                        mostrarToast('erro', 'Erro HTTP', \`Status retornado: \${response.status}\`);
                    }
                } catch (error) {
                    loadingOverlay.style.setProperty('display', 'none', 'important');
                    codeEl.style.color = '#ea868f';
                    codeEl.innerText = error.toString();
                    statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Falha';
                    statusEl.className = "status-resposta response-status text-danger fw-bold";
                    mostrarToast('erro', 'Falha de Rede', 'Não foi possível conectar à rota.');
                }
            }

            function filtrarResultadosLote() {
                const filtro = document.querySelector('input[name="filterResult"]:checked').value;
                const items = document.querySelectorAll('#testResultsList .result-item-lote');
                items.forEach(item => {
                    if (filtro === 'all') {
                        item.style.display = 'block';
                    } else if (filtro === 'success' && item.dataset.status === 'success') {
                        item.style.display = 'block';
                    } else if (filtro === 'error' && item.dataset.status === 'error') {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            }

            function limparResultadosLote() {
                const progress = document.getElementById('testProgress');
                progress.style.width = '0%';
                progress.classList.replace('bg-warning', 'bg-primary');
                progress.classList.replace('bg-success', 'bg-primary');
                progress.classList.add('progress-bar-animated');
                
                document.getElementById('testStatusText').innerHTML = 'Aguardando disparo...';
                document.getElementById('testCounterBadge').innerText = \`0 / \${rotasAtuaisData.length}\`;
                
                document.getElementById('filterAll').checked = true;

                document.getElementById('testResultsList').innerHTML = \`
                    <div id="placeholderLoteMsg" class="text-center py-5 text-white-50 small border border-custom rounded bg-custom-darker">
                        <i class="fa-solid fa-network-wired text-white-50 opacity-50 d-block mb-3 fa-2x"></i>
                        Clique em Iniciar Bateria para testar todas as rotas.<br>Use os filtros acima para organizar os resultados.
                    </div>
                \`;
                const btn = document.getElementById('btnStartBatch');
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-play"></i> Iniciar Bateria';
                
                mostrarToast('sucesso', 'Limpo!', 'O histórico de resultados em lote foi apagado.');
            }

            async function iniciarTestesEmLote() {
                const btnStart = document.getElementById('btnStartBatch');
                const progress = document.getElementById('testProgress');
                const statusText = document.getElementById('testStatusText');
                const counterBadge = document.getElementById('testCounterBadge');
                const resultsList = document.getElementById('testResultsList');
                const safeMode = document.getElementById('safeModeToggle').checked;

                btnStart.disabled = true;
                const msgPlaceholder = document.getElementById('placeholderLoteMsg');
                if (msgPlaceholder) msgPlaceholder.remove();
                
                document.getElementById('filterAll').checked = true;
                filtrarResultadosLote();

                const total = rotasAtuaisData.length;
                let concluidos = 0;
                let falhas = 0;

                for (let i = 0; i < total; i++) {
                    const rotaInfo = rotasAtuaisData[i];
                    
                    let rotaFinal = rotaInfo.rota;
                    if (rotaInfo.prefixoAuto) {
                        rotaFinal = rotaFinal.startsWith('/') ? rotaInfo.prefixoAuto + rotaFinal : rotaInfo.prefixoAuto + '/' + rotaFinal;
                    }

                    // --- PROTEÇÃO ANTI-LOGOUT ---
                    // Evita que a bateria atinja rotas que encerram a sessão do admin
                    if (rotaFinal.toLowerCase().includes('/logout') || rotaFinal.toLowerCase().includes('/sair') || rotaFinal.toLowerCase().includes('/login')) {
                        concluidos++;
                        progress.style.width = \`\${((concluidos/total)*100).toFixed(0)}%\`;
                        counterBadge.innerText = \`\${concluidos} / \${total}\`;
                        
                        const divResult = document.createElement('div');
                        divResult.className = \`result-item-lote p-2 rounded border border-opacity-25 bg-warning bg-opacity-10 border-warning bg-custom-darker mb-1 shadow-sm\`;
                        divResult.dataset.status = 'success'; 
                        
                        divResult.innerHTML = \`
                            <div class="d-flex align-items-center gap-2 flex-wrap w-100">
                                <span class="badge bg-warning text-dark rounded px-2 py-1 font-monospace" style="font-size: 0.6rem;">IGNORADO</span>
                                <span class="badge bg-custom-dark text-white border border-custom rounded font-monospace small" style="font-size: 0.6rem;">\${rotaInfo.metodo}</span>
                                <span class="text-white font-monospace text-truncate fw-bold" style="font-size: 0.75rem;">\${rotaFinal}</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-2 text-white-50" style="font-size: 0.65rem;">
                                <span><i class="fa-solid fa-shield-halved me-1"></i> Proteção de Sessão Ativa</span>
                            </div>
                        \`;
                        resultsList.appendChild(divResult);
                        resultsList.scrollTop = resultsList.scrollHeight;
                        continue;
                    }

                    if (rotaInfo.params) {
                        rotaInfo.params.forEach(p => { 
                            const dummyValue = safeMode ? '999999999' : '1';
                            rotaFinal = rotaFinal.replace(p, dummyValue); 
                        });
                    }

                    statusText.innerHTML = \`Varrendo: <strong class="text-accent font-monospace">\${rotaInfo.metodo} \${rotaFinal}</strong>\`;
                    
                    let sucesso = false, msgErro = '', statusCode = '', timeMs = 0;
                    const options = { 
                        method: rotaInfo.metodo, 
                        headers: { 'Accept': 'application/json, text/plain, */*' } 
                    };
                    
                    if (safeMode) {
                        options.headers['X-DevLab-SafeMode'] = 'true';
                    }

                    if (['POST', 'PUT', 'PATCH'].includes(rotaInfo.metodo) && rotaInfo.payloadDefault) {
                        options.headers['Content-Type'] = 'application/json';
                        options.body = rotaInfo.payloadDefault;
                    }

                    try {
                        const startT = Date.now();
                        const res = await fetch(rotaFinal, options);
                        timeMs = Date.now() - startT;
                        statusCode = res.status;
                        
                        if (res.ok) { sucesso = true; } 
                        else {
                            falhas++;
                            const txt = await res.text();
                            if (txt.includes('<title>') || txt.includes('<html')) msgErro = "Documento HTML ou Redirecionamento (Auth)";
                            else msgErro = txt.substring(0, 80).replace(/<[^>]*>?/gm, ''); 
                        }
                    } catch (e) {
                        falhas++; statusCode = 'CRASH'; msgErro = e.message;
                    }

                    concluidos++;
                    progress.style.width = \`\${((concluidos/total)*100).toFixed(0)}%\`;
                    counterBadge.innerText = \`\${concluidos} / \${total}\`;

                    const divResult = document.createElement('div');
                    const corFundo = sucesso ? 'bg-success bg-opacity-10 border-success' : 'bg-danger bg-opacity-10 border-danger';
                    
                    divResult.className = \`result-item-lote p-2 rounded border border-opacity-25 \${corFundo} bg-custom-darker mb-1 shadow-sm\`;
                    divResult.dataset.status = sucesso ? 'success' : 'error';

                    divResult.innerHTML = \`
                        <div class="d-flex align-items-center gap-2 flex-wrap w-100">
                            <span class="badge \${sucesso ? 'bg-success' : 'bg-danger'} text-dark rounded px-2 py-1 font-monospace" style="font-size: 0.6rem;">\${statusCode}</span>
                            <span class="badge bg-custom-dark text-white border border-custom rounded font-monospace small" style="font-size: 0.6rem;">\${rotaInfo.metodo}</span>
                            <span class="text-white font-monospace text-truncate fw-bold" style="font-size: 0.75rem;">\${rotaFinal}</span>
                        </div>
                        \${!sucesso ? \`
                        <div class="text-danger font-monospace mt-2 p-1 px-2 bg-custom-dark rounded border border-danger border-opacity-25" style="font-size: 0.65rem;">
                            <i class="fa-solid fa-bug me-1"></i> \${msgErro || 'Sem corpo no erro'}
                        </div>\` : ''}
                        <div class="d-flex justify-content-between align-items-center mt-2 text-white-50" style="font-size: 0.65rem;">
                            <span><i class="fa-solid fa-gauge me-1"></i> \${timeMs}ms</span>
                            \${sucesso ? '<span class="text-success"><i class="fa-solid fa-check"></i> OK</span>' : ''}
                        </div>
                    \`;
                    
                    resultsList.appendChild(divResult);
                    resultsList.scrollTop = resultsList.scrollHeight;
                }
                
                statusText.innerHTML = \`<strong class="text-white">Bateria Encerrada!</strong> <span class="text-white-50">\${concluidos} rotas testadas.</span>\`;
                
                if (falhas > 0) {
                    statusText.innerHTML += \` <span class="text-danger fw-bold ms-1">(\${falhas} falhas)</span>\`;
                    progress.classList.replace('bg-primary', 'bg-warning'); 
                    mostrarToast('erro', 'Atenção', 'A bateria encerrou com falhas. Verifique a lista.');
                } else {
                    statusText.innerHTML += \` <span class="text-success fw-bold ms-1\">(100% OK)</span>\`;
                    progress.classList.replace('bg-primary', 'bg-success');
                    mostrarToast('sucesso', 'Concluído!', 'Bateria de testes 100% aprovada.');
                }

                progress.classList.remove('progress-bar-animated');
                btnStart.disabled = false;
                btnStart.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Reprocessar';
            }
        </script>
    </body>
    </html>
    `;
}

module.exports = renderTestesView;