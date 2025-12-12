// views/checklistMotoristasView.js
function checklistMotoristasView(usuario, itens = [], paginacao = {}) {
  const user = usuario || { nome: "Usuário" };
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  const cards = itens.map(item => `
  <div class="card mb-3 shadow-sm">
    <div class="card-body d-flex justify-content-between align-items-center">
      <div>
        <h5 class="card-title">${item.motorista}</h5>
        <p class="card-text">
          <small class="text-muted">
            Registrado em: 
            ${new Date(item.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} 
            por ${item.registrado_por || "Desconhecido"}
          </small>
        </p>
      </div>
      <div>
        <a href="/checklist-motoristas/download/${item.id}" class="btn btn-sm btn-success" title="Baixar Planilha">
          <i class="fa-solid fa-file-excel"></i>
        </a>
        <!-- Botão Editar -->
        <button class="btn btn-sm btn-warning" data-bs-toggle="modal" data-bs-target="#editarModal${item.id}" title="Editar">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>

        <!-- Botão Excluir -->
        <button class="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#excluirModal${item.id}" title="Excluir">
          <i class="fa-solid fa-trash"></i>
        </button>

      </div>
    </div>
  </div>

    <!-- Modal Editar -->
<div class="modal fade" id="editarModal${item.id}" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <form method="POST" action="/checklist-motoristas/editar/${item.id}" enctype="multipart/form-data">
        <div class="modal-header">
          <h5 class="modal-title">Editar Checklist</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body row g-3">

          <div class="col-md-6">
            <label class="form-label">Veículo</label>
            <select name="veiculo" class="form-select" required>
              <option ${item.veiculo === "Master" ? "selected" : ""}>Master</option>
              <option ${item.veiculo === "Strada" ? "selected" : ""}>Strada</option>
              <option ${item.veiculo === "Fiorino" ? "selected" : ""}>Fiorino</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Nível do óleo</label>
            <select name="oleo" class="form-select" required>
              <option ${item.oleo === "Baixo" ? "selected" : ""}>Baixo</option>
              <option ${item.oleo === "Médio" ? "selected" : ""}>Médio</option>
              <option ${item.oleo === "Apto" ? "selected" : ""}>Apto</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Nível da água do radiador</label>
            <select name="agua" class="form-select" required>
              <option ${item.agua === "Baixo" ? "selected" : ""}>Baixo</option>
              <option ${item.agua === "Médio" ? "selected" : ""}>Médio</option>
              <option ${item.agua === "Apto" ? "selected" : ""}>Apto</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Fluído de freio</label>
            <select name="freio" class="form-select" required>
              <option ${item.freio === "Baixo" ? "selected" : ""}>Baixo</option>
              <option ${item.freio === "Médio" ? "selected" : ""}>Médio</option>
              <option ${item.freio === "Apto" ? "selected" : ""}>Apto</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Fluído da direção hidráulica</label>
            <select name="direcao" class="form-select" required>
              <option ${item.direcao === "Baixo" ? "selected" : ""}>Baixo</option>
              <option ${item.direcao === "Médio" ? "selected" : ""}>Médio</option>
              <option ${item.direcao === "Apto" ? "selected" : ""}>Apto</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Combustível</label>
            <select name="combustivel" class="form-select" required>
              <option ${item.combustivel === "Reserva" ? "selected" : ""}>Reserva</option>
              <option ${item.combustivel === "Abaixo de meio tanque" ? "selected" : ""}>Abaixo de meio tanque</option>
              <option ${item.combustivel === "Meio tanque" ? "selected" : ""}>Meio tanque</option>
              <option ${item.combustivel === "Acima de meio tanque" ? "selected" : ""}>Acima de meio tanque</option>
              <option ${item.combustivel === "Completo" ? "selected" : ""}>Completo</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Pneus (Calibragem)</label>
            <select name="pneu_calibragem" class="form-select" required>
              <option ${item.pneu_calibragem === "Baixo" ? "selected" : ""}>Baixo</option>
              <option ${item.pneu_calibragem === "Médio" ? "selected" : ""}>Médio</option>
              <option ${item.pneu_calibragem === "Apto" ? "selected" : ""}>Apto</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Pneus (Estado)</label>
            <select name="pneu_estado" class="form-select" required>
              <option ${item.pneu_estado === "Desgastado" ? "selected" : ""}>Desgastado</option>
              <option ${item.pneu_estado === "Meia vida" ? "selected" : ""}>Meia vida</option>
              <option ${item.pneu_estado === "Apto" ? "selected" : ""}>Apto</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Luzes</label>
            <select name="luzes" class="form-select" required>
              <option ${item.luzes === "Defeito pisca" ? "selected" : ""}>Defeito pisca</option>
              <option ${item.luzes === "Defeito lanterna" ? "selected" : ""}>Defeito lanterna</option>
              <option ${item.luzes === "Defeito farol" ? "selected" : ""}>Defeito farol</option>
              <option ${item.luzes === "Todos Aptos" ? "selected" : ""}>Todos Aptos</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Ruídos anormais</label>
            <select name="ruidos" class="form-select" required>
              <option ${item.ruidos === "Sem ruídos anormais" ? "selected" : ""}>Sem ruídos anormais</option>
              <option ${item.ruidos === "Ruído motor" ? "selected" : ""}>Ruído motor</option>
              <option ${item.ruidos === "Ruído suspensão" ? "selected" : ""}>Ruído suspensão</option>
              <option ${item.ruidos === "Ruído portas" ? "selected" : ""}>Ruído portas</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Remoção do lixo interno</label>
            <select name="lixo" class="form-select" required>
              <option ${item.lixo === "Pendente" ? "selected" : ""}>Pendente</option>
              <option ${item.lixo === "Feito" ? "selected" : ""}>Feito</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Responsável logístico</label>
            <select name="responsavel" class="form-select" required>
              <option ${item.responsavel === "Eliege" ? "selected" : ""}>Eliege</option>
              <option ${item.responsavel === "Mário" ? "selected" : ""}>Mário</option>
              <option ${item.responsavel === "Mirna" ? "selected" : ""}>Mirna</option>
              <option ${item.responsavel === "Renilson" ? "selected" : ""}>Renilson</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Motorista</label>
            <select name="motorista" class="form-select" required>
              <option ${item.motorista === "Flávio" ? "selected" : ""}>Flávio</option>
              <option ${item.motorista === "Thiago" ? "selected" : ""}>Thiago</option>
            </select>
          </div>

          <!-- NOVOS CAMPOS -->

          <div class="col-12">
            <label class="form-label">Observação (opcional)</label>
            <textarea name="observacao" class="form-control" rows="3">${item.observacao || ""}</textarea>
          </div>

          <div class="col-md-6">
            <label class="form-label d-block">Foto em anexo</label>
            ${item.foto
      ? `
                  <a href="/uploads/${item.foto}" target="_blank" class="btn btn-outline-secondary btn-sm mb-2">
                    <i class="fa-solid fa-image"></i> Ver foto atual
                  </a>
                  <br>
                  <small class="text-muted d-block mb-1">Arquivo atual: ${item.foto}</small>
                `
      : `<small class="text-muted d-block mb-2">Nenhuma foto anexada.</small>`
    }
            <label class="form-label">Substituir foto (opcional)</label>
            <input type="file" name="foto" class="form-control" accept="image/*">
          </div>

        </div>

        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Salvar Alterações</button>
        </div>
      </form>
    </div>
  </div>
</div>



    <!-- Modal Excluir -->
    <div class="modal fade" id="excluirModal${item.id}" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form method="POST" action="/checklist-motoristas/excluir/${item.id}">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar Exclusão</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              Tem certeza que deseja excluir o checklist de <b>${item.motorista}</b>?
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

  // paginação (somente se tiver mais de 1 página)
  const pageLinks = Array.from({ length: totalPages }, (_, i) => {
    const p = i + 1;
    return `
      <li class="page-item ${p === page ? "active" : ""}">
        <a class="page-link" href="/checklist-motoristas?page=${p}">${p}</a>
      </li>
    `;
  }).join("");

  const paginacaoHtml = totalPages > 1 ? `
    <nav aria-label="Paginação de checklists" class="mt-3">
      <ul class="pagination justify-content-center mb-4">
        <li class="page-item ${page <= 1 ? "disabled" : ""}">
          <a class="page-link" href="/checklist-motoristas?page=${page - 1}">&laquo;</a>
        </li>
        ${pageLinks}
        <li class="page-item ${page >= totalPages ? "disabled" : ""}">
          <a class="page-link" href="/checklist-motoristas?page=${page + 1}">&raquo;</a>
        </li>
      </ul>
    </nav>
  ` : "";

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checklist Motoristas</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
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

            /*---------------------Mobile---------------------*/
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
            <img src="/img/logo-branca.png" alt="Logo da Empresa" class="img-fluid mb-3" style="max-width: 150px;">
        </div>
          <hr>
          <a href="/home"><i class="fas fa-home me-2"></i>Home</a>
          <a href="/entregas"><i class="fas fa-truck me-2"></i>Entregas</a>
          <a href="/checklist-motoristas"><i class="fas fa-clipboard-check me-2"></i>Checklist</a>
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
        <div class="d-flex flex-column align-items-center w-100">
        <hr>
        <a href="/home"><i class="fas fa-home me-2"></i>Home</a>
        <a href="/entregas"><i class="fas fa-truck me-2"></i>Entregas</a>
        <a href="/checklist-motoristas"><i class="fas fa-clipboard-check me-2"></i>Checklist</a>
        </div>
        <hr class="bg-light w-100">
        <a href="/logout" class="text-danger"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>
    </div>
    </div>

      <!-- Conteúdo -->
      <div class="content">
        <button class="btn btn-outline-dark d-md-none mb-3" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">
          ☰ Menu
        </button>
      
        <div class="d-flex align-items-center justify-content-between mb-3">
            <h2 class="mb-0">Checklist Motoristas</h2>
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

      <button class="btn btn-success mb-3" data-bs-toggle="modal" data-bs-target="#novoChecklistModal"><i class="fa-solid fa-clipboard-check"></i> Novo Checklist</button>

        ${itens.length > 0 ? cards : "<p class='text-muted'>Nenhum checklist registrado ainda.</p>"}

        ${paginacaoHtml}
      </div>

      <!-- Modal Novo Checklist -->
      <div class="modal fade" id="novoChecklistModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <form method="POST" action="/checklist-motoristas/novo" enctype="multipart/form-data">
              <div class="modal-header">
                <h5 class="modal-title">Novo Checklist</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body row g-3">

                <div class="col-md-6">
                  <label class="form-label">Veículo</label>
                  <select name="veiculo" class="form-select" required>
                    <option value="Master">Master</option>
                    <option value="Strada">Strada</option>
                    <option value="Fiorino">Fiorino</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Nível do óleo</label>
                  <select name="oleo" class="form-select" required>
                    <option>Baixo</option>
                    <option>Médio</option>
                    <option>Apto</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Nível da água do radiador</label>
                  <select name="agua" class="form-select" required>
                    <option>Baixo</option>
                    <option>Médio</option>
                    <option>Apto</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Fluído de freio</label>
                  <select name="freio" class="form-select" required>
                    <option>Baixo</option>
                    <option>Médio</option>
                    <option>Apto</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Fluído da direção hidráulica</label>
                  <select name="direcao" class="form-select" required>
                    <option>Baixo</option>
                    <option>Médio</option>
                    <option>Apto</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Combustível</label>
                  <select name="combustivel" class="form-select" required>
                    <option>Reserva</option>
                    <option>Abaixo de meio tanque</option>
                    <option>Meio tanque</option>
                    <option>Acima de meio tanque</option>
                    <option>Completo</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Pneus (Calibragem)</label>
                  <select name="pneu_calibragem" class="form-select" required>
                    <option>Baixo</option>
                    <option>Médio</option>
                    <option>Apto</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Pneus (Estado)</label>
                  <select name="pneu_estado" class="form-select" required>
                    <option>Desgastado</option>
                    <option>Meia vida</option>
                    <option>Apto</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Luzes</label>
                  <select name="luzes" class="form-select" required>
                    <option>Defeito pisca</option>
                    <option>Defeito lanterna</option>
                    <option>Defeito farol</option>
                    <option>Todos Aptos</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Ruídos anormais</label>
                  <select name="ruidos" class="form-select" required>
                    <option>Sem ruídos anormais</option>
                    <option>Ruído motor</option>
                    <option>Ruído suspensão</option>
                    <option>Ruído portas</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Remoção do lixo interno</label>
                  <select name="lixo" class="form-select" required>
                    <option>Pendente</option>
                    <option>Feito</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Responsável logístico</label>
                  <select name="responsavel" class="form-select" required>
                    <option>Eliege</option>
                    <option>Mário</option>
                    <option>Mirna</option>
                    <option>Renilson</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Motorista</label>
                  <select name="motorista" class="form-select" required>
                    <option>Flávio</option>
                    <option>Thiago</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label mt-2">Observação (opcional)</label>
                  <textarea name="observacao" class="form-control mb-2" rows="3"></textarea>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Anexar foto (opcional)</label>
                  <input type="file" name="foto" class="form-control mb-3" accept="image/*">
                </div>

              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary">Salvar Checklist</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = checklistMotoristasView;
