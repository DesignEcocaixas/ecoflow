// views/menuLateral.js
function menuLateral(usuario, rotaAtiva = "") {
  // Define o tipo de usuário (com fallback para admin por segurança)
  const tipo = usuario && usuario.tipo_usuario ? usuario.tipo_usuario : "admin";

  // Helper simples para gerar o link superior padrão (Home, Cadastro, etc)
  const renderLink = (href, icone, texto) => {
    const activeClass = rotaAtiva === href ? "active" : "";
    return `<a href="${href}" class="${activeClass}"><i class="${icone}" style="width: 20px; text-align: center;"></i> ${texto}</a>`;
  };

  // Helper para gerar um grupo em Sanfona (Accordion / Collapse)
  const renderCollapse = (id, icone, titulo, linksArray) => {
    // Verifica se alguma das rotas internas está ativa para manter a sanfona aberta
    const isActive = linksArray.some(link => rotaAtiva === link.href);
    const showClass = isActive ? "show" : "";
    const expanded = isActive ? "true" : "false";

    // Gera os links internos
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
  // DEFINIÇÃO DOS LINKS POR CATEGORIA
  // ==========================================
  const logisticaLinks = {
    producao: { href: "/producao", icone: "fas fa-industry", texto: "Ordens" },
    veiculos: { href: "/veiculos", icone: "fas fa-car", texto: "Veículos" },
    checklist: { href: "/checklist-motoristas", icone: "fas fa-clipboard-check", texto: "Checklist" },
    rotas: { href: "/entregas", icone: "fas fa-truck", texto: "Rotas" }
  };

  const financeiroLinks = {
    tabela: { href: "/tabela-precos", icone: "fas fa-tags", texto: "Tabela de Preços" },
    chapas: { href: "/chapas", icone: "fas fa-layer-group", texto: "Chapas" },
    entradasSaidas: { href: "/entradas-saidas", icone: "fa-solid fa-money-bill-transfer", texto: "Entradas / Saídas" }
  };

  // ==========================================
  // RODAPÉ DO MENU (71dev)
  // ==========================================
  const footerHTML = `
    <div class="mt-auto pt-4 pb-2 text-center" style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">
      <hr class="border-light border-opacity-25 mb-3">
      <div class="mb-2">Desenvolvido por <strong class="text-white">71dev</strong></div>
      <div class="d-flex justify-content-center gap-3">
        <a href="https://www.instagram.com/71dev_/" target="_blank" class="text-decoration-none" style="color: rgba(255,255,255,0.6); font-size: 1.2rem; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.6)'" title="Instagram">
          <i class="fa-brands fa-instagram"></i>
        </a>
        <a href="https://wa.me/557183174920" target="_blank" class="text-decoration-none" style="color: rgba(255,255,255,0.6); font-size: 1.2rem; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.6)'" title="WhatsApp (+55 71 8317-4920)">
          <i class="fa-brands fa-whatsapp"></i>
        </a>
      </div>
    </div>
  `;

  // ==========================================
  // RENDERIZAÇÃO DO MENU POR TIPO DE USUÁRIO
  // ==========================================
  let menuLinks = '';

  // --- MENU: MOTORISTA ---
  if (tipo === "motorista") {
    menuLinks = `
      ${renderLink("/home", "fas fa-home me-2", "Home")}
      ${renderCollapse("collapseLogistica", "fas fa-boxes-packing", "Logística", [
        logisticaLinks.checklist,
        logisticaLinks.rotas
      ])}
    `;
  }
  // --- MENU: FINANCEIRO ---
  else if (tipo === "financeiro") {
    menuLinks = `
      ${renderLink("/home", "fas fa-home me-2", "Home")}
      
      ${renderCollapse("collapseLogistica", "fas fa-boxes-packing", "Logística", [
        logisticaLinks.producao, 
        logisticaLinks.checklist
      ])}
      
      ${renderCollapse("collapseFinanceiro", "fa-solid fa-wallet", "Financeiro", [
        financeiroLinks.tabela,
        financeiroLinks.chapas,
        financeiroLinks.entradasSaidas
      ])}
    `;
  }
  // --- MENU: ADMIN (Padrão Completo) ---
  else {
    menuLinks = `
      ${renderLink("/home", "fas fa-home me-2", "Home")}
      
      ${renderCollapse("collapseLogistica", "fas fa-boxes-packing", "Logística", [
        logisticaLinks.producao, 
        logisticaLinks.veiculos,
        logisticaLinks.checklist,
        logisticaLinks.rotas
      ])}
      
      ${renderCollapse("collapseFinanceiro", "fa-solid fa-wallet", "Financeiro", [
        financeiroLinks.tabela,
        financeiroLinks.chapas,
        financeiroLinks.entradasSaidas
      ])}
      
      ${renderLink("/cadastro", "fas fa-user-plus me-2", "Cadastro de Usuários")}
    `;
  }

  // Retorna a estrutura flexível garantindo que o footer vá para a parte inferior
  return `
    <div class="d-flex flex-column h-100">
      <div>
        ${menuLinks}
      </div>
      ${footerHTML}
    </div>
  `;
}

module.exports = menuLateral;