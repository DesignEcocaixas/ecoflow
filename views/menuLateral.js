// views/menuLateral.js
function menuLateral(usuario, rotaAtiva = "") {
  const tipo = usuario && usuario.tipo_usuario ? usuario.tipo_usuario : "admin";

  // Variable de controle para garantir que apenas 1 menu inicie aberto
  let menuJaExpandido = false;

  // --- DEFINIÇÃO DOS LINKS ---
  const logLinks = [
    { href: "/producao", icone: "fas fa-industry", texto: "Produção" },
    { href: "/veiculos", icone: "fas fa-car", texto: "Veículos" },
    { href: "/checklist-motoristas", icone: "fas fa-clipboard-check", texto: "Checklist" },
    { href: "/entregas", icone: "fas fa-truck", texto: "Rotas" },
    { href: "/caderno-entregas", icone: "fas fa-book-open-reader", texto: "Caderno" }
  ];

  const motLinks = [
    { href: "/checklist-motoristas", icone: "fas fa-clipboard-check", texto: "Checklist" },
    { href: "/entregas", icone: "fas fa-truck", texto: "Rotas" }
  ];

  const finLinks = [
    { href: "/tabela-precos", icone: "fas fa-tags", texto: "Preços" },
    { href: "/chapas", icone: "fas fa-layer-group", texto: "Chapas" },
    { href: "/entradas-saidas", icone: "fa-solid fa-money-bill-transfer", texto: "Entradas / Saídas" },
    { href: "/producao", icone: "fas fa-industry", texto: "Produção" },
    { href: "/caderno-entregas", icone: "fas fa-book-open-reader", texto: "Caderno" }
  ];

  const desLinks = [
    { href: "/propostas", icone: "fa-solid fa-file-signature", texto: "Propostas" },
    { href: "/admin/gabaritos", icone: "fa-solid fa-folder-open", texto: "Gabaritos" }
  ];

  // --- FUNÇÕES DE RENDERIZAÇÃO ---
  const renderLink = (href, icone, texto) => {
    const activeClass = rotaAtiva === href ? "active" : "";

    return `
      <a href="${href}" class="${activeClass} d-flex align-items-center text-white text-decoration-none py-2 px-3">
        <i class="${icone} menu-icone" style="width: 24px; text-align: center;"></i> 
        <span class="sidebar-text ms-2">${texto}</span>
      </a>`;
  };

  const renderCollapse = (id, icone, titulo, linksArray) => {
    const isActive = linksArray.some(link => rotaAtiva === link.href);

    let showClass = "";
    let expanded = "false";

    if (isActive && !menuJaExpandido) {
      showClass = "show";
      expanded = "true";
      menuJaExpandido = true;
    }

    let linksHtml = linksArray.map(l => {
      const activeClass = rotaAtiva === l.href ? "active fw-bold text-white" : "text-white-50";

      return `
        <a href="${l.href}" class="${activeClass} py-2 mb-1 menu-link-item d-flex align-items-center text-decoration-none" style="font-size: 0.85rem;">
          <i class="${l.icone} menu-icone" style="width: 20px; text-align: center;"></i> 
          <span class="sidebar-text ms-2">${l.texto}</span>
        </a>`;
    }).join("");

    return `
      <div class="nav-accordion">
        <a data-bs-toggle="collapse" href="#${id}" role="button" aria-expanded="${expanded}" aria-controls="${id}" class="d-flex justify-content-between align-items-center nav-accordion-btn text-white text-decoration-none py-2 px-3">
          <span class="d-flex align-items-center">
            <i class="${icone} menu-icone" style="width: 24px; text-align: center;"></i> 
            <span class="sidebar-text ms-2">${titulo}</span>
          </span>
          <i class="fa-solid fa-chevron-down chevron-icon sidebar-text" style="font-size: 0.7rem; opacity: 0.7;"></i>
        </a>

        <div class="collapse ${showClass}" id="${id}" data-bs-parent="#sidebarMenuContainer">
          <div class="border-start border-light border-opacity-25 ms-4 ps-2 mt-1 mb-2 sidebar-submenu">
            ${linksHtml}
          </div>
        </div>
      </div>
    `;
  };

  // --- LÓGICA DE MONTAGEM DO MENU ---
  let menuLinks = renderLink("/home", "fas fa-home", "Home");

  if (tipo === "motorista") {
    menuLinks += renderCollapse("collMot", "fas fa-id-card", "Motorista", motLinks);
  } else if (tipo === "logistica") {
    menuLinks += renderCollapse("collLog", "fas fa-boxes-packing", "Logística", logLinks);
  } else if (tipo === "design") {
    menuLinks += renderCollapse("collDes", "fa-solid fa-palette", "Design", desLinks);
  } else if (tipo === "financeiro") {
    menuLinks += renderCollapse("collFin", "fa-solid fa-wallet", "Financeiro", finLinks);
  } else {
    menuLinks += renderCollapse("collLog", "fas fa-industry", "Logística", logLinks);
    menuLinks += renderCollapse("collMot", "fas fa-id-card", "Motorista", motLinks);
    menuLinks += renderCollapse("collFin", "fa-solid fa-wallet", "Financeiro", finLinks);
    menuLinks += renderCollapse("collDes", "fa-solid fa-palette", "Design", desLinks);
    menuLinks += renderLink("/cadastro", "fas fa-user-plus", "Usuários");
  }

  // Adiciona o Botão Sair de forma funcional e estilizada no fim de toda a lista de links
  menuLinks += `
    <a href="/logout" class="d-flex align-items-center text-decoration-none py-2 px-3 mt-2 border-top border-light border-opacity-10 logout-btn-sidebar" title="Sair do Sistema">
      <i class="fas fa-sign-out-alt text-danger menu-icone" style="width: 24px; text-align: center;"></i> 
      <span class="sidebar-text ms-2 text-danger fw-medium">Sair</span>
    </a>
  `;

  // --- CONTAINER DO PERFIL DO USUÁRIO (BARRA FIXA SUPERIOR) ---
  const userProfileHtml = `
    <div class="user-profile-container px-3 py-2 mb-3 border-bottom border-light border-opacity-10 text-white">
      <div class="d-flex align-items-center justify-content-between user-info-row">
        <div class="d-flex align-items-center text-truncate profile-avatar-box">
          <i class="fa-solid fa-user-circle fs-5 menu-icone text-white-50" style="width: 24px; text-align: center;"></i>

          <div class="text-truncate sidebar-text ms-2">
            <div class="fw-bold text-truncate text-white" style="font-size: 0.85rem; max-width: 125px;">
              ${usuario && usuario.nome ? usuario.nome : "Usuário"}
            </div>

            <span class="badge bg-white bg-opacity-25 text-white" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 5px;">
              ${tipo}
            </span>
          </div>
        </div>

        <button type="button"
          id="btnAbrirNotificacoes"
          class="text-white-50 transition-btn p-1 rounded sidebar-text d-flex align-items-center justify-content-center border-0 bg-transparent position-relative"
          title="Notificações"
          style="text-decoration: none;">
          <i class="fa-solid fa-bell" style="font-size: 0.9rem;"></i>

          <span id="contadorNotificacoes"
            class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style="font-size: 0.55rem; min-width: 16px; height: 16px; display: none; align-items: center; justify-content: center; padding: 0 4px;">
            0
          </span>
        </button>
      </div>
    </div>
  `;

  // --- RODAPÉ 71DEV ---
  const footerHTML = `
    <div class="mt-auto pt-3 pb-2 text-center w-100 footer-sidebar" style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">
      <hr class="border-light border-opacity-25 mb-2 mt-0 mx-3">

      <div class="d-flex flex-column align-items-center justify-content-center gap-2 mb-1">
        <span class="sidebar-text">Desenvolvido por <strong class="text-white">71dev</strong></span>

        <div class="d-flex align-items-center justify-content-center gap-2">
          <a href="https://www.instagram.com/71dev_/" target="_blank" class="text-decoration-none" style="color: rgba(255,255,255,0.6);" title="Instagram">
            <i class="fa-brands fa-instagram fa-lg"></i>
          </a>

          <a href="https://wa.me/557183174920" target="_blank" class="text-decoration-none" style="color: rgba(255,255,255,0.6);" title="WhatsApp">
            <i class="fa-brands fa-whatsapp fa-lg"></i>
          </a>
        </div>
      </div>
    </div>
  `;

  // --- PAINEL DE NOTIFICAÇÕES ---
  const notificacoesPanelHtml = `
    <div class="offcanvas offcanvas-end painel-notificacoes-animado" tabindex="-1" id="painelNotificacoes" aria-labelledby="painelNotificacoesLabel">
      <div class="offcanvas-header border-bottom painel-notificacoes-header">
        <h5 class="offcanvas-title fw-bold" id="painelNotificacoesLabel">
          <i class="fa-solid fa-bell me-2 text-warning"></i> Notificações
        </h5>

        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar"></button>
      </div>

      <div class="offcanvas-body p-0 painel-notificacoes-body">
        <div id="listaNotificacoes" class="p-3">
          <div class="text-center text-muted py-4">
            Carregando notificações...
          </div>
        </div>

        <div class="border-top p-3 painel-notificacoes-footer">
          <button type="button" id="btnLimparNotificacoes" class="btn btn-outline-danger w-100 btn-sm">
            <i class="fa-solid fa-trash-can me-1"></i> Limpar todas
          </button>
        </div>
      </div>
    </div>

    <script>
      document.addEventListener("DOMContentLoaded", () => {
        const btn = document.getElementById("btnAbrirNotificacoes");
        const painelEl = document.getElementById("painelNotificacoes");
        const lista = document.getElementById("listaNotificacoes");
        const btnLimpar = document.getElementById("btnLimparNotificacoes");
        const contador = document.getElementById("contadorNotificacoes");

        if (!btn || !painelEl || !lista) return;

        const escapeHtml = (valor) => {
          return String(valor || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        };

        const htmlSemNotificacoes = () => {
          return \`
            <div class="text-center text-muted py-5">
              <i class="fa-regular fa-bell-slash fs-2 d-block mb-2"></i>
              Nenhuma notificação encontrada.
            </div>
          \`;
        };

        const atualizarContadorNotificacoes = (total) => {
          if (!contador) return;

          const quantidade = Number(total) || 0;

          if (quantidade <= 0) {
            contador.style.display = "none";
            contador.textContent = "0";
            return;
          }

          contador.style.display = "flex";
          contador.textContent = quantidade > 99 ? "99+" : quantidade;
        };

        const atualizarEstadoVazio = () => {
          const restantes = lista.querySelectorAll(".item-notificacao");

          atualizarContadorNotificacoes(restantes.length);

          if (restantes.length === 0) {
            lista.innerHTML = htmlSemNotificacoes();
          }
        };

        const ativarBotoesExcluir = () => {
          lista.querySelectorAll(".btn-excluir-notificacao").forEach(btnExcluir => {
            btnExcluir.addEventListener("click", async () => {
              const id = btnExcluir.dataset.id;
              const item = lista.querySelector(\`.item-notificacao[data-id="\${id}"]\`);

              if (!id) return;

              btnExcluir.disabled = true;

              try {
                const resp = await fetch(\`/notificacoes/\${id}/excluir\`, {
                  method: "POST",
                  headers: {
                    "Accept": "application/json"
                  }
                });

                const data = await resp.json();

                if (!resp.ok || !data.sucesso) {
                  throw new Error(data.erro || "Erro ao excluir notificação");
                }

                if (item) {
                  item.remove();
                }

                atualizarEstadoVazio();
              } catch (err) {
                btnExcluir.disabled = false;
                alert("Erro ao excluir notificação.");
              }
            });
          });
        };

        const carregarNotificacoes = async (mostrarLoading = true) => {
          if (mostrarLoading) {
            lista.innerHTML = \`
              <div class="text-center text-muted py-4">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Carregando notificações...
              </div>
            \`;
          }

          try {
            const resp = await fetch("/notificacoes", {
              method: "GET",
              headers: {
                "Accept": "application/json"
              }
            });

            const notificacoes = await resp.json();

            if (!resp.ok) {
              throw new Error(notificacoes.erro || "Erro ao carregar notificações");
            }

            atualizarContadorNotificacoes(Array.isArray(notificacoes) ? notificacoes.length : 0);

            if (!Array.isArray(notificacoes) || notificacoes.length === 0) {
              lista.innerHTML = htmlSemNotificacoes();
              return;
            }

            lista.innerHTML = notificacoes.map(n => {
              const data = n.criado_em
                ? new Date(n.criado_em).toLocaleString("pt-BR")
                : "";

              return \`
                <div class="border rounded-3 p-3 mb-2 bg-light item-notificacao" data-id="\${n.id}">
                  <div class="d-flex justify-content-between gap-2">
                    <div>
                      <div class="fw-semibold text-dark">\${escapeHtml(n.mensagem || "Notificação")}</div>
                      <small class="text-muted">\${escapeHtml(data)}</small>
                    </div>

                    <button type="button"
                      class="btn btn-sm btn-outline-danger btn-excluir-notificacao"
                      data-id="\${n.id}"
                      title="Excluir">
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </div>
              \`;
            }).join("");

            ativarBotoesExcluir();
          } catch (err) {
            atualizarContadorNotificacoes(0);

            if (mostrarLoading) {
              lista.innerHTML = \`
                <div class="alert alert-danger m-0">
                  Erro ao carregar notificações.
                </div>
              \`;
            }
          }
        };

        btn.addEventListener("click", async () => {
          const painel = bootstrap.Offcanvas.getOrCreateInstance(painelEl);
          painel.show();

          await carregarNotificacoes(true);
        });

        if (btnLimpar) {
          btnLimpar.addEventListener("click", async () => {
            btnLimpar.disabled = true;

            try {
              const resp = await fetch("/notificacoes/limpar", {
                method: "POST",
                headers: {
                  "Accept": "application/json"
                }
              });

              const data = await resp.json();

              if (!resp.ok || !data.sucesso) {
                throw new Error(data.erro || "Erro ao limpar notificações");
              }

              lista.innerHTML = htmlSemNotificacoes();
              atualizarContadorNotificacoes(0);
            } catch (err) {
              alert("Erro ao limpar notificações.");
            } finally {
              btnLimpar.disabled = false;
            }
          });
        }

        carregarNotificacoes(false);
      });
    </script>
  `;

  // --- RETORNO COM CSS ---
  return `
    <style>
      .sidebar {
        width: 240px !important;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
      }

      .transition-btn {
        transition: all 0.2s ease;
      }

      .transition-btn:hover {
        background: rgba(255,255,255,0.1);
        color: #fff !important;
      }

      .logout-btn-sidebar {
        transition: background-color 0.2s;
      }

      .logout-btn-sidebar:hover {
        background: rgba(220, 53, 69, 0.1);
      }
      
      .chevron-icon {
        transition: transform 0.35s ease;
      }

      .nav-accordion-btn[aria-expanded="true"] .chevron-icon {
        transform: rotate(-180deg);
      }
      
      .sidebar-scroll-area {
        overflow-y: auto;
        overflow-x: hidden;
      }

      .sidebar-scroll-area::-webkit-scrollbar {
        width: 5px;
      }

      .sidebar-scroll-area::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.2);
        border-radius: 10px;
      }

      #btnAbrirNotificacoes {
        width: 28px;
        height: 28px;
      }

      #contadorNotificacoes {
        line-height: 16px;
        z-index: 3;
      }

      .painel-notificacoes-animado {
        width: min(420px, 92vw);
        border-left: 0;
        box-shadow: -18px 0 45px rgba(0, 0, 0, 0.18);
      }

      .offcanvas-end.painel-notificacoes-animado {
        transform: translateX(115%) !important;
      }

      .offcanvas-end.painel-notificacoes-animado.showing {
        animation: painelNotificacoesEntrada 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards !important;
      }

      .offcanvas-end.painel-notificacoes-animado.show:not(.hiding) {
        transform: translateX(0) !important;
      }

      .offcanvas-end.painel-notificacoes-animado.hiding {
        animation: painelNotificacoesSaida 0.32s ease forwards !important;
      }

      .painel-notificacoes-header {
        background: linear-gradient(135deg, #ffffff 0%, #f7f7f7 100%);
      }

      .painel-notificacoes-body {
        background: #fbfbfb;
      }

      .painel-notificacoes-footer {
        background: #fff;
      }

      .offcanvas-backdrop.show {
        opacity: 0.5;
      }

      @keyframes painelNotificacoesEntrada {
        0% {
          transform: translateX(115%);
          opacity: 0.85;
        }

        70% {
          transform: translateX(-10px);
          opacity: 1;
        }

        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes painelNotificacoesSaida {
        0% {
          transform: translateX(0);
          opacity: 1;
        }

        100% {
          transform: translateX(115%);
          opacity: 0.85;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .offcanvas-end.painel-notificacoes-animado,
        .offcanvas-end.painel-notificacoes-animado.showing,
        .offcanvas-end.painel-notificacoes-animado.hiding {
          animation: none !important;
          transition: none !important;
        }
      }
    </style>

    <div class="d-flex flex-column h-100 pt-2">
      <div class="flex-grow-1 sidebar-scroll-area" id="sidebarMenuContainer">
        ${userProfileHtml}
        ${menuLinks}
      </div>

      ${footerHTML}
    </div>

    ${notificacoesPanelHtml}
  `;
}

module.exports = menuLateral;