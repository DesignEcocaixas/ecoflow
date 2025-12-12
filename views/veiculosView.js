// views/veiculosView.js
function veiculosView(usuario, veiculos = [], checklistsMap = {}) {
  const fmtKM = (n) => Number(n || 0).toLocaleString("pt-BR");
  const fmtMoeda = (n) =>
    Number(n || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const fmtData = (d) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("pt-BR");
    } catch {
      return d;
    }
  };

  // Acumuladores de modais (fora dos modais de lista)
  const modaisDetalheEditarExcluir = [];
  const modaisNovoChecklist = [];
  const veiculoIds = [];

  const cards = veiculos.length
    ? veiculos
      .map((v) => {
        veiculoIds.push(v.id);
        const checks = checklistsMap[v.id] || [];

        // Lista de checklists (somente os cards + botões; sem modais aqui)
        const listaChecks =
          checks.length > 0
            ? checks
              .map((c) => {
                const servicoTitulo =
                  (c.servico || "").length > 60
                    ? `${c.servico.slice(0, 60)}…`
                    : (c.servico || "");

                // --- Modal de Detalhes (fora do modal de lista) ---
                modaisDetalheEditarExcluir.push(`
                      <div class="modal fade" id="detalheChecklist${c.id}" tabindex="-1">
                        <div class="modal-dialog">
                          <div class="modal-content">
                            <div class="modal-header">
                              <h5 class="modal-title">Checklist — ${v.marca} ${v.modelo} (${v.ano})</h5>
                              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                              <p class="mb-2"><b>Serviço:</b><br>${(c.servico || "").replace(/\n/g, "<br>")}</p>
                              <p class="mb-1"><b>Oficina:</b> ${c.oficina}</p>
                              <p class="mb-1"><b>Mecânico:</b> ${c.mecanico}</p>
                              <p class="mb-1"><b>Valor:</b> R$ ${fmtMoeda(c.valor)}</p>
                              <p class="mb-1"><b>Data:</b> ${fmtData(c.data_servico)}</p>
                              <p class="mb-2"><b>KM:</b> ${fmtKM(c.km_servico)}</p>
                              ${c.documento
                    ? `<a class="btn btn-sm btn-success" href="/uploads/${c.documento}" target="_blank"><i class="fa-solid fa-paperclip"></i> Documento</a>`
                    : `<span class="text-muted">Sem documento</span>`
                  }
                            </div>
                            <div class="modal-footer">
                              <button class="btn btn-warning" data-bs-toggle="modal" data-bs-target="#editarChecklist${c.id}" data-bs-dismiss="modal">
                                <i class="fa-solid fa-pen-to-square"></i> Editar
                              </button>
                              <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#excluirChecklist${c.id}" data-bs-dismiss="modal">
                                <i class="fa-solid fa-trash"></i> Excluir
                              </button>
                              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    `);

                // --- Modal de Edição (fora do modal de lista) ---
                modaisDetalheEditarExcluir.push(`
                      <div class="modal fade" id="editarChecklist${c.id}" tabindex="-1">
                        <div class="modal-dialog">
                          <div class="modal-content">
                            <form method="POST" action="/veiculos/checklists/editar/${c.id}" enctype="multipart/form-data">
                              <div class="modal-header">
                                <h5 class="modal-title">Editar Checklist</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                              </div>
                              <div class="modal-body">
                                <label class="form-label">Serviço (descrição)</label>
                                <textarea name="servico" class="form-control mb-2" rows="3" required>${c.servico || ""}</textarea>

                                <label class="form-label">Oficina</label>
                                <input type="text" name="oficina" class="form-control mb-2" value="${c.oficina}" required>

                                <label class="form-label">Mecânico</label>
                                <input type="text" name="mecanico" class="form-control mb-2" value="${c.mecanico}" required>

                                <label class="form-label">Valor do serviço</label>
                                <input type="number" step="0.01" name="valor" class="form-control mb-2" value="${c.valor}" required>

                                <label class="form-label">Data do serviço</label>
                                <input type="date" name="data_servico" class="form-control mb-2" value="${String(c.data_servico).slice(0, 10)}" required>

                                <label class="form-label">KM do serviço</label>
                                <input type="number" name="km_servico" class="form-control mb-3" value="${c.km_servico}" required>

                                <label class="form-label">Substituir documento (opcional)</label>
                                <input type="file" name="documento" class="form-control">
                              </div>
                              <div class="modal-footer">
                                <button type="submit" class="btn btn-primary">Salvar</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    `);

                // --- Modal de Exclusão (fora do modal de lista) ---
                modaisDetalheEditarExcluir.push(`
                      <div class="modal fade" id="excluirChecklist${c.id}" tabindex="-1">
                        <div class="modal-dialog">
                          <div class="modal-content">
                            <form method="POST" action="/veiculos/checklists/excluir/${c.id}">
                              <div class="modal-header">
                                <h5 class="modal-title">Excluir Checklist</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                              </div>
                              <div class="modal-body">
                                Tem certeza que deseja excluir este checklist?
                              </div>
                              <div class="modal-footer">
                                <button type="submit" class="btn btn-danger">Excluir</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    `);

                // Card da lista de checklists (agora com SERVIÇO no título)
                // Inclui data-* para a busca
                return `
                      <div
                        class="card mb-2 chk-item"
                        data-servico="${(c.servico || "").toLowerCase()}"
                        data-oficina="${(c.oficina || "").toLowerCase()}"
                        data-mecanico="${(c.mecanico || "").toLowerCase()}"
                        data-data="${(fmtData(c.data_servico) || "").toLowerCase()}"
                        data-valor="${String(c.valor || "").toLowerCase()}"
                        data-km="${String(c.km_servico || "").toLowerCase()}"
                      >
                        <div class="card-body p-2 d-flex justify-content-between align-items-center">
                          <div>
                            <strong>${servicoTitulo || "Serviço"}</strong>
                            <div class="text-muted"><small>${fmtData(c.data_servico)}</small></div>
                          </div>
                          <button
                            class="btn btn-sm btn-outline-primary"
                            data-bs-toggle="modal"
                            data-bs-target="#detalheChecklist${c.id}"
                            data-bs-dismiss="modal"
                            title="Ver detalhes"
                          >
                            <i class="fa-solid fa-eye"></i>
                          </button>
                        </div>
                      </div>
                    `;
              })
              .join("")
            : `<p class="text-muted mb-0">Nenhum checklist para este veículo.</p>`;

        // Modal: Novo Checklist (fora do modal de lista)
        modaisNovoChecklist.push(`
            <div class="modal fade" id="novoChecklistVeiculo${v.id}" tabindex="-1">
              <div class="modal-dialog">
                <div class="modal-content">
                  <form method="POST" action="/veiculos/${v.id}/checklists/novo" enctype="multipart/form-data">
                    <div class="modal-header">
                      <h5 class="modal-title">Novo Checklist — ${v.marca} ${v.modelo} (${v.ano})</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                      <label class="form-label">Serviço (descrição)</label>
                      <textarea name="servico" class="form-control mb-2" rows="3" required></textarea>

                      <label class="form-label">Oficina</label>
                      <input type="text" name="oficina" class="form-control mb-2" required>

                      <label class="form-label">Mecânico</label>
                      <input type="text" name="mecanico" class="form-control mb-2" required>

                      <label class="form-label">Valor do serviço</label>
                      <input type="number" step="0.01" name="valor" class="form-control mb-2" required>

                      <label class="form-label">Data do serviço</label>
                      <input type="date" name="data_servico" class="form-control mb-2" required>

                      <label class="form-label">KM do serviço</label>
                      <input type="number" name="km_servico" class="form-control mb-3" required>

                      <label class="form-label">Anexar documento (opcional)</label>
                      <input type="file" name="documento" class="form-control">
                    </div>
                    <div class="modal-footer">
                      <button type="submit" class="btn btn-primary">Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          `);

        // Card do veículo + Modal de Lista (com barra de busca + botões)
        return `
            <div class="col-12 col-md-6 col-lg-4">
              <div class="card shadow-sm mb-3 h-100">
                <img src="${v.foto ? `/uploads/${v.foto}` : `/img/vehicle_placeholder.png`
          }" 
                    alt="${v.marca} ${v.modelo}" class="card-img-top" 
                    style="max-height:180px; object-fit:cover;">
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title mb-1">${v.marca} ${v.modelo} (${v.ano})</h5>
                  <p class="text-muted mb-3"><small>KM: ${fmtKM(v.km)}</small></p>
                  <div class="mt-auto d-flex justify-content-between">
                    <button class="btn btn-sm btn-success" data-bs-toggle="modal" data-bs-target="#checklistsVeiculo${v.id}" title="Checklists">
                      <i class="fa-solid fa-clipboard-check"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" data-bs-toggle="modal" data-bs-target="#editarVeiculo${v.id}" title="Editar">
                      <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#excluirVeiculo${v.id}" title="Excluir">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal: Lista de checklists + botão Novo + Busca -->
            <div class="modal fade" id="checklistsVeiculo${v.id}" tabindex="-1">
              <div class="modal-dialog modal-lg">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Checklists — ${v.marca} ${v.modelo} (${v.ano})</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body">
                    <div class="row g-2 mb-3">
                      <div class="col-12 col-md">
                        <input type="text" id="searchInputV${v.id}" class="form-control" placeholder="Pesquisar serviço, oficina, mecânico, data, valor ou KM...">
                      </div>
                      <div class="col-auto">
                        <button class="btn btn-primary" id="searchBtnV${v.id}" data-search-vid="${v.id}">
                          <i class="fa-solid fa-magnifying-glass"></i> Pesquisar
                        </button>
                      </div>
                      <div class="col-auto">
                        <button class="btn btn-secondary" id="clearBtnV${v.id}" data-clear-vid="${v.id}">
                          <i class="fa-solid fa-eraser"></i> Limpar
                        </button>
                      </div>
                      <div class="col ms-auto text-end">
                        <button
                          class="btn btn-success"
                          data-bs-toggle="modal"
                          data-bs-target="#novoChecklistVeiculo${v.id}"
                          data-bs-dismiss="modal"
                        >
                          <i class="fa-solid fa-plus"></i> Novo checklist
                        </button>
                      </div>
                    </div>

                    <div id="checksListV${v.id}">
                      ${listaChecks}
                    </div>

                    <div id="noResultV${v.id}" class="d-none">
                      <div class="alert alert-warning mb-0">Nenhum resultado encontrado.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modais de editar/excluir veículo (inalterados) -->
            <div class="modal fade" id="editarVeiculo${v.id}" tabindex="-1">
              <div class="modal-dialog">
                <div class="modal-content">
                  <form method="POST" action="/veiculos/editar/${v.id}" enctype="multipart/form-data">
                    <div class="modal-header">
                      <h5 class="modal-title">Editar Veículo</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                      <label class="form-label">Marca</label>
                      <input type="text" name="marca" class="form-control mb-2" value="${v.marca}" required>
                      <label class="form-label">Modelo</label>
                      <input type="text" name="modelo" class="form-control mb-2" value="${v.modelo}" required>
                      <label class="form-label">Ano</label>
                      <input type="number" name="ano" class="form-control mb-2" value="${v.ano}" required>
                      <label class="form-label">KM</label>
                      <input type="number" name="km" class="form-control mb-2" value="${v.km}" required>

                      <label class="form-label">Foto (opcional)</label>
                      <input type="file" name="foto" class="form-control">
                      ${v.foto ? `<small class="text-muted">Foto atual: ${v.foto}</small>` : ""}
                    </div>
                    <div class="modal-footer">
                      <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div class="modal fade" id="excluirVeiculo${v.id}" tabindex="-1">
              <div class="modal-dialog">
                <div class="modal-content">
                  <form method="POST" action="/veiculos/excluir/${v.id}">
                    <div class="modal-header">
                      <h5 class="modal-title">Excluir Veículo</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                      Tem certeza que deseja excluir o veículo <b>${v.marca} ${v.modelo} (${v.ano})</b>?
                    </div>
                    <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                      <button type="submit" class="btn btn-danger">Excluir</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          `;
      })
      .join("")
    : `<p class="text-muted">Nenhum veículo cadastrado.</p>`;

  const menu = usuario.tipo_usuario === "motorista"
    ? `
        <a href="/home"><i class="fas fa-home me-2"></i>Home</a>
        <a href="/checklist-motoristas"><i class="fas fa-clipboard-check me-2"></i>Checklist</a>
  `
    : usuario.tipo_usuario === "financeiro"
      ? `<a href="/tabela-precos">Tabela de Preços</a>`
      : `
        <a href="/home"><i class="fas fa-home me-2"></i>Home</a>
        <a href="/tabela-precos"><i class="fas fa-tags me-2"></i>Tabela de Preços</a>
        <a href="/entregas"><i class="fas fa-truck me-2"></i>Entregas</a>
        <a href="/checklist-motoristas"><i class="fas fa-clipboard-check me-2"></i>Checklist</a>
        <a href="/catalogo"><i class="fas fa-book-open me-2"></i>Catálogo</a>
        <a href="/veiculos"><i class="fas fa-car"></i> Veículos</a>
        <a href="/cadastro"><i class="fas fa-user-plus me-2"></i>Cadastro</a>
  `;

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Veículos</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      body { display: flex; height: 100vh; margin: 0; }
      .sidebar { width: 220px; background-color: #0D5749; color: white; padding: 20px; }
      .sidebar a { display: block; padding: 10px; color: white; text-decoration: none; border-radius: 5px; margin-bottom: 10px; }
      .sidebar a:hover { background-color: #083930ff; }
      .content { flex: 1; padding: 20px; overflow-y: auto; }
      .topbar { display: flex; justify-content: flex-end; align-items: center; margin-bottom: 10px; }
      .offcanvas { transition: transform 0.4s ease-in-out, opacity 0.3s ease-in-out; }
      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 15px; }
      }
        .offcanvas-body a {
    display: block;             /* garante que cada link ocupe toda a linha */
    text-align: center;         /* centraliza o texto */
    text-decoration: none !important;
    color: inherit;
    margin: 8px 0;              /* espaço entre os links */
  }

  .offcanvas-body a:hover {
    background-color: #495057;  /* opcional: destaca no hover */
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

    <!-- Sidebar desktop -->
    <div class="sidebar d-none d-md-block">
      <div class="text-center">
        <img src="/img/logo-branca.png" alt="Logo da Empresa" class="img-fluid mb-3" style="max-width:150px;">
      </div>
      <hr>
      ${menu}
    </div>

    <!-- Sidebar mobile -->
    <div class="offcanvas offcanvas-start bg-dark text-white" tabindex="-1" id="sidebarMenu">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title">Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body text-center">
        <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid mb-4" style="max-width:150px;">
        <hr class="bg-light">
        ${menu}
        <hr class="bg-light">
        <a href="/logout" class="d-block text-danger">Sair</a>
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between">
        <button class="btn btn-outline-dark d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">☰ Menu</button>
      </div>

      <div class="d-flex align-items-center justify-content-between mb-3">
            <h2 class="mb-0">Veículos</h2>
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

      <!-- Botão: Novo veículo -->
      <button class="btn btn-success mb-3" data-bs-toggle="modal" data-bs-target="#novoVeiculoModal">
        <i class="fa-solid fa-car"></i> Novo Veículo
      </button>

      <div class="row">
        ${cards}
      </div>
    </div>

    <!-- Modal: Novo Veículo -->
    <div class="modal fade" id="novoVeiculoModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form method="POST" action="/veiculos/novo" enctype="multipart/form-data">
            <div class="modal-header">
              <h5 class="modal-title">Cadastrar Novo Veículo</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <label class="form-label">Marca</label>
              <input type="text" name="marca" class="form-control mb-2" required>
              <label class="form-label">Modelo</label>
              <input type="text" name="modelo" class="form-control mb-2" required>
              <label class="form-label">Ano</label>
              <input type="number" name="ano" class="form-control mb-2" required>
              <label class="form-label">KM</label>
              <input type="number" name="km" class="form-control mb-2" required>
              <label class="form-label">Foto (opcional)</label>
              <input type="file" name="foto" class="form-control">
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modais fora dos modais de lista -->
    ${modaisNovoChecklist.join("")}
    ${modaisDetalheEditarExcluir.join("")}

    <!-- Bootstrap -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Script de busca por veículo (Pesquisa/ Limpar) -->
    <script>
      (function() {
        const ids = ${JSON.stringify(veiculoIds)};
        ids.forEach((vid) => {
          const input = document.getElementById("searchInputV" + vid);
          const btnSearch = document.getElementById("searchBtnV" + vid);
          const btnClear = document.getElementById("clearBtnV" + vid);
          const list = document.getElementById("checksListV" + vid);
          const noResult = document.getElementById("noResultV" + vid);

          if (!input || !btnSearch || !btnClear || !list) return;

          function doSearch() {
            const term = (input.value || "").toLowerCase().trim();
            const items = list.querySelectorAll(".chk-item");

            if (!items.length) return;

            let found = 0;
            items.forEach((el) => {
              if (!term) {
                el.classList.remove("d-none");
                found++;
                return;
              }
              const hay =
                (el.dataset.servico || "") + " " +
                (el.dataset.oficina || "") + " " +
                (el.dataset.mecanico || "") + " " +
                (el.dataset.data || "") + " " +
                (el.dataset.valor || "") + " " +
                (el.dataset.km || "");

              if (hay.indexOf(term) !== -1) {
                el.classList.remove("d-none");
                found++;
              } else {
                el.classList.add("d-none");
              }
            });

            if (noResult) {
              if (found === 0) noResult.classList.remove("d-none");
              else noResult.classList.add("d-none");
            }
          }

          function clearSearch() {
            input.value = "";
            const items = list.querySelectorAll(".chk-item");
            items.forEach((el) => el.classList.remove("d-none"));
            if (noResult) noResult.classList.add("d-none");
          }

          btnSearch.addEventListener("click", (e) => {
            e.preventDefault();
            doSearch();
          });

          btnClear.addEventListener("click", (e) => {
            e.preventDefault();
            clearSearch();
          });

          // Enter no input -> pesquisar
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              doSearch();
            }
          });
        });
      })();
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = veiculosView;