// views/entradasSaidasView.js
const menuLateral = require("./menuLateral");

function entradasSaidasView(usuario, movimentacoes = [], paginacao = {}, filtros = {}) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  const fmtMoeda = (n) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const fmtData = (d) => {
    try {
      const dt = new Date(d);
      const userTimezoneOffset = dt.getTimezoneOffset() * 60000;
      return new Date(dt.getTime() + userTimezoneOffset).toLocaleDateString("pt-BR");
    } catch {
      return d || "-";
    }
  };

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dataAtual = new Date();
  const mesAtualStr = meses[dataAtual.getMonth()] + ' de ' + dataAtual.getFullYear();

  // =======================================================================
  // VALORES EXATOS VINDO DO BACKEND (Sem limite de paginação)
  // =======================================================================
  const totalEntradas = paginacao.totalEntradas || 0;
  const totalSaidas = paginacao.totalSaidas || 0;
  const totalCaixaCalc = paginacao.totalCaixa || 0;

  // Se o caixa for menor que 0, trava em 0 na exibição
  const displayTotalCaixa = totalCaixaCalc < 0 ? 0 : totalCaixaCalc;
  const corTotal = displayTotalCaixa > 0 ? 'accent' : 'secondary';
  const sinalTotal = displayTotalCaixa > 0 ? '+' : '';

  // GERAR AS LINHAS DA TABELA
  const linhasTabela = movimentacoes.map(m => {
    const isEntrada = m.tipo === 'entrada';
    const corClass = isEntrada ? 'success' : 'danger';
    const sinal = isEntrada ? '+' : '-';
    const icone = isEntrada ? 'fa-arrow-down' : 'fa-arrow-up';

    return `
    <tr style="cursor: pointer;" class="align-middle table-hover-row" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('detalheModal${m.id}')).show();">
      <td class="text-white-50 fw-medium py-2 px-3"><i class="fa-regular fa-calendar me-1"></i> ${fmtData(m.data)}</td>
      <td class="py-2 px-3">
        <span class="badge bg-${corClass} bg-opacity-10 text-${corClass} border border-${corClass} border-opacity-50 px-2 py-1" style="width: 85px; display: inline-block; text-align: center;">
          <i class="fa-solid ${icone} me-1"></i> ${isEntrada ? 'Entrada' : 'Saída'}
        </span>
      </td>
      <td class="py-2 px-3">
        <div class="text-truncate text-white fw-medium" style="max-width: 250px;" title="${m.descricao}">
          ${m.descricao || "Sem descrição"}
        </div>
      </td>
      <td class="py-2 px-3">
        <div class="text-truncate text-white-50" style="max-width: 200px;" title="Assinante: ${m.nome_assinante || 'Não informado'}">
          <i class="fa-solid fa-pen-nib text-accent me-1"></i> ${m.nome_assinante || 'Não informado'}
        </div>
      </td>
      <td class="text-end fw-bold text-${corClass} py-2 px-3">
         ${sinal} R$ ${fmtMoeda(m.valor)}
      </td>
      <td class="text-center py-2 px-3">
        <div class="btn-group">
          <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-warning py-1 px-2 shadow-sm" 
                  onclick="event.stopPropagation(); bootstrap.Modal.getOrCreateInstance(document.getElementById('editarModal${m.id}')).show();" title="Editar">
            <i class="fa-solid fa-pen" style="font-size:0.75rem;"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger py-1 px-2 shadow-sm ms-1" 
                  onclick="event.stopPropagation(); bootstrap.Modal.getOrCreateInstance(document.getElementById('excluirModal${m.id}')).show();" title="Excluir">
            <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
          </button>
        </div>
      </td>
    </tr>
    `;
  }).join("");

  const modais = movimentacoes.map(m => {
    const isEntrada = m.tipo === 'entrada';
    const corClass = isEntrada ? 'success' : 'danger';
    const sinal = isEntrada ? '+' : '-';

    return `
    <div class="modal fade" id="detalheModal${m.id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content erp-modal shadow-lg border-0 bg-custom-darker">
          <div class="modal-header modal-header-dark border-custom">
            <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-money-bill-transfer text-accent me-2"></i> Detalhes da Movimentação</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            <div class="text-center mb-4">
              <span class="badge bg-${corClass} bg-opacity-10 text-${corClass} border border-${corClass} border-opacity-50 mb-2 px-3 py-2" style="font-size:0.8rem; letter-spacing: 1px;">
                MOVIMENTAÇÃO DE ${isEntrada ? 'ENTRADA' : 'SAÍDA'}
              </span>
              <h2 class="fw-bold text-${corClass}">${sinal} R$ ${fmtMoeda(m.valor)}</h2>
              <p class="text-white-50 mb-0"><i class="fa-regular fa-calendar me-1"></i> ${fmtData(m.data)}</p>
            </div>
            
            <div class="bg-custom-darker p-3 rounded-3 mb-3 border border-custom shadow-sm">
              <h6 class="fw-bold text-white" style="font-size:0.85rem;">Descrição:</h6>
              <p class="mb-2 text-white-50" style="font-size:0.85rem;">${m.descricao}</p>
              
              <h6 class="fw-bold mt-3 text-white" style="font-size:0.85rem;">Observações:</h6>
              <p class="mb-0 text-white-50" style="font-size:0.8rem;">${m.observacao || "Nenhuma observação registada."}</p>
              
              <h6 class="fw-bold mt-3 text-white" style="font-size:0.85rem;">Registrado no sistema por:</h6>
              <p class="mb-0 text-white-50" style="font-size:0.8rem;"><i class="fa-solid fa-desktop text-accent me-1"></i> ${m.responsavel || "Sistema"}</p>
            </div>

            <div class="border border-custom rounded-3 p-3 text-center bg-custom-darker shadow-sm">
              <h6 class="fw-bold text-white mb-2" style="font-size:0.85rem;">Assinatura de: ${m.nome_assinante || "Não informado"}</h6>
              ${m.assinatura_base64 
                ? `<img src="${m.assinatura_base64}" alt="Assinatura" style="max-width: 100%; height: auto; max-height: 150px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; filter: invert(1) brightness(2);">` 
                : `<div class="text-muted py-3" style="font-size:0.8rem;"><i class="fa-solid fa-signature fa-2x opacity-25 mb-2"></i><br>Nenhuma assinatura capturada.</div>`
              }
            </div>

          </div>
          <div class="modal-footer modal-footer-dark border-custom d-flex flex-nowrap gap-2">
             ${!isEntrada ? `<a href="/movimentacoes/comprovante/${m.id}" target="_blank" class="btn btn-sm btn-outline-danger w-100 fw-bold"><i class="fa-solid fa-file-pdf me-1"></i> Comprovante</a>` : ''}
             <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Fechar Detalhes</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="editarModal${m.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form method="POST" action="/movimentacoes/editar/${m.id}" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Registo Atualizado!')">
          <div class="modal-header modal-header-dark border-custom">
            <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-pen-to-square text-warning me-2"></i> Editar Registo</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.8rem;">Data</label>
                <input type="date" name="data" class="form-control form-control-sm shadow-sm" value="${String(m.data).slice(0,10)}" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.8rem;">Valor (R$)</label>
                <input type="text" name="valor" class="form-control form-control-sm mask-moeda shadow-sm" oninput="maskMoeda(this)" value="${fmtMoeda(m.valor)}" required>
              </div>
              <div class="col-12">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.8rem;">Nome de quem ${isEntrada ? 'entregou' : 'retirou'}</label>
                <input type="text" name="nome_assinante" class="form-control form-control-sm shadow-sm" value="${m.nome_assinante || ""}" required placeholder="Nome do assinante">
              </div>
              <div class="col-12">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.8rem;">Descrição</label>
                <input type="text" name="descricao" class="form-control form-control-sm shadow-sm" value="${m.descricao}" required>
              </div>
              <div class="col-12">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.8rem;">Observações</label>
                <textarea name="observacao" class="form-control form-control-sm shadow-sm" rows="2">${m.observacao || ""}</textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer modal-footer-dark border-custom d-flex flex-nowrap">
             <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
             <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm text-dark"><i class="fa-solid fa-save me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${m.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <form method="POST" action="/movimentacoes/excluir/${m.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Registo Excluído!')">
            <div class="modal-body text-center p-4 bg-custom-darker">
              <i class="fa-solid fa-circle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="fw-bold text-white mb-2" style="font-size: 0.9rem;">Excluir este registo?</h6>
              <p class="text-muted mb-0" style="font-size:0.8rem;">Esta ação é irreversível e afetará o saldo.</p>
            </div>
            <div class="modal-footer modal-footer-dark border-0 justify-content-center d-flex flex-nowrap">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Não</button>
              <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Sim, Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `}).join("");

  // Montagem da query string para a paginação
  const qsParams = [];
  if (filtros.data_inicio) qsParams.push(`data_inicio=${filtros.data_inicio}`);
  if (filtros.data_fim) qsParams.push(`data_fim=${filtros.data_fim}`);
  if (filtros.tipo) qsParams.push(`tipo=${filtros.tipo}`);
  const baseQueryString = qsParams.length > 0 ? '&' + qsParams.join('&') : '';

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
          html += `<li class="page-item"><a class="page-link" href="/entradas-saidas?page=${ultima + 1}${baseQueryString}" onclick="navegarPagina(event, this.href)">${ultima + 1}</a></li>`;
        } else if (p - ultima > 2) {
          html += `<li class="page-item disabled"><span class="page-link border-0">...</span></li>`;
        }
      }
      html += `<li class="page-item ${p === page ? "active" : ""}"><a class="page-link" href="/entradas-saidas?page=${p}${baseQueryString}" onclick="navegarPagina(event, this.href)">${p}</a></li>`;
      ultima = p;
    });

    return html;
  })();

  const paginacaoHtml = totalPages > 1 ? `
    <nav aria-label="Paginação" class="mt-4">
      <ul class="pagination pagination-sm justify-content-center mb-4">
        <li class="page-item ${page <= 1 ? "disabled" : ""}">
          <a class="page-link" href="/entradas-saidas?page=${page - 1}${baseQueryString}" onclick="navegarPagina(event, this.href)">&laquo;</a>
        </li>
        ${pageLinks}
        <li class="page-item ${page >= totalPages ? "disabled" : ""}">
          <a class="page-link" href="/entradas-saidas?page=${page + 1}${baseQueryString}" onclick="navegarPagina(event, this.href)">&raquo;</a>
        </li>
      </ul>
    </nav>
  ` : "";

  const menuHTML = menuLateral(user, "/entradas-saidas");

  // Modal para exibir perguntando se o usuário quer emitir o comprovante recém criado
  const modalImprimirComprovanteHtml = `
  <div class="modal fade" id="modalImprimirComprovante" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
        <div class="modal-header bg-custom-darker border-0 pb-0 pt-4 px-4">
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body text-center p-5 pt-2">
          <div class="mb-4">
             <div class="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 rounded-circle shadow-sm" style="width: 80px; height: 80px; border: 1px solid rgba(220,53,69,0.3);">
                 <i class="fa-solid fa-file-pdf fa-2x text-danger"></i>
             </div>
          </div>
          <h5 class="fw-bold text-white mb-3">Retirada Registada</h5>
          <p class="text-white-50 mb-4" style="font-size:0.85rem; line-height: 1.5;">Deseja gerar o comprovante em PDF com a assinatura do recebedor agora?</p>
          <div class="d-flex flex-column gap-2 mt-2">
             <a href="#" target="_blank" id="btnImprimirComprovanteModal" class="btn btn-danger fw-bold shadow-sm" onclick="bootstrap.Modal.getInstance(document.getElementById('modalImprimirComprovante')).hide();">
                 <i class="fa-solid fa-file-pdf me-1"></i> Gerar Comprovante
             </a>
             <button type="button" class="btn btn-outline-secondary border-custom text-white-50 fw-bold" data-bs-dismiss="modal">
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
    <title>Entradas / Saídas | Ecoflow</title>
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

      /* TEMA ESCURO GLOBAL */
      :root {
          --bg-color: #151515;
          --surface-color: #1f1f1f;
          --verde-ecoflow: #08c068;
          --verde-hover: #06a056;
      }

      body { display: flex; height: 100vh; margin: 0; background-color: var(--bg-color); color: #e0e0e0; font-family: 'Segoe UI', sans-serif; }
      
      .sidebar { width: 240px; background-color: var(--surface-color); border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column; }
      .content { flex: 1; padding: 24px; overflow-y: auto; background-color: var(--bg-color); scrollbar-width: none; -ms-overflow-style: none; }
      .content::-webkit-scrollbar { display: none; }
      
      .bg-custom-dark { background-color: #2a2a2a !important; }
      .bg-custom-darker { background-color: #222222 !important; }
      .bg-surface { background-color: var(--surface-color) !important; }
      .border-custom { border-color: rgba(255,255,255,0.08) !important; border-width: 1px; }
      .text-accent { color: var(--verde-ecoflow) !important; }
      .bg-verde { background-color: var(--verde-ecoflow) !important; color: #1f1f1f !important; }

      .btn-primary, .btn-success { background-color: var(--verde-ecoflow); border-color: var(--verde-ecoflow); color: #1f1f1f; }
      .btn-primary:hover, .btn-success:hover, .btn-primary:active, .btn-success:active { background-color: var(--verde-hover) !important; border-color: var(--verde-hover) !important; color: #1f1f1f !important; }
      
      .btn-outline-secondary { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }
      .btn-outline-secondary:hover { background-color: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.3); }

      .form-control, .form-select, .input-group-text { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.8rem; }
      .form-control:focus, .form-select:focus { background-color: #2a2a2a; border-color: var(--verde-ecoflow); color: #fff; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }
      .input-group-text { background-color: #2a2a2a; color: rgba(255,255,255,0.6); }

      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .modal-header-dark { background-color: #151515; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .modal-footer-dark { background-color: #151515; border-top: 1px solid rgba(255,255,255,0.05); }
      
      .signature-pad { border: 2px dashed rgba(255,255,255,0.2); border-radius: 8px; background-color: #e0e0e0; cursor: crosshair; width: 100%; height: 180px; touch-action: none; }

      .table { --bs-table-bg: transparent; --bs-table-color: #fff; --bs-table-hover-bg: rgba(255,255,255,0.06); --bs-table-hover-color: #fff; color: #fff; margin-bottom: 0; }
      .table thead th { background-color: #222 !important; color: rgba(255,255,255,0.6) !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; font-weight: 600; }
      .table tbody td { border-bottom: 1px solid rgba(255,255,255,0.05) !important; background-color: transparent !important; color: #fff !important; }
      .table-hover-row { transition: background-color 0.2s ease; }
      .table-hover-row:hover > td, .table-hover-row:hover > * { background-color: rgba(255,255,255,0.06) !important; color: #fff !important; box-shadow: inset 0 0 0 9999px rgba(255, 255, 255, 0.03); }

      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
      .pagination .page-item.active .page-link { background-color: var(--verde-ecoflow); border-color: var(--verde-ecoflow); color: #1f1f1f !important; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
      .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.05); }

      /* ANIMAÇÃO DE ENTRADA E SAÍDA DO TOAST */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; background-color: #2a2a2a !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.08) !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: var(--verde-ecoflow); width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      /* ANIMAÇÃO DE ENTRADA E SAÍDA DOS MODAIS */
      .modal.fade .modal-dialog { transform: scale(0.85) translateY(30px); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
      .modal.show .modal-dialog { transform: scale(1) translateY(0); }

      /* SKELETON LOADING (Dark) */
      .skeleton-dark { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%) !important; background-size: 200% 100% !important; animation: skeleton-loading-view 1.5s infinite linear !important; border-radius: 4px; color: transparent !important; border-color: transparent !important; box-shadow: none !important; pointer-events: none; }
      .skeleton-dark * { visibility: hidden !important; }
      .skeleton-text-view { height: 16px; width: 100%; margin-bottom: 8px; }
      .skeleton-btn-view { height: 26px; width: 32px; border-radius: 4px; display: inline-block; }
      @keyframes skeleton-loading-view { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

      /* Botão Flutuante */
      .btn-flutuante { position: fixed; bottom: 30px; right: 30px; width: 55px; height: 55px; border-radius: 50%; background-color: var(--verde-ecoflow); color: #1f1f1f; border: none; box-shadow: 0 4px 15px rgba(8, 192, 104, 0.4); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; z-index: 1050; transition: all 0.3s ease; }
      .btn-flutuante:hover { transform: scale(1.1); background-color: var(--verde-hover); color: #1f1f1f; box-shadow: 0 6px 20px rgba(8, 192, 104, 0.6); }

      .hover-verde:hover { color: var(--verde-ecoflow) !important; }

      .offcanvas { background-color: #1f1f1f !important; }

      @media (max-width: 767.98px) {
        body { flex-direction: column; } .sidebar { display: none; } .content { width: 100%; padding: 16px; }
      }
    </style>
  </head>
  <body>
    
    <div class="sidebar d-none d-md-flex">
      <div class="text-center mb-4 mt-2"><img src="/img/logo-branca.png" class="img-fluid" style="max-width:130px;"></div>
      <div class="flex-grow-1">${menuHTML}</div>
    </div>

    <div class="offcanvas offcanvas-start text-white" tabindex="-1" id="sidebarMenu" style="background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05);">
      <div class="offcanvas-header border-bottom border-custom">
        <h5 class="offcanvas-title ms-2" style="font-size: 0.9rem;"><i class="fa-solid fa-bars text-muted me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2"><img src="/img/logo.png" class="img-fluid" style="max-width:140px;"></div>
        ${menuHTML}
        <hr class="border-custom mt-4">
        <a href="/logout" class="text-danger mt-2" style="font-size: 0.85rem;"><i class="fas fa-sign-out-alt me-2"></i>Sair do Sistema</a>
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center gap-3 mb-3">
        <button class="btn btn-sm btn-outline-secondary border-custom d-md-none hover-verde" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
        <div>
          <h4 class="mb-0 fw-bold text-white"><i class="fa-solid fa-money-bill-transfer text-white-50 me-2"></i>Entradas e Saídas</h4>
          <span class="text-white-50 d-none d-sm-block mt-1" style="font-size:0.75rem;">Controle financeiro e assinaturas</span>
        </div>
      </div>

      <div class="row g-3 mb-3">
        
        <div class="col-12 col-xl-5">
          <div class="bg-custom-darker p-3 rounded-3 shadow-sm border border-custom h-100 d-flex flex-column">
            
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
              
              <div class="d-flex align-items-center gap-2">
                <h6 class="mb-0 text-white-50" style="font-size:0.85rem;"><i class="fa-solid fa-list-ul me-1"></i> Resumo Financeiro</h6>
                <span class="badge bg-custom-dark border border-custom text-accent shadow-sm" style="background-color: rgba(8,192,104,0.1) !important;">${mesAtualStr}</span>
              </div>
              
              <div class="d-flex gap-3 align-items-center w-100 w-md-auto flex-wrap justify-content-start">
                <div class="text-end pe-2 d-none d-sm-block">
                   <span class="text-white-50 fw-bold" style="font-size: 0.75rem;">Total em Caixa</span><br>
                   <strong class="text-${corTotal}" style="font-size: 1.5rem;">${sinalTotal ? sinalTotal + ' ' : ''}R$ ${fmtMoeda(displayTotalCaixa)}</strong>
                </div>
              
                <div class="text-end border-end border-custom pe-3 d-none d-lg-block pt-2">
                   <span class="text-white-50 fw-bold" style="font-size: 0.70rem;">Entradas</span><br>
                   <strong class="text-accent" style="font-size: 0.80rem;">+ R$ ${fmtMoeda(totalEntradas)}</strong>
                </div>

                <div class="text-end border-end border-custom pe-3 d-none d-sm-block pt-2">
                   <span class="text-white-50 fw-bold" style="font-size: 0.70rem;">Saídas</span><br>
                   <strong class="text-danger" style="font-size: 0.80rem;">- R$ ${fmtMoeda(totalSaidas)}</strong>
                </div>

                <div class="d-flex gap-2">
                    <button class="btn btn-success shadow-sm flex-grow-1 flex-sm-grow-0 py-1 px-2 fw-bold text-dark border-0" style="font-size: 0.75rem;" data-bs-toggle="modal" data-bs-target="#novaEntradaModal">
                        <i class="fa-solid fa-arrow-down me-1"></i> Entrada
                    </button>
                    <button class="btn btn-danger shadow-sm flex-grow-1 flex-sm-grow-0 py-1 px-2 fw-bold border-0" style="font-size: 0.75rem;" data-bs-toggle="modal" data-bs-target="#novaSaidaModal">
                        <i class="fa-solid fa-arrow-up me-1"></i> Retirada
                    </button>
                    <button class="btn btn-outline-secondary border-custom text-white shadow-sm py-1 px-2 flex-grow-1 flex-sm-grow-0 hover-verde" style="font-size: 0.75rem;" onclick="abrirModalRelatorio()" title="Exportar para Excel">
                        <i class="fa-solid fa-file-excel me-1 text-accent"></i> Relatório
                    </button>
                </div>
              </div>
            </div>

            <form id="formFiltro" class="row g-2 align-items-end mt-2 border-top border-custom pt-2" method="GET" action="/entradas-saidas" onsubmit="prepararBuscaSimples(event, this, 'Filtros Aplicados!')">
                <div class="col-12 col-md-6 col-xxl-3">
                    <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Período De</label>
                    <input type="date" name="data_inicio" class="form-control form-control-sm shadow-sm" value="${filtros.data_inicio || ''}">
                </div>
                <div class="col-12 col-md-6 col-xxl-3">
                    <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Até</label>
                    <input type="date" name="data_fim" class="form-control form-control-sm shadow-sm" value="${filtros.data_fim || ''}">
                </div>
                <div class="col-12 col-md-6 col-xxl-3">
                    <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Tipo</label>
                    <select name="tipo" class="form-select form-select-sm shadow-sm">
                        <option value="">Tudo (Entradas/Saídas)</option>
                        <option value="entrada" ${filtros.tipo === 'entrada' ? 'selected' : ''}>Apenas Entradas</option>
                        <option value="saida" ${filtros.tipo === 'saida' ? 'selected' : ''}>Apenas Saídas</option>
                    </select>
                </div>
                <div class="col-12 col-md-6 col-xxl-3 d-flex gap-2">
                    <button type="submit" class="btn btn-sm btn-primary text-dark flex-grow-1 shadow-sm fw-bold border-0"><i class="fa-solid fa-filter me-1"></i> Filtrar</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-center shadow-sm text-danger" onclick="limparFiltros()"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </form>
          </div>
        </div>

        <div class="col-12 col-xl-7">
          <div class="bg-custom-darker p-3 rounded-3 shadow-sm border border-custom h-100 d-flex flex-column" id="containerGrafico">
              <div class="d-flex justify-content-between align-items-center mb-2 gap-2 flex-nowrap">
                  <h6 class="mb-0 fw-bold text-white text-nowrap" style="font-size:0.85rem;"><i class="fa-solid fa-chart-line text-accent me-2"></i> Fluxo Financeiro</h6>
                  <div class="d-flex gap-2 align-items-center flex-nowrap">
                      <select id="selectFiltroGrafico" class="form-select form-select-sm shadow-sm text-white-50 fw-medium" style="width: auto; min-width: 110px; font-size: 0.75rem;" onchange="buscarDadosGrafico()">
                          <option value="">Carregando...</option>
                      </select>
                      <button id="btnToggleVisaoGrafico" class="btn btn-outline-secondary border-custom shadow-sm fw-medium py-1 px-2 text-nowrap text-white" style="font-size: 0.75rem;" onclick="alternarVisaoGrafico()">
                          <i class="fa-solid fa-calendar-days me-1 text-accent"></i> Ver por Mês
                      </button>
                  </div>
              </div>
              <div class="flex-grow-1" style="position: relative; width: 100%; min-height: 180px;">
                  <canvas id="graficoFluxo"></canvas>
              </div>
          </div>
        </div>

      </div>
      ${movimentacoes.length > 0 
        ? `<div class="table-responsive bg-custom-darker rounded-3 shadow-sm border border-custom mb-4">
             <table class="table table-sm align-middle mb-0" style="font-size: 0.85rem; border-collapse: separate; border-spacing: 0;">
               <thead>
                 <tr>
                   <th class="py-2 px-3 fw-bold text-white-50 border-0">Data</th>
                   <th class="py-2 px-3 fw-bold text-white-50 border-0">Tipo</th>
                   <th class="py-2 px-3 fw-bold text-white-50 border-0">Descrição</th>
                   <th class="py-2 px-3 fw-bold text-white-50 border-0">Assinante</th>
                   <th class="py-2 px-3 fw-bold text-white-50 border-0 text-end">Valor (R$)</th>
                   <th class="py-2 px-3 fw-bold text-white-50 border-0 text-center">Ações</th>
                 </tr>
               </thead>
               <tbody class="border-top-0">
                 ${linhasTabela}
               </tbody>
             </table>
           </div>` 
        : `<div class="col-12 text-center text-white-50 mt-4 text-center-empty"><i class="fa-solid fa-wallet fa-3x opacity-25 mb-3 d-block"></i><p style="font-size:0.85rem;">Nenhuma movimentação registada para este filtro.</p></div>`
      }

      ${paginacaoHtml}
    </div>

    <div class="modal fade" id="modalRelatorio" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <div class="modal-header modal-header-dark border-custom">
            <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-file-excel text-accent me-2"></i> Exportar Relatório</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            <div class="mb-3">
              <label class="form-label text-white-50 fw-bold small mb-1">Ano Base</label>
              <select id="relatorioAno" class="form-select form-select-sm shadow-sm"></select>
            </div>
            <div class="mb-4">
              <label class="form-label text-white-50 fw-bold small mb-1">Mês Base</label>
              <select id="relatorioMes" class="form-select form-select-sm shadow-sm"></select>
            </div>
            <button type="button" onclick="baixarRelatorioExcel()" class="btn btn-sm btn-primary w-100 fw-bold text-dark border-0 shadow-sm"><i class="fa-solid fa-download me-1"></i> Baixar Planilha</button>
          </div>
        </div>
      </div>
    </div>

    <button class="btn-flutuante" data-bs-toggle="modal" data-bs-target="#modalInstrucoes" title="Ajuda / Como usar">
      <i class="fa-solid fa-question"></i>
    </button>

    <div class="modal fade" id="modalInstrucoes" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal border-0 shadow-lg">
          <div class="modal-header bg-custom-darker border-0">
            <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-circle-info text-accent me-2"></i> Como usar este módulo</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 text-white-50 bg-custom-dark" style="font-size: 0.8rem;">
            <p class="mb-4">Bem-vindo ao módulo de <strong class="text-white">Entradas e Saídas</strong>. Siga as orientações abaixo para um controle financeiro eficaz:</p>
            
            <ul class="list-group list-group-flush mb-4">
              <li class="list-group-item bg-transparent px-0 border-custom pb-3 text-white-50">
                <strong class="text-white d-block mb-1"><i class="fa-solid fa-plus-circle text-success me-2"></i> 1. Registar Movimentação</strong>
                Clique em "Entrada" ou "Retirada" para adicionar um novo registo. É obrigatório informar o valor, a descrição, o nome de quem entregou/retirou o valor e <strong class="text-white">recolher a assinatura na tela</strong>.
              </li>
              <li class="list-group-item bg-transparent px-0 border-custom py-3 text-white-50">
                <strong class="text-white d-block mb-1"><i class="fa-solid fa-wallet text-accent me-2"></i> 2. Saldo em Caixa e Gráfico</strong>
                O painel superior exibe o "Total em Caixa". Logo abaixo, você encontra o gráfico de <strong class="text-white">Fluxo Financeiro</strong> que permite acompanhar visualmente o balanço por dias do mês ou uma visão geral do ano inteiro.
              </li>
              <li class="list-group-item bg-transparent px-0 border-custom py-3 text-white-50">
                <strong class="text-white d-block mb-1"><i class="fa-solid fa-magnifying-glass text-info me-2"></i> 3. Detalhes e Ações</strong>
                Clique em cima de qualquer registo na tabela para ver os detalhes completos e confirmar a <strong class="text-white">assinatura salva</strong>. Caso note algum erro, pode usar os botões de editar (<i class="fa-solid fa-pen text-warning mx-1"></i>) ou excluir (<i class="fa-solid fa-trash text-danger mx-1"></i>) na respetiva linha da tabela.
              </li>
              <li class="list-group-item bg-transparent px-0 border-custom pt-3 border-bottom-0 text-white-50">
                <strong class="text-white d-block mb-1"><i class="fa-solid fa-file-excel text-success me-2"></i> 4. Exportar Relatório</strong>
                Clique em "Relatório" para fazer o download imediato de uma planilha Excel com todo o histórico de caixa e as informações dos assinantes.
              </li>
            </ul>

            <div class="alert bg-custom-darker border-custom text-white-50 shadow-sm mb-0">
              <i class="fa-solid fa-lightbulb text-warning me-2"></i> <strong class="text-white">Dica de Assinatura:</strong> Caso a assinatura não fique legível à primeira tentativa, basta clicar em "Limpar Assinatura" logo abaixo do quadro e desenhar de novo antes de guardar.
            </div>
          </div>
          <div class="modal-footer border-0 bg-custom-darker">
            <button type="button" class="btn btn-sm btn-primary px-4 fw-bold shadow-sm text-dark border-0" data-bs-dismiss="modal">Entendi</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="novaEntradaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form id="formEntrada" method="POST" action="/movimentacoes/novo" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="prepararEnvio(event, this, 'Entrada Registada!')">
          <input type="hidden" name="tipo" value="entrada">
          <input type="hidden" name="assinatura_base64" id="assinaturaEntradaHidden">
          
          <div class="modal-header bg-custom-darker text-white border-custom">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-arrow-down text-accent me-2"></i> Nova Entrada</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          
          <div class="modal-body p-4 bg-custom-dark">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Data</label>
                <input type="date" name="data" class="form-control form-control-sm shadow-sm" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Valor de Entrada (R$)</label>
                <input type="text" name="valor" class="form-control form-control-sm mask-moeda shadow-sm text-accent fw-bold" oninput="maskMoeda(this)" required placeholder="0,00">
              </div>
              <div class="col-12">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Quem entregou o valor</label>
                <input type="text" name="nome_assinante" class="form-control form-control-sm shadow-sm" required placeholder="Ex: João Silva">
              </div>
              <div class="col-12">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Descrição</label>
                <input type="text" name="descricao" class="form-control form-control-sm shadow-sm" required placeholder="Ex: Pagamento de serviço">
              </div>
              <div class="col-12">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Observações</label>
                <textarea name="observacao" class="form-control form-control-sm shadow-sm" rows="2" placeholder="Opcional..."></textarea>
              </div>
              <div class="col-12 mt-3 pt-3 border-top border-custom">
                <label class="form-label text-white fw-bold mb-2" style="font-size:0.75rem;">Assinatura</label>
                <canvas id="canvasEntrada" class="signature-pad shadow-sm"></canvas>
                <div class="text-end mt-2">
                    <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0 fw-medium" onclick="limparAssinatura('canvasEntrada')"><i class="fa-solid fa-eraser me-1"></i> Limpar Assinatura</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary text-dark fw-bold w-100 shadow-sm border-0"><i class="fa-solid fa-save me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="novaSaidaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form id="formSaida" method="POST" action="/movimentacoes/novo" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="prepararEnvio(event, this, 'Retirada Registada!')">
          <input type="hidden" name="tipo" value="saida">
          <input type="hidden" name="assinatura_base64" id="assinaturaSaidaHidden">
          
          <div class="modal-header bg-custom-darker text-white border-custom">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-arrow-up text-danger me-2"></i> Nova Retirada</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          
          <div class="modal-body p-4 bg-custom-dark">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Data</label>
                <input type="date" name="data" class="form-control form-control-sm shadow-sm" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Valor da Retirada (R$)</label>
                <input type="text" name="valor" class="form-control form-control-sm mask-moeda shadow-sm text-danger fw-bold" oninput="maskMoeda(this)" required placeholder="0,00">
              </div>
              <div class="col-12">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Nome de quem retirou o valor</label>
                <input type="text" name="nome_assinante" class="form-control form-control-sm shadow-sm" required placeholder="Ex: Maria Santos">
              </div>
              <div class="col-12">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Descrição</label>
                <input type="text" name="descricao" class="form-control form-control-sm shadow-sm" required placeholder="Ex: Compra de materiais">
              </div>
              <div class="col-12">
                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Observações</label>
                <textarea name="observacao" class="form-control form-control-sm shadow-sm" rows="2" placeholder="Opcional..."></textarea>
              </div>
              <div class="col-12 mt-3 pt-3 border-top border-custom">
                <label class="form-label text-white fw-bold mb-2" style="font-size:0.75rem;">Assinatura na Tela</label>
                <canvas id="canvasSaida" class="signature-pad shadow-sm"></canvas>
                <div class="text-end mt-2">
                    <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0 fw-medium" onclick="limparAssinatura('canvasSaida')"><i class="fa-solid fa-eraser me-1"></i> Limpar Assinatura</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold border-0 shadow-sm"><i class="fa-solid fa-save me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    ${modalImprimirComprovanteHtml}

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

    ${modais}

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
      // =======================================================================
      // CHECA URL POR COMPROVANTE NA CARGA INICIAL (Para envios sem AJAX)
      // =======================================================================
      document.addEventListener("DOMContentLoaded", () => {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('comprovanteSaida')) {
              const saidaId = urlParams.get('comprovanteSaida');
              mostrarToast('sucesso', 'Sucesso!', 'Retirada registada com sucesso.');

              const btnImprimir = document.getElementById('btnImprimirComprovanteModal');
              if (btnImprimir) {
                  btnImprimir.href = "/movimentacoes/comprovante/" + saidaId;
              }
              const modalImp = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalImprimirComprovante'));
              modalImp.show();

              const url = new URL(window.location.href);
              url.searchParams.delete('comprovanteSaida');
              window.history.replaceState({}, document.title, url.toString());
          }
      });

      // =======================================================================
      // FUNÇÃO GENÉRICA DE TOAST (SUCESSO E ERRO)
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

          successToastEl.setAttribute('data-bs-autohide', 'false');

          const timerEl = document.getElementById('sucessoTimer');
          if (timerEl) timerEl.style.display = 'none';

          const oldInstance = bootstrap.Toast.getInstance(successToastEl);
          if (oldInstance) oldInstance.dispose();
          const successToast = new bootstrap.Toast(successToastEl);
          successToast.show();
      }

      // =======================================================================
      // LÓGICA DO GRÁFICO (NOVO)
      // =======================================================================
      let chartFluxo = null;
      let visaoGraficoAtual = 'dia'; 
      let periodosDisponiveisGrafico = [];

      async function carregarFiltrosGrafico() {
          try {
              const res = await fetch('/api/movimentacoes/periodos');
              if (res.ok) {
                  periodosDisponiveisGrafico = await res.json();
              }
          } catch(e) {
              console.error("Erro ao buscar períodos:", e);
          }
          
          if (!periodosDisponiveisGrafico || periodosDisponiveisGrafico.length === 0) {
              const d = new Date();
              periodosDisponiveisGrafico = [{ mes: d.getMonth() + 1, ano: d.getFullYear() }];
          }
          
          atualizarDropdownGrafico();
      }

      function atualizarDropdownGrafico() {
          const select = document.getElementById('selectFiltroGrafico');
          select.innerHTML = '';
          
          if (visaoGraficoAtual === 'dia') {
              const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
              
              const periodosUnicos = [];
              periodosDisponiveisGrafico.forEach(p => {
                  if(!periodosUnicos.find(u => u.mes === p.mes && u.ano === p.ano)) {
                      periodosUnicos.push(p);
                  }
              });
              
              periodosUnicos.forEach(p => {
                  const opt = document.createElement('option');
                  opt.value = \`\${p.mes}-\${p.ano}\`;
                  opt.text = \`\${mesesNomes[p.mes - 1]} / \${p.ano}\`;
                  select.appendChild(opt);
              });
          } else {
              const anosUnicos = [...new Set(periodosDisponiveisGrafico.map(p => p.ano))];
              anosUnicos.forEach(a => {
                  const opt = document.createElement('option');
                  opt.value = \`\${a}\`;
                  opt.text = \`Ano Base: \${a}\`;
                  select.appendChild(opt);
              });
          }
          
          buscarDadosGrafico();
      }

      function alternarVisaoGrafico() {
          visaoGraficoAtual = visaoGraficoAtual === 'dia' ? 'mes' : 'dia';
          const btn = document.getElementById('btnToggleVisaoGrafico');
          
          if (visaoGraficoAtual === 'dia') {
              btn.innerHTML = '<i class="fa-solid fa-calendar-days me-1 text-accent"></i> Ver por Mês';
          } else {
              btn.innerHTML = '<i class="fa-solid fa-calendar-day me-1 text-accent"></i> Ver por Dia';
          }
          
          atualizarDropdownGrafico();
      }

      async function buscarDadosGrafico() {
          const val = document.getElementById('selectFiltroGrafico').value;
          if(!val) return;
          
          let url = \`/api/movimentacoes/grafico?visao=\${visaoGraficoAtual}\`;
          
          if (visaoGraficoAtual === 'dia') {
              const [m, a] = val.split('-');
              url += \`&mes=\${m}&ano=\${a}\`;
          } else {
              url += \`&ano=\${val}\`;
          }

          try {
              const res = await fetch(url);
              if (res.ok) {
                  const dados = await res.json();
                  renderizarGrafico(dados.labels, dados.entradas, dados.saidas);
              } else {
                  renderizarMockGrafico();
              }
          } catch(e) {
              renderizarMockGrafico();
          }
      }

      function renderizarMockGrafico() {
          let labels = [];
          
          if(visaoGraficoAtual === 'dia') {
              let ano = new Date().getFullYear();
              let mes = new Date().getMonth() + 1;
              const val = document.getElementById('selectFiltroGrafico').value;
              
              if (val && val.includes('-')) {
                  const partes = val.split('-');
                  mes = parseInt(partes[0], 10);
                  ano = parseInt(partes[1], 10);
              }
              
              const diasNoMes = new Date(ano, mes, 0).getDate();
              labels = Array.from({length: diasNoMes}, (_, i) => i + 1);
          } else {
              labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          }
          
          const entradas = labels.map(() => Math.floor(Math.random() * 8000));
          const saidas = labels.map(() => Math.floor(Math.random() * 5000));
          
          renderizarGrafico(labels, entradas, saidas);
      }

      function renderizarGrafico(labels, dataEntradas, dataSaidas) {
          const canvas = document.getElementById('graficoFluxo');
          if(!canvas) return;
          
          const ctx = canvas.getContext('2d');
          
          if (chartFluxo) {
              chartFluxo.destroy();
          }

          chartFluxo = new Chart(ctx, {
              type: 'bar',
              data: {
                  labels: labels,
                  datasets: [
                      {
                          label: 'Entradas (R$)',
                          data: dataEntradas,
                          backgroundColor: 'rgba(8, 192, 104, 0.85)',
                          borderColor: 'rgba(8, 192, 104, 1)',
                          borderWidth: 1,
                          borderRadius: 4
                      },
                      {
                          label: 'Saídas (R$)',
                          data: dataSaidas,
                          backgroundColor: 'rgba(220, 53, 69, 0.85)',
                          borderColor: 'rgba(220, 53, 69, 1)',
                          borderWidth: 1,
                          borderRadius: 4
                      }
                  ]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: {
                      legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true, font: { size: 11, family: "'Segoe UI', sans-serif" }, color: 'rgba(255,255,255,0.7)' } },
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
                                  let label = context.dataset.label || '';
                                  if (label) { label = label.replace('(R$)', '').trim() + ': '; }
                                  if (context.parsed.y !== null) {
                                      label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                                  }
                                  return label;
                              }
                          }
                      }
                  },
                  scales: {
                      y: { 
                          beginAtZero: true, 
                          grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                          ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, callback: function(value) { return 'R$ ' + value; } } 
                      },
                      x: { 
                          grid: { display: false }, 
                          ticks: { 
                              color: 'rgba(255,255,255,0.4)',
                              font: { size: 10 },
                              autoSkip: false,
                              maxRotation: 0
                          } 
                      }
                  }
              }
          });
      }

      // =======================================================================
      // SKELETON LOADING DA TABELA E GRID
      // =======================================================================
      function gerarSkeletonTabela(quantidade = 5) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += \`
              <tr class="align-middle" style="height: 40px;">
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 80%; margin: 0;"></div></td>
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 85px; margin: 0;"></div></td>
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 70%; margin: 0;"></div></td>
                  <td class="py-2 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 60%; margin: 0;"></div></td>
                  <td class="py-2 px-3 text-end"><div class="skeleton-dark skeleton-text-view" style="width: 50%; margin: 0 0 0 auto;"></div></td>
                  <td class="text-center py-2 px-3 d-flex justify-content-center gap-1">
                      <div class="skeleton-dark skeleton-btn-view" style="height: 24px; width: 30px;"></div>
                      <div class="skeleton-dark skeleton-btn-view" style="height: 24px; width: 30px;"></div>
                  </td>
              </tr>\`;
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const tableContainer = document.querySelector('.content > .table-responsive');
          const gridContainer = document.querySelector('.row.g-3.mb-3');
          const emptyState = document.querySelector('.content > .text-center.text-white-50.mt-4');
          
          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="skeleton-container">
              <div class="row g-3 mb-3">
                  <div class="col-12 col-xl-5">
                      <div class="bg-custom-darker p-3 rounded-3 shadow-sm border border-custom h-100 skeleton-dark" style="min-height: 180px;"></div>
                  </div>
                  <div class="col-12 col-xl-7">
                      <div class="bg-custom-darker p-3 rounded-3 shadow-sm border border-custom h-100 skeleton-dark" style="min-height: 180px;"></div>
                  </div>
              </div>
              <div class="table-responsive bg-custom-darker rounded-3 shadow-sm border border-custom mb-4">
                  <table class="table table-sm align-middle mb-0" style="font-size: 0.85rem;">
                     <thead>
                       <tr>
                         <th class="py-2 px-3 border-0">Data</th>
                         <th class="py-2 px-3 border-0">Tipo</th>
                         <th class="py-2 px-3 border-0">Descrição</th>
                         <th class="py-2 px-3 border-0">Assinante</th>
                         <th class="py-2 px-3 border-0 text-end">Valor (R$)</th>
                         <th class="py-2 px-3 border-0 text-center">Ações</th>
                       </tr>
                     </thead>
                     <tbody class="border-top-0">
                        \${gerarSkeletonTabela(5)}
                     </tbody>
                  </table>
              </div>
          </div>\`;

          if (gridContainer) gridContainer.style.display = 'none';
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
          const gridContainer = document.querySelector('.row.g-3.mb-3');
          const emptyState = document.querySelector('.content > .text-center.text-white-50.mt-4');

          if (gridContainer) gridContainer.style.display = 'flex';
          if (tableContainer) tableContainer.style.display = 'block';
          if (emptyState) emptyState.style.display = 'block';
      }

      mostrarSkeletonGlobais();

      if (document.readyState === 'complete') {
          setTimeout(() => {
              ocultarSkeletonGlobais();
              carregarFiltrosGrafico();
          }, 100);
      } else {
          window.addEventListener('load', () => {
              ocultarSkeletonGlobais();
              carregarFiltrosGrafico();
          });
      }

      window.addEventListener('beforeunload', () => {
          mostrarSkeletonGlobais();
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
                  
                  carregarFiltrosGrafico();
              } else {
                  mostrarToast('erro', 'Erro', 'Não foi possível realizar a busca.');
              }
          } catch (err) {
              console.error(err);
              mostrarToast('erro', 'Falha de Conexão', 'Verifique a sua rede e tente novamente.');
          } finally {
              ocultarSkeletonGlobais(); 
          }
      }

      function limparFiltros() {
          const form = document.getElementById('formFiltro');
          if (form) {
              form.querySelectorAll('input').forEach(i => i.value = '');
              form.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
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
                  
                  carregarFiltrosGrafico();
              } else {
                  mostrarToast('erro', 'Erro', 'Falha ao carregar a página.');
              }
          } catch (err) {
              mostrarToast('erro', 'Erro', 'Falha ao carregar a página.');
          }
      }

      function atualizarModaisDinamicos(doc) {
          const staticModals = ['modalInstrucoes', 'modalRelatorio', 'novaEntradaModal', 'novaSaidaModal', 'sidebarMenu', 'modalImprimirComprovante'];
          document.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) m.remove();
          });
          doc.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
          });
      }

      // =======================================================================
      // LÓGICA DO CANVAS DE ASSINATURA
      // =======================================================================
      const canvases = {
          'canvasEntrada': { ctx: null, isDrawing: false, empty: true, hiddenId: 'assinaturaEntradaHidden' },
          'canvasSaida': { ctx: null, isDrawing: false, empty: true, hiddenId: 'assinaturaSaidaHidden' }
      };

      function initCanvas(canvasId) {
          const canvas = document.getElementById(canvasId);
          if(!canvas) return;
          
          const rect = canvas.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;

          const ctx = canvas.getContext('2d');
          ctx.scale(dpr, dpr);
          
          ctx.strokeStyle = "#1f1f1f"; // Tinta preta no fundo claro
          ctx.lineWidth = 1.2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          
          canvases[canvasId].ctx = ctx;
          canvases[canvasId].empty = true;

          canvas.addEventListener('mousedown', (e) => startDrawing(e, canvasId));
          canvas.addEventListener('mousemove', (e) => draw(e, canvasId));
          canvas.addEventListener('mouseup', () => stopDrawing(canvasId));
          canvas.addEventListener('mouseout', () => stopDrawing(canvasId));

          canvas.addEventListener('touchstart', (e) => startDrawing(e, canvasId), { passive: false });
          canvas.addEventListener('touchmove', (e) => draw(e, canvasId), { passive: false });
          canvas.addEventListener('touchend', () => stopDrawing(canvasId));
      }

      function getPos(e, canvas) {
          const rect = canvas.getBoundingClientRect();
          let clientX = e.clientX;
          let clientY = e.clientY;
          if (e.touches && e.touches.length > 0) {
              clientX = e.touches[0].clientX;
              clientY = e.touches[0].clientY;
          }
          return { x: clientX - rect.left, y: clientY - rect.top };
      }

      function startDrawing(e, canvasId) {
          e.preventDefault();
          const canvas = document.getElementById(canvasId);
          const state = canvases[canvasId];
          state.isDrawing = true;
          state.empty = false;
          
          const pos = getPos(e, canvas);
          state.ctx.beginPath();
          state.ctx.moveTo(pos.x, pos.y);
      }

      function draw(e, canvasId) {
          const state = canvases[canvasId];
          if (!state.isDrawing) return;
          e.preventDefault();
          
          const canvas = document.getElementById(canvasId);
          const pos = getPos(e, canvas);
          state.ctx.lineTo(pos.x, pos.y);
          state.ctx.stroke();
      }

      function stopDrawing(canvasId) {
          const state = canvases[canvasId];
          if(state.isDrawing) {
              state.isDrawing = false;
              const canvas = document.getElementById(canvasId);
              document.getElementById(state.hiddenId).value = canvas.toDataURL('image/png');
          }
      }

      function limparAssinatura(canvasId) {
          const canvas = document.getElementById(canvasId);
          const state = canvases[canvasId];
          state.ctx.clearRect(0, 0, canvas.width, canvas.height);
          state.empty = true;
          document.getElementById(state.hiddenId).value = "";
      }

      document.getElementById('novaEntradaModal').addEventListener('shown.bs.modal', function () { initCanvas('canvasEntrada'); });
      document.getElementById('novaSaidaModal').addEventListener('shown.bs.modal', function () { initCanvas('canvasSaida'); });

      function maskMoeda(i) {
          let v = i.value.replace(/\\D/g,'');
          if(!v) { i.value = ''; return; }
          v = (v/100).toFixed(2) + '';
          v = v.replace(".", ",");
          v = v.replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, "$1.");
          i.value = v;
      }

      // =======================================================================
      // SUBMISSÃO AJAX COM INTERCEPTADOR DE COMPROVANTE
      // =======================================================================
      let isSubmitting = false;

      function prepararEnvio(event, form, titleMsg) {
          event.preventDefault();
          if (isSubmitting) return;

          const canvasId = form.id === 'formEntrada' ? 'canvasEntrada' : 'canvasSaida';
          if (canvases[canvasId].empty) {
              mostrarToast('erro', 'Atenção', 'Por favor, preencha a assinatura antes de guardar.');
              return;
          }

          submeter(form, titleMsg);
      }

      function prepararSubmissaoSimples(event, form, titleMsg) {
          event.preventDefault();
          if (isSubmitting) return;
          submeter(form, titleMsg);
      }

      async function submeter(form, titleMsg) {
          const inputMoeda = form.querySelector('.mask-moeda');
          if(inputMoeda && inputMoeda.value) {
              inputMoeda.value = inputMoeda.value.replace(/\\./g, '').replace(',', '.');
          }

          const modalEl = form.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }

          mostrarToastCarregando("A aguardar envio...");

          isSubmitting = true;

          try {
              const formData = new URLSearchParams();
              new FormData(form).forEach((value, key) => formData.append(key, value));

              const response = await fetch(form.action, {
                  method: form.method || 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: formData.toString()
              });

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

                  form.reset();
                  if (form.id === 'formEntrada') limparAssinatura('canvasEntrada');
                  if (form.id === 'formSaida') limparAssinatura('canvasSaida');
                  
                  carregarFiltrosGrafico();

                  // INTERCEPTA A RESPOSTA PARA ABRIR O MODAL DO PDF SE FOR UMA NOVA SAÍDA
                  const responseUrl = new URL(response.url);
                  if (responseUrl.searchParams.has('comprovanteSaida')) {
                      const saidaId = responseUrl.searchParams.get('comprovanteSaida');
                      mostrarToast('sucesso', 'Concluído!', titleMsg);
                      
                      const btnImprimir = document.getElementById('btnImprimirComprovanteModal');
                      if (btnImprimir) {
                          btnImprimir.href = "/movimentacoes/comprovante/" + saidaId;
                      }
                      const modalImp = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalImprimirComprovante'));
                      modalImp.show();
                  } else {
                      mostrarToast('sucesso', 'Concluído!', titleMsg);
                  }
              } else {
                  mostrarToast('erro', 'Erro', 'Não foi possível salvar os dados no servidor.');
              }
          } catch (err) {
              console.error(err);
              mostrarToast('erro', 'Falha de Conexão', 'Verifique sua internet e tente novamente.');
          } finally {
              isSubmitting = false;
          }
      }

      // ==========================================
      // LÓGICA DE EXPORTAÇÃO EXCEL
      // ==========================================
      async function fetchSeguro(url, options = {}) {
          const res = await fetch(url, options);
          if (res.status === 401) {
              window.location.href = '/login';
              return null; 
          }
          return res;
      }

      let periodosMovCache = [];

      async function abrirModalRelatorio() {
          const anoSelect = document.getElementById('relatorioAno');
          const mesSelect = document.getElementById('relatorioMes');
          
          try {
              const res = await fetchSeguro('/api/movimentacoes/periodos');
              if(!res) return;
              periodosMovCache = await res.json();
              
              if (periodosMovCache.length === 0) {
                  anoSelect.innerHTML = '<option value="">Sem dados</option>';
                  mesSelect.innerHTML = '<option value="">Sem dados</option>';
              } else {
                  const anos = [...new Set(periodosMovCache.map(p => p.ano))];
                  anoSelect.innerHTML = anos.map(a => \`<option value="\${a}">\${a}</option>\`).join('');
                  
                  anoSelect.onchange = () => {
                      const anoAtual = parseInt(anoSelect.value);
                      const meses = periodosMovCache.filter(p => p.ano === anoAtual).map(p => p.mes);
                      const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
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
              window.open(\`/exportar/movimentacoes?mes=\${mes}&ano=\${ano}\`, '_blank');
          } else {
              window.open('/exportar/movimentacoes', '_blank');
          }

          const modalRelatorio = bootstrap.Modal.getInstance(document.getElementById('modalRelatorio'));
          if (modalRelatorio) modalRelatorio.hide();
          
          mostrarToast('sucesso', 'Download Iniciado!', 'O seu relatório Excel está sendo baixado.');
      }
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = entradasSaidasView;