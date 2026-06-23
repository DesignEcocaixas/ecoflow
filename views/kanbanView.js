// views/kanbanView.js
const menuLateral = require("./menuLateral");

function kanbanView(usuario, colunas = [], espacoAtual = { nome: "Quadro Kanban" }) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const menuHTML = menuLateral(user, "/espacos-trabalho");

  // Paleta de cores oficial
  const paletaCores = ['#08c068', '#0d6efd', '#dc3545', '#ffc107', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

  // Função para escapar o JSON de forma segura num atributo HTML
  const escapeHtmlAttr = (str) => {
      return String(str)
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
  };
  const colunasJsonStr = escapeHtmlAttr(JSON.stringify(colunas));

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>${espacoAtual.nome} - Kanban | Ecoflow</title>
      <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
          /* Scrollbars Globais */
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
          html, body, .content, .kanban-cards-container, .modal-body, .offcanvas-body { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

          /* TEMA ESCURO GLOBAL */
          :root {
              --bg-color: #151515;
              --surface-color: #1f1f1f;
              --verde-ecoflow: #08c068;
              --verde-hover: #06a056;
          }

          body { display: flex; height: 100vh; margin: 0; background-color: var(--bg-color); color: #e0e0e0; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
          
          .sidebar { width: 240px; background-color: var(--surface-color); border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column; }
          .content { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; background-color: var(--bg-color); }
          
          .bg-custom-dark { background-color: #2a2a2a !important; }
          .bg-custom-darker { background-color: #222222 !important; }
          .border-custom { border-color: rgba(255,255,255,0.08) !important; border-width: 1px; }
          .text-accent { color: var(--verde-ecoflow) !important; }
          .hover-bg-custom:hover { background-color: rgba(255,255,255,0.05); }
          .cursor-pointer { cursor: pointer; }

          .btn-primary { background-color: var(--verde-ecoflow); border-color: var(--verde-ecoflow); color: #1f1f1f; }
          .btn-primary:hover { background-color: var(--verde-hover) !important; border-color: var(--verde-hover) !important; color: #1f1f1f !important; }

          /* Modais ERP */
          .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .modal-header-dark { background-color: #151515; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .modal-footer-dark { background-color: #151515; border-top: 1px solid rgba(255,255,255,0.05); }

          /* KANBAN BOARD */
          .kanban-wrapper { flex-grow: 1; overflow: hidden; position: relative; margin-top: 10px; }
          .kanban-board { 
              display: flex; gap: 20px; align-items: flex-start; height: 100%; 
              overflow-x: auto; padding-bottom: 15px;
              -webkit-overflow-scrolling: touch;
              cursor: grab;
              scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent;
          }
          .kanban-board:active { cursor: grabbing; }
          
          .kanban-column {
              background-color: #222;
              border: 1px solid rgba(255,255,255,0.05);
              border-radius: 10px;
              width: 320px;
              min-width: 320px;
              max-height: calc(100vh - 140px);
              display: flex;
              flex-direction: column;
              box-shadow: 0 4px 6px rgba(0,0,0,0.2);
              transition: border-color 0.3s ease;
              cursor: default;
          }
          .kanban-header {
              padding: 15px;
              font-weight: 600;
              background-color: #1f1f1f;
              border-bottom: 1px solid rgba(255,255,255,0.05);
              border-radius: 10px 10px 0 0;
              color: white;
              transition: background-color 0.3s ease, border-top-color 0.3s ease;
          }
          
          /* EDIÇÃO DO TÍTULO DA COLUNA */
          .column-title-inline { transition: background 0.2s; border-radius: 4px; padding: 2px 4px; margin-left: -4px; outline: none; cursor: text; }
          .column-title-inline:focus { background-color: rgba(255,255,255,0.1); }
          .column-title-inline[contenteditable]:empty::before { content: "Título..."; color: rgba(255,255,255,0.3); }

          .kanban-cards-container {
              padding: 10px;
              flex-grow: 1;
              overflow-y: auto;
              min-height: 100px;
          }

          /* Paleta de Cores */
          .color-square {
              width: 26px; height: 26px; border-radius: 6px; cursor: pointer;
              box-shadow: inset 0 0 0 1px rgba(0,0,0,0.2);
              transition: transform 0.2s, box-shadow 0.2s;
              display: inline-block;
          }
          .color-square:hover { transform: scale(1.1); box-shadow: 0 0 5px rgba(255,255,255,0.5); }
          .color-square.active { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--verde-ecoflow); transform: scale(1.1); }
          .dropdown-toggle.hide-caret::after { display: none; } 

          /* CARDS */
          .kanban-card {
              background-color: #2a2a2a;
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 12px;
              cursor: pointer;
              border-left: 5px solid var(--verde-ecoflow);
              color: #fff;
              transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.2s ease, opacity 0.3s, border-left-color 0.3s ease;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              touch-action: manipulation;
          }
          .kanban-card:hover { box-shadow: 0 6px 12px rgba(0,0,0,0.3); background-color: #2d2d2d; }
          .kanban-card.sortable-ghost { opacity: 0.5; }

          .card-completed { opacity: 0.6; }
          .card-completed .card-title-board { text-decoration: line-through; color: rgba(255,255,255,0.5); }

          /* EFEITO PRIORIDADE ALTA (PISCAR LEVEMENTE VERMELHO) */
          @keyframes pulseRed {
              0% { border-color: rgba(255,255,255,0.08); box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
              50% { border-color: rgba(220,53,69,0.5); box-shadow: 0 0 10px rgba(220,53,69,0.3); background-color: rgba(220,53,69,0.05); }
              100% { border-color: rgba(255,255,255,0.08); box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
          }
          .card-prioridade-alta {
              animation: pulseRed 2s infinite ease-in-out;
          }
          
          /* Prévia de Descrição HTML Limitada */
          .preview-html {
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
              font-size: 0.8rem;
              line-height: 1.4;
              color: rgba(255,255,255,0.7);
          }
          .preview-html * { background-color: transparent !important; color: inherit !important; margin-bottom: 0px !important; font-size: 0.8rem !important; }
          .preview-html ul { padding-left: 18px; margin-bottom: 0; }
          .preview-html a { color: var(--verde-ecoflow) !important; text-decoration: underline !important; pointer-events: auto; position: relative; z-index: 10; }

          /* MODAL DETALHES DO CARD (SPLIT SCREEN) */
          .card-title-modal { font-size: 1.25rem; font-weight: 700; outline: none; border-radius: 4px; padding: 4px; transition: background 0.2s; width: 100%; border: 1px solid transparent; }
          .card-title-modal:focus { background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
          .card-title-modal[contenteditable]:empty::before { content: "Título da Tarefa..."; color: rgba(255,255,255,0.3); }

          .card-desc-container { position: relative; }
          .rich-text-toolbar {
              display: none; gap: 4px; background: #1f1f1f; border: 1px solid rgba(255,255,255,0.1);
              padding: 4px; border-radius: 6px; margin-bottom: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          }
          .card-desc-container:focus-within .rich-text-toolbar { display: flex; }
          .rich-text-toolbar button { background: transparent; border: none; color: rgba(255,255,255,0.6); cursor: pointer; border-radius: 4px; padding: 3px 8px; font-size: 0.8rem; }
          .rich-text-toolbar button:hover { background: rgba(255,255,255,0.1); color: #fff; }

          .card-desc-modal { 
              font-size: 0.9rem; color: rgba(255,255,255,0.8); outline: none; margin-top: 5px; 
              cursor: text; min-height: 80px; transition: background 0.2s; border-radius: 6px; 
              padding: 10px; border: 1px solid rgba(255,255,255,0.05); background-color: #222;
          }
          .card-desc-modal:focus { border-color: var(--verde-ecoflow); background-color: rgba(255,255,255,0.02); }
          .card-desc-modal[contenteditable]:empty::before { content: "Adicione uma descrição mais detalhada..."; color: rgba(255,255,255,0.3); }

          .inline-date-picker {
              background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7);
              font-size: 0.8rem; border-radius: 4px; padding: 4px 8px; outline: none; cursor: pointer; transition: all 0.2s;
          }
          .inline-date-picker:hover, .inline-date-picker:focus { border-color: var(--verde-ecoflow); color: #fff; }
          .inline-date-picker::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.6; cursor: pointer; }

          /* LINHA DO TEMPO (HISTÓRICO COM FOTO) */
          .history-timeline { border-left: 2px solid rgba(255,255,255,0.1); margin-left: 12px; padding-left: 24px; position: relative; }
          .history-item { position: relative; margin-bottom: 20px; font-size: 0.75rem; color: rgba(255,255,255,0.7); min-height: 28px; }
          .history-avatar {
              position: absolute;
              left: -40px; 
              top: -2px;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 2px solid #222;
              background-color: rgba(255,255,255,0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.75rem;
              color: var(--verde-ecoflow);
              font-weight: bold;
              object-fit: cover;
              z-index: 2;
              box-shadow: 0 0 0 1px rgba(255,255,255,0.05);
          }
          .history-time { font-size: 0.65rem; color: rgba(255,255,255,0.4); display: block; margin-top: 2px; }

          /* ANEXOS */
          .anexo-cover { width: 100%; height: 100px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); transition: opacity 0.2s; margin-bottom: 6px; }
          .anexo-doc-mini { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-size: 1.2rem; transition: background 0.2s; margin-bottom: 6px; }
          
          /* TOASTS E SKELETON */
          .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); background-color: #2a2a2a !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.08) !important; }
          .toast.showing, .toast.show { transform: translateX(0); }
          .toast-timer { height: 4px; background: var(--verde-ecoflow); width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }

          .skeleton-dark {
              background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%) !important;
              background-size: 200% 100% !important;
              animation: skeleton-loading-view 1.5s infinite linear !important;
              border-radius: 4px; color: transparent !important; border-color: transparent !important; pointer-events: none;
          }
          .skeleton-dark * { visibility: hidden !important; }
          @keyframes skeleton-loading-view { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

          /* RESPONSIVIDADE (MOBILE) */
          @media (max-width: 767.98px) {
              body { flex-direction: column; } 
              .sidebar { display: none; } 
              .content { width: 100%; padding: 12px; }
              .kanban-board { padding-bottom: 5px; gap: 12px; }
              .kanban-column { min-width: 85vw !important; width: 85vw !important; }
              
              /* Ajustes Modal Mobile */
              .responsive-modal-row { flex-direction: column; height: auto !important; display: flex; }
              .responsive-modal-col { height: auto !important; overflow-y: visible !important; border-right: none !important; }
              #modal-left-col { border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
              #modalCardDetalhes .modal-content { height: 95vh !important; }
              .modal-body { overflow-y: auto; }
          }

          /* Inputs e Selects */
          .form-control, .form-select, .input-group-text { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #ffffff !important; font-size: 0.8rem; }
          .form-control:focus, .form-select:focus { background-color: #2a2a2a; border-color: #08c068; color: #ffffff !important; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }
          .form-control::placeholder { color: rgba(255, 255, 255, 0.4) !important; opacity: 1; }
          .input-group-text { background-color: #2a2a2a; color: rgba(255,255,255,0.6); }
      </style>
  </head>
  <body>
      <input type="hidden" id="kanban-data-input" value="${colunasJsonStr}">
      <input type="file" id="globalFileInput" multiple style="display: none;" onchange="handleUploadDireto(this)">

      <div class="sidebar d-none d-md-flex">
          <div class="text-center mb-4 mt-2"><img src="/img/logo-branca.png" class="img-fluid" style="max-width:130px;"></div>
          <div class="flex-grow-1">${menuHTML}</div>
      </div>

      <div class="offcanvas offcanvas-start text-white" tabindex="-1" id="sidebarMenu" style="background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05);">
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
          <div class="row align-items-center mb-3 w-100 g-3 m-0">
              
              <div class="col-auto col-md-4 d-flex align-items-center gap-3 p-0">
                  <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
                  <a href="/espacos-trabalho" class="btn btn-sm btn-outline-secondary border-custom text-white d-none d-sm-block" title="Voltar aos Espaços de Trabalho">
                      <i class="fa-solid fa-arrow-left"></i>
                  </a>
                  <div>
                      <h4 class="mb-0 fw-bold text-white"><i class="fa-solid fa-table-columns text-accent me-2"></i>${espacoAtual.nome}</h4>
                      <span class="text-white-50 mt-1 d-none d-sm-block" style="font-size:0.75rem;">Quadro Kanban Interativo</span>
                  </div>
              </div>
              
              <div class="col-12 col-md-4 order-3 order-md-2 p-0 px-md-3 position-relative" style="z-index: 1010;">
                <div class="input-group input-group-sm shadow-sm w-100">
                    <span class="input-group-text bg-custom-darker border-custom text-muted"><i class="fa-solid fa-magnifying-glass"></i></span>
                    
                    <input type="text" id="searchInputKanban" class="form-control border-custom bg-custom-darker border-end-0" style="color: #ffffff !important;" placeholder="Pesquisar cards..." onkeyup="pesquisarCardsKanban(this.value)">
                    
                    <button class="btn btn-outline-secondary border-custom border-start-0 bg-custom-darker text-danger" type="button" onclick="limparPesquisaKanban()" id="clearSearchBtn" style="display: none;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="searchResultsKanban" class="position-absolute w-100 bg-custom-darker border border-custom rounded shadow-lg mt-1 d-none" style="max-height: 300px; overflow-y: auto; left: 0;"></div>
            </div>

              <div class="col-auto col-md-4 order-2 order-md-3 d-flex justify-content-end p-0">
                  <button class="btn btn-sm btn-primary fw-bold shadow-sm text-dark" data-bs-toggle="modal" data-bs-target="#modalNovaColuna">
                      <i class="fa-solid fa-plus me-1"></i> Nova Coluna
                  </button>
              </div>
          </div>

          <div class="kanban-wrapper">
              <div class="kanban-board" id="kanbanBoard"></div>
          </div>
      </div>

      <div class="modal fade" id="modalCardDetalhes" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" style="height: 85vh;">
                  <div class="modal-header modal-header-dark border-custom py-2 px-3">
                      <div class="d-flex w-100 justify-content-between align-items-center">
                          <span class="badge bg-custom-dark border-custom text-muted" id="modalCardIdBadge">#CARD</span>
                          <div>
                              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" onclick="fecharModalCard()"></button>
                          </div>
                      </div>
                  </div>
                  <div class="modal-body p-0 bg-custom-dark">
                      <div class="row g-0 h-100 responsive-modal-row">
                          
                          <div id="modal-left-col" class="col-12 col-md-7 col-lg-8 p-4 border-end border-custom h-100 overflow-y-auto d-flex flex-column responsive-modal-col">
                              
                              <div class="d-flex align-items-start gap-2 mb-3">
                                  <input type="checkbox" id="modalCardStatus" class="form-check-input bg-transparent border-custom mt-2" style="width: 20px; height: 20px;" onchange="atualizarStatusModal(this.checked)">
                                  <div id="modalCardTitulo" class="card-title-modal text-white" contenteditable="true" onblur="salvarTextosModal()" onpaste="colarTextoPuro(event)"></div>
                              </div>

                              <div class="row g-3 mb-4">
                                  <div class="col-md-4">
                                      <label class="text-white-50 fw-bold mb-1" style="font-size: 0.75rem;">Prioridade</label>
                                      <select id="modalCardPrioridade" class="form-select form-select-sm bg-custom-darker border-custom text-white" onchange="salvarTextosModal()">
                                          <option value="baixa">Baixa</option>
                                          <option value="normal" selected>Normal</option>
                                          <option value="alta">Alta</option>
                                      </select>
                                  </div>
                                  <div class="col-md-4">
                                      <label class="text-white-50 fw-bold mb-1" style="font-size: 0.75rem;">Prazo de Conclusão</label>
                                      <div class="d-flex flex-column gap-1">
                                          <input type="date" id="modalCardPrazo" class="inline-date-picker w-100 p-1" onchange="salvarTextosModal()">
                                          <div id="modalCardPrazoBadge" class="mt-1"></div>
                                      </div>
                                  </div>
                                  <div class="col-md-4">
                                      <label class="text-white-50 fw-bold mb-1" style="font-size: 0.75rem;">Coluna Atual</label>
                                      <div id="modalCardColunaNome" class="p-2 border border-custom rounded text-white-50 text-truncate" style="background: rgba(255,255,255,0.02); font-size: 0.85rem;"></div>
                                  </div>
                              </div>

                              <div class="mb-4">
                                  <label class="text-white-50 fw-bold mb-1" style="font-size: 0.75rem;"><i class="fa-solid fa-align-left me-1"></i> Descrição</label>
                                  <div class="card-desc-container">
                                      <div class="rich-text-toolbar shadow-sm">
                                          <button type="button" onmousedown="event.preventDefault(); document.execCommand('bold', false, null);"><i class="fas fa-bold"></i></button>
                                          <button type="button" onmousedown="event.preventDefault(); document.execCommand('italic', false, null);"><i class="fas fa-italic"></i></button>
                                          <button type="button" onmousedown="event.preventDefault(); document.execCommand('underline', false, null);"><i class="fas fa-underline"></i></button>
                                          <button type="button" onmousedown="event.preventDefault(); document.execCommand('insertUnorderedList', false, null);"><i class="fas fa-list-ul"></i></button>
                                      </div>
                                      <div id="modalCardDescricao" class="card-desc-modal" contenteditable="true" onblur="salvarTextosModal()"></div>
                                  </div>
                              </div>

                              <div class="mb-3">
                                  <label class="text-white-50 fw-bold mb-2" style="font-size: 0.75rem;"><i class="fa-solid fa-paperclip me-1"></i> Anexos</label>
                                  <div id="modalCardAnexos" class="row g-2"></div>
                              </div>

                              <div class="mt-auto d-flex justify-content-end gap-2 pt-3 border-top border-custom">
                                  <button class="btn btn-sm btn-outline-secondary border-custom text-white-50" onclick="acionarUploadModal()" title="Anexar Arquivos"><i class="fa-solid fa-paperclip"></i> Anexar</button>
                                  <button class="btn btn-sm btn-outline-secondary border-custom text-white-50" onclick="confirmarDeletarCardModal()" title="Excluir Card"><i class="fa-solid fa-trash"></i> Excluir</button>
                              </div>

                          </div>

                          <div id="modal-right-col" class="col-12 col-md-5 col-lg-4 p-4 bg-custom-darker h-100 overflow-y-auto responsive-modal-col">
                              <h6 class="text-white fw-bold mb-4" style="font-size: 0.85rem;"><i class="fa-solid fa-clock-rotate-left text-accent me-2"></i> Atividade</h6>
                              <div id="modalCardHistory" class="history-timeline">
                                  </div>
                          </div>

                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div class="modal fade" id="modalNovaColuna" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog modal-dialog-centered modal-sm">
              <div class="modal-content erp-modal shadow-lg border-0 bg-custom-darker">
                  <div class="modal-header modal-header-dark border-custom">
                      <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-table-columns text-accent me-2"></i> Adicionar Coluna</h6>
                      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body p-4 bg-custom-dark">
                      <div class="mb-3">
                          <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.8rem;">Título da Coluna</label>
                          <input type="text" class="form-control form-control-sm shadow-sm" id="inputTituloColuna" placeholder="Ex: Em Andamento">
                      </div>
                      <div class="mb-2">
                          <label class="form-label text-white-50 fw-bold mb-2" style="font-size:0.8rem;">Cor da Coluna</label>
                          <input type="hidden" id="inputCorColuna" value="#08c068">
                          <div class="d-flex flex-wrap gap-2" id="paletaCoresNovaColuna">
                              ${paletaCores.map(c => '<div class="color-square ' + (c === '#08c068' ? 'active' : '') + '" style="background-color: ' + c + ';" onclick="selecionarCorNovaColuna(this, ' + "'" + c + "'" + ')"></div>').join('')}
                          </div>
                      </div>
                  </div>
                  <div class="modal-footer modal-footer-dark border-custom d-flex flex-nowrap">
                      <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
                      <button type="button" class="btn btn-sm btn-primary text-dark fw-bold w-100 shadow-sm" onclick="salvarNovaColuna()">Salvar</button>
                  </div>
              </div>
          </div>
      </div>

      <div class="modal fade" id="modalDeletarCard" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered modal-sm">
              <div class="modal-content erp-modal shadow-lg border-0 bg-custom-darker">
                  <div class="modal-body p-4 text-center bg-custom-dark rounded">
                      <i class="fa-solid fa-trash-can text-danger fs-1 mb-3"></i>
                      <h6 class="text-white fw-bold mb-2">Excluir Card?</h6>
                      <p class="text-white-50 small mb-4">Esta ação apagará permanentemente a tarefa e seus anexos.</p>
                      <input type="hidden" id="deleteCardId">
                      <div class="d-flex gap-2">
                          <button type="button" class="btn btn-sm btn-outline-secondary w-50" data-bs-dismiss="modal">Cancelar</button>
                          <button type="button" class="btn btn-sm btn-danger w-50 fw-bold" onclick="executarDeletarCard()">Excluir</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div class="modal fade" id="modalDeletarColuna" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered modal-sm">
              <div class="modal-content erp-modal shadow-lg border-0 bg-custom-darker">
                  <div class="modal-body p-4 text-center bg-custom-dark rounded">
                      <i class="fa-solid fa-triangle-exclamation text-warning fs-1 mb-3"></i>
                      <h6 class="text-white fw-bold mb-2">Excluir Coluna?</h6>
                      <p class="text-white-50 small mb-4">Todos os cards dentro dela serão perdidos. Esta ação não pode ser desfeita.</p>
                      <input type="hidden" id="deleteColunaId">
                      <div class="d-flex gap-2">
                          <button type="button" class="btn btn-sm btn-outline-secondary w-50" data-bs-dismiss="modal">Cancelar</button>
                          <button type="button" class="btn btn-sm btn-danger w-50 fw-bold" onclick="executarDeletarColuna()">Excluir</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div class="modal fade" id="modalDeletarAnexo" tabindex="-1" style="z-index: 2070;">
          <div class="modal-dialog modal-dialog-centered modal-sm">
              <div class="modal-content erp-modal shadow-lg border-0 bg-custom-darker">
                  <div class="modal-body p-4 text-center bg-custom-dark rounded">
                      <i class="fa-solid fa-trash-can text-danger fs-1 mb-3"></i>
                      <h6 class="text-white fw-bold mb-2">Excluir Anexo?</h6>
                      <p class="text-white-50 small mb-4">Esta ação apagará permanentemente o arquivo.</p>
                      <input type="hidden" id="deleteAnexoId">
                      <input type="hidden" id="deleteAnexoCardId">
                      <div class="d-flex gap-2">
                          <button type="button" class="btn btn-sm btn-outline-secondary w-50" data-bs-dismiss="modal">Cancelar</button>
                          <button type="button" class="btn btn-sm btn-danger w-50 fw-bold" onclick="executarDeletarAnexo()">Excluir</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div class="modal fade" id="modalVerImagem" tabindex="-1" style="z-index: 2060;">
          <div class="modal-dialog modal-dialog-centered modal-lg">
              <div class="modal-content bg-transparent border-0 shadow-none">
                  <div class="modal-header border-0 pb-0 justify-content-end">
                      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" style="filter: drop-shadow(0 0 5px rgba(0,0,0,1));"></button>
                  </div>
                  <div class="modal-body text-center p-0">
                      <img id="imgPreviewGrande" src="" class="img-fluid rounded shadow-lg border border-custom" style="max-height: 85vh;">
                  </div>
              </div>
          </div>
      </div>

      <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 3000;">
          <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
              <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                  <div>
                      <i class="fa-solid fa-circle-check fs-5 me-2 text-accent" id="sucessoIcon"></i>
                      <strong class="fs-6" id="sucessoTitulo">Concluído!</strong>
                  </div>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
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
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
              </div>
              <div class="toast-body pt-1 pb-4 px-3 position-relative">
                  <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="erroSub">Ocorreu um erro ao processar.</p>
              </div>
              <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
          </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
      <script src="/socket.io/socket.io.js"></script>
      
      <script>
          const NOME_USUARIO = "${user.nome}";
          const socket = io();
          
          // Lendo os dados de forma segura sem quebrar o HTML/EJS
          let colunasDados = JSON.parse(document.getElementById('kanban-data-input').value);
          const paletaBase = ${JSON.stringify(paletaCores)};
          let modalNovaColunaObj, modalVerImagemObj, modalDeletarCardObj, modalDeletarColunaObj, modalCardDetalhesObj, modalDeletarAnexoObj;
          let cardAbertoId = null;

          document.addEventListener('DOMContentLoaded', () => {
              modalNovaColunaObj = new bootstrap.Modal(document.getElementById('modalNovaColuna'));
              modalVerImagemObj = new bootstrap.Modal(document.getElementById('modalVerImagem'));
              modalDeletarCardObj = new bootstrap.Modal(document.getElementById('modalDeletarCard'));
              modalDeletarColunaObj = new bootstrap.Modal(document.getElementById('modalDeletarColuna'));
              modalCardDetalhesObj = new bootstrap.Modal(document.getElementById('modalCardDetalhes'));
              modalDeletarAnexoObj = new bootstrap.Modal(document.getElementById('modalDeletarAnexo'));
              
              mostrarSkeletonGlobais();
              setTimeout(() => {
                  ocultarSkeletonGlobais();
                  renderizarKanban();
                  iniciarArrastoMouse();
              }, 150);
          });

          // ==========================================
          // BARRA DE PESQUISA (LIVE SEARCH)
          // ==========================================
          function pesquisarCardsKanban(termo) {
              const resultsContainer = document.getElementById('searchResultsKanban');
              const clearBtn = document.getElementById('clearSearchBtn');
              
              if (!termo || termo.trim().length < 2) {
                  resultsContainer.classList.add('d-none');
                  if (clearBtn) clearBtn.style.display = 'none';
                  return;
              }
              if (clearBtn) clearBtn.style.display = 'block';
              
              const query = termo.toLowerCase();
              let matches = [];
              
              colunasDados.forEach(col => {
                  if(col.cards) {
                      col.cards.forEach(card => {
                          const tituloMatch = card.titulo && card.titulo.toLowerCase().includes(query);
                          const descMatch = card.descricao && card.descricao.toLowerCase().includes(query);
                          if (tituloMatch || descMatch) {
                              matches.push({ card, colNome: col.titulo });
                          }
                      });
                  }
              });

              if (matches.length > 0) {
                  resultsContainer.innerHTML = matches.map(m => {
                      const dataCriacao = formatarDataCompleta(m.card.criado_em || new Date().toISOString());
                      
                      let anexoPreview = '';
                      if (m.card.anexos && m.card.anexos.length > 0) {
                          const anexo = m.card.anexos[0];
                          const isImage = anexo.tipo && anexo.tipo.includes('image');
                          const path = '/uploads/' + anexo.nome_arquivo;
                          if (isImage) {
                              anexoPreview = \`<img src="\${path}" class="rounded ms-2 border border-custom" style="width: 32px; height: 32px; object-fit: cover;">\`;
                          } else {
                              anexoPreview = \`<div class="rounded ms-2 d-flex align-items-center justify-content-center bg-custom-dark border border-custom text-white-50" style="width: 32px; height: 32px;"><i class="fa-solid fa-file-pdf"></i></div>\`;
                          }
                      }

                      return \`
                      <div class="p-2 border-bottom border-custom hover-bg-custom cursor-pointer d-flex justify-content-between align-items-center" onclick="document.getElementById('searchResultsKanban').classList.add('d-none'); abrirModalCard(\${m.card.id});">
                          <div class="flex-grow-1 overflow-hidden">
                              <div class="fw-bold text-white text-truncate" style="font-size: 0.85rem;">\${m.card.titulo || 'Sem Título'}</div>
                              <div class="text-white-50 d-flex align-items-center gap-2 mt-1" style="font-size: 0.7rem;">
                                  <span><i class="fa-regular fa-calendar me-1"></i>\${dataCriacao}</span>
                                  <span>|</span>
                                  <span>Coluna: <span class="text-accent">\${m.colNome}</span></span>
                              </div>
                          </div>
                          \${anexoPreview}
                      </div>
                  \`}).join('');
              } else {
                  resultsContainer.innerHTML = '<div class="p-2 text-white-50 small text-center">Nenhum card encontrado.</div>';
              }
              resultsContainer.classList.remove('d-none');
          }

          function limparPesquisaKanban() {
              const input = document.getElementById('searchInputKanban');
              const clearBtn = document.getElementById('clearSearchBtn');
              const resultsContainer = document.getElementById('searchResultsKanban');
              
              if (input) input.value = '';
              if (clearBtn) clearBtn.style.display = 'none';
              if (resultsContainer) resultsContainer.classList.add('d-none');
          }

          document.addEventListener('click', (e) => {
              const searchContainer = document.getElementById('searchResultsKanban');
              if (searchContainer && !e.target.closest('#searchInputKanban') && !e.target.closest('#searchResultsKanban')) {
                  searchContainer.classList.add('d-none');
              }
          });

          // ==========================================
          // ARRASTAR O QUADRO E SCROLL HORIZONTAL
          // ==========================================
          function iniciarArrastoMouse() {
              const kanbanBoard = document.getElementById('kanbanBoard');
              let isDraggingBoard = false, startX, scrollLeft;

              kanbanBoard.addEventListener('mousedown', (e) => {
                  if (e.target.closest('.kanban-card') || e.target.closest('.kanban-header') || e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
                  isDraggingBoard = true;
                  kanbanBoard.style.cursor = 'grabbing';
                  startX = e.pageX - kanbanBoard.offsetLeft;
                  scrollLeft = kanbanBoard.scrollLeft;
              });
              kanbanBoard.addEventListener('mouseleave', () => { isDraggingBoard = false; kanbanBoard.style.cursor = 'grab'; });
              kanbanBoard.addEventListener('mouseup', () => { isDraggingBoard = false; kanbanBoard.style.cursor = 'grab'; });
              kanbanBoard.addEventListener('mousemove', (e) => {
                  if (!isDraggingBoard) return;
                  e.preventDefault();
                  const x = e.pageX - kanbanBoard.offsetLeft;
                  kanbanBoard.scrollLeft = scrollLeft - ((x - startX) * 1.5);
              });
          }

          // ==========================================
          // LIGAÇÕES AUTOMÁTICAS (AUTO-LINK)
          // ==========================================
          function autoLinkify(element) {
              const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
              const nodesToReplace = [];
              let node;
              while (node = walker.nextNode()) {
                  let p = node.parentNode;
                  let isInsideLink = false;
                  while(p && p !== element) {
                      if(p.tagName === 'A') { isInsideLink = true; break; }
                      p = p.parentNode;
                  }
                  if (isInsideLink) continue;
                  
                  const urlRegex = /(https?:\\/\\/[^\\s<]+)/g;
                  if (urlRegex.test(node.nodeValue)) {
                      nodesToReplace.push(node);
                  }
              }
              nodesToReplace.forEach(n => {
                  const urlRegex = /(https?:\\/\\/[^\\s<]+)/g;
                  const fragment = document.createDocumentFragment();
                  const parts = n.nodeValue.split(urlRegex);
                  parts.forEach(part => {
                      if(urlRegex.test(part)) {
                          const a = document.createElement('a');
                          a.href = part;
                          a.target = "_blank";
                          a.className = "text-accent text-decoration-underline";
                          a.style.pointerEvents = "auto";
                          a.onclick = function(e) { e.stopPropagation(); };
                          a.textContent = part;
                          fragment.appendChild(a);
                      } else if(part) {
                          fragment.appendChild(document.createTextNode(part));
                      }
                  });
                  n.parentNode.replaceChild(fragment, n);
              });
          }

          // ==========================================
          // SKELETON E TOASTS
          // ==========================================
          function gerarSkeletonKanban() {
              let html = '';
              for(let i=0; i<4; i++) {
                  html += \`<div class="kanban-column bg-custom-darker border-custom shadow-sm p-0">
                      <div class="kanban-header skeleton-dark border-0" style="height: 55px; border-radius: 10px 10px 0 0; margin-bottom: 10px;"></div>
                      <div class="kanban-cards-container">
                          <div class="kanban-card skeleton-dark" style="height: 80px; border: none; margin-bottom: 12px;"></div>
                          <div class="kanban-card skeleton-dark" style="height: 120px; border: none; margin-bottom: 12px;"></div>
                      </div>
                  </div>\`;
              }
              return html;
          }
          function mostrarSkeletonGlobais() {
              const board = document.getElementById('kanbanBoard');
              if (board && !board.classList.contains('skeleton-active')) { board.innerHTML = gerarSkeletonKanban(); board.classList.add('skeleton-active'); }
          }
          function ocultarSkeletonGlobais() {
              const board = document.getElementById('kanbanBoard');
              if (board) board.classList.remove('skeleton-active');
          }

          function hexToRgba(hex, alpha) {
              const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
              return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
          }

          function mostrarToast(tipo, titulo, mensagem) {
              const toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
              if (toastEl) {
                  document.getElementById(tipo === 'sucesso' ? 'sucessoTitulo' : 'erroTitulo').innerText = titulo;
                  document.getElementById(tipo === 'sucesso' ? 'sucessoSub' : 'erroSub').innerText = mensagem;
                  const timerEl = document.getElementById(tipo === 'sucesso' ? 'sucessoTimer' : 'erroTimer');
                  if (timerEl) { 
                      timerEl.style.display = 'block'; 
                      timerEl.style.animation = 'none'; 
                      void timerEl.offsetWidth; // Reflow para reiniciar a animação
                      timerEl.style.animation = 'shrinkToast 5s linear forwards'; 
                  }
                  const oldInstance = bootstrap.Toast.getInstance(toastEl);
                  if (oldInstance) oldInstance.dispose();
                  const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
                  toast.show();
              }
          }

          function formatarDataCompleta(dataStr) {
              if (!dataStr) return '';
              const data = new Date(dataStr);
              if (isNaN(data)) return '';
              const dia = String(data.getDate()).padStart(2, '0');
              const mes = String(data.getMonth() + 1).padStart(2, '0');
              const ano = data.getFullYear();
              return dia + '/' + mes + '/' + ano;
          }

          function calcularBadgeDiasRestantes(prazoStr, isConcluido) {
              if (isConcluido) {
                  return '<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-50 px-2" style="font-size:0.7rem;"><i class="fa-solid fa-check me-1"></i>Concluído</span>';
              }
              if (!prazoStr) return '';
              const hoje = new Date();
              hoje.setHours(0,0,0,0);
              const partes = prazoStr.split('-');
              if(partes.length !== 3) return '';
              const prazoDate = new Date(partes[0], partes[1] - 1, partes[2]);
              const diffTime = prazoDate - hoje;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays < 0) return '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-50 px-2" style="font-size:0.7rem;">Vencido</span>';
              if (diffDays === 0) return '<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-50 px-2" style="font-size:0.7rem;">Hoje</span>';
              const txt = diffDays === 1 ? '1 dia' : diffDays + ' dias';
              return '<span class="badge bg-custom-dark border-custom text-accent px-2 fw-normal" style="font-size:0.65rem;">Vence em ' + txt + '</span>';
          }

          function selecionarCorNovaColuna(element, cor) {
              document.getElementById('inputCorColuna').value = cor;
              document.querySelectorAll('#paletaCoresNovaColuna .color-square').forEach(el => el.classList.remove('active'));
              element.classList.add('active');
          }

          function abrirImagemGrande(url, event) {
              if(event) event.stopPropagation();
              document.getElementById('imgPreviewGrande').src = url;
              modalVerImagemObj.show();
          }

          // ==========================================
          // RENDERIZAÇÃO DO KANBAN BOARD
          // ==========================================
          function renderizarKanban() {
              const board = document.getElementById('kanbanBoard');
              board.innerHTML = ''; 

              colunasDados.forEach(col => {
                  const corColuna = col.cor || '#08c068';
                  const bgHeader = hexToRgba(corColuna, 0.15); 
                  
                  const colDiv = document.createElement('div');
                  colDiv.className = 'kanban-column';
                  colDiv.dataset.id = col.id;
                  colDiv.style.borderColor = hexToRgba(corColuna, 0.3); 
                  
                  let cardsHTML = '';
                  if (col.cards && col.cards.length > 0) {
                      // Copia o array para não alterar o original da coluna
                      let cardsOrdenados = [...col.cards].sort((a, b) => {
                          if (a.prioridade === 'alta' && b.prioridade !== 'alta') return -1;
                          if (b.prioridade === 'alta' && a.prioridade !== 'alta') return 1;
                          return 0; // Mantém a ordem original para os restantes
                      });
                      
                      cardsOrdenados.forEach(card => { cardsHTML += gerarHTMLCard(card, corColuna); });
                  }

                  const dropdownCores = \`
                      <div class="dropdown d-inline-block">
                          <button class="btn btn-sm p-0 border-0 dropdown-toggle hide-caret" type="button" data-bs-toggle="dropdown">
                              <div class="rounded shadow-sm" style="width: 18px; height: 18px; background-color: \${corColuna}; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);"></div>
                          </button>
                          <div class="dropdown-menu dropdown-menu-dark p-2" style="min-width: 140px; background-color: #2a2a2a; border-color: rgba(255,255,255,0.1);">
                              <div class="d-flex flex-wrap gap-2 justify-content-center">
                                  \${paletaBase.map(c => '<div class="color-square" style="background-color: ' + c + ';" onclick="atualizarCorColuna(' + col.id + ', \\'' + c + '\\')"></div>').join('')}
                              </div>
                          </div>
                      </div>\`;

                  colDiv.innerHTML = \`
                      <div class="kanban-header" style="background-color: \${bgHeader}; border-top: 4px solid \${corColuna};">
                          <div class="d-flex align-items-center gap-2 w-100">
                              \${dropdownCores}
                              <span class="text-truncate flex-grow-1 column-title-inline" contenteditable="true" onblur="salvarTituloColuna(\${col.id}, this)" onkeydown="if(event.keyCode===13){event.preventDefault(); this.blur();}" onpaste="colarTextoPuro(event)">\${col.titulo}</span>
                              <button class="btn btn-sm btn-link p-1 px-2 text-white-50 text-decoration-none" onclick="criarCardRapido(\${col.id})" title="Novo Card"><i class="fa-solid fa-plus"></i></button>
                              <button class="btn btn-sm btn-link p-0 text-white-50 text-decoration-none ms-1" onclick="confirmarDeletarColuna(\${col.id})" title="Excluir Coluna"><i class="fa-solid fa-trash"></i></button>
                          </div>
                      </div>
                      <div class="kanban-cards-container" id="coluna-\${col.id}">
                          \${cardsHTML}
                      </div>\`;
                  
                  board.appendChild(colDiv);
                  
                  new Sortable(document.getElementById('coluna-' + col.id), {
                      group: 'kanban',
                      animation: 150,
                      ghostClass: 'sortable-ghost',
                      filter: '[contenteditable="true"], input, button, a, select', 
                      preventOnFilter: false,
                      delay: 100, 
                      delayOnTouchOnly: true,
                      fallbackTolerance: 5,
                      // Substitua o bloco 'onEnd' dentro das configurações do Sortable:
                        onEnd: function (evt) {
                            const itemEl = evt.item;
                            const toList = evt.to;
                            
                            if(evt.from !== toList || evt.oldIndex !== evt.newIndex) {
                                const novaColuna = toList.closest('.kanban-column');
                                const novaColunaId = novaColuna.dataset.id;
                                
                                // A MÁGICA AQUI: Lê todos os cards na ordem em que o utilizador os deixou na tela
                                const cardsNodes = novaColuna.querySelectorAll('.kanban-card');
                                const novaOrdemArray = Array.from(cardsNodes).map(el => parseInt(el.dataset.id));

                                socket.emit('mover_card', { 
                                    cardId: itemEl.dataset.id, 
                                    novaColunaId: novaColunaId, 
                                    novaOrdem: evt.newIndex, 
                                    novaOrdemArray: novaOrdemArray, // Envia o array perfeito para o servidor
                                    usuario: NOME_USUARIO 
                                });
                                
                                mostrarToast('sucesso', 'Movido!', 'O card foi movido para a nova posição.');
                                const paiDropdown = novaColuna.querySelector('.dropdown-toggle > div');
                                if(paiDropdown) itemEl.style.borderLeftColor = paiDropdown.style.backgroundColor;
                            }
                        },
                  });
              });
          }

          function gerarHTMLAnexo(anexo) {
              const isImage = anexo.tipo && anexo.tipo.includes('image');
              const path = '/uploads/' + anexo.nome_arquivo;
              if (isImage) {
                  return '<img src="' + path + '" class="anexo-cover shadow-sm" style="pointer-events: none;" draggable="false" title="' + (anexo.nome_original || '') + '">';
              } else {
                  return '<div class="anexo-doc-mini shadow-sm" style="pointer-events: none;" title="' + (anexo.nome_original || '') + '"><i class="fa-solid fa-file-pdf"></i></div>';
              }
          }

          function gerarHTMLCard(card, corColuna) {
              const isConcluido = card.concluido ? 'card-completed' : '';
              const isAlta = card.prioridade === 'alta' ? 'card-prioridade-alta' : '';
              
              const criadoEmFormatado = formatarDataCompleta(card.criado_em || new Date().toISOString());
              const prazoStr = card.prazo ? String(card.prazo).slice(0, 10) : '';
              
              let anexosCount = card.anexos && card.anexos.length > 0 ? card.anexos.length : 0;
              let hasDesc = card.descricao && card.descricao.length > 0;

              let descPreview = '';
              if (hasDesc) {
                  descPreview = '<div class="text-white-50 mt-1 mb-2 preview-html">' + card.descricao + '</div>';
              }

              let anexosHTML = '<div class="card-anexos w-100" id="anexos-card-board-' + card.id + '">';
              if (card.anexos && card.anexos.length > 0) {
                  card.anexos.forEach(anexo => { anexosHTML += gerarHTMLAnexo(anexo); });
              }
              anexosHTML += '</div>';

              return \`
              <div class="kanban-card \${isConcluido} \${isAlta}" data-id="\${card.id}" style="border-left-color: \${corColuna};" onclick="abrirModalCard(\${card.id})">
                  <div class="d-flex justify-content-between align-items-start mb-1">
                      <div class="card-title-board text-break fw-bold" style="font-size: 0.85rem;">
                          \${card.titulo || 'Sem Título'}
                      </div>
                      \${card.concluido ? '<i class="fa-solid fa-circle-check text-success ms-2"></i>' : ''}
                  </div>
                  \${descPreview}
                  \${anexosHTML}
                  <div class="d-flex justify-content-between align-items-center mt-2 w-100">
                      <div class="d-flex gap-2 align-items-center text-white-50" style="font-size: 0.75rem;">
                          \${(prazoStr || card.concluido) ? calcularBadgeDiasRestantes(prazoStr, card.concluido) : ''}
                          \${hasDesc ? '<span><i class="fa-solid fa-align-left"></i></span>' : ''}
                          \${anexosCount ? '<span><i class="fa-solid fa-paperclip"></i> ' + anexosCount + '</span>' : ''}
                      </div>
                      <div class="text-white-50" style="font-size: 0.65rem;">
                          Criado em: \${criadoEmFormatado}
                      </div>
                  </div>
              </div>\`;
          }

          // ==========================================
          // MODAL DE DETALHES DO CARD E ANEXOS
          // ==========================================
          async function abrirModalCard(cardId) {
              let cardData = null;
              let colunaNome = "";

              for (const col of colunasDados) {
                  const achado = col.cards.find(c => c.id == cardId);
                  if (achado) { cardData = achado; colunaNome = col.titulo; break; }
              }
              if (!cardData) return;

              cardAbertoId = cardId;
              
              document.getElementById('modalCardIdBadge').innerText = "#" + cardId;
              document.getElementById('modalCardTitulo').innerText = cardData.titulo;
              
              const descEl = document.getElementById('modalCardDescricao');
              descEl.innerHTML = cardData.descricao || '';
              autoLinkify(descEl); // Transforma links em <a> na hora que abre
              
              const prazoFinal = cardData.prazo ? String(cardData.prazo).slice(0, 10) : '';
              
              document.getElementById('modalCardPrazo').value = prazoFinal;
              document.getElementById('modalCardPrazoBadge').innerHTML = calcularBadgeDiasRestantes(prazoFinal, cardData.concluido);
              document.getElementById('modalCardStatus').checked = !!cardData.concluido;
              document.getElementById('modalCardColunaNome').innerText = colunaNome;
              
              // Ajusta o Select da Prioridade
              const selectPrioridade = document.getElementById('modalCardPrioridade');
              if (selectPrioridade) {
                  selectPrioridade.value = cardData.prioridade || 'normal';
              }

              // Renderizar Anexos em largura total no modal com botão de excluir
              const cAnexos = document.getElementById('modalCardAnexos');
              if (cardData.anexos && cardData.anexos.length > 0) {
                  cAnexos.innerHTML = cardData.anexos.map(anexo => {
                      const isImage = anexo.tipo && anexo.tipo.includes('image');
                      const path = '/uploads/' + anexo.nome_arquivo;
                      
                      const btnExcluirAnexo = \`<button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 shadow" style="padding: 2px 6px; font-size: 0.7rem; z-index: 10;" onclick="confirmarDeletarAnexoModal(\${anexo.id}, \${cardId}, event)" title="Excluir Anexo"><i class="fa-solid fa-xmark"></i></button>\`;

                      if (isImage) {
                          return \`<div class="col-12 position-relative"><img src="\${path}" class="anexo-cover shadow-sm w-100" style="height: auto; max-height: 300px; object-fit: cover; pointer-events: auto;" draggable="false" onclick="abrirImagemGrande('\${path}', event)" title="\${anexo.nome_original || ''}">\${btnExcluirAnexo}</div>\`;
                      } else {
                          return \`<div class="col-12 position-relative"><a href="\${path}" target="_blank" class="anexo-doc-mini shadow-sm w-100 d-flex justify-content-start px-3 py-2" style="height: auto; pointer-events: auto;" title="\${anexo.nome_original || ''}"><i class="fa-solid fa-file-pdf me-2 text-danger"></i><span class="text-truncate">\${anexo.nome_original || 'Documento'}</span></a>\${btnExcluirAnexo}</div>\`;
                      }
                  }).join('');
              } else {
                  cAnexos.innerHTML = '<div class="text-white-50 small">Nenhum anexo.</div>';
              }

              // Renderizar Histórico (VIA BANCO DE DADOS)
              const cHist = document.getElementById('modalCardHistory');
              cHist.innerHTML = '<div class="text-center text-white-50"><i class="fa-solid fa-spinner fa-spin"></i> Carregando histórico...</div>';
              
              try {
                  const resp = await fetch('/kanban/historico/' + cardId);
                  const data = await resp.json();
                  if (data.success && data.historico.length > 0) {
                      cHist.innerHTML = data.historico.map(h => {
                          const dtObj = new Date(h.criado_em);
                          const dia = String(dtObj.getDate()).padStart(2, '0');
                          const mes = String(dtObj.getMonth() + 1).padStart(2, '0');
                          const ano = dtObj.getFullYear();
                          const hor = String(dtObj.getHours()).padStart(2, '0');
                          const min = String(dtObj.getMinutes()).padStart(2, '0');
                          const dataFormatada = dia + '/' + mes + '/' + ano + ' às ' + hor + ':' + min;

                          const usuarioNome = h.usuario || 'Sistema';
                          const inicial = usuarioNome.charAt(0).toUpperCase();
                          
                          let avatarHtml = '';
                          if (h.foto) {
                              avatarHtml = \`<img src="/uploads/\${h.foto}" class="history-avatar" onerror="this.outerHTML='<div class=\\'history-avatar\\'>\${inicial}</div>'">\`;
                          } else if (usuarioNome === 'Sistema') {
                              avatarHtml = \`<div class="history-avatar"><i class="fa-solid fa-robot" style="font-size:0.6rem;"></i></div>\`;
                          } else {
                              avatarHtml = \`<div class="history-avatar">\${inicial}</div>\`;
                          }

                          return \`
                          <div class="history-item">
                              \${avatarHtml}
                              <strong class="text-white" style="font-size: 0.8rem;">\${h.acao}</strong>
                              <span class="history-time">\${dataFormatada} por <span class="text-accent">\${usuarioNome}</span></span>
                          </div>
                          \`;
                      }).join('');
                  } else {
                      cHist.innerHTML = '<div class="text-white-50 small">Nenhum histórico registrado.</div>';
                  }
              } catch(e) {
                  cHist.innerHTML = '<div class="text-danger small">Erro ao carregar histórico do banco de dados.</div>';
              }

              modalCardDetalhesObj.show();
          }

          function fecharModalCard() {
              cardAbertoId = null;
          }

          function colarTextoPuro(e) {
              e.preventDefault();
              const text = (e.originalEvent || e).clipboardData.getData('text/plain');
              document.execCommand('insertText', false, text);
          }

          function salvarTextosModal() {
              if (!cardAbertoId) return;
              
              const titulo = document.getElementById('modalCardTitulo').innerText.trim();
              
              const descEl = document.getElementById('modalCardDescricao');
              autoLinkify(descEl); // Links automáticos na hora de salvar
              let descricao = descEl.innerHTML.trim();
              
              const concluido = document.getElementById('modalCardStatus').checked ? 1 : 0;
              const prazoInput = document.getElementById('modalCardPrazo');
              const prazo = prazoInput ? prazoInput.value : '';
              
              const prioridadeElement = document.getElementById('modalCardPrioridade');
              const prioridade = prioridadeElement ? prioridadeElement.value : 'normal';

              if (document.getElementById('modalCardPrazoBadge')) {
                  document.getElementById('modalCardPrazoBadge').innerHTML = calcularBadgeDiasRestantes(prazo, concluido);
              }

              if (!titulo) {
                  return mostrarToast('erro', 'Aviso', 'O título não pode ficar vazio.');
              }

              // =======================================================
              // VERIFICAÇÃO DE ALTERAÇÕES REAIS (Evita spans/falsos envios)
              // =======================================================
              let cardOriginal = null;
              for (const col of colunasDados) {
                  cardOriginal = col.cards.find(c => c.id == cardAbertoId);
                  if (cardOriginal) break;
              }

              if (cardOriginal) {
                  const oldTitulo = (cardOriginal.titulo || '').trim();
                  const oldDesc = (cardOriginal.descricao || '').trim();
                  
                  // O contenteditable às vezes deixa um <br> solto quando esvaziamos o campo
                  const novaDescNormalizada = (descricao === '<br>' || descricao === '<div><br></div>') ? '' : descricao;

                  const oldConcluido = cardOriginal.concluido ? 1 : 0;
                  const oldPrazo = cardOriginal.prazo ? String(cardOriginal.prazo).slice(0, 10) : '';
                  const oldPrioridade = cardOriginal.prioridade || 'normal';

                  // Se NENHUM campo sofreu alteração, aborta a gravação silenciosamente
                  if (titulo === oldTitulo &&
                      novaDescNormalizada === oldDesc &&
                      concluido === oldConcluido &&
                      prazo === oldPrazo &&
                      prioridade === oldPrioridade) {
                      return; 
                  }
              }
              // =======================================================

              // Se chegou aqui, é porque algo realmente mudou. Vamos gravar!
              socket.emit('atualizar_card', { 
                  id: cardAbertoId, 
                  cardId: cardAbertoId, 
                  titulo: titulo, 
                  descricao: descricao, 
                  concluido: concluido, 
                  prazo: prazo, 
                  prioridade: prioridade,
                  usuario: NOME_USUARIO 
              });
              
              mostrarToast('sucesso', 'Salvo!', 'Card atualizado com sucesso.');
          }

          function atualizarStatusModal(isChecked) {
              salvarTextosModal();
          }

          function acionarUploadModal() {
              if(!cardAbertoId) return;
              uploadCardAtualId = cardAbertoId;
              const fileInput = document.getElementById('globalFileInput');
              fileInput.value = ''; 
              fileInput.click();    
          }

          function confirmarDeletarCardModal() {
              if(!cardAbertoId) return;
              document.getElementById('deleteCardId').value = cardAbertoId;
              modalCardDetalhesObj.hide();
              modalDeletarCardObj.show();
          }

          function confirmarDeletarAnexoModal(anexoId, cardId, event) {
              if(event) event.stopPropagation();
              document.getElementById('deleteAnexoId').value = anexoId;
              document.getElementById('deleteAnexoCardId').value = cardId;
              modalDeletarAnexoObj.show();
          }

          async function executarDeletarAnexo() {
              const anexoId = document.getElementById('deleteAnexoId').value;
              const cardId = document.getElementById('deleteAnexoCardId').value;
              modalDeletarAnexoObj.hide();

              try {
                  const response = await fetch('/kanban/anexos/' + anexoId, { method: 'DELETE' });
                  if(response.ok) {
                      mostrarToast('sucesso', 'Excluído!', 'O anexo foi removido.');
                      
                      // Remove localmente do array de dados
                      for (const col of colunasDados) {
                          const c = col.cards.find(x => x.id == cardId);
                          if (c && c.anexos) {
                              c.anexos = c.anexos.filter(a => a.id != anexoId);
                              break;
                          }
                      }
                      
                      abrirModalCard(cardId);
                      renderizarKanban();
                  } else {
                      mostrarToast('erro', 'Erro', 'Falha ao remover o anexo.');
                  }
              } catch(e) {
                  mostrarToast('erro', 'Falha na Rede', 'Verifique a sua internet.');
              }
          }

          // ==========================================
          // AÇÕES COLUNAS E CARDS (CRUD)
          // ==========================================
          function salvarNovaColuna() {
              const titulo = document.getElementById('inputTituloColuna').value.trim();
              const cor = document.getElementById('inputCorColuna').value;
              const urlParams = new URLSearchParams(window.location.search);
              const espaco_id = urlParams.get('espaco_id');

              if(titulo && espaco_id) {
                  socket.emit('nova_coluna', { titulo, cor, espaco_id });
                  document.getElementById('inputTituloColuna').value = '';
                  modalNovaColunaObj.hide();
                  mostrarToast('sucesso', 'Concluído!', 'Nova coluna criada no painel.');
              } else {
                  mostrarToast('erro', 'Atenção', 'Título vazio ou falha na identificação do espaço.');
              }
          }

          function salvarTituloColuna(colunaId, el) {
              const novoTitulo = el.innerText.trim();
              if (novoTitulo) {
                  const colIndex = colunasDados.findIndex(c => c.id == colunaId);
                  
                  // Se clicou, não alterou nada e saiu, cancela silenciosamente
                  if (colIndex > -1 && colunasDados[colIndex].titulo === novoTitulo) {
                      return; 
                  }

                  if (colIndex > -1) colunasDados[colIndex].titulo = novoTitulo;
                  socket.emit('atualizar_titulo_coluna', { colunaId: colunaId, titulo: novoTitulo });
                  mostrarToast('sucesso', 'Atualizado!', 'Título da coluna guardado com sucesso.');
              } else {
                  const colIndex = colunasDados.findIndex(c => c.id == colunaId);
                  if (colIndex > -1) el.innerText = colunasDados[colIndex].titulo;
                  mostrarToast('erro', 'Aviso', 'O título da coluna não pode ser vazio.');
              }
          }

          function aplicarCorColunaVisualmente(colunaId, cor) {
              const colIndex = colunasDados.findIndex(c => c.id == colunaId);
              if (colIndex > -1) colunasDados[colIndex].cor = cor;
              
              const colDiv = document.querySelector('.kanban-column[data-id="' + colunaId + '"]');
              if(colDiv) {
                  colDiv.style.borderColor = hexToRgba(cor, 0.3);
                  const header = colDiv.querySelector('.kanban-header');
                  if(header) { header.style.borderTopColor = cor; header.style.backgroundColor = hexToRgba(cor, 0.15); }
                  const dropdownSquare = colDiv.querySelector('.dropdown-toggle > div');
                  if(dropdownSquare) dropdownSquare.style.backgroundColor = cor;
              }
          }

          function atualizarCorColuna(colunaId, novaCor) {
              aplicarCorColunaVisualmente(colunaId, novaCor); 
              socket.emit('atualizar_cor_coluna', { colunaId: colunaId, cor: novaCor }); 
              mostrarToast('sucesso', 'Cores', 'A cor da coluna foi guardada!');
          }

          function criarCardRapido(colunaId) { 
              socket.emit('novo_card', { colunaId: colunaId, titulo: 'Clique para editar', descricao: '', usuario: NOME_USUARIO }); 
              mostrarToast('sucesso', 'Criado!', 'Novo card inserido na coluna.');
          }

          function confirmarDeletarCard(cardId) {
              document.getElementById('deleteCardId').value = cardId;
              modalDeletarCardObj.show();
          }
          function executarDeletarCard() {
              const id = document.getElementById('deleteCardId').value;
              socket.emit('deletar_card', id);
              modalDeletarCardObj.hide();
              mostrarToast('sucesso', 'Excluído!', 'O card e os seus anexos foram apagados.');
              if (cardAbertoId == id) { cardAbertoId = null; }
          }

          function confirmarDeletarColuna(colunaId) {
              document.getElementById('deleteColunaId').value = colunaId;
              modalDeletarColunaObj.show();
          }
          function executarDeletarColuna() {
              const id = document.getElementById('deleteColunaId').value;
              socket.emit('deletar_coluna', id); 
              modalDeletarColunaObj.hide();
              mostrarToast('sucesso', 'Removido!', 'A coluna e os cards foram apagados.');
          }

          // ==========================================
          // UPLOAD AJAX EM BACKGROUND (SILENCIOSO)
          // ==========================================
          async function handleUploadDireto(input) {
              if(!uploadCardAtualId || input.files.length === 0) return;

              const formData = new FormData();
              for (let i = 0; i < input.files.length; i++) {
                  formData.append("anexo", input.files[i]);
              }

              try {
                  const response = await fetch('/kanban/anexos/' + uploadCardAtualId, { method: 'POST', body: formData });
                  if(response.ok) {
                      mostrarToast('sucesso', 'Upload Concluído', 'Arquivos anexados ao card.');
                      
                      try {
                          const resHtml = await fetch(window.location.href);
                          const textHtml = await resHtml.text();
                          const parser = new DOMParser();
                          const doc = parser.parseFromString(textHtml, 'text/html');
                          
                          // Busca o input hidden com os dados novos
                          const newDataInput = doc.getElementById('kanban-data-input');
                          if (newDataInput && newDataInput.value) {
                              colunasDados = JSON.parse(newDataInput.value);
                              renderizarKanban();
                              if (cardAbertoId) abrirModalCard(cardAbertoId); // Re-renderiza o modal
                          }
                      } catch(e) {
                          console.log("Erro ao atualizar dados da página", e);
                      }
                  } else {
                      mostrarToast('erro', 'Erro', 'Falha ao processar o envio dos arquivos.');
                  }
              } catch (error) {
                  mostrarToast('erro', 'Falha na Rede', 'Verifique a sua conexão à internet.');
              }
          }

          // ==========================================
          // WEBSOCKETS (TEMPO REAL)
          // ==========================================
          socket.on('coluna_criada', (coluna) => {
              coluna.cards = [];
              colunasDados.push(coluna);
              renderizarKanban();
          });

          socket.on('coluna_deletada', (colunaId) => {
              colunasDados = colunasDados.filter(c => c.id != colunaId);
              renderizarKanban();
          });

          socket.on('cor_coluna_atualizada', (dados) => { aplicarCorColunaVisualmente(dados.colunaId, dados.cor); });

          socket.on('titulo_coluna_atualizado', (dados) => {
              const colIndex = colunasDados.findIndex(c => c.id == dados.colunaId);
              if (colIndex > -1) colunasDados[colIndex].titulo = dados.titulo;
              const colDiv = document.querySelector('.kanban-column[data-id="' + dados.colunaId + '"]');
              if (colDiv) {
                  const titleSpan = colDiv.querySelector('.column-title-inline');
                  if (titleSpan && document.activeElement !== titleSpan) titleSpan.innerText = dados.titulo;
              }
          });

          socket.on('card_criado', (card) => {
              const colIndex = colunasDados.findIndex(c => c.id == card.coluna_id);
              if(colIndex > -1) colunasDados[colIndex].cards.push(card);
              renderizarKanban();
          });

          socket.on('card_movido', (dados) => {
              let movedCard = null;
              for (const col of colunasDados) {
                  const idx = col.cards.findIndex(c => c.id == dados.cardId);
                  if (idx > -1) { movedCard = col.cards.splice(idx, 1)[0]; break; }
              }
              if (movedCard) {
                  movedCard.coluna_id = dados.novaColunaId;
                  const newCol = colunasDados.find(c => c.id == dados.novaColunaId);
                  if(newCol) newCol.cards.splice(dados.novaOrdem, 0, movedCard);
              }
              renderizarKanban();
          });

          socket.on('card_atualizado', (dados) => {
              for (const col of colunasDados) {
                  const c = col.cards.find(c => c.id == dados.id);
                  if (c) {
                      c.titulo = dados.titulo;
                      c.descricao = dados.descricao;
                      c.concluido = dados.concluido;
                      c.prazo = dados.prazo;
                      c.prioridade = dados.prioridade;
                      break;
                  }
              }
              
              if (cardAbertoId == dados.id) {
                  if (document.activeElement.id !== 'modalCardTitulo') document.getElementById('modalCardTitulo').innerText = dados.titulo;
                  if (document.activeElement.id !== 'modalCardDescricao') document.getElementById('modalCardDescricao').innerHTML = dados.descricao;
                  document.getElementById('modalCardStatus').checked = !!dados.concluido;
                  
                  const prazoInput = document.getElementById('modalCardPrazo');
                  if(prazoInput) {
                      if (dados.prazo) {
                          prazoInput.value = String(dados.prazo).slice(0, 10);
                      } else {
                          prazoInput.value = '';
                      }
                      document.getElementById('modalCardPrazoBadge').innerHTML = calcularBadgeDiasRestantes(prazoInput.value, dados.concluido);
                  }

                  const prioridadeSelect = document.getElementById('modalCardPrioridade');
                  if (prioridadeSelect && dados.prioridade) {
                      prioridadeSelect.value = dados.prioridade;
                  }
              }
              renderizarKanban();
          });

          socket.on('card_deletado', (cardId) => {
              for (const col of colunasDados) {
                  col.cards = col.cards.filter(c => c.id != cardId);
              }
              if (cardAbertoId == cardId) { modalCardDetalhesObj.hide(); cardAbertoId = null; }
              renderizarKanban();
          });
      </script>
  </body>
  </html>
  `;
}

module.exports = kanbanView;