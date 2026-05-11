// views/propostasView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");

module.exports = function propostasView(usuario) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const menuHTML = menuLateral(user, "/propostas"); 

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Propostas e Clichês | ERP Ecoflow</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { display: flex; height: 100vh; margin: 0; background-color: #f4f7f6; font-family: 'Segoe UI', sans-serif; }
    
    /* Layout Padrão Ecoflow */
    .sidebar { width: 240px; background-color: #0D5749; color: white; padding: 20px; display: flex; flex-direction: column; }
    .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s; }
    .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
    .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; }
    
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

    /* Estilos do Módulo de Propostas */
    .btn-brand { background-color: #0D5749; color: white; }
    .btn-brand:hover { background-color: #0a4338; color: white; }
    .text-brand { color: #0D5749; }
    
    /* Hover Tabela e Linhas Verdes */
    .table-hover-row { transition: background-color 0.2s; }
    .table-hover-row:hover > td { background-color: rgba(13, 87, 73, 0.06) !important; }
    
    .table-success-custom > td { background-color: #f0fdf4 !important; }
    .table-success-custom:hover > td { background-color: #dcfce7 !important; }
    
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

    /* Modais Animados */
    @keyframes pulseIcon {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); opacity: 0.8; }
      100% { transform: scale(1); }
    }
    .anim-pulse { animation: pulseIcon 1.5s infinite ease-in-out; }

    @media (max-width: 767.98px) {
      body { flex-direction: column; } .sidebar { display: none; } .content { padding: 16px; }
    }
  </style>
</head>
<body>

  ${renderLoaderParticulas("Carregando")}

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
      <hr class="bg-secondary mt-4">
      <a href="/logout" class="text-danger mt-2"><i class="fas fa-sign-out-alt me-2"></i>Sair do Sistema</a>
    </div>
  </div>

  <div class="content">
    
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div class="d-flex align-items-center gap-3">
          <button class="btn btn-sm btn-light border d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars"></i></button>
          <div>
            <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-file-signature text-muted me-2"></i>Gestão de Propostas</h4>
            <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Acompanhamento de Design e Clichês</span>
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

    <div class="bg-white p-3 rounded-3 shadow-sm border border-light mb-4">
      
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom">
        <h6 class="mb-0 text-muted fw-bold" style="font-size:0.85rem;"><i class="fa-solid fa-filter me-1"></i> Filtros e Ações</h6>
        <div class="d-flex gap-2 mt-2 mt-sm-0">
          <button class="btn btn-sm btn-outline-success shadow-sm" onclick="abrirModalRelatorio()"><i class="fa-solid fa-file-excel me-1"></i> Relatório</button>
          <button class="btn btn-sm btn-brand shadow-sm" onclick="abrirModalProposta()"><i class="fa-solid fa-plus me-1"></i> Nova Proposta</button>
        </div>
      </div>

      <form class="row g-2 align-items-end" onsubmit="event.preventDefault(); buscarPropostas(1);">
        <div class="col-12 col-md-4">
          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Buscar Cliente</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text bg-light"><i class="fa-solid fa-search text-muted"></i></span>
            <input type="text" id="filtroCliente" class="form-control" placeholder="Nome do cliente...">
          </div>
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Período De</label>
          <input type="date" id="filtroInicio" class="form-control form-control-sm">
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Até</label>
          <input type="date" id="filtroFim" class="form-control form-control-sm">
        </div>
        <div class="col-12 col-md-2 d-flex gap-2">
          <button type="submit" class="btn btn-sm btn-brand flex-grow-1">Filtrar</button>
          <button type="button" class="btn btn-sm btn-light border" onclick="limparFiltros()"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </form>
    </div>

    <div id="loadingPropostas" class="text-center py-5">
      <i class="fa-solid fa-circle-notch fa-spin fa-2x text-brand mb-2"></i>
      <p class="text-muted small">A carregar propostas...</p>
    </div>

    <div id="listaPropostas" class="table-responsive bg-white rounded-3 shadow-sm border border-light mb-4" style="display: none;"></div>

    <nav aria-label="Paginação">
      <ul id="paginacaoPropostas" class="pagination pagination-sm justify-content-center"></ul>
    </nav>

  </div>

  <div class="modal fade" id="modalRelatorio" tabindex="-1">
    <div class="modal-dialog modal-sm modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header bg-light">
          <h6 class="modal-title fw-bold"><i class="fa-solid fa-file-excel text-success me-2"></i> Exportar Relatório</h6>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <div class="mb-3">
            <label class="form-label text-muted fw-bold small mb-1">Ano Base</label>
            <select id="relatorioAno" class="form-select form-select-sm"></select>
          </div>
          <div class="mb-4">
            <label class="form-label text-muted fw-bold small mb-1">Mês Base</label>
            <select id="relatorioMes" class="form-select form-select-sm"></select>
          </div>
          <button type="button" onclick="baixarRelatorioExcel()" class="btn btn-sm btn-success w-100 fw-bold"><i class="fa-solid fa-download me-1"></i> Baixar Planilha</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalProposta" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-light border-0">
          <h5 class="modal-title fw-bold text-dark"><i class="fa-solid fa-file-signature text-brand me-2"></i> Formulário de Proposta</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        
        <div class="modal-body p-4 bg-white custom-scrollbar">
          <input type="hidden" id="propostaId">

          <div class="p-3 bg-light rounded-3 border mb-4">
            <h6 class="fw-bold text-muted small mb-3">IDENTIFICAÇÃO</h6>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold small mb-1">Cliente *</label>
                <input type="text" id="cliente" class="form-control form-control-sm" required>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold small mb-1">Designer Responsável</label>
                <select id="designer" class="form-select form-select-sm">
                  <option value="">Selecione...</option>
                  <option value="David">David</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
          </div>

          <div class="p-3 bg-light rounded-3 border mb-4">
            <h6 class="fw-bold text-muted small mb-3">CRONOGRAMA DE ARTE</h6>
            <div class="row g-3 align-items-end">
              <div class="col-md-4">
                <label class="form-label fw-bold small mb-1">Data Início</label>
                <input type="date" id="dataInicio" class="form-control form-control-sm calc-trigger">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-bold small mb-1">Data Fim</label>
                <input type="date" id="dataFim" class="form-control form-control-sm calc-trigger">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-bold small mb-1">Duração da Arte</label>
                <div id="duracaoBadge" class="form-control form-control-sm bg-white text-center text-muted fw-bold py-1">—</div>
              </div>
            </div>
          </div>

          <div class="p-3 bg-light rounded-3 border mb-4">
            <h6 class="fw-bold text-muted small mb-3">LOGÍSTICA DE CLICHÊ</h6>
            <div class="row g-3 align-items-end">
              <div class="col-md-4">
                <label class="form-label fw-bold small mb-1">Data Solicitação</label>
                <input type="date" id="dataSolicitacaoCliche" class="form-control form-control-sm calc-trigger">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-bold small mb-1">Data Chegada</label>
                <input type="date" id="dataChegadaCliche" class="form-control form-control-sm calc-trigger">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-bold small mb-1">Tempo de Trânsito</label>
                <div id="prazoClicheBadge" class="form-control form-control-sm bg-white text-center text-muted fw-bold py-1">—</div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label fw-bold text-muted small mb-1">OBSERVAÇÕES GERAIS</label>
            <textarea id="observacao" rows="2" class="form-control form-control-sm"></textarea>
          </div>

          <div class="mb-2">
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
              <h6 class="fw-bold text-dark small mb-0"><i class="fa-solid fa-clock-rotate-left me-1"></i> Histórico de Modificações</h6>
              <button type="button" class="btn btn-sm btn-outline-primary py-0" onclick="addNovaModificacao()"><i class="fa-solid fa-plus me-1"></i> Adicionar</button>
            </div>
            <div id="listaModificacoes" class="d-flex flex-column gap-2 mt-3"></div>
          </div>

        </div>

        <div class="modal-footer bg-light border-0 d-flex justify-content-between">
          <button type="button" id="btnExcluirProposta" class="btn btn-sm btn-danger d-none" onclick="confirmarExclusao()"><i class="fa-solid fa-trash me-1"></i> Excluir</button>
          <div class="d-flex gap-2 ms-auto">
            <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-sm btn-brand fw-bold px-4" onclick="salvarProposta()">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="sucessoModal" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-sm modal-dialog-centered">
      <div class="modal-content erp-modal border-0 shadow-lg">
        <div class="modal-body text-center p-5">
          <i class="fa-solid fa-circle-check fa-4x text-success mb-3 anim-pulse"></i>
          <h5 class="fw-bold text-dark mb-0" id="sucessoTitulo">Concluído!</h5>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="excluirModal" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-sm modal-dialog-centered">
      <div class="modal-content erp-modal border-0 shadow-lg">
        <div class="modal-body text-center p-4">
          <i class="fa-solid fa-circle-exclamation fa-3x text-danger mb-3 anim-pulse"></i>
          <h6 class="fw-bold">Excluir proposta?</h6>
          <p class="text-muted mb-0" style="font-size:0.8rem;">Esta ação é irreversível e removerá todo o histórico de alterações.</p>
        </div>
        <div class="modal-footer bg-light border-0 d-flex flex-nowrap">
          <button type="button" class="btn btn-sm btn-secondary w-100" onclick="voltarParaProposta()">Não</button>
          <button type="button" class="btn btn-sm btn-danger w-100" onclick="executarExclusao()">Sim, Excluir</button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

  <script>
    let periodosCache = [];

    async function fetchSeguro(url, options = {}) {
        const res = await fetch(url, options);
        if (res.status === 401) {
            window.location.href = '/login';
            return null; 
        }
        return res;
    }

    function mostrarSucesso(mensagem) {
        document.getElementById('sucessoTitulo').innerText = mensagem;
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('sucessoModal'));
        modal.show();
        setTimeout(() => { modal.hide(); }, 1500);
    }

    // ==========================================
    // CÁLCULO DE DATAS E DIAS
    // ==========================================
    function parseDataFixa(dataStr) {
        if (!dataStr) return null;
        const partes = dataStr.split('T')[0].split('-');
        return new Date(partes[0], partes[1] - 1, partes[2]);
    }

    function calcularDiasReal(i, f) {
        if (!i || !f) return null;
        const d1 = parseDataFixa(i);
        const d2 = parseDataFixa(f);
        if (d2 >= d1) {
            const diff = d2.getTime() - d1.getTime();
            return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
        }
        return -1; 
    }

    // Badge mantido com lógica original: >2 vermelho, senão verde
    function gerarBadgeDias(dias) {
        if (dias === null) return '<span class="text-muted" style="font-size:0.75rem;"><i class="fa-regular fa-clock me-1"></i>Pendente</span>';
        if (dias === -1) return '<span class="text-danger" style="font-size:0.75rem;">Erro</span>';
        
        if (dias > 2) {
            return \`<span class="text-danger fw-bold" style="font-size:0.75rem;"><i class="fa-solid fa-triangle-exclamation me-1"></i>\${dias} d</span>\`;
        }
        return \`<span class="text-success fw-bold" style="font-size:0.75rem;"><i class="fa-solid fa-check-double me-1"></i>\${dias} d</span>\`;
    }

    function calcularDiferencaDias(idInicio, idFim, idBadge) {
        const i = document.getElementById(idInicio).value;
        const f = document.getElementById(idFim).value;
        const badge = document.getElementById(idBadge);
        
        const dias = calcularDiasReal(i, f);
        
        if (dias === null) {
            badge.innerText = "—";
            badge.className = "form-control form-control-sm bg-white text-center text-muted fw-bold py-1";
        } else if (dias === -1) {
            badge.innerText = "Erro";
            badge.className = "form-control form-control-sm bg-danger-subtle text-danger fw-bold text-center py-1";
        } else {
            badge.innerText = dias + (dias === 1 ? " dia" : " dias");
            if (dias > 2) {
                badge.className = "form-control form-control-sm bg-danger-subtle text-danger fw-bold text-center py-1";
            } else {
                badge.className = "form-control form-control-sm bg-success-subtle text-success fw-bold text-center py-1";
            }
        }
    }

    document.querySelectorAll('.calc-trigger').forEach(input => {
        input.addEventListener('change', () => {
            calcularDiferencaDias('dataInicio', 'dataFim', 'duracaoBadge');
            calcularDiferencaDias('dataSolicitacaoCliche', 'dataChegadaCliche', 'prazoClicheBadge');
        });
    });

    // ==========================================
    // GESTÃO DO HISTÓRICO DE MODIFICAÇÕES
    // ==========================================
    function addNovaModificacao(desc = '', data = '') {
        const container = document.getElementById('listaModificacoes');
        const idUnico = 'mod_' + Date.now();
        const hoje = new Date().toISOString().split('T')[0];
        
        const html = \`
            <div id="\${idUnico}" class="modificacao-item bg-white border p-1 rounded-2 d-flex gap-2 align-items-center">
                <input type="date" class="form-control form-control-sm w-auto mod-data" value="\${data || hoje}" required>
                <input type="text" class="form-control form-control-sm mod-desc" placeholder="Descreva a alteração feita..." value="\${desc}" required>
                <button type="button" class="btn btn-sm btn-light text-danger border" onclick="document.getElementById('\${idUnico}').remove()"><i class="fa-solid fa-xmark"></i></button>
            </div>
        \`;
        container.insertAdjacentHTML('beforeend', html);
    }

    function extrairModificacoes() {
        const mods = [];
        document.querySelectorAll('.modificacao-item').forEach(el => {
            const data = el.querySelector('.mod-data').value;
            const desc = el.querySelector('.mod-desc').value;
            if(desc.trim() !== '') {
                mods.push({ data_modificacao: data, descricao: desc });
            }
        });
        return mods;
    }

    // ==========================================
    // CRUD E RENDERIZAÇÃO DA TABELA 
    // ==========================================
    async function buscarPropostas(page = 1) {
        document.getElementById('loadingPropostas').style.display = 'block';
        document.getElementById('listaPropostas').style.display = 'none';

        const cliente = document.getElementById('filtroCliente').value;
        const inicio = document.getElementById('filtroInicio').value;
        const fim = document.getElementById('filtroFim').value;

        let url = \`/propostas/lista?page=\${page}\`;
        if (cliente) url += \`&cliente=\${cliente}\`;
        if (inicio && fim) url += \`&data_inicio=\${inicio}&data_fim=\${fim}\`;

        try {
            const res = await fetchSeguro(url);
            if (!res) return;
            const json = await res.json();
            
            renderTable(json.data);
            renderPaginacao(json.pagination);
        } catch (error) {
            console.error("Erro ao buscar propostas", error);
        } finally {
            document.getElementById('loadingPropostas').style.display = 'none';
            document.getElementById('listaPropostas').style.display = 'block';
        }
    }

    function renderTable(propostas) {
        const container = document.getElementById('listaPropostas');
        
        if (propostas.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-5"><i class="fa-solid fa-inbox fa-3x mb-3 opacity-25"></i><br>Nenhuma proposta encontrada.</div>';
            return;
        }

        const linhas = propostas.map(p => {
            const diasArte = calcularDiasReal(p.data_inicio, p.data_fim);
            const diasCliche = calcularDiasReal(p.data_solicitacao_cliche, p.data_chegada_cliche);
            
            // Define a cor de fundo da linha: > 2 Permanece Branca | <= 2 Fica Verde
            let rowClass = 'table-hover-row';
            if (diasArte > 2 || diasCliche > 2) {
                // Não adiciona classe = permanece branca
            } else if ((diasArte !== null && diasArte <= 2 && diasArte !== -1) || 
                       (diasCliche !== null && diasCliche <= 2 && diasCliche !== -1)) {
                rowClass += ' table-success-custom';
            }

            const qtdAlt = p.total_modificacoes || 0;
            const modBadge = qtdAlt > 0 
                ? \`<span class="badge bg-danger rounded-pill" style="font-size:0.7rem;" title="\${qtdAlt} alterações registradas">\${qtdAlt}</span>\` 
                : \`<span class="text-muted" style="font-size:0.75rem;">-</span>\`;

            return \`
            <tr style="cursor: pointer;" class="align-middle \${rowClass}" onclick="abrirModalProposta(\${p.id})">
                <td class="py-1 px-2 border-0 border-bottom">
                    <strong class="text-dark d-block text-truncate" style="max-width: 250px; font-size: 0.8rem;">\${p.cliente}</strong>
                </td>
                <td class="py-1 px-2 border-0 border-bottom text-muted" style="font-size: 0.8rem;">
                    <i class="fa-solid fa-user-pen me-1"></i> \${p.designer || '-'}
                </td>
                <td class="py-1 px-2 border-0 border-bottom text-center">
                    \${modBadge}
                </td>
                <td class="py-1 px-2 border-0 border-bottom">
                    <span class="text-muted d-block" style="font-size: 0.65rem;">Produção da Arte:</span>
                    \${gerarBadgeDias(diasArte)}
                </td>
                <td class="py-1 px-2 border-0 border-bottom">
                    <span class="text-muted d-block" style="font-size: 0.65rem;">Logística Clichê:</span>
                    \${gerarBadgeDias(diasCliche)}
                </td>
            </tr>
            \`;
        }).join('');

        container.innerHTML = \`
            <table class="table table-sm align-middle mb-0" style="border-collapse: separate; border-spacing: 0;">
                <thead class="table-light">
                    <tr>
                        <th class="px-2 py-2 text-muted fw-bold border-0" style="font-size:0.75rem;">Cliente</th>
                        <th class="px-2 py-2 text-muted fw-bold border-0" style="font-size:0.75rem;">Designer</th>
                        <th class="px-2 py-2 text-muted fw-bold border-0 text-center" style="font-size:0.75rem;">Alterações</th>
                        <th class="px-2 py-2 text-muted fw-bold border-0" style="font-size:0.75rem;">Tempo de Arte</th>
                        <th class="px-2 py-2 text-muted fw-bold border-0" style="font-size:0.75rem;">Prazo Clichê</th>
                    </tr>
                </thead>
                <tbody class="border-top-0">
                    \${linhas}
                </tbody>
            </table>
        \`;
    }

    // ==========================================
    // PAGINAÇÃO INTELIGENTE
    // ==========================================
    function renderPaginacao(pag) {
        const container = document.getElementById('paginacaoPropostas');
        if (pag.totalPages <= 1) { container.innerHTML = ''; return; }

        let html = '';
        
        html += \`<li class="page-item \${pag.page <= 1 ? 'disabled' : ''}">
                    <button class="page-link text-dark border-0" onclick="buscarPropostas(\${pag.page - 1})">&laquo;</button>
                 </li>\`;
        
        const delta = 2; 
        let paginas = [];
        let ultima;

        for (let i = 1; i <= pag.totalPages; i++) {
            if (i === 1 || i === pag.totalPages || (i >= pag.page - delta && i <= pag.page + delta)) {
                paginas.push(i);
            }
        }

        paginas.forEach(p => {
            if (ultima) {
                if (p - ultima === 2) {
                    html += \`<li class="page-item"><button class="page-link text-dark border-0" onclick="buscarPropostas(\${ultima + 1})">\${ultima + 1}</button></li>\`;
                } else if (p - ultima > 2) {
                    html += \`<li class="page-item disabled"><span class="page-link text-muted border-0 bg-transparent">...</span></li>\`;
                }
            }
            html += \`<li class="page-item \${pag.page === p ? 'active' : ''}">
                        <button class="page-link \${pag.page === p ? 'bg-brand border-brand text-white fw-bold' : 'text-dark border-0'}" onclick="buscarPropostas(\${p})">\${p}</button>
                     </li>\`;
            ultima = p;
        });
        
        html += \`<li class="page-item \${pag.page >= pag.totalPages ? 'disabled' : ''}">
                    <button class="page-link text-dark border-0" onclick="buscarPropostas(\${pag.page + 1})">&raquo;</button>
                 </li>\`;
                 
        container.innerHTML = html;
    }

    function limparFiltros() {
        document.getElementById('filtroCliente').value = '';
        document.getElementById('filtroInicio').value = '';
        document.getElementById('filtroFim').value = '';
        buscarPropostas(1);
    }

    // ==========================================
    // SALVAR / ABRIR / EXCLUIR PROPOSTA
    // ==========================================
    async function abrirModalProposta(id = null) {
        document.getElementById('propostaId').value = '';
        document.getElementById('cliente').value = '';
        document.getElementById('designer').value = '';
        document.getElementById('dataInicio').value = '';
        document.getElementById('dataFim').value = '';
        document.getElementById('dataSolicitacaoCliche').value = '';
        document.getElementById('dataChegadaCliche').value = '';
        document.getElementById('observacao').value = '';
        document.getElementById('listaModificacoes').innerHTML = '';
        document.getElementById('btnExcluirProposta').classList.add('d-none');
        
        calcularDiferencaDias('dataInicio', 'dataFim', 'duracaoBadge');
        calcularDiferencaDias('dataSolicitacaoCliche', 'dataChegadaCliche', 'prazoClicheBadge');

        if (id) {
            try {
                const res = await fetchSeguro(\`/propostas/detalhe/\${id}\`);
                if (!res) return;
                const json = await res.json();
                if(json.success !== false) {
                    const p = json.proposta;
                    document.getElementById('propostaId').value = p.id;
                    document.getElementById('cliente').value = p.cliente;
                    document.getElementById('designer').value = p.designer;
                    if(p.data_inicio) document.getElementById('dataInicio').value = p.data_inicio.split('T')[0];
                    if(p.data_fim) document.getElementById('dataFim').value = p.data_fim.split('T')[0];
                    if(p.data_solicitacao_cliche) document.getElementById('dataSolicitacaoCliche').value = p.data_solicitacao_cliche.split('T')[0];
                    if(p.data_chegada_cliche) document.getElementById('dataChegadaCliche').value = p.data_chegada_cliche.split('T')[0];
                    document.getElementById('observacao').value = p.observacao;
                    document.getElementById('btnExcluirProposta').classList.remove('d-none');

                    json.modificacoes.forEach(m => addNovaModificacao(m.descricao, m.data_modificacao.split('T')[0]));
                    
                    calcularDiferencaDias('dataInicio', 'dataFim', 'duracaoBadge');
                    calcularDiferencaDias('dataSolicitacaoCliche', 'dataChegadaCliche', 'prazoClicheBadge');
                }
            } catch (e) {
                console.error("Erro ao carregar", e);
            }
        }

        new bootstrap.Modal(document.getElementById('modalProposta')).show();
    }

    async function salvarProposta() {
        const id = document.getElementById('propostaId').value;
        const payload = {
            cliente: document.getElementById('cliente').value,
            designer: document.getElementById('designer').value,
            data_inicio: document.getElementById('dataInicio').value,
            data_fim: document.getElementById('dataFim').value,
            data_solicitacao_cliche: document.getElementById('dataSolicitacaoCliche').value,
            data_chegada_cliche: document.getElementById('dataChegadaCliche').value,
            observacao: document.getElementById('observacao').value,
            modificacoes: extrairModificacoes()
        };

        if(!payload.cliente) return alert('O nome do cliente é obrigatório!');

        const method = id ? 'PUT' : 'POST';
        const url = id ? \`/propostas/\${id}\` : '/propostas';

        try {
            const res = await fetchSeguro(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if(!res) return;
            const json = await res.json();
            
            if(json.success) {
                bootstrap.Modal.getInstance(document.getElementById('modalProposta')).hide();
                mostrarSucesso('Proposta Salva!');
                buscarPropostas();
            } else {
                alert('Erro ao guardar proposta.');
            }
        } catch (e) {
            console.error(e);
            alert('Erro de comunicação com o servidor.');
        }
    }

    function confirmarExclusao() {
        bootstrap.Modal.getInstance(document.getElementById('modalProposta')).hide();
        new bootstrap.Modal(document.getElementById('excluirModal')).show();
    }

    function voltarParaProposta() {
        bootstrap.Modal.getInstance(document.getElementById('excluirModal')).hide();
        new bootstrap.Modal(document.getElementById('modalProposta')).show();
    }

    async function executarExclusao() {
        const id = document.getElementById('propostaId').value;
        
        try {
            const res = await fetchSeguro(\`/propostas/\${id}\`, { method: 'DELETE' });
            if(!res) return;
            
            bootstrap.Modal.getInstance(document.getElementById('excluirModal')).hide();
            mostrarSucesso('Proposta Excluída!');
            buscarPropostas();
        } catch(e) {
            console.error(e);
        }
    }

    // ==========================================
    // EXPORTAÇÃO EXCEL
    // ==========================================
    async function abrirModalRelatorio() {
        const anoSelect = document.getElementById('relatorioAno');
        const mesSelect = document.getElementById('relatorioMes');
        
        try {
            const res = await fetchSeguro('/admin/api/periodos-disponiveis');
            if(!res) return;
            periodosCache = await res.json();
            
            if (periodosCache.length === 0) {
                anoSelect.innerHTML = '<option value="">Sem dados</option>';
                mesSelect.innerHTML = '<option value="">Sem dados</option>';
            } else {
                const anos = [...new Set(periodosCache.map(p => p.ano))];
                anoSelect.innerHTML = anos.map(a => \`<option value="\${a}">\${a}</option>\`).join('');
                
                anoSelect.onchange = () => {
                    const anoAtual = parseInt(anoSelect.value);
                    const meses = periodosCache.filter(p => p.ano === anoAtual).map(p => p.mes);
                    const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                    mesSelect.innerHTML = meses.map(m => \`<option value="\${m}">\${nomes[m-1]}</option>\`).join('');
                };
                anoSelect.onchange(); 
            }
        } catch(e) { console.error(e); }
        
        new bootstrap.Modal(document.getElementById('modalRelatorio')).show();
    }

    function baixarRelatorioExcel() {
        const mes = document.getElementById('relatorioMes').value;
        const ano = document.getElementById('relatorioAno').value;
        if(mes && ano) {
            window.open(\`/propostas/exportar/excel?mes=\${mes}&ano=\${ano}\`, '_blank');
            bootstrap.Modal.getInstance(document.getElementById('modalRelatorio')).hide();
        }
    }

    window.addEventListener('load', () => buscarPropostas());
  </script>
</body>
</html>
  `;
}