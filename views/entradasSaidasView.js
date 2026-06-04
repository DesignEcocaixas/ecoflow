// views/entradasSaidasView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");

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

  // Valores reais vindos diretamente do banco de dados (ignorando a paginação)
  const totalEntradas = paginacao.totalEntradas || 0;
  const totalSaidas = paginacao.totalSaidas || 0;
  const totalCaixaCalc = paginacao.totalCaixa || 0;

  // Se o caixa for menor que 0, trava em 0
  const displayTotalCaixa = totalCaixaCalc < 0 ? 0 : totalCaixaCalc;
  const corTotal = displayTotalCaixa > 0 ? 'success' : 'secondary';
  const sinalTotal = displayTotalCaixa > 0 ? '+' : '';

  // GERAR AS LINHAS DA TABELA
  const linhasTabela = movimentacoes.map(m => {
    const isEntrada = m.tipo === 'entrada';
    const corClass = isEntrada ? 'success' : 'danger';
    const sinal = isEntrada ? '+' : '-';
    const icone = isEntrada ? 'fa-arrow-down' : 'fa-arrow-up';

    return `
    <tr style="cursor: pointer;" class="align-middle table-hover-row" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('detalheModal${m.id}')).show();">
      <td class="text-muted fw-medium py-1 px-3"><i class="fa-regular fa-calendar me-1"></i> ${fmtData(m.data)}</td>
      <td class="py-1 px-3">
        <span class="badge bg-${corClass}-subtle text-${corClass} border border-${corClass}-subtle px-2 py-1" style="width: 85px; display: inline-block; text-align: center;">
          <i class="fa-solid ${icone} me-1"></i> ${isEntrada ? 'Entrada' : 'Saída'}
        </span>
      </td>
      <td class="py-1 px-3">
        <div class="text-truncate text-dark fw-medium" style="max-width: 250px;" title="${m.descricao}">
          ${m.descricao || "Sem descrição"}
        </div>
      </td>
      <td class="py-1 px-3">
        <div class="text-truncate text-dark" style="max-width: 200px;" title="Assinante: ${m.nome_assinante || 'Não informado'}">
          <i class="fa-solid fa-pen-nib text-muted me-1"></i> ${m.nome_assinante || 'Não informado'}
        </div>
      </td>
      <td class="text-end fw-bold text-${corClass} py-1 px-3">
         ${sinal} R$ ${fmtMoeda(m.valor)}
      </td>
      <td class="text-center py-1 px-3">
        <div class="btn-group">
          <button type="button" class="btn btn-sm btn-light border text-warning py-1 px-2 shadow-sm" 
                  onclick="event.stopPropagation(); bootstrap.Modal.getOrCreateInstance(document.getElementById('editarModal${m.id}')).show();" title="Editar">
            <i class="fa-solid fa-pen" style="font-size:0.75rem;"></i>
          </button>
          <button type="button" class="btn btn-sm btn-light border text-danger py-1 px-2 shadow-sm" 
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
        <div class="modal-content erp-modal border-0">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark">Detalhes da Movimentação</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="text-center mb-4">
              <span class="badge bg-${corClass} mb-2 px-3 py-2" style="font-size:0.8rem; letter-spacing: 1px;">
                MOVIMENTAÇÃO DE ${isEntrada ? 'ENTRADA' : 'SAÍDA'}
              </span>
              <h2 class="fw-bold text-${corClass}">${sinal} R$ ${fmtMoeda(m.valor)}</h2>
              <p class="text-muted mb-0"><i class="fa-regular fa-calendar me-1"></i> ${fmtData(m.data)}</p>
            </div>
            
            <div class="bg-light p-3 rounded-3 mb-3 border">
              <h6 class="fw-bold" style="font-size:0.85rem;">Descrição:</h6>
              <p class="mb-2 text-dark" style="font-size:0.85rem;">${m.descricao}</p>
              
              <h6 class="fw-bold mt-3" style="font-size:0.85rem;">Observações:</h6>
              <p class="mb-0 text-muted" style="font-size:0.8rem;">${m.observacao || "Nenhuma observação registada."}</p>
              
              <h6 class="fw-bold mt-3" style="font-size:0.85rem;">Registrado no sistema por:</h6>
              <p class="mb-0 text-muted" style="font-size:0.8rem;"><i class="fa-solid fa-desktop me-1"></i> ${m.responsavel || "Sistema"}</p>
            </div>

            <div class="border rounded-3 p-3 text-center bg-white shadow-sm">
              <h6 class="fw-bold text-dark mb-2" style="font-size:0.85rem;">Assinatura de: ${m.nome_assinante || "Não informado"}</h6>
              ${m.assinatura_base64 
                ? `<img src="${m.assinatura_base64}" alt="Assinatura" style="max-width: 100%; height: auto; max-height: 150px; border-bottom: 2px solid #eee; padding-bottom: 5px;">` 
                : `<div class="text-muted py-3" style="font-size:0.8rem;"><i class="fa-solid fa-signature fa-2x opacity-25 mb-2"></i><br>Nenhuma assinatura capturada.</div>`
              }
            </div>

          </div>
          <div class="modal-footer bg-light border-0">
             <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Fechar Detalhes</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="editarModal${m.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form method="POST" action="/movimentacoes/editar/${m.id}" class="modal-content erp-modal" onsubmit="prepararSubmissaoSimples(event, this, 'Registo Atualizado!')">
          <div class="modal-header bg-light">
            <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-pen-to-square text-warning me-2"></i> Editar Registo</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-white">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Data</label>
                <input type="date" name="data" class="form-control form-control-sm" value="${String(m.data).slice(0,10)}" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Valor (R$)</label>
                <input type="text" name="valor" class="form-control form-control-sm mask-moeda" oninput="maskMoeda(this)" value="${fmtMoeda(m.valor)}" required>
              </div>
              <div class="col-12">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Nome de quem ${isEntrada ? 'entregou' : 'retirou'}</label>
                <input type="text" name="nome_assinante" class="form-control form-control-sm" value="${m.nome_assinante || ""}" required placeholder="Nome do assinante">
              </div>
              <div class="col-12">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Descrição</label>
                <input type="text" name="descricao" class="form-control form-control-sm" value="${m.descricao}" required>
              </div>
              <div class="col-12">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Observações</label>
                <textarea name="observacao" class="form-control form-control-sm" rows="2">${m.observacao || ""}</textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-light border-0 d-flex flex-nowrap">
             <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
             <button type="submit" class="btn btn-sm btn-primary w-100"><i class="fa-solid fa-save me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${m.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0">
          <form method="POST" action="/movimentacoes/excluir/${m.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Registo Excluído!')">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-circle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="fw-bold">Excluir este registo?</h6>
              <p class="text-muted mb-0" style="font-size:0.8rem;">Esta ação é irreversível.</p>
            </div>
            <div class="modal-footer bg-light border-0 d-flex flex-nowrap">
              <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Não</button>
              <button type="submit" class="btn btn-sm btn-danger w-100">Sim, Excluir</button>
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
          html += `<li class="page-item"><a class="page-link text-dark" href="/entradas-saidas?page=${ultima + 1}${baseQueryString}">${ultima + 1}</a></li>`;
        } else if (p - ultima > 2) {
          html += `<li class="page-item disabled"><span class="page-link text-muted border-0 bg-transparent">...</span></li>`;
        }
      }
      html += `<li class="page-item ${p === page ? "active" : ""}"><a class="page-link ${p === page ? "fw-bold text-dark" : "text-dark"}" href="/entradas-saidas?page=${p}${baseQueryString}">${p}</a></li>`;
      ultima = p;
    });

    return html;
  })();

  const paginacaoHtml = totalPages > 1 ? `
    <nav aria-label="Paginação" class="mt-4">
      <ul class="pagination pagination-sm justify-content-center mb-4">
        <li class="page-item ${page <= 1 ? "disabled" : ""}">
          <a class="page-link text-dark" href="/entradas-saidas?page=${page - 1}${baseQueryString}">&laquo;</a>
        </li>
        ${pageLinks}
        <li class="page-item ${page >= totalPages ? "disabled" : ""}">
          <a class="page-link text-dark" href="/entradas-saidas?page=${page + 1}${baseQueryString}">&raquo;</a>
        </li>
      </ul>
    </nav>
  ` : "";

  const menuHTML = menuLateral(user, "/entradas-saidas");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Entradas e Saídas | ERP Ecoflow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      body { display: flex; height: 100vh; margin: 0; background-color: #f4f7f6; font-family: 'Segoe UI', sans-serif; }
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
      
      .erp-modal { border-radius: 12px; border: none; }
      
      .signature-pad {
          border: 2px dashed #ccc;
          border-radius: 8px;
          background-color: #fff;
          cursor: crosshair;
          width: 100%;
          height: 180px;
          touch-action: none;
      }

      /* Hover forcado para as linhas da tabela */
      .table-hover-row { transition: background-color 0.2s; }
      .table-hover-row:hover > td {
          background-color: rgba(13, 87, 73, 0.06) !important;
      }

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
              <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-money-bill-transfer text-muted me-2"></i>Entradas e Saídas</h4>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Controle financeiro e assinaturas</span>
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
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          
          <div class="d-flex align-items-center gap-2">
            <h6 class="mb-0 text-muted" style="font-size:0.85rem;"><i class="fa-solid fa-list-ul me-1"></i> Histórico de Movimentações</h6>
            <span class="badge bg-success-subtle text-success border border-success-subtle shadow-sm">${mesAtualStr}</span>
          </div>
          
          <div class="d-flex gap-4 align-items-center w-100 w-md-auto flex-wrap justify-content-start">
            <div class="text-end pe-2 d-none d-sm-block">
               <span class="text-muted fw-bold" style="font-size: 0.75rem;">Total em Caixa</span><br>
               <strong class="text-${corTotal}" style="font-size: 1.5rem;">${sinalTotal ? sinalTotal + ' ' : ''}R$ ${fmtMoeda(displayTotalCaixa)}</strong>
            </div>
          
            <div class="text-end border-end pe-3 d-none d-lg-block pt-2">
               <span class="text-muted fw-bold" style="font-size: 0.70rem;">Entradas</span><br>
               <strong class="text-success" style="font-size: 0.80rem;">+ R$ ${fmtMoeda(totalEntradas)}</strong>
            </div>

            <div class="text-end border-end pe-3 d-none d-sm-block pt-2">
               <span class="text-muted fw-bold" style="font-size: 0.70rem;">Saídas</span><br>
               <strong class="text-danger" style="font-size: 0.80rem;">- R$ ${fmtMoeda(totalSaidas)}</strong>
            </div>

            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-success shadow-sm flex-grow-1 flex-sm-grow-0 px-3" data-bs-toggle="modal" data-bs-target="#novaEntradaModal">
                    <i class="fa-solid fa-arrow-down me-1"></i> Entrada
                </button>
                <button class="btn btn-sm btn-danger shadow-sm flex-grow-1 flex-sm-grow-0 px-3" data-bs-toggle="modal" data-bs-target="#novaSaidaModal">
                    <i class="fa-solid fa-arrow-up me-1"></i> Retirada
                </button>
                <button class="btn btn-sm btn-outline-success shadow-sm px-3 flex-grow-1 flex-sm-grow-0" onclick="abrirModalRelatorio()" title="Exportar para Excel">
                    <i class="fa-solid fa-file-excel me-1"></i> Relatório
                </button>
            </div>
          </div>
        </div>

        <form class="row g-2 align-items-end mt-2 border-top pt-3" method="GET" action="/entradas-saidas">
            <div class="col-12 col-md-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Período De</label>
                <input type="date" name="data_inicio" class="form-control form-control-sm" value="${filtros.data_inicio || ''}">
            </div>
            <div class="col-12 col-md-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Até</label>
                <input type="date" name="data_fim" class="form-control form-control-sm" value="${filtros.data_fim || ''}">
            </div>
            <div class="col-12 col-md-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Tipo de Movimentação</label>
                <select name="tipo" class="form-select form-select-sm">
                    <option value="">Tudo (Entradas e Saídas)</option>
                    <option value="entrada" ${filtros.tipo === 'entrada' ? 'selected' : ''}>Apenas Entradas</option>
                    <option value="saida" ${filtros.tipo === 'saida' ? 'selected' : ''}>Apenas Saídas</option>
                </select>
            </div>
            <div class="col-12 col-md-3 d-flex gap-2">
                <button type="submit" class="btn btn-sm btn-success flex-grow-1 shadow-sm"><i class="fa-solid fa-filter me-1"></i> Filtrar</button>
                <a href="/entradas-saidas" class="btn btn-sm btn-light border flex-grow-1 text-center shadow-sm"><i class="fa-solid fa-xmark"></i></a>
            </div>
        </form>

      </div>

      ${movimentacoes.length > 0 
        ? `<div class="table-responsive bg-white rounded-3 shadow-sm border border-light mb-4">
             <table class="table table-sm align-middle mb-0" style="font-size: 0.85rem; border-collapse: separate; border-spacing: 0;">
               <thead class="table-light">
                 <tr>
                   <th class="py-2 px-3 fw-bold text-muted border-0">Data</th>
                   <th class="py-2 px-3 fw-bold text-muted border-0">Tipo</th>
                   <th class="py-2 px-3 fw-bold text-muted border-0">Descrição</th>
                   <th class="py-2 px-3 fw-bold text-muted border-0">Assinante</th>
                   <th class="py-2 px-3 fw-bold text-muted border-0 text-end">Valor (R$)</th>
                   <th class="py-2 px-3 fw-bold text-muted border-0 text-center">Ações</th>
                 </tr>
               </thead>
               <tbody class="border-top-0">
                 ${linhasTabela}
               </tbody>
             </table>
           </div>` 
        : `<div class="col-12 text-center text-muted mt-4"><i class="fa-solid fa-wallet fa-3x opacity-25 mb-3"></i><p style="font-size:0.9rem;">Nenhuma movimentação registada para este filtro.</p></div>`
      }

      ${paginacaoHtml}
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
            <p class="mb-4">Bem-vindo ao módulo de <strong>Entradas e Saídas</strong>. Siga as orientações abaixo para um controle financeiro eficaz:</p>
            
            <ul class="list-group list-group-flush mb-4">
              <li class="list-group-item bg-transparent px-0 border-light pb-3">
                <strong class="text-dark d-block mb-1"><i class="fa-solid fa-plus-circle text-success me-2"></i> 1. Registar Movimentação</strong>
                Clique em "Entrada" ou "Retirada" para adicionar um novo registo. É obrigatório informar o valor, a descrição, o nome de quem entregou/retirou o valor e <strong>recolher a assinatura na tela</strong>.
              </li>
              <li class="list-group-item bg-transparent px-0 border-light py-3">
                <strong class="text-dark d-block mb-1"><i class="fa-solid fa-wallet text-primary me-2"></i> 2. Saldo em Caixa</strong>
                O painel superior exibe o "Total em Caixa". Este valor é calculado automaticamente, somando todas as entradas e subtraindo todas as retiradas presentes no sistema.
              </li>
              <li class="list-group-item bg-transparent px-0 border-light py-3">
                <strong class="text-dark d-block mb-1"><i class="fa-solid fa-magnifying-glass text-dark me-2"></i> 3. Detalhes e Ações</strong>
                Clique em cima de qualquer registo na tabela para ver os detalhes completos e confirmar a <strong>assinatura salva</strong>. Caso note algum erro, pode usar os botões de editar (<i class="fa-solid fa-pen text-warning mx-1"></i>) ou excluir (<i class="fa-solid fa-trash text-danger mx-1"></i>) na respetiva linha da tabela.
              </li>
              <li class="list-group-item bg-transparent px-0 border-light pt-3">
                <strong class="text-dark d-block mb-1"><i class="fa-solid fa-file-excel text-success me-2"></i> 4. Exportar Relatório</strong>
                Clique em "Relatório" para fazer o download imediato de uma planilha Excel com todo o histórico de caixa e as informações dos assinantes.
              </li>
            </ul>

            <div class="alert alert-info border-0 shadow-sm mb-0">
              <i class="fa-solid fa-lightbulb me-2"></i> <strong>Dica de Assinatura:</strong> Caso a assinatura não fique legível à primeira tentativa, basta clicar em "Limpar Assinatura" logo abaixo do quadro e desenhar de novo antes de guardar.
            </div>
          </div>
          <div class="modal-footer border-0 bg-light">
            <button type="button" class="btn btn-primary px-4 fw-bold shadow-sm" data-bs-dismiss="modal">Entendi</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="novaEntradaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form id="formEntrada" method="POST" action="/movimentacoes/novo" class="modal-content erp-modal" onsubmit="prepararEnvio(event, this, 'Entrada Registada!')">
          <input type="hidden" name="tipo" value="entrada">
          <input type="hidden" name="assinatura_base64" id="assinaturaEntradaHidden">
          
          <div class="modal-header bg-success text-white border-0">
            <h6 class="modal-title fw-bold"><i class="fa-solid fa-arrow-down me-2"></i> Nova Entrada</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          
          <div class="modal-body p-4 bg-light">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Data</label>
                <input type="date" name="data" class="form-control form-control-sm" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Valor de Entrada (R$)</label>
                <input type="text" name="valor" class="form-control form-control-sm mask-moeda" oninput="maskMoeda(this)" required placeholder="0,00">
              </div>
              <div class="col-12">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Quem entregou o valor?</label>
                <input type="text" name="nome_assinante" class="form-control form-control-sm" required placeholder="Ex: João Silva">
              </div>
              <div class="col-12">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Descrição</label>
                <input type="text" name="descricao" class="form-control form-control-sm" required placeholder="Ex: Pagamento de serviço">
              </div>
              <div class="col-12">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Observações</label>
                <textarea name="observacao" class="form-control form-control-sm" rows="2" placeholder="Opcional..."></textarea>
              </div>
              <div class="col-12">
                <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Assinatura na Tela</label>
                <canvas id="canvasEntrada" class="signature-pad"></canvas>
                <div class="text-end mt-1">
                    <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0" onclick="limparAssinatura('canvasEntrada')">Limpar Assinatura</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-white border-top-0 d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success w-100"><i class="fa-solid fa-save me-1"></i> Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="novaSaidaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form id="formSaida" method="POST" action="/movimentacoes/novo" class="modal-content erp-modal" onsubmit="prepararEnvio(event, this, 'Retirada Registada!')">
          <input type="hidden" name="tipo" value="saida">
          <input type="hidden" name="assinatura_base64" id="assinaturaSaidaHidden">
          
          <div class="modal-header bg-danger text-white border-0">
            <h6 class="modal-title fw-bold"><i class="fa-solid fa-arrow-up me-2"></i> Nova Retirada</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          
          <div class="modal-body p-4 bg-light">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Data</label>
                <input type="date" name="data" class="form-control form-control-sm" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Valor da Retirada (R$)</label>
                <input type="text" name="valor" class="form-control form-control-sm mask-moeda" oninput="maskMoeda(this)" required placeholder="0,00">
              </div>
              <div class="col-12">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Nome de quem retirou o valor</label>
                <input type="text" name="nome_assinante" class="form-control form-control-sm" required placeholder="Ex: Maria Santos">
              </div>
              <div class="col-12">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Descrição</label>
                <input type="text" name="descricao" class="form-control form-control-sm" required placeholder="Ex: Compra de materiais">
              </div>
              <div class="col-12">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Observações</label>
                <textarea name="observacao" class="form-control form-control-sm" rows="2" placeholder="Opcional..."></textarea>
              </div>
              <div class="col-12">
                <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Assinatura na Tela</label>
                <canvas id="canvasSaida" class="signature-pad"></canvas>
                <div class="text-end mt-1">
                    <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0" onclick="limparAssinatura('canvasSaida')">Limpar Assinatura</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-white border-top-0 d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-danger w-100"><i class="fa-solid fa-save me-1"></i> Salvar</button>
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
                <p class="text-white mb-0" style="font-size:0.9rem; opacity: 0.9;" id="sucessoSub">A processar...</p>
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

    ${modais}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
      // FUNÇÃO GENÉRICA DE TOAST (SUCESSO E ERRO) CORRIGIDA
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

              // Destrói a instância anterior para limpar a configuração "congelada" do "A Processar"
              const oldInstance = bootstrap.Toast.getInstance(toastEl);
              if (oldInstance) oldInstance.dispose();

              // Cria uma nova instância forçando o fechamento automático em 5 segundos
              const toast = new bootstrap.Toast(toastEl, {
                  autohide: true,
                  delay: 5000
              });
              
              toast.show();
          }
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
          
          ctx.strokeStyle = "#000000";
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
      // SUBMISSÃO AJAX (SEM RELOAD DE PÁGINA)
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
          // Prepara a máscara para envio numérico
          const inputMoeda = form.querySelector('.mask-moeda');
          if(inputMoeda && inputMoeda.value) {
              inputMoeda.value = inputMoeda.value.replace(/\\./g, '').replace(',', '.');
          }

          // Fecha o modal que estava aberto
          const modalEl = form.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }

          // Ativa o Toast no modo contínuo de "A Processar"
          const successToastEl = document.getElementById('sucessoToast');
          document.getElementById('sucessoTitulo').innerText = "A Processar";
          document.getElementById('sucessoSub').innerText = "Por favor, aguarde...";
          
          successToastEl.setAttribute('data-bs-autohide', 'false'); 
          
          const timerEl = document.getElementById('sucessoTimer');
          if (timerEl) timerEl.style.display = 'none';

          const oldInstance = bootstrap.Toast.getInstance(successToastEl);
          if (oldInstance) oldInstance.dispose();
          const successToast = new bootstrap.Toast(successToastEl);
          successToast.show();

          isSubmitting = true;

          try {
              // Prepara os dados codificados como Formulário Clássico
              const formData = new URLSearchParams();
              new FormData(form).forEach((value, key) => formData.append(key, value));

              const response = await fetch(form.action, {
                  method: form.method || 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: formData.toString()
              });

              if (response.ok) {
                  // O Node.js retorna o HTML da página atualizada via redirecionamento implícito do fetch
                  const html = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  // 1. Atualizar conteúdo principal (Tabela, Saldo de Caixa e Paginação)
                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }

                  // 2. Atualizar todos os Modais Gerados Dinamicamente (Edição, Exclusão, Detalhes)
                  document.querySelectorAll('.modal').forEach(m => {
                      // Remove todos os modais da DOM, exceto os modais estáticos e de cadastro base
                      if (!['modalInstrucoes', 'modalRelatorio', 'novaEntradaModal', 'novaSaidaModal'].includes(m.id)) {
                          m.remove();
                      }
                  });
                  doc.querySelectorAll('.modal').forEach(m => {
                      if (!['modalInstrucoes', 'modalRelatorio', 'novaEntradaModal', 'novaSaidaModal'].includes(m.id)) {
                          document.body.appendChild(m.cloneNode(true));
                      }
                  });

                  // Limpar Formulário Original para caso o utilizador queira usar de novo
                  form.reset();
                  if (form.id === 'formEntrada') limparAssinatura('canvasEntrada');
                  if (form.id === 'formSaida') limparAssinatura('canvasSaida');

                  // Disparar o toast verde de sucesso definitivo
                  mostrarToast('sucesso', 'Concluído!', titleMsg);
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