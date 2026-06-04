// views/veiculosView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");

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

  const modaisDetalheEditarExcluir = [];
  const modaisNovoChecklist = [];
  const veiculoIds = [];

  const cards = veiculos.length
    ? veiculos
      .map((v) => {
        veiculoIds.push(v.id);
        const checks = checklistsMap[v.id] || [];

        const listaChecks =
          checks.length > 0
            ? checks
              .map((c) => {
                const servicoTitulo =
                  (c.servico || "").length > 50
                    ? `${c.servico.slice(0, 50)}…`
                    : (c.servico || "");

                // Modal de Detalhes
                modaisDetalheEditarExcluir.push(`
                      <div class="modal fade" id="detalheChecklist${c.id}" tabindex="-1">
                        <div class="modal-dialog modal-dialog-centered">
                          <div class="modal-content erp-modal shadow-lg">
                            <div class="modal-header bg-light border-0">
                              <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-list-check me-2 text-primary"></i> Detalhes do Checklist</h6>
                              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body text-sm p-4">
                              <div class="row g-3 mb-3">
                                <div class="col-6">
                                  <span class="text-muted d-block" style="font-size:0.75rem;">Oficina</span>
                                  <span class="fw-medium">${c.oficina}</span>
                                </div>
                                <div class="col-6">
                                  <span class="text-muted d-block" style="font-size:0.75rem;">Mecânico</span>
                                  <span class="fw-medium">${c.mecanico}</span>
                                </div>
                                <div class="col-6">
                                  <span class="text-muted d-block" style="font-size:0.75rem;">Data</span>
                                  <span class="fw-medium">${fmtData(c.data_servico)}</span>
                                </div>
                                <div class="col-6">
                                  <span class="text-muted d-block" style="font-size:0.75rem;">KM</span>
                                  <span class="fw-medium">${fmtKM(c.km_servico)} km</span>
                                </div>
                                <div class="col-12 border-top pt-2 mt-2">
                                  <span class="text-muted d-block" style="font-size:0.75rem;">Valor Total</span>
                                  <span class="fw-bold text-success" style="font-size:1.2rem;">R$ ${fmtMoeda(c.valor)}</span>
                                </div>
                              </div>
                              <div class="p-3 bg-light rounded border border-light shadow-sm">
                                <span class="text-muted fw-bold d-block mb-2" style="font-size:0.75rem;">Serviço Realizado</span>
                                <div style="font-size: 0.85rem; line-height: 1.5;">
                                    ${(c.servico || "").replace(/\n/g, "<br>")}
                                </div>
                              </div>
                              <div class="mt-3">
                              ${c.documento
                    ? `<a class="btn btn-sm btn-outline-success w-100 fw-bold shadow-sm" href="/uploads/${c.documento}" target="_blank"><i class="fa-solid fa-paperclip me-1"></i> Visualizar Documento Anexo</a>`
                    : `<span class="text-muted text-center d-block w-100 p-2 border rounded" style="font-size:0.8rem;"><i class="fa-solid fa-file-excel me-1"></i> Sem documento anexo</span>`
                  }
                              </div>
                            </div>
                            <div class="modal-footer bg-light border-0 d-flex gap-2">
                              <button class="btn btn-sm btn-outline-secondary flex-grow-1" data-bs-dismiss="modal">Fechar</button>
                              <button class="btn btn-sm btn-warning fw-bold text-dark px-3" data-bs-toggle="modal" data-bs-target="#editarChecklist${c.id}" data-bs-dismiss="modal">
                                <i class="fa-solid fa-pen me-1"></i> Editar
                              </button>
                              <button class="btn btn-sm btn-danger px-3" data-bs-toggle="modal" data-bs-target="#excluirChecklist${c.id}" data-bs-dismiss="modal" title="Excluir">
                                <i class="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    `);

                // Modal de Edição (Checklist)
                modaisDetalheEditarExcluir.push(`
                      <div class="modal fade" id="editarChecklist${c.id}" tabindex="-1" data-bs-backdrop="static">
                        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                          <form method="POST" action="/veiculos/checklists/editar/${c.id}" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg" onsubmit="prepararSubmissaoSimples(event, this, 'Checklist Atualizado!')">
                            <div class="modal-header bg-light border-0">
                              <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Checklist</h6>
                              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body text-sm p-4 bg-light">
                              <div class="row g-3">
                                <div class="col-12">
                                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Serviço (descrição)</label>
                                  <textarea name="servico" class="form-control form-control-sm shadow-sm" rows="3" required>${c.servico || ""}</textarea>
                                </div>
                                <div class="col-6">
                                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Oficina</label>
                                  <input type="text" name="oficina" class="form-control form-control-sm shadow-sm" value="${c.oficina}" required>
                                </div>
                                <div class="col-6">
                                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Mecânico</label>
                                  <input type="text" name="mecanico" class="form-control form-control-sm shadow-sm" value="${c.mecanico}" required>
                                </div>
                                
                                <div class="col-12 col-md-4">
                                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Data</label>
                                  <input type="date" name="data_servico" class="form-control form-control-sm shadow-sm" value="${String(c.data_servico).slice(0, 10)}" required>
                                </div>
                                <div class="col-6 col-md-4">
                                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">KM Serviço</label>
                                  <div class="input-group input-group-sm shadow-sm">
                                      <input type="text" name="km_servico" class="form-control form-control-sm mask-km" oninput="maskKM(this)" value="${fmtKM(c.km_servico)}" required>
                                      <span class="input-group-text bg-white text-muted border-start-0">km</span>
                                  </div>
                                </div>
                                <div class="col-6 col-md-4">
                                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Valor (Total)</label>
                                  <div class="input-group input-group-sm shadow-sm">
                                      <span class="input-group-text bg-white text-muted border-end-0">R$</span>
                                      <input type="text" name="valor" class="form-control form-control-sm mask-moeda" oninput="maskMoeda(this)" value="${fmtMoeda(c.valor)}" required>
                                  </div>
                                </div>
                                
                                <div class="col-12 mt-3">
                                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Substituir doc. (opcional)</label>
                                  <input type="file" name="documento" class="form-control form-control-sm shadow-sm" accept=".pdf,image/*">
                                </div>
                              </div>
                            </div>
                            <div class="modal-footer bg-white border-0 d-flex flex-nowrap">
                              <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                              <button type="submit" class="btn btn-sm btn-primary fw-bold w-100"><i class="fa-solid fa-save me-1"></i> Salvar</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    `);

                // Modal de Exclusão (Checklist)
                modaisDetalheEditarExcluir.push(`
                      <div class="modal fade" id="excluirChecklist${c.id}" tabindex="-1" data-bs-backdrop="static">
                        <div class="modal-dialog modal-sm modal-dialog-centered">
                          <div class="modal-content erp-modal border-0 shadow-lg">
                            <form method="POST" action="/veiculos/checklists/excluir/${c.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Checklist Excluído!')">
                              <div class="modal-body text-center p-4">
                                <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                                <h6 class="mb-2 fw-bold text-dark">Excluir Checklist?</h6>
                                <p class="text-muted mb-0" style="font-size:0.85rem;">Esta ação não pode ser desfeita.</p>
                              </div>
                              <div class="modal-footer justify-content-center bg-light border-0 d-flex flex-nowrap">
                                <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-sm btn-danger fw-bold w-100">Excluir</button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    `);

                // Card da lista de checklists
                return `
                      <div
                        class="card chk-item border-0 shadow-sm mb-2 transition-hover"
                        style="cursor: pointer;"
                        data-bs-toggle="modal"
                        data-bs-target="#detalheChecklist${c.id}"
                        data-bs-dismiss="modal"
                        data-servico="${(c.servico || "").toLowerCase()}"
                        data-oficina="${(c.oficina || "").toLowerCase()}"
                        data-mecanico="${(c.mecanico || "").toLowerCase()}"
                        data-data="${(fmtData(c.data_servico) || "").toLowerCase()}"
                        data-valor="${String(c.valor || "").toLowerCase()}"
                        data-km="${String(c.km_servico || "").toLowerCase()}"
                      >
                        <div class="card-body p-2 px-3 d-flex justify-content-between align-items-center">
                          <div class="text-truncate me-3" style="max-width: 85%;">
                            <span class="d-block fw-bold text-truncate text-dark" style="font-size: 0.85rem;">${servicoTitulo || "Serviço"}</span>
                            <div class="d-flex gap-3 text-muted mt-1" style="font-size: 0.75rem;">
                              <span><i class="fa-regular fa-calendar me-1"></i> ${fmtData(c.data_servico)}</span>
                              <span><i class="fa-solid fa-wrench me-1"></i> ${c.oficina}</span>
                            </div>
                          </div>
                          <div>
                             <i class="fa-solid fa-chevron-right text-primary opacity-50"></i>
                          </div>
                        </div>
                      </div>
                    `;
              })
              .join("")
            : `<div class="text-center text-muted p-4" style="font-size:0.85rem;"><i class="fa-solid fa-inbox mb-2 fa-2x opacity-25"></i><br>Nenhum checklist para este veículo.</div>`;

        // Modal: Novo Checklist
        modaisNovoChecklist.push(`
            <div class="modal fade" id="novoChecklistVeiculo${v.id}" tabindex="-1" data-bs-backdrop="static">
              <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <form method="POST" action="/veiculos/${v.id}/checklists/novo" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg" onsubmit="prepararSubmissaoSimples(event, this, 'Checklist Registrado!')">
                  <div class="modal-header bg-success text-white border-0">
                    <h6 class="modal-title fw-bold"><i class="fa-solid fa-plus me-2"></i> Lançar Checklist</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body text-sm p-4 bg-light">
                    <div class="mb-4 text-muted bg-white p-2 rounded border border-success border-opacity-25 shadow-sm text-center" style="font-size:0.8rem;">
                      <i class="fa-solid fa-car-side me-1 text-success"></i> Veículo selecionado: <strong class="text-dark">${v.marca} ${v.modelo} (${v.ano})</strong>
                    </div>
                    <div class="row g-3">
                      <div class="col-12">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Serviço (descrição)</label>
                        <textarea name="servico" class="form-control form-control-sm shadow-sm" rows="2" required placeholder="Descreva os serviços realizados"></textarea>
                      </div>
                      <div class="col-6">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Oficina</label>
                        <input type="text" name="oficina" class="form-control form-control-sm shadow-sm" required>
                      </div>
                      <div class="col-6">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Mecânico</label>
                        <input type="text" name="mecanico" class="form-control form-control-sm shadow-sm" required>
                      </div>
                      
                      <div class="col-12 col-md-4">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Data</label>
                        <input type="date" name="data_servico" class="form-control form-control-sm shadow-sm" required>
                      </div>
                      <div class="col-6 col-md-4">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">KM Serviço</label>
                        <div class="input-group input-group-sm shadow-sm">
                            <input type="text" name="km_servico" class="form-control form-control-sm mask-km" oninput="maskKM(this)" placeholder="0" required>
                            <span class="input-group-text bg-white text-muted border-start-0">km</span>
                        </div>
                      </div>
                      <div class="col-6 col-md-4">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Valor (Total)</label>
                        <div class="input-group input-group-sm shadow-sm">
                            <span class="input-group-text bg-white text-muted border-end-0">R$</span>
                            <input type="text" name="valor" class="form-control form-control-sm mask-moeda" oninput="maskMoeda(this)" placeholder="0,00" required>
                        </div>
                      </div>
                      
                      <div class="col-12 mt-3">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Anexar Nota/Doc. (opcional)</label>
                        <input type="file" name="documento" class="form-control form-control-sm shadow-sm" accept=".pdf,image/*">
                      </div>
                    </div>
                  </div>
                  <div class="modal-footer bg-white border-0 d-flex flex-nowrap">
                    <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-sm btn-success w-100 fw-bold"><i class="fa-solid fa-check me-1"></i> Salvar Checklist</button>
                  </div>
                </form>
              </div>
            </div>
          `);

        // Card do veículo
        return `
            <div class="col-12 col-md-6 col-lg-3">
              <div class="card erp-card shadow-sm h-100 border-0 transition-hover" 
                   style="cursor: pointer;" 
                   data-bs-toggle="modal" 
                   data-bs-target="#checklistsVeiculo${v.id}">
                <div class="img-container">
                    <img src="${v.foto ? `/uploads/${v.foto}` : `/img/vehicle_placeholder.png`}" 
                        alt="${v.marca} ${v.modelo}" class="card-img-top vehicle-img">
                    <span class="badge bg-dark position-absolute top-0 end-0 m-2 shadow-sm">${v.ano}</span>
                    <span class="badge bg-primary position-absolute top-0 start-0 m-2 shadow-sm"><i class="fa-solid fa-gauge-high"></i> ${fmtKM(v.km)} km</span>
                </div>
                <div class="card-body p-3 d-flex flex-column">
                  <h6 class="card-title fw-bold text-dark mb-3 text-truncate" title="${v.marca} ${v.modelo}">
                    ${v.marca} ${v.modelo}
                  </h6>
                  
                  <div class="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                    <span class="text-success fw-medium" style="font-size:0.85rem;"><i class="fa-solid fa-list-check me-1"></i> Checklists</span>
                    <div class="btn-group">
                      <button class="btn btn-sm btn-light border text-warning shadow-sm" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#editarVeiculo${v.id}" title="Editar">
                        <i class="fa-solid fa-pen" style="font-size:0.75rem;"></i>
                      </button>
                      <button class="btn btn-sm btn-light border text-danger shadow-sm" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#excluirVeiculo${v.id}" title="Excluir">
                        <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal fade" id="checklistsVeiculo${v.id}" tabindex="-1">
              <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content erp-modal shadow-lg">
                  <div class="modal-header bg-light border-0">
                    <div>
                        <h6 class="modal-title fw-bold text-dark mb-0"><i class="fa-solid fa-layer-group text-primary me-2"></i> Histórico de Manutenção</h6>
                        <span class="text-muted" style="font-size:0.8rem;">${v.marca} ${v.modelo} (${v.ano})</span>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body bg-light p-4">
                    <div class="card border-0 shadow-sm p-3 mb-4">
                        <div class="row g-2 align-items-center">
                        <div class="col">
                            <div class="input-group input-group-sm shadow-sm">
                                <span class="input-group-text bg-white border-end-0"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
                                <input type="text" id="searchInputV${v.id}" class="form-control border-start-0 ps-0 shadow-none" placeholder="Buscar serviço, mecânico, data...">
                            </div>
                        </div>
                        <div class="col-auto d-flex gap-2">
                            <button class="btn btn-sm btn-primary fw-bold px-3 shadow-sm" id="searchBtnV${v.id}" data-search-vid="${v.id}">Buscar</button>
                            <button class="btn btn-sm btn-outline-secondary px-3 shadow-sm" id="clearBtnV${v.id}" data-clear-vid="${v.id}"><i class="fa-solid fa-eraser"></i></button>
                        </div>
                        </div>
                    </div>

                    <div id="checksListV${v.id}">
                      ${listaChecks}
                    </div>

                    <div id="noResultV${v.id}" class="d-none">
                      <div class="text-center text-muted p-4 bg-white rounded border border-light shadow-sm" style="font-size:0.85rem;">
                        <i class="fa-solid fa-magnifying-glass-minus fa-2x mb-3 opacity-25"></i><br>
                        Nenhum resultado encontrado na busca.
                      </div>
                    </div>
                  </div>
                  <div class="modal-footer border-top-0 bg-white">
                    <button class="btn btn-sm btn-success w-100 fw-bold shadow-sm py-2" data-bs-toggle="modal" data-bs-target="#novoChecklistVeiculo${v.id}" data-bs-dismiss="modal">
                        <i class="fa-solid fa-plus me-1"></i> Lançar Novo Checklist
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal fade" id="editarVeiculo${v.id}" tabindex="-1" data-bs-backdrop="static">
              <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <form method="POST" action="/veiculos/editar/${v.id}" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg" onsubmit="prepararSubmissaoSimples(event, this, 'Veículo Atualizado!')">
                  <div class="modal-header bg-warning text-dark border-0">
                    <h6 class="modal-title fw-bold"><i class="fa-solid fa-pen-to-square me-2"></i> Editar Veículo</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body text-sm p-4 bg-light">
                    <div class="row g-3">
                        <div class="col-12 col-md-6">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Marca</label>
                          <input type="text" name="marca" class="form-control form-control-sm shadow-sm" value="${v.marca}" required>
                        </div>
                        <div class="col-12 col-md-6">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Modelo</label>
                          <input type="text" name="modelo" class="form-control form-control-sm shadow-sm" value="${v.modelo}" required>
                        </div>
                        <div class="col-6">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Ano de Fab.</label>
                          <input type="number" name="ano" class="form-control form-control-sm shadow-sm" value="${v.ano}" required>
                        </div>
                        <div class="col-6">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">KM Atual</label>
                          <div class="input-group input-group-sm shadow-sm">
                              <input type="text" name="km" class="form-control form-control-sm mask-km" oninput="maskKM(this)" value="${fmtKM(v.km)}" required>
                              <span class="input-group-text bg-white text-muted border-start-0">km</span>
                          </div>
                        </div>
                        <div class="col-12 mt-3">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Atualizar Foto (opcional)</label>
                          <input type="file" name="foto" class="form-control form-control-sm shadow-sm" accept="image/*">
                          ${v.foto ? `<div class="text-muted mt-2" style="font-size:0.75rem;"><i class="fa-solid fa-image text-primary"></i> Foto atual no sistema: ${v.foto}</div>` : ""}
                        </div>
                    </div>
                  </div>
                  <div class="modal-footer bg-white border-0 d-flex flex-nowrap">
                    <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-sm btn-primary fw-bold w-100"><i class="fa-solid fa-save me-1"></i> Salvar</button>
                  </div>
                </form>
              </div>
            </div>

            <div class="modal fade" id="excluirVeiculo${v.id}" tabindex="-1" data-bs-backdrop="static">
              <div class="modal-dialog modal-sm modal-dialog-centered">
                <div class="modal-content erp-modal border-0 shadow-lg">
                  <form method="POST" action="/veiculos/excluir/${v.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Veículo Excluído!')">
                    <div class="modal-body text-center p-4">
                      <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                      <h6 class="mb-2 fw-bold text-dark">Excluir Veículo?</h6>
                      <p class="text-muted mb-0" style="font-size:0.85rem;">Deseja excluir <b>${v.marca} ${v.modelo} (${v.ano})</b>? Todo o histórico de checklists será perdido.</p>
                    </div>
                    <div class="modal-footer justify-content-center bg-light border-0 d-flex flex-nowrap">
                      <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                      <button type="submit" class="btn btn-sm btn-danger fw-bold w-100">Sim, Excluir</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          `;
      })
      .join("")
    : `<div class="col-12 text-center text-muted mt-5"><i class="fa-solid fa-car-side fa-3x opacity-25 mb-3"></i><p>Nenhum veículo cadastrado na frota.</p></div>`;

  const menuHTML = menuLateral(usuario, "/veiculos");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Veículos | ERP Ecoflow</title>
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
      
      .sidebar { width: 240px; background-color: #0D5749; color: white; padding: 20px; display: flex; flex-direction: column;}
      .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s;}
      .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
      
      .content { flex: 1; padding: 24px; overflow-y: auto; position: relative;}
      
      .text-sm { font-size: 0.875rem; }
      
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
      
      /* ERP Cards */
      .erp-card {
          border-radius: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
          overflow: hidden;
      }
      .transition-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.05) !important;
      }
      
      .img-container { position: relative; height: 140px; background: #e9ecef; border-bottom: 1px solid #eee; }
      .vehicle-img { width: 100%; height: 100%; object-fit: cover; }
      
      /* List items (Checklists) */
      .chk-item { border-left: 3px solid #0D5749 !important; transition: background 0.2s; }
      .chk-item:hover { background-color: #e2efda; }
      
      /* Modals */
      .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      .form-control-sm, .form-select-sm { border-radius: 6px; }

      /* ANIMAÇÕES GLOBAIS (TOASTS E MODAIS) */
      .toast {
          transform: translateX(120%);
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important;
      }
      .toast.showing, .toast.show {
          transform: translateX(0);
      }
      .modal.fade .modal-dialog {
          transform: scale(0.85) translateY(30px);
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
      }
      .modal.show .modal-dialog {
          transform: scale(1) translateY(0);
      }

      .toast-timer {
          height: 6px;
          background: rgba(255, 255, 255, 0.4);
          width: 100%;
          position: absolute;
          bottom: 0;
          left: 0;
          transform-origin: left;
      }
      @keyframes shrinkToast {
          from { width: 100%; }
          to { width: 0%; }
      }

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
    
    ${renderLoaderParticulas("Acessando frota...")}

    <div class="sidebar d-none d-md-flex">
      <div class="text-center mb-4 mt-2">
        <img src="/img/logo-branca.png" alt="Logo da Empresa" class="img-fluid" style="max-width:130px;">
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
              <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-car-side text-muted me-2"></i>Gestão de Frota</h4>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Histórico e manutenção de veículos</span>
            </div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-3 shadow-sm border border-light">
        <div>
            <h6 class="mb-0 text-muted" style="font-size:0.85rem;">Total de Veículos: <strong>${veiculos.length}</strong></h6>
        </div>
        <button class="btn btn-sm btn-success px-3 shadow-sm fw-bold" data-bs-toggle="modal" data-bs-target="#novoVeiculoModal">
            <i class="fa-solid fa-plus me-1"></i> Novo Veículo
        </button>
      </div>

      <div class="row g-3">
        ${cards}
      </div>
    </div>

    <div class="modal fade" id="novoVeiculoModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/veiculos/novo" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg" onsubmit="prepararSubmissaoSimples(event, this, 'Veículo Cadastrado!')">
          <div class="modal-header bg-success text-white border-0">
            <h6 class="modal-title fw-bold"><i class="fa-solid fa-car me-2"></i> Cadastrar Novo Veículo</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-light">
            <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Marca</label>
                  <input type="text" name="marca" class="form-control form-control-sm py-2 shadow-sm" required placeholder="Ex: Renault">
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Modelo</label>
                  <input type="text" name="modelo" class="form-control form-control-sm py-2 shadow-sm" required placeholder="Ex: Master">
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Ano de Fabricação</label>
                  <input type="number" name="ano" class="form-control form-control-sm py-2 shadow-sm" required placeholder="Ex: 2022">
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Quilometragem (KM)</label>
                  <div class="input-group input-group-sm shadow-sm">
                      <input type="text" name="km" class="form-control form-control-sm py-2 mask-km" oninput="maskKM(this)" required placeholder="Ex: 15.000">
                      <span class="input-group-text bg-white text-muted border-start-0">km</span>
                  </div>
                </div>
                <div class="col-12 mt-3">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Foto do Veículo (opcional)</label>
                  <input type="file" name="foto" class="form-control form-control-sm py-2 shadow-sm" accept="image/*">
                </div>
            </div>
          </div>
          <div class="modal-footer bg-white border-0 d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success fw-bold w-100"><i class="fa-solid fa-check me-1"></i> Salvar Veículo</button>
          </div>
        </form>
      </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-success text-white overflow-hidden position-relative" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-check fs-5 me-2" id="sucessoIcon"></i>
                    <strong class="fs-6" id="sucessoTitulo">Concluído!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.9rem; opacity: 0.9;" id="sucessoSub">Operação realizada com sucesso.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 6px;"></div>
        </div>

        <div id="erroToast" class="toast shadow-lg border-0 bg-danger text-white overflow-hidden position-relative" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-xmark fs-5 me-2"></i>
                    <strong class="fs-6" id="erroTitulo">Erro!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.9rem; opacity: 0.9;" id="erroSub">Ocorreu um erro ao processar.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="erroTimer" style="display: none; height: 6px;"></div>
        </div>
    </div>

    ${modaisNovoChecklist.join("")}
    ${modaisDetalheEditarExcluir.join("")}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <script>
      // =======================================================================
      // FUNÇÃO GENÉRICA DE TOASTS
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

      function mostrarToastCarregando(mensagem) {
          const successToastEl = document.getElementById('sucessoToast');
          document.getElementById('sucessoTitulo').innerText = "A Processar";
          document.getElementById('sucessoSub').innerText = mensagem;
          successToastEl.setAttribute('data-bs-autohide', 'false');

          const timerEl = document.getElementById('sucessoTimer');
          if (timerEl) timerEl.style.display = 'none';

          const oldInstance = bootstrap.Toast.getInstance(successToastEl);
          if (oldInstance) oldInstance.dispose();
          const successToast = new bootstrap.Toast(successToastEl);
          successToast.show();
      }

      // Parâmetros de URL via redirecionamento de segurança
      window.addEventListener('load', () => {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('sucesso')) {
              mostrarToast('sucesso', 'Concluído!', 'Operação realizada com sucesso no sistema.');
          } else if (urlParams.has('erro')) {
              mostrarToast('erro', 'Erro!', 'Não foi possível concluir a ação. Tente novamente.');
          }
          
          if (window.history.replaceState) {
              const url = new URL(window.location.href);
              url.searchParams.delete('sucesso');
              url.searchParams.delete('erro');
              window.history.replaceState({}, document.title, url.toString());
          }
      });

      // =======================================================================
      // SUBMISSÃO AJAX SEM RECARREGAR A PÁGINA (SUPORTA FOTOS E DOCS)
      // =======================================================================
      let isSubmitting = false;

      async function prepararSubmissaoSimples(event, formElement, titleMsg) {
          if (event) event.preventDefault();
          if (!formElement.checkValidity()) {
              formElement.reportValidity();
              return;
          }
          if (isSubmitting) return;

          // Retirar formatação para envio limpo ao Banco de Dados
          const moedaInputs = formElement.querySelectorAll('.mask-moeda');
          moedaInputs.forEach(inp => {
              if (inp.value) inp.value = inp.value.replace(/\\./g, '').replace(',', '.');
          });
          
          const kmInputs = formElement.querySelectorAll('.mask-km');
          kmInputs.forEach(inp => {
              if (inp.value) inp.value = inp.value.replace(/\\./g, '');
          });

          // Ocultar modal atual com segurança
          const modalEl = formElement.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }

          document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
          document.body.classList.remove('modal-open');
          document.body.style = '';

          mostrarToastCarregando('A guardar informações...');
          isSubmitting = true;

          try {
              const formData = new FormData(formElement);
              
              const response = await fetch(formElement.action, {
                  method: formElement.method || 'POST',
                  body: formData 
              });

              if (response.ok) {
                  const html = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  // Atualizar o container visual principal
                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }

                  // Atualizar Modais (Remover os velhos dinâmicos, colocar os novos)
                  const staticModals = ['novoVeiculoModal', 'sidebarMenu'];
                  document.querySelectorAll('.modal').forEach(m => {
                      if (!staticModals.includes(m.id)) m.remove();
                  });
                  doc.querySelectorAll('.modal').forEach(m => {
                      if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
                  });

                  formElement.reset();
                  mostrarToast('sucesso', 'Concluído!', titleMsg);

                  // Reconectar eventos de busca nos modais (crucial para o SPA)
                  initVeiculosSearch();

              } else {
                  mostrarToast('erro', 'Erro no Servidor', 'Os dados não puderam ser guardados.');
              }
          } catch (err) {
              console.error(err);
              mostrarToast('erro', 'Falha de Conexão', 'Verifique a internet e tente novamente.');
          } finally {
              isSubmitting = false;
          }
      }

      // Função de formatação de Moeda BRL (Front-end apenas)
      function maskMoeda(i) {
          let v = i.value.replace(/\\D/g,'');
          if(!v) { i.value = ''; return; }
          v = (v/100).toFixed(2) + '';
          v = v.replace(".", ",");
          v = v.replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, "$1.");
          i.value = v;
      }

      // Função de formatação Numérica KM (Front-end apenas)
      function maskKM(i) {
          let v = i.value.replace(/\\D/g,'');
          if(!v) { i.value = ''; return; }
          v = v.replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, "$1.");
          i.value = v;
      }

      // =======================================================================
      // LÓGICA DE PESQUISA (FILTRO DE CHECKLISTS) DENTRO DO MODAL
      // =======================================================================
      function initVeiculosSearch() {
        const searchInputs = document.querySelectorAll('input[id^="searchInputV"]');
        searchInputs.forEach(input => {
            const vid = input.id.replace('searchInputV', '');
            const btnSearch = document.getElementById("searchBtnV" + vid);
            const btnClear = document.getElementById("clearBtnV" + vid);
            const list = document.getElementById("checksListV" + vid);
            const noResult = document.getElementById("noResultV" + vid);

            if (!btnSearch || !btnClear || !list) return;

            const doSearch = () => {
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
            };

            const clearSearch = () => {
                input.value = "";
                const items = list.querySelectorAll(".chk-item");
                items.forEach((el) => el.classList.remove("d-none"));
                if (noResult) noResult.classList.add("d-none");
            };

            btnSearch.addEventListener("click", (e) => {
                e.preventDefault();
                doSearch();
            });

            btnClear.addEventListener("click", (e) => {
                e.preventDefault();
                clearSearch();
            });

            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    doSearch();
                }
            });
        });
      }

      window.addEventListener('load', initVeiculosSearch);
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = veiculosView;