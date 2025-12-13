// views/tabelaPrecosView.js
function tabelaPrecosView(
  usuario,
  caixas = [],
  ultimaAlteracao = null,
  fornecedores = [],
  paginacao = {},
  filtros = {} // ✅ ADICIONADO (não remove nada, só adiciona)
) {
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  const menu = usuario.tipo_usuario === "motorista"
    ? `
        <a href="/home"><i class="fas fa-home me-2"></i>Home</a>
        <a href="/checklist-motoristas"><i class="fas fa-clipboard-check me-2"></i>Checklist</a>
  `
    : usuario.tipo_usuario === "financeiro"
      ? `<a href="/tabela-precos"><i class="fas fa-tags me-2"></i>Tabela de Preços</a>`
      : `
        <a href="/home"><i class="fas fa-home me-2"></i>Home</a>
        <a href="/tabela-precos"><i class="fas fa-tags me-2"></i>Tabela de Preços</a>
        <a href="/entregas"><i class="fas fa-truck me-2"></i>Entregas</a>
        <a href="/checklist-motoristas"><i class="fas fa-clipboard-check me-2"></i>Checklist</a>
        <a href="/catalogo"><i class="fas fa-book-open me-2"></i>Catálogo</a>
        <a href="/veiculos"><i class="fas fa-car"></i> Veículos</a>
        <a href="/cadastro"><i class="fas fa-user-plus me-2"></i>Cadastro</a>
  `;

  const dataFormatada = ultimaAlteracao
    ? new Date(ultimaAlteracao.atualizado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : null;

  const alteracaoTexto = ultimaAlteracao
    ? `Última alteração: ${dataFormatada} por ${ultimaAlteracao.atualizado_por}`
    : "Nenhuma alteração registrada ainda";

  const fmt = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const linhas = caixas.map(caixa => {
    const pct = caixa.fornecedor_pct ? Number(caixa.fornecedor_pct) : 0;
    const fator = 1 + pct / 100;

    const precoParda = Number(caixa.preco_parda) * fator;
    const precoBranca = Number(caixa.preco_branca) * fator;

    return `
    <tr>
      <td>${caixa.codigo || "-"}</td>
      <td>${caixa.modelo}</td>
      <td>R$ ${fmt(precoParda)}</td>
      <td>R$ ${fmt(precoBranca)}</td>
      <td>${caixa.fornecedor_nome || "-"}</td>
      <td>
        <button class="btn btn-sm btn-warning" data-bs-toggle="modal" data-bs-target="#editarModal${caixa.id}">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#excluirModal${caixa.id}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `;
  }).join("");

  // ✅ garante que o termo de busca continue nos links da paginação
  const qParam = paginacao.q ? `&q=${encodeURIComponent(paginacao.q)}` : "";


  const paginationHtml = totalPages > 1 ? `
  <nav aria-label="Paginação de caixas" class="mt-3">
    <ul class="pagination justify-content-center">
      <!-- Anterior -->
      <li class="page-item ${page <= 1 ? "disabled" : ""}">
        <a class="page-link" href="/tabela-precos?page=${page - 1}${qParam}">&laquo;</a>
      </li>

      ${Array.from({ length: totalPages }, (_, i) => {
    const p = i + 1;
    return `
          <li class="page-item ${p === page ? "active" : ""}">
            <a class="page-link" href="/tabela-precos?page=${p}${qParam}">${p}</a>
          </li>
        `;
  }).join("")}

      <!-- Próxima -->
      <li class="page-item ${page >= totalPages ? "disabled" : ""}">
        <a class="page-link" href="/tabela-precos?page=${page + 1}${qParam}">&raquo;</a>
      </li>
    </ul>
  </nav>
` : "";


  const modais = caixas.map(caixa => `
    <!-- Modal Editar -->
    <div class="modal fade" id="editarModal${caixa.id}" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form method="POST" action="/tabela-precos/editar/${caixa.id}">
            <div class="modal-header">
              <h5 class="modal-title">Editar Caixa</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <label for="codigo${caixa.id}" class="form-label">Código</label>
              <input type="text" id="codigo${caixa.id}" name="codigo" value="${caixa.codigo || ""}" class="form-control mb-2" placeholder="Código">

              <label for="modelo${caixa.id}" class="form-label">Modelo</label>
              <input type="text" id="modelo${caixa.id}" name="modelo" value="${caixa.modelo}" class="form-control mb-2" placeholder="Modelo" required>

              <label for="parda${caixa.id}" class="form-label">Preço Parda</label>
              <input type="number" step="0.01" id="parda${caixa.id}" name="preco_parda" value="${caixa.preco_parda}" class="form-control mb-2" required>

              <label for="branca${caixa.id}" class="form-label">Preço Branca</label>
              <input type="number" step="0.01" id="branca${caixa.id}" name="preco_branca" value="${caixa.preco_branca}" class="form-control mb-2" required>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Excluir -->
    <div class="modal fade" id="excluirModal${caixa.id}" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form method="POST" action="/tabela-precos/excluir/${caixa.id}">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar Exclusão</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>Tem certeza que deseja excluir a caixa <b>${caixa.modelo}</b>?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-danger">Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `).join("");

  // helpers (antes do return)
  const fmtPct = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const listaFornecedores = (fornecedores && fornecedores.length)
    ? fornecedores.map(f => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <b>${f.nome}</b> — ${fmtPct(f.porcentagem)}%
        </div>
        <div class="btn-group">
          <button class="btn btn-sm btn-warning" data-bs-toggle="modal" data-bs-target="#editarFornecedorModal${f.id}" title="Editar">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#excluirFornecedorModal${f.id}" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </li>
    `).join("")
    : "<li class='list-group-item text-muted'>Nenhum fornecedor cadastrado.</li>";

  const modaisFornecedores = (fornecedores && fornecedores.length)
    ? fornecedores.map(f => `
      <!-- Modal Editar Fornecedor -->
      <div class="modal fade" id="editarFornecedorModal${f.id}" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form method="POST" action="/fornecedores/editar/${f.id}">
              <div class="modal-header">
                <h5 class="modal-title">Editar Fornecedor</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <label class="form-label">Nome</label>
                <input type="text" name="nome" class="form-control mb-2" value="${f.nome}" required>
                <label class="form-label">Porcentagem (%)</label>
                <input type="number" step="0.01" name="porcentagem" class="form-control" value="${f.porcentagem}" required>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modal Excluir Fornecedor -->
      <div class="modal fade" id="excluirFornecedorModal${f.id}" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form method="POST" action="/fornecedores/excluir/${f.id}">
              <div class="modal-header">
                <h5 class="modal-title">Excluir Fornecedor</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                Tem certeza que deseja excluir o fornecedor <b>${f.nome}</b>?
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-danger">Excluir</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `).join("")
    : "";

  const fornecedoresOptions = (fornecedores && fornecedores.length)
    ? fornecedores.map(f => `<option value="${f.id}">${f.nome} (${f.porcentagem}%)</option>`).join("")
    : '<option value="">Nenhum fornecedor cadastrado</option>';

  const opcoes = caixas.map(caixa => `
    <option value="${caixa.id}" data-parda="${caixa.preco_parda}" data-branca="${caixa.preco_branca}">
      ${caixa.modelo}
    </option>
  `).join("");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tabela de Preços</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      body { 
        display: flex; 
        height: 100vh; 
        margin: 0; 
      }

            .sidebar { 
              width: 220px; 
              background-color: #0D5749; 
              color: white; 
              padding: 20px; 
              transition: all 0.3s ease-in-out; /* anima sidebar */
            }
            
            .sidebar a { 
              display: block; 
              padding: 10px; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin-bottom: 10px; 
              transition: background-color 0.2s ease-in-out; /* hover suave */
            }
            
            .sidebar a:hover { 
              background-color: #083930ff; 
            }

            .content { 
              flex: 1; 
              padding: 20px; 
            }

            .offcanvas {
              transition: transform 0.4s ease-in-out, opacity 0.3s ease-in-out;
            }

            .table{
              font-size: small;
              text-align: center;
              vertical-align: baseline;
            }

            /* No mobile */
            @media (max-width: 767.98px) {
            body {
                flex-direction: column;
            }
            .sidebar {
                display: none; /* sidebar some */
            }
            .content {
                width: 100%;
                padding: 15px;
            }
            }

            .offcanvas-body a {
                display: block;
                text-align: center;
                width: 100%;
                padding: 10px;
                color: white;
                text-decoration: none;
                }

                .offcanvas-body a:hover {
                background-color: #495057;
                border-radius: 5px;
            }
            .usuario-badge {
              background-color: #0D5749;
              color: #ffffff;
              padding: 3px 12px;
              border-radius: 8px;      /* bordas arredondadas */
              border: 2px solid #0D5749;
            }
    </style>
  </head>
  <body>
    <!-- PRELOADER -->
    <div id="preloader" style="
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity .3s ease;
    ">
        <div class="spinner-border text-success" role="status" style="width: 4rem; height: 4rem;">
            <span class="visually-hidden">Carregando...</span>
        </div>
    </div>

      <!-- Sidebar -->
      <div class="sidebar">
        <div class="text-center">
          <img src="/img/logo-branca.png" alt="Logo da Empresa" class="img-fluid mb-3" style="max-width:150px;">
        </div>
        <hr class="bg-light">
        ${menu}
    </div>

    <!-- Sidebar mobile -->
    <div class="offcanvas offcanvas-start bg-dark text-white" tabindex="-1" id="sidebarMenu">
    <div class="offcanvas-header">
        <h5 class="offcanvas-title">Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body text-center d-flex flex-column align-items-center">
        <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid mb-4" style="max-width:150px;">
        <hr class="bg-light w-100">
        ${menu}
    </div>
    </div>


      <!-- Conteúdo -->
      <div class="content">
      <button class="btn btn-outline-dark d-md-none mb-3" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">
            ☰ Menu
        </button>
        
        <div class="d-flex align-items-center justify-content-between mb-3">
            <h2 class="mb-0">Tabela de Preços</h2>
            <div class="mr-2 d-flex align-items-center gap-3">
              <span class="usuario-badge">
                <i class="fa-solid fa-user"></i> ${usuario.nome}
              </span>
              <a href="/logout" class="text-danger">
                <i class="fas fa-sign-out-alt me-2"></i>Sair
              </a>
            </div>
        </div>

        <hr class="bg-light w-100">

        <p class="text-muted mb-4"><small>${alteracaoTexto}</small></p>

        <!-- Container que alinha horizontalmente -->
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">

          <!-- COLUNA ESQUERDA: Botões -->
          <div class="d-flex align-items-center gap-2">

            <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#novaCaixaModal">
              <i class="fa-solid fa-box"></i> Nova Caixa
            </button>

            ${caixas.length > 0 ? `
              <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#orcamentoModal">
                <i class="fa-solid fa-file-invoice-dollar"></i> Gerar Orçamento
              </button>
            ` : ""}

            <button class="btn btn-info" data-bs-toggle="modal" data-bs-target="#fornecedoresModal">
              <i class="fa-solid fa-truck"></i> Fornecedores
            </button>

          </div>

          <!-- ✅ COLUNA DIREITA: Campo de busca (AGORA ENVIA PRO BACKEND) -->
          <form class="input-group" style="max-width: 500px; width: 100%;" method="GET" action="/tabela-precos">
            <input
              type="text"
              id="searchInput"
              name="q"
              class="form-control"
              placeholder="Pesquisar por código, modelo ou fornecedor..."
              value="${(filtros && filtros.q) ? filtros.q : ""}"
            >
            <button id="searchBtn" type="submit" class="btn btn-primary">Pesquisar</button>
            <a id="clearBtn" href="/tabela-precos" class="btn btn-secondary">Limpar</a>
          </form>

        </div>

        <div class="mb-3">
        <table class="table table-bordered table-striped" id="caixasTable">
          <thead>
            <tr>
              <th>Código</th>
              <th>Modelo</th>
              <th>Preço Parda</th>
              <th>Preço Branca</th>
              <th>Fornecedor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${linhas || "<tr><td colspan='6' class='text-center'>Nenhuma caixa cadastrada</td></tr>"}
          </tbody>
        </table>

        ${paginationHtml}

        <!-- Modais Editar/Excluir -->
        ${modais}
      </div>

      <!-- Modal Nova Caixa -->
      <div class="modal fade" id="novaCaixaModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form method="POST" action="/tabela-precos/nova">
              <div class="modal-header">
                <h5 class="modal-title">Nova Caixa</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <input type="text" name="codigo" class="form-control mb-2" placeholder="Código (opcional)">
                <input type="text" name="modelo" class="form-control mb-2" placeholder="Modelo" required>
                <input type="number" step="0.01" name="preco_parda" class="form-control mb-2" placeholder="Preço Parda" required>
                <input type="number" step="0.01" name="preco_branca" class="form-control mb-2" placeholder="Preço Branca" required>
                
                <label class="form-label">Fornecedor</label>
                <select name="fornecedor_id" class="form-select mb-2" required>
                  <option value="">-- Selecione um fornecedor --</option>
                  ${fornecedoresOptions}
                </select>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modal Orçamento -->
      <div class="modal fade" id="orcamentoModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Gerar Orçamento</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <label for="selectCaixa" class="form-label">Selecione a Caixa</label>
              <select id="selectCaixa" class="form-select mb-3">
                <option value="">-- Escolha uma caixa --</option>
                ${opcoes}
              </select>

              <div id="precos" style="display:none;">
                <p><b>Preço Parda:</b> R$ <span id="precoParda"></span></p>
                <p><b>Preço Branca:</b> R$ <span id="precoBranca"></span></p>
              </div>

              <label for="quantidade" class="form-label">Quantidade</label>
              <input type="number" id="quantidade" class="form-control mb-3" min="1">

              <button id="btnGerar" class="btn btn-success">Gerar Orçamento</button>

              <div id="resultado" class="mt-3" style="display:none;">
                <hr>
                <h6>Resultado:</h6>
                <p><b>Modelo:</b> <span id="modeloSelecionado"></span></p>
                <p><b>Quantidade:</b> <span id="qtdSelecionada"></span></p>
                <p><b>Total Parda:</b> R$ <span id="totalParda"></span></p>
                <p><b>Total Branca:</b> R$ <span id="totalBranca"></span></p>
                <button id="btnCopiar" class="btn btn-outline-secondary btn-sm mt-2">📋 Copiar Orçamento</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Fornecedores (apenas lista e formulário) -->
      <div class="modal fade" id="fornecedoresModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Fornecedores</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">

              <!-- Formulário para novo fornecedor -->
              <form method="POST" action="/fornecedores/novo" class="mb-3">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Nome do Fornecedor</label>
                    <input type="text" name="nome" class="form-control" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Porcentagem (%)</label>
                    <input type="number" step="0.01" name="porcentagem" class="form-control" required>
                  </div>
                </div>
                <div class="mt-3">
                  <button type="submit" class="btn btn-primary">Adicionar Fornecedor</button>
                </div>
              </form>

              <hr>

              <!-- Lista de fornecedores -->
              <h6>Fornecedores cadastrados:</h6>
              <ul class="list-group">
                ${listaFornecedores}
              </ul>

            </div>
          </div>
        </div>
      </div>
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
      btn.addEventListener("click", function () {
        const q = (input?.value || "").trim();
        const url = new URL(window.location.href);

        // sempre volta pra página 1 quando pesquisar
        url.searchParams.set("page", "1");

        if (q) url.searchParams.set("q", q);
        else url.searchParams.delete("q");

        window.location.href = url.toString();
      });
    }

    if (clear) {
      clear.addEventListener("click", function () {
        window.location.href = "/tabela-precos";
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