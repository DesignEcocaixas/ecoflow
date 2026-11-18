// views/entradasSaidasView.js
const menuLateral = require("./menuLateral");
const termosComponent = require("./termosComponent"); 

function entradasSaidasView(usuario, movimentacoes = [], paginacao = {}, filtros = {}) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const termosHTML = termosComponent(usuario); 
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

  const totalEntradas = paginacao.totalEntradas || 0;
  const totalSaidas = paginacao.totalSaidas || 0;
  const totalCaixaCalc = paginacao.totalCaixa || 0;

  const displayTotalCaixa = totalCaixaCalc < 0 ? 0 : totalCaixaCalc;
  const corTotal = displayTotalCaixa > 0 ? 'accent' : 'secondary';
  const sinalTotal = displayTotalCaixa > 0 ? '+' : '';

  const linhasTabela = movimentacoes.map(m => {
    const isEntrada = m.tipo === 'entrada';
    const corClass = isEntrada ? 'success' : 'danger';
    const sinal = isEntrada ? '+' : '-';
    const icone = isEntrada ? 'ph-arrow-down' : 'ph-arrow-up';

    return `
    <tr style="cursor: pointer;" class="align-middle table-hover-row" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('detalheModal${m.id}')).show();">
      <td class="text-white-50 fw-medium py-2 px-3"><i class="ph-bold ph-calendar-blank me-1"></i> ${fmtData(m.data)}</td>
      <td class="py-2 px-3">
        <span class="badge bg-${corClass} bg-opacity-10 text-${corClass} border border-${corClass} border-opacity-50 px-2 py-1" style="width: 85px; display: inline-block; text-align: center;">
          <i class="ph-bold ${icone} me-1"></i> ${isEntrada ? 'Entrada' : 'Saída'}
        </span>
      </td>
      <td class="py-2 px-3">
        <div class="text-truncate text-white fw-medium" style="max-width: 250px;" title="${m.descricao}">
          ${m.descricao || "Sem descrição"}
        </div>
      </td>
      <td class="py-2 px-3">
        <div class="text-truncate text-white-50" style="max-width: 200px;" title="Assinante: ${m.nome_assinante || 'Não informado'}">
          <i class="ph-bold ph-pen-nib text-accent me-1"></i> ${m.nome_assinante || 'Não informado'}
        </div>
      </td>
      <td class="text-end fw-bold text-${corClass} py-2 px-3">
         ${sinal} R$ ${fmtMoeda(m.valor)}
      </td>
      <td class="text-center py-2 px-3">
        <div class="btn-group">
          <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-warning py-1 px-2 shadow-sm" 
                  onclick="event.stopPropagation(); bootstrap.Modal.getOrCreateInstance(document.getElementById('editarModal${m.id}')).show();" title="Editar">
            <i class="ph-bold ph-pencil-simple" style="font-size:0.75rem;"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger py-1 px-2 shadow-sm ms-1" 
                  onclick="event.stopPropagation(); bootstrap.Modal.getOrCreateInstance(document.getElementById('excluirModal${m.id}')).show();" title="Excluir">
            <i class="ph-bold ph-trash" style="font-size:0.75rem;"></i>
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
    
    const saldoAnt = Number(m.saldo_anterior) || 0;
    const saldoNov = Number(m.saldo_novo) || 0;

    return `
    <div class="modal fade" id="detalheModal${m.id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content erp-modal shadow-lg border-0 bg-custom-darker">
          <div class="modal-header modal-header-dark border-custom">
            <h6 class="modal-title fw-bold text-white"><i class="ph-fill ph-money text-accent me-2"></i> Detalhes da Movimentação</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            
            <div class="row g-2 mb-3">
                <!-- VALOR DA MOVIMENTAÇÃO E DATA -->
                <div class="col-12 col-sm-5 d-flex flex-column">
                    <div class="bg-custom-darker p-3 rounded-3 border border-custom shadow-sm h-100 d-flex flex-column justify-content-center align-items-center text-center">
                        <span class="badge bg-${corClass} bg-opacity-10 text-${corClass} border border-${corClass} border-opacity-50 mb-2 px-2 py-1" style="font-size:0.7rem; letter-spacing: 1px;">
                            ${isEntrada ? 'ENTRADA' : 'SAÍDA'}
                        </span>
                        <h4 class="fw-bold text-${corClass} mb-1">${sinal} R$ ${fmtMoeda(m.valor)}</h4>
                        <p class="text-white-50 mb-0" style="font-size:0.75rem;"><i class="ph-bold ph-calendar-blank me-1"></i> ${fmtData(m.data)}</p>
                    </div>
                </div>

                <!-- HISTÓRICO DE SALDO -->
                <div class="col-12 col-sm-7 d-flex flex-column">
                    <div class="bg-custom-darker p-3 rounded-3 border border-custom shadow-sm h-100 d-flex flex-column justify-content-center">
                        <h6 class="text-white-50 fw-bold mb-2 text-center border-bottom border-custom pb-2" style="font-size: 0.7rem;">
                            <i class="ph-bold ph-clock-counter-clockwise me-1"></i> Rastreio de Saldo
                        </h6>
                        <div class="d-flex align-items-center justify-content-around px-1">
                            <div class="text-center">
                                <span class="d-block text-muted fw-bold mb-1" style="font-size: 0.6rem; text-transform: uppercase;">Anterior</span>
                                <span class="badge bg-custom-dark border border-custom text-white-50 px-2 py-1 shadow-sm" style="font-size: 0.75rem;">
                                    R$ ${fmtMoeda(saldoAnt)}
                                </span>
                            </div>
                            <div class="text-center px-1">
                                <i class="ph-bold ph-arrow-right text-${corClass}"></i>
                            </div>
                            <div class="text-center">
                                <span class="d-block text-muted fw-bold mb-1" style="font-size: 0.6rem; text-transform: uppercase;">Novo</span>
                                <span class="badge bg-${corClass} text-white px-2 py-1 shadow-sm" style="font-size: 0.75rem;">
                                    R$ ${fmtMoeda(saldoNov)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DESCRIÇÃO, OBSERVAÇÕES E REGISTRO -->
            <div class="bg-custom-darker p-3 rounded-3 mb-3 border border-custom shadow-sm d-flex flex-column gap-3">
                <div>
                    <h6 class="fw-bold text-white mb-1" style="font-size:0.8rem;">Descrição:</h6>
                    <p class="mb-0 text-white-50" style="font-size:0.8rem; word-break: break-word;">${m.descricao}</p>
                </div>
                <div>
                    <h6 class="fw-bold text-white mb-1" style="font-size:0.8rem;">Observações:</h6>
                    <p class="mb-0 text-white-50" style="font-size:0.75rem; word-break: break-word;">${m.observacao || "Nenhuma observação registada."}</p>
                </div>
                <div class="pt-2 border-top border-custom">
                    <span class="fw-bold text-white" style="font-size:0.8rem;">Registrado por:</span>
                    <span class="text-white-50 ms-1" style="font-size:0.75rem;"><i class="ph-bold ph-desktop text-accent mx-1"></i> ${m.responsavel || "Sistema"}</span>
                </div>
            </div>

            <!-- ASSINATURA -->
            <div class="border border-custom rounded-3 p-3 text-center bg-custom-darker shadow-sm">
              <h6 class="fw-bold text-white mb-2" style="font-size:0.8rem;">Assinatura de: ${m.nome_assinante || "Não informado"}</h6>
              ${m.assinatura_base64 
                ? `<img src="${m.assinatura_base64}" alt="Assinatura" style="max-width: 100%; height: auto; max-height: 110px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; filter: invert(1) brightness(2);">` 
                : `<div class="text-muted py-2" style="font-size:0.75rem;"><i class="ph-bold ph-signature fa-2x opacity-25 mb-1"></i><br>Nenhuma assinatura capturada.</div>`
              }
            </div>

          </div>
          <div class="modal-footer modal-footer-dark border-custom d-flex flex-nowrap gap-2">
             ${!isEntrada ? `<a href="/movimentacoes/comprovante/${m.id}" target="_blank" class="btn btn-sm btn-outline-danger w-100 fw-bold"><i class="ph-bold ph-file-pdf me-1"></i> Comprovante</a>` : ''}
             <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Fechar Detalhes</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="editarModal${m.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form method="POST" action="/movimentacoes/editar/${m.id}" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Registo Atualizado!')">
          <div class="modal-header modal-header-dark border-custom">
            <h6 class="modal-title fw-bold text-white"><i class="ph-fill ph-pencil-simple text-warning me-2"></i> Editar Registo</h6>
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
             <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm text-dark"><i class="ph-bold ph-floppy-disk me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${m.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <form method="POST" action="/movimentacoes/excluir/${m.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Registo Excluído!')">
            <div class="modal-body text-center p-4 bg-custom-darker">
              <i class="ph-fill ph-warning-circle fa-3x text-danger mb-3"></i>
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
                 <i class="ph-fill ph-file-pdf fa-2x text-danger"></i>
             </div>
          </div>
          <h5 class="fw-bold text-white mb-3">Retirada Registada</h5>
          <p class="text-white-50 mb-4" style="font-size:0.85rem; line-height: 1.5;">Deseja gerar o comprovante em PDF com a assinatura do recebedor agora?</p>
          <div class="d-flex flex-column gap-2 mt-2">
             <a href="#" target="_blank" id="btnImprimirComprovanteModal" class="btn btn-danger fw-bold shadow-sm" onclick="bootstrap.Modal.getInstance(document.getElementById('modalImprimirComprovante')).hide();">
                 <i class="ph-bold ph-file-pdf me-1"></i> Gerar Comprovante
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
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
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

      /* Botão de ajuda inline no cabeçalho */
      .btn-ajuda-inline {
          background-color: transparent;
          color: rgba(255,255,255,0.4);
          border: none;
          padding: 0 5px;
          margin-left: 8px;
          font-size: 1.1rem;
          transition: color 0.2s ease, transform 0.2s ease;
      }
      .btn-ajuda-inline:hover { color: #08c068; }
      .btn-ajuda-inline:active { transform: scale(0.9); }

      .hover-verde:hover { color: var(--verde-ecoflow) !important; }
      
      /* APPLE STYLE SPINNER LOADER (DARK THEME) */
      .apple-spinner { display: inline-block; width: 24px; height: 24px; position: relative; }
      .apple-spinner div { transform-origin: 12px 12px; animation: apple-spinner 1.2s linear infinite; }
      .apple-spinner div:after { content: " "; display: block; position: absolute; top: 0; left: 11px; width: 2.5px; height: 6px; border-radius: 20%; background: #08c068; }
      .apple-spinner div:nth-child(1) { transform: rotate(0deg); animation-delay: -1.1s; }
      .apple-spinner div:nth-child(2) { transform: rotate(30deg); animation-delay: -1s; }
      .apple-spinner div:nth-child(3) { transform: rotate(60deg); animation-delay: -0.9s; }
      .apple-spinner div:nth-child(4) { transform: rotate(90deg); animation-delay: -0.8s; }
      .apple-spinner div:nth-child(5) { transform: rotate(120deg); animation-delay: -0.7s; }
      .apple-spinner div:nth-child(6) { transform: rotate(150deg); animation-delay: -0.6s; }
      .apple-spinner div:nth-child(7) { transform: rotate(180deg); animation-delay: -0.5s; }
      .apple-spinner div:nth-child(8) { transform: rotate(210deg); animation-delay: -0.4s; }
      .apple-spinner div:nth-child(9) { transform: rotate(240deg); animation-delay: -0.3s; }
      .apple-spinner div:nth-child(10) { transform: rotate(270deg); animation-delay: -0.2s; }
      .apple-spinner div:nth-child(11) { transform: rotate(300deg); animation-delay: -0.1s; }
      .apple-spinner div:nth-child(12) { transform: rotate(330deg); animation-delay: 0s; }
      @keyframes apple-spinner { 0% { opacity: 1; } 100% { opacity: 0.15; } }

      .local-spinner-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #222222; z-index: 50; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: inherit; opacity: 0; animation: fadeInOverlay 0.2s forwards; }
      @keyframes fadeInOverlay { to { opacity: 1; } }

      /* TOUR POPOVER STYLES */
      .tour-popover { border: 1px solid #08c068 !important; --bs-popover-bg: #2a2a2a; --bs-popover-header-bg: #222; --bs-popover-header-color: #fff; --bs-popover-body-color: rgba(255,255,255,0.8); z-index: 1070 !important; }
      .tour-popover .popover-header { font-size: 0.85rem; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); }
      .tour-popover .popover-arrow::after { border-bottom-color: #222 !important; border-top-color: #2a2a2a !important; }
      .tour-highlight { position: relative !important; z-index: 1060 !important; pointer-events: none !important; box-shadow: 0 0 15px rgba(8, 192, 104, 0.4), 0 0 0 2px #08c068 !important; border-radius: inherit; }
      .tour-highlight-parent { position: relative !important; z-index: 1056 !important; }

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
        <h5 class="offcanvas-title ms-2" style="font-size: 0.9rem;"><i class="ph-bold ph-list text-muted me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2"><img src="/img/logo.png" class="img-fluid" style="max-width:140px;"></div>
        ${menuHTML}
        <hr class="border-custom mt-4">
        <a href="/logout" class="text-danger mt-2" style="font-size: 0.85rem;"><i class="ph-bold ph-sign-out me-2"></i>Sair do Sistema</a>
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between mb-3 gap-3">
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-sm btn-outline-secondary border-custom d-md-none hover-verde" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu" id="btn-tour-menu"><i class="ph-bold ph-list text-white"></i></button>
          <div>
            <div class="d-flex align-items-center">
                <h4 class="mb-0 fw-bold text-white"><i class="ph-fill ph-money text-white-50 me-2"></i>Entradas e Saídas</h4>
                <button type="button" class="btn-ajuda-inline" id="btnAjudaTour" onclick="toggleTourMode()" title="Como funciona esta tela?">
                    <i class="ph-fill ph-question"></i>
                </button>
            </div>
            <span class="text-white-50 d-none d-sm-block mt-1" style="font-size:0.75rem;">Controle financeiro e assinaturas</span>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3">
        
        <div class="col-12 col-xl-5 position-relative" id="painel-resumo-container">
          <div class="bg-custom-darker p-3 rounded-3 shadow-sm border border-custom h-100 d-flex flex-column" id="tour-resumo">
            
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
              
              <div class="d-flex align-items-center gap-2">
                <h6 class="mb-0 text-white-50" style="font-size:0.85rem;"><i class="ph-bold ph-list-bullets me-1"></i> Resumo Financeiro</h6>
                <span class="badge bg-custom-dark border border-custom text-accent shadow-sm" style="background-color: rgba(8,192,104,0.1) !important;">${mesAtualStr}</span>
              </div>
              
              <div class="d-flex gap-3 align-items-center w-100 w-md-auto flex-wrap justify-content-start">
                
                <div class="d-flex align-items-center gap-2 pe-2 d-none d-sm-flex">
                   <button type="button" id="btnToggleVisibilidade" class="btn btn-link text-white-50 p-0 shadow-none hover-verde" onclick="toggleVisibilidadeFinanceira()" title="Mostrar/Ocultar Valores">
                       <i class="ph-bold ph-eye-slash" id="iconeVisibilidade"></i>
                   </button>
                   <div class="text-end">
                       <span class="text-white-50 fw-bold" style="font-size: 0.75rem;">Total em Caixa</span><br>
                       <strong class="text-${corTotal} valor-financeiro" style="font-size: 1.5rem;" data-valor="${sinalTotal ? sinalTotal + ' ' : ''}R$ ${fmtMoeda(displayTotalCaixa)}">R$ ****</strong>
                   </div>
                </div>
              
                <div class="text-end border-end border-custom pe-3 d-none d-lg-block pt-2">
                   <span class="text-white-50 fw-bold" style="font-size: 0.70rem;">Entradas</span><br>
                   <strong class="text-accent valor-financeiro" style="font-size: 0.80rem;" data-valor="+ R$ ${fmtMoeda(totalEntradas)}">R$ ****</strong>
                </div>

                <div class="text-end border-end border-custom pe-3 d-none d-sm-block pt-2">
                   <span class="text-white-50 fw-bold" style="font-size: 0.70rem;">Saídas</span><br>
                   <strong class="text-danger valor-financeiro" style="font-size: 0.80rem;" data-valor="- R$ ${fmtMoeda(totalSaidas)}">R$ ****</strong>
                </div>

                <div class="d-flex gap-2">
                    <button class="btn btn-success shadow-sm flex-grow-1 flex-sm-grow-0 py-1 px-2 fw-bold text-dark border-0" style="font-size: 0.75rem;" data-bs-toggle="modal" data-bs-target="#novaEntradaModal" id="tour-entrada">
                        <i class="ph-bold ph-arrow-down me-1"></i> Entrada
                    </button>
                    <button class="btn btn-danger shadow-sm flex-grow-1 flex-sm-grow-0 py-1 px-2 fw-bold border-0" style="font-size: 0.75rem;" data-bs-toggle="modal" data-bs-target="#novaSaidaModal" id="tour-saida">
                        <i class="ph-bold ph-arrow-up me-1"></i> Retirada
                    </button>
                    <button class="btn btn-outline-secondary border-custom text-white shadow-sm py-1 px-2 flex-grow-1 flex-sm-grow-0 hover-verde" style="font-size: 0.75rem;" data-bs-toggle="modal" data-bs-target="#modalRelatorio" title="Exportar para Excel" id="tour-relatorio">
                        <i class="ph-bold ph-file-xls me-1 text-accent"></i> Relatório
                    </button>
                </div>
              </div>
            </div>

            <form id="formFiltro" class="row g-2 align-items-end mt-2 border-top border-custom pt-2" method="GET" action="/entradas-saidas" onsubmit="prepararBuscaSimples(event, this, 'Filtros Aplicados!')">
                <div class="col-12 col-md-6 col-xxl-3" id="tour-filtro">
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
                    <button type="submit" class="btn btn-sm btn-primary text-dark flex-grow-1 shadow-sm fw-bold border-0"><i class="ph-bold ph-funnel me-1"></i> Filtrar</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-center shadow-sm text-danger" onclick="limparFiltros()"><i class="ph-bold ph-x"></i></button>
                </div>
            </form>
          </div>
        </div>

        <div class="col-12 col-xl-7 position-relative" id="containerGrafico">
          <div class="bg-custom-darker p-3 rounded-3 shadow-sm border border-custom h-100 d-flex flex-column" id="tour-grafico">
              <div class="d-flex justify-content-between align-items-center mb-2 gap-2 flex-nowrap">
                  <h6 class="mb-0 fw-bold text-white text-nowrap" style="font-size:0.85rem;"><i class="ph-bold ph-chart-line-up text-accent me-2"></i> Fluxo Financeiro</h6>
                  <div class="d-flex gap-2 align-items-center flex-nowrap">
                      <select id="selectFiltroGrafico" class="form-select form-select-sm shadow-sm text-white-50 fw-medium" style="width: auto; min-width: 110px; font-size: 0.75rem;" onchange="buscarDadosGrafico()">
                          <option value="">Carregando...</option>
                      </select>
                      <button id="btnToggleVisaoGrafico" class="btn btn-outline-secondary border-custom shadow-sm fw-medium py-1 px-2 text-nowrap text-white" style="font-size: 0.75rem;" onclick="alternarVisaoGrafico()">
                          <i class="ph-bold ph-calendar-blank me-1 text-accent"></i> Ver por Mês
                      </button>
                  </div>
              </div>
              <div class="flex-grow-1" style="position: relative; width: 100%; min-height: 180px;">
                  <canvas id="graficoFluxo"></canvas>
              </div>
          </div>
        </div>

      </div>
      
      <div class="position-relative" id="containerTabela">
      ${movimentacoes.length > 0 
        ? `<div class="table-responsive bg-custom-darker rounded-3 shadow-sm border border-custom mb-4" id="tour-tabela">
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
        : `<div class="col-12 text-center text-white-50 mt-4 text-center-empty"><i class="ph-fill ph-wallet fa-3x opacity-25 mb-3 d-block"></i><p style="font-size:0.85rem;">Nenhuma movimentação registada para este filtro.</p></div>`
      }
      </div>

      ${paginacaoHtml}
    </div>

    <!-- MODAL RELATORIO -->
    <div class="modal fade" id="modalRelatorio" tabindex="-1">
      <div class="modal-dialog modal-md modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <div class="modal-header modal-header-dark border-custom">
            <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="ph-bold ph-file-xls text-accent me-2"></i> Exportar Relatório</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            
            <div class="mb-3">
              <label class="form-label text-white fw-bold mb-3"><i class="ph-bold ph-calendar-blank text-accent me-1"></i> Período do Relatório</label>
              <div class="row g-2">
                <div class="col-6">
                  <label class="form-label text-white-50 small mb-1" for="relatorioDataInicio">De:</label>
                  <input type="date" id="relatorioDataInicio" class="form-control form-control-sm shadow-sm" value="${filtros.data_inicio || ''}">
                </div>
                <div class="col-6">
                  <label class="form-label text-white-50 small mb-1" for="relatorioDataFim">Até:</label>
                  <input type="date" id="relatorioDataFim" class="form-control form-control-sm shadow-sm" value="${filtros.data_fim || ''}">
                </div>
              </div>
            </div>

            <div class="mb-4 pt-3 border-top border-custom">
              <label class="form-label text-white fw-bold mb-3"><i class="ph-bold ph-columns text-accent me-1"></i> Selecione as Colunas</label>
              <div class="row g-2">
                 <div class="col-6"><div class="form-check form-switch"><input class="form-check-input chk-coluna border-secondary" type="checkbox" value="data" id="chkData" checked><label class="form-check-label text-white-50 small" for="chkData">Data</label></div></div>
                 <div class="col-6"><div class="form-check form-switch"><input class="form-check-input chk-coluna border-secondary" type="checkbox" value="tipo" id="chkTipo" checked><label class="form-check-label text-white-50 small" for="chkTipo">Tipo (Entrada/Saída)</label></div></div>
                 <div class="col-6"><div class="form-check form-switch"><input class="form-check-input chk-coluna border-secondary" type="checkbox" value="valor" id="chkValor" checked><label class="form-check-label text-white-50 small" for="chkValor">Valor Movimentado</label></div></div>
                 <div class="col-6"><div class="form-check form-switch"><input class="form-check-input chk-coluna border-secondary" type="checkbox" value="rastreio" id="chkRastreio" checked><label class="form-check-label text-white-50 small" for="chkRastreio">Rastreio (Saldos)</label></div></div>
                 <div class="col-6"><div class="form-check form-switch"><input class="form-check-input chk-coluna border-secondary" type="checkbox" value="descricao" id="chkDesc" checked><label class="form-check-label text-white-50 small" for="chkDesc">Descrição</label></div></div>
                 <div class="col-6"><div class="form-check form-switch"><input class="form-check-input chk-coluna border-secondary" type="checkbox" value="observacao" id="chkObs" checked><label class="form-check-label text-white-50 small" for="chkObs">Observações</label></div></div>
                 <div class="col-6"><div class="form-check form-switch"><input class="form-check-input chk-coluna border-secondary" type="checkbox" value="assinante" id="chkAssinante" checked><label class="form-check-label text-white-50 small" for="chkAssinante">Assinante</label></div></div>
                 <div class="col-6"><div class="form-check form-switch"><input class="form-check-input chk-coluna border-secondary" type="checkbox" value="responsavel" id="chkResp" checked><label class="form-check-label text-white-50 small" for="chkResp">Usuário do Sistema</label></div></div>
              </div>
            </div>

            <button type="button" onclick="baixarRelatorioExcel()" class="btn btn-sm btn-primary w-100 fw-bold text-dark border-0 shadow-sm"><i class="ph-bold ph-download-simple me-1"></i> Gerar relatório</button>
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
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="ph-bold ph-arrow-down text-accent me-2"></i> Nova Entrada</h6>
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
                    <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0 fw-medium" onclick="limparAssinatura('canvasEntrada')"><i class="ph-bold ph-eraser me-1"></i> Limpar Assinatura</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary text-dark fw-bold w-100 shadow-sm border-0"><i class="ph-bold ph-floppy-disk me-1"></i> Salvar</button>
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
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="ph-bold ph-arrow-up text-danger me-2"></i> Nova Retirada</h6>
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
                    <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0 fw-medium" onclick="limparAssinatura('canvasSaida')"><i class="ph-bold ph-eraser me-1"></i> Limpar Assinatura</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold border-0 shadow-sm"><i class="ph-bold ph-floppy-disk me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    ${modalImprimirComprovanteHtml}

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="ph-fill ph-check-circle fs-5 me-2 text-accent" id="sucessoIcon"></i>
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
                    <i class="ph-fill ph-x-circle fs-5 me-2 text-danger"></i>
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
    ${termosHTML}

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
      // =======================================================================
      // TOUR DE BOOTSTRAP POPOVERS (ONBOARDING)
      // =======================================================================
      let tourPopovers = [];
      let tourAtivo = false;

      window.toggleTourMode = function() {
          if (tourAtivo) {
              encerrarTour();
              return;
          }
          iniciarTour();
      };

      function iniciarTour() {
          tourAtivo = true;
          document.getElementById('btnAjudaTour').classList.add('text-accent');
          
          let backdrop = document.getElementById('tourBackdrop');
          if (!backdrop) {
              backdrop = document.createElement('div');
              backdrop.id = 'tourBackdrop';
              backdrop.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.75); z-index: 1055; transition: opacity 0.3s;';
              document.body.appendChild(backdrop);
          }
          backdrop.style.display = 'block';

          mostrarPassoTour(0);
      }

      window.mostrarPassoTour = function(stepIndex) {
          if (tourPopovers.length > 0) {
              tourPopovers.forEach(p => p.dispose());
              tourPopovers = [];
          }
          
          document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
          document.querySelectorAll('.tour-highlight-parent').forEach(el => el.classList.remove('tour-highlight-parent'));

          const steps = [
              { id: 'btn-tour-menu', title: 'Menu Lateral', content: 'Aceda aos outros módulos de gestão do sistema.', placement: 'bottom' },
              { id: 'tour-resumo', title: 'Resumo Financeiro', content: 'Visualize o valor total em caixa atual e alterne a visibilidade dos valores no ícone de "olho".', placement: 'auto' },
              { id: 'tour-filtro', title: 'Filtro por Data', content: 'Selecione um intervalo de datas e veja apenas as entradas/saídas correspondentes ao período.', placement: 'bottom' },
              { id: 'tour-entrada', title: 'Registrar Entrada', content: 'Adicione um novo valor recebido preenchendo as informações.', placement: 'bottom' },
              { id: 'tour-saida', title: 'Registrar Retirada', content: 'Adicione uma retirada. É necessário assinar diretamente no modal como recibo.', placement: 'bottom' },
              { id: 'tour-relatorio', title: 'Exportar Relatório', content: 'Baixe todo o histórico financeiro selecionado num arquivo Excel.', placement: 'bottom' },
              { id: 'tour-grafico', title: 'Gráfico Interativo', content: 'Acompanhe as receitas e despesas organizadas por dia ou por mês.', placement: 'bottom' }
          ];

          if (document.querySelector('.table-hover-row')) {
              document.querySelector('.table-hover-row').id = 'tour-tabela-linha';
              steps.push({ id: 'tour-tabela-linha', title: 'Visualizar e Gerir', content: 'Clique num registro da tabela para ver a assinatura e o balanço do caixa, ou acesse os botões para editar/excluir.', placement: 'top' });
          }

          if (stepIndex >= steps.length) {
              encerrarTour();
              return;
          }

          const step = steps[stepIndex];
          const el = document.getElementById(step.id);
          
          if (!el || window.getComputedStyle(el).display === 'none') {
              mostrarPassoTour(stepIndex + 1);
              return;
          }

          el.classList.add('tour-highlight');
          
          if (step.id === 'tour-grafico') {
              el.closest('.bg-custom-darker').classList.add('tour-highlight-parent');
          } else if (step.id === 'tour-resumo') {
              el.closest('.bg-custom-darker').classList.add('tour-highlight-parent');
          } else if (step.id === 'tour-tabela-linha') {
              el.closest('tr').classList.add('tour-highlight-parent');
          } else if (['tour-entrada', 'tour-saida', 'tour-relatorio'].includes(step.id)) {
              el.closest('.d-flex.gap-2').classList.add('tour-highlight-parent');
          }

          const isLast = stepIndex === steps.length - 1;
          const navHtml = \`
              <div class="d-flex justify-content-between mt-3 pt-2 border-top border-custom align-items-center">
                  <span class="text-white-50 fw-bold" style="font-size: 0.7rem;">\${stepIndex + 1} de \${steps.length}</span>
                  <div>
                      <button class="btn btn-sm btn-outline-secondary py-0 px-2 text-white shadow-sm" style="font-size: 0.7rem; pointer-events: auto;" onclick="encerrarTour()">Sair</button>
                      <button class="btn btn-sm btn-primary py-0 px-2 fw-bold text-dark ms-1 shadow-sm" style="font-size: 0.7rem; pointer-events: auto;" onclick="mostrarPassoTour(\${stepIndex + 1})">\${isLast ? 'Concluir' : 'Próximo'}</button>
                  </div>
              </div>
          \`;

          const popover = new bootstrap.Popover(el, {
              title: '<i class="ph-fill ph-info text-accent me-2"></i>' + step.title,
              content: '<div style="font-size: 0.75rem;" class="text-white-50">' + step.content + '</div>' + navHtml,
              placement: step.placement,
              trigger: 'manual',
              html: true,
              sanitize: false,
              customClass: 'tour-popover shadow-lg'
          });
          
          popover.show();
          tourPopovers.push(popover);
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };

      window.encerrarTour = function() {
          if (tourPopovers.length > 0) {
              tourPopovers.forEach(p => p.dispose());
              tourPopovers = [];
          }
          document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
          document.querySelectorAll('.tour-highlight-parent').forEach(el => el.classList.remove('tour-highlight-parent'));
          const backdrop = document.getElementById('tourBackdrop');
          if (backdrop) backdrop.style.display = 'none';
          
          document.getElementById('btnAjudaTour').classList.remove('text-accent');
          tourAtivo = false;
      };

      // =======================================================================
      // FUNÇÕES DE VISIBILIDADE FINANCEIRA (OLHO) - PADRÃO OCULTO
      // =======================================================================
      window.toggleVisibilidadeFinanceira = function() {
          const isOculto = localStorage.getItem('ocultar_valores_financeiros') !== 'false';
          localStorage.setItem('ocultar_valores_financeiros', !isOculto);
          aplicarVisibilidadeFinanceira();
      };

      window.aplicarVisibilidadeFinanceira = function() {
          const isOculto = localStorage.getItem('ocultar_valores_financeiros') !== 'false';
          const icone = document.getElementById('iconeVisibilidade');
          if (icone) {
              icone.className = isOculto ? 'ph-bold ph-eye-slash' : 'ph-bold ph-eye';
          }
          
          document.querySelectorAll('.valor-financeiro').forEach(el => {
              if (isOculto) {
                  el.innerText = 'R$ ****';
              } else {
                  el.innerText = el.getAttribute('data-valor');
              }
          });
      };

      // =======================================================================
      // CHECA URL POR COMPROVANTE NA CARGA INICIAL
      // =======================================================================
      document.addEventListener("DOMContentLoaded", () => {
          aplicarVisibilidadeFinanceira();
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
      // LÓGICA DO GRÁFICO E APPLE SPINNER LOCAL
      // =======================================================================
      let chartFluxo = null;
      let visaoGraficoAtual = 'dia'; 
      let periodosDisponiveisGrafico = [];

      function getAppleSpinner(scale = 1) {
          return \`<div class="apple-spinner" style="transform: scale(\${scale});">
                    <div></div><div></div><div></div><div></div><div></div><div></div>
                    <div></div><div></div><div></div><div></div><div></div><div></div>
                  </div>\`;
      }

      function mostrarSpinnerLocal(elementId, texto = '') {
          const el = document.getElementById(elementId);
          if (!el) return;
          if (el.querySelector('.local-spinner-overlay')) return;
          
          const overlay = document.createElement('div');
          overlay.className = 'local-spinner-overlay text-white-50';
          overlay.innerHTML = getAppleSpinner(1.2) + (texto ? \`<span class="mt-3 fw-medium" style="font-size: 0.8rem;">\${texto}</span>\` : '');
          el.appendChild(overlay);
      }

      function ocultarSpinnerLocal(elementId) {
          const el = document.getElementById(elementId);
          if (!el) return;
          const overlay = el.querySelector('.local-spinner-overlay');
          if (overlay) overlay.remove();
      }

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
              btn.innerHTML = '<i class="ph-bold ph-calendar-blank me-1 text-accent"></i> Ver por Mês';
          } else {
              btn.innerHTML = '<i class="ph-bold ph-calendar-blank me-1 text-accent"></i> Ver por Dia';
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

          mostrarSpinnerLocal('containerGrafico', 'Atualizando Gráfico...');

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
          } finally {
              ocultarSpinnerLocal('containerGrafico');
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

      function mostrarSkeletonGlobais() {
          mostrarSpinnerLocal('painel-resumo-container', 'Calculando...');
          mostrarSpinnerLocal('containerGrafico', 'Atualizando Gráfico...');
          mostrarSpinnerLocal('containerTabela', 'Atualizando Tabela...');
      }

      function ocultarSkeletonGlobais() {
          ocultarSpinnerLocal('painel-resumo-container');
          ocultarSpinnerLocal('containerGrafico');
          ocultarSpinnerLocal('containerTabela');
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
      // AJAX PARA FILTROS E PAGINAÇÃO 
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
                  if (typeof aplicarVisibilidadeFinanceira === 'function') aplicarVisibilidadeFinanceira();

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
                  if (typeof aplicarVisibilidadeFinanceira === 'function') aplicarVisibilidadeFinanceira();

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
          const staticModals = ['modalRelatorio', 'novaEntradaModal', 'novaSaidaModal', 'sidebarMenu', 'modalImprimirComprovante'];
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
          
          ctx.strokeStyle = "#1f1f1f"; 
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
                  if (typeof aplicarVisibilidadeFinanceira === 'function') aplicarVisibilidadeFinanceira();

                  form.reset();
                  if (form.id === 'formEntrada') limparAssinatura('canvasEntrada');
                  if (form.id === 'formSaida') limparAssinatura('canvasSaida');
                  
                  carregarFiltrosGrafico();

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
      function baixarRelatorioExcel() {
          const dataInicio = document.getElementById('relatorioDataInicio').value;
          const dataFim = document.getElementById('relatorioDataFim').value;
          
          const colsMarcadas = Array.from(document.querySelectorAll('.chk-coluna:checked')).map(cb => cb.value).join(',');
          
          if (!colsMarcadas) {
              mostrarToast('erro', 'Atenção', 'Selecione pelo menos uma coluna para exportar no relatório.');
              return;
          }
          
          let url = \`/exportar/movimentacoes?cols=\${colsMarcadas}\`;
          
          if(dataInicio) url += \`&data_inicio=\${dataInicio}\`;
          if(dataFim) url += \`&data_fim=\${dataFim}\`;

          window.open(url, '_blank');

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