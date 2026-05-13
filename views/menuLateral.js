// views/menuLateral.js
function menuLateral(usuario, rotaAtiva = "") {
  const tipo = usuario && usuario.tipo_usuario ? usuario.tipo_usuario : "admin";

  const renderLink = (href, icone, texto) => {
    const activeClass = rotaAtiva === href ? "active" : "";
    return `<a href="${href}" class="${activeClass}"><i class="${icone}" style="width: 20px; text-align: center;"></i> ${texto}</a>`;
  };

  const renderCollapse = (id, icone, titulo, linksArray) => {
    const isActive = linksArray.some(link => rotaAtiva === link.href);
    const showClass = isActive ? "show" : "";
    const expanded = isActive ? "true" : "false";

    let linksHtml = linksArray.map(l => {
      const activeClass = rotaAtiva === l.href ? "active" : "";
      return `
        <a href="${l.href}" class="${activeClass} py-2 mb-1" style="font-size: 0.85rem;">
          <i class="${l.icone} me-2 text-white-50" style="width: 16px; text-align: center;"></i> ${l.texto}
        </a>`;
    }).join('');

    return `
      <div class="nav-accordion">
        <a data-bs-toggle="collapse" href="#${id}" role="button" aria-expanded="${expanded}" aria-controls="${id}" class="d-flex justify-content-between align-items-center text-nowrap">
          <span><i class="${icone} me-2" style="width: 20px; text-align: center;"></i> ${titulo}</span>
          <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem; opacity: 0.7;"></i>
        </a>
        <div class="collapse ${showClass}" id="${id}">
          <div class="border-start border-light border-opacity-25 ms-3 ps-2 mt-1 mb-2">
            ${linksHtml}
          </div>
        </div>
      </div>
    `;
  };

  // ==========================================
  // DEFINIÇÕES DOS LINKS POR CATEGORIA (REORGANIZADO)
  // ==========================================
  
  // 1. Logística (Foco em Gestão e Produção)
  const logLinks = [
    { href: "/producao", icone: "fas fa-industry", texto: "Ordens" },
    { href: "/veiculos", icone: "fas fa-car", texto: "Veículos" }
  ];

  // 2. Motorista (Operacional de Campo)
  const motLinks = [
    { href: "/checklist-motoristas", icone: "fas fa-clipboard-check", texto: "Checklist" },
    { href: "/entregas", icone: "fas fa-truck", texto: "Rotas" }
  ];

  // 3. Financeiro
  const finLinks = [
    { href: "/producao", icone: "fas fa-industry", texto: "Ordens" },
    { href: "/tabela-precos", icone: "fas fa-tags", texto: "Tabela de Preços" },
    { href: "/chapas", icone: "fas fa-layer-group", texto: "Chapas" },
    { href: "/entradas-saidas", icone: "fa-solid fa-money-bill-transfer", texto: "Entradas / Saídas" }
  ];

  // 4. Design
  const desLinks = [
    { href: "/propostas", icone: "fa-solid fa-file-signature", texto: "Propostas" },
    { href: "/admin/gabaritos", icone: "fa-solid fa-folder-open", texto: "Gabaritos" }
  ];

  const footerHTML = `
    <div class="mt-auto pt-3 pb-0 text-center w-100" style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">
      <hr class="border-light border-opacity-25 mb-2 mt-2">
      <div class="d-flex align-items-center justify-content-center gap-2 mb-1">
        <span>Desenvolvido por <strong class="text-white">71dev</strong></span>
        <div class="d-flex align-items-center gap-2">
          <a href="https://www.instagram.com/71dev_/" target="_blank" class="text-decoration-none" style="color: rgba(255,255,255,0.6);"><i class="fa-brands fa-instagram"></i></a>
          <a href="https://wa.me/557183174920" target="_blank" class="text-decoration-none" style="color: rgba(255,255,255,0.6);"><i class="fa-brands fa-whatsapp"></i></a>
        </div>
      </div>
    </div>
  `;

  // ==========================================
  // LÓGICA DE RENDERIZAÇÃO POR PERFIL
  // ==========================================
  let menuLinks = renderLink("/home", "fas fa-home me-2", "Home");

  if (tipo === "motorista") {
    // Perfil Motorista vê apenas a categoria Motorista
    menuLinks += renderCollapse("collMot", "fas fa-steering-wheel", "Motorista", motLinks);
  } 
  else if (tipo === "logistica") {
    // Perfil Logística vê apenas a categoria Logística
    menuLinks += renderCollapse("collLog", "fas fa-boxes-packing", "Logística", logLinks);
  }
  else if (tipo === "design") {
    // Perfil Design vê apenas a categoria Design
    menuLinks += renderCollapse("collDes", "fa-solid fa-palette", "Design", desLinks);
  }
  else if (tipo === "financeiro") {
    // Perfil Financeiro vê apenas a categoria Financeiro
    menuLinks += renderCollapse("collFin", "fa-solid fa-wallet", "Financeiro", finLinks);
  }
  else {
    // ADMIN: Acesso Total a todas as categorias reorganizadas
    menuLinks += renderCollapse("collLog", "fas fa-industry", "Logística", logLinks);
    menuLinks += renderCollapse("collMot", "fas fa-id-card", "Motorista", motLinks);  
    menuLinks += renderCollapse("collFin", "fa-solid fa-wallet", "Financeiro", finLinks);
    menuLinks += renderCollapse("collDes", "fa-solid fa-palette", "Design", desLinks);
    menuLinks += renderLink("/cadastro", "fas fa-user-plus me-2", "Usuários");
  }

  return `<div class="d-flex flex-column h-100"><div class="flex-grow-1">${menuLinks}</div>${footerHTML}</div>`;
}

module.exports = menuLateral;