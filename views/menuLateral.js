// views/menuLateral.js
function menuLateral(usuario, rotaAtiva = "") {
  // Define o tipo de usuário (com fallback para admin por segurança)
  const tipo = usuario && usuario.tipo_usuario ? usuario.tipo_usuario : "admin";

  // Helper simples para gerar o link com a classe 'active' dinâmica
  const renderLink = (href, icone, texto) => {
    const activeClass = rotaAtiva === href ? "active" : "";
    return `<a href="${href}" class="${activeClass}"><i class="${icone}"></i> ${texto}</a>`;
  };

  // --- MENU: MOTORISTA ---
  if (tipo === "motorista") {
    return `
      ${renderLink("/home", "fas fa-home me-2", "Home")}
      ${renderLink("/checklist-motoristas", "fas fa-clipboard-check me-2", "Checklist")}
      ${renderLink("/entregas", "fas fa-truck me-2", "Rotas")}
    `;
  }

  // --- MENU: FINANCEIRO ---
  if (tipo === "financeiro") {
    return `
      ${renderLink("/home", "fas fa-home me-2", "Home")}
      ${renderLink("/tabela-precos", "fas fa-tags me-2", "Tabela de Preços")}
      ${renderLink("/chapas", "fas fa-layer-group me-2", "Chapas")}
      ${renderLink("/checklist-motoristas", "fas fa-clipboard-check me-2", "Checklist")}
    `;
  }

  // --- MENU: ADMIN (Padrão) ---
  return `
    ${renderLink("/home", "fas fa-home me-2", "Home")}
    ${renderLink("/veiculos", "fas fa-car me-2", "Veículos")}
    ${renderLink("/checklist-motoristas", "fas fa-clipboard-check me-2", "Checklist")}
    ${renderLink("/entregas", "fas fa-truck me-2", "Rotas")}
    ${renderLink("/tabela-precos", "fas fa-tags me-2", "Tabela de Preços")}
    ${renderLink("/chapas", "fas fa-layer-group me-2", "Chapas")}
    ${renderLink("/cadastro", "fas fa-user-plus me-2", "Cadastro")}
  `;
}

module.exports = menuLateral;
