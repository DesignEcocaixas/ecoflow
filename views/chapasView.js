// views/chapasView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");
const termosComponent = require("./termosComponent");

function chapasView(usuario, chapas = [], facas = []) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const termosHTML = termosComponent(usuario);

  const escapeHtmlAttr = (str) => {
      if (!str) return "";
      return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // --- LÓGICA DE SAÚDE DO ESTOQUE ---
  let containerSaude = "";
  if (chapas.length > 0) {
    const chapasBaixoEstoque = chapas.filter(c => Number(c.quantidade) < 5000);
    
    if (chapasBaixoEstoque.length > 0) {
      const alertasDetalhados = chapasBaixoEstoque.map(c => {
        const qtd = Number(c.quantidade) || 0;
        const porcentagem = Math.min((qtd / 5000) * 100, 100);

        return `
          <div class="col-12 col-md-6 col-lg-4 col-xl-3">
            <div class="bg-custom-darker border border-warning border-opacity-25 rounded-3 p-3 shadow-sm h-100 d-flex flex-column justify-content-center transition-hover">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <strong class="text-white text-truncate pe-2" style="font-size: 0.85rem; max-width: 70%;" title="${c.material} - ${c.modelo}">
                  ${c.material} <br> <span class="text-muted fw-normal">${c.modelo}</span>
                </strong>
                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-50" style="font-size: 0.75rem;">
                  ${qtd} un
                </span>
              </div>
              <div class="text-muted mb-2" style="font-size: 0.75rem;"><i class="fa-solid fa-ruler-combined me-1"></i> ${c.medida}</div>
              
              <div class="mt-auto pt-2">
                <div class="d-flex justify-content-between text-muted mb-1" style="font-size: 0.7rem;">
                  <span>Atual</span>
                  <span>Meta: 5.000</span>
                </div>
                <div class="progress bg-custom-dark border border-custom" style="height: 6px; border-radius: 10px;">
                  <div class="progress-bar bg-danger rounded-pill" role="progressbar" style="width: ${porcentagem}%" aria-valuenow="${qtd}" aria-valuemin="0" aria-valuemax="5000"></div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("");
      
      containerSaude = `
        <div class="alert alert-warning alert-dismissible fade show shadow-sm border-warning border-opacity-25 p-3 p-md-4 mb-4 position-relative" role="alert" style="border-radius: 12px; background: linear-gradient(145deg, #2a2211 0%, #1f1a0e 100%); color: rgba(255,255,255,0.85);">
          <div class="d-flex flex-column flex-sm-row align-items-start gap-3">
            <div class="bg-warning text-dark p-3 rounded-circle d-flex align-items-center justify-content-center shadow-sm d-none d-sm-flex" style="width: 50px; height: 50px; flex-shrink: 0;">
              <i class="fa-solid fa-triangle-exclamation fa-xl anim-pulse"></i>
            </div>
            <div class="flex-grow-1 w-100">
              <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2 pe-4 gap-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa-solid fa-triangle-exclamation fa-lg text-warning d-sm-none anim-pulse"></i>
                  <h6 class="alert-heading fw-bold mb-0 text-white" style="font-size: 1.05rem;">Atenção: Reabastecimento Necessário</h6>
                </div>
                <span class="badge bg-warning bg-opacity-25 text-warning shadow-sm border border-warning border-opacity-50">${chapasBaixoEstoque.length} iten(s) em nível crítico</span>
              </div>
              <p class="text-muted mb-3" style="font-size: 0.85rem;">
                Os seguintes materiais estão abaixo da margem de segurança recomendada de <strong class="text-white">5.000 unidades</strong>. Considere emitir uma ordem de compra.
              </p>
              
              <div class="alert-collapse-wrapper position-relative" id="alertContentWrapper">
                <div class="row g-3 pb-2" id="alertCardsContainer">
                  ${alertasDetalhados}
                </div>
                <div class="alert-fade-overlay" id="alertFadeOverlay" style="background: linear-gradient(to bottom, rgba(31, 26, 14, 0) 0%, rgba(31, 26, 14, 1) 100%);"></div>
              </div>
              
              <div class="text-center mt-2" id="alertToggleContainer" style="display: none;">
                <button class="btn btn-sm btn-link text-warning fw-bold text-decoration-none" id="btnToggleAlert" type="button" style="font-size: 0.85rem;">
                  Exibir tudo <i class="fa-solid fa-chevron-down ms-1"></i>
                </button>
              </div>

            </div>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Close" title="Fechar alerta"></button>
        </div>
      `;
    } else {
      containerSaude = `
        <div class="alert alert-success alert-dismissible fade show shadow-sm border-success border-opacity-25 d-flex align-items-center gap-3 mb-4 p-3" role="alert" style="border-radius: 12px; background: linear-gradient(145deg, #0a2114 0%, #0d281a 100%); color: rgba(255,255,255,0.85);">
          <div class="bg-success text-white p-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px; flex-shrink: 0;">
            <i class="fa-solid fa-shield fa-lg anim-pulse text-dark"></i>
          </div>
          <div class="pe-4">
            <h6 class="alert-heading fw-bold mb-1 text-success" style="font-size: 0.95rem;">Saúde do Estoque: Excelente</h6>
            <span class="text-muted" style="font-size: 0.85rem;">Todos os <strong class="text-white">${chapas.length}</strong> materiais operam acima de 5.000 unidades.</span>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Close" title="Fechar alerta"></button>
        </div>
      `;
    }
  }

  // --- GERADOR DE LINHAS DA TABELA CHAPAS (Ultra Compacta) ---
  const linhas = chapas.map(c => {
    const qtd = Number(c.quantidade) || 0;

    return `
    <tr class="align-middle chapa-row table-hover-row" style="cursor: pointer;" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('editarModal${c.id}')).show();" title="Clique para editar">
      <td class="text-white text-truncate px-2">${c.material || "-"}</td>
      <td class="text-white text-truncate px-2">${c.modelo || "-"}</td>
      <td class="text-muted text-truncate px-2"><i class="fa-solid fa-truck-fast opacity-50 me-1"></i> ${c.fornecedor || "-"}</td>
      <td class="text-muted text-truncate px-2">${c.medida || "-"}</td>
      <td class="text-center px-2 ${qtd < 5000 ? 'text-danger fw-bold' : 'text-accent fw-medium'}">${qtd}</td>
      <td class="text-end px-2">
        <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger py-1 px-2 shadow-sm" data-bs-toggle="modal" data-bs-target="#excluirModal${c.id}" title="Excluir" onclick="event.stopPropagation();">
          <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
        </button>
      </td>
    </tr>
    `;
  }).join("");

  const modais = chapas.map(c => `
    <div class="modal fade" id="editarModal${c.id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/chapas/editar/${c.id}" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Chapa Atualizada!')">
          <div class="modal-header bg-custom-darker border-custom">
            <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Chapa</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Material</label>
                <select name="material" class="form-select form-select-sm py-2 shadow-sm text-white" required>
                  <option value="Pardo" ${c.material === 'Pardo' ? 'selected' : ''}>Pardo</option>
                  <option value="Branco" ${c.material === 'Branco' ? 'selected' : ''}>Branco</option>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Modelo</label>
                <input type="text" name="modelo" value="${c.modelo || ""}" class="form-control form-control-sm py-2 shadow-sm" required>
              </div>
              <div class="col-12">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Fornecedor</label>
                <input type="text" name="fornecedor" value="${c.fornecedor || ""}" class="form-control form-control-sm py-2 shadow-sm" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Medida da Chapa</label>
                <input type="text" name="medida" value="${c.medida || ""}" class="form-control form-control-sm py-2 shadow-sm" placeholder="Ex: 2000x1000" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Quantidade (Qtd)</label>
                <input type="number" name="quantidade" value="${c.quantidade || 0}" class="form-control form-control-sm py-2 shadow-sm" required>
              </div>
            </div>
          </div>
          <div class="modal-footer border-custom bg-custom-darker d-flex flex-nowrap pt-3">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary w-100 w-sm-auto text-dark fw-bold shadow-sm"><i class="fa-solid fa-save me-1"></i> Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${c.id}" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 bg-custom-darker shadow-lg">
          <form method="POST" action="/chapas/excluir/${c.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Chapa Excluída!')">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="mb-2 fw-bold text-white">Excluir Chapa?</h6>
              <p class="text-muted mb-0" style="font-size:0.8rem;">Deseja remover o material <b class="text-white">${c.material} - ${c.modelo}</b> do stock?</p>
            </div>
            <div class="modal-footer justify-content-center bg-custom-darker border-0 flex-nowrap pt-2 pb-3 px-3">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Sim, Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `).join("");

  // Modais de Edição e Deleção de Facas
  const modaisFacas = facas.map(f => {
    const isManutencao = f.em_manutencao;
    const dataSaidaFormatada = f.data_saida ? String(f.data_saida).slice(0, 10) : '';
    const dataEntradaFormatada = f.data_entrada ? String(f.data_entrada).slice(0, 10) : '';

    return `
    <div class="modal fade" id="editarFacaModal${f.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/facas/editar/${f.id}" enctype="multipart/form-data" class="modal-content erp-modal border-0 shadow-lg bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Manutenção Atualizada!')">
          <div class="modal-header bg-custom-darker border-custom">
            <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Manutenção</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="row g-3">
              
              <div class="col-12 border-bottom border-custom pb-3 mb-1">
                <div class="form-check form-switch d-flex align-items-center gap-2">
                  <input class="form-check-input" type="checkbox" role="switch" id="statusManutencaoFacaEdit${f.id}" name="status" value="em_manutencao" ${isManutencao ? 'checked' : ''} style="width: 40px; height: 20px; cursor: pointer;" onchange="document.getElementById('lblStatusFacaEdit${f.id}').innerText = this.checked ? 'Em Manutenção' : 'Disponível'; document.getElementById('lblStatusFacaEdit${f.id}').className = this.checked ? 'text-warning' : 'text-success';">
                  <label class="form-check-label text-white fw-bold mb-0" for="statusManutencaoFacaEdit${f.id}" style="cursor: pointer; padding-top: 2px;">Status: <span class="${isManutencao ? 'text-warning' : 'text-success'}" id="lblStatusFacaEdit${f.id}">${isManutencao ? 'Em Manutenção' : 'Disponível'}</span></label>
                </div>
              </div>

              <div class="col-12">
                <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Faca / Equipamento</label>
                <input type="text" name="faca" value="${escapeHtmlAttr(f.faca)}" class="form-control form-control-sm py-2 shadow-sm text-white" required>
              </div>

              <div class="col-6">
                <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Data Saída</label>
                <input type="date" name="data_saida" value="${dataSaidaFormatada}" class="form-control form-control-sm py-2 shadow-sm text-white" required>
              </div>

              <div class="col-6">
                <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Retirada por</label>
                <input type="text" name="nome_retirou" value="${escapeHtmlAttr(f.nome_retirou || '')}" class="form-control form-control-sm py-2 shadow-sm text-white" placeholder="Nome">
              </div>

              <div class="col-6">
                <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Data Retorno</label>
                <input type="date" name="data_entrada" value="${dataEntradaFormatada}" class="form-control form-control-sm py-2 shadow-sm text-white">
              </div>

              <div class="col-6">
                <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Entregue por</label>
                <input type="text" name="nome_entregou" value="${escapeHtmlAttr(f.nome_entregou || '')}" class="form-control form-control-sm py-2 shadow-sm text-white" placeholder="Nome">
              </div>

              <div class="col-12">
                <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Descrição / Problema</label>
                <textarea name="descricao" class="form-control form-control-sm shadow-sm text-white" rows="2" required>${escapeHtmlAttr(f.descricao || '')}</textarea>
              </div>

              <div class="col-12">
                <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Nova Imagem (Substituir)</label>
                <input type="file" name="imagem_faca" class="form-control form-control-sm py-2 shadow-sm text-white" accept="image/*" onchange="previewImagemFaca(this, 'previewEditFaca${f.id}')">
                <img id="previewEditFaca${f.id}" src="${f.imagem_faca ? '/uploads/' + f.imagem_faca : ''}" data-original="${f.imagem_faca ? '/uploads/' + f.imagem_faca : ''}" style="${f.imagem_faca ? 'display:block;' : 'display:none;'} width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-top: 10px; border: 1px solid rgba(255,255,255,0.1);">
              </div>
              
            </div>
          </div>
          <div class="modal-footer border-custom bg-custom-darker d-flex flex-nowrap pt-3">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-warning w-100 w-sm-auto text-dark fw-bold shadow-sm"><i class="fa-solid fa-save me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirFacaModal${f.id}" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 bg-custom-darker shadow-lg">
          <form method="POST" action="/facas/excluir/${f.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Manutenção Excluída!')">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-trash-can fa-3x text-danger mb-3"></i>
              <h6 class="mb-2 fw-bold text-white">Excluir Registro?</h6>
              <p class="text-muted mb-0" style="font-size:0.8rem;">Deseja remover o registro da faca <b class="text-white">${escapeHtmlAttr(f.faca)}</b>?</p>
            </div>
            <div class="modal-footer justify-content-center bg-custom-darker border-0 flex-nowrap pt-2 pb-3 px-3">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Sim, Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    `;
  }).join("");

  const modalManutencaoFacaHtml = `
  <div class="modal fade" id="novaManutencaoFacaModal" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <form method="POST" action="/facas/manutencao" enctype="multipart/form-data" class="modal-content erp-modal border-0 shadow-lg bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Manutenção Registrada!')">
        <div class="modal-header bg-custom-darker border-custom">
          <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-screwdriver-wrench me-2 text-warning"></i> Registrar Manutenção</h6>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body text-sm p-4 bg-custom-dark">
          <div class="row g-3">
            
            <div class="col-12 border-bottom border-custom pb-3 mb-1">
              <div class="form-check form-switch d-flex align-items-center gap-2">
                <input class="form-check-input" type="checkbox" role="switch" id="statusManutencaoFaca" name="status" value="em_manutencao" checked style="width: 40px; height: 20px; cursor: pointer;">
                <label class="form-check-label text-white fw-bold mb-0" for="statusManutencaoFaca" style="cursor: pointer; padding-top: 2px;">Status: <span class="text-warning" id="lblStatusFaca">Em Manutenção</span></label>
              </div>
            </div>

            <div class="col-12">
              <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Faca / Equipamento</label>
              <input type="text" name="faca" class="form-control form-control-sm py-2 shadow-sm text-white" placeholder="Ex: Faca N20" required>
            </div>

            <div class="col-6">
              <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Data Saída</label>
              <input type="date" name="data_saida" class="form-control form-control-sm py-2 shadow-sm text-white" required>
            </div>
            <div class="col-6">
              <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Retirada por</label>
              <input type="text" name="nome_retirou" class="form-control form-control-sm py-2 shadow-sm text-white" placeholder="Nome">
            </div>

            <div class="col-6">
              <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Data Retorno</label>
              <input type="date" name="data_entrada" class="form-control form-control-sm py-2 shadow-sm text-white">
            </div>
            <div class="col-6">
              <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Entregue por</label>
              <input type="text" name="nome_entregou" class="form-control form-control-sm py-2 shadow-sm text-white" placeholder="Nome">
            </div>

            <div class="col-12">
              <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Descrição / Problema</label>
              <textarea name="descricao" class="form-control form-control-sm shadow-sm text-white" rows="2" placeholder="Detalhes da manutenção..." required></textarea>
            </div>

            <div class="col-12">
              <label class="form-label mb-1 fw-bold" style="font-size:0.75rem;">Imagem (Opcional)</label>
              <input type="file" name="imagem_faca" class="form-control form-control-sm py-2 shadow-sm text-white" accept="image/*" onchange="previewImagemFaca(this, 'previewNovaFaca')">
              <img id="previewNovaFaca" src="" style="display:none; width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-top: 10px; border: 1px solid rgba(255,255,255,0.1);">
            </div>

          </div>
        </div>
        <div class="modal-footer border-custom bg-custom-darker pt-3">
          <div class="d-flex gap-2 ms-auto">
            <button type="button"
                    class="btn btn-sm btn-outline-secondary text-white"
                    style="width: 120px;"
                    data-bs-dismiss="modal">
              Cancelar
            </button>

            <button type="submit"
                    class="btn btn-sm btn-warning text-dark fw-bold shadow-sm"
                    style="width: 120px;">
              <i class="fa-solid fa-save me-1"></i> Registrar
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
  `;

  const containerFacasBody = facas && facas.length > 0 
      ? facas.map(f => {
          const isManutencao = f.em_manutencao;
          const statusBadge = isManutencao
            ? '<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-50"><i class="fa-solid fa-screwdriver-wrench me-1"></i> Em Manutenção</span>'
            : '<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-50"><i class="fa-solid fa-check me-1"></i> Disponível</span>';
          
          return `
          <div class="bg-custom-dark border border-custom p-3 rounded-3 shadow-sm mb-2 d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 cursor-pointer transition-hover" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('editarFacaModal${f.id}')).show();" title="Clique para editar">
              <div class="d-flex align-items-center gap-3 w-100 w-sm-auto">
                  ${f.imagem_faca ? `<img src="/uploads/${f.imagem_faca}" class="rounded shadow-sm cursor-pointer" style="width: 45px; height: 45px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);" onclick="event.stopPropagation(); abrirImagemGrande('/uploads/${f.imagem_faca}', event);">` : `<div class="rounded shadow-sm bg-custom-darker d-flex align-items-center justify-content-center text-white-50 border-custom" style="width: 45px; height: 45px;"><i class="fa-solid fa-image"></i></div>`}
                  <div class="flex-grow-1">
                      <div class="d-flex align-items-center gap-2">
                          <h6 class="text-white fw-bold mb-1" style="font-size: 0.85rem;">${escapeHtmlAttr(f.faca)}</h6>
                      </div>
                      <div class="text-muted" style="font-size: 0.7rem;">
                          <i class="fa-solid fa-arrow-right-from-bracket text-danger me-1"></i> Saiu: ${f.data_saida ? new Date(f.data_saida).toLocaleDateString('pt-BR') : '-'} (${escapeHtmlAttr(f.nome_retirou || 'N/A')})
                      </div>
                      <div class="text-muted mt-1 text-truncate" style="font-size: 0.7rem; max-width: 250px;"><i class="fa-solid fa-align-left me-1"></i> ${escapeHtmlAttr(f.descricao || '')}</div>
                  </div>
              </div>
              <div class="d-flex flex-row flex-sm-column align-items-center align-items-sm-end justify-content-between w-100 w-sm-auto mt-2 mt-sm-0 gap-2">
                  <div class="d-flex flex-column align-items-start align-items-sm-end gap-1">
                      ${statusBadge}
                      ${!isManutencao && f.data_entrada ? `<div class="text-muted mt-1" style="font-size: 0.65rem;"><i class="fa-solid fa-arrow-right-to-bracket text-success me-1"></i> Voltou: ${new Date(f.data_entrada).toLocaleDateString('pt-BR')}</div>` : ''}
                  </div>
                  <div class="d-flex gap-1 ms-sm-2">
                      <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger py-1 px-2 shadow-sm" data-bs-toggle="modal" data-bs-target="#excluirFacaModal${f.id}" title="Excluir" onclick="event.stopPropagation();">
                        <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
                      </button>
                  </div>
              </div>
          </div>
          `;
      }).join("") 
      : `
        <div class="text-white-50 p-5 text-center flex-grow-1 d-flex flex-column justify-content-center align-items-center">
            <i class="fa-solid fa-toolbox fa-3x mb-3 opacity-25"></i>
            <p class="mb-0" style="font-size: 0.85rem;">Nenhuma faca registada no módulo de manutenção no momento.</p>
        </div>
      `;

  const menuHTML = menuLateral(user, "/chapas");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Chapas e Facas | Ecoflow</title>
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

      /* PLACEHOLDERS GLOBAL */
      ::-webkit-input-placeholder { color: rgba(255, 255, 255, 0.5) !important; opacity: 1 !important; }
      ::-moz-placeholder { color: rgba(255, 255, 255, 0.5) !important; opacity: 1 !important; }
      :-ms-input-placeholder { color: rgba(255, 255, 255, 0.5) !important; opacity: 1 !important; }
      ::-ms-input-placeholder { color: rgba(255, 255, 255, 0.5) !important; opacity: 1 !important; }
      ::placeholder { color: rgba(255, 255, 255, 0.5) !important; opacity: 1 !important; }
      .form-control::placeholder { color: rgba(255, 255, 255, 0.5) !important; opacity: 1 !important; }

      body.theme-light ::-webkit-input-placeholder { color: #888888 !important; opacity: 1 !important; }
      body.theme-light ::-moz-placeholder { color: #888888 !important; opacity: 1 !important; }
      body.theme-light :-ms-input-placeholder { color: #888888 !important; opacity: 1 !important; }
      body.theme-light ::-ms-input-placeholder { color: #888888 !important; opacity: 1 !important; }
      body.theme-light ::placeholder { color: #888888 !important; opacity: 1 !important; }
      body.theme-light .form-control::placeholder { color: #888888 !important; opacity: 1 !important; }

      input[type="date"].form-control {
        color-scheme: dark;
      }

      /* Sidebar */
      .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column;}
      .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s;}
      .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
      
      .content { flex: 1; padding: 24px; overflow-y: auto; background-color: #1f1f1f; }
      
      /* Tema Escuro Customizado */
      .bg-custom-dark { background-color: #2a2a2a !important; }
      .bg-custom-darker { background-color: #222222 !important; }
      .border-custom { border-color: rgba(255,255,255,0.08) !important; border-width: 1px; }
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

      /* Utilities */
      .text-sm { font-size: 0.875rem; }
      .help-icon { cursor: help; }
      
      .transition-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .transition-hover:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }

      /* Pagination */
      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); cursor: pointer; padding: 0.25rem 0.5rem; font-size: 0.75rem; }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; font-weight: bold; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
      .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.05); cursor: default; }

      /* ANIMAÇÕES DOS ÍCONES DE ALERTA & SUCESSO */
      @keyframes pulseIcon {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); opacity: 0.8; }
        100% { transform: scale(1); }
      }
      .anim-pulse { 
        animation: pulseIcon 1.5s infinite ease-in-out; 
      }

      /* CLASSES DO ALERTA RETRÁTIL */
      .alert-collapse-wrapper {
          max-height: 150px; 
          overflow: hidden;
          transition: max-height 0.4s ease;
      }
      .alert-collapse-wrapper.expanded {
          max-height: 3000px; 
      }
      .alert-fade-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 60px;
          pointer-events: none;
          transition: opacity 0.3s ease;
      }
      .alert-collapse-wrapper.expanded .alert-fade-overlay {
          opacity: 0; 
      }

      /* Tabelas e Modais */
      .erp-card {
          border-radius: 12px;
          background: #2a2a2a;
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          overflow: hidden;
      }
      
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
          font-size: 0.75rem;
          text-transform: uppercase;
      }
      .table tbody td { 
          border-bottom: 1px solid rgba(255,255,255,0.05) !important; 
          background-color: transparent !important; 
          color: #fff !important; 
      }
      
      /* Redução de Padding e Tamanhos da Tabela para Ajuste de Espaço */
      .table-sm th, .table-sm td { padding: 4px 6px !important; }
      .col-min-md { min-width: 90px; }
      .col-min-sm { min-width: 70px; }
      .col-filter { min-width: 70px; font-size: 0.75rem; padding: 2px 4px; }
      
      .table-hover-row { transition: background-color 0.2s; }
      .table-hover-row:hover > td {
          background-color: rgba(255,255,255,0.06) !important;
      }

      .cursor-pointer { cursor: pointer; }

      /* Modals */
      .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5); background-color: #2a2a2a; }
      .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); }
      .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); }

      /* Offcanvas Mobile */
      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 16px; }
        .btn-mobile-full { width: 100%; display: block; margin-bottom: 10px; text-align: center;}
        .w-sm-auto { width: auto !important; }
      }
      @media (min-width: 768px) {
        .w-sm-auto { width: auto !important; }
      }
      .offcanvas { background-color: #1f1f1f !important; }
      .offcanvas-body a { display: block; text-align: left; padding: 12px 15px; color: white; text-decoration: none; margin: 4px 0; border-radius: 6px;}
      .offcanvas-body a:hover, .offcanvas-body a.active { background-color: rgba(255,255,255,0.1); }

      /* Skeleton Loading Dark */
      .skeleton-dark { 
        background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%) !important; 
        background-size: 200% 100% !important; 
        animation: skeleton-loading-view 1.5s infinite linear !important; 
        border-color: transparent !important; 
        box-shadow: none !important; 
        pointer-events: none; 
      }
      .skeleton-dark * { visibility: hidden !important; }
      @keyframes skeleton-loading-view { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

      /* Toasts Animations */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; background-color: #2a2a2a !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.08) !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: var(--verde-ecoflow); width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

    </style>
  </head>
  <body>
    
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

    <div class="content" id="mainContentWrapper">
      
      <!-- HEADER ESTOQUE CHAPAS -->
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-layer-group text-muted me-2"></i>Estoque de Chapas e Facas</h5>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.7rem;">Gestão de materiais e manutenções</span>
            </div>
        </div>
      </div>

      ${containerSaude}

      <!-- GRÁFICO DE ESTOQUE ATUAL -->
      <div class="bg-custom-darker p-3 rounded-3 shadow-sm border border-custom mb-4" id="chartContainer" style="height: 280px; position: relative;">
          <div class="d-flex justify-content-between align-items-center mb-2 gap-2 flex-nowrap">
              <h6 class="mb-0 fw-bold text-white text-nowrap" style="font-size:0.85rem;"><i class="fa-solid fa-chart-column text-accent me-2"></i> Estoque Atual por Chapa</h6>
          </div>
          <div class="flex-grow-1" style="position: relative; width: 100%; height: 210px;">
              <canvas id="graficoEstoque"></canvas>
          </div>
      </div>

      <!-- ESTRUTURA GRID: CHAPAS (Esquerda) e FACAS (Direita) -->
      <div class="row g-4 mb-5 align-items-stretch">
          
          <!-- COLUNA ESQUERDA: CHAPAS -->
          <div class="col-12 col-xl-7 d-flex flex-column">
              
              <!-- HEADER AÇÕES CHAPAS -->
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 bg-custom-darker p-3 rounded-3 shadow-sm border border-custom gap-3">
                <div class="d-flex gap-2 flex-wrap w-100 w-sm-auto">
                  <button class="btn btn-sm btn-success shadow-sm btn-mobile-full text-dark fw-bold px-2" data-bs-toggle="modal" data-bs-target="#novaChapaModal">
                    <i class="fa-solid fa-plus me-1"></i> Nova Chapa
                  </button>
                  <button class="btn btn-sm btn-primary shadow-sm btn-mobile-full fw-bold text-dark px-2" data-bs-toggle="modal" data-bs-target="#calcChapaModal">
                    <i class="fa-solid fa-calculator me-1"></i> Calculadora
                  </button>
                  <a href="/exportar/chapas" target="_blank" class="btn btn-sm btn-outline-success shadow-sm btn-mobile-full fw-bold px-2" title="Exportar para Excel">
                    <i class="fa-solid fa-file-excel"></i>
                  </a>
                </div>
                <div class="text-start text-sm-end w-100 w-sm-auto border-top border-custom border-sm-0 pt-3 pt-sm-0">
                  <h6 class="mb-0 text-muted" style="font-size:0.8rem;">Total: <strong class="text-white" id="totalRegistos">${chapas.length}</strong></h6>
                </div>
              </div>

              <!-- TABELA CHAPAS COM PAGINAÇÃO -->
              <div class="erp-card border-custom flex-grow-1 d-flex flex-column" id="tabelaContainer">
                <div class="table-responsive flex-grow-1" style="min-height: 350px;">
                  <table class="table table-sm align-middle mb-0" id="tabelaChapas" style="font-size: 0.8rem; border-collapse: separate; border-spacing: 0;">
                    <thead class="table-light">
                      <tr>
                        <th class="text-start col-min-md border-0">
                          Material 
                        </th>
                        <th class="text-start col-min-md border-0">
                          Modelo
                        </th>
                        <th class="col-min-md border-0">
                          Fornecedor
                        </th>
                        <th class="col-min-sm border-0">
                          Medida
                        </th>
                        <th class="text-center col-min-sm border-0">
                          Qtd.
                        </th>
                        <th class="text-end border-0">Ações</th>
                      </tr>
                      <tr class="bg-custom-darker border-bottom border-custom">
                        <th class="border-0"><input type="text" class="form-control form-control-sm col-filter fw-normal shadow-none" data-col="0" placeholder="Pesquisar material..."></th>
                        <th class="border-0"><input type="text" class="form-control form-control-sm col-filter fw-normal shadow-none" data-col="1" placeholder="Pesquisar modelo..."></th>
                        <th class="border-0"><input type="text" class="form-control form-control-sm col-filter fw-normal shadow-none" data-col="2" placeholder="Pesquisar fornecedor..."></th>
                        <th class="border-0"><input type="text" class="form-control form-control-sm col-filter fw-normal shadow-none" data-col="3" placeholder="Ex: 2000x1000..."></th>
                        <th class="border-0"><input type="number" class="form-control form-control-sm col-filter fw-normal text-center shadow-none" data-col="4" placeholder="Filtrar Qtd..."></th>
                        <th class="border-0"></th>
                      </tr>
                    </thead>
                    <tbody class="border-top-0">
                      ${linhas || "<tr><td colspan='6' class='text-center text-muted py-5'><i class='fa-solid fa-layer-group fa-2x mb-3 opacity-25'></i><br>Nenhuma chapa cadastrada.</td></tr>"}
                    </tbody>
                  </table>
                </div>
                <div id="paginationContainer" class="d-flex justify-content-center mt-3 mb-3 flex-shrink-0"></div>
              </div>
          </div>

          <!-- COLUNA DIREITA: FACAS -->
          <div class="col-12 col-xl-5 d-flex flex-column">
              
              <!-- HEADER AÇÕES FACAS -->
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 bg-custom-darker p-3 rounded-3 shadow-sm border border-custom gap-3">
                  <div class="d-flex align-items-center">
                      <i class="fa-solid fa-screwdriver-wrench text-warning me-2 fa-lg"></i>
                      <h6 class="fw-bold text-white mb-0" style="font-size: 0.9rem;">Controle de Facas</h6>
                  </div>
                  <button class="btn btn-sm btn-warning fw-bold text-dark shadow-sm btn-mobile-full px-3" data-bs-toggle="modal" data-bs-target="#novaManutencaoFacaModal">
                      <i class="fa-solid fa-plus me-1"></i> Nova Manutenção
                  </button>
              </div>

              <!-- CONTAINER LISTA FACAS -->
              <div class="erp-card border-custom flex-grow-1 d-flex flex-column p-3 bg-custom-dark" id="facasContainer" style="min-height: 350px;">
                  ${containerFacasBody}
              </div>

          </div>

      </div>

    </div>

    <!-- MODAL CADASTRAR CHAPA -->
    <div class="modal fade" id="novaChapaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/chapas/novo" class="modal-content erp-modal border-0 shadow-lg bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Chapa Cadastrada!')">
          <div class="modal-header bg-custom-darker border-custom">
            <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-layer-group me-2 text-success"></i> Cadastrar Nova Chapa</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="row g-3">
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Material</label>
                <select name="material" class="form-select form-select-sm py-2 shadow-sm text-white" required>
                    <option value="" disabled selected>Selecione...</option>
                    <option value="Pardo">Pardo</option>
                    <option value="Branco">Branco</option>
                </select>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Modelos feitos com a chapa</label>
                <input type="text" name="modelo" class="form-control form-control-sm py-2 shadow-sm" placeholder="Ex: N20 e N26" required>
              </div>
              <div class="col-12">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Fornecedor</label>
                <input type="text" name="fornecedor" class="form-control form-control-sm py-2 shadow-sm" placeholder="Empresa Fornecedora" required>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Medida da Chapa</label>
                <input type="text" name="medida" class="form-control form-control-sm py-2 shadow-sm" placeholder="Ex: 2000x1000" required>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Quantidade Inicial</label>
                <input type="number" name="quantidade" class="form-control form-control-sm py-2 shadow-sm" value="0" required>
              </div>
            </div>
          </div>
          <div class="modal-footer border-custom bg-custom-darker d-flex flex-nowrap pt-3">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success w-100 text-dark fw-bold shadow-sm"><i class="fa-solid fa-check me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL CALCULADORA -->
    <div class="modal fade" id="calcChapaModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <div class="modal-header bg-custom-darker border-custom">
            <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-calculator me-2 text-primary"></i> Calculadora de Chapa</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm p-4 bg-custom-dark">
            <div class="row g-2 mb-3">
              <div class="col-4">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Comp. (C)</label>
                <input type="number" id="calcC" class="form-control form-control-sm shadow-sm" placeholder="mm">
              </div>
              <div class="col-4">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Largura (L)</label>
                <input type="number" id="calcL" class="form-control form-control-sm shadow-sm" placeholder="mm">
              </div>
              <div class="col-4">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Altura (A)</label>
                <input type="number" id="calcA" class="form-control form-control-sm shadow-sm" placeholder="mm">
              </div>
            </div>
            <button type="button" id="btnCalcular" class="btn btn-sm btn-primary w-100 mb-3 fw-bold text-dark shadow-sm py-2">Calcular Medidas</button>
            
            <div class="p-3 bg-custom-darker rounded border-custom shadow-sm">
                <h6 class="fw-bold text-white mb-3" style="font-size:0.8rem;">Resultado:</h6>
                <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Comprimento da Chapa:</span>
                    <strong class="text-accent"><span id="resComp">-</span> mm</strong>
                </div>
                <div class="d-flex justify-content-between">
                    <span class="text-muted">Largura da Chapa:</span>
                    <strong class="text-accent"><span id="resLarg">-</span> mm</strong>
                </div>
                <div class="text-muted mt-3 pt-2 border-top border-custom" style="font-size: 0.7rem;">
                    <span class="d-block mb-1 text-white opacity-75">Fórmulas utilizadas:</span>
                    Comp = (C + L) * 2 + 54<br>
                    Largura = L + A + 24
                </div>
            </div>
          </div>
          <div class="modal-footer border-custom bg-custom-darker">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Fechar Calculadora</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAIS DE FACAS -->
    ${modalManutencaoFacaHtml}
    ${modaisFacas}

    ${modais}

    <!-- TOASTS DE FEEDBACK -->
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
                <p class="text-white-50 mb-0" style="font-size:0.8rem; opacity: 0.9;" id="sucessoSub">A processar...</p>
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
                <p class="text-white-50 mb-0" style="font-size:0.8rem; opacity: 0.9;" id="erroSub">Ocorreu um erro ao processar.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
        </div>
    </div>

    <!-- MODAL FEEDBACK SUCESSO GERAL -->
    <div class="modal fade" id="sucessoChapaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 bg-custom-darker shadow-lg">
          <div class="modal-body text-center p-5">
            <i class="fa-solid fa-circle-check fa-4x text-success mb-3 anim-pulse"></i>
            <h5 class="fw-bold text-white mb-2" style="font-size: 1.1rem;" id="sucessoChapaTitulo">Sucesso!</h5>
            <p class="text-muted mb-0" style="font-size:0.8rem;">Salvando os dados, por favor aguarde...</p>
          </div>
        </div>
      </div>
    </div>

    ${termosHTML}

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

    <script>
      let isSubmitting = false;
      let chartEstoque = null;
      
      const chapasDataForChart = ${JSON.stringify(chapas.map(c => ({
          label: c.material + ' ' + c.modelo,
          qtd: Number(c.quantidade) || 0
      })))};

      // =======================================================================
      // FUNÇÃO DE PRÉ-VISUALIZAÇÃO DE IMAGEM DA FACA
      // =======================================================================
      window.previewImagemFaca = function(input, imgId) {
          const img = document.getElementById(imgId);
          if (input.files && input.files[0]) {
              const reader = new FileReader();
              reader.onload = function(e) {
                  img.src = e.target.result;
                  img.style.display = 'block';
              }
              reader.readAsDataURL(input.files[0]);
          } else {
              if (img.getAttribute('data-original')) {
                  img.src = img.getAttribute('data-original');
                  img.style.display = 'block';
              } else {
                  img.src = '';
                  img.style.display = 'none';
              }
          }
      };

      // =======================================================================
      // PLUGIN INLINE DO CHART.JS PARA LABELS EM CIMA DAS BARRAS
      // =======================================================================
      const pluginValoresGrafico = {
          id: 'pluginValoresGrafico',
          afterDatasetsDraw(chart, args, pluginOptions) {
              const { ctx, data } = chart;
              ctx.save();
              data.datasets.forEach((dataset, i) => {
                  const meta = chart.getDatasetMeta(i);
                  if (!meta.hidden) {
                      meta.data.forEach((element, index) => {
                          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                          ctx.font = 'bold 11px sans-serif';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'bottom';
                          
                          const valorStr = dataset.data[index].toLocaleString('pt-BR');
                          const position = element.tooltipPosition();
                          
                          // Ajuste para não cortar o número caso a barra esteja colada no teto
                          const yPos = position.y < 20 ? position.y + 15 : position.y - 5;
                          
                          ctx.fillText(valorStr, position.x, yPos);
                      });
                  }
              });
              ctx.restore();
          }
      };

      // =======================================================================
      // FUNÇÃO GENÉRICA DE TOAST (SUCESSO E ERRO) E SKELETON
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

              const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
              toast.show();
          }
      }

      function mostrarToastCarregando(mensagem) {
          const successToastEl = document.getElementById('sucessoToast');
          if(!successToastEl) return;
          document.getElementById('sucessoTitulo').innerText = "Processando";
          document.getElementById('sucessoSub').innerText = mensagem;

          successToastEl.setAttribute('data-bs-autohide', 'false');

          const timerEl = document.getElementById('sucessoTimer');
          if (timerEl) timerEl.style.display = 'none';

          const oldInstance = bootstrap.Toast.getInstance(successToastEl);
          if (oldInstance) oldInstance.dispose();
          const successToast = new bootstrap.Toast(successToastEl);
          successToast.show();
      }

      function mostrarSkeletonGlobais() {
          if (document.getElementById('skeleton-temp-container')) return;
          const mainContent = document.getElementById('mainContentWrapper');
          if (mainContent) mainContent.style.display = 'none';

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="w-100">
              <div class="skeleton-dark rounded mb-4" style="height: 250px; width: 100%;"></div>
              
              <div class="row g-4">
                  <div class="col-12 col-xl-7">
                      <div class="skeleton-dark rounded mb-3" style="height: 60px; width: 100%;"></div>
                      <div class="skeleton-dark rounded" style="height: 350px; width: 100%;"></div>
                  </div>
                  <div class="col-12 col-xl-5">
                      <div class="skeleton-dark rounded mb-3" style="height: 60px; width: 100%;"></div>
                      <div class="skeleton-dark rounded" style="height: 350px; width: 100%;"></div>
                  </div>
              </div>
          </div>\`;
          
          document.querySelector('.content').insertAdjacentHTML('beforeend', skeletonHTML);
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const mainContent = document.getElementById('mainContentWrapper');
          if (mainContent) mainContent.style.display = '';
      }

      // =======================================================================
      // GRÁFICO DE BARRAS DE ESTOQUE
      // =======================================================================
      function renderizarGraficoEstoque() {
          const canvas = document.getElementById('graficoEstoque');
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          
          if (chartEstoque) {
              chartEstoque.destroy();
          }

          const labels = chapasDataForChart.map(c => c.label);
          const data = chapasDataForChart.map(c => c.qtd);
          const colors = chapasDataForChart.map(c => c.qtd < 5000 ? 'rgba(220, 53, 69, 0.85)' : 'rgba(8, 192, 104, 0.85)');
          const borderColors = chapasDataForChart.map(c => c.qtd < 5000 ? 'rgba(220, 53, 69, 1)' : 'rgba(8, 192, 104, 1)');

          chartEstoque = new Chart(ctx, {
              type: 'bar',
              data: {
                  labels: labels,
                  datasets: [{
                      label: 'Quantidade em Estoque',
                      data: data,
                      backgroundColor: colors,
                      borderColor: borderColors,
                      borderWidth: 1,
                      borderRadius: 4
                  }]
              },
              plugins: [pluginValoresGrafico],
              options: {
                  layout: {
                      padding: {
                          top: 25 
                      }
                  },
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: { display: false },
                      tooltip: {
                          backgroundColor: '#1f1f1f',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderWidth: 1,
                          titleFont: { size: 13, family: "'Segoe UI', sans-serif" },
                          bodyFont: { size: 12, family: "'Segoe UI', sans-serif" },
                          padding: 10,
                          callbacks: {
                              label: function(context) {
                                  return context.parsed.y.toLocaleString('pt-BR') + ' unidades';
                              }
                          }
                      }
                  },
                  scales: {
                      y: { 
                          beginAtZero: true, 
                          grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                          ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } } 
                      },
                      x: { 
                          grid: { display: false }, 
                          ticks: { 
                              color: 'rgba(255,255,255,0.4)',
                              font: { size: 10 },
                              maxRotation: 45,
                              minRotation: 0
                          } 
                      }
                  }
              }
          });
      }

      // =======================================================================
      // INICIALIZAÇÃO DE SCRIPTS LOCAIS (Filtros, Calculadora, Paginação JS)
      // =======================================================================
      function inicializarScriptsView() {
          renderizarGraficoEstoque();

          // Tooltips do Bootstrap
          const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
          tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

          // Switch de Facas no Modal
          document.querySelectorAll('input[type="checkbox"][id^="statusManutencaoFaca"]').forEach(switchFaca => {
              switchFaca.addEventListener('change', function() {
                  const lblId = this.id.replace('statusManutencaoFaca', 'lblStatusFaca');
                  const lblFaca = document.getElementById(lblId);
                  if (lblFaca) {
                      if(this.checked) {
                          lblFaca.innerText = 'Em Manutenção';
                          lblFaca.className = 'text-warning';
                      } else {
                          lblFaca.innerText = 'Disponível';
                          lblFaca.className = 'text-success';
                      }
                  }
              });
          });

          // Calculadora de Chapa
          const btnCalcular = document.getElementById('btnCalcular');
          if (btnCalcular) {
              btnCalcular.addEventListener('click', () => {
                  const c = Number(document.getElementById('calcC').value) || 0;
                  const l = Number(document.getElementById('calcL').value) || 0;
                  const a = Number(document.getElementById('calcA').value) || 0;
                  
                  const comp = (c + l) * 2 + 54;
                  const larg = l + a + 24;
                  
                  document.getElementById('resComp').innerText = comp;
                  document.getElementById('resLarg').innerText = larg;
              });
          }

          // Botão Retrátil (Exibir Tudo) da Saúde do Estoque
          const wrapper = document.getElementById('alertContentWrapper');
          const containerCards = document.getElementById('alertCardsContainer');
          const btnToggle = document.getElementById('btnToggleAlert');
          const toggleContainer = document.getElementById('alertToggleContainer');

          if (wrapper && containerCards && btnToggle) {
            if (containerCards.scrollHeight > wrapper.clientHeight) {
              toggleContainer.style.display = 'block'; 
              btnToggle.addEventListener('click', function() {
                wrapper.classList.toggle('expanded');
                if (wrapper.classList.contains('expanded')) {
                  btnToggle.innerHTML = 'Ocultar <i class="fa-solid fa-chevron-up ms-1"></i>';
                } else {
                  btnToggle.innerHTML = 'Exibir tudo <i class="fa-solid fa-chevron-down ms-1"></i>';
                }
              });
            } else {
              const overlay = document.getElementById('alertFadeOverlay');
              if(overlay) overlay.style.display = 'none';
            }
          }

          // --- PAGINAÇÃO INTELIGENTE (FRONTEND) ---
          window.chapasPageSize = 10;
          window.chapasCurrentPage = 1;
          window.chapasFilteredRows = [];

          window.mudarPagina = function(page) {
              const totalPages = Math.ceil(window.chapasFilteredRows.length / window.chapasPageSize) || 1;
              if (page < 1 || page > totalPages) return;
              window.chapasCurrentPage = page;
              
              // Oculta todas
              document.querySelectorAll('#tabelaChapas tbody tr.chapa-row').forEach(r => r.style.display = 'none');
              
              // Exibe apenas as da página atual
              const start = (window.chapasCurrentPage - 1) * window.chapasPageSize;
              const end = start + window.chapasPageSize;
              for (let i = start; i < end && i < window.chapasFilteredRows.length; i++) {
                  window.chapasFilteredRows[i].style.display = '';
              }
              
              renderPagination();
          };

          function renderPagination() {
              const totalPages = Math.ceil(window.chapasFilteredRows.length / window.chapasPageSize) || 1;
              const paginationEl = document.getElementById('paginationContainer');
              if (!paginationEl) return;

              if (totalPages <= 1) {
                  paginationEl.innerHTML = '';
                  return;
              }

              let html = '<nav><ul class="pagination pagination-sm mb-0 shadow-sm">';
              html += \`<li class="page-item \${window.chapasCurrentPage === 1 ? 'disabled' : ''}"><a class="page-link" onclick="window.mudarPagina(\${window.chapasCurrentPage - 1})">«</a></li>\`;

              const delta = 1;
              let l;
              const range = [];
              const rangeWithDots = [];

              for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= window.chapasCurrentPage - delta && i <= window.chapasCurrentPage + delta)) {
                      range.push(i);
                  }
              }

              for (let i of range) {
                  if (l) {
                      if (i - l === 2) {
                          rangeWithDots.push(l + 1);
                      } else if (i - l !== 1) {
                          rangeWithDots.push('...');
                      }
                  }
                  rangeWithDots.push(i);
                  l = i;
              }

              for (let i of rangeWithDots) {
                  if (i === '...') {
                      html += '<li class="page-item disabled"><span class="page-link border-custom bg-custom-darker text-muted">...</span></li>';
                  } else {
                      const activeClass = i === window.chapasCurrentPage ? 'active' : '';
                      html += \`<li class="page-item \${activeClass}"><a class="page-link" onclick="window.mudarPagina(\${i})">\${i}</a></li>\`;
                  }
              }

              html += \`<li class="page-item \${window.chapasCurrentPage === totalPages ? 'disabled' : ''}"><a class="page-link" onclick="window.mudarPagina(\${window.chapasCurrentPage + 1})">»</a></li>\`;
              html += '</ul></nav>';
              
              paginationEl.innerHTML = html;
          }

          window.aplicarFiltrosEPaginacao = function() {
              window.chapasFilteredRows = [];
              const filters = document.querySelectorAll('.col-filter');
              const allRows = document.querySelectorAll('#tabelaChapas tbody tr.chapa-row');
              
              allRows.forEach(row => {
                  let showRow = true;
                  filters.forEach(f => {
                      const colIdx = f.getAttribute('data-col');
                      const filterValue = f.value.toLowerCase().trim();
                      
                      if (filterValue !== "") {
                          const cell = row.querySelectorAll('td')[colIdx];
                          if (cell) {
                              const cellText = cell.textContent.toLowerCase();
                              if (!cellText.includes(filterValue)) {
                                  showRow = false;
                              }
                          }
                      }
                  });

                  if (showRow) {
                      window.chapasFilteredRows.push(row);
                  } else {
                      row.style.display = 'none'; 
                  }
              });

              const counter = document.getElementById('totalRegistos');
              if (counter) counter.innerText = window.chapasFilteredRows.length;

              window.mudarPagina(1);
          };

          const filtersInputs = document.querySelectorAll('.col-filter');
          filtersInputs.forEach(filter => {
              filter.addEventListener('click', function(e) { e.stopPropagation(); });
              filter.addEventListener('input', window.aplicarFiltrosEPaginacao);
          });

          // Chamada Inicial da Paginação e Filtros
          window.aplicarFiltrosEPaginacao();
      }

      function atualizarModaisDinamicos(doc) {
          // Os modais não estáticos (edição, exclusão para cada chapa e faca) precisam ser reinjetados
          const staticModals = ['novaChapaModal', 'calcChapaModal', 'sucessoChapaModal', 'novaManutencaoFacaModal', 'sidebarMenu'];
          document.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) m.remove();
          });
          doc.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
          });
      }

      // =======================================================================
      // SUBMISSÃO AJAX SEM RECARREGAMENTO
      // =======================================================================
      async function prepararSubmissaoSimples(event, form, titleMsg) {
          event.preventDefault();
          if (isSubmitting) return;
          isSubmitting = true;

          const modalEl = form.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }

          mostrarToastCarregando("Processando...");
          mostrarSkeletonGlobais();

          try {
              let bodyData;
              let headers = {};
              
              if (form.enctype === 'multipart/form-data') {
                  bodyData = new FormData(form);
              } else {
                  bodyData = new URLSearchParams();
                  new FormData(form).forEach((value, key) => bodyData.append(key, value));
                  headers['Content-Type'] = 'application/x-www-form-urlencoded';
              }

              const response = await fetch(form.action, {
                  method: form.method || 'POST',
                  headers: headers,
                  body: bodyData
              });

              if (response.ok) {
                  const html = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  const oldContent = document.getElementById('mainContentWrapper');
                  const newContent = doc.getElementById('mainContentWrapper');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }

                  // Avalia o script script que vem no corpo para ter os novos dados
                  const newScript = doc.querySelector('script:not([src])');
                  if(newScript && newScript.textContent.includes('chapasDataForChart')) {
                      eval(newScript.textContent); 
                  }

                  inicializarScriptsView();
                  atualizarModaisDinamicos(doc);

                  mostrarToast('sucesso', 'Concluído!', titleMsg);
                  form.reset();
              } else {
                  mostrarToast('erro', 'Erro', 'Falha ao salvar no servidor.');
              }
          } catch (err) {
              console.error(err);
              mostrarToast('erro', 'Erro de Conexão', 'Verifique sua rede.');
          } finally {
              isSubmitting = false;
              ocultarSkeletonGlobais();
          }
      }

      // =======================================================================
      // INICIALIZADORES DO DOM
      // =======================================================================
      mostrarSkeletonGlobais();

      if (document.readyState === 'complete') {
          setTimeout(() => {
              ocultarSkeletonGlobais();
              inicializarScriptsView();
          }, 100);
      } else {
          window.addEventListener('load', () => {
              ocultarSkeletonGlobais();
              inicializarScriptsView();
          });
      }

      window.addEventListener('beforeunload', () => {
          mostrarSkeletonGlobais();
      });

    </script>
  </body>
  </html>
  `;
}

module.exports = chapasView;