function homeView(usuario, notificacoes = []) {
  const qtdNotificacoes = notificacoes.length;

// Função para criar card do menu
function menuCard(href, titulo, icone, disabled = false) {
  return `
    <div class="col-6 col-md-4 col-lg-3">
      <a 
        href="${disabled ? "javascript:void(0)" : href}" 
        class="text-decoration-none ${disabled ? "disabled-link" : ""}"
        ${disabled ? 'title="Funcionalidade indisponível no momento"' : ""}
      >
        <div class="card menu-card h-100 shadow-sm ${disabled ? "menu-card-disabled" : ""}">
          <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
            <i class="${icone} fa-2x mb-2"></i>
            <span class="fw-semibold">${titulo}</span>
          </div>
        </div>
      </a>
    </div>
  `;
}

  // Monta os cards conforme tipo de usuário
  const menuCards = usuario.tipo_usuario === "motorista"
    ? `
      ${menuCard("/home", "Home", "fas fa-home")}
      ${menuCard("/checklist-motoristas", "Checklist", "fas fa-clipboard-check")}
      ${menuCard("/entregas", "Entregas", "fas fa-truck")}
    `
    : usuario.tipo_usuario === "financeiro"
      ? `
        ${menuCard("/tabela-precos", "Tabela de Preços", "fas fa-tags")}
      `
      : `
        ${menuCard("/home", "Home", "fas fa-home")}
        ${menuCard("/tabela-precos", "Tabela de Preços", "fas fa-tags")}
        ${menuCard("/entregas", "Entregas", "fas fa-truck")}
        ${menuCard("/checklist-motoristas", "Checklist", "fas fa-clipboard-check")}
        ${menuCard("/catalogo", "Catálogo", "fas fa-box-open", true)}
        ${menuCard("/veiculos", "Veículos", "fas fa-car")}
        ${menuCard("/cadastro", "Cadastro", "fas fa-user-plus")}
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
          min-height: 100vh;
          margin: 0;
          background-image: url('/img/bg-home.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .page-wrap{
          padding: 20px 150px;
        }

        .topbar{
          background: rgba(255,255,255,0.40);
          border-radius: 10px;
          padding: 18px 18px;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .topbar h1{
          margin: 0;
          font-size: 28px;
        }
        .topbar p{
          margin: 0;
          opacity: .8;
        }

        .usuario-badge {
              background-color: #0D5749;
              color: #ffffff;
              padding: 3px 12px;
              border-radius: 8px;      /* bordas arredondadas */
              border: 2px solid #0D5749;
            }

        .notificacao-btn{
          border-color: #0D5749;
        }
        .notificacao-btn i{
          color: #083930ff;
        }

        .menu-area{
          margin-top: 16px;
          background: rgba(255,255,255,0.40);
          border-radius: 10px;
          padding: 16px;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .menu-card{
          border-radius: 16px;
          transition: all .2s ease;
          border: 0;
        }
        .menu-card i{
          color: #0D5749;
        }
        .menu-card:hover{
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,.12);
        }

        /* No mobile, o topo empilha mantendo alinhamento */
        @media (max-width: 767.98px){
          .topbar{
            gap: 12px;
          }
          .topbar h1{
            font-size: 22px;
          }
          .right-actions{
            width: 100%;
            justify-content: space-between;
            flex-wrap: wrap;
          }
            .page-wrap{
              padding: 20px;
            }
        }
        .menu-card-disabled {
          opacity: 0.5;
          filter: grayscale(100%);
          cursor: not-allowed;
        }

        .disabled-link {
          pointer-events: none;
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

    <div class="page-wrap container-fluid">

      <!-- TOPO -->
      <div class="topbar d-flex align-items-center justify-content-between flex-wrap">
        <div class="d-flex align-items-center gap-3 flex-column flex-md-row text-center text-md-start">
        <img 
          src="/img/logo.png" 
          alt="Logo da Empresa" 
          class="img-fluid"
          style="max-width: 200px;"
        >
        <div>
          <h1 class="mb-1">Bem-vindo, ${usuario.nome}</h1>
          <p class="mb-0">ECOFLOW - Sistema de gestão da Ecocaixas</p>
        </div>
      </div>

        <!-- Ações alinhadas na mesma linha -->
        <div class="right-actions d-flex align-items-center gap-3">
          <!-- Sino -->
          <button type="button"
            class="btn btn-outline-secondary position-relative notificacao-btn"
            data-bs-toggle="modal"
            data-bs-target="#notificacoesModal"
            title="Notificações"
          >
            <i class="fas fa-bell"></i>
            ${qtdNotificacoes > 0 ? `
              <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                ${qtdNotificacoes}
              </span>
            ` : ""}
          </button>

          <!-- Usuário -->
          <span class="usuario-badge">
            <i class="fas fa-user"></i> ${usuario.nome}
          </span>

          <!-- Sair -->
          <a href="/logout" class="text-danger d-flex align-items-center text-decoration-none">
            <i class="fas fa-sign-out-alt me-2"></i>Sair
          </a>
        </div>
      </div>

      <!-- CARDS DO MENU (logo abaixo do topo) -->
      <div class="menu-area">
        <div class="row g-3">
          ${menuCards}
        </div>
      </div>

    </div>

    <!-- Modal de Notificações -->
    <div class="modal fade" id="notificacoesModal" tabindex="-1" aria-labelledby="notificacoesLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="notificacoesLabel">Notificações</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            ${qtdNotificacoes > 0
      ? `
                <div class="list-group">
                  ${notificacoes.map(n => `
                    <div class="list-group-item d-flex justify-content-between align-items-start">
                      <div>
                        <div class="fw-bold">${n.tipo === "checklist" ? "Checklist" : n.tipo === "tabela" ? "Tabela de preços" : "Notificação"}</div>
                        <div>${n.mensagem}</div>
                        <small class="text-muted">
                          ${new Date(n.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </small>
                      </div>
                      <form method="POST" action="/notificacoes/${n.id}/excluir" class="ms-2">
                        <button type="submit" class="btn btn-sm btn-outline-danger" title="Remover">
                          <i class="fas fa-times"></i>
                        </button>
                      </form>
                    </div>
                  `).join("")}
                </div>
              `
      : `<p class="text-muted mb-0">Nenhuma notificação no momento.</p>`
    }
          </div>
          <div class="modal-footer">
            ${qtdNotificacoes > 0
      ? `
                <form method="POST" action="/notificacoes/limpar" class="me-auto">
                  <button type="submit" class="btn btn-outline-danger btn-sm">
                    <i class="fas fa-trash"></i> Limpar todas
                  </button>
                </form>
              `
      : ""
    }
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = homeView;
