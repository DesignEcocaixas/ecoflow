// views/entregasView.js
function entregasView(usuario, pedidos = [], clientesMap = {}, filtros = {}, paginacao = {}) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  // paginação
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  const menu =
    user.tipo_usuario === "motorista"
      ? `<a href="/home"><i class="fas fa-home me-2"></i>Home</a>
                <a href="/checklist-motoristas"><i class="fas fa-clipboard-check me-2"></i>Checklist</a>
                <a href="/entregas"><i class="fa-solid fa-route me-2"></i>Rotas</a>`
      : user.tipo_usuario === "financeiro"
        ? `<a href="/tabela-precos">Tabela de Preços</a>`
        : `
        <a href="/home"><i class="fas fa-home me-2"></i>Home</a>
        <a href="/tabela-precos"><i class="fas fa-tags me-2"></i>Tabela de Preços</a>
        <a href="/entregas"><i class="fa-solid fa-route me-2"></i>Rotas</a>
        <a href="/checklist-motoristas"><i class="fas fa-clipboard-check me-2"></i>Checklist</a>
        <a href="/catalogo"><i class="fas fa-book-open me-2"></i>Catálogo</a>
        <a href="/veiculos"><i class="fas fa-car"></i> Veículos</a>
        <a href="/cadastro"><i class="fas fa-user-plus me-2"></i>Cadastro</a>
    `;

  const fmtData = (d) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("pt-BR");
    } catch {
      return d || "-";
    }
  };

  // Acumulador para modais de clientes (editar/excluir) fora dos modais de pedidos
  const clienteModals = [];

  const cards =
    pedidos.length > 0
      ? pedidos
        .map((p) => {
          const clientes = clientesMap[p.id] || [];

          const listaClientes =
            clientes.length > 0
              ? clientes
                .map((c) => {
                  const badge =
                    c.status === "ENTREGUE"
                      ? `<span class="badge bg-success">Entregue</span>`
                      : c.status === "NA_ROTA"
                        ? `<span class="badge bg-warning text-dark">Na rota para entrega</span>`
                        : `<span class="badge bg-danger">Não entregue</span>`;
                  const obs =
                    c.observacao && c.observacao.trim() !== ""
                      ? c.observacao.replace(/\n/g, "<br>")
                      : "<em class='text-muted'>Sem observação</em>";

                  // Card do cliente (aparece dentro do modal do pedido)
                  const clienteCard = `
                                    <div class="card mb-2 chk-cliente">
                                      <div class="card-body p-2">
                                        <div class="d-flex justify-content-between align-items-center">
                                          <div>
                                            <strong>${c.cliente_nome}</strong> — ${badge}
                                            <div class="text-muted">
                                              <small>Atualizado por ${c.atualizado_por} em ${fmtData(c.atualizado_em)}</small>
                                            </div>
                                          </div>
                                          <div>
                                            <button
                                              class="btn btn-sm btn-warning"
                                              data-bs-toggle="modal"
                                              data-bs-target="#editarCliente${c.id}"
                                              title="Editar"
                                            >
                                              <i class="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button
                                              class="btn btn-sm btn-danger"
                                              data-bs-toggle="modal"
                                              data-bs-target="#excluirCliente${c.id}"
                                              title="Excluir"
                                            >
                                              <i class="fa-solid fa-trash"></i>
                                            </button>
                                          </div>
                                        </div>
                                        <div class="mt-2 small">${obs}</div>
                                      </div>
                                    </div>
                                  `;

                  // Modal EDITAR cliente (fora do modal de pedido)
                  const modalEditar = `
                                    <div class="modal fade" id="editarCliente${c.id}" tabindex="-1">
                                      <div class="modal-dialog">
                                        <div class="modal-content">
                                          <form method="POST" action="/entregas/clientes/editar/${c.id}">
                                            <div class="modal-header">
                                              <h5 class="modal-title">Editar Cliente</h5>
                                              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                            </div>
                                            <div class="modal-body">
                                              <label class="form-label">Cliente</label>
                                              <input type="text" name="cliente_nome" class="form-control mb-2" value="${c.cliente_nome}" required>

                                              <label class="form-label">Status</label>
                                              <select name="status" class="form-select mb-2" required>
                                                <option value="ENTREGUE" ${c.status === "ENTREGUE" ? "selected" : ""}>Entregue</option>
                                                <option value="NA_ROTA" ${c.status === "NA_ROTA" ? "selected" : ""}>Na rota para entrega</option>
                                                <option value="NAO_ENTREGUE" ${c.status === "NAO_ENTREGUE" ? "selected" : ""}>Não entregue</option>
                                              </select>

                                              <label class="form-label">Observação (opcional)</label>
                                              <textarea name="observacao" class="form-control" rows="3">${c.observacao || ""}</textarea>
                                            </div>
                                            <div class="modal-footer">
                                              <button type="submit" class="btn btn-primary">Salvar</button>
                                              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                            </div>
                                          </form>
                                        </div>
                                      </div>
                                    </div>
                                  `;

                  // Modal EXCLUIR cliente (fora do modal de pedido)
                  const modalExcluir = `
                                    <div class="modal fade" id="excluirCliente${c.id}" tabindex="-1">
                                      <div class="modal-dialog">
                                        <div class="modal-content">
                                          <form method="POST" action="/entregas/clientes/excluir/${c.id}">
                                            <div class="modal-header">
                                              <h5 class="modal-title">Excluir Cliente</h5>
                                              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                            </div>
                                            <div class="modal-body">
                                              Tem certeza que deseja excluir o cliente <b>${c.cliente_nome}</b> deste pedido?
                                            </div>
                                            <div class="modal-footer">
                                              <button type="submit" class="btn btn-danger">Excluir</button>
                                              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                            </div>
                                          </form>
                                        </div>
                                      </div>
                                    </div>
                                  `;

                  // Guardamos os modais para renderizar fora do modal de pedido
                  clienteModals.push(modalEditar, modalExcluir);

                  return clienteCard;
                })
                .join("")
              : `<p class="text-muted">Nenhum cliente neste pedido.</p>`;

          return `
              <div class="col-12 col-md-6 col-lg-4">
                <div class="card shadow-sm mb-3 h-100">
                  <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-1">${p.titulo}</h5>
                    <p class="text-muted mb-3">
                      <small>Data: ${fmtData(p.data_pedido)} • Criado por ${p.criado_por}</small>
                    </p>
                    <div class="mt-auto d-flex justify-content-between">
                      <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#pedidoModal${p.id}">
                        <i class="fa-solid fa-folder-open"></i> Abrir
                      </button>
                      <button class="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#excluirPedido${p.id}">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modal Pedido: lista clientes + adicionar -->
              <div class="modal fade" id="pedidoModal${p.id}" tabindex="-1">
                <div class="modal-dialog modal-lg">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Pedido: ${p.titulo} (${fmtData(p.data_pedido)})</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                      <div class="d-flex justify-content-end mb-3">
                        <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#novoCliente${p.id}">
                          <i class="fa-solid fa-user-plus"></i> Novo cliente
                        </button>
                      </div>
                      ${listaClientes}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modal: Novo Cliente no Pedido -->
              <div class="modal fade" id="novoCliente${p.id}" tabindex="-1">
                <div class="modal-dialog">
                  <div class="modal-content">
                    <form method="POST" action="/entregas/${p.id}/clientes/novo">
                      <div class="modal-header">
                        <h5 class="modal-title">Adicionar Cliente — ${p.titulo}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body">
                        <label class="form-label">Nome do Cliente</label>
                        <input type="text" name="cliente_nome" class="form-control mb-2" required>

                        <label class="form-label">Status</label>
                        <select name="status" class="form-select mb-2" required>
                          <option value="NA_ROTA" selected>Na rota para entrega</option>
                          <option value="ENTREGUE">Entregue</option>
                          <option value="NAO_ENTREGUE">Não entregue</option>
                        </select>

                        <label class="form-label">Observação (opcional)</label>
                        <textarea name="observacao" class="form-control" rows="3"></textarea>
                      </div>
                      <div class="modal-footer">
                        <button type="submit" class="btn btn-primary">Salvar</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <!-- Modal: Excluir Pedido -->
              <div class="modal fade" id="excluirPedido${p.id}" tabindex="-1">
                <div class="modal-dialog">
                  <div class="modal-content">
                    <form method="POST" action="/entregas/${p.id}/excluir">
                      <div class="modal-header">
                        <h5 class="modal-title">Excluir Pedido</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body">
                        Tem certeza que deseja excluir o pedido <b>${p.titulo}</b>?
                      </div>
                      <div class="modal-footer">
                        <button type="submit" class="btn btn-danger">Excluir</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            `;
        })
        .join("")
      : `<p class="text-muted">Nenhum pedido criado.</p>`;

  // HTML da paginação
  const paginationHtml = totalPages > 1 ? `
      <nav aria-label="Paginação de pedidos" class="mt-3">
        <ul class="pagination justify-content-center">
          <!-- Anterior -->
          <li class="page-item ${page <= 1 ? "disabled" : ""}">
            <a class="page-link" href="/entregas?page=${page - 1}&titulo=${encodeURIComponent(filtros.titulo || "")}&data_inicio=${encodeURIComponent(filtros.data_inicio || "")}&data_fim=${encodeURIComponent(filtros.data_fim || "")}">&laquo;</a>
          </li>

          ${Array.from({ length: totalPages }, (_, i) => {
    const p = i + 1;
    return `
              <li class="page-item ${p === page ? "active" : ""}">
                <a class="page-link" href="/entregas?page=${p}&titulo=${encodeURIComponent(filtros.titulo || "")}&data_inicio=${encodeURIComponent(filtros.data_inicio || "")}&data_fim=${encodeURIComponent(filtros.data_fim || "")}">${p}</a>
              </li>
            `;
  }).join("")}

          <!-- Próxima -->
          <li class="page-item ${page >= totalPages ? "disabled" : ""}">
            <a class="page-link" href="/entregas?page=${page + 1}&titulo=${encodeURIComponent(filtros.titulo || "")}&data_inicio=${encodeURIComponent(filtros.data_inicio || "")}&data_fim=${encodeURIComponent(filtros.data_fim || "")}">&raquo;</a>
          </li>
        </ul>
      </nav>
    ` : "";

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Entregas</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      body { display: flex; height: 100vh; margin: 0; }
      .sidebar { width: 220px; background-color: #0D5749; color: white; padding: 20px; }
      .sidebar a { display: block; padding: 10px; color: white; text-decoration: none; border-radius: 5px; margin-bottom: 10px; text-align: left;}
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
              .form-contorno {
    border: 1px solid rgba(0,0,0,0.15); /* contorno leve */
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.6); /* opcional — dá um ar mais clean */
    backdrop-filter: blur(4px); /* opcional — efeito moderno */
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
    <div class="sidebar text-center d-none d-md-block">
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
        <a href="/logout" class="text-danger"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between">
        <button class="btn btn-outline-dark d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">☰ Menu</button>
      </div>

      <div class="d-flex align-items-center justify-content-between mb-3">
            <h2 class="mb-0">Entregas</h2>
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

      <div class="form-contorno p-3 mb-4 rounded">
  <!-- FORMULÁRIO DE PESQUISA -->
  <form class="row g-2 mb-3" method="GET" action="/entregas">
    <div class="col-md-4">
      <label class="form-label">Buscar por título do pedido</label>
      <input
        type="text"
        name="titulo"
        class="form-control"
        value="${filtros.titulo || ""}"
        placeholder="Ex.: Pedido Feira de Santana"
      >
    </div>

    <div class="col-md-3">
      <label class="form-label">Data começa em</label>
      <input
        type="date"
        name="data_inicio"
        class="form-control"
        value="${filtros.data_inicio || ""}"
      >
    </div>

    <div class="col-md-3">
      <label class="form-label">Data termina em</label>
      <input
        type="date"
        name="data_fim"
        class="form-control"
        value="${filtros.data_fim || ""}"
      >
    </div>

    <div class="col-md-2 d-flex align-items-end gap-2">
      <button type="submit" class="btn btn-primary w-100">
        <i class="fa-solid fa-magnifying-glass"></i>
      </button>
      <a href="/entregas" class="btn btn-outline-secondary w-100">
        <i class="fa-solid fa-eraser"></i>
      </a>
    </div>
  </form>
</div>


      <button class="btn btn-success mb-3" data-bs-toggle="modal" data-bs-target="#novoPedidoModal">
        <i class="fa-solid fa-route"></i> Nova Rota
      </button>

      ${usuario.tipo_usuario === "admin" ? `
      <button class="btn btn-outline-primary mb-3" data-bs-toggle="modal" data-bs-target="#mapaMotoristasModal">
        <i class="fa-solid fa-location-dot"></i> Motoristas em tempo real
      </button>
      ` : ""}

      <div class="row">
        ${cards}
      </div>

      ${paginationHtml}
    </div>


    <!-- Modal: Novo Pedido -->
    <div class="modal fade" id="novoPedidoModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form method="POST" action="/entregas/novo">
            <div class="modal-header">
              <h5 class="modal-title">Criar Nova Rota</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <label class="form-label">Cidade</label>
              <input type="text" name="titulo" class="form-control mb-2" required>

              <label class="form-label">Data</label>
              <input type="date" name="data_pedido" class="form-control" required>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modais de clientes (editar/excluir) fora dos modais de pedidos -->
    ${clienteModals.join("")}

    ${usuario.tipo_usuario === "admin" ? `
    <div class="modal fade" id="mapaMotoristasModal" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Localização em tempo real — Motoristas</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div id="mapaMotoristas" style="height: 70vh; width: 100%; border-radius: 12px;"></div>
            <small class="text-muted d-block mt-2">
              * Atualiza automaticamente. Se não aparecer, verifique HTTPS e permissões de localização no celular do motorista.
            </small>
          </div>
        </div>
      </div>
    </div>
    ` : ""}


    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>
    <script>
      window.NOME_USUARIO = "${usuario.nome}";
    </script>
    <script src="/socket.io/socket.io.js"></script>
    <script src="/script/motoristaTracker.js"></script>

    ${usuario.tipo_usuario === "admin" ? `
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="/socket.io/socket.io.js"></script>

    <script>
    (() => {
      let map, markers = new Map(); // key = nome do motorista
      const socket = io();

      // entra como admin pra receber updates
      socket.emit("admin:join");

      function initMap() {
        if (map) return;

        map = L.map("mapaMotoristas").setView([-12.9714, -38.5014], 11); // Salvador (ajuste como quiser)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19
        }).addTo(map);
      }

      const modal = document.getElementById("mapaMotoristasModal");
      modal?.addEventListener("shown.bs.modal", () => {
        initMap();
        setTimeout(() => map.invalidateSize(), 200);
      });

      socket.on("motoristas:update", (lista) => {
        // lista = [{nome, lat, lng, updatedAt}, ...]
        if (!map) return;

        const nomesAtuais = new Set(lista.map(x => x.nome));

        // remove marcadores que sumiram
        for (const [nome, mk] of markers.entries()) {
          if (!nomesAtuais.has(nome)) {
            map.removeLayer(mk);
            markers.delete(nome);
          }
        }

        // atualiza/cria marcadores
        lista.forEach(m => {
          const pos = [m.lat, m.lng];
          const label = \`\${m.nome}<br><small>\${new Date(m.updatedAt).toLocaleString("pt-BR")}</small>\`;

          if (markers.has(m.nome)) {
            markers.get(m.nome).setLatLng(pos).setPopupContent(label);
          } else {
            const mk = L.marker(pos).addTo(map).bindPopup(label);
            markers.set(m.nome, mk);
          }
        });
      });
    })();
    </script>
    ` : ""}

    <!-- Motorista: se você quiser rastrear também na tela /entregas -->
    ${usuario.tipo_usuario === "motorista" ? `
    <script>
      window.NOME_USUARIO = "${usuario.nome}";
    </script>
    <script src="/socket.io/socket.io.js"></script>
    <script src="/script/motoristaTracker.js"></script>
    ` : ""}


  </body>
  </html>
  `;
}

module.exports = entregasView;