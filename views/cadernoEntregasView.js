// views/cadernoEntregasView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");

// ATENÇÃO: Adicionado o parâmetro clientesHistorico na função
function cadernoEntregasView(usuario, cadernos = [], veiculos = [], clientesHistorico = [], paginacao = {}, filtros = {}) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  const fmtData = (d) => {
    try {
      if(!d) return "-";
      const dt = new Date(d);
      return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    } catch {
      return d || "-";
    }
  };

  const fmtMoeda = (n) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // =========================================================================
  // LÓGICA DE INTELIGÊNCIA: Montagem do dicionário de clientes fixos
  // =========================================================================
  const historicoClientes = {};
  
  if (clientesHistorico && clientesHistorico.length > 0) {
      clientesHistorico.forEach(c => {
          historicoClientes[c.nome] = c.link_endereco || "";
      });
  }

  const optionsClientesHtml = Object.keys(historicoClientes)
      .map(cliente => `<option value="${cliente}">${cliente}</option>`)
      .join('');

  const renderClienteField = (clienteAtual = "") => {
      const isCustom = clienteAtual && !historicoClientes.hasOwnProperty(clienteAtual);
      const isNewMode = isCustom || !clienteAtual;
      
      const selectName = isNewMode ? "" : `name="local[]"`;
      const inputName = isNewMode ? `name="local[]"` : "";
      
      const inputDisplay = isNewMode ? "block" : "none";
      const inputDisabled = isNewMode ? "" : "disabled";

      let optionsHtml = `<option value="" disabled ${!clienteAtual ? 'selected' : ''}>-- Selecionar Cliente --</option>`;
      optionsHtml += `<option value="NOVO_CLIENTE" class="text-success fw-bold" ${isNewMode && clienteAtual ? 'selected' : ''}>+ Cadastrar Novo Cliente</option>`;
      
      Object.keys(historicoClientes).forEach(cliente => {
          const selected = cliente === clienteAtual ? "selected" : "";
          optionsHtml += `<option value="${cliente}" ${selected}>${cliente}</option>`;
      });

      return `
          <select class="form-select form-select-sm mb-1 client-select shadow-sm" ${selectName} onchange="handleClientSelect(this)" required>
              ${optionsHtml}
          </select>
          <input type="text" class="form-control form-control-sm client-input shadow-sm" ${inputName} value="${isCustom ? clienteAtual : ''}" style="display:${inputDisplay};" placeholder="Digite o nome do novo cliente" ${inputDisabled} required>
      `;
  };
  // =========================================================================

  // =========================================================================
  // TABELA E MODAIS DE GESTÃO DE CLIENTES (DENTRO DO MODAL CLIENTE)
  // =========================================================================
  const listaClientesTabela = (clientesHistorico && clientesHistorico.length > 0) ? clientesHistorico.map((c, i) => `
      <tr class="cliente-row-filtro">
          <td class="fw-bold text-dark py-2 cliente-nome-filtro">${c.nome}</td>
          <td class="py-2">${c.link_endereco ? `<a href="${c.link_endereco}" target="_blank" class="text-truncate d-inline-block text-primary" style="max-width: 200px; font-size: 0.8rem;">${c.link_endereco}</a>` : '<span class="text-muted small">Sem link</span>'}</td>
          <td class="text-end py-2">
              <div class="btn-group">
                  <button type="button" class="btn btn-sm btn-light border text-warning shadow-sm py-1 px-2" data-bs-toggle="modal" data-bs-target="#editarClienteModal${i}" title="Editar Cliente"><i class="fa-solid fa-pen" style="font-size:0.75rem;"></i></button>
                  <button type="button" class="btn btn-sm btn-light border text-danger shadow-sm py-1 px-2" data-bs-toggle="modal" data-bs-target="#excluirClienteModal${i}" title="Excluir Cliente"><i class="fa-solid fa-trash" style="font-size:0.75rem;"></i></button>
              </div>
          </td>
      </tr>
  `).join('') : `<tr><td colspan="3" class="text-center text-muted py-4"><i class="fa-solid fa-users-slash fa-2x opacity-25 mb-2"></i><br>Nenhum cliente cadastrado no histórico.</td></tr>`;

  const modaisEdicaoExclusaoClientes = (clientesHistorico && clientesHistorico.length > 0) ? clientesHistorico.map((c, i) => `
      <div class="modal fade" id="editarClienteModal${i}" tabindex="-1" style="z-index: 1060;">
          <div class="modal-dialog modal-dialog-centered">
              <form method="POST" action="/caderno-entregas/clientes/editar" class="modal-content shadow-lg erp-modal" onsubmit="prepararSubmissaoSimples(event, this, 'Cliente Atualizado!')">
                  <input type="hidden" name="nomeOriginal" value="${c.nome}">
                  <div class="modal-header bg-warning text-dark border-0">
                      <h6 class="modal-title fw-bold"><i class="fa-solid fa-pen-to-square me-2"></i> Editar Dados do Cliente</h6>
                      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body p-4 bg-light">
                      <div class="mb-3">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Nome do Cliente / Pizzaria</label>
                          <input type="text" name="nomeNovo" class="form-control form-control-sm shadow-sm" value="${c.nome}" required>
                      </div>
                      <div class="mb-3">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Link do Google Maps</label>
                          <input type="url" name="link_endereco" class="form-control form-control-sm shadow-sm" value="${c.link_endereco || ''}">
                      </div>
                  </div>
                  <div class="modal-footer bg-white border-0 d-flex flex-nowrap">
                      <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-toggle="modal" data-bs-target="#novoClienteModal">Voltar à Lista</button>
                      <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold"><i class="fa-solid fa-save me-1"></i> Salvar Alteração</button>
                  </div>
              </form>
          </div>
      </div>

      <div class="modal fade" id="excluirClienteModal${i}" tabindex="-1" style="z-index: 1060;">
          <div class="modal-dialog modal-sm modal-dialog-centered">
              <form method="POST" action="/caderno-entregas/clientes/excluir" class="modal-content shadow-lg erp-modal" onsubmit="prepararSubmissaoSimples(event, this, 'Cliente Excluído!')">
                  <input type="hidden" name="nome" value="${c.nome}">
                  <div class="modal-body text-center p-4">
                      <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3 anim-pulse"></i>
                      <h6 class="mb-2 fw-bold text-dark">Excluir Cliente?</h6>
                      <p class="text-muted mb-0" style="font-size:0.85rem;"><strong>${c.nome}</strong> será removido permanentemente do histórico de preenchimento automático.</p>
                  </div>
                  <div class="modal-footer justify-content-center bg-light border-0 d-flex flex-nowrap">
                      <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-toggle="modal" data-bs-target="#novoClienteModal">Cancelar</button>
                      <button type="submit" class="btn btn-sm btn-danger w-100">Sim, Excluir</button>
                  </div>
              </form>
          </div>
      </div>
  `).join('') : '';
  // =========================================================================

  const renderSubItensEdicao = (itensStr, totalQtd) => {
    if (!itensStr) {
      return `
        <div class="row g-1 mb-1 sub-item-row">
            <div class="col-8">
                <input type="text" class="form-control form-control-sm sub-item-nome shadow-sm" placeholder="Item do Pedido" required>
            </div>
            <div class="col-3">
                <input type="number" class="form-control form-control-sm sub-item-qtd shadow-sm" placeholder="Qtd" value="${totalQtd || ''}" required>
            </div>
            <div class="col-1 text-end">
                <button type="button" class="btn btn-sm text-danger p-0 mt-1" onclick="this.closest('.sub-item-row').remove();"><i class="fa-solid fa-minus-circle"></i></button>
            </div>
        </div>
      `;
    }

    const partes = itensStr.split(',');
    return partes.map((part) => {
      let nomeItem = part.trim();
      let qtdItem = 1;

      const matchQtd = nomeItem.match(/(.+)\s*\(x?(\d+)\)/i);
      if (matchQtd) {
        nomeItem = matchQtd[1].trim();
        qtdItem = parseInt(matchQtd[2], 10);
      }

      return `
        <div class="row g-1 mb-1 sub-item-row">
            <div class="col-8">
                <input type="text" class="form-control form-control-sm sub-item-nome shadow-sm" value="${nomeItem}" placeholder="Item do Pedido" required>
            </div>
            <div class="col-3">
                <input type="number" class="form-control form-control-sm sub-item-qtd shadow-sm" value="${qtdItem}" placeholder="Qtd" required>
            </div>
            <div class="col-1 text-end">
                <button type="button" class="btn btn-sm text-danger p-0 mt-1" onclick="this.closest('.sub-item-row').remove();"><i class="fa-solid fa-minus-circle"></i></button>
            </div>
        </div>
      `;
    }).join('');
  };

  const veiculosOptions = veiculos.map(v => `<option value="${v.id}">${v.modelo}</option>`).join("");

  const linhas = cadernos.map(c => {
    return `
    <tr class="align-middle table-hover-row" style="cursor: pointer;" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('detalheModal${c.id}')).show();">
      <td class="text-muted fw-medium py-1 px-3"><i class="fa-regular fa-calendar-check me-1"></i> ${fmtData(c.data_criacao)}</td>
      <td class="text-dark fw-bold py-1 px-3"><i class="fa-solid fa-id-card text-muted me-1"></i> ${c.motorista}</td>
      <td class="text-dark py-1 px-3">${c.veiculo_modelo || '<span class="text-muted small">Não informado</span>'}</td>
      <td class="text-center py-1 px-3">
        <span class="badge bg-secondary bg-opacity-75 text-dark" style="font-size: 0.75rem;">
           ${c.entregas ? c.entregas.length : 0} Locais
        </span>
      </td>
      <td class="text-end py-1 px-3">
        <div class="btn-group">
          <a href="/caderno-entregas/pdf/${c.id}" target="_blank" class="btn btn-sm btn-light border text-primary py-1 px-2 shadow-sm" 
             onclick="event.stopPropagation();" title="Imprimir Manifesto PDF">
            <i class="fa-solid fa-file-pdf" style="font-size:0.75rem;"></i>
          </a>
          <button type="button" class="btn btn-sm btn-light border text-danger py-1 px-2 shadow-sm" 
                  onclick="event.stopPropagation(); bootstrap.Modal.getOrCreateInstance(document.getElementById('excluirModal${c.id}')).show();" title="Excluir Caderno">
            <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
          </button>
        </div>
      </td>
    </tr>
    `;
  }).join("");

  const modais = cadernos.map(c => {
    const itensEdicaoHtml = (c.entregas && c.entregas.length > 0) ? c.entregas.map((e) => `
        <div class="row g-2 mb-3 entrega-item align-items-start border p-3 rounded bg-white position-relative shadow-sm mx-1">
            <input type="hidden" name="itens_pedido[]" class="hidden-itens">
            <input type="hidden" name="quantidade[]" class="hidden-qtd">

            <div class="col-12 col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Cliente / Local</label>
                ${renderClienteField(e.local_entrega)}
            </div>
            <div class="col-12 col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Link do Maps</label>
                <input type="url" name="link[]" class="form-control form-control-sm link-maps-input shadow-sm" value="${e.link_endereco || ''}" placeholder="Link do Google Maps">
            </div>
            
            <div class="col-12 col-md-8 mt-2">
                <label class="form-label text-dark fw-bold mb-1" style="font-size:0.75rem;"><i class="fa-solid fa-list-check text-muted me-1"></i> Itens do Pedido</label>
                <div class="sub-itens-container bg-light p-2 rounded border border-opacity-50">
                    ${renderSubItensEdicao(e.itens_pedido, e.quantidade)}
                </div>
                <button type="button" class="btn btn-xs btn-link text-primary text-decoration-none p-0 mt-1 fw-bold" style="font-size:0.75rem;" onclick="addSubItemLinha(this)">
                    <i class="fa-solid fa-plus-circle me-1"></i> Adicionar outro item
                </button>
            </div>

            <div class="col-12 col-md-4 mt-2">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Valor a Receber (Opcional)</label>
                <div class="input-group input-group-sm shadow-sm">
                  <span class="input-group-text">R$</span>
                  <input type="text" name="valor_aberto[]" class="form-control mask-moeda" oninput="maskMoeda(this)" value="${e.valor_aberto ? fmtMoeda(e.valor_aberto) : ''}" placeholder="0,00">
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-danger position-absolute d-flex align-items-center justify-content-center shadow" style="width: 28px; height: 28px; top: -10px; right: -10px; border-radius: 50%; padding: 0; z-index: 10;" onclick="this.closest('.entrega-item').remove();" title="Remover Local">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `).join('') : ''; 

    return `
    <div class="modal fade" id="detalheModal${c.id}" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"> <div class="modal-content erp-modal border-0 shadow">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-route text-primary me-2"></i> Detalhes da Rota</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-light">
            <div class="bg-white p-3 rounded shadow-sm border border-light mb-3" style="font-size: 0.85rem;">
                <div class="row">
                    <div class="col-6 col-md-4 mb-2"><span class="text-muted">Motorista:</span><br><strong>${c.motorista}</strong></div>
                    <div class="col-6 col-md-4 mb-2"><span class="text-muted">Ajudante:</span><br><strong>${c.ajudante || '-'}</strong></div>
                    <div class="col-12 col-md-4"><span class="text-muted">Veículo:</span><br><strong><i class="fa-solid fa-car me-1 text-muted"></i> ${c.veiculo_modelo || 'Não informado'}</strong></div>
                </div>
            </div>

            <h6 class="fw-bold mb-3 mt-4 text-dark" style="font-size: 0.85rem;">Locais de Entrega (${c.entregas ? c.entregas.length : 0}):</h6>
            
            ${(c.entregas && c.entregas.length > 0) ? c.entregas.map((e, index) => `
                <div class="d-flex justify-content-between align-items-center bg-white p-3 border border-light rounded-3 mb-2 shadow-sm">
                    <div class="flex-grow-1 pe-3">
                        <span class="badge bg-dark mb-1">${index + 1}</span>
                        <h6 class="fw-bold mb-1 text-dark" style="font-size:0.9rem;">${e.local_entrega}</h6>
                        
                        <div class="text-muted mb-2 mt-1" style="font-size:0.8rem;">
                            <div><i class="fa-solid fa-box-open me-1 opacity-75"></i> <strong>Itens:</strong> ${e.itens_pedido || '-'}</div>
                            <div><i class="fa-solid fa-cubes me-1 opacity-75"></i> <strong>Qtd Total:</strong> ${e.quantidade || '-'}</div>
                            ${e.valor_aberto && Number(e.valor_aberto) > 0 ? `<div class="mt-1"><i class="fa-solid fa-sack-dollar text-success me-1"></i> <strong class="text-success">A Receber: R$ ${fmtMoeda(e.valor_aberto)}</strong></div>` : ''}
                        </div>

                        ${e.link_endereco ? `<a href="${e.link_endereco}" target="_blank" class="small text-primary text-decoration-none fw-medium"><i class="fa-solid fa-map-location-dot me-1"></i> Ver no Mapa</a>` : '<span class="text-muted small">Sem link cadastrado</span>'}
                    </div>
                    ${e.link_endereco ? `
                        <div class="text-center border p-1 bg-light rounded" style="width: 75px; height: 75px; flex-shrink:0;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=65x65&data=${encodeURIComponent(e.link_endereco)}" class="img-fluid" alt="QR Code Rota">
                        </div>
                    ` : ''}
                </div>
            `).join('') : '<p class="text-muted small text-center py-3">Nenhuma pizzaria registrada neste caderno.</p>'}
          </div>
          <div class="modal-footer bg-white border-top d-flex gap-2 flex-wrap">
             <a href="/caderno-entregas/pdf/${c.id}" target="_blank" class="btn btn-sm btn-primary fw-bold px-3">
                 <i class="fa-solid fa-print me-1"></i> Imprimir
             </a>
             <button type="button" class="btn btn-sm btn-warning fw-bold text-dark px-3" onclick="bootstrap.Modal.getInstance(document.getElementById('detalheModal${c.id}')).hide(); bootstrap.Modal.getOrCreateInstance(document.getElementById('editarCadernoModal${c.id}')).show();">
                 <i class="fa-solid fa-pen-to-square me-1"></i> Editar
             </button>
             <button type="button" class="btn btn-sm btn-secondary flex-grow-1" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="editarCadernoModal${c.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/caderno-entregas/editar/${c.id}" class="modal-content erp-modal shadow-lg" onsubmit="return limparMoedas(this)">
          <div class="modal-header bg-warning text-dark border-0">
            <h6 class="modal-title fw-bold"><i class="fa-solid fa-pen-to-square me-2"></i> Editar Caderno de Entregas</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-light">
            <div class="row g-3 mb-4">
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Motorista</label>
                <input type="text" name="motorista" class="form-control form-control-sm" value="${c.motorista}" required>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Ajudante</label>
                <input type="text" name="ajudante" class="form-control form-control-sm" value="${c.ajudante || ''}">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Veículo</label>
                <select name="veiculo_id" class="form-select form-select-sm" required>
                    ${veiculos.map(v => `<option value="${v.id}" ${v.id === c.veiculo_id ? 'selected' : ''}>${v.modelo}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-end mb-2 border-bottom pb-2">
                <h6 class="fw-bold text-dark mb-0" style="font-size: 0.85rem;"><i class="fa-solid fa-boxes-stacked me-1"></i> Modificar Locais</h6>
                <button type="button" class="btn btn-sm btn-outline-primary fw-bold" onclick="addEntregaDinamica('containerEdicao${c.id}')"><i class="fa-solid fa-plus me-1"></i> Inserir Linha</button>
            </div>
            
            <div id="containerEdicao${c.id}" class="pt-2 pb-2 px-1">
                ${itensEdicaoHtml}
            </div>
          </div>
          <div class="modal-footer bg-white border-0 d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold"><i class="fa-solid fa-save me-1"></i> Salvar Edição</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${c.id}" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0">
          <form method="POST" action="/caderno-entregas/excluir/${c.id}">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3 anim-pulse"></i>
              <h6 class="mb-2 fw-bold text-dark">Excluir Caderno?</h6>
              <p class="text-muted mb-0" style="font-size:0.85rem;">As entregas vinculadas serão apagadas, mas o histórico de clientes continuará salvo.</p>
            </div>
            <div class="modal-footer justify-content-center bg-light border-0 d-flex flex-nowrap">
              <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger w-100">Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  }).join("");

  const qsParams = [];
  if (filtros.data_inicio) qsParams.push(`data_inicio=${filtros.data_inicio}`);
  if (filtros.data_fim) qsParams.push(`data_fim=${filtros.data_fim}`);
  const baseQueryString = qsParams.length > 0 ? '&' + qsParams.join('&') : '';

  const pageLinks = (() => {
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${i === page ? "active" : ""}"><a class="page-link text-dark ${i === page ? "fw-bold" : ""}" href="/caderno-entregas?page=${i}${baseQueryString}">${i}</a></li>`;
    }
    return html;
  })();

  const paginacaoHtml = totalPages > 1 ? `
    <nav class="mt-4"><ul class="pagination pagination-sm justify-content-center mb-4">
        <li class="page-item ${page <= 1 ? "disabled" : ""}"><a class="page-link text-dark" href="/caderno-entregas?page=${page - 1}${baseQueryString}">&laquo;</a></li>
        ${pageLinks}
        <li class="page-item ${page >= totalPages ? "disabled" : ""}"><a class="page-link text-dark" href="/caderno-entregas?page=${page + 1}${baseQueryString}">&raquo;</a></li>
    </ul></nav>
  ` : "";

  const menuHTML = menuLateral(user, "/caderno-entregas");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Caderno de Entregas | ERP Ecoflow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      body { display: flex; height: 100vh; margin: 0; background-color: #f4f7f6; font-family: 'Segoe UI', sans-serif; }
      .sidebar { width: 240px; background-color: #0D5749; color: white; padding: 20px; display: flex; flex-direction: column; }
      .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s; }
      .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
      .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; }
      .usuario-badge { background-color: white; color: #0D5749; padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(13,87,73,0.2); font-size: 0.85rem; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
      .erp-modal { border-radius: 12px; border: none; }
      .table-hover-row { transition: background-color 0.2s; }
      .table-hover-row:hover > td { background-color: rgba(13, 87, 73, 0.06) !important; }
      @keyframes pulseIcon { 0% { transform: scale(1); } 50% { transform: scale(1.15); opacity: 0.8; } 100% { transform: scale(1); } }
      .anim-pulse { animation: pulseIcon 1.5s infinite ease-in-out; }
      
      /* Estilos para o Botão Flutuante */
      .btn-flutuante {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 55px;
        height: 55px;
        border-radius: 50%;
        background-color: #0D5749;
        color: white;
        border: none;
        box-shadow: 0 4px 15px rgba(13, 87, 73, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
        z-index: 1050;
        transition: all 0.3s ease;
      }
      .btn-flutuante:hover {
        transform: scale(1.1);
        background-color: #0a4338;
        color: white;
        box-shadow: 0 6px 20px rgba(13, 87, 73, 0.6);
      }

      @media (max-width: 767.98px) { body { flex-direction: column; } .sidebar { display: none; } .content { padding: 16px; } }
    </style>
  </head>
  <body>
    
    ${renderLoaderParticulas("Carregando Caderno")}

    <div class="sidebar d-none d-md-flex">
      <div class="text-center mb-4 mt-2"><img src="/img/logo-branca.png" class="img-fluid" style="max-width:130px;"></div>
      <div class="flex-grow-1">${menuHTML}</div>
    </div>

    <div class="offcanvas offcanvas-start bg-dark text-white" tabindex="-1" id="sidebarMenu">
      <div class="offcanvas-header border-bottom border-secondary">
        <h5 class="offcanvas-title ms-2"><i class="fa-solid fa-bars text-muted me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2"><img src="/img/logo.png" class="img-fluid" style="max-width:140px;"></div>
        ${menuHTML}
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-light border d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars"></i></button>
            <div>
              <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-book-open-reader text-muted me-2"></i>Caderno de Entregas</h4>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Crie e gerencie as rotas com histórico protegido</span>
            </div>
        </div>
      </div>

      <div class="bg-white p-3 rounded-3 shadow-sm border border-light mb-4 d-flex justify-content-between align-items-center">
        <h6 class="mb-0 text-muted" style="font-size:0.85rem;"><i class="fa-solid fa-list-ul me-1"></i> Rotas Registradas</h6>
        
        <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary shadow-sm px-3" data-bs-toggle="modal" data-bs-target="#novoClienteModal">
                <i class="fa-solid fa-users me-1"></i> Clientes
            </button>
            <button class="btn btn-sm btn-success shadow-sm px-3" data-bs-toggle="modal" data-bs-target="#novoCadernoModal">
                <i class="fa-solid fa-plus me-1"></i> Caderno
            </button>
            <a href="/exportar/caderno-entregas?data_inicio=${filtros.data_inicio || ''}&data_fim=${filtros.data_fim || ''}" target="_blank" class="btn btn-sm btn-outline-success shadow-sm px-3" title="Baixar Excel">
                <i class="fa-solid fa-file-excel me-1"></i> Relatório
            </a>
        </div>
      </div>

      <form class="row g-2 align-items-end mt-2 border-top pt-3 mb-4" method="GET" action="/caderno-entregas">
          <div class="col-12 col-md-4">
              <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Período De</label>
              <input type="date" name="data_inicio" class="form-control form-control-sm shadow-sm" value="${filtros.data_inicio || ''}">
          </div>
          <div class="col-12 col-md-4">
              <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Até</label>
              <input type="date" name="data_fim" class="form-control form-control-sm shadow-sm" value="${filtros.data_fim || ''}">
          </div>
          <div class="col-12 col-md-4 d-flex gap-2">
              <button type="submit" class="btn btn-sm btn-success flex-grow-1 shadow-sm"><i class="fa-solid fa-filter me-1"></i> Filtrar Período</button>
              <a href="/caderno-entregas" class="btn btn-sm btn-light border text-center shadow-sm px-3"><i class="fa-solid fa-xmark"></i></a>
          </div>
      </form>

      ${cadernos.length > 0 
        ? `<div class="table-responsive bg-white rounded-3 shadow-sm border border-light mb-4">
             <table class="table table-sm align-middle mb-0" style="font-size: 0.85rem; border-collapse: separate; border-spacing: 0;">
               <thead class="table-light">
                 <tr>
                   <th class="py-2 px-3 fw-bold text-muted border-0">Data de Saída</th>
                   <th class="py-2 px-3 fw-bold text-muted border-0">Motorista</th>
                   <th class="py-2 px-3 fw-bold text-muted border-0">Veículo</th>
                   <th class="py-2 px-3 fw-bold text-muted border-0 text-center">Entregas</th>
                   <th class="py-2 px-3 fw-bold text-muted border-0 text-end">Ações</th>
                 </tr>
               </thead>
               <tbody class="border-top-0">
                 ${linhas}
               </tbody>
             </table>
           </div>` 
        : `<div class="col-12 text-center text-muted mt-4"><i class="fa-solid fa-route fa-3x opacity-25 mb-3"></i><p style="font-size:0.9rem;">Nenhum caderno encontrado para este filtro.</p></div>`
      }

      ${paginacaoHtml}
    </div>

    <button class="btn-flutuante" data-bs-toggle="modal" data-bs-target="#modalInstrucoes" title="Ajuda / Como usar">
      <i class="fa-solid fa-question"></i>
    </button>

    <div class="modal fade" id="modalInstrucoes" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg erp-modal">
          <div class="modal-header bg-light border-0">
            <h5 class="modal-title fw-bold text-dark"><i class="fa-solid fa-circle-info text-primary me-2"></i> Como usar o Caderno</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 text-muted" style="font-size: 0.95rem;">
            <p class="mb-4">Bem-vindo ao <strong>Caderno de Entregas</strong>. Siga as orientações abaixo para gerenciar as rotas:</p>
            <ul class="list-group list-group-flush mb-4">
              <li class="list-group-item bg-transparent px-0 border-light pb-3">
                <strong class="text-dark d-block mb-1"><i class="fa-solid fa-user-plus text-primary me-2"></i> 1. Gerir Clientes</strong>
                Utilize o botão "Clientes" para gerenciar o histórico. Você pode editar os links do Maps para mantê-los atualizados ou excluir os que não usa mais.
              </li>
              <li class="list-group-item bg-transparent px-0 border-light py-3">
                <strong class="text-dark d-block mb-1"><i class="fa-solid fa-plus-circle text-success me-2"></i> 2. Criar um Novo Caderno</strong>
                Clique em "Caderno" para registrar uma saída. Preencha os dados do motorista e selecione os clientes na lista suspensa (o link do mapa será preenchido sozinho).
              </li>
              <li class="list-group-item bg-transparent px-0 border-light py-3">
                <strong class="text-dark d-block mb-1"><i class="fa-solid fa-boxes-stacked text-info me-2"></i> 3. Adicionar Entregas e Itens</strong>
                Você pode incluir múltiplos itens para a mesma entrega, especificando as quantidades e opcionalmente o valor a receber.
              </li>
              <li class="list-group-item bg-transparent px-0 border-light py-3">
                <strong class="text-dark d-block mb-1"><i class="fa-solid fa-print text-dark me-2"></i> 4. Imprimir Manifesto PDF</strong>
                Para cada caderno registrado, você pode gerar um PDF para o motorista contendo a rota e os <strong>QR Codes</strong> de navegação GPS ativos de cada local.
              </li>
            </ul>
          </div>
          <div class="modal-footer border-0 bg-light">
            <button type="button" class="btn btn-primary px-4 fw-bold shadow-sm" data-bs-dismiss="modal">Entendi</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="novoClienteModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal shadow-lg">
          <div class="modal-header bg-primary text-white border-0">
            <h6 class="modal-title fw-bold"><i class="fa-solid fa-users me-2"></i> Gerenciamento de Clientes (Maps)</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-light">
            
            <form method="POST" action="/caderno-entregas/clientes/novo" class="bg-white p-3 rounded border border-light shadow-sm mb-4" onsubmit="prepararSubmissaoSimples(event, this, 'Cliente Cadastrado!')">
              <h6 class="fw-bold text-primary mb-3" style="font-size: 0.85rem;"><i class="fa-solid fa-user-plus me-1"></i> Cadastrar Novo Cliente</h6>
              <div class="row g-2 align-items-end">
                  <div class="col-12 col-md-5">
                      <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Nome do Cliente / Pizzaria</label>
                      <input type="text" name="nome" class="form-control form-control-sm shadow-sm" required placeholder="Ex: Pizzaria Bella Napoli">
                  </div>
                  <div class="col-12 col-md-5">
                      <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Link do Google Maps</label>
                      <input type="url" name="link_endereco" class="form-control form-control-sm shadow-sm" placeholder="Cole o link de localização aqui">
                  </div>
                  <div class="col-12 col-md-2">
                      <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm"><i class="fa-solid fa-save me-1"></i> Salvar</button>
                  </div>
              </div>
            </form>

            <h6 class="fw-bold text-dark mb-2" style="font-size: 0.85rem;"><i class="fa-solid fa-list me-1"></i> Histórico de Clientes Cadastrados</h6>
            
            <div class="input-group input-group-sm mb-2 shadow-sm">
                <span class="input-group-text bg-white border-end-0"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
                <input type="text" id="searchInputClientes" class="form-control border-start-0 border-end-0" placeholder="Pesquisar cliente por nome..." onkeyup="filtrarClientes()">
                <button class="btn btn-outline-secondary bg-white border-start-0 text-danger" type="button" onclick="limparBuscaClientes()" title="Limpar pesquisa">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="table-responsive bg-white rounded border border-light shadow-sm" style="max-height: 250px; overflow-y: auto;">
                <table class="table table-sm table-hover align-middle mb-0" style="font-size: 0.85rem;">
                    <thead class="table-light position-sticky top-0" style="z-index: 1;">
                        <tr>
                            <th class="py-2 px-3 text-muted">Nome do Cliente</th>
                            <th class="py-2 px-3 text-muted">Link Cadastrado</th>
                            <th class="py-2 px-3 text-end text-muted">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="tabelaClientesBody">
                        ${listaClientesTabela}
                    </tbody>
                </table>
            </div>

          </div>
          <div class="modal-footer bg-white border-0">
            <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="novoCadernoModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/caderno-entregas/novo" class="modal-content erp-modal shadow-lg" onsubmit="return limparMoedas(this)">
          <div class="modal-header bg-success text-white border-0">
            <h6 class="modal-title fw-bold"><i class="fa-solid fa-plus-circle me-2"></i> Criar Caderno de Entregas</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-light">
            <h6 class="fw-bold text-success mb-3 border-bottom pb-2" style="font-size: 0.85rem;"><i class="fa-solid fa-truck me-1"></i> Equipe e Transporte</h6>
            <div class="row g-3 mb-4">
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Motorista</label>
                <input type="text" name="motorista" class="form-control form-control-sm shadow-sm" required placeholder="Nome do motorista">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Ajudante</label>
                <input type="text" name="ajudante" class="form-control form-control-sm shadow-sm" placeholder="Opcional">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Veículo de Saída</label>
                <select name="veiculo_id" class="form-select form-select-sm shadow-sm" required>
                    <option value="" disabled selected>Escolha o veículo...</option>
                    ${veiculosOptions}
                </select>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-end mb-2 border-bottom pb-2">
                <h6 class="fw-bold text-primary mb-0" style="font-size: 0.85rem;"><i class="fa-solid fa-boxes-stacked me-1"></i> Locais de Entrega</h6>
                <button type="button" class="btn btn-sm btn-outline-primary fw-bold px-3 py-1 shadow-sm" onclick="addEntregaDinamica('containerEntregas')"><i class="fa-solid fa-plus me-1"></i> Adicionar Local</button>
            </div>
            
            <div id="containerEntregas" class="pt-2 pb-2 px-1">
                <div class="row g-2 mb-3 entrega-item align-items-start border p-3 rounded bg-white position-relative shadow-sm mx-1">
                    <input type="hidden" name="itens_pedido[]" class="hidden-itens">
                    <input type="hidden" name="quantidade[]" class="hidden-qtd">

                    <div class="col-12 col-md-6">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Cliente / Local</label>
                        <select class="form-select form-select-sm mb-1 client-select shadow-sm" onchange="handleClientSelect(this)" required>
                            <option value="" disabled selected>-- Selecionar Cliente --</option>
                            <option value="NOVO_CLIENTE" class="text-success fw-bold">+ Cadastrar Novo Cliente</option>
                            ${optionsClientesHtml}
                        </select>
                        <input type="text" class="form-control form-control-sm client-input shadow-sm" style="display:none;" placeholder="Digite o nome do novo cliente" disabled required>
                    </div>
                    <div class="col-12 col-md-6">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Link do Maps</label>
                        <input type="url" name="link[]" class="form-control form-control-sm link-maps-input shadow-sm" placeholder="Cole o link aqui">
                    </div>
                    
                    <div class="col-12 col-md-8 mt-2">
                        <label class="form-label text-dark fw-bold mb-1" style="font-size:0.75rem;"><i class="fa-solid fa-list-check text-muted me-1"></i> Itens do Pedido</label>
                        <div class="sub-itens-container bg-light p-2 rounded border border-opacity-50">
                            <div class="row g-1 mb-1 sub-item-row">
                                <div class="col-8">
                                    <input type="text" class="form-control form-control-sm sub-item-nome shadow-sm" placeholder="Item do Pedido" required>
                                </div>
                                <div class="col-3">
                                    <input type="number" class="form-control form-control-sm sub-item-qtd shadow-sm" placeholder="Qtd" required>
                                </div>
                                <div class="col-1 text-end">
                                    <button type="button" class="btn btn-sm text-danger p-0 mt-1 shadow-sm" onclick="this.closest('.sub-item-row').remove();"><i class="fa-solid fa-minus-circle"></i></button>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-xs btn-link text-primary text-decoration-none p-0 mt-1 fw-bold" style="font-size:0.75rem;" onclick="addSubItemLinha(this)">
                            <i class="fa-solid fa-plus-circle me-1"></i> Adicionar outro item
                        </button>
                    </div>

                    <div class="col-12 col-md-4 mt-2">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Valor a Receber (Opcional)</label>
                        <div class="input-group input-group-sm shadow-sm">
                          <span class="input-group-text">R$</span>
                          <input type="text" name="valor_aberto[]" class="form-control mask-moeda" oninput="maskMoeda(this)" placeholder="0,00">
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-danger position-absolute d-flex align-items-center justify-content-center shadow" style="width: 28px; height: 28px; top: -10px; right: -10px; border-radius: 50%; padding: 0; z-index: 10;" onclick="this.closest('.entrega-item').remove();" title="Remover Local">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
          </div>
          <div class="modal-footer bg-white border-0 d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success w-100 fw-bold"><i class="fa-solid fa-save me-1"></i> Gerar Caderno</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="sucessoModal" tabindex="-1" style="z-index: 1070;">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg">
          <div class="modal-body text-center p-5">
            <i class="fa-solid fa-circle-check fa-4x text-success mb-3 anim-pulse"></i>
            <h5 class="fw-bold text-dark mb-2" id="sucessoTitulo">Concluído!</h5>
            <p class="text-muted mb-0" style="font-size:0.85rem;">A processar...</p>
          </div>
        </div>
      </div>
    </div>

    ${modais}
    ${modaisEdicaoExclusaoClientes}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      let isSubmitting = false;

      function prepararSubmissaoSimples(event, form, titleMsg) {
          event.preventDefault();
          if (isSubmitting) return;

          const modalEl = form.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }

          document.getElementById('sucessoTitulo').innerText = titleMsg;
          const successModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('sucessoModal'));
          successModal.show();

          isSubmitting = true;
          setTimeout(() => { form.submit(); }, 1500);
      }

      // =======================================================================
      // LÓGICA DO FILTRO DE PESQUISA DE CLIENTES
      // =======================================================================
      function filtrarClientes() {
          const input = document.getElementById("searchInputClientes");
          const filter = input.value.toLowerCase();
          const tbody = document.getElementById("tabelaClientesBody");
          const trs = tbody.getElementsByTagName("tr");

          for (let i = 0; i < trs.length; i++) {
              if (trs[i].cells.length === 1) continue; // Ignora a linha de "Nenhum cliente"

              const tdNome = trs[i].getElementsByTagName("td")[0];
              if (tdNome) {
                  const txtValue = tdNome.textContent || tdNome.innerText;
                  if (txtValue.toLowerCase().indexOf(filter) > -1) {
                      trs[i].style.display = "";
                  } else {
                      trs[i].style.display = "none";
                  }
              }
          }
      }

      function limparBuscaClientes() {
          const input = document.getElementById("searchInputClientes");
          input.value = "";
          filtrarClientes(); // Re-exibe tudo
          input.focus();
      }

      // =======================================================================
      // LÓGICA DO SELECT INTELIGENTE DE CLIENTES
      // =======================================================================
      const dictClientes = ${JSON.stringify(historicoClientes)};
      const optionsClientesGeral = \`${optionsClientesHtml}\`;
      
      function handleClientSelect(selectEl) {
          const container = selectEl.closest('.entrega-item');
          const inputEl = container.querySelector('.client-input');
          const linkInput = container.querySelector('.link-maps-input');
          
          if (selectEl.value === 'NOVO_CLIENTE') {
              inputEl.style.display = 'block';
              inputEl.disabled = false;
              inputEl.setAttribute('name', 'local[]');
              selectEl.removeAttribute('name');
              linkInput.value = '';
          } else {
              inputEl.style.display = 'none';
              inputEl.disabled = true;
              inputEl.removeAttribute('name');
              selectEl.setAttribute('name', 'local[]');
              
              if (dictClientes[selectEl.value]) {
                  linkInput.value = dictClientes[selectEl.value];
              } else {
                  linkInput.value = '';
              }
          }
      }
      // =======================================================================

      function addEntregaDinamica(containerId) {
          const container = document.getElementById(containerId);
          const html = \`
              <div class="row g-2 mb-3 entrega-item align-items-start border p-3 rounded bg-white position-relative shadow-sm mx-1">
                  <input type="hidden" name="itens_pedido[]" class="hidden-itens">
                  <input type="hidden" name="quantidade[]" class="hidden-qtd">

                  <div class="col-12 col-md-6">
                      <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Cliente / Local</label>
                      <select class="form-select form-select-sm mb-1 client-select shadow-sm" onchange="handleClientSelect(this)" required>
                          <option value="" disabled selected>-- Selecionar Cliente --</option>
                          <option value="NOVO_CLIENTE" class="text-success fw-bold">+ Cadastrar Novo Cliente</option>
                          \${optionsClientesGeral}
                      </select>
                      <input type="text" class="form-control form-control-sm client-input shadow-sm" style="display:none;" placeholder="Digite o nome do novo cliente" disabled required>
                  </div>
                  <div class="col-12 col-md-6">
                      <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Link do Maps</label>
                      <input type="url" name="link[]" class="form-control form-control-sm link-maps-input shadow-sm" placeholder="Cole o link aqui">
                  </div>
                  
                  <div class="col-12 col-md-8 mt-2">
                      <label class="form-label text-dark fw-bold mb-1" style="font-size:0.75rem;"><i class="fa-solid fa-list-check text-muted me-1"></i> Itens do Pedido</label>
                      <div class="sub-itens-container bg-light p-2 rounded border border-opacity-50">
                          <div class="row g-1 mb-1 sub-item-row">
                              <div class="col-8">
                                  <input type="text" class="form-control form-control-sm sub-item-nome shadow-sm" placeholder="Item do Pedido" required>
                              </div>
                              <div class="col-3">
                                  <input type="number" class="form-control form-control-sm sub-item-qtd shadow-sm" placeholder="Qtd" required>
                              </div>
                              <div class="col-1 text-end">
                                  <button type="button" class="btn btn-sm text-danger p-0 mt-1 shadow-sm" onclick="this.closest('.sub-item-row').remove();"><i class="fa-solid fa-minus-circle"></i></button>
                              </div>
                          </div>
                      </div>
                      <button type="button" class="btn btn-xs btn-link text-primary text-decoration-none p-0 mt-1 fw-bold" style="font-size:0.75rem;" onclick="addSubItemLinha(this)">
                          <i class="fa-solid fa-plus-circle me-1"></i> Adicionar outro item
                      </button>
                  </div>

                  <div class="col-12 col-md-4 mt-2">
                      <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Valor a Receber (Opcional)</label>
                      <div class="input-group input-group-sm shadow-sm">
                        <span class="input-group-text">R$</span>
                        <input type="text" name="valor_aberto[]" class="form-control mask-moeda" oninput="maskMoeda(this)" placeholder="0,00">
                      </div>
                  </div>
                  <button type="button" class="btn btn-sm btn-danger position-absolute d-flex align-items-center justify-content-center shadow" style="width: 28px; height: 28px; top: -10px; right: -10px; border-radius: 50%; padding: 0; z-index: 10;" onclick="this.closest('.entrega-item').remove();" title="Remover Local">
                      <i class="fa-solid fa-xmark"></i>
                  </button>
              </div>
          \`;
          container.insertAdjacentHTML('beforeend', html);
      }

      function addSubItemLinha(btn) {
          const container = btn.closest('.entrega-item').querySelector('.sub-itens-container');
          const html = \`
              <div class="row g-1 mb-1 sub-item-row">
                  <div class="col-8">
                      <input type="text" class="form-control form-control-sm sub-item-nome shadow-sm" placeholder="Item do Pedido" required>
                  </div>
                  <div class="col-3">
                      <input type="number" class="form-control form-control-sm sub-item-qtd shadow-sm" placeholder="Qtd" required>
                  </div>
                  <div class="col-1 text-end">
                      <button type="button" class="btn btn-sm text-danger p-0 mt-1 shadow-sm" onclick="this.closest('.sub-item-row').remove();"><i class="fa-solid fa-minus-circle"></i></button>
                  </div>
              </div>
          \`;
          container.insertAdjacentHTML('beforeend', html);
      }

      function maskMoeda(i) {
          let v = i.value.replace(/\\D/g,'');
          if(!v) { i.value = ''; return; }
          v = (v/100).toFixed(2) + '';
          v = v.replace(".", ",");
          v = v.replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, "$1.");
          i.value = v;
      }

      function limparMoedas(form) {
          const inputs = form.querySelectorAll('.mask-moeda');
          inputs.forEach(i => {
              if(i.value) {
                  i.value = i.value.replace(/\\./g, '').replace(',', '.');
              }
          });

          const cards = form.querySelectorAll('.entrega-item');
          cards.forEach(card => {
              const rows = card.querySelectorAll('.sub-item-row');
              let combinedItens = [];
              let totalQtd = 0;

              rows.forEach(row => {
                  const nome = row.querySelector('.sub-item-nome').value.trim();
                  const qtd = parseInt(row.querySelector('.sub-item-qtd').value, 10) || 0;
                  if (nome) {
                      combinedItens.push(\`\${nome} (x\${qtd})\`);
                      totalQtd += qtd;
                  }
              });

              const hiddenItensInput = card.querySelector('.hidden-itens');
              const hiddenQtdInput = card.querySelector('.hidden-qtd');
              
              if (hiddenItensInput) hiddenItensInput.value = combinedItens.join(', ');
              if (hiddenQtdInput) hiddenQtdInput.value = totalQtd;
          });

          return true;
      }
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = cadernoEntregasView;