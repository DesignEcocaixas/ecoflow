// views/menuLateral.js
function menuLateral(usuario, rotaAtiva = "") {
  const tipo = usuario && usuario.tipo_usuario ? usuario.tipo_usuario : "admin";

  // Variável inteligente para garantir que apenas UMA sanfona abra ao mesmo tempo
  let menuJaExpandido = false;

  const logLinks = [
    { href: "/producao", icone: "fas fa-industry", texto: "Produção" },
    { href: "/veiculos", icone: "fas fa-car", texto: "Frota de Veículos" },
    { href: "/checklist-motoristas", icone: "fas fa-clipboard-check", texto: "Checklist" },
    { href: "/entregas", icone: "fas fa-truck", texto: "Rotas de Entrega" },
    { href: "/caderno-entregas", icone: "fas fa-book-open-reader", texto: "Caderno de Entregas" }
  ];

  const motLinks = [
    { href: "/checklist-motoristas", icone: "fas fa-clipboard-check", texto: "Checklist Diário" },
    { href: "/entregas", icone: "fas fa-truck", texto: "Rotas de Entrega" },
    { href: "/caderno-entregas", icone: "fas fa-book-open-reader", texto: "Caderno de Entregas" }
  ];

  const finLinks = [
    { href: "/tabela-precos", icone: "fas fa-tags", texto: "Tabela de Preços" },
    { href: "/chapas", icone: "fas fa-layer-group", texto: "Estoque de Chapas" },
    { href: "/entradas-saidas", icone: "fa-solid fa-money-bill-transfer", texto: "Entradas / Saídas" }
  ];

  const desLinks = [
    { href: "/propostas", icone: "fa-solid fa-file-signature", texto: "Propostas e Clichês" },
    { href: "/admin/gabaritos", icone: "fa-solid fa-folder-open", texto: "Biblioteca de Gabaritos" }
  ];

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
    
    // Lógica: Se a rota pertence a este menu E nenhum outro abriu ainda -> ABRE!
    const deveAbrir = isActive && !menuJaExpandido;
    if (deveAbrir) {
        menuJaExpandido = true;
    }

    const showClass = deveAbrir ? "show" : "";
    const expanded = deveAbrir ? "true" : "false";

    let linksHtml = linksArray.map(l => {
      const activeClass = rotaAtiva === l.href ? "active" : "";
      return `
        <a href="${l.href}" class="${activeClass} py-2 mb-1 menu-link-item d-flex align-items-center text-white-50 text-decoration-none" style="font-size: 0.85rem;">
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
        <div class="collapse ${showClass}" id="${id}">
          <div class="border-start border-light border-opacity-25 ms-4 ps-2 mt-1 mb-2 sidebar-submenu">
            ${linksHtml}
          </div>
        </div>
      </div>
    `;
  };

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
    menuLinks += renderLink("/cadastro", "fas fa-user-plus", "Gestão de Usuários");
  }

  return `
    <style>
      .sidebar { transition: width 0.3s ease; overflow-x: hidden; }
      
      body.sidebar-collapsed .sidebar { width: 70px !important; }
      body.sidebar-collapsed .sidebar-text { display: none !important; }
      body.sidebar-collapsed .nav-accordion-btn, 
      body.sidebar-collapsed .sidebar a { justify-content: center !important; }
      body.sidebar-collapsed .sidebar .chevron-icon { display: none !important; }
      body.sidebar-collapsed .sidebar .sidebar-submenu { border: none !important; margin: 0 !important; }
      body.sidebar-collapsed .sidebar .collapse { display: none !important; }
      
      .chevron-icon { transition: transform 0.35s ease; }
      .nav-accordion-btn[aria-expanded="true"] .chevron-icon { transform: rotate(-180deg); }
      .transition-btn:hover { background: rgba(255,255,255,0.1); }
    </style>

    <div class="d-flex flex-column h-100">
      <button id="toggleSidebarBtn" class="btn text-white w-100 transition-btn border-0 py-2 mb-2">
        <i class="fa-solid fa-bars"></i>
      </button>

      <div class="flex-grow-1">
        ${menuLinks}
      </div>
    </div>

    <script>
      (function() {
        if (localStorage.getItem('sidebarState') === 'collapsed') {
          document.body.classList.add('sidebar-collapsed');
        }

        const btn = document.getElementById('toggleSidebarBtn');
        if (btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.toggle('sidebar-collapsed');
            const isCollapsed = document.body.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebarState', isCollapsed ? 'collapsed' : 'expanded');
          });
        }
      })();
    </script>
  `;
}

module.exports = menuLateral;