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
    { href: "/entregas", icone: "fas fa-truck", texto: "Rotas" }
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
    }).join('');

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
            <div class="fw-bold text-truncate text-white" style="font-size: 0.85rem; max-width: 125px;">${usuario && usuario.nome ? usuario.nome : 'Usuário'}</div>
            <span class="badge bg-white bg-opacity-25 text-white" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 5px;">${tipo}</span>
          </div>
        </div>
        <a href="/notificacoes" class="text-white-50 transition-btn p-1 rounded sidebar-text d-flex align-items-center justify-content-center" title="Notificações" style="text-decoration: none;">
          <i class="fa-solid fa-bell" style="font-size: 0.9rem;"></i>
        </a>
      </div>
    </div>
  `;

  // --- RETORNO COM CSS ---
  return `
    <style>
      .sidebar { width: 240px !important; overflow-x: hidden; }
      .transition-btn { transition: all 0.2s ease; }
      .transition-btn:hover { background: rgba(255,255,255,0.1); color: #fff !important; }
      .logout-btn-sidebar { transition: background-color 0.2s; }
      .logout-btn-sidebar:hover { background: rgba(220, 53, 69, 0.1); }
      
      .chevron-icon { transition: transform 0.35s ease; }
      .nav-accordion-btn[aria-expanded="true"] .chevron-icon { transform: rotate(-180deg); }
      
      .sidebar-scroll-area { overflow-y: auto; overflow-x: hidden; }
      .sidebar-scroll-area::-webkit-scrollbar { width: 5px; }
      .sidebar-scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
    </style>

    <div class="d-flex flex-column h-100 pt-2">
      <div class="flex-grow-1 sidebar-scroll-area" id="sidebarMenuContainer">
        ${userProfileHtml}
        ${menuLinks}
      </div>
    </div>
  `;
}

module.exports = menuLateral;