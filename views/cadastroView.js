// views/cadastroView.js
const menuLateral = require("./menuLateral");

function cadastroView(usuario, usuarios = []) {
  // Fallback seguro
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  // Acumuladores para separar o conteúdo da tabela dos modais
  const listaModais = [];

  const linhas =
    usuarios && usuarios.length
      ? usuarios
          .map((u) => {
            // Adiciona o Modal de Edição ao acumulador
            listaModais.push(`
              <div class="modal fade" id="editarUsuario${u.id}" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                  <form method="POST" action="/usuarios/editar/${u.id}" class="modal-content erp-modal">
                    <div class="modal-header bg-light">
                      <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-user-pen me-2 text-warning"></i> Editar Usuário</h6>
                      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-sm p-3">
                      <div class="row g-2">
                        <div class="col-12">
                          <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Nome Completo</label>
                          <input type="text" name="nome" class="form-control form-control-sm" value="${u.nome}" required>
                        </div>
                        <div class="col-12">
                          <label class="form-label text-muted mb-1" style="font-size:0.8rem;">E-mail</label>
                          <input type="email" name="email" class="form-control form-control-sm" value="${u.email}" required>
                        </div>
                        <div class="col-12 col-md-6">
                          <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Tipo de Usuário</label>
                          <select name="tipo_usuario" class="form-select form-select-sm">
                            <option value="admin" ${u.tipo_usuario === "admin" ? "selected" : ""}>Admin</option>
                            <option value="motorista" ${u.tipo_usuario === "motorista" ? "selected" : ""}>Motorista</option>
                            <option value="financeiro" ${u.tipo_usuario === "financeiro" ? "selected" : ""}>Financeiro</option>
                          </select>
                        </div>
                        <div class="col-12 col-md-6">
                          <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Nova Senha (opcional)</label>
                          <input type="password" name="senha" class="form-control form-control-sm" placeholder="••••••••">
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer border-top-0 bg-light">
                      <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                      <button type="submit" class="btn btn-sm btn-primary"><i class="fa-solid fa-save me-1"></i> Salvar Alterações</button>
                    </div>
                  </form>
                </div>
              </div>

              <div class="modal fade" id="excluirUsuario${u.id}" tabindex="-1">
                <div class="modal-dialog modal-sm modal-dialog-centered">
                  <div class="modal-content erp-modal">
                    <form method="POST" action="/usuarios/excluir/${u.id}">
                      <div class="modal-body text-center p-4">
                        <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                        <h6 class="mb-2">Excluir Usuário?</h6>
                        <p class="text-muted mb-0" style="font-size:0.85rem;">Tem certeza que deseja excluir permanentemente o acesso de <b>${u.nome}</b>?</p>
                      </div>
                      <div class="modal-footer justify-content-center bg-light border-0">
                        <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-danger">Sim, Excluir</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            `);

            // Retorna apenas a linha da tabela
            return `
              <tr class="align-middle">
                <td class="fw-medium text-dark">
                  <i class="fa-solid fa-user-circle text-muted me-2"></i> ${u.nome}
                </td>
                <td class="text-muted" style="font-size: 0.85rem;">${u.email}</td>
                <td>
                  <span class="badge ${
                    u.tipo_usuario === 'admin' ? 'bg-danger' : 
                    u.tipo_usuario === 'financeiro' ? 'bg-success' : 'bg-primary'
                  } bg-opacity-75" style="font-size:0.7rem; letter-spacing: 0.5px;">
                    ${(u.tipo_usuario || "admin").toUpperCase()}
                  </span>
                </td>
                <td class="text-end text-nowrap">
                  <button class="btn btn-sm btn-light border text-warning" data-bs-toggle="modal" data-bs-target="#editarUsuario${u.id}" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="btn btn-sm btn-light border text-danger" data-bs-toggle="modal" data-bs-target="#excluirUsuario${u.id}" title="Excluir">
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
      .content { flex: 1; padding: 24px; overflow-y: auto; }
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
    <div id="preloader" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; backdrop-filter: blur(4px); background: rgba(244, 247, 246, 0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; transition: opacity .3s ease;">
        <div class="spinner-border" style="color: #0D5749; width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Carregando...</span>
        </div>
    </div>

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
        <div class="d-flex align-items-center gap-3">
          <span class="usuario-badge d-none d-sm-inline-block">
            <i class="fa-solid fa-user-circle me-1"></i> ${user.nome}
          </span>
          <a href="/logout" class="btn btn-sm btn-outline-danger d-none d-md-inline-block" title="Sair">
            <i class="fas fa-sign-out-alt"></i>
          </a>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-3 shadow-sm border border-light">
        <div>
            <h6 class="mb-0 text-muted" style="font-size:0.85rem;">Total de Cadastros: <strong>${usuarios.length}</strong></h6>
        </div>
        <button class="btn btn-sm btn-success px-3 shadow-sm" data-bs-toggle="modal" data-bs-target="#novoUsuarioModal">
          <i class="fa-solid fa-user-plus me-1"></i> Adicionar Usuário
        </button>
      </div>

      <div class="erp-card">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nome Completo</th>
                <th>E-mail</th>
                <th>Perfil de Acesso</th>
                <th class="text-end" style="width: 120px;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${linhas}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal fade" id="novoUsuarioModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/usuarios/novo" class="modal-content erp-modal">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-user-plus me-2 text-success"></i> Novo Usuário</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-3">
            <div class="row g-2">
              <div class="col-12">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Nome Completo</label>
                <input type="text" name="nome" class="form-control form-control-sm" required placeholder="Ex: João da Silva">
              </div>
              <div class="col-12">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">E-mail</label>
                <input type="email" name="email" class="form-control form-control-sm" required placeholder="joao@ecoflow.com">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Senha de Acesso</label>
                <input type="password" name="senha" class="form-control form-control-sm" required placeholder="••••••••">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Perfil / Tipo de Usuário</label>
                <select name="tipo_usuario" class="form-select form-select-sm" required>
                  <option value="motorista" selected>Motorista</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top-0 bg-light">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success"><i class="fa-solid fa-check me-1"></i> Criar Acesso</button>
          </div>
        </form>
      </div>
    </div>

    ${listaModais.join("")}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = cadastroView;