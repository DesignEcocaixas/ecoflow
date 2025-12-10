function homeView(usuario) {
    const menu = usuario.tipo_usuario === "motorista"
        ? `
        <a href="/home"><i class="fas fa-home me-2"></i>Home</a>
        <a href="/checklist-motoristas"><i class="fas fa-clipboard-check me-2"></i>Checklist</a>
        <a href="/entregas"><i class="fas fa-truck me-2"></i>Entregas</a>

  `
        : usuario.tipo_usuario === "financeiro"
            ? `<a href="/tabela-precos"><i class="fas fa-tags me-2"></i>Tabela de Preços</a>`
            : `
        <a href="/home"><i class="fas fa-home me-2"></i>Home</a>
        <a href="/tabela-precos"><i class="fas fa-tags me-2"></i>Tabela de Preços</a>
        <a href="/entregas"><i class="fas fa-truck me-2"></i>Entregas</a>
        <a href="/checklist-motoristas"><i class="fas fa-clipboard-check me-2"></i>Checklist</a>
        <a href="/catalogo"><i class="fas fa-book-open me-2"></i>Catálogo</a>
        <a href="/veiculos"><i class="fas fa-car"></i> Veículos</a>
        <a href="/cadastro"><i class="fas fa-user-plus me-2"></i>Cadastro</a>
  `;

    return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">

      <title>Home</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
          body { 
            display: flex; 
            height: 100vh; 
            margin: 0; 
            }

            .sidebar { 
            width: 220px; 
            background-color: #343a40; 
            color: white; 
            padding: 20px; 
            transition: all 0.3s ease-in-out; /* anima sidebar */
            }
            .sidebar a { 
            display: block; 
            padding: 10px; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin-bottom: 10px; 
            transition: background-color 0.2s ease-in-out; /* hover suave */
            }
            .sidebar a:hover { 
            background-color: #495057; 
            }

            .content {
                flex: 1;
                padding: 20px;
                overflow: hidden; /* evita scroll dentro do content */
                }


            .offcanvas {
            transition: transform 0.4s ease-in-out, opacity 0.3s ease-in-out;
            }

            /* No mobile */
            @media (max-width: 767.98px) {
            body {
                flex-direction: column;
            }
            .sidebar {
                display: none; /* sidebar some */
            }
            .content {
                width: 100%;
                padding: 15px;
            }
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

            


      </style>
  </head>
  <body>
      <div class="sidebar">
          <div class="text-center">
            <img src="/img/logo-branca.png" alt="Logo da Empresa" class="img-fluid mb-3" style="max-width:150px;">
        </div>
          <hr>
          ${menu}
          <hr>
          <a href="/logout" class="text-danger"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>
      </div>
      <!-- Sidebar mobile -->
    <div class="offcanvas offcanvas-start bg-dark text-white" tabindex="-1" id="sidebarMenu">
    <div class="offcanvas-header">
        <h5 class="offcanvas-title">Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body text-center d-flex flex-column align-items-center">
        <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid mb-4" style="max-width:150px;">
        <hr class="bg-light w-100">
        <div class="d-flex flex-column align-items-center w-100">
        ${menu}
        </div>
        <hr class="bg-light w-100">
        <a href="/logout" class="text-danger"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>
    </div>
    </div>


      <div class="content">
        <button class="btn btn-outline-dark d-md-none mb-3" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">
            ☰ Menu
        </button>

        <h2>Bem-vindo, ${usuario.nome}</h2>
        <p>ECOFLOW - Sistema de gestão da Ecocaixas</p>

        <h4 class="mt-4">Últimas atualizações</h4>
        <div id="notificacoesContainer" class="mt-3">
            <p class="text-muted">Carregando notificações...</p>
        </div>

        <!-- Wrapper só para centralizar a imagem -->
        <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
            <!--<img src="https://www.letswork.com.br/wp-content/uploads/2022/09/logistica.png" alt="Gestão de risco" class="img-fluid" style="opacity: 0.4; max-width: 600px; width: 100%; margin-bottom: 100px position: absolute;">-->
        </div>
        </div>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = homeView;
