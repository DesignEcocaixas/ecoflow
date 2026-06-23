// views/espacosDeTrabalhoView.js
const menuLateral = require("./menuLateral");

function espacosDeTrabalhoView(usuario, espacos = []) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const menuHTML = menuLateral(user, "/espacos-trabalho");

  // =========================================================================
  // GERAÇÃO DOS CARDS DE ESPAÇOS DE TRABALHO
  // =========================================================================
  const cards = espacos.length > 0 ? espacos.map(e => {
    // Thumb fallback: Se não houver imagem, carrega um gradiente abstrato com as iniciais
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nome)}&background=08c068&color=1f1f1f&size=250&font-size=0.33`;
    const imgUrl = e.thumb ? `/uploads/${e.thumb}` : fallbackUrl;
    
    return `
    <div class="col-12 col-md-6 col-lg-4 col-xl-3 espaco-card-item">
        <div class="card erp-card bg-custom-darker border-custom shadow-sm h-100 transition-hover" 
             style="cursor: pointer; overflow: hidden;" 
             onclick="window.location.href='/kanban?espaco_id=${e.id}'"
             title="Acessar o quadro Kanban: ${e.nome}">
             
            <div class="position-relative" style="height: 140px; background-color: #222;">
                <img src="${imgUrl}" alt="${e.nome}" class="w-100 h-100" style="object-fit: cover; filter: brightness(0.8);">
                <div class="position-absolute top-0 end-0 m-2">
                    <span class="badge bg-custom-darker border-custom text-muted shadow-sm" style="font-size: 0.6rem;"><i class="fa-solid fa-table-columns text-accent me-1"></i> Kanban</span>
                </div>
            </div>

            <div class="card-body p-3 d-flex flex-column">
                <h6 class="fw-bold text-white mb-1 text-truncate" style="font-size: 0.95rem;">${e.nome}</h6>
                <p class="text-muted mb-3 text-truncate" style="font-size: 0.75rem;">${e.descricao || '<em class="opacity-50">Sem descrição detalhada</em>'}</p>
                
                <div class="mt-auto pt-3 border-top border-custom d-flex justify-content-between align-items-center">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-secondary border-custom text-warning shadow-sm py-1 px-2" onclick="event.stopPropagation(); abrirModalEditarEspaco('${e.id}')" title="Editar">
                            <i class="fa-solid fa-pen" style="font-size:0.75rem;"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary border-custom text-danger shadow-sm py-1 px-2 ms-1" onclick="event.stopPropagation(); abrirModalExcluirEspaco('${e.id}', '${e.nome.replace(/'/g, "\\'")}')" title="Excluir">
                            <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
  }).join("") : `
    <div class="col-12 text-center text-muted py-5 text-center-empty">
        <i class="fa-solid fa-cubes fa-3x opacity-25 mb-3 d-block"></i>
        <span style="font-size: 0.85rem;">Nenhum espaço de trabalho criado.<br>Crie um novo espaço para gerenciar os seus quadros Kanban</span>
    </div>
  `;

  // =========================================================================
  // GERAÇÃO DOS MODAIS DE EDIÇÃO (Injetados via JS para evitar poluição visual)
  // =========================================================================
  const modaisEdicao = espacos.map(e => {
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nome)}&background=08c068&color=1f1f1f&size=250&font-size=0.33`;
      const imgUrl = e.thumb ? `/uploads/${e.thumb}` : fallbackUrl;
      
      return `
      <div class="modal fade" id="editarEspacoModal${e.id}" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog modal-dialog-centered">
              <form method="POST" action="/espacos-trabalho/editar/${e.id}" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Espaço Atualizado!')">
                  <div class="modal-header bg-custom-darker border-custom">
                      <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Espaço de Trabalho</h6>
                      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body text-sm p-4 bg-custom-dark">
                      <div class="row g-3">
                          <div class="col-12 text-center mb-2">
                              <label class="form-label text-muted fw-bold d-block" style="font-size:0.75rem;">Capa (Thumb)</label>
                              <div class="image-upload-wrapper mx-auto shadow-sm border-custom bg-custom-darker position-relative" style="width: 100%; max-width: 250px; height: 120px; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick="document.getElementById('uploadThumbEdit${e.id}').click()">
                                  <img id="previewThumbEdit${e.id}" src="${imgUrl}" class="w-100 h-100" style="object-fit: cover; filter: brightness(0.8);">
                                  <div class="position-absolute top-50 start-50 translate-middle text-white bg-dark bg-opacity-75 px-3 py-1 rounded shadow-sm opacity-hover" style="font-size: 0.75rem; font-weight: bold;"><i class="fa-solid fa-camera me-1"></i> Alterar Capa</div>
                              </div>
                              <input type="file" name="thumb" id="uploadThumbEdit${e.id}" class="d-none" accept="image/*" onchange="previewImage(this, 'previewThumbEdit${e.id}')">
                          </div>

                          <div class="col-12">
                              <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Nome do Espaço *</label>
                              <input type="text" name="nome" class="form-control form-control-sm shadow-sm" value="${e.nome}" required>
                          </div>
                          
                          <div class="col-12">
                              <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Descrição (Opcional)</label>
                              <textarea name="descricao" class="form-control form-control-sm shadow-sm" rows="3" placeholder="Breve descrição do projeto ou setor...">${e.descricao || ''}</textarea>
                          </div>
                      </div>
                  </div>
                  <div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap">
                      <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
                      <button type="submit" class="btn btn-sm btn-primary fw-bold text-dark w-100 shadow-sm"><i class="fa-solid fa-save me-1"></i> Salvar Alterações</button>
                  </div>
              </form>
          </div>
      </div>
      `;
  }).join("");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Espaços de Trabalho | Ecoflow</title>
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

      body { 
          display: flex; 
          height: 100vh; 
          margin: 0; 
          background-color: #1f1f1f;
          color: #ffffff;
          font-family: 'Segoe UI', sans-serif;
      }
      
      .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column;}
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

      /* ERP Cards */
      .erp-card { border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); background-color: #2a2a2a; }
      .transition-hover:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.4) !important; border-color: rgba(8, 192, 104, 0.3) !important; }
      .opacity-hover { opacity: 0; transition: opacity 0.3s ease; }
      .image-upload-wrapper:hover .opacity-hover { opacity: 1; }
      
      /* Modals */
      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
      .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }

      /* ANIMAÇÕES GLOBAIS (TOASTS E MODAIS) */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .modal.fade .modal-dialog { transform: scale(0.85) translateY(30px); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
      .modal.show .modal-dialog { transform: scale(1) translateY(0); }

      .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

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
      .skeleton-btn-view { height: 26px; width: 50px; border-radius: 4px; display: inline-block; }
      .skeleton-img-view { height: 140px; width: 100%; }
      @keyframes skeleton-loading-view {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
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
      <div class="text-center mb-4 mt-2">
        <img src="/img/logo-branca.png" alt="Logo Ecoflow" class="img-fluid" style="max-width:130px;">
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
            <img src="/img/logo.png" alt="Logo" class="img-fluid" style="max-width:140px;">
        </div>
        ${menuHTML}
      </div>
    </div>

    <div class="content">
      
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-cubes text-muted me-2"></i>Espaços de Trabalho</h5>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Organize os quadros Kanban por projetos ou setores</span>
            </div>
        </div>
        <button class="btn btn-sm btn-success fw-bold shadow-sm text-dark px-3" data-bs-toggle="modal" data-bs-target="#novoEspacoModal">
            <i class="fa-solid fa-plus me-1"></i> Criar
        </button>
      </div>

      <div class="row g-3" id="espacosGrid">
        ${cards}
      </div>
    </div>

    <div class="modal fade" id="novoEspacoModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form method="POST" action="/espacos-trabalho/novo" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Espaço Criado com Sucesso!')">
          <div class="modal-header bg-custom-darker border-custom text-white">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-folder-plus text-accent me-2"></i> Criar Espaço de Trabalho</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="row g-3">
                <div class="col-12 text-center mb-2">
                    <label class="form-label text-muted fw-bold d-block" style="font-size:0.75rem;">Capa (Thumb)</label>
                    <div class="image-upload-wrapper mx-auto shadow-sm border-custom bg-custom-darker position-relative" style="width: 100%; max-width: 250px; height: 120px; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick="document.getElementById('uploadThumbNovo').click()">
                        <img id="previewThumbNovo" src="https://ui-avatars.com/api/?name=Projeto&background=222&color=08c068&size=250&font-size=0.25" class="w-100 h-100" style="object-fit: cover; filter: brightness(0.8);">
                        <div class="position-absolute top-50 start-50 translate-middle text-white bg-dark bg-opacity-75 px-3 py-1 rounded shadow-sm opacity-hover" style="font-size: 0.75rem; font-weight: bold;"><i class="fa-solid fa-camera me-1"></i> Adicionar Capa</div>
                    </div>
                    <input type="file" name="thumb" id="uploadThumbNovo" class="d-none" accept="image/*" onchange="previewImage(this, 'previewThumbNovo')">
                </div>

                <div class="col-12">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Nome do Espaço *</label>
                  <input type="text" name="nome" class="form-control form-control-sm shadow-sm" required placeholder="Ex: Produção de Inverno">
                </div>
                
                <div class="col-12">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Descrição (Opcional)</label>
                  <textarea name="descricao" class="form-control form-control-sm shadow-sm" rows="3" placeholder="Breve descrição do projeto ou setor..."></textarea>
                </div>
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success fw-bold text-dark w-100 shadow-sm"><i class="fa-solid fa-check me-1"></i> Criar Espaço</button>
          </div>
        </form>
      </div>
    </div>

    ${modaisEdicao}

    <div class="modal fade" id="modalExcluirEspaco" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <form id="formExcluirEspaco" method="POST" action="" onsubmit="prepararSubmissaoSimples(event, this, 'Espaço Excluído!')">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="mb-2 fw-bold text-white">Excluir Espaço?</h6>
              <p class="text-muted mb-0" style="font-size:0.8rem;">Deseja excluir o espaço <b id="nomeEspacoExcluir" class="text-white"></b>? <b>TODOS</b> os quadros Kanban, cartões e anexos vinculados a ele serão perdidos permanentemente.</p>
            </div>
            <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger fw-bold w-100 shadow-sm">Sim, Excluir</button>
            </div>
          </form>
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
      // PREVIEW DE IMAGEM ANTES DO UPLOAD
      // =======================================================================
      function previewImage(inputElement, imgId) {
          if (inputElement.files && inputElement.files[0]) {
              const reader = new FileReader();
              reader.onload = function(e) {
                  document.getElementById(imgId).src = e.target.result;
              }
              reader.readAsDataURL(inputElement.files[0]);
          }
      }

      // =======================================================================
      // MODAL DE EXCLUSÃO GLOBAL
      // =======================================================================
      function abrirModalExcluirEspaco(id, nome) {
          document.getElementById('nomeEspacoExcluir').innerText = nome;
          document.getElementById('formExcluirEspaco').action = '/espacos-trabalho/excluir/' + id;
          bootstrap.Modal.getOrCreateInstance(document.getElementById('modalExcluirEspaco')).show();
      }

      function abrirModalEditarEspaco(id) {
          bootstrap.Modal.getOrCreateInstance(document.getElementById('editarEspacoModal' + id)).show();
      }

      // =======================================================================
      // SKELETON LOADING (DARK)
      // =======================================================================
      function gerarSkeletonCards(quantidade = 4) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += \`
              <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                <div class="card erp-card bg-custom-darker border-custom shadow-sm border-0 h-100 p-0">
                  <div class="skeleton-dark skeleton-img-view"></div>
                  <div class="card-body p-3 d-flex flex-column">
                    <div class="skeleton-dark skeleton-text-view mb-2" style="width: 70%;"></div>
                    <div class="skeleton-dark skeleton-text-view mb-3" style="width: 50%;"></div>
                    <div class="mt-auto pt-3 border-top border-custom d-flex justify-content-between align-items-center">
                       <div class="skeleton-dark skeleton-text-view" style="width: 40%; margin: 0;"></div>
                       <div class="d-flex gap-1">
                           <div class="skeleton-dark skeleton-btn-view" style="width: 32px;"></div>
                           <div class="skeleton-dark skeleton-btn-view" style="width: 32px;"></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>\`;
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const gridContainer = document.querySelector('.content > .row.g-3');
          const emptyState = document.querySelector('.content > .text-center-empty');
          
          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="row g-3 skeleton-container">
              \${gerarSkeletonCards(4)}
          </div>\`;

          if (gridContainer && !gridContainer.classList.contains('skeleton-container')) {
              gridContainer.style.display = 'none';
              gridContainer.insertAdjacentHTML('beforebegin', skeletonHTML);
          } else if (emptyState) {
              emptyState.style.display = 'none';
              emptyState.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const gridContainer = document.querySelector('.content > .row.g-3:not(.skeleton-container)');
          const emptyState = document.querySelector('.content > .text-center-empty');

          if (gridContainer) gridContainer.style.display = 'flex';
          if (emptyState) emptyState.style.display = 'block';
      }

      mostrarSkeletonGlobais();

      if (document.readyState === 'complete') {
          setTimeout(ocultarSkeletonGlobais, 100);
      } else {
          window.addEventListener('load', ocultarSkeletonGlobais);
      }

      // =======================================================================
      // SUBMISSÃO AJAX SEM RECARREGAR A PÁGINA (SUPORTA FOTOS)
      // =======================================================================
      let isSubmitting = false;

      async function prepararSubmissaoSimples(event, formElement, titleMsg) {
          if (event) event.preventDefault();
          if (!formElement.checkValidity()) {
              formElement.reportValidity();
              return;
          }
          if (isSubmitting) return;

          // Ocultar modal atual com segurança
          const modalEl = formElement.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }

          document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
          document.body.classList.remove('modal-open');
          document.body.style = '';

          mostrarSkeletonGlobais();
          isSubmitting = true;

          try {
              const formData = new FormData(formElement);
              
              const response = await fetch(formElement.action, {
                  method: formElement.method || 'POST',
                  body: formData 
              });

              if (response.ok) {
                  const html = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  // Atualizar o container visual principal
                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }

                  // Atualizar Modais Dinâmicos
                  const staticModals = ['novoEspacoModal', 'modalExcluirEspaco', 'sidebarMenu'];
                  document.querySelectorAll('.modal').forEach(m => {
                      if (!staticModals.includes(m.id)) m.remove();
                  });
                  doc.querySelectorAll('.modal').forEach(m => {
                      if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
                  });

                  formElement.reset();
                  const imgPreview = document.getElementById('previewThumbNovo');
                  if (imgPreview) {
                     imgPreview.src = 'https://ui-avatars.com/api/?name=Projeto&background=222&color=08c068&size=250&font-size=0.25';
                  }

                  mostrarToast('sucesso', 'Concluído!', titleMsg);

              } else {
                  mostrarToast('erro', 'Erro no Servidor', 'Os dados não puderam ser guardados.');
              }
          } catch (err) {
              console.error(err);
              mostrarToast('erro', 'Falha de Conexão', 'Verifique a internet e tente novamente.');
          } finally {
              isSubmitting = false;
              ocultarSkeletonGlobais();
          }
      }
    </script>
  </body>
  </html>
  `;
}

module.exports = espacosDeTrabalhoView;