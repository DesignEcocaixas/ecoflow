// views/ordemProducaoView.js
const menuLateral = require("./menuLateral");

module.exports = function ordemProducaoView(usuario, rotativa = [], flexo = [], query = {}, rotativaNovas = 0, flexoNovas = 0, historico = [], paginacao = {}) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const menuHTML = menuLateral(user, "/producao");

  function formatarCor(cor) {
    if (!cor || cor === 'N/D') return 'Não definida';
    return cor.replace(/personalização/i, '').trim();
  }

  const badgeStatus = status =>
    status === 'concluido'
      ? '<span class="badge bg-success-subtle text-success border border-success-subtle">Concluído</span>'
      : '<span class="badge bg-light text-muted border">Pendente</span>';

  // Lógica de Paginação Inteligente
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;
  const pageLinks = (() => {
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
          html += `<li class="page-item"><a class="page-link text-dark" href="/producao?page=${ultima + 1}">${ultima + 1}</a></li>`;
        } else if (p - ultima > 2) {
          html += `<li class="page-item disabled"><span class="page-link text-muted border-0 bg-transparent">...</span></li>`;
        }
      }
      html += `<li class="page-item ${p === page ? "active" : ""}"><a class="page-link ${p === page ? "fw-bold text-dark" : "text-dark"}" href="/producao?page=${p}">${p}</a></li>`;
      ultima = p;
    });

    return html;
  })();

  const paginacaoHtml = totalPages > 1 ? `
    <nav aria-label="Paginação" class="mt-3">
      <ul class="pagination pagination-sm justify-content-center mb-0">
        <li class="page-item ${page <= 1 ? "disabled" : ""}">
          <a class="page-link text-dark" href="/producao?page=${page - 1}">&laquo;</a>
        </li>
        ${pageLinks}
        <li class="page-item ${page >= totalPages ? "disabled" : ""}">
          <a class="page-link text-dark" href="/producao?page=${page + 1}">&raquo;</a>
        </li>
      </ul>
    </nav>
  ` : "";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Produção | ERP Ecoflow</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { display: flex; height: 100vh; margin: 0; background-color: #f4f7f6; font-family: 'Roboto', sans-serif; }
    .sidebar { width: 240px; background-color: #0D5749; color: white; padding: 20px; display: flex; flex-direction: column; }
    .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s; }
    .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
    .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; }
    .usuario-badge { background-color: white; color: #0D5749; padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(13,87,73,0.2); font-size: 0.85rem; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    
    .erp-card { border-radius: 12px; transition: transform 0.2s; overflow: hidden; border: none; cursor: pointer; }
    .erp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.05) !important; }
    .card-concluido { background-color: #f0fff4 !important; border-left: 5px solid #28a745 !important; }
    .card-pendente { border-left: 5px solid #6c757d !important; border-bottom: 1px solid #eee; }
    .info-sm { font-size: 0.8rem; }
    
    .progress { height: 16px; border-radius: 10px; background-color: #eee; overflow: hidden; }
    .progress-bar { background-color: #0D5749; transition: width 0.4s ease; }

    /* ANIMAÇÃO DE ENTRADA E SAÍDA DO TOAST */
      .toast {
          transform: translateX(120%); /* Mantém o toast escondido fora da tela */
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important;
      }
      .toast.showing, .toast.show {
          transform: translateX(0); /* Desliza para dentro da tela */
      }

      /* ANIMAÇÃO DE ENTRADA E SAÍDA DOS MODAIS */
      .modal.fade .modal-dialog {
          transform: scale(0.85) translateY(30px); /* Começa menor e mais abaixo */
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
      }
      .modal.show .modal-dialog {
          transform: scale(1) translateY(0); /* Cresce e encaixa na posição original */
      }
    
    /* CSS DAS BARRAS DE TEMPO ANIMADAS DOS TOASTS */
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

    /* SKELETON LOADING */
    .skeleton-view {
        background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
        background-size: 200% 100%;
        animation: skeleton-loading-view 1.5s infinite linear;
        border-radius: 4px;
    }
    .skeleton-text-view { height: 16px; width: 100%; margin-bottom: 8px; }
    .skeleton-btn-view { height: 26px; width: 32px; border-radius: 4px; display: inline-block; }
    @keyframes skeleton-loading-view {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    /* Divisória apenas no desktop */
    @media (min-width: 992px) {
      .border-lg-end { border-right: 1px solid #e9ecef; }
    }
    
    /* Estilos do Histórico */
    .table-hover tbody tr:hover { background-color: rgba(13, 87, 73, 0.05); }
    .pagination .page-link { color: #0D5749; border: none; background: transparent; font-weight: 600; }
    .pagination .page-item.active .page-link { background-color: #0D5749; color: white; border-radius: 6px; }

    /* Botão Flutuante de Ajuda */
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
  </style>
</head>
<body>

  <div class="sidebar d-none d-md-flex">
    <div class="text-center mb-4 mt-2"><img src="/img/logo-branca.png" class="img-fluid" style="max-width:130px;"></div>
    <div class="flex-grow-1">${menuHTML}</div>
  </div>

  <div class="content">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-industry text-muted me-2"></i>Ordens de Produção</h4>
    </div>

    <div class="bg-white p-4 rounded-3 shadow-sm mb-4 border border-light">
      <div class="row g-4 align-items-center">
        
        <div class="col-lg-6 border-lg-end pe-lg-4">
          <h6 class="text-muted fw-bold small mb-3">IMPORTAR PLANILHA EXCEL</h6>
          <form action="/importar" method="POST" enctype="multipart/form-data" class="row g-2 align-items-end" id="formImportacao">
            <div class="col-12 col-xl-8">
              <input type="file" name="planilha" accept=".xlsx,.xls" class="form-control form-control-sm shadow-sm" required>
            </div>
            <div class="col-12 col-xl-4 d-flex gap-2">
              <button type="submit" class="btn btn-sm btn-primary flex-grow-1 shadow-sm">Gerar Ordens</button>
              <button type="button" class="btn btn-sm btn-outline-danger shadow-sm" data-bs-toggle="modal" data-bs-target="#modalLimpar" title="Limpar Tudo"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </form>
        </div>

        <div class="col-lg-6 ps-lg-4">
          <h6 class="text-muted fw-bold small mb-3">ACOMPANHAMENTO DA PRODUÇÃO</h6>
          <div class="row g-3">
            
            <div class="col-sm-6">
              <button class="btn btn-outline-primary w-100 py-3 position-relative fw-bold shadow-sm d-flex flex-column align-items-center justify-content-center"
                      data-bs-toggle="modal"
                      data-bs-target="#modalRotativa"
                      onclick="marcarVisualizado('rotativa', this)">
                <div class="d-flex align-items-center">
                  <i class="fa-solid fa-gear me-2"></i> Rotativa / Plana
                  <span class="badge bg-primary ms-2">${rotativa.length}</span>
                </div>
                ${rotativaNovas > 0 ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">${rotativaNovas}</span>` : ''}
              </button>
            </div>

            <div class="col-sm-6">
              <button class="btn btn-outline-success w-100 py-3 position-relative fw-bold shadow-sm d-flex flex-column align-items-center justify-content-center"
                      data-bs-toggle="modal"
                      data-bs-target="#modalFlexo"
                      onclick="marcarVisualizado('flexografica', this)">
                <div class="d-flex align-items-center">
                  <i class="fa-solid fa-layer-group me-2"></i> Flexográfica
                  <span class="badge bg-success ms-2">${flexo.length}</span>
                </div>
                ${flexoNovas > 0 ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">${flexoNovas}</span>` : ''}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>

    <div class="bg-white p-4 rounded-3 shadow-sm border border-light">
      <h6 class="text-muted fw-bold small mb-3"><i class="fa-solid fa-clock-rotate-left me-2"></i>HISTÓRICO DE IMPORTAÇÕES GERADAS</h6>
      
      <div class="table-responsive">
        <table class="table table-hover align-middle border mb-0" style="font-size: 0.9rem;">
          <thead class="table-light">
            <tr>
              <th>Data de Geração das Ordens</th>
              <th class="text-center">Ordens Geradas Neste Dia</th>
              <th class="text-end">Ação</th>
            </tr>
          </thead>
          <tbody>
            ${historico.length === 0 ? '<tr><td colspan="3" class="text-center text-muted py-4"><i class="fa-solid fa-inbox fa-2x d-block mb-2 opacity-25"></i>Nenhum histórico encontrado.</td></tr>' : historico.map(h => `
              <tr style="cursor: pointer;" onclick="window.open('/exportar/historico?lote=${h.lote_id}', '_blank')" title="Clique para baixar esta geração específica">
                <td class="fw-bold text-dark"><i class="fa-regular fa-clock text-muted me-2"></i> ${h.data_formatada}</td>
                <td class="text-center text-muted">${h.total_pedidos} registros nesta geração</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light border text-success fw-bold shadow-sm"><i class="fa-solid fa-download me-1"></i> Histórico</button>
                </td>
                </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      ${paginacaoHtml}
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

  <button class="btn-flutuante" data-bs-toggle="modal" data-bs-target="#modalInstrucoes" title="Ajuda / Como usar">
    <i class="fa-solid fa-question"></i>
  </button>

  <div class="modal fade" id="modalInstrucoes" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-light border-0">
          <h5 class="modal-title fw-bold text-dark"><i class="fa-solid fa-circle-info text-primary me-2"></i> Como usar este módulo</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4 text-muted" style="font-size: 0.95rem;">
          <p class="mb-4">Bem-vindo ao módulo de <strong>Ordens de Produção</strong>. Siga os passos abaixo para o funcionamento correto do sistema:</p>
          
          <ul class="list-group list-group-flush mb-4">
            <li class="list-group-item bg-transparent px-0 border-light pb-3">
              <strong class="text-dark d-block mb-1"><i class="fa-solid fa-file-excel text-success me-2"></i> 1. Importar Planilha</strong>
              Selecione o seu ficheiro Excel (.xlsx) de ordens e clique em "Gerar Ordens". O sistema vai analisar e separar tudo automaticamente em "Rotativa / Plana" e "Flexográfica". <em>Nota: Importar uma nova planilha arquiva automaticamente a anterior no Histórico.</em>
            </li>
            <li class="list-group-item bg-transparent px-0 border-light py-3">
              <strong class="text-dark d-block mb-1"><i class="fa-solid fa-bars-progress text-primary me-2"></i> 2. Acompanhamento & Status</strong>
              Abra os painéis (Rotativa ou Flexográfica). Pode clicar diretamente em qualquer cartão para alterar o estado do pedido entre <span class="badge bg-light text-muted border">Pendente</span> e <span class="badge bg-success-subtle text-success border border-success-subtle">Concluído</span>.
            </li>
            <li class="list-group-item bg-transparent px-0 border-light py-3">
              <strong class="text-dark d-block mb-1"><i class="fa-solid fa-download text-dark me-2"></i> 3. Exportar Planilhas</strong>
              Dentro dos modais de produção, o botão "Baixar Todas" faz o download do que está visível naquele exato momento.
            </li>
            <li class="list-group-item bg-transparent px-0 border-light py-3">
              <strong class="text-dark d-block mb-1"><i class="fa-solid fa-clock-rotate-left text-secondary me-2"></i> 4. Histórico de Importações</strong>
              No final da página, todas as gerações passadas (Lotes) ficam salvas. Clicar em qualquer linha baixa o relatório com os dados exatos daquele momento.
            </li>
            <li class="list-group-item bg-transparent px-0 border-light pt-3">
              <strong class="text-dark d-block mb-1"><i class="fa-solid fa-trash-can text-danger me-2"></i> 5. Limpar Tudo</strong>
              Remove as ordens atuais do ecrã e transfere-as para o painel de Histórico, deixando o sistema em branco para o próximo turno/semana.
            </li>
          </ul>

          <div class="alert alert-info border-0 shadow-sm mb-0">
            <i class="fa-solid fa-lightbulb me-2"></i> <strong>Dica de Pesquisa:</strong> Utilize as barras de pesquisa dentro dos modais para filtrar instantaneamente por Cliente, Vendedor, Modelo ou Status (digite "concluído").
          </div>
        </div>
        <div class="modal-footer border-0 bg-light">
          <button type="button" class="btn btn-primary px-4 fw-bold shadow-sm" data-bs-dismiss="modal">Entendi</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalRotativa" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-light border-0">
          <h5 class="modal-title fw-bold text-dark"><i class="fa-solid fa-gear text-primary me-2"></i> Produção Rotativa / Plana</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-3 p-md-4 bg-light-subtle">
          
          <div class="d-flex flex-column flex-sm-row gap-2 mb-4">
            <div class="input-group flex-fill shadow-sm">
              <input type="text" class="form-control bg-white" placeholder="Buscar por cliente, vendedor, modelo..." oninput="filtrarCards(this, 'rotativa')" id="buscaRotativa">
              <button class="btn btn-white border bg-white text-secondary" type="button" onclick="limparBusca('rotativa')" title="Limpar busca"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <a href="/exportar/rotativa" target="_blank" class="btn btn-success fw-bold text-nowrap shadow-sm"><i class="fa-solid fa-file-excel me-1"></i> Baixar Todas</a>
          </div>

          <div style="padding-right: 5px;">
            ${rotativa.length === 0 ? '<div class="text-center py-5 text-muted small"><i class="fa-solid fa-inbox fa-2x d-block mb-2 opacity-25"></i>Nenhuma ordem carregada</div>' : rotativa.map(r => `
              <div class="card erp-card shadow-sm mb-2 ${r.status_producao === 'concluido' ? 'card-concluido' : 'card-pendente'}" 
                   onclick="alterarStatus('rotativa', ${r.id}, this)"
                   data-search="${r.cliente} ${r.vendedor} ${r.modelo} ${r.tamanho} ${r.status_producao === 'concluido' ? 'concluído' : 'pendente'}">
                <div class="card-body p-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <strong class="d-block text-dark">${r.cliente}</strong>
                      <div class="info-sm text-muted mt-1">
                        Mod: ${r.modelo} | Tam: ${r.tamanho} | <b>Qtd: ${r.quantidade}</b>
                      </div>
                    </div>
                    ${badgeStatus(r.status_producao)}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalFlexo" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-light border-0">
          <h5 class="modal-title fw-bold text-dark"><i class="fa-solid fa-layer-group text-success me-2"></i> Produção Flexográfica</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-3 p-md-4 bg-light-subtle">
          
          <div class="d-flex flex-column flex-sm-row gap-2 mb-4">
            <div class="input-group flex-fill shadow-sm">
              <input type="text" class="form-control bg-white" placeholder="Buscar por cliente, modelo, cor..." oninput="filtrarCards(this, 'flexo')" id="buscaFlexo">
              <button class="btn btn-white border bg-white text-secondary" type="button" onclick="limparBusca('flexo')" title="Limpar busca"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <a href="/exportar/flexografica" target="_blank" class="btn btn-success fw-bold text-nowrap shadow-sm"><i class="fa-solid fa-file-excel me-1"></i> Baixar Todas</a>
          </div>

          <div style="padding-right: 5px;">
            ${flexo.length === 0 ? '<div class="text-center py-5 text-muted small"><i class="fa-solid fa-inbox fa-2x d-block mb-2 opacity-25"></i>Nenhuma ordem carregada</div>' : flexo.map(f => `
              <div class="card erp-card shadow-sm mb-2 ${f.status_producao === 'concluido' ? 'card-concluido' : 'card-pendente'}" 
                   onclick="alterarStatus('flexografica', ${f.id}, this)"
                   data-search="${f.cliente} ${f.vendedor} ${f.modelo} ${f.tamanho} ${f.material} ${f.cor_personalizacao} ${f.status_producao === 'concluido' ? 'concluído' : 'pendente'}">
                <div class="card-body p-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <strong class="d-block text-dark">${f.cliente}</strong>
                      <div class="info-sm text-muted mt-1">
                        Mat: ${f.material} | Cor: ${formatarCor(f.cor_personalizacao)} | <b>Qtd: ${f.quantidade}</b>
                      </div>
                    </div>
                    ${badgeStatus(f.status_producao)}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalLimpar" tabindex="-1">
    <div class="modal-dialog modal-sm modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-body text-center p-4">
          <i class="fa-solid fa-trash-can fa-3x text-danger mb-3"></i>
          <h6 class="fw-bold">Limpar tudo?</h6>
          <p class="text-muted small">Esta ação removerá todas as ordens permanentemente.</p>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-secondary flex-grow-1" data-bs-dismiss="modal">Não</button>
            <form action="/limpar" method="POST" class="flex-grow-1 m-0"><button type="submit" class="btn btn-sm btn-danger w-100">Sim, Limpar</button></form>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalProcessamento" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-body p-5 text-center">
          <i class="fa-solid fa-gear fa-spin fa-3x text-primary mb-4"></i>
          <h5 class="fw-bold mb-2">Processando Planilha</h5>
          <p id="textoEtapa" class="text-muted small mb-4">Iniciando leitura dos dados...</p>
          <div class="progress">
            <div id="barraProgresso" class="progress-bar progress-bar-striped progress-bar-animated fw-bold" style="width: 0%; font-size: 0.75rem;">0%</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalSugestaoDownload" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content erp-modal border-0 shadow-lg">
        <div class="modal-header bg-white border-0 pb-0 pt-4 px-4">
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body text-center p-5 pt-2">
          <div class="mb-4">
             <div class="d-inline-flex align-items-center justify-content-center bg-light rounded-circle shadow-sm" style="width: 80px; height: 80px; border: 1px solid #e9ecef;">
                 <i class="fa-solid fa-file-excel fa-2x" style="color: #0D5749;"></i>
             </div>
          </div>
          <h5 class="fw-bold text-dark mb-3">Ordens Geradas com Sucesso</h5>
          <p class="text-muted mb-4" style="font-size:0.9rem; line-height: 1.5;">A planilha foi processada e as ordens separadas. Deseja baixar os relatórios de produção agora?</p>
          <div class="d-flex flex-column gap-2 mt-2">
             <a href="/exportar/rotativa" target="_blank" class="btn fw-bold shadow-sm" style="background-color: #0D5749; color: white;" onclick="bootstrap.Modal.getInstance(document.getElementById('modalSugestaoDownload')).hide();">
                 <i class="fa-solid fa-gear me-1"></i> Baixar Rotativa / Plana
             </a>
             <a href="/exportar/flexografica" target="_blank" class="btn fw-bold shadow-sm" style="background-color: #198754; color: white;" onclick="bootstrap.Modal.getInstance(document.getElementById('modalSugestaoDownload')).hide();">
                 <i class="fa-solid fa-layer-group me-1"></i> Baixar Flexográfica
             </a>
             <button type="button" class="btn btn-light border text-muted fw-bold mt-2" data-bs-dismiss="modal">
                 Agora Não
             </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    // =======================================================================
    // SKELETON LOADING
    // =======================================================================
    function gerarSkeletonTabela(quantidade = 3) {
        let html = '';
        for(let i=0; i<quantidade; i++) {
            html += \`
            <tr class="align-middle">
                <td class="py-3 px-3"><div class="skeleton-view skeleton-text-view" style="width: 60%; margin: 0;"></div></td>
                <td class="text-center py-3 px-3"><div class="skeleton-view skeleton-text-view" style="width: 50%; margin: 0 auto;"></div></td>
                <td class="text-end py-3 px-3 d-flex justify-content-end gap-1"><div class="skeleton-view skeleton-btn-view" style="width: 80px;"></div></td>
            </tr>\`;
        }
        return html;
    }

    function mostrarSkeletonGlobais() {
        const tableContainer = document.querySelector('.content > .bg-white .table-responsive');
        
        if (document.getElementById('skeleton-temp-container')) return;

        const skeletonHTML = \`
        <div id="skeleton-temp-container" class="table-responsive skeleton-container">
            <table class="table table-hover align-middle border mb-0" style="font-size: 0.9rem;">
               <thead class="table-light">
                 <tr>
                   <th>Data de Geração das Ordens</th>
                   <th class="text-center">Ordens Geradas Neste Dia</th>
                   <th class="text-end">Ação</th>
                 </tr>
               </thead>
               <tbody>
                  \${gerarSkeletonTabela(3)}
               </tbody>
            </table>
        </div>\`;

        if (tableContainer && !tableContainer.classList.contains('skeleton-container')) {
            tableContainer.style.display = 'none';
            tableContainer.insertAdjacentHTML('beforebegin', skeletonHTML);
        }
    }

    function ocultarSkeletonGlobais() {
        const tempSkeleton = document.getElementById('skeleton-temp-container');
        if (tempSkeleton) tempSkeleton.remove();

        const tableContainer = document.querySelector('.content > .bg-white .table-responsive:not(.skeleton-container)');
        if (tableContainer) tableContainer.style.display = '';
    }

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
    // FUNÇÕES DA VIEW
    // =======================================================================
    function mostrarToast(tipo, titulo, mensagem) {
        const toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
        if (toastEl) {
            document.getElementById(tipo === 'sucesso' ? 'sucessoTitulo' : 'erroTitulo').innerText = titulo;
            document.getElementById(tipo === 'sucesso' ? 'sucessoSub' : 'erroSub').innerText = mensagem;
            
            toastEl.setAttribute('data-bs-autohide', 'true');
            toastEl.setAttribute('data-bs-delay', '5000');
            
            const timerEl = document.getElementById(tipo === 'sucesso' ? 'sucessoTimer' : 'erroTimer');
            if (timerEl) {
                timerEl.style.display = 'block';
                timerEl.style.animation = 'none';
                timerEl.offsetHeight; 
                timerEl.style.animation = 'shrinkToast 5s linear forwards';
            }

            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }
    }

    window.addEventListener('load', () => {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('sucesso')) {
            mostrarToast('sucesso', 'Importação Concluída', 'As ordens foram geradas com sucesso.');
            const modalImp = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalSugestaoDownload'));
            modalImp.show();
        } else if (urlParams.has('limpo')) {
            mostrarToast('sucesso', 'Painel Limpo', 'Todos os dados foram removidos.');
        } else if (urlParams.has('erro')) {
            mostrarToast('erro', 'Erro na Planilha', 'O arquivo enviado é incompatível ou está corrompido.');
        }
        
        if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('sucesso');
            url.searchParams.delete('limpo');
            url.searchParams.delete('erro');
            window.history.replaceState({}, document.title, url.toString());
        }
    });

    const formImportar = document.getElementById('formImportacao');
    if (formImportar) {
        formImportar.addEventListener('submit', () => {
            const modalProc = new bootstrap.Modal(document.getElementById('modalProcessamento'));
            modalProc.show();

            const barra = document.getElementById('barraProgresso');
            const texto = document.getElementById('textoEtapa');
            
            barra.style.width = '0%';
            barra.innerText = '0%';

            const etapas = [
                { v: 30, t: "Limpando registros antigos..." },
                { v: 60, t: "Executando script de processamento Python..." },
                { v: 90, t: "Separando flexo e rotativa/plana..." },
                { v: 98, t: "Finalizando importação..." }
            ];

            let i = 0;
            const interval = setInterval(() => {
                if (i >= etapas.length) {
                    clearInterval(interval);
                    return;
                }
                barra.style.width = etapas[i].v + "%";
                barra.innerText = etapas[i].v + "%";
                texto.innerText = etapas[i].t;
                i++;
            }, 1200);
        });
    }

    function alterarStatus(tipo, id, card) {
      fetch(\`/status/\${tipo}/\${id}\`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (!data.success) return;
          const badge = card.querySelector('.badge');
          if (data.status === 'concluido') {
            badge.className = 'badge bg-success-subtle text-success border border-success-subtle';
            badge.innerText = 'Concluído';
            card.classList.add('card-concluido');
            card.classList.remove('card-pendente');
          } else {
            badge.className = 'badge bg-light text-muted border';
            badge.innerText = 'Pendente';
            card.classList.remove('card-concluido');
            card.classList.add('card-pendente');
          }
          
          let search = card.dataset.search || '';
          search = search.replace(/pendente|concluido|concluído/gi, '').trim();
          const novoStatus = data.status === 'concluido' ? 'concluído' : 'pendente';
          card.dataset.search = \`\${search} \${novoStatus}\`;
        });
    }

    function marcarVisualizado(tipo, botao) {
      const badge = botao.querySelector('.bg-danger');
      if (!badge) return; 
      
      fetch(\`/notificacao/\${tipo}\`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.success) badge.remove();
        })
        .catch(err => console.error(err));
    }

    function normalizarTexto(texto) {
      return texto.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    }

    function filtrarCards(input, tipo) {
      const termo = normalizarTexto(input.value);
      const modalId = tipo === 'rotativa' ? 'modalRotativa' : 'modalFlexo';
      const modal = document.getElementById(modalId);
      const cards = modal.querySelectorAll('.card');

      cards.forEach(card => {
        const texto = normalizarTexto(card.dataset.search || '');
        card.style.display = texto.includes(termo) ? '' : 'none';
      });
    }

    function limparBusca(tipo) {
      const inputId = tipo === 'rotativa' ? 'buscaRotativa' : 'buscaFlexo';
      const input = document.getElementById(inputId);
      input.value = '';
      filtrarCards(input, tipo);
    }
  </script>
</body>
</html>
`;
};