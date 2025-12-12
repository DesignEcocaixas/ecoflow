// views/cadastroView.js
function cadastroView(usuario, usuarios = []) {
  // Fallback seguro
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  const menu =
    user.tipo_usuario === "motorista"
      ? `<a href="/checklist-motoristas">Checklist Motoristas</a>`
      : `
        <a href="/home"><i class="fas fa-home me-2"></i>Home</a>
        <a href="/tabela-precos"><i class="fas fa-tags me-2"></i>Tabela de Preços</a>
        <a href="/entregas"><i class="fas fa-truck me-2"></i>Entregas</a>
        <a href="/checklist-motoristas"><i class="fas fa-clipboard-check me-2"></i>Checklist</a>
        <a href="/catalogo"><i class="fas fa-book-open me-2"></i>Catálogo</a>
        <a href="/veiculos"><i class="fas fa-car"></i> Veículos</a>
        <a href="/cadastro"><i class="fas fa-user-plus me-2"></i>Cadastro</a>
        <hr>
        <a href="/logout" class="text-danger"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>
    `;

  const linhas =
    usuarios && usuarios.length
      ? usuarios
          .map(
            (u) => `
      <tr>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td>${u.tipo_usuario || "admin"}</td>
        <td class="text-nowrap">
          <button class="btn btn-sm btn-warning" data-bs-toggle="modal" data-bs-target="#editarUsuario${u.id}" title="Editar">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#excluirUsuario${u.id}" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>

      <!-- Modal Editar -->
      <div class="modal fade" id="editarUsuario${u.id}" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form method="POST" action="/usuarios/editar/${u.id}">
              <div class="modal-header">
                <h5 class="modal-title">Editar Usuário</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <label class="form-label">Nome</label>
                <input type="text" name="nome" class="form-control mb-2" value="${u.nome}" required>

                <label class="form-label">E-mail</label>
                <input type="email" name="email" class="form-control mb-2" value="${u.email}" required>

                <label class="form-label">Senha (deixe em branco para não alterar)</label>
                <input type="password" name="senha" class="form-control mb-2" placeholder="••••••••">

                <label class="form-label">Tipo de Usuário</label>
                <select name="tipo_usuario" class="form-select">
                  <option value="admin" ${u.tipo_usuario === "admin" ? "selected" : ""}>Admin</option>
                  <option value="motorista" ${u.tipo_usuario === "motorista" ? "selected" : ""}>Motorista</option>
                  <option value="financeiro" ${u.tipo_usuario === "financeiro" ? "selected" : ""}>Financeiro</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modal Excluir -->
      <div class="modal fade" id="excluirUsuario${u.id}" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form method="POST" action="/usuarios/excluir/${u.id}">
              <div class="modal-header">
                <h5 class="modal-title">Excluir Usuário</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                Tem certeza que deseja excluir o usuário <b>${u.nome}</b>?
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-danger">Excluir</button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `
          )
          .join("")
      : `<tr><td colspan="4" class="text-center text-muted">Nenhum usuário cadastrado.</td></tr>`;

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastro de Usuários</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      body { display: flex; height: 100vh; margin: 0; }
      .sidebar { width: 220px; background-color: #0D5749; color: white; padding: 20px; }
      .sidebar a { display: block; padding: 10px; color: white; text-decoration: none; border-radius: 5px; margin-bottom: 10px; }
      .sidebar a:hover { background-color: #083930ff; }
      .content { flex: 1; padding: 20px; overflow-y: auto; }
      .topbar { display: flex; justify-content: flex-end; align-items: center; margin-bottom: 10px; }
      .offcanvas { transition: transform 0.4s ease-in-out, opacity 0.3s ease-in-out; }
      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 15px; }
      }
        .offcanvas-body a {
                display: block;
                text-align: center;
                width: 100%;
                padding: 10px;
                color: white;
                text-decoration: none;
              }

            .offcanvas-body a:hover {
                background-color: #495057;
                border-radius: 5px;
            }
        .usuario-badge {
              background-color: #0D5749;
              color: #ffffff;
              padding: 3px 12px;
              border-radius: 8px;      /* bordas arredondadas */
              border: 2px solid #0D5749;
            }
    </style>
  </head>
  <body>
    <!-- PRELOADER -->
<div id="preloader" style="
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    transition: opacity .3s ease;
">
    <div class="spinner-border text-success" role="status" style="width: 4rem; height: 4rem;">
        <span class="visually-hidden">Carregando...</span>
    </div>
</div>

    <!-- Sidebar desktop -->
    <div class="sidebar d-none d-md-block">
      <div class="text-center">
        <img src="/img/logo-branca.png" alt="Logo da Empresa" class="img-fluid" style="max-width: 150px;">
      </div>
      <hr>
      ${menu}
    </div>

    <!-- Sidebar mobile -->
    <div class="offcanvas offcanvas-start bg-dark text-white" tabindex="-1" id="sidebarMenu">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title">Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body text-center">
        <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid mb-4" style="max-width:150px;">
        <hr class="bg-light">
        ${menu}
        <hr class="bg-light">
        <a href="/logout" class="d-block text-danger">Sair</a>
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between">
        <button class="btn btn-outline-dark d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">☰ Menu</button>
      </div>

      <div class="d-flex align-items-center justify-content-between mb-3">
        <h2 class="mb-0">Cadastro de Usuários</h2>
        <span class="usuario-badge">
          <i class="fa-solid fa-user"></i> ${usuario.nome}
        </span>
      </div>

      <hr class="bg-light w-100">

      <button class="btn btn-success mb-3" data-bs-toggle="modal" data-bs-target="#novoUsuarioModal">
        <i class="fa-solid fa-user-plus"></i> Novo Usuário
      </button>

      <div class="table-responsive">
        <table class="table table-bordered table-striped align-middle">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Tipo</th>
              <th style="width: 120px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${linhas}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Novo Usuário -->
    <div class="modal fade" id="novoUsuarioModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form method="POST" action="/usuarios/novo">
            <div class="modal-header">
              <h5 class="modal-title">Novo Usuário</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <label class="form-label">Nome</label>
              <input type="text" name="nome" class="form-control mb-2" required>

              <label class="form-label">E-mail</label>
              <input type="email" name="email" class="form-control mb-2" required>

              <label class="form-label">Senha</label>
              <input type="password" name="senha" class="form-control mb-2" required>

              <label class="form-label">Tipo de Usuário</label>
              <select name="tipo_usuario" class="form-select">
                <option value="admin">Admin</option>
                <option value="motorista">Motorista</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = cadastroView;