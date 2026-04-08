// views/tabelaPrecosView.js
const menuLateral = require("./menuLateral");

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
    ? `Última atualização: <strong>${dataFormatada}</strong> por <strong>${ultimaAlteracao.atualizado_por}</strong>`
    : "Nenhuma atualização registrada";

  const fmt = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtPct = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const linhas = caixas.map(caixa => {
    const pct = caixa.fornecedor_pct ? Number(caixa.fornecedor_pct) : 0;
    const fator = 1 + pct / 100;

    const precoParda = Number(caixa.preco_parda) * fator;
    const precoBranca = Number(caixa.preco_branca) * fator;

    return `
    <tr class="align-middle">
      <td class="fw-medium text-dark">${caixa.codigo || "-"}</td>
      <td>${caixa.modelo}</td>
      <td class="text-success fw-bold">R$ ${fmt(precoParda)}</td>
      <td class="text-primary fw-bold">R$ ${fmt(precoBranca)}</td>
      <td>
        <span class="badge bg-secondary bg-opacity-75 text-dark fw-medium" style="font-size:0.75rem;">
          <i class="fa-solid fa-truck-fast me-1 text-white"></i> ${caixa.fornecedor_nome || "Sem Fornecedor"}
        </span>
      </td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-light border text-warning" data-bs-toggle="modal" data-bs-target="#editarModal${caixa.id}" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-sm btn-light border text-danger" data-bs-toggle="modal" data-bs-target="#excluirModal${caixa.id}" title="Excluir">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `;
  }).join("");

  const qParam = paginacao.q ? `&q=${encodeURIComponent(paginacao.q)}` : "";

  // Paginação minimalista ERP
  const paginationHtml = totalPages > 1 ? `
  <nav aria-label="Paginação" class="mt-4">
    <ul class="pagination pagination-sm justify-content-center mb-0">
      <li class="page-item ${page <= 1 ? "disabled" : ""}">
        <a class="page-link text-dark" href="/tabela-precos?page=${page - 1}${qParam}">&laquo;</a>
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
            html += `<li class="page-item"><a class="page-link text-dark" href="/tabela-precos?page=${ultima + 1}${qParam}">${ultima + 1}</a></li>`;
          } else if (p - ultima > 2) {
            html += `<li class="page-item disabled"><span class="page-link text-muted border-0 bg-transparent">...</span></li>`;
          }
        }
        html += `<li class="page-item ${p === page ? "active" : ""}"><a class="page-link ${p === page ? "fw-bold text-dark" : "text-dark"}" href="/tabela-precos?page=${p}${qParam}">${p}</a></li>`;
        ultima = p;
      });

      return html;
    })()}

      <li class="page-item ${page >= totalPages ? "disabled" : ""}">
        <a class="page-link text-dark" href="/tabela-precos?page=${page + 1}${qParam}">&raquo;</a>
      </li>
    </ul>
  </nav>
` : "";

  const fornecedoresOptions = (fornecedores && fornecedores.length)
    ? fornecedores.map(f => `<option value="${f.id}">${f.nome} (${f.porcentagem}%)</option>`).join("")
    : '<option value="">Nenhum fornecedor cadastrado</option>';

  const modais = caixas.map(caixa => `
    <div class="modal fade" id="editarModal${caixa.id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/tabela-precos/editar/${caixa.id}" class="modal-content erp-modal">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Caixa</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-3">
            <div class="row g-2">
              <div class="col-12 col-md-4">
                <label for="codigo${caixa.id}" class="form-label text-muted mb-1" style="font-size:0.8rem;">Código</label>
                <input type="text" id="codigo${caixa.id}" name="codigo" value="${caixa.codigo || ""}" class="form-control form-control-sm" placeholder="Opcional">
              </div>
              <div class="col-12 col-md-8">
                <label for="modelo${caixa.id}" class="form-label text-muted mb-1" style="font-size:0.8rem;">Modelo</label>
                <input type="text" id="modelo${caixa.id}" name="modelo" value="${caixa.modelo}" class="form-control form-control-sm" required>
              </div>
              <div class="col-12 col-md-6">
                <label for="parda${caixa.id}" class="form-label text-muted mb-1" style="font-size:0.8rem;">Preço Parda (Base)</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text">R$</span>
                  <input type="number" step="0.01" id="parda${caixa.id}" name="preco_parda" value="${caixa.preco_parda}" class="form-control" required>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label for="branca${caixa.id}" class="form-label text-muted mb-1" style="font-size:0.8rem;">Preço Branca (Base)</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text">R$</span>
                  <input type="number" step="0.01" id="branca${caixa.id}" name="preco_branca" value="${caixa.preco_branca}" class="form-control" required>
                </div>
              </div>
            </div>
            <div class="mt-2 text-muted" style="font-size:0.75rem;">
               <i class="fa-solid fa-circle-info me-1"></i> O preço exibido na tabela será o valor base somado à porcentagem do fornecedor.
            </div>
          </div>
          <div class="modal-footer border-top-0 bg-light">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary"><i class="fa-solid fa-save me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${caixa.id}" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal">
          <form method="POST" action="/tabela-precos/excluir/${caixa.id}">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="mb-2">Excluir Caixa?</h6>
              <p class="text-muted mb-0" style="font-size:0.85rem;">Deseja excluir a caixa modelo <b>${caixa.modelo}</b>?</p>
            </div>
            <div class="modal-footer justify-content-center bg-light border-0">
              <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger">Sim, Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `).join("");

  const listaFornecedores = (fornecedores && fornecedores.length)
    ? fornecedores.map(f => `
      <li class="list-group-item d-flex justify-content-between align-items-center px-3 py-2 border-0 border-bottom">
        <div>
          <b class="text-dark" style="font-size:0.9rem;">${f.nome}</b><br>
          <span class="text-muted" style="font-size:0.75rem;">Taxa / Margem: <strong class="text-success">${fmtPct(f.porcentagem)}%</strong></span>
        </div>
        <div class="btn-group">
          <button class="btn btn-sm btn-light border text-warning" data-bs-toggle="modal" data-bs-target="#editarFornecedorModal${f.id}" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-sm btn-light border text-danger" data-bs-toggle="modal" data-bs-target="#excluirFornecedorModal${f.id}" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </li>
    `).join("")
    : "<li class='list-group-item text-muted border-0'>Nenhum fornecedor cadastrado no sistema.</li>";

  const modaisFornecedores = (fornecedores && fornecedores.length)
    ? fornecedores.map(f => `
      <div class="modal fade" id="editarFornecedorModal${f.id}" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <form method="POST" action="/fornecedores/editar/${f.id}" class="modal-content erp-modal">
            <div class="modal-header bg-light">
              <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-truck-fast me-2 text-warning"></i> Editar Fornecedor</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-sm p-3">
              <div class="row g-2">
                <div class="col-12 col-md-8">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Nome</label>
                  <input type="text" name="nome" class="form-control form-control-sm" value="${f.nome}" required>
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Taxa (%)</label>
                  <input type="number" step="0.01" name="porcentagem" class="form-control form-control-sm" value="${f.porcentagem}" required>
                </div>
              </div>
            </div>
            <div class="modal-footer border-top-0 bg-light">
              <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-primary"><i class="fa-solid fa-save me-1"></i> Salvar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="modal fade" id="excluirFornecedorModal${f.id}" tabindex="-1">
        <div class="modal-dialog modal-sm modal-dialog-centered">
          <div class="modal-content erp-modal">
            <form method="POST" action="/fornecedores/excluir/${f.id}">
              <div class="modal-body text-center p-4">
                <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                <h6 class="mb-2">Excluir Fornecedor?</h6>
                <p class="text-muted mb-0" style="font-size:0.85rem;">Tem certeza que deseja remover o fornecedor <b>${f.nome}</b>?</p>
              </div>
              <div class="modal-footer justify-content-center bg-light border-0">
                <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-sm btn-danger">Sim, Excluir</button>
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
    <title>Tabela de Preços | ERP Ecoflow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      body { 
          display: flex; 
          height: 100vh; 
          margin: 0; 
          background-color: #f4f7f6;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      }

      /* Sidebar */
      .sidebar { width: 240px; background-color: #0D5749; color: white; padding: 20px; display: flex; flex-direction: column;}
      .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s;}
      .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
      
      .content { flex: 1; padding: 24px; overflow-y: auto; }
      
      /* Utilities */
      .text-sm { font-size: 0.875rem; }

      /* Topbar / Badges */
      .usuario-badge {
          background-color: white;
          color: #0D5749;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid rgba(13,87,73,0.2);
          font-size: 0.85rem;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      }

      /* ERP Cards & Tables */
      .erp-card {
          border-radius: 12px;
          background: #fff;
          border: none;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          overflow: hidden;
      }
      
      .table > :not(caption) > * > * {
          padding: 6px 16px; /* REDUZIDO PARA LINHAS MAIS COMPACTAS */
          border-bottom-color: #f0f0f0;
          vertical-align: middle;
      }
      .table thead th {
          background-color: #fafbfc;
          color: #6c757d;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e9ecef;
          padding: 10px 16px !important;
      }

      /* Modals */
      .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      .erp-modal .modal-header { border-bottom: 1px solid #f0f0f0; }
      .erp-modal .modal-footer { border-top: 1px solid #f0f0f0; }
      .form-control-sm, .form-select-sm { border-radius: 6px; }

      /* Paginação ERP */
      .pagination-sm .page-link { background: transparent; border: none; font-size: 0.85rem; }
      .pagination-sm .page-item.active .page-link { background: transparent; border: none; }
      .pagination-sm .page-link:focus { box-shadow: none; }

      /* Offcanvas Mobile */
      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 16px; }
      }
      .offcanvas-body a { display: block; text-align: left; padding: 12px 15px; color: white; text-decoration: none; margin: 4px 0; border-radius: 6px;}
      .offcanvas-body a:hover, .offcanvas-body a.active { background-color: rgba(255,255,255,0.1); }
    </style>
  </head>
  <body>
    <div id="preloader" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; backdrop-filter: blur(4px); background: rgba(244, 247, 246, 0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; transition: opacity .3s ease;">
        <div class="spinner-border" style="color: #0D5749; width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Carregando...</span>
        </div>
    </div>

    <div class="sidebar d-none d-md-flex">
      <div class="text-center mb-4 mt-2">
        <img src="/img/logo-branca.png" alt="Logo da Empresa" class="img-fluid" style="max-width: 130px;">
      </div>
      <div class="flex-grow-1">
        ${menuHTML}
      </div>
    </div>

    <div class="offcanvas offcanvas-start bg-dark text-white" tabindex="-1" id="sidebarMenu">
      <div class="offcanvas-header border-bottom border-secondary">
        <h5 class="offcanvas-title ms-2"><i class="fa-solid fa-bars text-muted me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2">
            <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid" style="max-width:140px;">
        </div>
        ${menuHTML}
        <hr class="bg-secondary mt-4">
        <a href="/logout" class="text-danger mt-2"><i class="fas fa-sign-out-alt me-2"></i>Sair do Sistema</a>
      </div>
    </div>

    <div class="content">
      
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-light border d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars"></i></button>
            <div>
              <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-tags text-muted me-2"></i>Tabela de Preços</h4>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">${alteracaoTexto}</span>
            </div>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span class="usuario-badge d-none d-sm-inline-block">
            <i class="fa-solid fa-user-circle me-1"></i> ${user.nome}
          </span>
          <a href="/logout" class="btn btn-sm btn-outline-danger d-none d-md-inline-block" title="Sair">
            <i class="fas fa-sign-out-alt"></i>
          </a>
        </div>
      </div>

      <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 bg-white p-3 rounded-3 shadow-sm border border-light gap-3">
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-success shadow-sm" data-bs-toggle="modal" data-bs-target="#novaCaixaModal">
            <i class="fa-solid fa-box me-1"></i> Nova Caixa
          </button>

          ${caixas.length > 0 ? `
            <button class="btn btn-sm btn-primary shadow-sm" data-bs-toggle="modal" data-bs-target="#orcamentoModal">
              <i class="fa-solid fa-file-invoice-dollar me-1"></i> Gerar Orçamento
            </button>
          ` : ""}

          <button class="btn btn-sm btn-info text-white shadow-sm" data-bs-toggle="modal" data-bs-target="#fornecedoresModal">
            <i class="fa-solid fa-truck-fast me-1"></i> Fornecedores
          </button>
        </div>

        <form class="input-group input-group-sm" style="max-width: 400px; width: 100%;" method="GET" action="/tabela-precos">
          <span class="input-group-text bg-light"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
          <input type="text" id="searchInput" name="q" class="form-control border-start-0 ps-0" placeholder="Buscar código, modelo ou fornecedor..." value="${(filtros && filtros.q) ? filtros.q : ""}">
          <button id="searchBtn" type="submit" class="btn btn-primary">Buscar</button>
          <a id="clearBtn" href="/tabela-precos" class="btn btn-outline-secondary" title="Limpar Filtros"><i class="fa-solid fa-eraser"></i></a>
        </form>
      </div>

      <div class="erp-card">
        <div class="table-responsive">
          <table class="table table-hover align-middle text-center mb-0" id="caixasTable">
            <thead>
              <tr>
                <th class="text-start">Código</th>
                <th class="text-start">Modelo da Caixa</th>
                <th>Preço Parda</th>
                <th>Preço Branca</th>
                <th>Fornecedor Associado</th>
                <th class="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${linhas || "<tr><td colspan='6' class='text-center text-muted py-4'><i class='fa-solid fa-inbox fa-2x mb-2 opacity-25'></i><br>Nenhuma caixa encontrada</td></tr>"}
            </tbody>
          </table>
        </div>
      </div>

      ${paginationHtml}

    </div>

    <div class="modal fade" id="novaCaixaModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/tabela-precos/nova" class="modal-content erp-modal">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-box me-2 text-success"></i> Cadastrar Nova Caixa</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-3">
            <div class="row g-2">
              <div class="col-12 col-md-4">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Código</label>
                <input type="text" name="codigo" class="form-control form-control-sm" placeholder="Opcional">
              </div>
              <div class="col-12 col-md-8">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Modelo</label>
                <input type="text" name="modelo" class="form-control form-control-sm" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Preço Parda (Base)</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text">R$</span>
                  <input type="number" step="0.01" name="preco_parda" class="form-control" required>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Preço Branca (Base)</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text">R$</span>
                  <input type="number" step="0.01" name="preco_branca" class="form-control" required>
                </div>
              </div>
              <div class="col-12 mt-2">
                <label class="form-label text-muted mb-1" style="font-size:0.8rem;">Fornecedor Responsável</label>
                <select name="fornecedor_id" class="form-select form-select-sm" required>
                  <option value="" disabled selected>-- Selecione um fornecedor --</option>
                  ${fornecedoresOptions}
                </select>
              </div>
            </div>
            <div class="mt-3 text-muted" style="font-size:0.75rem;">
               <i class="fa-solid fa-circle-info me-1"></i> O preço exibido na tabela será o valor base somado à porcentagem de margem do fornecedor selecionado.
            </div>
          </div>
          <div class="modal-footer border-top-0 bg-light">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success"><i class="fa-solid fa-check me-1"></i> Salvar Cadastro</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="orcamentoModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-file-invoice-dollar me-2 text-primary"></i> Gerador de Orçamento</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-3">
            <div class="row g-2">
              <div class="col-12">
                <label for="selectCaixa" class="form-label text-muted mb-1" style="font-size:0.8rem;">Selecione a Caixa</label>
                <select id="selectCaixa" class="form-select form-select-sm">
                  <option value="" disabled selected>-- Escolha um modelo --</option>
                  ${opcoes}
                </select>
              </div>

              <div class="col-12 mt-2">
                <div id="precos" class="d-none bg-light p-2 rounded border" style="font-size: 0.85rem;">
                  <div class="d-flex justify-content-between mb-1">
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
                <label for="quantidade" class="form-label text-muted mb-1" style="font-size:0.8rem;">Quantidade</label>
                <input type="number" id="quantidade" class="form-control form-control-sm" min="1" placeholder="Ex: 100">
              </div>
            </div>

            <button id="btnGerar" class="btn btn-sm btn-primary w-100 mt-3 shadow-sm">Calcular Total</button>

            <div id="resultado" class="mt-4 d-none">
              <h6 class="fw-bold mb-2" style="font-size:0.85rem; color:#0D5749;">Resumo do Orçamento</h6>
              <div class="p-3 bg-light rounded border border-primary border-opacity-25" style="font-size:0.85rem;">
                <p class="mb-1"><span class="text-muted">Modelo:</span> <strong id="modeloSelecionado"></strong></p>
                <p class="mb-2"><span class="text-muted">Quantidade:</span> <strong id="qtdSelecionada"></strong></p>
                <hr class="my-2 border-secondary opacity-25">
                <p class="mb-1 d-flex justify-content-between">
                   <span class="text-muted">Total Parda:</span> 
                   <strong class="text-success fs-6">R$ <span id="totalParda"></span></strong>
                </p>
                <p class="mb-0 d-flex justify-content-between">
                   <span class="text-muted">Total Branca:</span> 
                   <strong class="text-primary fs-6">R$ <span id="totalBranca"></span></strong>
                </p>
              </div>
              <button id="btnCopiar" class="btn btn-sm btn-outline-secondary w-100 mt-2">
                <i class="fa-regular fa-copy me-1"></i> Copiar para Área de Transferência
              </button>
            </div>
          </div>
          <div class="modal-footer border-top-0 bg-light">
            <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="fornecedoresModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-truck-fast me-2 text-info"></i> Gestão de Fornecedores</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-0">
            
            <div class="p-3 bg-white border-bottom">
              <form method="POST" action="/fornecedores/novo">
                <h6 class="fw-bold mb-2" style="font-size:0.85rem;">Adicionar Novo Fornecedor</h6>
                <div class="row g-2">
                  <div class="col-12 col-md-7">
                    <input type="text" name="nome" class="form-control form-control-sm" placeholder="Nome do Fornecedor" required>
                  </div>
                  <div class="col-12 col-md-5">
                    <div class="input-group input-group-sm">
                      <input type="number" step="0.01" name="porcentagem" class="form-control" placeholder="Taxa/Margem" required>
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                  <div class="col-12">
                    <button type="submit" class="btn btn-sm btn-info text-white w-100"><i class="fa-solid fa-plus me-1"></i> Salvar Fornecedor</button>
                  </div>
                </div>
              </form>
            </div>

            <div class="p-0">
              <div class="bg-light p-2 border-bottom">
                 <span class="text-muted fw-bold ms-2" style="font-size:0.75rem;">FORNECEDORES CADASTRADOS</span>
              </div>
              <ul class="list-group list-group-flush">
                ${listaFornecedores}
              </ul>
            </div>

          </div>
          <div class="modal-footer border-top-0 bg-light">
            <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    ${modais}
    ${modaisFornecedores}

    <script>
      (function () {
        const input = document.getElementById("searchInput");
        const btn = document.getElementById("searchBtn");
        const clear = document.getElementById("clearBtn");

        // mantém o valor do input quando voltar da busca
        const params = new URLSearchParams(window.location.search);
        const qAtual = params.get("q") || "";
        if (input) input.value = qAtual;

        if (btn) {
          btn.addEventListener("click", function (e) {
            e.preventDefault(); // Impede o envio padrao se for usar via js, mas como é submit pode deixar nativo 
            const q = (input?.value || "").trim();
            const url = new URL(window.location.href);

            url.searchParams.set("page", "1");

            if (q) url.searchParams.set("q", q);
            else url.searchParams.delete("q");

            window.location.href = url.toString();
          });
        }
      })();
    </script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/script/orcamento.js"></script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = tabelaPrecosView;