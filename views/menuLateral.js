// views/menuLateral.js
let versaoSistemaCache = "1.0.0";
try {
  const fs = require('fs');
  const path = require('path');
  const pPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(pPath)) {
    versaoSistemaCache = require(pPath).version;
  }
} catch (e) {
  console.log("Aviso: Não foi possível ler a versão do package.json para o menu.");
}

function menuLateral(usuario, rotaAtiva = "") {
  const tipo = usuario && usuario.tipo_usuario ? usuario.tipo_usuario : "admin";
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin", email: "Não informado" };

  // --- MAPA GERAL DOS MÓDULOS DISPONÍVEIS ---
  const allModulesMap = {
      'producao': { href: "/producao", icone: "fas fa-industry", texto: "Produção" },
      'veiculos': { href: "/veiculos", icone: "fas fa-car", texto: "Veículos" },
      'checklist': { href: "/checklist-motoristas", icone: "fas fa-clipboard-check", texto: "Checklist" },
      'rotas': { href: "/entregas", icone: "fas fa-truck", texto: "Rotas" },
      'caderno': { href: "/caderno-entregas", icone: "fas fa-book-open-reader", texto: "Caderno" },
      'envios': { href: "/envios-whatsapp", icone: "fab fa-whatsapp", texto: "Envios" },
      'workspaces': { href: "/espacos-trabalho", icone: "fa-solid fa-cubes", texto: "Workspaces" },
      'clientes': { href: "/clientes", icone: "fas fa-users", texto: "Clientes" },
      'downloads': { href: "/downloads", icone: "fa-solid fa-cloud-arrow-down", texto: "Downloads" },
      'precos': { href: "/tabela-precos", icone: "fas fa-tags", texto: "Preços" },
      'chapas': { href: "/chapas", icone: "fas fa-layer-group", texto: "Chapas" },
      'entradas_saidas': { href: "/entradas-saidas", icone: "fa-solid fa-money-bill-transfer", texto: "Entradas / Saídas" },
      'diaristas': { href: "/diaristas", icone: "fas fa-users", texto: "Diaristas" },
      'pagamentos': { href: "/pagamentos", icone: "fas fa-money-bill-wave", texto: "Pagamentos" },
      'propostas': { href: "/propostas", icone: "fa-solid fa-file-signature", texto: "Propostas" },
      'gabaritos': { href: "/admin/gabaritos", icone: "fa-solid fa-folder-open", texto: "Gabaritos" },
      'qr_codes': { href: "/qr-generator", icone: "fa-solid fa-qrcode", texto: "QR Codes" }
  };

  // --- DEFINIÇÃO DOS LINKS PADRÕES POR PERFIL ---
  const logLinks = [ allModulesMap['producao'], allModulesMap['veiculos'], allModulesMap['checklist'], allModulesMap['rotas'], allModulesMap['caderno'], allModulesMap['envios'], allModulesMap['workspaces'], allModulesMap['clientes'], allModulesMap['downloads'] ];
  const motLinks = [ allModulesMap['checklist'], allModulesMap['rotas'] ];
  const finLinks = [ allModulesMap['precos'], allModulesMap['chapas'], allModulesMap['entradas_saidas'], allModulesMap['producao'], allModulesMap['caderno'], allModulesMap['envios'], allModulesMap['diaristas'], allModulesMap['pagamentos'], allModulesMap['workspaces'], allModulesMap['clientes'], allModulesMap['downloads'] ];
  const desLinks = [ allModulesMap['propostas'], allModulesMap['gabaritos'], allModulesMap['workspaces'], allModulesMap['qr_codes'], allModulesMap['downloads'] ];
  const prodLinks = [ allModulesMap['chapas'], allModulesMap['workspaces'] ];
  const comLinks = [ allModulesMap['precos'], allModulesMap['chapas'], allModulesMap['workspaces'] ];

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

  const searchBarHtml = `
    <div class="mb-2 mt-2 sidebar-search-container position-relative" style="z-index: 1040;">
      <div class="position-relative w-100">
        <i class="fa-solid fa-search position-absolute text-white-50" style="top: 50%; transform: translateY(-50%); left: 10px; font-size: 0.8rem;"></i>
        <input type="text" id="menuSearchInput" oninput="buscarLinksMenu(this.value)" onfocus="buscarLinksMenu(this.value)" onblur="setTimeout(() => fecharSugestoes(), 200)" class="form-control form-control-sm bg-custom-darker border-custom text-white shadow-none w-100" placeholder="Pesquisar..." style="padding-left: 30px; border-radius: 6px;">
      </div>
      <div id="searchSuggestions" class="dropdown-menu dropdown-menu-dark w-100 shadow-lg border-custom py-1 position-absolute" style="top: 100%; left: 0; display: none; max-height: 250px; overflow-y: auto; border-radius: 6px; margin-top: 4px;">
      </div>
    </div>
  `;

  let menuLinks = searchBarHtml;
  menuLinks += renderLink("/home", "fas fa-home", "Início");

  // =======================================================================
  // LÓGICA DE MONTAGEM DINÂMICA DO MENU (MESCLANDO CARGO + MÓDULOS)
  // =======================================================================
  if (tipo === "admin") {
      menuLinks += renderCollapse("collLog", "fas fa-industry", "Logística", logLinks);
      menuLinks += renderCollapse("collMot", "fas fa-id-card", "Motorista", motLinks);
      menuLinks += renderCollapse("collFin", "fa-solid fa-wallet", "Financeiro", finLinks);
      menuLinks += renderCollapse("collDes", "fa-solid fa-palette", "Design", desLinks);
      menuLinks += renderLink("/cadastro", "fas fa-user-plus", "Usuários");
      menuLinks += renderLink("/dev/testes", "fa-solid fa-vial-virus", "Dev Lab");
      
      availableLinks.push(...logLinks, ...motLinks, ...finLinks, ...desLinks);
      availableLinks.push({ href: "/cadastro", icone: "fas fa-user-plus", texto: "Usuários" });
      availableLinks.push({ href: "/dev/testes", icone: "fa-solid fa-vial-virus", texto: "Dev Lab" });
  } else {
      let userLinks = [];
      
      // 1. Carrega os links do perfil nativo
      if (tipo === "motorista") userLinks.push(...motLinks);
      else if (tipo === "logistica") userLinks.push(...logLinks);
      else if (tipo === "design") userLinks.push(...desLinks);
      else if (tipo === "financeiro") userLinks.push(...finLinks);
      else if (tipo === "producao") userLinks.push(...prodLinks);
      else if (tipo === "comercial") userLinks.push(...comLinks);

      // 2. Adiciona os links dos módulos extras habilitados via banco de dados
      if (user.modulos) {
          const modulosHabilitados = user.modulos.split(',').map(s => s.trim());
          modulosHabilitados.forEach(mod => {
              if (allModulesMap[mod]) {
                  userLinks.push(allModulesMap[mod]);
              }
          });
      }

      // 3. Remove links duplicados (caso o switch e o cargo liberem a mesma tela)
      const uniqueUserLinks = Array.from(new Map(userLinks.map(item => [item.href, item])).values());
      const tituloMenu = tipo.charAt(0).toUpperCase() + tipo.slice(1);
      
      if (uniqueUserLinks.length > 0) {
          menuLinks += renderCollapse("collUser", "fas fa-layer-group", tituloMenu, uniqueUserLinks);
          availableLinks.push(...uniqueUserLinks);
      }
  }

  const uniqueLinks = Array.from(new Map(availableLinks.map(item => [item.href, item])).values());

  const toggleBtnHtml = `
    <button class="d-none d-md-flex align-items-center justify-content-center toggle-sidebar-btn" onclick="toggleSidebarMenu()" title="Recolher Menu">
      <i class="fa-solid fa-chevron-left fs-6 toggle-icon" id="toggleSidebarIcon"></i>
    </button>
  `;

  let iniciais = "US";
  if (user.nome) {
      const partes = user.nome.trim().split(" ");
      if (partes.length > 1) {
          iniciais = (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
      } else {
          iniciais = partes[0].substring(0, 2).toUpperCase();
      }
  }

  const fotoUrl = user.foto ? `/uploads/${user.foto}` : null;
  
  const renderFoto = fotoUrl
    ? `<a href="#" data-bs-toggle="modal" data-bs-target="#modalFotoPerfil" title="Visualizar Foto" class="d-block shadow-sm img-profile-clickable rounded-circle" style="width: 100%; height: 100%; border: 2px solid rgba(8,192,104,0.3); overflow: hidden; margin: 0; padding: 0;">
         <img src="${fotoUrl}" alt="Foto de perfil" class="rounded-circle" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 50%;">
       </a>`
    : `<div class="d-flex align-items-center justify-content-center shadow-sm rounded-circle img-profile-clickable" style="width: 100%; height: 100%; background-color: rgba(8,192,104,0.1); border: 2px solid rgba(8,192,104,0.3); margin: 0; color: #08c068; font-weight: bold; font-size: 1.2rem; text-transform: uppercase;">
         ${iniciais}
       </div>`;

  const btnConfigAdmin = tipo === "admin"
    ? `<a href="/configuracoes" class="ms-1 mb-0 transition-btn d-flex align-items-center justify-content-center profile-config-btn" title="Configurações do Sistema" style="text-decoration: none; background: transparent; padding: 4px; line-height: 1; color: rgba(255,255,255,0.7);">
         <i class="fa-solid fa-gear" style="font-size: 0.85rem;"></i>
       </a>`
    : `<button type="button" class="ms-1 mb-0 transition-btn d-flex align-items-center justify-content-center profile-config-btn border-0" data-bs-toggle="modal" data-bs-target="#modalMeuPerfil" title="Meu Perfil" style="background: transparent; padding: 4px; line-height: 1; color: rgba(255,255,255,0.7);">
         <i class="fa-solid fa-gear" style="font-size: 0.85rem;"></i>
       </button>`;

  const btnNotificacoes = `
    <div class="dropdown d-inline-flex">
      <button type="button" id="btnAbrirNotificacoes" data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside" data-bs-popper-config='{"strategy":"fixed", "placement":"bottom-start"}' class="mb-0 transition-btn d-flex align-items-center justify-content-center border-0 bg-transparent position-relative profile-notif-btn" title="Notificações" style="padding: 4px; line-height: 1; color: rgba(255,255,255,0.7);">
         <i class="fa-solid fa-bell" style="font-size: 0.85rem;"></i>
         <span id="contadorNotificacoes" class="position-absolute top-0 start-100 translate-middle badge rounded-pill shadow-sm" style="font-size: 0.45rem; min-width: 14px; height: 14px; display: none; align-items: center; justify-content: center; padding: 0 3px; border: 2px solid #1f1f1f; background-color: #08c068; color: #fff;">0</span>
      </button>
      <div class="dropdown-menu dropdown-menu-dark shadow-lg border-custom p-0 dropdown-menu-notificacoes" style="background-color: #1f1f1f; width: 320px; z-index: 9999; border-radius: 8px;">
        <div class="p-3 border-bottom border-custom d-flex justify-content-between align-items-center bg-custom-darker" style="border-top-left-radius: 8px; border-top-right-radius: 8px;">
          <h6 class="mb-0 fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-regular fa-bell me-2 text-accent"></i> Notificações</h6>
        </div>
        <div id="listaNotificacoes" class="p-2" style="max-height: 350px; overflow-y: auto;">
          <!-- Lista injetada via JS -->
        </div>
        <div class="p-2 border-top border-custom bg-custom-darker" style="border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
          <button type="button" id="btnLimparNotificacoes" class="btn btn-outline-danger w-100 btn-sm fw-medium" style="border-radius: 6px; font-size: 0.75rem;">
            <i class="fa-regular fa-trash-can me-1"></i> Limpar todas
          </button>
        </div>
      </div>
    </div>
  `;

  const btnSair = `
    <a href="/logout" class="ms-1 mb-0 transition-btn d-flex align-items-center justify-content-center profile-logout-btn" title="Sair do Sistema" style="text-decoration: none; background: transparent; padding: 4px; line-height: 1; color: rgba(220, 53, 69, 0.75);">
      <i class="fas fa-sign-out-alt" style="font-size: 0.85rem;"></i>
    </a>
  `;

  const userProfileHtml = `
    <div class="user-profile-container px-2 pb-3 pt-2 mt-2 mb-2 border-bottom border-light border-opacity-10 position-relative" style="z-index: 1080;">
      <div class="d-flex flex-row align-items-center justify-content-start gap-2 profile-flex-container">
        <div class="profile-avatar-box position-relative d-flex justify-content-center align-items-center" style="width: 48px; height: 48px; flex-shrink: 0; transition: all 0.3s ease;">
          ${renderFoto}
        </div>

        <div class="profile-info-box d-flex flex-column text-start justify-content-center flex-grow-1" style="min-width: 0;">
          <div class="fw-bold text-truncate mb-1 profile-name-text" style="font-size: 0.85rem; color: #ffffff; line-height: 1.1;" title="${user.nome || "Usuário"}">
            Olá, ${user.nome || "Usuário"}
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

  const modalMeuPerfilHtml = tipo !== "admin" ? `
    <div class="modal fade" id="modalMeuPerfil" tabindex="-1" aria-hidden="true" style="z-index: 2060;">
      <div class="modal-dialog modal-dialog-centered">
        <form method="POST" action="/usuarios/meu-perfil" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="window.submeterMeuPerfilAjax(event, this)">
          <div class="modal-header bg-custom-darker border-0 text-white pb-2">
            <h6 class="modal-title fw-bold" style="font-size: 0.9rem;"><i class="fa-solid fa-user-pen text-accent me-2"></i> Meu Perfil</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="text-center mb-4">
               <div class="position-relative mx-auto" onclick="document.getElementById('uploadFotoMeuPerfil').click()" title="Clique para alterar a foto" style="width: 100px; height: 100px; border-radius: 50%; overflow: hidden; border: 3px solid rgba(8,192,104,0.3); cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); background-color: rgba(8,192,104,0.1); display: flex; align-items: center; justify-content: center;">
                   ${fotoUrl 
                      ? `<img id="previewFotoMeuPerfil" src="${fotoUrl}" style="width: 100%; height: 100%; object-fit: cover; transition: all 0.3s ease;" onmouseover="this.style.filter='brightness(0.7)'" onmouseout="this.style.filter='brightness(1)'">`
                      : `<div id="previewFotoMeuPerfil" style="width: 100%; height: 100%; object-fit: cover; font-size: 2.5rem; font-weight: bold; color: #08c068; display: flex; align-items: center; justify-content: center;">${iniciais}</div>`
                   }
                   <div class="position-absolute w-100 text-center" style="bottom: 10px; left: 0; pointer-events: none;">
                       <i class="fa-solid fa-camera text-white opacity-75"></i>
                   </div>
               </div>
               <input type="file" name="foto" id="uploadFotoMeuPerfil" class="d-none" accept="image/*" onchange="window.previewFotoPerfilNativo(this)">
               <div class="mt-2 text-muted fw-medium" style="font-size: 0.75rem;">Alterar foto</div>
            </div>

            <div class="row g-3">
                <div class="col-12">
                  <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Nome de Exibição</label>
                  <input type="text" name="nome" class="form-control form-control-sm shadow-sm" style="background-color: #222; color: #fff; border: 1px solid rgba(255,255,255,0.1);" value="${user.nome || ''}" required>
                </div>
                
                <div class="col-12 col-md-6">
                  <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Nova Senha</label>
                  <input type="password" name="senha" class="form-control form-control-sm shadow-sm" style="background-color: #222; color: #fff; border: 1px solid rgba(255,255,255,0.1);" placeholder="Em branco para manter" autocomplete="new-password">
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Confirmar Nova Senha</label>
                  <input type="password" name="confirma_senha" class="form-control form-control-sm shadow-sm" style="background-color: #222; color: #fff; border: 1px solid rgba(255,255,255,0.1);" placeholder="Repita a senha" autocomplete="new-password">
                </div>

                <div class="col-12 mt-4">
                  <h6 class="fw-bold text-muted mb-2 border-bottom pb-1" style="font-size: 0.75rem; border-color: rgba(255,255,255,0.05) !important;">Acesso e Hierarquia (Somente Leitura)</h6>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.7rem;">E-mail de Login</label>
                  <input type="text" class="form-control form-control-sm shadow-sm text-white-50" style="background-color: #1a1a1a; border: 1px solid rgba(255,255,255,0.02);" value="${user.email || 'Não informado'}" disabled>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.7rem;">Perfil no Sistema</label>
                  <input type="text" class="form-control form-control-sm shadow-sm text-white-50" style="background-color: #1a1a1a; border: 1px solid rgba(255,255,255,0.02);" value="${(user.tipo_usuario || '').replace('_', ' ').toUpperCase()}" disabled>
                </div>
            </div>
          </div>
          <div class="modal-footer border-0 bg-custom-darker">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white px-4" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success fw-bold text-dark px-4 shadow-sm"><i class="fa-solid fa-check me-1"></i> Atualizar Perfil</button>
          </div>
        </form>
      </div>
    </div>
  ` : "";

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

  return `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <style>
      html, body, .content, .form-control, .form-select, .btn, .modal-content, .accordion-button, .card, .table, th, td, span, label {
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
      }

      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
      html, body, .content { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

      .sidebar {
        width: 250px !important;
        position: relative;
        overflow-x: hidden !important; 
        display: flex;
        flex-direction: column;
        background-color: #1f1f1f !important;
        border-right: 1px solid rgba(255,255,255,0.05);
        transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        z-index: 1030;
      }

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
        transition: transform 0.3s ease;
      }
      .toggle-sidebar-btn:hover { color: #08c068; }

      .sidebar.collapsed { width: 78px !important; }
      .sidebar.collapsed .sidebar-text,
      .sidebar.collapsed .chevron-icon,
      .sidebar.collapsed .profile-info-box,
      .sidebar.collapsed .sidebar-search-container,
      .sidebar.collapsed .footer-sidebar span.sidebar-text,
      .sidebar.collapsed .footer-sidebar .footer-hr {
        display: none !important;
      }

      .sidebar.collapsed .user-profile-container { padding: 10px 0 !important; }
      .sidebar.collapsed .profile-flex-container { justify-content: center !important; }
      .sidebar.collapsed .profile-avatar-box { width: 38px !important; height: 38px !important; margin: 0 auto !important; }
      
      .sidebar.collapsed .menu-item-main { justify-content: center !important; padding-left: 0 !important; padding-right: 0 !important; }
      .sidebar.collapsed .menu-item-main .menu-icone { margin: 0 !important; font-size: 1.2rem; }
      .sidebar.collapsed .social-icons-footer { flex-direction: column; margin-top: 10px; }

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

      .menu-item-main.show .chevron-icon { color: #08c068 !important; }
      .nav-accordion-btn[aria-expanded="true"] .chevron-icon { color: #08c068 !important; }

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

      .img-profile-clickable {
        transition: transform 0.2s ease, filter 0.2s ease, border-color 0.2s ease;
        display: flex;
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

      /* Estilização dos Itens de Notificação no Dropdown */
      .item-notificacao { background-color: transparent; border: 1px solid rgba(255,255,255,0.05); transition: background-color 0.2s; border-radius: 6px; margin-bottom: 6px; }
      .item-notificacao:hover { background-color: rgba(255,255,255,0.03); }

      .skeleton-dark { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite linear; border-radius: 6px; color: transparent !important; box-shadow: none !important; border-color: transparent !important; }
      .skeleton-dark * { visibility: hidden !important; }
      .skeleton-text { height: 14px; border-radius: 4px; }
      @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    </style>

    ${toggleBtnHtml}

    <div class="d-flex flex-column h-100 pt-0 w-100">
      <div class="flex-grow-1 sidebar-scroll-area" id="sidebarMenuContainer">
        ${userProfileHtml}
        ${menuLinks}
      </div>
      ${footerHTML}
    </div>

    ${modalFotoHtml}
    ${modalMeuPerfilHtml}

    <script>
      // =======================================================================
      // PREVIEW NATIVO DA FOTO E AJAX SUBMISSION
      // =======================================================================
      window.previewFotoPerfilNativo = function(input) {
          if(input.files && input.files[0]) {
              const r = new FileReader();
              r.onload = e => {
                  const img = document.getElementById('previewFotoMeuPerfil');
                  if(img) {
                      if(img.tagName === 'IMG') {
                          img.src = e.target.result;
                      } else {
                          img.outerHTML = '<img id="previewFotoMeuPerfil" src="' + e.target.result + '" style="width: 100%; height: 100%; object-fit: cover; transition: all 0.3s ease;">';
                      }
                  }
              };
              r.readAsDataURL(input.files[0]);
          }
      };

      window.submeterMeuPerfilAjax = async function(event, form) {
          event.preventDefault();
          if (!window.validarSenhaMeuPerfil(form)) return;

          const btnSubmit = form.querySelector('button[type="submit"]');
          const originalText = btnSubmit.innerHTML;
          btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Salvando...';
          btnSubmit.disabled = true;

          try {
              const formData = new FormData(form);
              const response = await fetch(form.action, {
                  method: form.method || 'POST',
                  body: formData,
                  headers: { 'X-Requested-With': 'XMLHttpRequest' }
              });

              if (response.ok) {
                  const result = await response.json();
                  if (result.success) {
                      const nomeElems = document.querySelectorAll('.profile-name-text');
                      nomeElems.forEach(el => {
                          el.textContent = 'Olá, ' + result.nome;
                          el.title = result.nome;
                      });

                      if (result.fotoUrl) {
                          const imgElems = document.querySelectorAll('.profile-avatar-box img, #previewFotoMeuPerfil, #modalFotoPerfil img');
                          imgElems.forEach(img => {
                              img.src = result.fotoUrl + '?t=' + new Date().getTime();
                          });
                          
                          const avatarBox = document.querySelector('.profile-avatar-box');
                          if(avatarBox) {
                              const initialsDiv = avatarBox.querySelector('div.img-profile-clickable');
                              if (initialsDiv) {
                                  initialsDiv.outerHTML = '<a href="#" data-bs-toggle="modal" data-bs-target="#modalFotoPerfil" title="Visualizar Foto" class="d-block shadow-sm img-profile-clickable rounded-circle" style="width: 100%; height: 100%; border: 2px solid rgba(8,192,104,0.3); overflow: hidden; margin: 0; padding: 0;"><img src="' + result.fotoUrl + '?t=' + new Date().getTime() + '" alt="Foto de perfil" class="rounded-circle" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 50%;"></a>';
                              }
                          }
                      }

                      const inputSenha = form.querySelector('input[name="senha"]');
                      const inputConfirma = form.querySelector('input[name="confirma_senha"]');
                      if(inputSenha) inputSenha.value = '';
                      if(inputConfirma) inputConfirma.value = '';

                      const modalEl = document.getElementById('modalMeuPerfil');
                      if (modalEl) {
                          const modal = bootstrap.Modal.getInstance(modalEl);
                          if(modal) modal.hide();
                      }

                      window.mostrarToastSidebar('sucesso', 'Concluído!', 'O seu perfil foi atualizado com sucesso.');
                  } else {
                      window.mostrarToastSidebar('erro', 'Erro', result.message || 'Falha ao atualizar.');
                  }
              } else {
                  window.mostrarToastSidebar('erro', 'Erro', 'Falha ao processar os dados.');
              }
          } catch (err) {
              console.error(err);
              window.mostrarToastSidebar('erro', 'Erro de Conexão', 'Verifique a rede e tente novamente.');
          } finally {
              btnSubmit.innerHTML = originalText;
              btnSubmit.disabled = false;
          }
      };

      window.mostrarToastSidebar = function(tipo, titulo, mensagem) {
          let toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
          
          if (!toastEl) {
              const toastContainerHtml = \`
              <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 9999;" id="globalToastContainer">
                  <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
                      <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                          <div><i class="fa-solid fa-circle-check fs-5 me-2 text-accent" id="sucessoIcon"></i><strong class="fs-6" id="sucessoTitulo"></strong></div>
                          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                      </div>
                      <div class="toast-body pt-1 pb-4 px-3 position-relative">
                          <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="sucessoSub"></p>
                      </div>
                      <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 4px; background: #08c068;"></div>
                  </div>
                  <div id="erroToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(220,53,69,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
                      <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                          <div><i class="fa-solid fa-circle-xmark fs-5 me-2 text-danger"></i><strong class="fs-6" id="erroTitulo"></strong></div>
                          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                      </div>
                      <div class="toast-body pt-1 pb-4 px-3 position-relative">
                          <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="erroSub"></p>
                      </div>
                      <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
                  </div>
              </div>\`;
              document.body.insertAdjacentHTML('beforeend', toastContainerHtml);
              toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
          }

          if (toastEl) {
              const elTitulo = document.getElementById(tipo === 'sucesso' ? 'sucessoTitulo' : 'erroTitulo');
              const elSub = document.getElementById(tipo === 'sucesso' ? 'sucessoSub' : 'erroSub');
              if(elTitulo) elTitulo.innerText = titulo;
              if(elSub) elSub.innerText = mensagem;
              
              const timerEl = document.getElementById(tipo === 'sucesso' ? 'sucessoTimer' : 'erroTimer');
              if (timerEl) {
                  timerEl.style.display = 'block';
                  timerEl.style.animation = 'none';
                  timerEl.offsetHeight; 
                  timerEl.style.animation = 'shrinkToast 5s linear forwards';
              }

              const oldInstance = bootstrap.Toast.getInstance(toastEl);
              if (oldInstance) oldInstance.dispose();
              
              const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
              toast.show();
          }
      };

      // =======================================================================
      // SCRIPTS DA BARRA DE PESQUISA E MENU
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

      window.toggleSidebarMenu = function() {
          const sidebar = document.querySelector(".sidebar");
          const icon = document.getElementById("toggleSidebarIcon");
          if (sidebar) {
              sidebar.classList.toggle("collapsed");
              const isCollapsed = sidebar.classList.contains("collapsed");
              localStorage.setItem("ecoflow_sidebar_collapsed", isCollapsed);
              
              if (icon) {
                  if (isCollapsed) {
                      icon.classList.remove("fa-chevron-left");
                      icon.classList.add("fa-chevron-right");
                  } else {
                      icon.classList.remove("fa-chevron-right");
                      icon.classList.add("fa-chevron-left");
                  }
              }
          }
      };

      window.validarSenhaMeuPerfil = function(form) {
          const senha = form.querySelector('input[name="senha"]');
          const confirma = form.querySelector('input[name="confirma_senha"]');
          
          if (senha && confirma) {
              if (senha.value !== confirma.value) {
                  window.mostrarToastSidebar('erro', 'Atenção', 'A confirmação de senha não coincide com a nova senha.');
                  return false;
              }
          }
          return true;
      };

      document.addEventListener("DOMContentLoaded", () => {
          const sidebar = document.querySelector(".sidebar");
          const icon = document.getElementById("toggleSidebarIcon");
          if (sidebar && localStorage.getItem("ecoflow_sidebar_collapsed") === "true") {
              sidebar.classList.add("collapsed");
              if (icon) {
                  icon.classList.remove("fa-chevron-left");
                  icon.classList.add("fa-chevron-right");
              }
          }

          const modalFoto = document.getElementById("modalFotoPerfil");
          if (modalFoto && modalFoto.parentElement !== document.body) {
              document.body.appendChild(modalFoto);
          }
          
          const modalMeuPerfil = document.getElementById("modalMeuPerfil");
          if (modalMeuPerfil && modalMeuPerfil.parentElement !== document.body) {
              document.body.appendChild(modalMeuPerfil);
          }

          // Fallback para exibir o toast se a página recarregar com '?perfilEditado=1'
          const urlParams = new URLSearchParams(window.location.search);
          if(urlParams.has('perfilEditado')) {
               window.mostrarToastSidebar('sucesso', 'Concluído!', 'O seu perfil foi atualizado com sucesso.');
               let newUrl = window.location.pathname;
               const queryParams = Array.from(urlParams).filter(([k]) => k !== 'perfilEditado').map(([k,v]) => k+'='+v).join('&');
               if(queryParams) newUrl += '?' + queryParams;
               window.history.replaceState({}, document.title, newUrl);
          }
      });

      // Lógica de Ativação do Menu
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

          if (!foundMatch && matchedLinks.length > 0) {
              const link = matchedLinks[0]; 
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
      // LÓGICA DO DROPDOWN DE NOTIFICAÇÕES (AJAX)
      // =======================================================================
      document.addEventListener("DOMContentLoaded", () => {
        const btnNotif = document.getElementById("btnAbrirNotificacoes");
        const lista = document.getElementById("listaNotificacoes");
        const btnLimpar = document.getElementById("btnLimparNotificacoes");
        const contador = document.getElementById("contadorNotificacoes");

        if (!btnNotif || !lista) return;

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
            <div class="text-center text-white-50 py-4" style="opacity: 0.5;">
              <i class="fa-regular fa-bell-slash fs-3 d-block mb-2"></i>
              Nenhuma notificação.
            </div>
          \`;
        };

        const htmlSkeletonNotificacoes = () => {
          let skeletons = '';
          for(let i=0; i<3; i++) {
             skeletons += \`
              <div class="p-2 item-notificacao d-flex justify-content-between gap-2">
                <div class="w-100">
                  <div class="skeleton-dark skeleton-text w-75 mb-2"></div>
                  <div class="skeleton-dark skeleton-text w-50"></div>
                </div>
                <div class="skeleton-dark" style="width: 20px; height: 20px; border-radius: 4px; flex-shrink: 0;"></div>
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
            btnExcluir.addEventListener("click", async (e) => {
              e.stopPropagation(); // Evita fechar o dropdown ao clicar
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
                <div class="p-2 item-notificacao" data-id="\${n.id}">
                  <div class="d-flex justify-content-between gap-2 align-items-start">
                    <div>
                      <div class="fw-medium text-white mb-1" style="font-size: 0.8rem; line-height: 1.3;">\${escapeHtml(n.mensagem || "Notificação")}</div>
                      <small class="text-white-50" style="font-size: 0.65rem;">\${escapeHtml(data)}</small>
                    </div>
                    <button type="button" class="btn btn-sm border-0 text-white-50 btn-excluir-notificacao" data-id="\${n.id}" title="Excluir" style="padding: 2px 6px; background-color: transparent;" onmouseover="this.style.color='#dc3545';" onmouseout="this.style.color='';">
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

        // Carrega sempre que o dropdown abrir (nativo do Bootstrap)
        btnNotif.addEventListener('show.bs.dropdown', async () => {
            await carregarNotificacoes(true);
        });

        // E carrega de fundo assim que a tela abre, para atualizar a Badge do contador
        carregarNotificacoes(false);

        if (btnLimpar) {
          btnLimpar.addEventListener("click", async (e) => {
            e.stopPropagation();
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
              window.mostrarToastSidebar('erro', 'Erro', 'Erro ao limpar notificações.');
            } finally {
              btnLimpar.disabled = false;
            }
          });
        }
      });

      // =======================================================================
      // ESQUELETO DO MENU (PREVINE CLIQUE ANTES DA HORA E PISCADAS)
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

      window.addEventListener('pageshow', (event) => {
          if (event.persisted) {
              ocultarSkeletonMenuLateral();
              if (typeof window.ocultarSkeletonGlobais === 'function') {
                  window.ocultarSkeletonGlobais();
              }
          }
      });
    </script>
  `;
}

module.exports = menuLateral;