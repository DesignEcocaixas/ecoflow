// views/cadastroView.js
const menuLateral = require("./menuLateral");

function cadastroView(usuario, usuarios = []) {
  // Fallback seguro
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  // Funções de formatação para injetar os valores já com máscara no HTML gerado
  const applyMaskPhone = (v) => {
      if (!v) return "";
      v = String(v).replace(/\D/g, "");
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 10) return v.replace(/^(\d{2})(\d{1})(\d{4})(\d{4}).*/, "($1) $2 $3-$4");
      if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
      if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
      if (v.length > 0) return v.replace(/^(\d*)/, "($1");
      return v;
  };

  const applyMaskCPF = (v) => {
      if (!v) return "";
      v = String(v).replace(/\D/g, "");
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 9) return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.$2.$3-$4");
      if (v.length > 6) return v.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, "$1.$2.$3");
      if (v.length > 3) return v.replace(/^(\d{3})(\d{0,3})/, "$1.$2");
      return v;
  };

  // Acumuladores para separar o conteúdo da tabela dos modais
  const listaModais = [];

  const linhas =
    usuarios && usuarios.length
      ? usuarios
          .map((u) => {
            // Gera um avatar automático se o utilizador não tiver foto
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome)}&background=1f1f1f&color=08c068&size=120`;
            const imgSrc = u.foto ? `/uploads/${u.foto}` : defaultAvatar;

            // Verificação de tipos "Sem Login"
            const noLoginTypes = ['motorista_avulso', 'ajudante', 'diarista'];
            const isNoLogin = noLoginTypes.includes(u.tipo_usuario);
            const loginStyle = isNoLogin ? 'display: none;' : '';
            const noLoginStyle = isNoLogin ? '' : 'display: none;';
            const emailRequired = isNoLogin ? '' : 'required';

            // Tratamento das cores dos Badges
            let badgeColor = 'bg-custom-dark border-custom text-accent';
            if (u.tipo_usuario === 'admin') badgeColor = 'bg-custom-dark border-custom text-danger';
            else if (u.tipo_usuario === 'financeiro') badgeColor = 'bg-custom-dark border-custom text-success';
            else if (u.tipo_usuario === 'design') badgeColor = 'bg-custom-dark border-custom text-info';
            else if (u.tipo_usuario === 'logistica') badgeColor = 'bg-custom-dark border-custom text-warning';
            else if (isNoLogin) badgeColor = 'bg-custom-darker border-custom text-muted';

            // Aplica as máscaras para usar no Modal e na Tabela
            const cpfFormatado = applyMaskCPF(u.cpf);
            const telefoneFormatado = applyMaskPhone(u.telefone);

            // Adiciona o Modal de Edição ao acumulador
            listaModais.push(`
              <div class="modal fade" id="editarUsuario${u.id}" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                  <form method="POST" action="/usuarios/editar/${u.id}" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" autocomplete="off" onsubmit="prepararSubmissaoSimples(event, this, 'Perfil Atualizado!')">
                    <div class="modal-header bg-custom-darker border-0 pb-0">
                      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-sm p-4 pt-0 bg-custom-darker">
                      
                      <div class="text-center mb-4 mt-2">
                          <div class="profile-upload-container position-relative mx-auto border-custom" onclick="document.getElementById('uploadFoto${u.id}').click()" title="Clique para alterar a foto">
                              <img id="previewFoto${u.id}" src="${imgSrc}" data-default-src="${imgSrc}" alt="${u.nome}">
                              <div class="profile-upload-overlay d-flex align-items-center justify-content-center">
                                  <span><i class="fa-solid fa-camera mb-1 d-block"></i> Alterar</span>
                              </div>
                          </div>
                          <input type="file" name="foto" id="uploadFoto${u.id}" class="d-none" accept="image/*" onchange="previewImage(this, 'previewFoto${u.id}')">
                          <h5 class="mt-3 mb-0 fw-bold text-white">${u.nome}</h5>
                          <span class="badge ${badgeColor} mt-2 px-3 py-1 shadow-sm" style="font-size: 0.65rem;">${(u.tipo_usuario || "admin").replace('_', ' ').toUpperCase()}</span>
                      </div>

                      <hr class="text-muted border-custom opacity-50 mb-4">

                      <div class="row g-3 bg-custom-dark p-3 rounded border-custom shadow-sm">
                        <div class="col-12">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Nome Completo</label>
                          <input type="text" name="nome" class="form-control form-control-sm shadow-sm" value="${u.nome}" required autocomplete="off">
                        </div>
                        <div class="col-12">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Tipo de Perfil</label>
                          <select name="tipo_usuario" class="form-select form-select-sm shadow-sm text-white" onchange="toggleRoleFields(this)" required>
                            <optgroup label="Acesso ao Sistema">
                                <option value="admin" ${u.tipo_usuario === "admin" ? "selected" : ""}>Administrador</option>
                                <option value="motorista" ${u.tipo_usuario === "motorista" ? "selected" : ""}>Motorista Padrão</option>
                                <option value="financeiro" ${u.tipo_usuario === "financeiro" ? "selected" : ""}>Financeiro</option>
                                <option value="design" ${u.tipo_usuario === "design" ? "selected" : ""}>Design</option>
                                <option value="logistica" ${u.tipo_usuario === "logistica" ? "selected" : ""}>Logística</option>
                            </optgroup>
                            <optgroup label="Colaboradores (Sem Login)">
                                <option value="motorista_avulso" ${u.tipo_usuario === "motorista_avulso" ? "selected" : ""}>Motorista Avulso</option>
                                <option value="ajudante" ${u.tipo_usuario === "ajudante" ? "selected" : ""}>Ajudante</option>
                                <option value="diarista" ${u.tipo_usuario === "diarista" ? "selected" : ""}>Diarista</option>
                            </optgroup>
                          </select>
                        </div>

                        <div class="col-12 login-field" style="${loginStyle}">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">E-mail</label>
                          <input type="email" name="email" class="form-control form-control-sm shadow-sm" value="${u.email || ''}" ${emailRequired} autocomplete="new-password">
                        </div>
                        <div class="col-12 col-md-6 login-field" style="${loginStyle}">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Nova Senha</label>
                          <div class="input-group input-group-sm shadow-sm">
                            <input type="password" name="senha" id="senhaEdit${u.id}" class="form-control border-end-0" placeholder="••••••••" autocomplete="new-password">
                            <button class="btn btn-outline-secondary border-custom bg-custom-darker border-start-0" type="button" onclick="togglePassword('senhaEdit${u.id}', this)">
                              <i class="fa-solid fa-eye text-muted"></i>
                            </button>
                          </div>
                        </div>
                        <div class="col-12 col-md-6 login-field" style="${loginStyle}">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Confirmar Senha</label>
                          <div class="input-group input-group-sm shadow-sm">
                            <input type="password" name="confirma_senha" id="confirmaSenhaEdit${u.id}" class="form-control border-end-0" placeholder="••••••••" autocomplete="new-password">
                            <button class="btn btn-outline-secondary border-custom bg-custom-darker border-start-0" type="button" onclick="togglePassword('confirmaSenhaEdit${u.id}', this)">
                              <i class="fa-solid fa-eye text-muted"></i>
                            </button>
                          </div>
                        </div>

                        <div class="col-12 col-md-6 no-login-field" style="${noLoginStyle}">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">CPF</label>
                          <input type="text" name="cpf" class="form-control form-control-sm shadow-sm" value="${cpfFormatado}" placeholder="000.000.000-00" autocomplete="off" oninput="this.value = maskCPF(this.value)">
                        </div>
                        <div class="col-12 col-md-6 no-login-field" style="${noLoginStyle}">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Telefone</label>
                          <input type="text" name="telefone" class="form-control form-control-sm shadow-sm" value="${telefoneFormatado}" placeholder="(00) 0 0000-0000" autocomplete="off" oninput="this.value = maskPhone(this.value)">
                        </div>
                        <div class="col-12 col-md-6 no-login-field" style="${noLoginStyle}">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Chave PIX</label>
                          <input type="text" name="pix" class="form-control form-control-sm shadow-sm" value="${u.pix || ''}" placeholder="Chave do recebedor" autocomplete="off">
                        </div>
                        <div class="col-12 col-md-6 no-login-field" style="${noLoginStyle}">
                          <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Banco</label>
                          <input type="text" name="banco" class="form-control form-control-sm shadow-sm" value="${u.banco || ''}" placeholder="Ex: Nubank, Inter, Caixa..." autocomplete="off">
                        </div>
                      </div>

                    </div>
                    <div class="modal-footer border-0 bg-custom-darker d-flex flex-nowrap pt-3">
                      <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" data-bs-dismiss="modal">Cancelar</button>
                      <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm text-dark"><i class="fa-solid fa-save me-1"></i> Salvar</button>
                    </div>
                  </form>
                </div>
              </div>

              <div class="modal fade" id="excluirUsuario${u.id}" tabindex="-1">
                <div class="modal-dialog modal-sm modal-dialog-centered">
                  <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
                    <form method="POST" action="/usuarios/excluir/${u.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Acesso Revogado!')">
                      <div class="modal-body text-center p-4">
                        <i class="fa-solid fa-triangle-exclamation fa-2x text-danger mb-3"></i>
                        <h6 class="mb-2 fw-bold text-white" style="font-size: 0.9rem;">Excluir Usuário?</h6>
                        <p class="text-muted mb-0" style="font-size:0.8rem;">Tem certeza que deseja excluir permanentemente o cadastro de <b>${u.nome}</b>?</p>
                      </div>
                      <div class="modal-footer justify-content-center border-0 bg-custom-darker d-flex flex-nowrap">
                        <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Sim, Excluir</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            `);

            return `
              <tr class="align-middle table-hover-row" style="cursor: pointer;" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('editarUsuario${u.id}')).show();">
                <td class="fw-medium text-white py-2 px-3">
                  <div class="d-flex align-items-center">
                    ${u.foto 
                      ? `<img src="/uploads/${u.foto}" alt="${u.nome}" class="rounded-circle me-3 border-custom shadow-sm" style="width: 32px; height: 32px; object-fit: cover; flex-shrink: 0;">` 
                      : `<img src="${defaultAvatar}" alt="${u.nome}" class="rounded-circle me-3 border-custom shadow-sm" style="width: 32px; height: 32px; object-fit: cover; flex-shrink: 0;">`
                    }
                    <span class="text-truncate" style="font-size: 0.85rem;">${u.nome}</span>
                  </div>
                </td>
                <td class="text-muted py-2 px-3" style="font-size: 0.75rem;">
                  ${isNoLogin ? `<i class="fa-solid fa-phone me-1 opacity-50"></i> ${telefoneFormatado || 'Sem contato'}` : `<i class="fa-solid fa-envelope me-1 opacity-50"></i> ${u.email}`}
                </td>
                <td class="py-2 px-3">
                  <span class="badge ${badgeColor} border shadow-sm px-2 py-1" style="font-size:0.65rem; letter-spacing: 0.5px;">
                    ${(u.tipo_usuario || "admin").replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td class="text-end text-nowrap py-2 px-3">
                  <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger shadow-sm py-1 px-2" onclick="event.stopPropagation(); bootstrap.Modal.getOrCreateInstance(document.getElementById('excluirUsuario${u.id}')).show();" title="Excluir">
                    <i class="fa-solid fa-trash" style="font-size: 0.75rem;"></i>
                  </button>
                </td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="4" class="text-center text-muted py-5"><i class="fa-solid fa-users-slash fa-2x mb-3 opacity-25 d-block"></i><span style="font-size: 0.8rem;">Nenhum usuário cadastrado no sistema.</span></td></tr>`;

  const menuHTML = menuLateral(user, "/cadastro");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Colaboradores & Usuários | Ecoflow</title>
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

      body { 
          display: flex; 
          height: 100vh; 
          margin: 0; 
          background-color: #1f1f1f;
          color: #ffffff;
          font-family: 'Roboto', system-ui, -apple-system, sans-serif;
      }
      .sidebar { width: 240px; background-color: #1f1f1f !important; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column;}
      .content { flex: 1; padding: 24px; overflow-y: auto; overflow-x: hidden; position: relative; background-color: #1f1f1f; }
      
      /* Tema Escuro Customizado */
      .bg-custom-dark { background-color: #2a2a2a !important; }
      .bg-custom-darker { background-color: #222222 !important; }
      .border-custom { border-color: rgba(255,255,255,0.08) !important; border-style: solid; border-width: 1px; }
      .text-accent { color: #08c068 !important; }

      /* Modificadores Bootstrap */
      .text-dark { color: #ffffff !important; }
      .text-muted { color: rgba(255,255,255,0.5) !important; }

      /* Botões */
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

      /* Tabelas e Modais */
      .erp-card {
          border-radius: 12px;
          background: #2a2a2a;
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          overflow: hidden;
      }
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
          font-size: 0.75rem;
          text-transform: uppercase;
      }
      .table tbody td { 
          border-bottom: 1px solid rgba(255,255,255,0.05) !important; 
          background-color: transparent !important; 
          color: #fff !important; 
      }
      
      /* Efeito de Hover na Tabela */
      .table-hover-row { transition: background-color 0.2s ease; }
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

      /* Container da Foto de Perfil */
      .profile-upload-container {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          overflow: hidden;
          background-color: #1f1f1f;
          border: 3px solid rgba(8,192,104,0.3);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
          font-size: 0.65rem;
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

      /* SKELETON LOADING DA TABELA E GRID (DARK) */
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
      .skeleton-avatar-view { height: 38px; width: 38px; border-radius: 50%; }
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
        <img src="/img/logo-branca.png" alt="Logo da Empresa" class="img-fluid" style="max-width: 130px;">
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
            <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid" style="max-width:140px;">
        </div>
        ${menuHTML}
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-users-gear text-muted me-2"></i>Colaboradores</h5>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-4 bg-custom-darker p-3 rounded-3 shadow-sm border border-custom flex-wrap gap-2">
        <div>
            <h6 class="mb-0 text-muted" style="font-size:0.8rem;">Total Registado: <strong class="text-white">${usuarios.length}</strong> pessoas</h6>
        </div>
        <button class="btn btn-sm btn-success px-3 shadow-sm fw-bold text-dark" style="font-size: 0.8rem;" data-bs-toggle="modal" data-bs-target="#novoUsuarioModal">
          <i class="fa-solid fa-user-plus me-1"></i> Novo usuário
        </button>
      </div>

      <div class="erp-card border-custom">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0" style="font-size: 0.8rem;">
            <thead class="table-light">
              <tr>
                <th class="py-2 px-3">Nome / Colaborador</th>
                <th class="py-2 px-3">E-mail / Contato</th>
                <th class="py-2 px-3">Perfil de Acesso</th>
                <th class="py-2 px-3 text-end" style="width: 80px;">Ações</th>
              </tr>
            </thead>
            <tbody class="border-top-0">
              ${linhas}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal fade" id="novoUsuarioModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/usuarios/novo" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" autocomplete="off" onsubmit="prepararSubmissaoSimples(event, this, 'Cadastro Realizado!')">
          <div class="modal-header bg-custom-darker border-0 text-white">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-user-plus text-accent me-2"></i> Adicionar Colaborador</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-darker">
            <div class="row g-3 bg-custom-dark p-3 rounded border-custom shadow-sm">
              <div class="col-12 text-center mb-2">
                  <label class="form-label text-muted mb-2 fw-bold d-block" style="font-size:0.75rem;">Foto (Opcional)</label>
                  <div class="profile-upload-container position-relative mx-auto border-custom" onclick="document.getElementById('uploadFotoNovo').click()" title="Escolher Foto">
                      <img id="previewFotoNovo" data-default-src="https://ui-avatars.com/api/?name=Novo+Registro&background=1f1f1f&color=08c068&size=120" src="https://ui-avatars.com/api/?name=Novo+Registro&background=1f1f1f&color=08c068&size=120" alt="Novo">
                      <div class="profile-upload-overlay d-flex align-items-center justify-content-center">
                          <span><i class="fa-solid fa-camera mb-1 d-block"></i> Escolher</span>
                      </div>
                  </div>
                  <input type="file" name="foto" id="uploadFotoNovo" class="d-none" accept="image/*" onchange="previewImage(this, 'previewFotoNovo')">
              </div>

              <div class="col-12">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Nome Completo</label>
                <input type="text" name="nome" class="form-control form-control-sm shadow-sm" required placeholder="Ex: João da Silva" autocomplete="off">
              </div>
              
              <div class="col-12">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Perfil / Tipo de Cadastro</label>
                <select name="tipo_usuario" class="form-select form-select-sm shadow-sm text-white" onchange="toggleRoleFields(this)" required>
                  <optgroup label="Acesso ao Sistema">
                      <option value="admin">Administrador</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="motorista" selected>Motorista</option>
                      <option value="design">Design</option>
                      <option value="logistica">Logística</option>
                  </optgroup>
                  <optgroup label="Colaboradores (Sem Login)">
                      <option value="motorista_avulso">Motorista Avulso</option>
                      <option value="ajudante">Ajudante</option>
                      <option value="diarista">Diarista</option>
                  </optgroup>
                </select>
              </div>

              <div class="col-12 login-field">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">E-mail de Acesso</label>
                <input type="email" name="email" class="form-control form-control-sm shadow-sm" required placeholder="email@ecoflow.com" autocomplete="new-password">
              </div>
              <div class="col-12 col-md-6 login-field">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Senha</label>
                <div class="input-group input-group-sm shadow-sm">
                  <input type="password" name="senha" id="senhaNovo" class="form-control border-end-0" required placeholder="••••••••" autocomplete="new-password">
                  <button class="btn btn-outline-secondary bg-custom-darker border-custom border-start-0" type="button" onclick="togglePassword('senhaNovo', this)">
                    <i class="fa-solid fa-eye text-muted"></i>
                  </button>
                </div>
              </div>
              <div class="col-12 col-md-6 login-field">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Confirmar Senha</label>
                <div class="input-group input-group-sm shadow-sm">
                  <input type="password" name="confirma_senha" id="confirmaSenhaNovo" class="form-control border-end-0" required placeholder="••••••••" autocomplete="new-password">
                  <button class="btn btn-outline-secondary bg-custom-darker border-custom border-start-0" type="button" onclick="togglePassword('confirmaSenhaNovo', this)">
                    <i class="fa-solid fa-eye text-muted"></i>
                  </button>
                </div>
              </div>

              <div class="col-12 col-md-6 no-login-field" style="display: none;">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">CPF</label>
                <input type="text" name="cpf" class="form-control form-control-sm shadow-sm" placeholder="000.000.000-00" autocomplete="off" oninput="this.value = maskCPF(this.value)">
              </div>
              <div class="col-12 col-md-6 no-login-field" style="display: none;">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Telefone</label>
                <input type="text" name="telefone" class="form-control form-control-sm shadow-sm" placeholder="(00) 0 0000-0000" autocomplete="off" oninput="this.value = maskPhone(this.value)">
              </div>
              <div class="col-12 col-md-6 no-login-field" style="display: none;">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Chave PIX</label>
                <input type="text" name="pix" class="form-control form-control-sm shadow-sm" placeholder="Chave do recebedor" autocomplete="off">
              </div>
              <div class="col-12 col-md-6 no-login-field" style="display: none;">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Banco</label>
                <input type="text" name="banco" class="form-control form-control-sm shadow-sm" placeholder="Ex: Nubank, Inter, Caixa..." autocomplete="off">
              </div>

            </div>
          </div>
          <div class="modal-footer border-0 bg-custom-darker d-flex flex-nowrap pt-3">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold text-dark shadow-sm"><i class="fa-solid fa-check me-1"></i> Salvar Cadastro</button>
          </div>
        </form>
      </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
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

    ${listaModais.join("")}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

    <script>
        // =======================================================================
        // MÁSCARAS DE INPUT PARA CPF E TELEFONE
        // =======================================================================
        function maskPhone(v) {
            v = v.replace(/\\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            
            if (v.length > 10) {
                v = v.replace(/^(\\d{2})(\\d{1})(\\d{4})(\\d{4}).*/, "($1) $2 $3-$4");
            } else if (v.length > 6) {
                v = v.replace(/^(\\d{2})(\\d{4})(\\d{0,4}).*/, "($1) $2-$3");
            } else if (v.length > 2) {
                v = v.replace(/^(\\d{2})(\\d{0,5})/, "($1) $2");
            } else if (v.length > 0) {
                v = v.replace(/^(\\d*)/, "($1");
            }
            return v;
        }

        function maskCPF(v) {
            v = v.replace(/\\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            
            if (v.length > 9) {
                v = v.replace(/^(\\d{3})(\\d{3})(\\d{3})(\\d{2}).*/, "$1.$2.$3-$4");
            } else if (v.length > 6) {
                v = v.replace(/^(\\d{3})(\\d{3})(\\d{0,3}).*/, "$1.$2.$3");
            } else if (v.length > 3) {
                v = v.replace(/^(\\d{3})(\\d{0,3})/, "$1.$2");
            }
            return v;
        }

        // =======================================================================
        // CONTROLE DINÂMICO DE CAMPOS DO FORMULÁRIO (LOGIN VS SEM LOGIN)
        // =======================================================================
        function toggleRoleFields(selectEl) {
            const form = selectEl.closest('form');
            const isNoLogin = ['motorista_avulso', 'ajudante', 'diarista'].includes(selectEl.value);
            
            const loginFields = form.querySelectorAll('.login-field');
            const noLoginFields = form.querySelectorAll('.no-login-field');
            
            const emailInput = form.querySelector('input[name="email"]');
            const senhaInput = form.querySelector('input[name="senha"]');
            const confirmaInput = form.querySelector('input[name="confirma_senha"]');

            if (isNoLogin) {
                // Esconde E-mail e Senhas
                loginFields.forEach(el => el.style.display = 'none');
                // Mostra CPF, PIX, Banco, Telefone
                noLoginFields.forEach(el => el.style.display = ''); 
                
                // Remove a obrigatoriedade dos campos de login
                if (emailInput) emailInput.removeAttribute('required');
                if (senhaInput && form.action.includes('/novo')) senhaInput.removeAttribute('required');
                if (confirmaInput && form.action.includes('/novo')) confirmaInput.removeAttribute('required');
            } else {
                // Mostra E-mail e Senhas
                loginFields.forEach(el => el.style.display = '');
                // Esconde CPF, PIX, Banco, Telefone
                noLoginFields.forEach(el => el.style.display = 'none');
                
                // Retorna a obrigatoriedade
                if (emailInput) emailInput.setAttribute('required', 'true');
                if (form.action.includes('/novo')) {
                    if (senhaInput) senhaInput.setAttribute('required', 'true');
                    if (confirmaInput) confirmaInput.setAttribute('required', 'true');
                }
            }
        }

        // Executa a verificação em todos os modais ao iniciar a página
        function initRoleToggles() {
            document.querySelectorAll('select[name="tipo_usuario"]').forEach(select => {
                toggleRoleFields(select);
            });
        }
        window.addEventListener('load', initRoleToggles);

        // =======================================================================
        // SKELETON LOADING (CORRIGIDO MODO ESCURO)
        // =======================================================================
        function gerarSkeletonTabela(quantidade = 4) {
            let html = '';
            for(let i=0; i<quantidade; i++) {
                html += \`
                <tr class="align-middle">
                    <td class="py-2 px-3">
                        <div class="d-flex align-items-center">
                            <div class="skeleton-dark skeleton-avatar-view me-3 flex-shrink-0"></div>
                            <div class="skeleton-dark skeleton-text-view" style="width: 120px; margin: 0;"></div>
                        </div>
                    </td>
                    <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 150px; margin: 0;"></div></td>
                    <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 80px; margin: 0;"></div></td>
                    <td class="text-end py-2 px-3 d-flex justify-content-end gap-1">
                        <div class="skeleton-dark skeleton-btn-view"></div>
                    </td>
                </tr>\`;
            }
            return html;
        }

        function mostrarSkeletonGlobais() {
            const tableContainer = document.querySelector('.content > .erp-card .table-responsive');
            
            if (document.getElementById('skeleton-temp-container')) return;

            const skeletonHTML = \`
            <div id="skeleton-temp-container" class="table-responsive bg-custom-darker border-custom rounded shadow-sm skeleton-container">
                <table class="table table-sm align-middle mb-0" style="font-size: 0.8rem;">
                   <thead class="table-light">
                     <tr>
                       <th class="py-2 px-3">Nome / Colaborador</th>
                       <th class="py-2 px-3">E-mail / Contato</th>
                       <th class="py-2 px-3">Perfil de Acesso</th>
                       <th class="py-2 px-3 text-end" style="width: 80px;">Ações</th>
                     </tr>
                   </thead>
                   <tbody class="border-top-0">
                      \${gerarSkeletonTabela(4)}
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

            const tableContainer = document.querySelector('.content > .erp-card .table-responsive:not(.skeleton-container)');
            if (tableContainer) tableContainer.style.display = '';
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
        // VISIBILIDADE DE SENHA E VALIDAÇÃO
        // =======================================================================
        function togglePassword(inputId, btn) {
            const input = document.getElementById(inputId);
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }

        function validarSenhaConfirmacao(form) {
            const isNoLogin = ['motorista_avulso', 'ajudante', 'diarista'].includes(form.querySelector('select[name="tipo_usuario"]').value);
            if (isNoLogin) return true; // Se for sem login, não precisa validar as senhas pois estão inativas

            const senha = form.querySelector('input[name="senha"]');
            const confirma = form.querySelector('input[name="confirma_senha"]');
            
            if (senha && confirma) {
                if (senha.value !== confirma.value) {
                    return false;
                }
            }
            return true;
        }

        // =======================================================================
        // SUBMISSÃO AJAX COM SUPORTE A UPLOAD DE ARQUIVOS
        // =======================================================================
        let isSubmitting = false;

        async function prepararSubmissaoSimples(event, form, defaultMsg) {
            event.preventDefault();
            
            if (!validarSenhaConfirmacao(form)) {
                mostrarToast('erro', 'Atenção', 'As senhas inseridas não coincidem!');
                return;
            }

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            if (isSubmitting) return;

            const modalEl = form.closest('.modal');
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
                const formData = new FormData(form);

                const response = await fetch(form.action, {
                    method: form.method || 'POST',
                    body: formData 
                });

                if (response.ok) {
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    const oldContent = document.querySelector('.content');
                    const newContent = doc.querySelector('.content');
                    if (oldContent && newContent) {
                        oldContent.innerHTML = newContent.innerHTML;
                    }

                    const staticModals = ['novoUsuarioModal', 'sidebarMenu'];
                    document.querySelectorAll('.modal').forEach(m => {
                        if (!staticModals.includes(m.id)) m.remove();
                    });
                    doc.querySelectorAll('.modal').forEach(m => {
                        if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
                    });

                    form.reset();
                    const previewImg = form.querySelector('img[id^="previewFoto"]');
                    if (previewImg) {
                        previewImg.src = previewImg.dataset.defaultSrc || "https://ui-avatars.com/api/?name=Novo+Registro&background=1f1f1f&color=08c068&size=120";
                    }

                    initRoleToggles(); // Reaplica as máscaras/visibilidade aos selects renderizados no AJAX

                    const responseUrl = new URL(response.url);
                    let finalMsg = defaultMsg;
                    if (responseUrl.searchParams.has('sucesso')) finalMsg = 'Novo colaborador adicionado ao sistema.';
                    if (responseUrl.searchParams.has('editado')) finalMsg = 'As informações foram salvas.';
                    if (responseUrl.searchParams.has('excluido')) finalMsg = 'O registo foi removido com sucesso.';

                    mostrarToast('sucesso', 'Concluído!', finalMsg);
                } else {
                    mostrarToast('erro', 'Erro', 'Não foi possível guardar os dados no servidor.');
                }
            } catch (err) {
                console.error(err);
                mostrarToast('erro', 'Falha de Conexão', 'Verifique a sua rede e tente novamente.');
            } finally {
                isSubmitting = false;
                ocultarSkeletonGlobais();
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