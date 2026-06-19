// views/tabelaPrecosView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");

function tabelaPrecosView(
  usuario,
  caixas = [],
  ultimaAlteracao = null,
  fornecedores = [],
  paginacao = {},
  filtros = {} 
) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  const dataFormatada = ultimaAlteracao
    ? new Date(ultimaAlteracao.atualizado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : null;

  const alteracaoTexto = ultimaAlteracao
    ? `Última atualização: <strong class="text-white">${dataFormatada}</strong> por <strong class="text-white">${ultimaAlteracao.atualizado_por}</strong>`
    : "Nenhuma atualização registrada";

  const fmt = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtPct = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const linhas = caixas.map(caixa => {
    const pct = caixa.fornecedor_pct ? Number(caixa.fornecedor_pct) : 0;
    const fator = 1 + pct / 100;

    const precoParda = Number(caixa.preco_parda) * fator;
    const precoBranca = Number(caixa.preco_branca) * fator;

    return `
    <tr style="cursor: pointer;" class="align-middle table-hover-row" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('editarModal${caixa.id}')).show();" title="Clique para editar">
      <td class="text-white py-2 px-3 text-start fw-medium">${caixa.codigo || "-"}</td>
      <td class="text-white py-2 px-3 text-start">${caixa.modelo}</td>
      <td class="text-success fw-bold py-2 px-3">R$ ${fmt(precoParda)}</td>
      <td class="text-primary fw-bold py-2 px-3">R$ ${fmt(precoBranca)}</td>
      <td class="py-2 px-3">
        <span class="badge bg-custom-darker border-custom text-muted shadow-sm" style="font-size:0.7rem; padding: 4px 8px;">
          <i class="fa-solid fa-truck-fast me-1 opacity-75"></i> ${caixa.fornecedor_nome || "Sem Fornecedor"}
        </span>
      </td>
      <td class="text-end text-nowrap py-2 px-3" onclick="event.stopPropagation();">
        <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger py-1 px-2 shadow-sm" 
                onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('excluirModal${caixa.id}')).show();" title="Excluir">
          <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
        </button>
      </td>
    </tr>
  `;
  }).join("");

  const qParam = paginacao.q ? `&q=${encodeURIComponent(paginacao.q)}` : "";

  // Paginação minimalista ERP adaptada pro Dark Mode
  const paginationHtml = totalPages > 1 ? `
  <nav aria-label="Paginação" class="mt-4">
    <ul class="pagination pagination-sm justify-content-center mb-0">
      <li class="page-item ${page <= 1 ? "disabled" : ""}">
        <a class="page-link" href="/tabela-precos?page=${page - 1}${qParam}" onclick="navegarPagina(event, this.href)">&laquo;</a>
      </li>

      ${(() => {
      const delta = 2;
      let paginas = [];
      let ultima;
      let html = '';

      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
          paginas.push(i);
        }
      }

      paginas.forEach(p => {
        if (ultima) {
          if (p - ultima === 2) {
            html += `<li class="page-item"><a class="page-link" href="/tabela-precos?page=${ultima + 1}${qParam}" onclick="navegarPagina(event, this.href)">${ultima + 1}</a></li>`;
          } else if (p - ultima > 2) {
            html += `<li class="page-item disabled"><span class="page-link text-muted border-0 bg-transparent">...</span></li>`;
          }
        }
        html += `<li class="page-item ${p === page ? "active" : ""}"><a class="page-link ${p === page ? "fw-bold" : ""}" href="/tabela-precos?page=${p}${qParam}" onclick="navegarPagina(event, this.href)">${p}</a></li>`;
        ultima = p;
      });

      return html;
    })()}

      <li class="page-item ${page >= totalPages ? "disabled" : ""}">
        <a class="page-link" href="/tabela-precos?page=${page + 1}${qParam}" onclick="navegarPagina(event, this.href)">&raquo;</a>
      </li>
    </ul>
  </nav>
` : "";

  const fornecedoresOptions = (fornecedores && fornecedores.length)
    ? fornecedores.map(f => `<option value="${f.id}">${f.nome} (${f.porcentagem}%)</option>`).join("")
    : '<option value="">Nenhum fornecedor cadastrado</option>';

  const modais = caixas.map(caixa => `
    <div class="modal fade" id="editarModal${caixa.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/tabela-precos/editar/${caixa.id}" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Caixa Atualizada!')">
          <div class="modal-header bg-custom-darker border-custom text-white">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Caixa</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label for="codigo${caixa.id}" class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Código</label>
                <input type="text" id="codigo${caixa.id}" name="codigo" value="${caixa.codigo || ""}" class="form-control form-control-sm shadow-sm" placeholder="Opcional">
              </div>
              <div class="col-12 col-md-8">
                <label for="modelo${caixa.id}" class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Modelo</label>
                <input type="text" id="modelo${caixa.id}" name="modelo" value="${caixa.modelo}" class="form-control form-control-sm shadow-sm" required>
              </div>
              <div class="col-12 col-md-6">
                <label for="parda${caixa.id}" class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Preço Parda (Base)</label>
                <div class="input-group input-group-sm shadow-sm">
                  <span class="input-group-text bg-custom-darker border-custom border-end-0">R$</span>
                  <input type="number" step="0.01" id="parda${caixa.id}" name="preco_parda" value="${caixa.preco_parda}" class="form-control border-start-0" required>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label for="branca${caixa.id}" class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Preço Branca (Base)</label>
                <div class="input-group input-group-sm shadow-sm">
                  <span class="input-group-text bg-custom-darker border-custom border-end-0">R$</span>
                  <input type="number" step="0.01" id="branca${caixa.id}" name="preco_branca" value="${caixa.preco_branca}" class="form-control border-start-0" required>
                </div>
              </div>
            </div>
            <div class="mt-3 text-muted p-2 bg-custom-darker rounded border-custom shadow-sm" style="font-size:0.7rem;">
               <i class="fa-solid fa-circle-info text-accent me-1"></i> O preço exibido na tabela será o valor base somado à porcentagem do fornecedor.
            </div>
          </div>
          <div class="modal-footer border-custom bg-custom-darker d-flex flex-nowrap pt-3">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm text-dark"><i class="fa-solid fa-save me-1"></i> Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${caixa.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <form method="POST" action="/tabela-precos/excluir/${caixa.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Caixa Excluída!')">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="mb-2 fw-bold text-white" style="font-size: 0.9rem;">Excluir Caixa?</h6>
              <p class="text-muted mb-0" style="font-size:0.8rem;">Deseja excluir a caixa modelo <b>${caixa.modelo}</b>?</p>
            </div>
            <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Sim, Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `).join("");

  const listaFornecedores = (fornecedores && fornecedores.length)
    ? fornecedores.map(f => `
      <li class="list-group-item d-flex justify-content-between align-items-center px-3 py-3 border-custom border-bottom bg-transparent">
        <div>
          <strong class="text-white" style="font-size:0.85rem;">${f.nome}</strong><br>
          <span class="text-muted" style="font-size:0.75rem;">Taxa / Margem: <strong class="text-success">${fmtPct(f.porcentagem)}%</strong></span>
        </div>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-secondary border-custom text-warning shadow-sm py-1 px-2" data-bs-toggle="modal" data-bs-target="#editarFornecedorModal${f.id}" title="Editar">
            <i class="fa-solid fa-pen" style="font-size: 0.75rem;"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary border-custom text-danger shadow-sm py-1 px-2 ms-1" data-bs-toggle="modal" data-bs-target="#excluirFornecedorModal${f.id}" title="Excluir">
            <i class="fa-solid fa-trash" style="font-size: 0.75rem;"></i>
          </button>
        </div>
      </li>
    `).join("")
    : "<li class='list-group-item text-muted border-0 bg-transparent py-4 text-center' style='font-size: 0.8rem;'>Nenhum fornecedor cadastrado no sistema.</li>";

  const modaisFornecedores = (fornecedores && fornecedores.length)
    ? fornecedores.map(f => `
      <div class="modal fade" id="editarFornecedorModal${f.id}" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
          <form method="POST" action="/fornecedores/editar/${f.id}" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Fornecedor Atualizado!')">
            <div class="modal-header bg-custom-darker border-custom text-white">
              <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-truck-fast me-2 text-warning"></i> Editar Fornecedor</h6>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-sm p-4 bg-custom-dark">
              <div class="row g-3">
                <div class="col-12 col-md-8">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Nome do Fornecedor</label>
                  <input type="text" name="nome" class="form-control form-control-sm shadow-sm" value="${f.nome}" required>
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Taxa (%)</label>
                  <div class="input-group input-group-sm shadow-sm">
                      <input type="number" step="0.01" name="porcentagem" class="form-control border-end-0" value="${f.porcentagem}" required>
                      <span class="input-group-text bg-custom-darker border-custom text-muted border-start-0">%</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer border-custom bg-custom-darker d-flex flex-nowrap pt-3">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-toggle="modal" data-bs-target="#fornecedoresModal">Voltar</button>
              <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm text-dark"><i class="fa-solid fa-save me-1"></i> Salvar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="modal fade" id="excluirFornecedorModal${f.id}" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-sm modal-dialog-centered">
          <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
            <form method="POST" action="/fornecedores/excluir/${f.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Fornecedor Excluído!')">
              <div class="modal-body text-center p-4">
                <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                <h6 class="mb-2 fw-bold text-white" style="font-size: 0.9rem;">Excluir Fornecedor?</h6>
                <p class="text-muted mb-0" style="font-size:0.8rem;">Tem certeza que deseja remover o fornecedor <b>${f.nome}</b>?</p>
              </div>
              <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
                <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-toggle="modal" data-bs-target="#fornecedoresModal">Cancelar</button>
                <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Sim, Excluir</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `).join("")
    : "";

  const opcoes = caixas.map(caixa => {
    // Calcula já com o imposto pro orçador via data-attributes
    const pct = caixa.fornecedor_pct ? Number(caixa.fornecedor_pct) : 0;
    const fator = 1 + pct / 100;
    const finalParda = Number(caixa.preco_parda) * fator;
    const finalBranca = Number(caixa.preco_branca) * fator;

    return `
      <option value="${caixa.id}" data-parda="${finalParda}" data-branca="${finalBranca}">
        ${caixa.modelo}
      </option>
    `;
  }).join("");

  const menuHTML = menuLateral(user, "/tabela-precos");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preços | Ecoflow</title>
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      /* Scrollbars Globais (Dark & Green) */
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
      html, body, .content, .table-responsive, .modal-body, .offcanvas-body { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

      body { 
          display: flex; 
          height: 100vh; 
          margin: 0; 
          background-color: #1f1f1f;
          color: #ffffff;
          font-family: 'Segoe UI', sans-serif;
      }

      /* Sidebar */
      .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column;}
      .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s;}
      .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
      
      .content { flex: 1; padding: 24px; overflow-y: auto; background-color: #1f1f1f; }
      
      /* Tema Escuro Customizado */
      .bg-custom-dark { background-color: #2a2a2a !important; }
      .bg-custom-darker { background-color: #222222 !important; }
      .border-custom { border-color: rgba(255,255,255,0.08) !important; border-style: solid; border-width: 1px; }
      .text-accent { color: #08c068 !important; }

      /* Modificadores Bootstrap */
      .text-dark { color: #ffffff !important; }
      .text-muted { color: rgba(255,255,255,0.5) !important; }

      .btn-primary, .btn-success { background-color: #08c068; border-color: #08c068; color: #1f1f1f; }
      .btn-primary:hover, .btn-success:hover, .btn-primary:active, .btn-success:active { background-color: #06a055 !important; border-color: #06a055 !important; color: #ffffff !important; }
      .btn-outline-primary, .btn-outline-success { color: #08c068; border-color: #08c068; }
      .btn-outline-primary:hover, .btn-outline-success:hover { background-color: #08c068; color: #1f1f1f; border-color: #08c068; }
      
      .btn-outline-secondary { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }
      .btn-outline-secondary:hover { background-color: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.3); }

      /* Inputs e Selects */
      .form-control, .form-select, .input-group-text { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.8rem; }
      .form-control:focus, .form-select:focus { background-color: #2a2a2a; border-color: #08c068; color: #fff; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }
      .input-group-text { background-color: #2a2a2a; color: rgba(255,255,255,0.6); }

      /* Tabelas e Modais */
      .table { 
          --bs-table-bg: transparent; 
          --bs-table-color: #fff; 
          --bs-table-hover-bg: rgba(255,255,255,0.06);
          --bs-table-hover-color: #fff;
          color: #fff; 
          margin-bottom: 0;
      }
      .table thead th { 
          background-color: #222 !important; 
          color: rgba(255,255,255,0.6) !important; 
          border-bottom: 1px solid rgba(255,255,255,0.1) !important; 
          font-weight: 600; 
      }
      .table tbody td { 
          border-bottom: 1px solid rgba(255,255,255,0.05) !important; 
          background-color: transparent !important; 
          color: #fff !important; 
      }
      .table-hover-row { transition: background-color 0.2s ease; }
      .table-hover-row:hover > td, 
      .table-hover > tbody > tr:hover > td, 
      .table-hover > tbody > tr:hover > * { 
          background-color: rgba(255,255,255,0.06) !important; 
          color: #fff !important; 
          box-shadow: inset 0 0 0 9999px rgba(255, 255, 255, 0.03);
      }

      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
      .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }

      /* Pagination */
      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
      .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.05); }

      /* ANIMAÇÕES GLOBAIS (TOASTS E MODAIS) */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      .modal.fade .modal-dialog { transform: scale(0.85) translateY(30px); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
      .modal.show .modal-dialog { transform: scale(1) translateY(0); }

      /* SKELETON LOADING (DARK) */
      .skeleton-dark {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%) !important;
          background-size: 200% 100% !important;
          animation: skeleton-loading-view 1.5s infinite linear !important;
          border-radius: 4px;
          color: transparent !important;
          border-color: transparent !important;
          box-shadow: none !important;
          pointer-events: none;
      }
      .skeleton-dark * { visibility: hidden !important; }
      .skeleton-text-view { height: 14px; width: 100%; margin-bottom: 8px; }
      .skeleton-btn-view { height: 26px; width: 32px; border-radius: 4px; display: inline-block; }
      @keyframes skeleton-loading-view {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
      }

      /* Offcanvas Mobile */
      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 16px; }
      }
      .offcanvas { background-color: #1f1f1f !important; }
      .offcanvas-body a { display: block; text-align: left; padding: 12px 15px; color: white; text-decoration: none; margin: 4px 0; border-radius: 6px;}
      .offcanvas-body a:hover, .offcanvas-body a.active { background-color: rgba(255,255,255,0.1); }
    </style>
  </head>
  <body>
    
    ${renderLoaderParticulas("Consultando preços")}

    <div class="sidebar d-none d-md-flex">
      <div class="text-center mb-4 mt-2">
        <img src="/img/logo-branca.png" alt="Logo da Empresa" class="img-fluid" style="max-width: 130px;">
      </div>
      <div class="flex-grow-1">
        ${menuHTML}
      </div>
    </div>

    <div class="offcanvas offcanvas-start text-white" tabindex="-1" id="sidebarMenu">
      <div class="offcanvas-header border-bottom border-custom">
        <h5 class="offcanvas-title ms-2" style="font-size: 0.9rem;"><i class="fa-solid fa-bars text-muted me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2">
            <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid" style="max-width:140px;">
        </div>
        ${menuHTML}
        <hr class="border-custom mt-4">
        <a href="/logout" class="text-danger mt-2" style="font-size: 0.85rem;"><i class="fas fa-sign-out-alt me-2"></i>Sair do Sistema</a>
      </div>
    </div>

    <div class="content">
      
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-tags text-muted me-2"></i>Tabela de Preços</h5>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">${alteracaoTexto}</span>
            </div>
        </div>
      </div>

      <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 bg-custom-darker p-3 rounded-3 shadow-sm border border-custom gap-3">
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-success shadow-sm fw-bold text-dark" data-bs-toggle="modal" data-bs-target="#novaCaixaModal">
            <i class="fa-solid fa-box me-1"></i> Nova Caixa
          </button>

          ${caixas.length > 0 ? `
            <button class="btn btn-sm btn-primary shadow-sm fw-bold text-dark" data-bs-toggle="modal" data-bs-target="#orcamentoModal">
              <i class="fa-solid fa-file-invoice-dollar me-1"></i> Gerar Orçamento
            </button>
          ` : ""}

          <button class="btn btn-sm btn-outline-info shadow-sm fw-bold text-info" data-bs-toggle="modal" data-bs-target="#fornecedoresModal">
            <i class="fa-solid fa-truck-fast me-1"></i> Fornecedores
          </button>
        </div>

        <form class="input-group input-group-sm shadow-sm" style="max-width: 400px; width: 100%;" method="GET" action="/tabela-precos" onsubmit="prepararBuscaSimples(event, this, 'Busca Concluída!')">
          <span class="input-group-text bg-custom-darker border-custom border-end-0"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
          <input type="text" id="searchInput" name="q" class="form-control border-custom border-start-0 ps-0 text-white bg-custom-darker" placeholder="Buscar código, modelo ou fornecedor..." value="${(filtros && filtros.q) ? filtros.q : ""}">
          <button id="searchBtn" type="submit" class="btn btn-primary fw-bold text-dark">Buscar</button>
          <a id="clearBtn" href="/tabela-precos" class="btn btn-outline-secondary border-custom text-danger" title="Limpar Filtros" onclick="event.preventDefault(); window.location.href='/tabela-precos';"><i class="fa-solid fa-eraser"></i></a>
        </form>
      </div>

      <div class="table-responsive bg-custom-darker rounded-3 shadow-sm border border-custom mb-4">
        <table class="table table-hover table-sm align-middle text-center mb-0" id="caixasTable" style="font-size: 0.85rem; border-collapse: separate; border-spacing: 0;">
          <thead class="table-light">
            <tr>
              <th class="py-2 px-3 fw-bold text-muted border-0 text-start">Código</th>
              <th class="py-2 px-3 fw-bold text-muted border-0 text-start">Modelo da Caixa</th>
              <th class="py-2 px-3 fw-bold text-muted border-0">Preço Parda</th>
              <th class="py-2 px-3 fw-bold text-muted border-0">Preço Branca</th>
              <th class="py-2 px-3 fw-bold text-muted border-0">Fornecedor Associado</th>
              <th class="py-2 px-3 fw-bold text-muted border-0 text-end">Ações</th>
            </tr>
          </thead>
          <tbody class="border-top-0">
            ${linhas || "<tr><td colspan='6' class='text-center text-muted py-5'><i class='fa-solid fa-inbox fa-3x mb-3 opacity-25 d-block'></i><span style='font-size: 0.8rem;'>Nenhuma caixa encontrada</span></td></tr>"}
          </tbody>
        </table>
      </div>

      ${paginationHtml}

    </div>

    <div class="modal fade" id="novaCaixaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/tabela-precos/nova" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Caixa Cadastrada!')">
          <div class="modal-header bg-custom-darker border-custom text-white">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-box me-2 text-success"></i> Cadastrar Nova Caixa</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Código</label>
                <input type="text" name="codigo" class="form-control form-control-sm shadow-sm" placeholder="Opcional">
              </div>
              <div class="col-12 col-md-8">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Modelo</label>
                <input type="text" name="modelo" class="form-control form-control-sm shadow-sm" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Preço Parda (Base)</label>
                <div class="input-group input-group-sm shadow-sm">
                  <span class="input-group-text bg-custom-darker border-custom border-end-0">R$</span>
                  <input type="number" step="0.01" name="preco_parda" class="form-control border-start-0" required>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Preço Branca (Base)</label>
                <div class="input-group input-group-sm shadow-sm">
                  <span class="input-group-text bg-custom-darker border-custom border-end-0">R$</span>
                  <input type="number" step="0.01" name="preco_branca" class="form-control border-start-0" required>
                </div>
              </div>
              <div class="col-12 mt-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Fornecedor Responsável</label>
                <select name="fornecedor_id" class="form-select form-select-sm shadow-sm text-white" required>
                  <option value="" disabled selected>-- Selecione um fornecedor --</option>
                  ${fornecedoresOptions}
                </select>
              </div>
            </div>
            <div class="mt-3 text-muted p-2 bg-custom-darker rounded border-custom shadow-sm" style="font-size:0.7rem;">
               <i class="fa-solid fa-circle-info text-accent me-1"></i> O preço exibido na tabela será o valor base somado à porcentagem de margem do fornecedor selecionado.
            </div>
          </div>
          <div class="modal-footer border-custom bg-custom-darker d-flex flex-nowrap pt-3">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success w-100 fw-bold shadow-sm text-dark"><i class="fa-solid fa-check me-1"></i> Salvar Cadastro</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="orcamentoModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal shadow-lg border-0 bg-custom-darker">
          <div class="modal-header bg-custom-darker border-custom text-white">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-file-invoice-dollar me-2 text-primary"></i> Gerador de Orçamento</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="row g-3">
              <div class="col-12">
                <label for="selectCaixa" class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Selecione a Caixa</label>
                <select id="selectCaixa" class="form-select form-select-sm shadow-sm text-white">
                  <option value="" disabled selected>-- Escolha um modelo --</option>
                  ${opcoes}
                </select>
              </div>

              <div class="col-12 mt-2">
                <div id="precos" class="d-none bg-custom-darker p-3 rounded-3 border-custom shadow-sm" style="font-size: 0.85rem;">
                  <div class="d-flex justify-content-between mb-2 pb-2 border-bottom border-custom">
                    <span class="text-muted">Valor Unit. Parda:</span>
                    <strong class="text-success">R$ <span id="precoParda"></span></strong>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span class="text-muted">Valor Unit. Branca:</span>
                    <strong class="text-primary">R$ <span id="precoBranca"></span></strong>
                  </div>
                </div>
              </div>

              <div class="col-12 mt-3">
                <label for="quantidade" class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Quantidade Solicitada</label>
                <input type="number" id="quantidade" class="form-control form-control-sm shadow-sm" min="1" placeholder="Ex: 100">
              </div>
            </div>

            <button id="btnGerar" class="btn btn-sm btn-primary w-100 mt-4 shadow-sm fw-bold text-dark py-2">Calcular Total</button>

            <div id="resultado" class="mt-4 d-none">
              <h6 class="fw-bold mb-2 text-accent" style="font-size:0.8rem;">Resumo do Orçamento</h6>
              <div class="p-3 bg-custom-darker rounded-3 border-custom shadow-sm" style="font-size:0.85rem;">
                <p class="mb-1"><span class="text-muted">Modelo:</span> <strong id="modeloSelecionado" class="text-white"></strong></p>
                <p class="mb-2"><span class="text-muted">Quantidade:</span> <strong id="qtdSelecionada" class="text-white"></strong></p>
                <hr class="my-2 border-custom">
                <p class="mb-2 d-flex justify-content-between align-items-center">
                   <span class="text-muted">Total Parda:</span> 
                   <strong class="text-success fs-6">R$ <span id="totalParda"></span></strong>
                </p>
                <p class="mb-0 d-flex justify-content-between align-items-center">
                   <span class="text-muted">Total Branca:</span> 
                   <strong class="text-primary fs-6">R$ <span id="totalBranca"></span></strong>
                </p>
              </div>
              <button id="btnCopiar" class="btn btn-sm btn-outline-secondary border-custom text-white w-100 mt-3 shadow-sm py-2">
                <i class="fa-regular fa-copy me-1 text-accent"></i> Copiar para Área de Transferência
              </button>
            </div>
          </div>
          <div class="modal-footer border-custom bg-custom-darker">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="fornecedoresModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal shadow-lg border-0 bg-custom-darker">
          <div class="modal-header bg-custom-darker border-custom text-white">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-truck-fast me-2 text-info"></i> Gestão de Fornecedores</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-0 bg-custom-dark">
            
            <div class="p-4 bg-custom-darker border-bottom border-custom">
              <form method="POST" action="/fornecedores/novo" onsubmit="prepararSubmissaoSimples(event, this, 'Fornecedor Cadastrado!')">
                <h6 class="fw-bold mb-3 text-accent" style="font-size:0.8rem;"><i class="fa-solid fa-plus-circle me-1"></i> Adicionar Novo Fornecedor</h6>
                <div class="row g-2">
                  <div class="col-12 col-md-7">
                    <input type="text" name="nome" class="form-control form-control-sm shadow-sm" placeholder="Nome do Fornecedor" required>
                  </div>
                  <div class="col-12 col-md-5">
                    <div class="input-group input-group-sm shadow-sm">
                      <input type="number" step="0.01" name="porcentagem" class="form-control border-end-0" placeholder="Taxa/Margem" required>
                      <span class="input-group-text bg-custom-darker border-custom text-muted border-start-0">%</span>
                    </div>
                  </div>
                  <div class="col-12 mt-2">
                    <button type="submit" class="btn btn-sm btn-info fw-bold text-dark shadow-sm w-100"><i class="fa-solid fa-save me-1"></i> Salvar Fornecedor</button>
                  </div>
                </div>
              </form>
            </div>

            <div class="p-0">
              <div class="bg-custom-dark p-2 border-bottom border-custom">
                 <span class="text-muted fw-bold ms-2" style="font-size:0.7rem; letter-spacing: 0.5px;">FORNECEDORES CADASTRADOS</span>
              </div>
              <ul class="list-group list-group-flush">
                ${listaFornecedores}
              </ul>
            </div>

          </div>
          <div class="modal-footer border-custom bg-custom-darker">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    ${modais}
    ${modaisFornecedores}

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-check fs-5 me-2 text-accent" id="sucessoIcon"></i>
                    <strong class="fs-6" id="sucessoTitulo">Concluído!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="sucessoSub">Operação realizada com sucesso.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 4px; background: #08c068;"></div>
        </div>

        <div id="erroToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(220,53,69,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-xmark fs-5 me-2 text-danger"></i>
                    <strong class="fs-6" id="erroTitulo">Erro!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="erroSub">Ocorreu um erro ao processar.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <script>
      // =======================================================================
      // FUNÇÃO GENÉRICA DE TOASTS E SKELETON
      // =======================================================================
      function mostrarToast(tipo, titulo, mensagem) {
          const toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
          if (toastEl) {
              document.getElementById(tipo === 'sucesso' ? 'sucessoTitulo' : 'erroTitulo').innerText = titulo;
              document.getElementById(tipo === 'sucesso' ? 'sucessoSub' : 'erroSub').innerText = mensagem;
              
              const timerEl = document.getElementById(tipo === 'sucesso' ? 'sucessoTimer' : 'erroTimer');
              if (timerEl) {
                  timerEl.style.display = 'block';
                  timerEl.style.animation = 'none';
                  timerEl.offsetHeight; 
                  timerEl.style.animation = 'shrinkToast 5s linear forwards';
              }

              const oldInstance = bootstrap.Toast.getInstance(toastEl);
              if (oldInstance) oldInstance.dispose();

              const toast = new bootstrap.Toast(toastEl, {
                  autohide: true,
                  delay: 5000
              });
              
              toast.show();
          }
      }

      function gerarSkeletonTabela(quantidade = 6) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += \`
              <tr class="align-middle">
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 50px; margin: 0;"></div></td>
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 150px; margin: 0;"></div></td>
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 80px; margin: 0;"></div></td>
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 80px; margin: 0;"></div></td>
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 100px; margin: 0;"></div></td>
                  <td class="text-end py-2 px-3"><div class="skeleton-dark skeleton-btn-view" style="margin-left: auto;"></div></td>
              </tr>\`;
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const tableContainer = document.querySelector('.content > .table-responsive');
          
          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="table-responsive bg-custom-darker rounded-3 shadow-sm border-custom mb-4 skeleton-container">
              <table class="table table-sm align-middle mb-0" style="font-size: 0.85rem; border-collapse: separate; border-spacing: 0;">
                 <thead class="table-light">
                   <tr>
                     <th class="py-2 px-3 text-start border-0">Código</th>
                     <th class="py-2 px-3 text-start border-0">Modelo da Caixa</th>
                     <th class="py-2 px-3 border-0">Preço Parda</th>
                     <th class="py-2 px-3 border-0">Preço Branca</th>
                     <th class="py-2 px-3 border-0">Fornecedor Associado</th>
                     <th class="py-2 px-3 border-0 text-end">Ações</th>
                   </tr>
                 </thead>
                 <tbody class="border-top-0">
                    \${gerarSkeletonTabela(6)}
                 </tbody>
              </table>
          </div>\`;

          if (tableContainer && !tableContainer.classList.contains('skeleton-container')) {
              tableContainer.style.display = 'none';
              tableContainer.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const tableContainer = document.querySelector('.content > .table-responsive:not(.skeleton-container)');
          if (tableContainer) tableContainer.style.display = '';
      }

      mostrarSkeletonGlobais();
      window.addEventListener('load', ocultarSkeletonGlobais);

      // =======================================================================
      // AJAX E SUBMISSÃO ESTRUTURAL
      // =======================================================================
      let isSubmitting = false;

      async function prepararBuscaSimples(event, form, titleMsg) {
          if (event) event.preventDefault();
          mostrarSkeletonGlobais();

          try {
              const formData = new FormData(form);
              const queryString = new URLSearchParams(formData).toString();
              const url = form.action + '?' + queryString;

              const response = await fetch(url, { method: 'GET' });
              if (response.ok) {
                  const html = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }
                  
                  atualizarModaisDinamicos(doc);
                  window.history.pushState({}, '', url);
                  mostrarToast('sucesso', 'Busca Concluída!', titleMsg);
              } else {
                  mostrarToast('erro', 'Erro', 'Não foi possível realizar a busca.');
              }
          } catch (err) {
              mostrarToast('erro', 'Falha', 'Verifique a sua rede.');
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      async function navegarPagina(event, url) {
          event.preventDefault();
          mostrarSkeletonGlobais();
          try {
              const response = await fetch(url, { method: 'GET' });
              if (response.ok) {
                  const html = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }
                  
                  atualizarModaisDinamicos(doc);
                  window.history.pushState({}, '', url);
              } else {
                  mostrarToast('erro', 'Erro', 'Falha ao carregar a página.');
              }
          } catch (err) {
              mostrarToast('erro', 'Erro', 'Falha ao carregar a página.');
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      async function prepararSubmissaoSimples(event, form, titleMsg) {
          event.preventDefault();
          if (!form.checkValidity()) { form.reportValidity(); return; }
          if (isSubmitting) return;

          let keepFornecedorOpen = false;
          if (form.action.includes('/fornecedores/')) {
              keepFornecedorOpen = true;
          }

          const modalEl = form.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }
          document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
          document.body.classList.remove('modal-open');
          document.body.style = '';

          mostrarSkeletonGlobais();
          isSubmitting = true;

          try {
              const formData = new URLSearchParams();
              const fd = new FormData(form);
              for (const [key, value] of fd.entries()) {
                  formData.append(key, value);
              }

              const response = await fetch(form.action, {
                  method: form.method || 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: formData.toString()
              });

              if (response.ok) {
                  const freshResponse = await fetch(window.location.href);
                  const html = await freshResponse.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }

                  atualizarModaisDinamicos(doc);
                  
                  form.reset();
                  mostrarToast('sucesso', 'Concluído!', titleMsg);

                  if (keepFornecedorOpen) {
                      setTimeout(() => {
                          bootstrap.Modal.getOrCreateInstance(document.getElementById('fornecedoresModal')).show();
                      }, 200);
                  }

              } else {
                  mostrarToast('erro', 'Erro', 'Falha ao salvar no banco de dados.');
              }
          } catch (err) {
              mostrarToast('erro', 'Conexão', 'Verifique a sua internet.');
          } finally {
              isSubmitting = false;
              ocultarSkeletonGlobais();
          }
      }

      function atualizarModaisDinamicos(doc) {
          const staticModals = ['sidebarMenu'];
          document.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) m.remove();
          });
          doc.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
          });

          // Reinjetar o script do orçamento, pois os listeners se perdem
          const scriptOrcamento = document.createElement('script');
          scriptOrcamento.src = '/script/orcamento.js';
          document.body.appendChild(scriptOrcamento);
      }
    </script>
    <script src="/script/orcamento.js"></script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = tabelaPrecosView;