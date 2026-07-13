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

  // --- DEFINIÇÃO DOS LINKS ---
  const logLinks = [
    { href: "/producao", icone: "fas fa-industry", texto: "Produção" },
    { href: "/veiculos", icone: "fas fa-car", texto: "Veículos" },
    { href: "/checklist-motoristas", icone: "fas fa-clipboard-check", texto: "Checklist" },
    { href: "/entregas", icone: "fas fa-truck", texto: "Rotas" },
    { href: "/caderno-entregas", icone: "fas fa-book-open-reader", texto: "Caderno" },
    { href: "/envios-whatsapp", icone: "fab fa-whatsapp", texto: "Envios" },
    { href: "/espacos-trabalho", icone: "fa-solid fa-cubes", texto: "Workspaces" },
    { href: "/clientes", icone: "fas fa-users", texto: "Clientes" },
    { href: "/downloads", icone: "fa-solid fa-cloud-arrow-down", texto: "Downloads" }
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
    { href: "/envios-whatsapp", icone: "fab fa-whatsapp", texto: "Envios" },
    { href: "/diaristas", icone: "fas fa-users", texto: "Diaristas" },
    { href: "/pagamentos", icone: "fas fa-money-bill-wave", texto: "Pagamentos" },
    { href: "/espacos-trabalho", icone: "fa-solid fa-cubes", texto: "Workspaces" },
    { href: "/clientes", icone: "fas fa-users", texto: "Clientes" },
    { href: "/downloads", icone: "fa-solid fa-cloud-arrow-down", texto: "Downloads" }
  ];

  const desLinks = [
    { href: "/propostas", icone: "fa-solid fa-file-signature", texto: "Propostas" },
    { href: "/admin/gabaritos", icone: "fa-solid fa-folder-open", texto: "Gabaritos" },
    { href: "/espacos-trabalho", icone: "fa-solid fa-cubes", texto: "Workspaces" },
    { href: "/qr-generator", icone: "fa-solid fa-qrcode", texto: "QR Codes" },
    { href: "/downloads", icone: "fa-solid fa-cloud-arrow-down", texto: "Downloads" }
  ];

  // Agrupar links para as sugestões da barra de pesquisa
  let availableLinks = [ { href: "/home", icone: "fas fa-home", texto: "Início" } ];

  // --- FUNÇÕES DE RENDERIZAÇÃO ---
  const renderLink = (href, icone, texto) => {
    const activeClass = rotaAtiva === href ? "active" : "";

    return `
      <a href="${href}" onclick="sessionStorage.removeItem('activeMenuParent')" class="${activeClass} d-flex align-items-center text-decoration-none py-2 px-3 menu-item-main mb-1">
        <i class="${icone} menu-icone" style="width: 22px; text-align: center;"></i> 
        <span class="sidebar-text ms-2">${texto}</span>
      </a>`;
  };

  const renderCollapse = (id, icone, titulo, linksArray) => {
    // DROPEND EXCLUSIVO PARA DESKTOP
    let linksHtmlDesktop = linksArray.map(l => {
      const isMatch = rotaAtiva === l.href;
      return `
        <li>
          <a href="${l.href}" onclick="sessionStorage.setItem('activeMenuParent', '${id}')" class="dropdown-item py-2 d-flex align-items-center ${isMatch ? 'link-match' : ''}" style="font-size: 0.85rem;">
            <i class="${l.icone} me-2 text-center menu-icone" style="width: 20px;"></i>
            <span class="dropdown-item-text-custom sidebar-text-item">${l.texto}</span>
          </a>
        </li>`;
    }).join("");

    const desktopHtml = `
      <div class="dropdown dropend w-100 menu-dropdown-container d-none d-md-block position-relative mb-1" data-parent-id="${id}">
        <a href="#" class="d-flex align-items-center text-decoration-none py-2 px-3 menu-item-main" data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside" data-bs-popper-config='{"strategy":"fixed"}'>
          <i class="${icone} menu-icone" style="width: 22px; text-align: center;"></i>
          <span class="sidebar-text ms-2">${titulo}</span>
          <i class="fa-solid fa-chevron-right ms-auto sidebar-text chevron-icon" style="font-size: 0.65rem; opacity: 0.7;"></i>
        </a>
        <ul class="dropdown-menu dropdown-menu-dark shadow-lg border-custom py-2" style="background-color: #222; border-radius: 8px; min-width: 210px; z-index: 1050; margin-left: 5px;">
          ${linksHtmlDesktop}
        </ul>
      </div>
    `;

    // ACCORDION EXCLUSIVO PARA MOBILE/OFFCANVAS
    let linksHtmlMobile = linksArray.map(l => {
      const isMatch = rotaAtiva === l.href;
      return `
        <a href="${l.href}" onclick="sessionStorage.setItem('activeMenuParent', '${id}')" class="${isMatch ? 'link-match' : ''} py-2 mb-1 menu-link-item d-flex align-items-center text-decoration-none">
          <i class="${l.icone} menu-icone" style="width: 18px; text-align: center;"></i> 
          <span class="sidebar-text ms-2">${l.texto}</span>
        </a>`;
    }).join("");

    const mobileHtml = `
      <div class="nav-accordion d-md-none mb-1" data-parent-id="${id}">
        <a data-bs-toggle="collapse" href="#${id}" role="button" aria-expanded="false" aria-controls="${id}" class="d-flex justify-content-between align-items-center nav-accordion-btn text-decoration-none py-2 px-3 menu-item-main">
          <span class="d-flex align-items-center">
            <i class="${icone} menu-icone" style="width: 22px; text-align: center;"></i> 
            <span class="sidebar-text ms-2">${titulo}</span>
          </span>
          <i class="fa-solid fa-chevron-right chevron-icon sidebar-text" style="font-size: 0.65rem; opacity: 0.7;"></i>
        </a>
        <div class="collapse" id="${id}" data-bs-parent="#sidebarMenuContainer">
          <div class="ms-4 ps-2 mt-1 mb-2 sidebar-submenu">
            ${linksHtmlMobile}
          </div>
        </div>
      </div>
    `;

    return desktopHtml + mobileHtml;
  };

    // --- BARRA DE PESQUISA HTML (Acima do Início) ---
  const searchBarHtml = `
    <div class="mb-2 mt-2 sidebar-search-container position-relative" style="z-index: 1060;">
      <div class="position-relative w-100">
        <i class="fa-solid fa-search position-absolute text-white-50" style="top: 50%; transform: translateY(-50%); left: 10px; font-size: 0.8rem;"></i>
        <input type="text" id="menuSearchInput" oninput="buscarLinksMenu(this.value)" onfocus="buscarLinksMenu(this.value)" onblur="setTimeout(() => fecharSugestoes(), 200)" class="form-control form-control-sm bg-custom-darker border-custom text-white shadow-none w-100" placeholder="Pesquisar..." style="padding-left: 30px; border-radius: 6px;">
      </div>
      <div id="searchSuggestions" class="dropdown-menu dropdown-menu-dark w-100 shadow-lg border-custom py-1 position-absolute" style="top: 100%; left: 0; display: none; max-height: 250px; overflow-y: auto; border-radius: 6px; margin-top: 4px;">
      </div>
    </div>
  `;

  // --- LÓGICA DE MONTAGEM DO MENU ---
  let menuLinks = searchBarHtml;
  menuLinks += renderLink("/home", "fas fa-home", "Início");

  if (tipo === "motorista") {
    menuLinks += renderCollapse("collMot", "fas fa-id-card", "Motorista", motLinks);
    availableLinks.push(...motLinks);
  } else if (tipo === "logistica") {
    menuLinks += renderCollapse("collLog", "fas fa-boxes-packing", "Logística", logLinks);
    availableLinks.push(...logLinks);
  } else if (tipo === "design") {
    menuLinks += renderCollapse("collDes", "fa-solid fa-palette", "Design", desLinks);
    availableLinks.push(...desLinks);
  } else if (tipo === "financeiro") {
    menuLinks += renderCollapse("collFin", "fa-solid fa-wallet", "Financeiro", finLinks);
    availableLinks.push(...finLinks);
  } else {
    menuLinks += renderCollapse("collLog", "fas fa-industry", "Logística", logLinks);
    menuLinks += renderCollapse("collMot", "fas fa-id-card", "Motorista", motLinks);
    menuLinks += renderCollapse("collFin", "fa-solid fa-wallet", "Financeiro", finLinks);
    menuLinks += renderCollapse("collDes", "fa-solid fa-palette", "Design", desLinks);
    menuLinks += renderLink("/cadastro", "fas fa-user-plus", "Usuários");
    menuLinks += renderLink("/dev/testes", "fa-solid fa-vial-virus", "Dev Lab");
    
    availableLinks.push(...logLinks, ...motLinks, ...finLinks, ...desLinks);
    availableLinks.push({ href: "/cadastro", icone: "fas fa-user-plus", texto: "Usuários" });
    availableLinks.push({ href: "/dev/testes", icone: "fa-solid fa-vial-virus", texto: "Dev Lab" });
  }

  // Remove duplicados nas sugestões
  const uniqueLinks = Array.from(new Map(availableLinks.map(item => [item.href, item])).values());

  // --- BOTÃO DE TOGGLE DA SIDEBAR ---
  const toggleBtnHtml = `
    <button class="d-none d-md-flex align-items-center justify-content-center toggle-sidebar-btn" onclick="toggleSidebarMenu()" title="Recolher Menu">
      <i class="fa-solid fa-bars-staggered fs-5 toggle-icon"></i>
    </button>
  `;

  // --- CONTAINER DO PERFIL DO USUÁRIO (Lado a Lado) ---
  const fotoUrl = usuario && usuario.foto ? `/uploads/${usuario.foto}` : null;
  
  const renderFoto = fotoUrl
    ? `<a href="#" data-bs-toggle="modal" data-bs-target="#modalFotoPerfil" title="Visualizar Foto" class="d-block shadow-sm img-profile-clickable rounded-circle" style="width: 100%; height: 100%; border: 2px solid rgba(8,192,104,0.3); overflow: hidden; margin: 0; padding: 0;">
         <img src="${fotoUrl}" alt="Foto de perfil" class="rounded-circle" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 50%;">
       </a>`
    : `<div class="d-flex align-items-center justify-content-center shadow-sm rounded-circle img-profile-clickable" style="width: 100%; height: 100%; background-color: rgba(255,255,255,0.05); border: 2px solid rgba(8,192,104,0.3); margin: 0;"><i class="fa-solid fa-user" style="font-size: 1.5rem; color: #08c068;"></i></div>`;

  const btnConfigAdmin = tipo === "admin"
    ? `<a href="/configuracoes" class="ms-1 mb-0 transition-btn d-flex align-items-center justify-content-center profile-config-btn" title="Configurações do Sistema" style="text-decoration: none; background: transparent; padding: 4px; line-height: 1; color: rgba(255,255,255,0.7);">
         <i class="fa-solid fa-gear" style="font-size: 0.85rem;"></i>
       </a>`
    : "";

  const btnNotificacoes = `
    <button type="button" id="btnAbrirNotificacoes" class="mb-0 transition-btn d-flex align-items-center justify-content-center border-0 bg-transparent position-relative profile-notif-btn" title="Notificações" style="padding: 4px; line-height: 1; color: rgba(255,255,255,0.7);">
       <i class="fa-solid fa-bell" style="font-size: 0.85rem;"></i>
       <span id="contadorNotificacoes" class="position-absolute top-0 start-100 translate-middle badge rounded-pill shadow-sm" style="font-size: 0.45rem; min-width: 14px; height: 14px; display: none; align-items: center; justify-content: center; padding: 0 3px; border: 2px solid #1f1f1f; background-color: #08c068; color: #fff;">0</span>
    </button>
  `;

  const btnSair = `
    <a href="/logout" class="ms-1 mb-0 transition-btn d-flex align-items-center justify-content-center profile-logout-btn" title="Sair do Sistema" style="text-decoration: none; background: transparent; padding: 4px; line-height: 1; color: rgba(220, 53, 69, 0.75);">
      <i class="fas fa-sign-out-alt" style="font-size: 0.85rem;"></i>
    </a>
  `;

  const userProfileHtml = `
    <div class="user-profile-container px-2 pb-3 pt-2 mt-2 mb-2 border-bottom border-light border-opacity-10 position-relative">
      <div class="d-flex flex-row align-items-center justify-content-start gap-2 profile-flex-container">
        <div class="profile-avatar-box position-relative d-flex justify-content-center align-items-center" style="width: 48px; height: 48px; flex-shrink: 0; transition: all 0.3s ease;">
          ${renderFoto}
        </div>

        <div class="profile-info-box d-flex flex-column text-start justify-content-center flex-grow-1" style="min-width: 0;">
          <div class="fw-bold text-truncate mb-1 profile-name-text" style="font-size: 0.85rem; color: #ffffff; line-height: 1.1;" title="${usuario && usuario.nome ? usuario.nome : "Usuário"}">
            Olá, ${usuario && usuario.nome ? usuario.nome : "Usuário"}
          </div>
          <div class="d-flex align-items-center justify-content-start gap-1 flex-nowrap" style="min-width: 0;">
            <span class="badge profile-badge-type shadow-sm" style="font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.3px; padding: 3px 5px; border-radius: 4px; background-color: rgba(8,192,104,0.15); color: #08c068; border: 1px solid rgba(8,192,104,0.3); flex-shrink: 1;">
              ${tipo}
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
      <div class="mb-2 text-uppercase fw-medium sidebar-text" style="font-size: 0.6rem; letter-spacing: 1px; color: rgba(255,255,255,0.3);">
        Ecoflow v${versaoSistemaCache}
      </div>
      <hr class="border-light border-opacity-10 mb-2 mt-0 mx-3 footer-hr">

      <div class="d-flex flex-column align-items-center justify-content-center gap-2 mb-1">
        <span class="sidebar-text">Desenvolvido por <strong style="color: #08c068;">71dev</strong></span>

        <div class="d-flex align-items-center justify-content-center gap-2 social-icons-footer">
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
      // LÓGICA DE BARRA DE PESQUISA (SUGESTÕES DINÂMICAS)
      // =======================================================================
      window.menuLinksData = ${JSON.stringify(uniqueLinks)};

      window.buscarLinksMenu = function(termo) {
          const container = document.getElementById("searchSuggestions");
          if (!container) return;
          
          if (!termo.trim()) {
              container.style.display = "none";
              return;
          }
          
          const filtrados = window.menuLinksData.filter(l => l.texto.toLowerCase().includes(termo.toLowerCase()));
          
          if (filtrados.length === 0) {
              container.innerHTML = '<div class="px-3 py-2 text-white-50 small">Nenhum resultado encontrado</div>';
          } else {
              container.innerHTML = filtrados.map(l => 
                  '<a href="'+l.href+'" onclick="sessionStorage.removeItem(\\'activeMenuParent\\')" class="dropdown-item py-2 d-flex align-items-center text-white" style="font-size: 0.85rem;"><i class="'+l.icone+' text-muted me-2" style="width:20px; text-align:center;"></i>'+l.texto+'</a>'
              ).join("");
          }
          container.style.display = "block";
      };

      window.fecharSugestoes = function() {
          const container = document.getElementById("searchSuggestions");
          if(container) container.style.display = "none";
      };

      // =======================================================================
      // LÓGICA DO BOTÃO COLLAPSE (RECOLHER MENU) E MODAL NO BODY
      // =======================================================================
      window.toggleSidebarMenu = function() {
          const sidebar = document.querySelector(".sidebar");
          if (sidebar) {
              sidebar.classList.toggle("collapsed");
              localStorage.setItem("ecoflow_sidebar_collapsed", sidebar.classList.contains("collapsed"));
          }
      };

      document.addEventListener("DOMContentLoaded", () => {
          // Restaura o estado de colapso do menu
          const sidebar = document.querySelector(".sidebar");
          if (sidebar && localStorage.getItem("ecoflow_sidebar_collapsed") === "true") {
              sidebar.classList.add("collapsed");
          }

          // Move o modal da foto de perfil para o body (Corrige o bug de Backdrop sobrepondo a foto)
          const modalFoto = document.getElementById("modalFotoPerfil");
          if (modalFoto && modalFoto.parentElement !== document.body) {
              document.body.appendChild(modalFoto);
          }
      });

      // =======================================================================
      // LÓGICA DE ATIVAÇÃO DE MENU PRECISA (EVITA MARCAÇÃO DUPLA DE LINKS)
      // =======================================================================
      document.addEventListener("DOMContentLoaded", () => {
          const clickedParentId = sessionStorage.getItem('activeMenuParent');
          const matchedLinks = document.querySelectorAll('.link-match');
          
          let foundMatch = false;

          matchedLinks.forEach(link => {
              const parentContainer = link.closest('.menu-dropdown-container') || link.closest('.nav-accordion');
              if (!parentContainer) return;
              
              const parentId = parentContainer.dataset.parentId;

              if (clickedParentId === parentId) {
                  link.classList.add('active');
                  
                  const mainBtn = parentContainer.querySelector('.menu-item-main');
                  if (mainBtn) mainBtn.classList.add('active');
                  
                  if(parentContainer.classList.contains('nav-accordion')) {
                       const collapseEl = parentContainer.querySelector('.collapse');
                       const accBtn = parentContainer.querySelector('.nav-accordion-btn');
                       if (collapseEl) collapseEl.classList.add('show');
                       if (accBtn) accBtn.setAttribute('aria-expanded', 'true');
                  }
                  foundMatch = true;
              }
          });

          // Fallback se não achou via sessionStorage (carregamento direto da URL)
          if (!foundMatch && matchedLinks.length > 0) {
              const link = matchedLinks[0]; // Pega o primeiro que encontrar (impede de abrir 2 menus)
              link.classList.add('active');
              
              const parentContainer = link.closest('.menu-dropdown-container') || link.closest('.nav-accordion');
              if (parentContainer) {
                  const mainBtn = parentContainer.querySelector('.menu-item-main');
                  if (mainBtn) mainBtn.classList.add('active');
                  
                  if(parentContainer.classList.contains('nav-accordion')) {
                       const collapseEl = parentContainer.querySelector('.collapse');
                       const accBtn = parentContainer.querySelector('.nav-accordion-btn');
                       if (collapseEl) collapseEl.classList.add('show');
                       if (accBtn) accBtn.setAttribute('aria-expanded', 'true');
                  }
                  sessionStorage.setItem('activeMenuParent', parentContainer.dataset.parentId);
              }
          }
      });

      // =======================================================================
      // FUNÇÃO GLOBAL: SKELETON LOADING PARA O MENU LATERAL E PÁGINA
      // =======================================================================
      window.mostrarSkeletonMenuLateral = function() {
          const avatar = document.querySelector('.profile-avatar-box .img-profile-clickable') || document.querySelector('.profile-avatar-box div');
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
          if (btnSair) btnSair.classList.remove('skeleton-dark');

          const linksSpans = document.querySelectorAll('#sidebarMenuContainer a .sidebar-text, #sidebarMenuContainer .dropdown-item .sidebar-text-item');
          linksSpans.forEach(el => el.classList.add('skeleton-dark'));
          
          const linksIcons = document.querySelectorAll('#sidebarMenuContainer a .menu-icone');
          linksIcons.forEach(el => el.classList.add('skeleton-dark'));

          const links = document.querySelectorAll('#sidebarMenuContainer a');
          links.forEach(l => l.style.pointerEvents = 'none');
      };

      window.ocultarSkeletonMenuLateral = function() {
          const avatar = document.querySelector('.profile-avatar-box .img-profile-clickable') || document.querySelector('.profile-avatar-box div');
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

          const linksSpans = document.querySelectorAll('#sidebarMenuContainer a .sidebar-text, #sidebarMenuContainer .dropdown-item .sidebar-text-item');
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
      // CORREÇÃO DO BOTÃO VOLTAR (BFCACHE) - GLOBAL
      // =======================================================================
      window.addEventListener('pageshow', (event) => {
          if (event.persisted) {
              ocultarSkeletonMenuLateral();
              if (typeof window.ocultarSkeletonGlobais === 'function') {
                  window.ocultarSkeletonGlobais();
              }
          }
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

  // --- RETORNO COM O NOVO CSS (INTER GLOBAL FONTS & SLIM SCROLL) ---
  return `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <style>
      /* RESET E SOBRESCRITA GLOBAL FORÇADA PARA A FONTE INTER */
      html, body, .content, .form-control, .form-select, .btn, .modal-content, .accordion-button, .card, .table, th, td, span, label {
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
      }

      /* Scrollbar Discreta e Mínima */
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
      html, body, .content { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

      /* OVERRIDE DA SIDEBAR NAS VIEWS */
      .sidebar {
        width: 250px !important;
        position: relative;
        overflow-x: hidden !important; /* Elimina scroll lateral permanentemente */
        display: flex;
        flex-direction: column;
        background-color: #1f1f1f !important;
        border-right: 1px solid rgba(255,255,255,0.05);
        transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        z-index: 1030;
      }

      /* LOGO FIX NO COLAPSO */
      .sidebar.collapsed .text-center.mb-4.mt-2 > img {
        content: url("/img/logo-reduzida-branca.png");
        max-width: 30px !important;
        height: auto;
        display: block !important;
        margin: 0 auto;
      }
      .sidebar.collapsed .text-center.mb-4.mt-2::after { 
        display: none !important;
      }

      /* BOTÃO RECOLHER MENU (ABSOLUTO) */
      .toggle-sidebar-btn {
        position: absolute;
        top: 15px;
        right: 15px;
        background: transparent;
        border: none;
        color: rgba(255,255,255,0.4);
        cursor: pointer;
        z-index: 1050;
        padding: 0;
        outline: none;
      }
      .toggle-sidebar-btn:hover { color: #08c068; }

      /* Lógica de Esconder Elementos (Menu Colapsado) */
      .sidebar.collapsed { width: 78px !important; }
      .sidebar.collapsed .sidebar-text,
      .sidebar.collapsed .chevron-icon,
      .sidebar.collapsed .profile-info-box,
      .sidebar.collapsed .sidebar-search-container,
      .sidebar.collapsed .footer-sidebar span.sidebar-text,
      .sidebar.collapsed .footer-sidebar .footer-hr {
        display: none !important;
      }

      /* Perfil no modo recolhido */
      .sidebar.collapsed .user-profile-container { padding: 10px 0 !important; }
      .sidebar.collapsed .profile-flex-container { justify-content: center !important; }
      .sidebar.collapsed .profile-avatar-box { width: 38px !important; height: 38px !important; margin: 0 auto !important; }
      
      .sidebar.collapsed .menu-item-main { justify-content: center !important; padding-left: 0 !important; padding-right: 0 !important; }
      .sidebar.collapsed .menu-item-main .menu-icone { margin: 0 !important; font-size: 1.2rem; }
      .sidebar.collapsed .social-icons-footer { flex-direction: column; margin-top: 10px; }

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
      .sidebar a.menu-item-main.show {
        color: #08c068 !important;
        background-color: rgba(8, 192, 104, 0.08);
        border-left: 3px solid #08c068;
      }

      .sidebar a.active .menu-icone,
      .sidebar a.show .menu-icone {
        color: #08c068 !important;
      }

      /* Setinha (Sem animação de rotação) */
      .menu-item-main.show .chevron-icon { color: #08c068 !important; }
      .nav-accordion-btn[aria-expanded="true"] .chevron-icon { color: #08c068 !important; }

      /* Estilização Submenu Dropend e Sugestões */
      .dropdown-item {
        color: rgba(255, 255, 255, 0.6) !important;
        transition: all 0.2s ease-in-out;
        border-radius: 4px;
        margin: 0 4px;
        width: calc(100% - 8px);
      }
      .dropdown-item:hover, .dropdown-item:focus {
        background-color: rgba(255,255,255,0.05) !important;
        color: #08c068 !important;
        transform: translateX(4px);
      }
      .dropdown-item.active {
        background-color: rgba(8, 192, 104, 0.1) !important;
        color: #08c068 !important;
        font-weight: 600;
      }

      /* Accordion Mobile */
      .nav-accordion .collapse { transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
      .sidebar-submenu { border-left: 1px solid rgba(255, 255, 255, 0.08) !important; overflow: hidden; }
      .menu-link-item {
        color: rgba(255, 255, 255, 0.5) !important;
        font-size: 0.8rem;
        transform: translateY(-5px);
        opacity: 0;
        transition: all 0.3s ease-in-out;
        border-radius: 6px;
        margin-right: 8px;
      }
      .nav-accordion .collapse.show .menu-link-item { opacity: 1; transform: translateY(0); }
      .menu-link-item:hover { transform: translateX(6px) !important; color: #08c068 !important; background-color: rgba(255,255,255,0.02); }
      .menu-link-item.active { color: #08c068 !important; font-weight: 600; background-color: rgba(8, 192, 104, 0.05); }

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

      #menuSearchInput::placeholder {
        color: rgba(255, 255, 255, 0.5);
        opacity: 1;
      }

      .transition-btn { transition: all 0.2s ease; border-radius: 4px; }
      .transition-btn:hover { background: rgba(255,255,255,0.08) !important; color: #08c068 !important; }
      .profile-logout-btn:hover { background: rgba(220, 53, 69, 0.15) !important; color: #dc3545 !important; }
      
      .sidebar-scroll-area { overflow-y: auto; overflow-x: hidden !important; }
      .sidebar-scroll-area::-webkit-scrollbar { width: 3px; }
      .sidebar-scroll-area::-webkit-scrollbar-track { background: transparent; }
      .sidebar-scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      .sidebar-scroll-area:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }

      /* Estilização do Painel de Notificações (DARK THEME) */
      .painel-notificacoes-animado { width: min(400px, 92vw); border-left: 0; box-shadow: -18px 0 45px rgba(0, 0, 0, 0.5); }
      .offcanvas-end.painel-notificacoes-animado { transform: translateX(115%) !important; }
      .offcanvas-end.painel-notificacoes-animado.showing { animation: painelNotificacoesEntrada 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards !important; }
      .offcanvas-end.painel-notificacoes-animado.show:not(.hiding) { transform: translateX(0) !important; }
      .offcanvas-end.painel-notificacoes-animado.hiding { animation: painelNotificacoesSaida 0.32s ease forwards !important; }
      .painel-notificacoes-header { background-color: #1f1f1f; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
      .painel-notificacoes-body { background-color: #151515; }
      .painel-notificacoes-footer { background-color: #1f1f1f; border-top: 1px solid rgba(255,255,255,0.05) !important; }
      .item-notificacao { background-color: #1f1f1f !important; border: 1px solid rgba(255,255,255,0.05); transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
      .item-notificacao:hover { border-color: rgba(8, 192, 104, 0.3) !important; transform: translateY(-2px); }
      .offcanvas-backdrop.show { opacity: 0.5; }

      /* SKELETON LOADING PARA MENU LATERAL (DARK) */
      .skeleton-dark { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite linear; border-radius: 6px; color: transparent !important; box-shadow: none !important; border-color: transparent !important; }
      .skeleton-dark * { visibility: hidden !important; }
      .skeleton-view { background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite linear; border-radius: 6px; color: transparent !important; }
      .skeleton-view * { visibility: hidden !important; }
      .skeleton-text { height: 14px; border-radius: 4px; }
      @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      @keyframes painelNotificacoesEntrada { 0% { transform: translateX(115%); opacity: 0.85; } 70% { transform: translateX(-10px); opacity: 1; } 100% { transform: translateX(0); opacity: 1; } }
      @keyframes painelNotificacoesSaida { 0% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(115%); opacity: 0.85; } }
      @media (prefers-reduced-motion: reduce) { .offcanvas-end.painel-notificacoes-animado, .offcanvas-end.painel-notificacoes-animado.showing, .offcanvas-end.painel-notificacoes-animado.hiding { animation: none !important; transition: none !important; } }
    </style>

    ${toggleBtnHtml}

    <div class="d-flex flex-column h-100 pt-0 w-100">
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