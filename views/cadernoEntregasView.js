// views/cadernoEntregasView.js
const menuLateral = require("./menuLateral");

function cadernoEntregasView(usuario, cadernos = [], veiculos = [], clientesHistorico = [], paginacao = {}, filtros = {}, catalogoItens = [], colaboradores = []) {
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
  // GERAÇÃO DO LINK DE ROTA DO GOOGLE MAPS OFICIAL (COM COORDENADAS)
  // =========================================================================
  cadernos.forEach(c => {
      if (c.entregas && c.entregas.length > 0) {
          const paradas = c.entregas.map(e => {
              if (e.coordenadas && e.coordenadas.trim() !== '') {
                  return encodeURIComponent(e.coordenadas.trim().replace(/\s/g, ''));
              } 
              return encodeURIComponent(e.local_entrega + ", Camaçari, BA");
          }).join('/');
          
          const baseMapsUrl = "https://www" + ".google.com/maps/dir//";
          c.linkNavegacao = baseMapsUrl + paradas;
      } else {
          c.linkNavegacao = "#";
      }
  });

  // =========================================================================
  // LÓGICA DE INTELIGÊNCIA: Montagem do dicionário de clientes fixos
  // =========================================================================
  const historicoClientes = {};
  
  if (clientesHistorico && clientesHistorico.length > 0) {
      clientesHistorico.forEach(c => {
          historicoClientes[c.nome] = {
              link: c.link_endereco || "",
              coord: c.coordenadas || ""
          };
      });
  }

  // Gera o Input HTML com suporte à nova caixa de seleção (Lista Suspensa de Cliente)
  const renderClienteField = (clienteAtual = "") => {
      const safeVal = clienteAtual.replace(/"/g, '"');
      return `
          <div class="autocomplete-container">
              <input type="text" name="local[]" class="form-control form-control-sm client-input shadow-sm" oninput="handleClientInput(event, this)" onclick="handleClientInput(event, this)" value="${safeVal}" placeholder="Digite o nome..." required autocomplete="off">
              <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
          </div>
      `;
  };

  // =========================================================================
  // TABELA E MODAIS DE GESTÃO DE CLIENTES
  // =========================================================================
  const listaClientesTabela = (clientesHistorico && clientesHistorico.length > 0) ? clientesHistorico.map((c, i) => `
    <tr 
        class="cliente-row-filtro table-hover-row" 
        data-bs-toggle="modal" 
        data-bs-target="#editarClienteModal${i}" 
        style="cursor: pointer;"
        title="Clique para editar este cliente"
    >
        <td class="fw-bold text-white py-2 px-3 cliente-nome-filtro">
            ${c.nome} 
            ${c.coordenadas ? '<span class="badge bg-success ms-1" style="font-size:0.55rem;" title="Coordenadas cadastradas">GPS</span>' : ''}
        </td>

        <td class="py-2 px-3">
            ${c.cidade 
                ? `<span class="badge text-dark" style="background-color: #08c068; font-size:0.65rem;" title="Cidade vinculada">${c.cidade}</span>` 
                : '<span class="badge bg-secondary" style="font-size:0.65rem;">Sem cidade</span>'
            }
        </td>

        <td class="text-end py-2 px-3">
            <button 
                type="button" 
                class="btn btn-sm btn-outline-secondary border-custom text-danger shadow-sm py-1 px-2" 
                data-bs-toggle="modal" 
                data-bs-target="#excluirClienteModal${i}" 
                title="Excluir Cliente"
                onclick="event.stopPropagation();"
            >
                <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
            </button>
        </td>
    </tr>
`).join('') : `
    <tr>
        <td colspan="3" class="text-center text-muted py-4">
            <i class="fa-solid fa-users-slash fa-lg opacity-25 mb-2"></i>
            <br><span style="font-size: 0.8rem;">Nenhum cliente cadastrado no histórico.</span>
        </td>
    </tr>
`;

  const modaisEdicaoExclusaoClientes = (clientesHistorico && clientesHistorico.length > 0) ? clientesHistorico.map((c, i) => `
      <div class="modal fade" id="editarClienteModal${i}" tabindex="-1" style="z-index: 1060;">
          <div class="modal-dialog modal-dialog-centered">
              <form method="POST" action="/caderno-entregas/clientes/editar" class="modal-content shadow-lg erp-modal" onsubmit="prepararSubmissaoSimples(event, this, 'Cliente Atualizado!')">
                  <input type="hidden" name="nomeOriginal" value="${c.nome}">
                  <div class="modal-header bg-custom-darker text-white border-0">
                      <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Dados do Cliente</h6>
                      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body p-4 bg-custom-dark">
                      <div class="mb-3">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Nome do Cliente / Pizzaria</label>
                          <input type="text" name="nomeNovo" class="form-control form-control-sm shadow-sm" value="${c.nome}" required>
                      </div>
                      <div class="mb-3">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Link do Google Maps</label>
                          <input type="url" name="link_endereco" class="form-control form-control-sm shadow-sm" value="${c.link_endereco || ''}" oninput="extrairCoordenadasAoColar(this)">
                      </div>
                      <div class="mb-3">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;"><i class="fa-solid fa-location-crosshairs text-accent me-1"></i> Coordenadas (Opcional)</label>
                          <input type="text" name="coordenadas" class="form-control form-control-sm shadow-sm" value="${c.coordenadas || ''}" placeholder="Ex: -12.6974, -38.3241">
                          <div class="form-text text-muted" style="font-size:0.65rem;">Se preenchido, o sistema usará isto para criar a rota perfeita.</div>
                      </div>
                  </div>
                  <div class="modal-footer bg-custom-darker border-0 d-flex flex-nowrap">
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
                      <i class="fa-solid fa-triangle-exclamation fa-2x text-danger mb-3"></i>
                      <h6 class="mb-2 fw-bold text-white" style="font-size: 0.9rem;">Excluir Cliente?</h6>
                      <p class="text-muted mb-0" style="font-size:0.75rem;"><strong>${c.nome}</strong> será removido permanentemente do histórico de preenchimento automático.</p>
                  </div>
                  <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
                      <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-toggle="modal" data-bs-target="#novoClienteModal">Cancelar</button>
                      <button type="submit" class="btn btn-sm btn-danger w-100">Sim, Excluir</button>
                  </div>
              </form>
          </div>
      </div>
  `).join('') : '';

  const renderSubItensEdicao = (itensStr, totalQtd) => {
    if (!itensStr) {
      return `
        <div class="row g-1 mb-1 sub-item-row">
            <div class="col-8">
                <div class="autocomplete-container">
                    <input type="text" class="form-control form-control-sm sub-item-nome shadow-sm" placeholder="Item do Pedido" oninput="handleItemInput(event, this)" onclick="handleItemInput(event, this)" required autocomplete="off">
                    <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
                </div>
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
      
      const safeItem = nomeItem.replace(/"/g, '"');

      return `
        <div class="row g-1 mb-1 sub-item-row">
            <div class="col-8">
                <div class="autocomplete-container">
                    <input type="text" class="form-control form-control-sm sub-item-nome shadow-sm" value="${safeItem}" placeholder="Item do Pedido" oninput="handleItemInput(event, this)" onclick="handleItemInput(event, this)" required autocomplete="off">
                    <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
                </div>
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
    const paradasData = JSON.stringify(c.entregas ? c.entregas.map(e => e.coordenadas || e.local_entrega + ", Camaçari, BA") : []);

    return `
    <tr class="align-middle table-hover-row" style="cursor: pointer;" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('detalheModal${c.id}')).show();">
      <td class="text-muted fw-medium py-2 px-3"><i class="fa-regular fa-calendar-check me-1"></i> ${fmtData(c.data_criacao)}</td>
      <td class="text-white fw-bold py-2 px-3"><i class="fa-solid fa-id-card text-muted me-1"></i> ${c.motorista}</td>
      <td class="text-white py-2 px-3">${c.veiculo_modelo || '<span class="text-muted small">Não informado</span>'}</td>
      <td class="text-center py-2 px-3">
        <span class="badge text-dark" style="background-color: #08c068; font-size: 0.65rem;">
           ${c.entregas ? c.entregas.length : 0} Locais
        </span>
      </td>
      <td class="text-end py-2 px-3">
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-secondary border-custom text-accent py-1 px-2 shadow-sm ${c.entregas && c.entregas.length > 0 ? '' : 'disabled'}" 
                  onclick="event.stopPropagation(); iniciarNavegacao(${paradasData.replace(/"/g, "'")})" title="Iniciar Navegação">
            <i class="fa-solid fa-location-arrow" style="font-size:0.75rem;"></i>
          </button>
          
          <a href="/caderno-entregas/pdf/${c.id}" target="_blank" class="btn btn-sm btn-outline-secondary border-custom text-white py-1 px-2 shadow-sm" onclick="event.stopPropagation();" title="Imprimir Manifesto PDF">
            <i class="fa-solid fa-file-pdf" style="font-size:0.75rem;"></i>
          </a>
          <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger py-1 px-2 shadow-sm" 
                  onclick="event.stopPropagation(); bootstrap.Modal.getOrCreateInstance(document.getElementById('excluirModal${c.id}')).show();" title="Excluir Caderno">
            <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
          </button>
        </div>
      </td>
    </tr>
    `;
  }).join("");

  const modais = cadernos.map(c => {
    const paradasData = JSON.stringify(c.entregas ? c.entregas.map(e => e.coordenadas || e.local_entrega + ", Camaçari, BA") : []);
    
    // Grelha de Edição (Itens já existentes) - Mantém os IDs
    const itensEdicaoHtml = (c.entregas && c.entregas.length > 0) ? c.entregas.map((e) => `
        <div class="row g-2 mb-3 entrega-item align-items-start border-custom p-3 rounded bg-custom-darker position-relative shadow-sm mx-1">
            <input type="hidden" name="id[]" value="${e.id || ''}">
            <input type="hidden" name="entrega_id[]" value="${e.id || ''}">
            <input type="hidden" name="id_entrega[]" value="${e.id || ''}">
            
            <input type="hidden" name="itens_pedido[]" class="hidden-itens">
            <input type="hidden" name="quantidade[]" class="hidden-qtd">

            <div class="col-12 col-md-5">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Cliente / Local</label>
                ${renderClienteField(e.local_entrega)}
            </div>
            <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Link do Maps</label>
                <input type="url" name="link[]" class="form-control form-control-sm link-maps-input shadow-sm" value="${e.link_endereco || ''}" placeholder="Cole o link aqui" oninput="extrairCoordenadasAoColar(this)">
            </div>
            <div class="col-12 col-md-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Coordenadas(Opcional)</label>
                <input type="text" name="coordenadas_rota[]" class="form-control form-control-sm shadow-sm coord-input" value="${e.coordenadas || ''}" placeholder="Lat, Lng">
            </div>
            
            <div class="col-12 col-md-8 mt-2">
                <label class="form-label text-white fw-bold mb-1" style="font-size:0.7rem;"><i class="fa-solid fa-list-check text-muted me-1"></i> Itens do Pedido</label>
                <div class="sub-itens-container bg-custom-dark p-2 rounded border-custom">
                    ${renderSubItensEdicao(e.itens_pedido, e.quantidade)}
                </div>
                <button type="button" class="btn btn-xs btn-link text-accent text-decoration-none p-0 mt-1 fw-bold" style="font-size:0.7rem;" onclick="addSubItemLinha(this)">
                    <i class="fa-solid fa-plus-circle me-1"></i> Adicionar outro item
                </button>
            </div>

            <div class="col-12 col-md-4 mt-2">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Valor a Receber (Opcional)</label>
                <div class="input-group input-group-sm shadow-sm">
                  <span class="input-group-text border-custom">R$</span>
                  <input type="text" name="valor_aberto[]" class="form-control mask-moeda" oninput="maskMoeda(this)" value="${e.valor_aberto ? fmtMoeda(e.valor_aberto) : ''}" placeholder="0,00">
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-danger position-absolute d-flex align-items-center justify-content-center shadow" style="width: 24px; height: 24px; top: -10px; right: -10px; border-radius: 50%; padding: 0; z-index: 10;" onclick="this.closest('.entrega-item').remove();" title="Remover Local">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `).join('') : ''; 

    const btnIniciarNavegacao = (c.entregas && c.entregas.length > 0)
        ? `<button type="button" onclick="iniciarNavegacao(${paradasData.replace(/"/g, "'")})" class="btn btn-sm btn-primary fw-bold px-3 shadow-sm"><i class="fa-solid fa-location-arrow me-1"></i> Iniciar Navegação</button>`
        : '';

    // Lógica para carregar a foto correta nos modais de edição
    const colabMotorista = colaboradores.find(col => col.nome === c.motorista) || {};
    const imgMotEdit = colabMotorista.foto ? `/uploads/${colabMotorista.foto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.motorista || 'Motorista')}&background=1f1f1f&color=08c068`;

    const colabAjudante = colaboradores.find(col => col.nome === c.ajudante) || {};
    const imgAjuEdit = c.ajudante 
        ? (colabAjudante.foto ? `/uploads/${colabAjudante.foto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.ajudante)}&background=1f1f1f&color=08c068`) 
        : `https://ui-avatars.com/api/?name=Ajudante&background=222&color=6c757d`;

    return `
    <div class="modal fade" id="detalheModal${c.id}" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal border-0 shadow">
          <div class="modal-header bg-custom-darker">
            <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-route text-accent me-2"></i> Detalhes da Rota</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            <div class="bg-custom-darker p-3 rounded shadow-sm border-custom mb-3" style="font-size: 0.8rem;">
                <div class="row">
                    <div class="col-6 col-md-4 mb-2"><span class="text-muted">Motorista:</span><br><strong class="text-white">${c.motorista}</strong></div>
                    <div class="col-6 col-md-4 mb-2"><span class="text-muted">Ajudante:</span><br><strong class="text-white">${c.ajudante || '-'}</strong></div>
                    <div class="col-12 col-md-4"><span class="text-muted">Veículo:</span><br><strong class="text-white"><i class="fa-solid fa-car me-1 text-muted"></i> ${c.veiculo_modelo || 'Não informado'}</strong></div>
                </div>
            </div>

            <h6 class="fw-bold mb-3 mt-4 text-white" style="font-size: 0.8rem;">Locais de Entrega (${c.entregas ? c.entregas.length : 0}):</h6>
            
            ${(c.entregas && c.entregas.length > 0) ? c.entregas.map((e, index) => `
                <div class="d-flex justify-content-between align-items-center bg-custom-darker p-3 border-custom rounded-3 mb-2 shadow-sm">
                    <div class="flex-grow-1 pe-3">
                        <span class="badge mb-1" style="background-color: #1f1f1f; border: 1px solid rgba(255,255,255,0.1); color: #fff;">${index + 1}</span>
                        <h6 class="fw-bold mb-1 text-white" style="font-size:0.85rem;">
                            ${e.local_entrega}
                            ${e.coordenadas ? '<i class="fa-solid fa-location-crosshairs ms-1 text-accent" title="Usando Coordenadas Exatas"></i>' : ''}
                        </h6>
                        
                        <div class="text-muted mb-2 mt-1" style="font-size:0.75rem;">
                            <div><i class="fa-solid fa-box-open me-1 opacity-75"></i> <strong class="text-white">Itens:</strong> ${e.itens_pedido || '-'}</div>
                            <div><i class="fa-solid fa-cubes me-1 opacity-75"></i> <strong class="text-white">Qtd Total:</strong> ${e.quantidade || '-'}</div>
                            ${e.valor_aberto && Number(e.valor_aberto) > 0 ? `<div class="mt-1"><i class="fa-solid fa-sack-dollar text-accent me-1"></i> <strong class="text-accent">A Receber: R$ ${fmtMoeda(e.valor_aberto)}</strong></div>` : ''}
                        </div>

                        ${e.link_endereco ? `<a href="${e.link_endereco}" target="_blank" class="small text-accent text-decoration-none fw-medium"><i class="fa-solid fa-map-location-dot me-1"></i> Ver no Mapa</a>` : '<span class="text-muted small">Sem link cadastrado</span>'}
                    </div>
                    ${e.link_endereco ? `
                        <div class="text-center p-1 bg-white rounded" style="width: 70px; height: 70px; flex-shrink:0;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=65x65&data=${encodeURIComponent(e.link_endereco)}" class="img-fluid" alt="QR Code Rota">
                        </div>
                    ` : ''}
                </div>
            `).join('') : '<p class="text-muted small text-center py-3">Nenhuma pizzaria registrada neste caderno.</p>'}
          </div>
          <div class="modal-footer bg-custom-darker border-top d-flex gap-2 flex-wrap">
             ${btnIniciarNavegacao}
             <a href="/caderno-entregas/pdf/${c.id}" target="_blank" class="btn btn-sm btn-outline-secondary text-white fw-bold px-3">
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
        <form method="POST" action="/caderno-entregas/editar/${c.id}" class="modal-content erp-modal shadow-lg" onsubmit="prepararSubmissaoSimples(event, this, 'A otimizar rota...')">
          <div class="modal-header bg-custom-darker text-white border-0">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Caderno de Entregas</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            <div class="row g-3 mb-4">
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Motorista</label>
                <div class="d-flex align-items-center gap-2">
                    <img id="fotoMotoristaEdit${c.id}" src="${imgMotEdit}" class="rounded shadow-sm border-custom bg-custom-darker" style="width: 28px; height: 28px; object-fit: cover; flex-shrink: 0;">
                    <div class="autocomplete-container flex-grow-1">
                        <input type="text" name="motorista" class="form-control form-control-sm shadow-sm" value="${c.motorista}" required placeholder="Digite ou selecione" oninput="handleColabInput(event, this, 'fotoMotoristaEdit${c.id}')" onclick="handleColabInput(event, this, 'fotoMotoristaEdit${c.id}')" autocomplete="off">
                        <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
                    </div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Ajudante</label>
                <div class="d-flex align-items-center gap-2">
                    <img id="fotoAjudanteEdit${c.id}" src="${imgAjuEdit}" class="rounded shadow-sm border-custom bg-custom-darker" style="width: 28px; height: 28px; object-fit: cover; flex-shrink: 0;">
                    <div class="autocomplete-container flex-grow-1">
                        <input type="text" name="ajudante" class="form-control form-control-sm shadow-sm" value="${c.ajudante || ''}" placeholder="Opcional" oninput="handleColabInput(event, this, 'fotoAjudanteEdit${c.id}')" onclick="handleColabInput(event, this, 'fotoAjudanteEdit${c.id}')" autocomplete="off">
                        <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
                    </div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Veículo</label>
                <select name="veiculo_id" class="form-select form-select-sm" required>
                    ${veiculos.map(v => `<option value="${v.id}" ${v.id === c.veiculo_id ? 'selected' : ''}>${v.modelo}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-end mb-2 border-bottom border-custom pb-2">
                <h6 class="fw-bold text-white mb-0" style="font-size: 0.8rem;"><i class="fa-solid fa-route me-1 text-accent"></i> Modificar Locais e Rota</h6>
                <button type="button" class="btn btn-sm btn-outline-primary fw-bold" style="font-size: 0.75rem;" onclick="addEntregaDinamica('containerEdicao${c.id}')"><i class="fa-solid fa-plus me-1"></i> Inserir Linha</button>
            </div>
            
            <div id="containerEdicao${c.id}" class="pt-2 pb-2 px-1 container-entregas-dinamico">
                ${itensEdicaoHtml}
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-0 d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold"><i class="fa-solid fa-save me-1"></i> Atualizar Rota</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${c.id}" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0">
          <form method="POST" action="/caderno-entregas/excluir/${c.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Caderno Excluído!')">
            <div class="modal-body text-center p-4 bg-custom-darker">
              <i class="fa-solid fa-triangle-exclamation fa-2x text-danger mb-3"></i>
              <h6 class="mb-2 fw-bold text-white" style="font-size: 0.9rem;">Excluir Caderno?</h6>
              <p class="text-muted mb-0" style="font-size:0.75rem;">As entregas vinculadas serão apagadas, mas o histórico de clientes continuará salvo.</p>
            </div>
            <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
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
      html += `<li class="page-item ${i === page ? "active" : ""}"><a class="page-link ${i === page ? "fw-bold" : ""}" href="/caderno-entregas?page=${i}${baseQueryString}" onclick="navegarPagina(event, this.href)">${i}</a></li>`;
    }
    return html;
  })();

  const paginacaoHtml = totalPages > 1 ? `
    <nav class="mt-4"><ul class="pagination pagination-sm justify-content-center mb-4">
        <li class="page-item ${page <= 1 ? "disabled" : ""}"><a class="page-link" href="/caderno-entregas?page=${page - 1}${baseQueryString}" onclick="navegarPagina(event, this.href)">«</a></li>
        ${pageLinks}
        <li class="page-item ${page >= totalPages ? "disabled" : ""}"><a class="page-link" href="/caderno-entregas?page=${page + 1}${baseQueryString}" onclick="navegarPagina(event, this.href)">»</a></li>
    </ul></nav>
  ` : "";

  const menuHTML = menuLateral(user, "/caderno-entregas");

  // =========================================================================
  // Modal de Impressão Refinado
  // =========================================================================
  const modalImprimirNovoHtml = `
    <div class="modal fade" id="modalImprimirNovo" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content erp-modal border-0 shadow-lg">
          <div class="modal-header bg-custom-darker border-0 pb-0 pt-4 px-4">
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body text-center p-5 pt-2 bg-custom-darker">
            <div class="mb-4">
               <div class="d-inline-flex align-items-center justify-content-center bg-custom-dark rounded-circle shadow-sm border-custom" style="width: 70px; height: 70px;">
                   <i class="fa-solid fa-print fa-xl text-accent"></i>
               </div>
            </div>
            <h6 class="fw-bold text-white mb-3">Caderno Gerado com Sucesso</h6>
            <p class="text-muted mb-4" style="font-size:0.8rem; line-height: 1.5;">A rota foi otimizada e salva no sistema. Deseja imprimir o manifesto de entregas agora?</p>
            <div class="d-flex flex-column gap-2 mt-2">
               <a href="#" target="_blank" id="btnImprimirNovoModal" class="btn btn-sm btn-primary fw-bold shadow-sm" onclick="bootstrap.Modal.getInstance(document.getElementById('modalImprimirNovo')).hide();">
                   <i class="fa-solid fa-print me-1"></i> Imprimir Manifesto
               </a>
               <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-white fw-bold" data-bs-dismiss="modal">
                   Agora Não
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Caderno | Ecoflow</title>
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

      body { display: flex; height: 100vh; margin: 0; background-color: #1f1f1f; color: #ffffff; font-family: 'Segoe UI', sans-serif; }
      .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column; }
      
      .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; background-color: #1f1f1f; }
      
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
      
      .list-group-item { background-color: transparent !important; border-color: rgba(255,255,255,0.05); color: #fff; }

      /* Pagination */
      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
      .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.05); }

      /* ANIMAÇÃO DE ENTRADA E SAÍDA DO TOAST */
      .toast {
          transform: translateX(120%);
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important;
      }
      .toast.showing, .toast.show { transform: translateX(0); }

      /* ANIMAÇÃO DE ENTRADA E SAÍDA DOS MODAIS */
      .modal.fade .modal-dialog {
          transform: scale(0.85) translateY(30px);
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
      }
      .modal.show .modal-dialog { transform: scale(1) translateY(0); }
      
      .btn-flutuante {
        position: fixed; bottom: 30px; right: 30px; width: 45px; height: 45px; border-radius: 50%;
        background-color: #08c068; color: #1f1f1f; border: none; box-shadow: 0 4px 15px rgba(8, 192, 104, 0.3);
        display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 1050; transition: all 0.3s ease;
      }
      .btn-flutuante:hover { transform: scale(1.1); background-color: #06a055; color: #1f1f1f; box-shadow: 0 6px 20px rgba(8, 192, 104, 0.5); }

      /* CSS DO AUTOCOMPLETE / DROPDOWN */
      .autocomplete-container { position: relative; width: 100%; }
      .autocomplete-dropdown {
          position: absolute; top: 100%; left: 0; right: 0; z-index: 2000;
          background-color: #2a2a2a; border: 1px solid rgba(255,255,255,0.1); border-top: none; border-radius: 0 0 6px 6px;
          max-height: 250px; overflow-y: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: none;
      }
      .autocomplete-item {
          padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; color: rgba(255,255,255,0.8);
      }
      .autocomplete-item:last-child { border-bottom: none; }
      .autocomplete-item:hover { background-color: rgba(8,192,104,0.1); color: #08c068; }
      .autocomplete-item strong { color: #08c068; }

      /* CSS DAS BARRAS DE TEMPO ANIMADAS DOS TOASTS */
      .toast-timer {
          height: 4px;
          background: rgba(255, 255, 255, 0.4);
          width: 100%;
          position: absolute;
          bottom: 0;
          left: 0;
          transform-origin: left;
      }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      /* SKELETON LOADING (CORRIGIDO PARA MODO ESCURO TRANSPARENTE) */
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

      @media (max-width: 767.98px) { body { flex-direction: column; } .sidebar { display: none; } .content { padding: 16px; } }
      .offcanvas { background-color: #1f1f1f !important; }
    </style>
  </head>
  <body>

    <div class="sidebar d-none d-md-flex">
      <div class="text-center mb-4 mt-2"><img src="/img/logo-branca.png" class="img-fluid" style="max-width:130px;"></div>
      <div class="flex-grow-1">${menuHTML}</div>
    </div>

    <div class="offcanvas offcanvas-start text-white" tabindex="-1" id="sidebarMenu">
      <div class="offcanvas-header border-bottom border-custom">
        <h5 class="offcanvas-title ms-2" style="font-size: 0.9rem;"><i class="fa-solid fa-bars text-muted me-2"></i> Menu</h5>
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
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-book-open-reader text-muted me-2"></i>Caderno de Entregas</h5>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.7rem;">Crie e otimize rotas com inteligência geográfica</span>
            </div>
        </div>
      </div>

      <div class="bg-custom-darker p-3 rounded-3 shadow-sm border-custom mb-3 d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3">
         <h6 class="fw-bold text-white mb-0 text-nowrap" style="font-size: 0.85rem;"><i class="fa-solid fa-list-ul text-accent me-2"></i> Rotas Registradas</h6>
         
         <div class="d-flex align-items-center flex-wrap flex-md-nowrap gap-3 justify-content-xl-end">
            <form id="formFiltroCaderno" class="d-flex align-items-center mb-0" method="GET" action="/caderno-entregas" onsubmit="prepararBuscaSimples(event, this, 'Filtros Aplicados!')">
                <div class="input-group input-group-sm shadow-sm" style="flex-wrap: nowrap; width: auto;">
                    <span class="input-group-text border-custom"><i class="fa-regular fa-calendar"></i></span>
                    <input type="date" name="data_inicio" class="form-control" value="${filtros.data_inicio || ''}" title="Data Inicial" style="max-width: 130px;">
                    <span class="input-group-text border-custom">até</span>
                    <input type="date" name="data_fim" class="form-control" value="${filtros.data_fim || ''}" title="Data Final" style="max-width: 130px;">
                    <button type="submit" class="btn btn-primary px-3" title="Filtrar Período"><i class="fa-solid fa-filter"></i></button>
                    <button type="button" class="btn btn-outline-secondary border-custom px-2 text-danger bg-custom-darker" onclick="limparFiltrosCaderno()" title="Limpar Filtro"><i class="fa-solid fa-eraser"></i></button>
                </div>
            </form>

            <div class="vr d-none d-md-block m-0 border-custom"></div>

            <div class="d-flex gap-2 flex-nowrap">
                <button class="btn btn-sm btn-outline-warning shadow-sm fw-bold text-nowrap" data-bs-toggle="modal" data-bs-target="#migracaoModal" title="Sincronizar clientes antigos">
                    <i class="fa-solid fa-satellite-dish"></i> <span class="d-none d-md-inline ms-1">Sincronizar GPS</span>
                </button>
                <button class="btn btn-sm btn-outline-primary shadow-sm fw-bold text-nowrap" data-bs-toggle="modal" data-bs-target="#novoClienteModal">
                    <i class="fa-solid fa-users"></i> <span class="d-none d-md-inline ms-1">Clientes</span>
                </button>
                <a href="/caderno-entregas/clientes/exportar-excel" target="_blank" class="btn btn-sm btn-outline-success shadow-sm fw-bold text-nowrap" title="Baixar Excel" onclick="mostrarToast('sucesso', 'Download Iniciado!', 'O seu relatório Excel está a ser gerado e descarregado.')">
                    <i class="fa-solid fa-file-excel"></i> <span class="d-none d-md-inline ms-1">Relatório</span>
                </a>
                <button class="btn btn-sm btn-success shadow-sm fw-bold text-nowrap" data-bs-toggle="modal" data-bs-target="#novoCadernoModal">
                    <i class="fa-solid fa-plus"></i> <span class="d-none d-sm-inline ms-1">Novo</span>
                </button>
            </div>
         </div>
      </div>

      ${cadernos.length > 0 
        ? `<div class="table-responsive bg-custom-darker rounded-3 shadow-sm border-custom mb-4">
             <table class="table table-sm align-middle mb-0" style="font-size: 0.8rem; border-collapse: separate; border-spacing: 0;">
               <thead>
                 <tr>
                   <th class="py-2 px-3">Data de Saída</th>
                   <th class="py-2 px-3">Motorista</th>
                   <th class="py-2 px-3">Veículo</th>
                   <th class="py-2 px-3 text-center">Entregas</th>
                   <th class="py-2 px-3 text-end">Ações</th>
                 </tr>
               </thead>
               <tbody class="border-top-0">
                 ${linhas}
               </tbody>
             </table>
           </div>` 
        : `<div class="col-12 text-center text-muted mt-4 text-center-empty"><i class="fa-solid fa-route fa-2x opacity-25 mb-3"></i><p style="font-size:0.8rem;">Nenhum caderno encontrado para este filtro.</p></div>`
      }

      ${paginacaoHtml}
    </div>

    <button class="btn-flutuante" data-bs-toggle="modal" data-bs-target="#modalInstrucoes" title="Ajuda / Como usar">
      <i class="fa-solid fa-question"></i>
    </button>

    <div class="modal fade" id="modalInstrucoes" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg erp-modal">
          <div class="modal-header bg-custom-darker border-0">
            <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-circle-info text-accent me-2"></i> Como usar o Caderno</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 text-muted bg-custom-dark" style="font-size: 0.8rem;">
            <p class="mb-4">Bem-vindo ao <strong>Caderno de Entregas Inteligente</strong>. Siga as orientações abaixo para gerenciar as rotas:</p>
            <ul class="list-group list-group-flush mb-4">
              <li class="list-group-item bg-transparent px-0 border-custom pb-3">
                <strong class="text-white d-block mb-1"><i class="fa-solid fa-route text-accent me-2"></i> 1. Roteirização Automática</strong>
                Ao adicionar as entregas e clicar em "Gerar Caderno", o sistema irá usar a inteligência do servidor para traçar e reordenar automaticamente a sequência mais rápida de percurso.
              </li>
              <li class="list-group-item bg-transparent px-0 border-custom py-3">
                <strong class="text-white d-block mb-1"><i class="fa-solid fa-location-arrow text-success me-2"></i> 2. Navegação Rápida</strong>
                Use o botão "Iniciar Navegação" (ícone verde nas rotas) para abrir o <strong>Google Maps no telemóvel</strong> já com a rota completa montada em sequência.
              </li>
              <li class="list-group-item bg-transparent px-0 border-custom py-3">
                <strong class="text-white d-block mb-1"><i class="fa-solid fa-boxes-stacked text-info me-2"></i> 3. Adicionar Entregas e Itens</strong>
                Você pode incluir múltiplos itens para a mesma entrega, especificando as quantidades e opcionalmente o valor a receber em cada parada.
              </li>
              <li class="list-group-item bg-transparent px-0 border-custom pt-3 border-bottom-0">
                <strong class="text-white d-block mb-1"><i class="fa-solid fa-print text-secondary me-2"></i> 4. Imprimir Manifesto PDF</strong>
                Após o cálculo do sistema, gere um PDF para o motorista contendo a rota otimizada e os <strong>QR Codes</strong> de navegação de cada local.
              </li>
            </ul>
          </div>
          <div class="modal-footer border-0 bg-custom-darker">
            <button type="button" class="btn btn-sm btn-primary px-4 fw-bold shadow-sm" data-bs-dismiss="modal">Entendi</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="migracaoModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal shadow-lg">
          <div class="modal-header bg-custom-darker text-white border-0">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-satellite-dish me-2 text-warning"></i> Sincronizar Coordenadas</h6>
            <button type="button" class="btn-close btn-close-white" onclick="fecharMigracao()"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark text-center" id="migracaoStartScreen">
            <i class="fa-solid fa-satellite-dish fa-2x text-warning mb-3"></i>
            <h6 class="fw-bold text-white" style="font-size: 0.9rem;">Atualizar Clientes Antigos?</h6>
            <p class="text-muted small">O sistema irá varrer todos os clientes que ainda não possuem coordenadas exatas e tentará buscar a localização precisa no Google Maps. O processo atualizará um por um e mostrará o resultado nesta tela.</p>
            <button type="button" class="btn btn-sm btn-warning fw-bold px-4 mt-2 text-dark" onclick="iniciarMigracao()">Sincronizar</button>
          </div>
          <div class="modal-body p-0 bg-custom-darker" id="migracaoProcessScreen" style="display: none; height: 400px;">
            <iframe id="iframeMigracao" src="about:blank" style="width: 100%; height: 100%; border: none; background: #2a2a2a;"></iframe>
          </div>
          <div class="modal-footer bg-custom-darker border-0">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" onclick="fecharMigracao()">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="novoClienteModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content erp-modal shadow-lg">

            <div class="modal-header bg-custom-darker text-white border-0">
                <h6 class="modal-title fw-bold" style="font-size: 0.85rem;">
                <i class="fa-solid fa-users me-2 text-accent"></i> Gerenciamento de Clientes (Maps)
                </h6>
                <div class="d-flex gap-2">
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
                    </div>

          <div class="modal-body p-4 bg-custom-dark">

                <form
    method="POST"
    action="/caderno-entregas/clientes/novo"
    class="bg-custom-darker p-3 rounded border-custom shadow-sm mb-4"
    onsubmit="prepararSubmissaoSimples(event, this, 'Cliente Cadastrado!')"
>
    <h6 class="fw-bold text-accent mb-3" style="font-size: 0.8rem;">
        <i class="fa-solid fa-user-plus me-1"></i> Cadastrar Novo Cliente
    </h6>
    
    <div class="row g-2 align-items-end">
        <div class="col-12 col-md-3">
            <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">
                Nome / Pizzaria
            </label>
            <input
                type="text"
                name="nome"
                class="form-control form-control-sm bg-custom-dark border-custom text-white shadow-sm"
                required
                placeholder="Ex: Pizzaria Bella Napoli"
            >
        </div>
        
        <div class="col-12 col-md-3">
            <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">
                Link do Maps
            </label>
            <input
                type="url"
                name="link_endereco"
                class="form-control form-control-sm bg-custom-dark border-custom text-white shadow-sm"
                placeholder="Cole o link aqui"
                oninput="extrairCoordenadasAoColar(this)"
            >
        </div>
        
        <div class="col-12 col-md-3">
            <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">
                Coord. (Opcional)
            </label>
            <input
                type="text"
                name="coordenadas"
                class="form-control form-control-sm bg-custom-dark border-custom text-white shadow-sm coord-input"
                placeholder="Lat, Lng"
            >
        </div>

        <div class="col-12 col-md-3 d-flex gap-2">
            <a 
                href="/caderno-entregas/clientes/exportar-excel" 
                target="_blank" 
                class="btn btn-sm btn-outline-success shadow-sm flex-shrink-0" 
                title="Relatório Excel Clientes" 
                onclick="mostrarToast('sucesso', 'Download Iniciado!', 'O relatório Excel dos clientes está sendo gerado e será baixado em breve.')"
            >
                <i class="fa-solid fa-file-excel"></i>
            </a>
            <button
                type="submit"
                class="btn btn-sm btn-primary w-100 fw-bold shadow-sm"
                title="Salvar"
            >
                <i class="fa-solid fa-save me-1"></i> Salvar
            </button>
        </div>
    </div>
</form>

                <h6 class="fw-bold text-white mb-2" style="font-size: 0.8rem;">
                <i class="fa-solid fa-list me-1 text-muted"></i> Histórico de Clientes Cadastrados
                </h6>

                <div class="input-group input-group-sm mb-2 shadow-sm">
                <span class="input-group-text bg-custom-darker border-end-0 border-custom">
                    <i class="fa-solid fa-magnifying-glass text-muted"></i>
                </span>

                <input
                    type="text"
                    id="searchInputClientes"
                    class="form-control border-start-0 border-end-0 border-custom bg-custom-darker text-white"
                    placeholder="Pesquisar cliente por nome..."
                    onkeyup="filtrarClientes()"
                >

                <button
                    class="btn btn-outline-secondary bg-custom-darker border-custom border-start-0 text-danger"
                    type="button"
                    onclick="limparBuscaClientes()"
                    title="Limpar pesquisa"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
                      </div>
                <div
                class="table-responsive bg-custom-darker rounded border-custom shadow-sm"
                style="height: 58vh; max-height: 560px; overflow-y: auto;"
                >
                <table class="table table-sm align-middle mb-0" style="font-size: 0.8rem;">
                    <thead style="position: sticky; top: 0; z-index: 1;">
                    <tr>
                        <th class="py-2 px-3">Nome do Cliente</th>
                        <th class="py-2 px-3">Cidade</th>
                        <th class="py-2 px-3 text-end">Ações</th>
                    </tr>
                    </thead>

                    <tbody id="tabelaClientesBody">
                    ${listaClientesTabela}
                    </tbody>
                </table>
                </div>
            </div>

            <div class="modal-footer bg-custom-darker border-0">
                <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" data-bs-dismiss="modal">
                Fechar Painel
                </button>
            </div>

            </div>
        </div>
    </div>

    <div class="modal fade" id="novoCadernoModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/caderno-entregas/novo" class="modal-content erp-modal shadow-lg" onsubmit="prepararSubmissaoSimples(event, this, 'A otimizar rota...')">
          <div class="modal-header bg-custom-darker text-white border-0">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-plus-circle me-2 text-accent"></i> Criar Caderno de Entregas (Otimizado)</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            <h6 class="fw-bold text-accent mb-3 border-bottom border-custom pb-2" style="font-size: 0.8rem;"><i class="fa-solid fa-truck me-1"></i> Equipe e Transporte</h6>
            <div class="row g-3 mb-4">
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Motorista</label>
                <div class="d-flex align-items-center gap-2">
                    <img id="fotoMotoristaNovo" src="https://ui-avatars.com/api/?name=Motorista&background=1f1f1f&color=08c068" class="rounded shadow-sm border-custom bg-custom-darker" style="width: 28px; height: 28px; object-fit: cover; flex-shrink: 0;">
                    <div class="autocomplete-container flex-grow-1">
                        <input type="text" name="motorista" class="form-control form-control-sm shadow-sm" required placeholder="Digite ou selecione" oninput="handleColabInput(event, this, 'fotoMotoristaNovo')" onclick="handleColabInput(event, this, 'fotoMotoristaNovo')" autocomplete="off">
                        <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
                    </div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Ajudante</label>
                <div class="d-flex align-items-center gap-2">
                    <img id="fotoAjudanteNovo" src="https://ui-avatars.com/api/?name=Ajudante&background=222&color=6c757d" class="rounded shadow-sm border-custom bg-custom-darker" style="width: 28px; height: 28px; object-fit: cover; flex-shrink: 0;">
                    <div class="autocomplete-container flex-grow-1">
                        <input type="text" name="ajudante" class="form-control form-control-sm shadow-sm" placeholder="Opcional" oninput="handleColabInput(event, this, 'fotoAjudanteNovo')" onclick="handleColabInput(event, this, 'fotoAjudanteNovo')" autocomplete="off">
                        <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
                    </div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Veículo de Saída</label>
                <select name="veiculo_id" class="form-select form-select-sm shadow-sm" required>
                    <option value="" disabled selected>Escolha o veículo...</option>
                    ${veiculosOptions}
                </select>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-end mb-2 border-bottom border-custom pb-2">
                <h6 class="fw-bold text-white mb-0" style="font-size: 0.8rem;"><i class="fa-solid fa-route me-1 text-accent"></i> Locais de Entrega</h6>
                <button type="button" class="btn btn-sm btn-outline-primary fw-bold px-3 py-1 shadow-sm" style="font-size: 0.75rem;" onclick="addEntregaDinamica('containerEntregas')"><i class="fa-solid fa-plus me-1"></i> Adicionar Local</button>
            </div>

            <div id="containerEntregas" class="pt-2 pb-2 px-1 container-entregas-dinamico">
                <div class="row g-2 mb-3 entrega-item align-items-start border-custom p-3 rounded bg-custom-darker position-relative shadow-sm mx-1">
                    <input type="hidden" name="id[]" value="">
                    <input type="hidden" name="entrega_id[]" value="">
                    <input type="hidden" name="id_entrega[]" value="">

                    <input type="hidden" name="itens_pedido[]" class="hidden-itens">
                    <input type="hidden" name="quantidade[]" class="hidden-qtd">

                    <div class="col-12 col-md-5">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Cliente / Local</label>
                        <div class="autocomplete-container">
                            <input type="text" name="local[]" class="form-control form-control-sm client-input shadow-sm" oninput="handleClientInput(event, this)" onclick="handleClientInput(event, this)" placeholder="Digite o nome..." required autocomplete="off">
                            <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
                        </div>
                    </div>
                    <div class="col-12 col-md-4">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Link do Maps</label>
                        <input type="url" name="link[]" class="form-control form-control-sm link-maps-input shadow-sm" placeholder="Cole o link aqui" oninput="extrairCoordenadasAoColar(this)">
                    </div>
                    <div class="col-12 col-md-3">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Coordenadas</label>
                        <input type="text" name="coordenadas_rota[]" class="form-control form-control-sm coord-input shadow-sm" placeholder="Lat, Lng">
                    </div>

                    <div class="col-12 col-md-8 mt-2">
                        <label class="form-label text-white fw-bold mb-1" style="font-size:0.75rem;"><i class="fa-solid fa-list-check text-muted me-1"></i> Itens do Pedido</label>
                        <div class="sub-itens-container bg-custom-dark p-2 rounded border-custom">
                            <div class="row g-1 mb-1 sub-item-row">
                                <div class="col-8">
                                    <div class="autocomplete-container">
                                        <input type="text" class="form-control form-control-sm sub-item-nome shadow-sm" placeholder="Item do Pedido" oninput="handleItemInput(event, this)" onclick="handleItemInput(event, this)" required autocomplete="off">
                                        <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
                                    </div>
                                </div>
                                <div class="col-3">
                                    <input type="number" class="form-control form-control-sm sub-item-qtd shadow-sm" placeholder="Qtd" required>
                                </div>
                                <div class="col-1 text-end">
                                    <button type="button" class="btn btn-sm text-danger p-0 mt-1 shadow-sm" onclick="this.closest('.sub-item-row').remove();"><i class="fa-solid fa-minus-circle"></i></button>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-xs btn-link text-accent text-decoration-none p-0 mt-1 fw-bold" style="font-size:0.75rem;" onclick="addSubItemLinha(this)">
                            <i class="fa-solid fa-plus-circle me-1"></i> Adicionar outro item
                        </button>
                    </div>

                    <div class="col-12 col-md-4 mt-2">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Valor a Receber (Opcional)</label>
                        <div class="input-group input-group-sm shadow-sm">
                          <span class="input-group-text border-custom">R$</span>
                          <input type="text" name="valor_aberto[]" class="form-control mask-moeda" oninput="maskMoeda(this)" placeholder="0,00">
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-danger position-absolute d-flex align-items-center justify-content-center shadow" style="width: 24px; height: 24px; top: -10px; right: -10px; border-radius: 50%; padding: 0; z-index: 10;" onclick="this.closest('.entrega-item').remove();" title="Remover Local">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-0 d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success w-100 fw-bold"><i class="fa-solid fa-location-arrow me-1"></i> Gerar Caderno</button>
          </div>
        </form>
      </div>
    </div>

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
                <div class="progress shadow-sm bg-custom-dark position-absolute bottom-0 start-0 w-100 rounded-0" style="height: 4px; display: none;" id="progressoContainer">
                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-success text-white fw-bold" id="barraProgresso" role="progressbar" style="width: 0%; font-size: 0.6rem;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
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

    ${modais}
    ${modaisEdicaoExclusaoClientes}
    ${modalImprimirNovoHtml}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      let isSubmitting = false;
      let dictClientes = ${JSON.stringify(historicoClientes)};
      let clientNames = Object.keys(dictClientes);
      const arrayItensCatalogo = ${JSON.stringify(catalogoItens.map(i => i.nome) || [])};
      const listaColabDB = ${JSON.stringify(colaboradores || [])};

      // =======================================================================
      // AUTOCOMPLETAR DE COLABORADORES (MOTORISTA E AJUDANTE) COM FOTO
      // =======================================================================
      function handleColabInput(event, inputEl, imgId) {
          const dropdown = inputEl.nextElementSibling;
          let val = inputEl.value;
          const searchVal = val.toLowerCase().trim();
          dropdown.innerHTML = '';

          const imgEl = document.getElementById(imgId);

          const updateFoto = (nomeStr, fotoUrl) => {
              if (imgEl) {
                  if (fotoUrl) {
                      imgEl.src = fotoUrl;
                  } else {
                      const fallbackName = nomeStr.trim() ? encodeURIComponent(nomeStr.trim()) : (inputEl.name === 'ajudante' ? 'Ajudante' : 'Motorista');
                      imgEl.src = \`https://ui-avatars.com/api/?name=\${fallbackName}&background=\${inputEl.name === 'ajudante' && !nomeStr.trim() ? '222' : '1f1f1f'}&color=\${inputEl.name === 'ajudante' && !nomeStr.trim() ? '6c757d' : '08c068'}\`;
                  }
              }
          };

          const matches = listaColabDB.filter(c => c.nome.toLowerCase().includes(searchVal));
          const listToShow = searchVal ? matches : listaColabDB;

          if (listToShow.length > 0) {
              dropdown.style.display = 'block';
              listToShow.forEach(match => {
                  const item = document.createElement('div');
                  item.className = 'autocomplete-item d-flex align-items-center gap-2';
                  
                  const fotoSrc = match.foto ? \`/uploads/\${match.foto}\` : \`https://ui-avatars.com/api/?name=\${encodeURIComponent(match.nome)}&background=1f1f1f&color=08c068\`;
                  
                  let nomeDisplay = match.nome;
                  if (searchVal) {
                      const safeRegex = searchVal.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
                      const regex = new RegExp(\`(\${safeRegex})\`, "gi");
                      nomeDisplay = match.nome.replace(regex, "<strong>$1</strong>");
                  }
                  
                  const badgeText = match.tipo_usuario ? match.tipo_usuario.replace('_', ' ').toUpperCase() : 'COLABORADOR';

                  item.innerHTML = \`
                      <img src="\${fotoSrc}" class="rounded border-custom" style="width: 24px; height: 24px; object-fit: cover; flex-shrink: 0;">
                      <div class="text-truncate">
                          \${nomeDisplay} <span class="badge bg-custom-darker border-custom text-muted ms-1" style="font-size:0.55rem;">\${badgeText}</span>
                      </div>
                  \`;

                  item.onmousedown = function(e) {
                      e.preventDefault(); 
                      inputEl.value = match.nome;
                      updateFoto(match.nome, fotoSrc);
                      dropdown.style.display = 'none';
                  };
                  dropdown.appendChild(item);
              });
          } else {
              dropdown.style.display = 'none';
          }

          const exactMatch = listaColabDB.find(c => c.nome.toLowerCase() === searchVal);
          if (exactMatch) {
              const fotoSrc = exactMatch.foto ? \`/uploads/\${exactMatch.foto}\` : \`https://ui-avatars.com/api/?name=\${encodeURIComponent(exactMatch.nome)}&background=1f1f1f&color=08c068\`;
              updateFoto(exactMatch.nome, fotoSrc);
          } else {
              updateFoto(val, null);
          }
      }

      // =======================================================================
      // FUNÇÃO GENÉRICA DE TOAST (SUCESSO E ERRO)
      // =======================================================================
      function mostrarToast(tipo, titulo, mensagem) {
          const toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
          if (toastEl) {
              document.getElementById(tipo === 'sucesso' ? 'sucessoTitulo' : 'erroTitulo').innerText = titulo;
              document.getElementById(tipo === 'sucesso' ? 'sucessoSub' : 'erroSub').innerText = mensagem;

              const progressoContainer = document.getElementById('progressoContainer');
              if (tipo === 'sucesso' && progressoContainer) progressoContainer.style.display = 'none';

              const timerEl = document.getElementById(tipo === 'sucesso' ? 'sucessoTimer' : 'erroTimer');
              if (timerEl) {
                  timerEl.style.display = 'block';
                  timerEl.style.animation = 'none';
                  timerEl.offsetHeight; // Força o reflow para a animação reiniciar
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
          if(!successToastEl) return;
          document.getElementById('sucessoTitulo').innerText = "A Processar";
          document.getElementById('sucessoSub').innerText = mensagem;

          const progressoContainer = document.getElementById('progressoContainer');
          if(progressoContainer) progressoContainer.style.display = 'none';

          successToastEl.setAttribute('data-bs-autohide', 'false');

          const timerEl = document.getElementById('sucessoTimer');
          if (timerEl) timerEl.style.display = 'none';

          const oldInstance = bootstrap.Toast.getInstance(successToastEl);
          if (oldInstance) oldInstance.dispose();
          const successToast = new bootstrap.Toast(successToastEl);
          successToast.show();
      }

      // =======================================================================
      // SKELETON LOADING
      // =======================================================================
      function gerarSkeletonTabela(quantidade = 5) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += \`
              <tr class="align-middle">
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 80%; margin: 0;"></div></td>
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 60%; margin: 0;"></div></td>
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 70%; margin: 0;"></div></td>
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 40px; margin: 0 auto;"></div></td>
                  <td class="text-end py-2 px-3 d-flex justify-content-end gap-1">
                      <div class="skeleton-dark skeleton-btn-view"></div>
                      <div class="skeleton-dark skeleton-btn-view"></div>
                      <div class="skeleton-dark skeleton-btn-view"></div>
                  </td>
              </tr>\`;
          }
          return html;
      }
      function mostrarSkeletonGlobais() {
          const tableContainer = document.querySelector('.content > .table-responsive');
          const emptyState = document.querySelector('.content > .text-center-empty');

          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="table-responsive bg-custom-darker rounded-3 shadow-sm border-custom mb-4 skeleton-container">
              <table class="table table-sm align-middle mb-0" style="font-size: 0.8rem; border-collapse: separate; border-spacing: 0;">
                 <thead class="table-light">
                   <tr>
                     <th class="py-2 px-3">Data de Saída</th>
                     <th class="py-2 px-3">Motorista</th>
                     <th class="py-2 px-3">Veículo</th>
                     <th class="py-2 px-3 text-center">Entregas</th>
                     <th class="py-2 px-3 text-end">Ações</th>
                   </tr>
                 </thead>
                 <tbody class="border-top-0">
                    \${gerarSkeletonTabela(5)}
                 </tbody>
              </table>
          </div>\`;

          if (tableContainer && !tableContainer.classList.contains('skeleton-container')) {
              tableContainer.style.display = 'none';
              tableContainer.insertAdjacentHTML('beforebegin', skeletonHTML);
          } else if (emptyState) {
              emptyState.style.display = 'none';
              emptyState.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const tableContainer = document.querySelector('.content > .table-responsive');
          const emptyState = document.querySelector('.content > .text-center-empty');

          if (tableContainer) tableContainer.style.display = '';
          if (emptyState) emptyState.style.display = '';
      }

      // ACIONAMENTO AUTOMÁTICO DO SKELETON PARA TABELA (LOAD/RELOAD)
      mostrarSkeletonGlobais();

      if (document.readyState === 'complete') {
          setTimeout(ocultarSkeletonGlobais, 100);
      } else {
          window.addEventListener('load', ocultarSkeletonGlobais);
      }

      window.addEventListener('beforeunload', () => {
          mostrarSkeletonGlobais();
      });

      // =======================================================================
      // CARREGAMENTO INICIAL: CHECA URL PARA MODAIS (Caso haja Refresh)
      // =======================================================================
      document.addEventListener("DOMContentLoaded", () => {
          const urlParams = new URLSearchParams(window.location.search);

          const cadernoCriadoId = urlParams.get('cadernoCriado');
          if (cadernoCriadoId) {
              mostrarToast('sucesso', 'Sucesso!', 'Caderno criado e otimizado com sucesso.');

              const btnImprimir = document.getElementById('btnImprimirNovoModal');
              if (btnImprimir) {
                  btnImprimir.href = "/caderno-entregas/pdf/" + cadernoCriadoId;
              }
              const modalImp = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalImprimirNovo'));
              modalImp.show();

              const url = new URL(window.location.href);
              url.searchParams.delete('cadernoCriado');
              window.history.replaceState({}, document.title, url.toString());
          }

          if (urlParams.has('sucessoCliente')) {
              mostrarToast('sucesso', 'Sucesso!', 'Histórico de clientes atualizado com sucesso.');

              const url = new URL(window.location.href);
              url.searchParams.delete('sucessoCliente');
              window.history.replaceState({}, document.title, url.toString());
          }

          if (urlParams.has('erroExportacao')) {
              mostrarToast('erro', 'Erro!', 'Não foi possível gerar o arquivo de clientes.');

              const url = new URL(window.location.href);
              url.searchParams.delete('erroExportacao');
              window.history.replaceState({}, document.title, url.toString());
          }
      });

      // =======================================================================
      // AJAX PARA FILTROS E PAGINAÇÃO (SEM RELOAD)
      // =======================================================================
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
              console.error(err);
              mostrarToast('erro', 'Falha de Conexão', 'Verifique a sua rede e tente novamente.');
          }
      }

      function limparFiltrosCaderno() {
          const form = document.getElementById('formFiltroCaderno');
          if (form) {
              form.querySelectorAll('input[type="date"]').forEach(i => i.value = '');
              prepararBuscaSimples(null, form, 'Os filtros foram removidos!');
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
          }
      }

      // Função cirúrgica para garantir que todos os modais novos entrem e os velhos saiam
      function atualizarModaisDinamicos(doc) {
          const staticModals = ['modalInstrucoes', 'migracaoModal', 'novoClienteModal', 'novoCadernoModal', 'modalImprimirNovo', 'sidebarMenu'];
          document.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) m.remove();
          });
          doc.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
          });
      }

      // =======================================================================
      // NAVEGAÇÃO E URLs SEGURAS
      // =======================================================================
      function iniciarNavegacao(listaParadas) {
          const paradasFormatadas = listaParadas.map(p => encodeURIComponent(p)).join('/');
          const url = "https://www.google.com/maps/dir//" + paradasFormatadas;
          window.open(url, '_blank');
      }

      function iniciarMigracao() {
          document.getElementById('migracaoStartScreen').style.display = 'none';
          document.getElementById('migracaoProcessScreen').style.display = 'block';
          document.getElementById('iframeMigracao').src = '/caderno-entregas/migrar-coordenadas';
      }

      function fecharMigracao() {
          const iframe = document.getElementById('iframeMigracao');
          if (iframe.src !== "about:blank" && !iframe.src.endsWith("about:blank")) {
              window.location.reload();
          } else {
              bootstrap.Modal.getInstance(document.getElementById('migracaoModal')).hide();
          }
      }

      // =======================================================================
      // AUTOCOMPLETAR CUSTOMIZADO COM TYPEAHEAD (SUGESTÃO INLINE)
      // =======================================================================
      function handleClientInput(event, inputEl) {
          const containerItem = inputEl.closest('.entrega-item');
          if (!containerItem) return;

          const linkInput = containerItem.querySelector('.link-maps-input');
          const coordInput = containerItem.querySelector('.coord-input');
          const dropdown = inputEl.nextElementSibling;

          let val = inputEl.value;

          if (event && event.inputType && event.inputType.startsWith('insert') && val.trim() !== '') {
              let perfectMatch = clientNames.find(name => name.toLowerCase().startsWith(val.toLowerCase()));
              if (perfectMatch && perfectMatch.toLowerCase() !== val.toLowerCase()) {
                  const currentLength = val.length;
                  inputEl.value = perfectMatch;
                  inputEl.setSelectionRange(currentLength, perfectMatch.length);
                  val = inputEl.value;
              }
          }

          const searchVal = val.toLowerCase().trim();
          dropdown.innerHTML = '';

          if (!searchVal) {
              dropdown.style.display = 'none';
              if (linkInput) linkInput.value = '';
              if (coordInput) coordInput.value = '';
              return;
          }

          const matches = clientNames.filter(name => name.toLowerCase().includes(searchVal));

          if (matches.length > 0) {
              dropdown.style.display = 'block';
              matches.forEach(match => {
                  const item = document.createElement('div');
                  item.className = 'autocomplete-item';

                  const safeRegex = searchVal.replace(/[.*+?^$\{}()|[\\]\\\\]/g, '\\\\$&');
                  const regex = new RegExp(\`(\${safeRegex})\`, "gi");
                  item.innerHTML = match.replace(regex, "<strong>$1</strong>");

                  item.onmousedown = function(e) {
                      e.preventDefault();
                      inputEl.value = match;
                      if (linkInput) linkInput.value = dictClientes[match].link || '';
                      if (coordInput) coordInput.value = dictClientes[match].coord || '';
                      dropdown.style.display = 'none';
                  };
                  dropdown.appendChild(item);
              });
          } else {
              dropdown.style.display = 'block';
              const novoItem = document.createElement('div');
              novoItem.className = 'autocomplete-item text-accent fw-bold';
              novoItem.innerHTML = \`<i class="fa-solid fa-plus-circle me-1"></i> Cadastrar cliente "<strong>\${val}</strong>"\`;
              novoItem.onmousedown = function(e) {
                  e.preventDefault();
                  inputEl.value = val;
                  if (linkInput) linkInput.value = '';
                  if (coordInput) coordInput.value = '';
                  dropdown.style.display = 'none';
              };
              dropdown.appendChild(novoItem);
          }

          if (dictClientes[val]) {
              if (linkInput) linkInput.value = dictClientes[val].link || '';
              if (coordInput) coordInput.value = dictClientes[val].coord || '';
          } else {
              if (linkInput) linkInput.value = '';
              if (coordInput) coordInput.value = '';
          }
      }

      function handleItemInput(event, inputEl) {
          const dropdown = inputEl.nextElementSibling;
          let val = inputEl.value;

          if (event && event.inputType && event.inputType.startsWith('insert') && val.trim() !== '') {
              let perfectMatch = arrayItensCatalogo.find(name => name.toLowerCase().startsWith(val.toLowerCase()));
              if (perfectMatch && perfectMatch.toLowerCase() !== val.toLowerCase()) {
                  const currentLength = val.length;
                  inputEl.value = perfectMatch;
                  inputEl.setSelectionRange(currentLength, perfectMatch.length);
                  val = inputEl.value;
              }
          }

          const searchVal = val.toLowerCase().trim();
          dropdown.innerHTML = '';

          if (!searchVal) {
              dropdown.style.display = 'none';
              return;
          }

          const matches = arrayItensCatalogo.filter(name => name.toLowerCase().includes(searchVal));

          if (matches.length > 0) {
              dropdown.style.display = 'block';
              matches.forEach(match => {
                  const item = document.createElement('div');
                  item.className = 'autocomplete-item';

                  const safeRegex = searchVal.replace(/[.*+?^$\{}()|[\\]\\\\]/g, '\\\\$&');
                  const regex = new RegExp(\`(\${safeRegex})\`, "gi");
                  item.innerHTML = match.replace(regex, "<strong>$1</strong>");

                  item.onmousedown = function(e) {
                      e.preventDefault();
                      inputEl.value = match;
                      dropdown.style.display = 'none';
                  };
                  dropdown.appendChild(item);
              });
          } else {
              dropdown.style.display = 'block';
              const novoItem = document.createElement('div');
              novoItem.className = 'autocomplete-item text-accent fw-bold';
              novoItem.innerHTML = \`<i class="fa-solid fa-keyboard me-1"></i> Cadastrar novo item "<strong>\${val}</strong>"\`;
              novoItem.onmousedown = function(e) {
                  e.preventDefault();
                  inputEl.value = val;
                  dropdown.style.display = 'none';
              };
              dropdown.appendChild(novoItem);
          }
      }

      document.addEventListener('click', function(e) {
          document.querySelectorAll('.autocomplete-dropdown').forEach(d => {
              if (!d.contains(e.target) && e.target !== d.previousElementSibling) {
                  d.style.display = 'none';
              }
          });
      });

      function extrairCoordenadasAoColar(inputElement) {
          const container = inputElement.closest('.entrega-item') || inputElement.closest('form');
          if (!container) return;

          const inputCoords = container.querySelector('input[name="coordenadas"]') || container.querySelector('input[name="coordenadas_rota[]"]');
          if (!inputCoords) return;

          const url = inputElement.value;
          if (!url) return;

          let match = url.match(/!3d(-?\\d+\\.\\d+)!4d(-?\\d+\\.\\d+)/);
          if (!match) match = url.match(/query=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);
          if (!match) match = url.match(/@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);

          if (match && match.length >= 3) {
              inputCoords.value = match[1] + ", " + match[2];
              inputCoords.style.transition = "all 0.3s";
              inputCoords.style.backgroundColor = "rgba(8,192,104,0.15)";
              setTimeout(() => {
                  inputCoords.style.backgroundColor = "";
              }, 1500);
          }
      }

      // =======================================================================
      // SUBMISSÃO AJAX SEM RECARREGAR A PÁGINA (CRUD)
      // =======================================================================
      async function prepararSubmissaoSimples(event, form, titleMsg) {
          event.preventDefault();
          if (!form.checkValidity()) {
              form.reportValidity();
              return;
          }
          if (isSubmitting) return;

          // Esconde qualquer modal aberto para não bloquear a tela
          const modalEl = form.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }

          document.getElementById('sucessoTitulo').innerText = titleMsg;
          const progressoContainer = document.getElementById('progressoContainer');
          const barraProgresso = document.getElementById('barraProgresso');
          const sucessoSub = document.getElementById('sucessoSub');
          const sucessoIcon = document.getElementById('sucessoIcon');
          const timerEl = document.getElementById('sucessoTimer');
          const successToastEl = document.getElementById('sucessoToast');

          // Desabilita o auto-hide para não fechar o toast durante o processamento do servidor
          successToastEl.setAttribute('data-bs-autohide', 'false');
          if (timerEl) timerEl.style.display = 'none';

          // Força a recriação da instância
          const oldInstance = bootstrap.Toast.getInstance(successToastEl);
          if (oldInstance) oldInstance.dispose();
          const successToast = new bootstrap.Toast(successToastEl);
          successToast.show();

          limparMoedas(form);
          isSubmitting = true;

          let intervalProgress;
          if (titleMsg.toLowerCase().includes('otimizar')) {
              sucessoIcon.className = "fa-solid fa-satellite-dish text-accent fs-5 me-2";
              if(progressoContainer) progressoContainer.style.display = 'flex';
              if(barraProgresso) {
                 barraProgresso.style.width = '0%';
                 barraProgresso.innerText = '0%';
              }
              sucessoSub.innerText = "Iniciando otimização...";

              let progresso = 0;
              intervalProgress = setInterval(() => {
                  if (progresso < 98) {
                      progresso += Math.floor(Math.random() * 8) + 2;
                      if (progresso > 98) progresso = 98;
                      if(barraProgresso) {
                          barraProgresso.style.width = progresso + '%';
                      }

                      if (progresso > 20 && progresso < 50) sucessoSub.innerText = "Consultando Google Maps API...";
                      if (progresso >= 50 && progresso < 80) sucessoSub.innerText = "Traçando rota inteligente...";
                      if (progresso >= 80) sucessoSub.innerText = "Gerando caderno e salvando dados da cidade...";
                  }
              }, 400);

          } else {
              sucessoIcon.className = "fa-solid fa-circle-check text-accent fs-5 me-2";
              if(progressoContainer) progressoContainer.style.display = 'none';
              sucessoSub.innerText = "Por favor, aguarde...";

              if(!titleMsg.toLowerCase().includes('cliente')) {
                 mostrarSkeletonGlobais();
              }
          }

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

              if (intervalProgress) clearInterval(intervalProgress);

              if (response.ok) {
                  await new Promise(r => setTimeout(r, 800));

                  const freshResponse = await fetch(window.location.href);
                  const html = await freshResponse.text();

                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }

                  const oldTbody = document.getElementById('tabelaClientesBody');
                  const newTbody = doc.getElementById('tabelaClientesBody');
                  if (oldTbody && newTbody) {
                      oldTbody.innerHTML = newTbody.innerHTML;
                  }

                  atualizarModaisDinamicos(doc);

                  if (form.action.includes('/clientes/novo')) {
                      const n = fd.get('nome');
                      if (n) {
                          dictClientes[n] = { link: fd.get('link_endereco') || '', coord: fd.get('coordenadas') || '' };
                          if (!clientNames.includes(n)) clientNames.push(n);
                      }
                  } else if (form.action.includes('/clientes/editar')) {
                      const nOri = fd.get('nomeOriginal');
                      const nNovo = fd.get('nomeNovo');
                      if (nOri && dictClientes[nOri]) {
                          delete dictClientes[nOri];
                          const idx = clientNames.indexOf(nOri);
                          if (idx > -1) clientNames.splice(idx, 1);
                      }
                      if (nNovo) {
                          dictClientes[nNovo] = { link: fd.get('link_endereco') || '', coord: fd.get('coordenadas') || '' };
                          if (!clientNames.includes(nNovo)) clientNames.push(nNovo);
                      }
                  } else if (form.action.includes('/clientes/excluir')) {
                      const n = fd.get('nome');
                      if (n && dictClientes[n]) {
                          delete dictClientes[n];
                          const idx = clientNames.indexOf(n);
                          if (idx > -1) clientNames.splice(idx, 1);
                      }
                  }

                  form.reset();
                  const dynamicContainers = form.querySelectorAll('.container-entregas-dinamico .entrega-item:not(:first-child)');
                  dynamicContainers.forEach(el => el.remove());

                  const defaultImgMot = "https://ui-avatars.com/api/?name=Motorista&background=1f1f1f&color=08c068";
                  const defaultImgAju = "https://ui-avatars.com/api/?name=Ajudante&background=222&color=6c757d";
                  const fotoMotNovo = document.getElementById('fotoMotoristaNovo');
                  const fotoAjuNovo = document.getElementById('fotoAjudanteNovo');
                  if (fotoMotNovo) fotoMotNovo.src = defaultImgMot;
                  if (fotoAjuNovo) fotoAjuNovo.src = defaultImgAju;

                  const responseUrl = new URL(response.url);

                  if (responseUrl.searchParams.has('cadernoCriado')) {
                      const cadernoCriadoId = responseUrl.searchParams.get('cadernoCriado');
                      mostrarToast('sucesso', 'Sucesso!', 'Caderno criado e otimizado com sucesso.');

                      const btnImprimir = document.getElementById('btnImprimirNovoModal');
                      if (btnImprimir) {
                          btnImprimir.href = "/caderno-entregas/pdf/" + cadernoCriadoId;
                      }
                      const modalImp = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalImprimirNovo'));
                      modalImp.show();
                  } else if (responseUrl.searchParams.has('sucessoCliente')) {
                      mostrarToast('sucesso', 'Sucesso!', 'Histórico de clientes atualizado com sucesso.');
                  } else {
                      mostrarToast('sucesso', 'Concluído!', titleMsg);
                  }

              } else {
                  if (intervalProgress) clearInterval(intervalProgress);
                  mostrarToast('erro', 'Erro', 'Não foi possível salvar os dados no servidor.');
              }
          } catch (err) {
              console.error(err);
              if (intervalProgress) clearInterval(intervalProgress);
              mostrarToast('erro', 'Falha de Conexão', 'Verifique a sua internet e tente novamente.');
          } finally {
              isSubmitting = false;
          }
      }

      function filtrarClientes() {
          const input = document.getElementById("searchInputClientes");
          const filter = input.value.toLowerCase();
          const tbody = document.getElementById("tabelaClientesBody");
          const trs = tbody.getElementsByTagName("tr");

          for (let i = 0; i < trs.length; i++) {
              if (trs[i].cells.length === 1) continue;
              const tdNome = trs[i].getElementsByTagName("td")[0];
              if (tdNome) {
                  const txtValue = tdNome.textContent || tdNome.innerText;
                  if (txtValue.toLowerCase().indexOf(filter) > -1) trs[i].style.display = "";
                  else trs[i].style.display = "none";
              }
          }
      }

      function limparBuscaClientes() {
          const input = document.getElementById("searchInputClientes");
          input.value = "";
          filtrarClientes();
          input.focus();
      }

      function addEntregaDinamica(containerId) {
          const container = document.getElementById(containerId);
          const html = \`
              <div class="row g-2 mb-3 entrega-item align-items-start border-custom p-3 rounded bg-custom-darker position-relative shadow-sm mx-1">
                  <input type="hidden" name="id[]" value="">
                  <input type="hidden" name="entrega_id[]" value="">
                  <input type="hidden" name="id_entrega[]" value="">

                  <input type="hidden" name="itens_pedido[]" class="hidden-itens">
                  <input type="hidden" name="quantidade[]" class="hidden-qtd">

                  <div class="col-12 col-md-5">
                      <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Cliente / Local</label>
                      <div class="autocomplete-container">
                          <input type="text" name="local[]" class="form-control form-control-sm client-input shadow-sm" oninput="handleClientInput(event, this)" onclick="handleClientInput(event, this)" placeholder="Digite o nome..." required autocomplete="off">
                          <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
                      </div>
                  </div>
                  <div class="col-12 col-md-4">
                      <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Link do Maps</label>
                      <input type="url" name="link[]" class="form-control form-control-sm link-maps-input shadow-sm" placeholder="Cole o link aqui" oninput="extrairCoordenadasAoColar(this)">
                  </div>
                  <div class="col-12 col-md-3">
                      <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Coordenadas</label>
                      <input type="text" name="coordenadas_rota[]" class="form-control form-control-sm coord-input shadow-sm" placeholder="Lat, Lng">
                  </div>

                  <div class="col-12 col-md-8 mt-2">
                      <label class="form-label text-white fw-bold mb-1" style="font-size:0.7rem;"><i class="fa-solid fa-list-check text-muted me-1"></i> Itens do Pedido</label>
                      <div class="sub-itens-container bg-custom-dark p-2 rounded border-custom">
                          <div class="row g-1 mb-1 sub-item-row">
                              <div class="col-8">
                                  <div class="autocomplete-container">
                                      <input type="text" class="form-control form-control-sm sub-item-nome shadow-sm" placeholder="Item do Pedido" oninput="handleItemInput(event, this)" onclick="handleItemInput(event, this)" required autocomplete="off">
                                      <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
                                  </div>
                              </div>
                              <div class="col-3">
                                  <input type="number" class="form-control form-control-sm sub-item-qtd shadow-sm" placeholder="Qtd" required>
                              </div>
                              <div class="col-1 text-end">
                                  <button type="button" class="btn btn-sm text-danger p-0 mt-1 shadow-sm" onclick="this.closest('.sub-item-row').remove();"><i class="fa-solid fa-minus-circle"></i></button>
                              </div>
                          </div>
                      </div>
                      <button type="button" class="btn btn-xs btn-link text-accent text-decoration-none p-0 mt-1 fw-bold" style="font-size:0.7rem;" onclick="addSubItemLinha(this)">
                          <i class="fa-solid fa-plus-circle me-1"></i> Adicionar outro item
                      </button>
                  </div>

                  <div class="col-12 col-md-4 mt-2">
                      <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Valor a Receber (Opcional)</label>
                      <div class="input-group input-group-sm shadow-sm">
                        <span class="input-group-text border-custom">R$</span>
                        <input type="text" name="valor_aberto[]" class="form-control mask-moeda" oninput="maskMoeda(this)" placeholder="0,00">
                      </div>
                  </div>
                  <button type="button" class="btn btn-sm btn-danger position-absolute d-flex align-items-center justify-content-center shadow" style="width: 24px; height: 24px; top: -10px; right: -10px; border-radius: 50%; padding: 0; z-index: 10;" onclick="this.closest('.entrega-item').remove();" title="Remover Local">
                      <i class="fa-solid fa-xmark"></i>
                  </button>
              </div>
          \`
          container.insertAdjacentHTML('beforeend', html);
      }

      function addSubItemLinha(btn) {
          const container = btn.closest('.entrega-item').querySelector('.sub-itens-container');
          const html = \`
              <div class="row g-1 mb-1 sub-item-row">
                  <div class="col-8">
                      <div class="autocomplete-container">
                          <input type="text" class="form-control form-control-sm sub-item-nome shadow-sm" placeholder="Item do Pedido" oninput="handleItemInput(event, this)" onclick="handleItemInput(event, this)" required autocomplete="off">
                          <div class="autocomplete-dropdown shadow-sm" style="display:none;"></div>
                      </div>
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