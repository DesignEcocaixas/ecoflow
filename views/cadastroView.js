// views/cadastroView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");

function cadastroView(usuario, usuarios = []) {
  // Fallback seguro
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  // Acumuladores para separar o conteúdo da tabela dos modais
  const listaModais = [];

  const linhas =
    usuarios && usuarios.length
      ? usuarios
          .map((u) => {
            // Gera um avatar automático se o utilizador não tiver foto
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome)}&background=0D5749&color=fff&size=120`;
            const imgSrc = u.foto ? `/uploads/${u.foto}` : defaultAvatar;

            // Adiciona o Modal de Edição ao acumulador
            listaModais.push(`
              <div class="modal fade" id="editarUsuario${u.id}" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                  <form method="POST" action="/usuarios/editar/${u.id}" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg" onsubmit="prepararSubmissaoSimples(event, this, 'Perfil Atualizado!')">
                    <div class="modal-header bg-white border-0 pb-0">
                      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-sm p-4 pt-0">
                      
                      <div class="text-center mb-4">
                          <div class="profile-upload-container position-relative mx-auto" onclick="document.getElementById('uploadFoto${u.id}').click()" title="Clique para alterar a foto">
                              <img id="previewFoto${u.id}" src="${imgSrc}" data-default-src="${imgSrc}" alt="${u.nome}">
                              <div class="profile-upload-overlay d-flex align-items-center justify-content-center">
                                  <span><i class="fa-solid fa-camera mb-1 d-block"></i> Alterar</span>
                              </div>
                          </div>
                          <input type="file" name="foto" id="uploadFoto${u.id}" class="d-none" accept="image/*" onchange="previewImage(this, 'previewFoto${u.id}')">
                          <h5 class="mt-3 mb-0 fw-bold text-dark">${u.nome}</h5>
                          <span class="badge ${
                            u.tipo_usuario === 'admin' ? 'bg-danger' : 
                            u.tipo_usuario === 'financeiro' ? 'bg-success' : 
                            u.tipo_usuario === 'design' ? 'bg-info text-dark' :
                            u.tipo_usuario === 'logistica' ? 'bg-warning text-dark' :
                            'bg-primary'
                          } mt-1">${(u.tipo_usuario || "admin").toUpperCase()}</span>
                      </div>

                      <hr class="text-muted opacity-25">

                      <div class="row g-3">
                        <div class="col-12">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.8rem;">Nome Completo</label>
                          <input type="text" name="nome" class="form-control form-control-sm shadow-sm" value="${u.nome}" required>
                        </div>
                        <div class="col-12">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.8rem;">E-mail</label>
                          <input type="email" name="email" class="form-control form-control-sm shadow-sm" value="${u.email}" required>
                        </div>
                        <div class="col-12 col-md-6">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.8rem;">Tipo de Usuário</label>
                          <select name="tipo_usuario" class="form-select form-select-sm shadow-sm">
                            <option value="admin" ${u.tipo_usuario === "admin" ? "selected" : ""}>Administrador</option>
                            <option value="motorista" ${u.tipo_usuario === "motorista" ? "selected" : ""}>Motorista</option>
                            <option value="financeiro" ${u.tipo_usuario === "financeiro" ? "selected" : ""}>Financeiro</option>
                            <option value="design" ${u.tipo_usuario === "design" ? "selected" : ""}>Design</option>
                            <option value="logistica" ${u.tipo_usuario === "logistica" ? "selected" : ""}>Logística</option>
                          </select>
                        </div>
                        <div class="col-12 col-md-6">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.8rem;">Nova Senha (opcional)</label>
                          <input type="password" name="senha" class="form-control form-control-sm shadow-sm" placeholder="••••••••">
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer border-0 bg-light d-flex flex-nowrap">
                      <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                      <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold"><i class="fa-solid fa-save me-1"></i> Salvar</button>
                    </div>
                  </form>
                </div>
              </div>

              <div class="modal fade" id="excluirUsuario${u.id}" tabindex="-1">
                <div class="modal-dialog modal-sm modal-dialog-centered">
                  <div class="modal-content erp-modal border-0 shadow-lg">
                    <form method="POST" action="/usuarios/excluir/${u.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Acesso Revogado!')">
                      <div class="modal-body text-center p-4">
                        <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                        <h6 class="mb-2 fw-bold">Excluir Usuário?</h6>
                        <p class="text-muted mb-0" style="font-size:0.85rem;">Tem certeza que deseja excluir permanentemente o acesso de <b>${u.nome}</b>?</p>
                      </div>
                      <div class="modal-footer justify-content-center bg-light border-0 d-flex flex-nowrap">
                        <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold">Sim, Excluir</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            `);

            // Retorna apenas a linha da tabela CLICÁVEL
            return `
              <tr class="align-middle table-hover-row" style="cursor: pointer;" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('editarUsuario${u.id}')).show();">
                <td class="fw-medium text-dark py-2">
                  <div class="d-flex align-items-center">
                    ${u.foto 
                      ? `<img src="/uploads/${u.foto}" alt="${u.nome}" class="rounded-circle me-3 border shadow-sm" style="width: 38px; height: 38px; object-fit: cover;">` 
                      : `<img src="${defaultAvatar}" alt="${u.nome}" class="rounded-circle me-3 border shadow-sm" style="width: 38px; height: 38px; object-fit: cover;">`
                    }
                    ${u.nome}
                  </div>
                </td>
                <td class="text-muted py-2" style="font-size: 0.85rem;">${u.email}</td>
                <td class="py-2">
                  <span class="badge ${
                    u.tipo_usuario === 'admin' ? 'bg-danger text-white' : 
                    u.tipo_usuario === 'financeiro' ? 'bg-success text-white' : 
                    u.tipo_usuario === 'design' ? 'bg-info text-dark' :
                    u.tipo_usuario === 'logistica' ? 'bg-warning text-dark' :
                    'bg-primary text-white'
                  } bg-opacity-75" style="font-size:0.7rem; letter-spacing: 0.5px;">
                    ${(u.tipo_usuario || "admin").toUpperCase()}
                  </span>
                </td>
                <td class="text-end text-nowrap py-2">
                  <button type="button" class="btn btn-sm btn-light border text-danger shadow-sm" onclick="event.stopPropagation(); bootstrap.Modal.getOrCreateInstance(document.getElementById('excluirUsuario${u.id}')).show();" title="Excluir Acesso">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="4" class="text-center text-muted p-5"><i class="fa-solid fa-users-slash fa-3x mb-3 opacity-25"></i><br>Nenhum usuário cadastrado no sistema.</td></tr>`;

  const menuHTML = menuLateral(user, "/cadastro");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastro de Usuários | ERP Ecoflow</title>
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
      .sidebar { width: 240px; background-color: #0D5749; color: white; padding: 20px; display: flex; flex-direction: column;}
      .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s;}
      .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
      .content { flex: 1; padding: 24px; overflow-y: auto; overflow-x: hidden; position: relative; }
      .text-sm { font-size: 0.875rem; }
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
      .erp-card {
          border-radius: 12px;
          background: #fff;
          border: none;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          overflow: hidden;
      }
      .table > :not(caption) > * > * { padding: 12px 16px; border-bottom-color: #f0f0f0; }
      .table thead th {
          background-color: #fafbfc;
          color: #6c757d;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e9ecef;
      }
      .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      .erp-modal .modal-header { border-bottom: 1px solid #f0f0f0; }
      .erp-modal .modal-footer { border-top: 1px solid #f0f0f0; }
      .form-control-sm, .form-select-sm { border-radius: 6px; }

      /* Efeito de Hover na Tabela */
      .table-hover-row { transition: background-color 0.2s; }
      .table-hover-row:hover > td { background-color: rgba(13, 87, 73, 0.06) !important; }

      /* Container da Foto de Perfil */
      .profile-upload-container {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          overflow: hidden;
          background-color: #f0f0f0;
          border: 3px solid #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          cursor: pointer;
      }
      .profile-upload-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
      }
      .profile-upload-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 35%;
          background: rgba(0,0,0,0.65);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.3s ease;
      }
      .profile-upload-container:hover .profile-upload-overlay {
          opacity: 1;
      }

      /* ANIMAÇÕES GLOBAIS (TOASTS E MODAIS) */
      .toast {
          transform: translateX(120%);
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important;
      }
      .toast.showing, .toast.show {
          transform: translateX(0);
      }
      .modal.fade .modal-dialog {
          transform: scale(0.85) translateY(30px);
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
      }
      .modal.show .modal-dialog {
          transform: scale(1) translateY(0);
      }

      .toast-timer {
          height: 6px;
          background: rgba(255, 255, 255, 0.4);
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

      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 16px; }
      }
      .offcanvas-body a { display: block; text-align: left; padding: 12px 15px; color: white; text-decoration: none; margin: 4px 0; border-radius: 6px;}
      .offcanvas-body a:hover, .offcanvas-body a.active { background-color: rgba(255,255,255,0.1); }
    </style>
  </head>
  <body>
    ${renderLoaderParticulas("Listando usuários")}

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
        <a href="/logout" class="text-danger mt-2"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-light border d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars"></i></button>
            <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-users text-muted me-2"></i>Gestão de Usuários</h4>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-3 shadow-sm border border-light">
        <div>
            <h6 class="mb-0 text-muted" style="font-size:0.85rem;">Total de Cadastros: <strong>${usuarios.length}</strong></h6>
        </div>
        <button class="btn btn-sm btn-success px-3 shadow-sm fw-bold" data-bs-toggle="modal" data-bs-target="#novoUsuarioModal">
          <i class="fa-solid fa-user-plus me-1"></i> Novo Usuário
        </button>
      </div>

      <div class="erp-card border border-light">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0" style="font-size: 0.9rem;">
            <thead>
              <tr>
                <th>Nome Completo</th>
                <th>E-mail</th>
                <th>Perfil de Acesso</th>
                <th class="text-end" style="width: 80px;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${linhas}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal fade" id="novoUsuarioModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/usuarios/novo" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg" onsubmit="prepararSubmissaoSimples(event, this, 'Cadastro Realizado!')">
          <div class="modal-header bg-success border-0 text-white">
            <h6 class="modal-title fw-bold"><i class="fa-solid fa-user-plus me-2"></i> Novo Usuário</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-light">
            <div class="row g-3">
              <div class="col-12 text-center mb-3">
                  <label class="form-label text-muted mb-2 fw-bold d-block" style="font-size:0.8rem;">Foto de Perfil (Opcional)</label>
                  <div class="profile-upload-container position-relative mx-auto" onclick="document.getElementById('uploadFotoNovo').click()" title="Escolher Foto">
                      <img id="previewFotoNovo" data-default-src="https://ui-avatars.com/api/?name=Novo+Usuario&background=e9ecef&color=6c757d&size=120" src="https://ui-avatars.com/api/?name=Novo+Usuario&background=e9ecef&color=6c757d&size=120" alt="Novo Usuário">
                      <div class="profile-upload-overlay d-flex align-items-center justify-content-center">
                          <span><i class="fa-solid fa-camera mb-1 d-block"></i> Escolher</span>
                      </div>
                  </div>
                  <input type="file" name="foto" id="uploadFotoNovo" class="d-none" accept="image/*" onchange="previewImage(this, 'previewFotoNovo')">
              </div>

              <div class="col-12">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.8rem;">Nome Completo</label>
                <input type="text" name="nome" class="form-control form-control-sm shadow-sm" required placeholder="Ex: João da Silva">
              </div>
              <div class="col-12">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.8rem;">E-mail</label>
                <input type="email" name="email" class="form-control form-control-sm shadow-sm" required placeholder="joao@ecoflow.com">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.8rem;">Senha de Acesso</label>
                <input type="password" name="senha" class="form-control form-control-sm shadow-sm" required placeholder="••••••••">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.8rem;">Perfil / Tipo de Usuário</label>
                <select name="tipo_usuario" class="form-select form-select-sm shadow-sm" required>
                  <option value="admin">Administrador</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="motorista" selected>Motorista</option>
                  <option value="design">Design</option>
                  <option value="logistica">Logística</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 bg-white d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success w-100 fw-bold"><i class="fa-solid fa-check me-1"></i> Criar Acesso</button>
          </div>
        </form>
      </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-success text-white overflow-hidden position-relative" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-check fs-5 me-2" id="sucessoIcon"></i>
                    <strong class="fs-6" id="sucessoTitulo">Concluído!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.9rem; opacity: 0.9;" id="sucessoSub">Operação realizada com sucesso.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 6px;"></div>
        </div>

        <div id="erroToast" class="toast shadow-lg border-0 bg-danger text-white overflow-hidden position-relative" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-xmark fs-5 me-2"></i>
                    <strong class="fs-6" id="erroTitulo">Erro!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.9rem; opacity: 0.9;" id="erroSub">Ocorreu um erro ao processar.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="erroTimer" style="display: none; height: 6px;"></div>
        </div>
    </div>

    ${listaModais.join("")}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

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
        // SUBMISSÃO AJAX COM SUPORTE A UPLOAD DE ARQUIVOS (MULTIPART/FORM-DATA)
        // =======================================================================
        let isSubmitting = false;

        async function prepararSubmissaoSimples(event, form, defaultMsg) {
            event.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            if (isSubmitting) return;

            // Fecha o modal aberto imediatamente
            const modalEl = form.closest('.modal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.hide();
            }

            // Defesa extra: Remove o ecrã escuro caso fique travado
            document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
            document.body.classList.remove('modal-open');
            document.body.style = '';

            // Exibe Toast no modo "Aguarde..."
            const successToastEl = document.getElementById('sucessoToast');
            document.getElementById('sucessoTitulo').innerText = "A Processar";
            document.getElementById('sucessoSub').innerText = "Por favor, aguarde...";
            successToastEl.setAttribute('data-bs-autohide', 'false');

            const timerEl = document.getElementById('sucessoTimer');
            if (timerEl) timerEl.style.display = 'none';

            const oldInstance = bootstrap.Toast.getInstance(successToastEl);
            if (oldInstance) oldInstance.dispose();
            const successToast = new bootstrap.Toast(successToastEl);
            successToast.show();

            isSubmitting = true;

            try {
                // O FormData funciona perfeitamente para Criar, Editar (com foto ou sem foto) e Excluir
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

                    // 2. Atualizar todos os Modais de Edição/Exclusão
                    const staticModals = ['novoUsuarioModal', 'sidebarMenu'];
                    document.querySelectorAll('.modal').forEach(m => {
                        if (!staticModals.includes(m.id)) m.remove();
                    });
                    doc.querySelectorAll('.modal').forEach(m => {
                        if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
                    });

                    // 3. Reset do formulário original e pré-visualização de imagem
                    form.reset();
                    const previewImg = form.querySelector('img[id^="previewFoto"]');
                    if (previewImg) {
                        previewImg.src = previewImg.dataset.defaultSrc || "https://ui-avatars.com/api/?name=Novo+Usuario&background=e9ecef&color=6c757d&size=120";
                    }

                    // 4. Analisar URL caso o servidor envie mensagens específicas
                    const responseUrl = new URL(response.url);
                    let finalMsg = defaultMsg;
                    if (responseUrl.searchParams.has('sucesso')) finalMsg = 'Novo usuário foi adicionado ao sistema.';
                    if (responseUrl.searchParams.has('editado')) finalMsg = 'As informações do usuário foram salvas.';
                    if (responseUrl.searchParams.has('excluido')) finalMsg = 'O usuário foi removido com sucesso.';

                    mostrarToast('sucesso', 'Concluído!', finalMsg);
                } else {
                    mostrarToast('erro', 'Erro', 'Não foi possível guardar os dados no servidor.');
                }
            } catch (err) {
                console.error(err);
                mostrarToast('erro', 'Falha de Conexão', 'Verifique a sua rede e tente novamente.');
            } finally {
                isSubmitting = false;
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
    </script>
  </body>
  </html>
  `;
}

module.exports = cadastroView;