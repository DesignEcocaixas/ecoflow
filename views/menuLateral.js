// views/menuLateral.js
let versaoSistemaCache = "1.0.0";
try {
  const fs = require('fs');
  const path = require('path');
  // Lê automaticamente a versão do seu package.json na raiz do projeto
  const pPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(pPath)) {
    versaoSistemaCache = require(pPath).version;
  }
} catch (e) {
  console.log("Aviso: Não foi possível ler a versão do package.json para o menu.");
}

function menuLateral(usuario, rotaAtiva = "") {
  const tipo = usuario && usuario.tipo_usuario ? usuario.tipo_usuario : "admin";

  // Variável de controle para garantir que apenas 1 menu inicie aberto
  let menuJaExpandido = false;

  // --- DEFINIÇÃO DOS LINKS ---
  const logLinks = [
    { href: "/producao", icone: "fas fa-industry", texto: "Produção" },
    { href: "/veiculos", icone: "fas fa-car", texto: "Veículos" },
    { href: "/checklist-motoristas", icone: "fas fa-clipboard-check", texto: "Checklist" },
    { href: "/entregas", icone: "fas fa-truck", texto: "Rotas" },
    { href: "/caderno-entregas", icone: "fas fa-book-open-reader", texto: "Caderno" },
    { href: "/espacos-trabalho", icone: "fa-solid fa-cubes", texto: "Workspaces" }
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
    { href: "/caderno-entregas", icone: "fas fa-book-open-reader", texto: "Caderno" },
    { href: "/diaristas", icone: "fas fa-users", texto: "Diaristas" },
    { href: "/pagamentos", icone: "fas fa-money-bill-wave", texto: "Pagamentos" },
    { href: "/espacos-trabalho", icone: "fa-solid fa-cubes", texto: "Workspaces" }
  ];

  const desLinks = [
    { href: "/propostas", icone: "fa-solid fa-file-signature", texto: "Propostas" },
    { href: "/admin/gabaritos", icone: "fa-solid fa-folder-open", texto: "Gabaritos" },
    { href: "/espacos-trabalho", icone: "fa-solid fa-cubes", texto: "Workspaces" }
  ];

  // --- FUNÇÕES DE RENDERIZAÇÃO ---
  const renderLink = (href, icone, texto) => {
    const activeClass = rotaAtiva === href ? "active" : "";

    return `
      <a href="${href}" class="${activeClass} d-flex align-items-center text-decoration-none py-2 px-3 menu-item-main">
        <i class="${icone} menu-icone" style="width: 22px; text-align: center;"></i> 
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
      const activeClass = rotaAtiva === l.href ? "active" : "";

      return `
        <a href="${l.href}" class="${activeClass} py-2 mb-1 menu-link-item d-flex align-items-center text-decoration-none">
          <i class="${l.icone} menu-icone" style="width: 18px; text-align: center;"></i> 
          <span class="sidebar-text ms-2">${l.texto}</span>
        </a>`;
    }).join("");

    return `
      <div class="nav-accordion">
        <a data-bs-toggle="collapse" href="#${id}" role="button" aria-expanded="${expanded}" aria-controls="${id}" class="d-flex justify-content-between align-items-center nav-accordion-btn text-decoration-none py-2 px-3 menu-item-main">
          <span class="d-flex align-items-center">
            <i class="${icone} menu-icone" style="width: 22px; text-align: center;"></i> 
            <span class="sidebar-text ms-2">${titulo}</span>
          </span>
          <i class="fa-solid fa-chevron-down chevron-icon sidebar-text" style="font-size: 0.65rem; opacity: 0.7;"></i>
        </a>

        <div class="collapse ${showClass}" id="${id}" data-bs-parent="#sidebarMenuContainer">
          <div class="ms-4 ps-2 mt-1 mb-2 sidebar-submenu">
            ${linksHtml}
          </div>
        </div>
      </div>
    `;
  };

  // --- LÓGICA DE MONTAGEM DO MENU ---
  let menuLinks = renderLink("/home", "fas fa-home", "Início");

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

  // --- CONTAINER DO PERFIL DO USUÁRIO ---
  const fotoUrl = usuario && usuario.foto ? `/uploads/${usuario.foto}` : null;
  
  const renderFoto = fotoUrl
    ? `<a href="#" data-bs-toggle="modal" data-bs-target="#modalFotoPerfil" title="Visualizar Foto" class="d-block shadow-lg img-profile-clickable rounded-circle" style="width: 90px; height: 90px; border: 3px solid rgba(8,192,104,0.3); overflow: hidden; margin: 0 auto; padding: 0;">
         <img src="${fotoUrl}" alt="Foto de perfil" class="rounded-circle" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 50%;">
       </a>`
    : `<div class="d-flex align-items-center justify-content-center shadow-lg rounded-circle" style="width: 90px; height: 90px; background-color: rgba(255,255,255,0.05); border: 3px solid rgba(8,192,104,0.3); margin: 0 auto;"><i class="fa-solid fa-user" style="font-size: 2.2rem; color: #08c068;"></i></div>`;

  const btnConfigAdmin = tipo === "admin"
    ? `<a href="/configuracoes" class="ms-2 mb-0 transition-btn d-flex align-items-center justify-content-center profile-config-btn" title="Configurações do Sistema" style="text-decoration: none; background: transparent; padding: 2px; line-height: 1; color: rgba(255,255,255,0.7);">
         <i class="fa-solid fa-gear" style="font-size: 0.85rem;"></i>
       </a>`
    : "";

  const btnNotificacoes = `
    <button type="button" id="btnAbrirNotificacoes" class="ms-2 mb-0 transition-btn d-flex align-items-center justify-content-center border-0 bg-transparent position-relative profile-notif-btn" title="Notificações" style="padding: 2px; line-height: 1; color: rgba(255,255,255,0.7);">
       <i class="fa-solid fa-bell" style="font-size: 0.85rem;"></i>
       <span id="contadorNotificacoes" class="position-absolute top-0 start-100 translate-middle badge rounded-pill shadow-sm" style="font-size: 0.45rem; min-width: 14px; height: 14px; display: none; align-items: center; justify-content: center; padding: 0 3px; border: 2px solid #1f1f1f; background-color: #08c068; color: #fff;">0</span>
    </button>
  `;

  const btnSair = `
    <a href="/logout" class="ms-2 mb-0 transition-btn d-flex align-items-center justify-content-center profile-logout-btn" title="Sair do Sistema" style="text-decoration: none; background: transparent; padding: 2px; line-height: 1; color: rgba(220, 53, 69, 0.75);">
      <i class="fas fa-sign-out-alt" style="font-size: 0.85rem;"></i>
    </a>
  `;

  const userProfileHtml = `
    <div class="user-profile-container px-3 pb-4 pt-0 mb-3 border-bottom border-light border-opacity-10 position-relative text-center">
      <div class="d-flex flex-column align-items-center justify-content-center">
        <div class="profile-avatar-box mb-3 position-relative d-flex justify-content-center">
          ${renderFoto}
        </div>

        <div class="text-truncate w-100 px-1 profile-info-box">
          <div class="fw-bold text-truncate mb-2 profile-name-text" style="font-size: 0.95rem; color: #ffffff;" title="${usuario && usuario.nome ? usuario.nome : "Usuário"}">
            ${usuario && usuario.nome ? usuario.nome : "Usuário"}
          </div>
          <div class="d-flex align-items-center justify-content-center">
            <span class="badge profile-badge-type shadow-sm" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 6px; background-color: rgba(8,192,104,0.15); color: #08c068; border: 1px solid rgba(8,192,104,0.3);">
              <i class="fa-solid fa-shield-halved me-1 opacity-75"></i> ${tipo}
            </span>
            ${btnNotificacoes}
            ${btnConfigAdmin}
            ${btnSair}
          </div>
        </div>
      </div>
    </div>
  `;

  // --- MODAL DA FOTO DE PERFIL ---
  const modalFotoHtml = fotoUrl ? `
    <div class="modal fade" id="modalFotoPerfil" tabindex="-1" aria-hidden="true" style="z-index: 2060;">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content bg-transparent border-0 shadow-none">
          <div class="modal-header border-0 d-flex justify-content-end p-0 mb-2">
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body text-center p-0">
            <img src="${fotoUrl}" alt="Foto ampliada" class="img-fluid rounded shadow-lg" style="max-height: 75vh; object-fit: contain;">
          </div>
        </div>
      </div>
    </div>
  ` : '';

  // --- RODAPÉ 71DEV COM VERSÃO ---
  const footerHTML = `
    <div class="mt-auto pt-3 pb-2 text-center w-100 footer-sidebar" style="font-size: 0.7rem; color: rgba(255,255,255,0.4);">
      <div class="mb-2 text-uppercase" style="font-size: 0.6rem; font-weight: 500; letter-spacing: 1px; color: rgba(255,255,255,0.3);">
        Ecoflow v${versaoSistemaCache}
      </div>
      <hr class="border-light border-opacity-10 mb-2 mt-0 mx-3">

      <div class="d-flex flex-column align-items-center justify-content-center gap-2 mb-1">
        <span class="sidebar-text">Desenvolvido por <strong style="color: #08c068;">71dev</strong></span>

        <div class="d-flex align-items-center justify-content-center gap-2">
          <a href="https://www.instagram.com/71dev_/" target="_blank" class="transition-btn d-flex align-items-center justify-content-center" title="Instagram" style="text-decoration: none; background: transparent; padding: 2px; line-height: 1; color: rgba(255,255,255,0.5);">
            <i class="fa-brands fa-instagram" style="font-size: 1rem;"></i>
          </a>

          <a href="https://wa.me/557183174920" target="_blank" class="transition-btn d-flex align-items-center justify-content-center" title="WhatsApp" style="text-decoration: none; background: transparent; padding: 2px; line-height: 1; color: rgba(255,255,255,0.5);">
            <i class="fa-brands fa-whatsapp" style="font-size: 1rem;"></i>
          </a>
        </div>
      </div>
    </div>
  `;

  // --- PAINEL DE NOTIFICAÇÕES (TEMA ESCURO) ---
  const notificacoesPanelHtml = `
    <div class="offcanvas offcanvas-end painel-notificacoes-animado" tabindex="-1" id="painelNotificacoes" aria-labelledby="painelNotificacoesLabel">
      <div class="offcanvas-header border-bottom painel-notificacoes-header">
        <h6 class="offcanvas-title fw-bold mb-0 text-white" id="painelNotificacoesLabel" style="font-size: 0.95rem; letter-spacing: 0.5px;">
          <i class="fa-regular fa-bell me-2" style="color: #08c068;"></i> Notificações
        </h6>
        <button type="button" class="btn-close btn-close-white opacity-75" data-bs-dismiss="offcanvas" aria-label="Fechar"></button>
      </div>

      <div class="offcanvas-body p-0 painel-notificacoes-body">
        <div id="listaNotificacoes" class="p-3"></div>

        <div class="border-top p-3 painel-notificacoes-footer">
          <button type="button" id="btnLimparNotificacoes" class="btn btn-outline-danger w-100 btn-sm fw-medium" style="border-radius: 6px;">
            <i class="fa-regular fa-trash-can me-1"></i> Limpar todas
          </button>
        </div>
      </div>
    </div>

    <script>
      // =======================================================================
      // FUNÇÃO GLOBAL: SKELETON LOADING PARA O MENU LATERAL E PÁGINA
      // =======================================================================
      window.mostrarSkeletonMenuLateral = function() {
          const avatar = document.querySelector('.profile-avatar-box a') || document.querySelector('.profile-avatar-box div');
          if (avatar) avatar.classList.add('skeleton-dark');
          
          const nome = document.querySelector('.user-profile-container .profile-name-text');
          if (nome) nome.classList.add('skeleton-dark'); 
          
          const badge = document.querySelector('.user-profile-container .profile-badge-type');
          if (badge) badge.classList.add('skeleton-dark'); 
          
          const btnNotif = document.getElementById('btnAbrirNotificacoes');
          if (btnNotif) btnNotif.classList.add('skeleton-dark');
          
          const btnConfig = document.querySelector('.profile-config-btn');
          if (btnConfig) btnConfig.classList.add('skeleton-dark');

          const btnSair = document.querySelector('.profile-logout-btn');
          if (btnSair) btnSair.classList.add('skeleton-dark');

          const linksSpans = document.querySelectorAll('#sidebarMenuContainer a .sidebar-text');
          linksSpans.forEach(el => el.classList.add('skeleton-dark'));
          
          const linksIcons = document.querySelectorAll('#sidebarMenuContainer a .menu-icone');
          linksIcons.forEach(el => el.classList.add('skeleton-dark'));

          const links = document.querySelectorAll('#sidebarMenuContainer a');
          links.forEach(l => l.style.pointerEvents = 'none');
      };

      window.ocultarSkeletonMenuLateral = function() {
          const avatar = document.querySelector('.profile-avatar-box a') || document.querySelector('.profile-avatar-box div');
          if (avatar) avatar.classList.remove('skeleton-dark');
          
          const nome = document.querySelector('.user-profile-container .profile-name-text');
          if (nome) nome.classList.remove('skeleton-dark'); 
          
          const badge = document.querySelector('.user-profile-container .profile-badge-type');
          if (badge) badge.classList.remove('skeleton-dark'); 
          
          const btnNotif = document.getElementById('btnAbrirNotificacoes');
          if (btnNotif) btnNotif.classList.remove('skeleton-dark');

          const btnConfig = document.querySelector('.profile-config-btn');
          if (btnConfig) btnConfig.classList.remove('skeleton-dark');

          const btnSair = document.querySelector('.profile-logout-btn');
          if (btnSair) btnSair.classList.remove('skeleton-dark');

          const linksSpans = document.querySelectorAll('#sidebarMenuContainer a .sidebar-text');
          linksSpans.forEach(el => el.classList.remove('skeleton-dark'));
          
          const linksIcons = document.querySelectorAll('#sidebarMenuContainer a .menu-icone');
          linksIcons.forEach(el => el.classList.remove('skeleton-dark'));

          const links = document.querySelectorAll('#sidebarMenuContainer a');
          links.forEach(l => l.style.pointerEvents = '');
      };

      mostrarSkeletonMenuLateral();

      if (document.readyState === 'complete') {
          setTimeout(ocultarSkeletonMenuLateral, 100);
      } else {
          window.addEventListener('load', ocultarSkeletonMenuLateral);
      }

      window.addEventListener('beforeunload', () => {
          mostrarSkeletonMenuLateral();
      });

      // =======================================================================
      // LÓGICA DO PAINEL DE NOTIFICAÇÕES
      // =======================================================================
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
            <div class="text-center text-white-50 py-5" style="opacity: 0.5;">
              <i class="fa-regular fa-bell-slash fs-2 d-block mb-2"></i>
              Nenhuma notificação encontrada.
            </div>
          \`;
        };

        const htmlSkeletonNotificacoes = () => {
          let skeletons = '';
          for(let i=0; i<4; i++) {
             skeletons += \`
              <div class="rounded-3 p-3 mb-2 item-notificacao" style="background-color: #1f1f1f; border: 1px solid rgba(255,255,255,0.05);">
                <div class="d-flex justify-content-between gap-2">
                  <div class="w-100">
                    <div class="skeleton-dark skeleton-text w-75 mb-2"></div>
                    <div class="skeleton-dark skeleton-text w-50"></div>
                  </div>
                  <div class="skeleton-dark" style="width: 24px; height: 24px; border-radius: 4px; flex-shrink: 0;"></div>
                </div>
              </div>
             \`;
          }
          return skeletons;
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
                  headers: { "Accept": "application/json" }
                });

                const data = await resp.json();
                if (!resp.ok || !data.sucesso) throw new Error(data.erro || "Erro");
                if (item) item.remove();
                atualizarEstadoVazio();
              } catch (err) {
                btnExcluir.disabled = false;
              }
            });
          });
        };

        const carregarNotificacoes = async (mostrarLoading = true) => {
          if (mostrarLoading) lista.innerHTML = htmlSkeletonNotificacoes();

          try {
            const resp = await fetch("/notificacoes", {
              method: "GET",
              headers: { "Accept": "application/json" }
            });
            const notificacoes = await resp.json();

            if (!resp.ok) throw new Error(notificacoes.erro || "Erro");

            atualizarContadorNotificacoes(Array.isArray(notificacoes) ? notificacoes.length : 0);

            if (!Array.isArray(notificacoes) || notificacoes.length === 0) {
              lista.innerHTML = htmlSemNotificacoes();
              return;
            }

            lista.innerHTML = notificacoes.map(n => {
              const data = n.criado_em ? new Date(n.criado_em).toLocaleString("pt-BR") : "";
              return \`
                <div class="rounded-3 p-3 mb-2 item-notificacao" data-id="\${n.id}" style="background-color: #1f1f1f; border: 1px solid rgba(255,255,255,0.05);">
                  <div class="d-flex justify-content-between gap-2 align-items-start">
                    <div>
                      <div class="fw-medium text-white mb-1" style="font-size: 0.85rem; line-height: 1.4;">\${escapeHtml(n.mensagem || "Notificação")}</div>
                      <small class="text-white-50" style="font-size: 0.7rem;">\${escapeHtml(data)}</small>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-secondary border-0 text-white-50 btn-excluir-notificacao" data-id="\${n.id}" title="Excluir" style="padding: 2px 6px; transition: all 0.2s;" onmouseover="this.style.color='#dc3545'; this.style.backgroundColor='rgba(220, 53, 69, 0.1)';" onmouseout="this.style.color=''; this.style.backgroundColor='transparent';">
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
              lista.innerHTML = \`<div class="alert alert-dark border-0 m-0" style="background:#2a2a2a; color:#ccc; font-size:0.85rem;">Erro ao carregar notificações.</div>\`;
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
                headers: { "Accept": "application/json" }
              });
              const data = await resp.json();
              if (!resp.ok || !data.sucesso) throw new Error(data.erro || "Erro");
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

  // --- RETORNO COM O NOVO CSS (DARK & GREEN & SLIM SCROLL) ---
  return `
    <style>
      body{
        font-family: 'Roboto', Tahoma, Geneva, Verdana, sans-serif;
      }

      /* OVERRIDE DA SIDEBAR NAS VIEWS */
      .sidebar {
        width: 240px !important;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        background-color: #1f1f1f !important;
        border-right: 1px solid rgba(255,255,255,0.05);
      }

      /* Links Principais do Menu */
      .sidebar a.menu-item-main {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6) !important;
        border-left: 3px solid transparent;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        border-radius: 0 6px 6px 0;
        margin-right: 8px;
      }

      .sidebar a.menu-item-main:hover {
        color: #ffffff !important;
        background-color: rgba(255, 255, 255, 0.03);
      }

      .sidebar a.menu-item-main.active,
      .sidebar a.nav-accordion-btn[aria-expanded="true"] {
        color: #08c068 !important;
        background-color: rgba(8, 192, 104, 0.08);
        border-left: 3px solid #08c068;
      }

      .sidebar a.active .menu-icone,
      .sidebar a.nav-accordion-btn[aria-expanded="true"] .menu-icone {
        color: #08c068 !important;
      }

      /* Efeito Sanfona (Accordion) e Submenu */
      .nav-accordion .collapse {
        transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .sidebar-submenu {
        border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
        overflow: hidden;
      }

      .menu-link-item {
        color: rgba(255, 255, 255, 0.5) !important;
        font-size: 0.8rem;
        transform: translateY(-5px);
        opacity: 0;
        transition: all 0.3s ease-in-out;
        border-radius: 6px;
        margin-right: 8px;
      }

      .nav-accordion .collapse.show .menu-link-item {
        opacity: 1;
        transform: translateY(0);
      }

      .menu-link-item:hover {
        transform: translateX(6px) !important;
        color: #08c068 !important;
        background-color: rgba(255,255,255,0.02);
      }

      .menu-link-item.active {
        color: #08c068 !important;
        font-weight: 600;
        background-color: rgba(8, 192, 104, 0.05);
      }

      /* Hover para a foto de perfil */
      .img-profile-clickable {
        transition: transform 0.2s ease, filter 0.2s ease, border-color 0.2s ease;
        display: block;
      }

      .img-profile-clickable:hover {
        transform: scale(1.05);
        filter: brightness(1.1);
        border-color: rgba(8,192,104,0.6) !important;
      }

      .transition-btn {
        transition: all 0.2s ease;
        border-radius: 4px;
      }

      .transition-btn:hover {
        background: rgba(255,255,255,0.08) !important;
        color: #08c068 !important;
      }

      /* Hover especial para o Botão de Sair */
      .profile-logout-btn:hover {
        background: rgba(220, 53, 69, 0.15) !important;
        color: #dc3545 !important;
      }
      
      .chevron-icon {
        transition: transform 0.35s ease;
      }

      .nav-accordion-btn[aria-expanded="true"] .chevron-icon {
        transform: rotate(-180deg);
        color: #08c068 !important;
      }
      
      /* Scrollbar Discreta e Mínima */
      .sidebar-scroll-area {
        overflow-y: auto;
        overflow-x: hidden;
      }

      .sidebar-scroll-area::-webkit-scrollbar {
        width: 3px;
      }

      .sidebar-scroll-area::-webkit-scrollbar-track {
        background: transparent;
      }

      .sidebar-scroll-area::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.05);
        border-radius: 10px;
      }

      .sidebar-scroll-area:hover::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.15);
      }

      /* Estilização do Painel de Notificações (DARK THEME) */
      .painel-notificacoes-animado {
        width: min(400px, 92vw);
        border-left: 0;
        box-shadow: -18px 0 45px rgba(0, 0, 0, 0.5);
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
        background-color: #1f1f1f;
        color: #fff;
        border-bottom: 1px solid rgba(255,255,255,0.05) !important;
      }

      .painel-notificacoes-body {
        background-color: #151515;
      }

      .painel-notificacoes-footer {
        background-color: #1f1f1f;
        border-top: 1px solid rgba(255,255,255,0.05) !important;
      }
      
      .item-notificacao {
        background-color: #1f1f1f !important;
        border: 1px solid rgba(255,255,255,0.05);
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
      }
      .item-notificacao:hover {
        border-color: rgba(8, 192, 104, 0.3) !important;
        transform: translateY(-2px);
      }

      .offcanvas-backdrop.show {
        opacity: 0.5;
      }

      /* =========================================================
         SKELETON LOADING PARA MENU LATERAL (DARK) E GERAIS
         ========================================================= */
      .skeleton-dark {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite linear;
          border-radius: 6px;
          color: transparent !important;
          box-shadow: none !important;
          border-color: transparent !important;
      }
      .skeleton-dark * {
          visibility: hidden !important;
      }

      .skeleton-view {
          background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite linear;
          border-radius: 6px;
          color: transparent !important;
      }
      .skeleton-view * {
          visibility: hidden !important;
      }

      .skeleton-text {
          height: 14px;
          border-radius: 4px;
      }

      @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
      }

      @keyframes painelNotificacoesEntrada {
        0% { transform: translateX(115%); opacity: 0.85; }
        70% { transform: translateX(-10px); opacity: 1; }
        100% { transform: translateX(0); opacity: 1; }
      }

      @keyframes painelNotificacoesSaida {
        0% { transform: translateX(0); opacity: 1; }
        100% { transform: translateX(115%); opacity: 0.85; }
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

    <div class="d-flex flex-column h-100 pt-0">
      <div class="flex-grow-1 sidebar-scroll-area" id="sidebarMenuContainer">
        ${userProfileHtml}
        ${menuLinks}
      </div>

      ${footerHTML}
    </div>

    ${notificacoesPanelHtml}
    ${modalFotoHtml}
  `;
}

module.exports = menuLateral;