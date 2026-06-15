// views/diaristasView.js
const menuLateral = require("./menuLateral");

function diaristasView(usuario, diaristas = [], pastas = [], filtros = {}, paginacao = {}, taxas = {}) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  const fmtData = (d) => {
    try {
      if(!d) return "-";
      const dt = new Date(d);
      dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
      return dt.toLocaleDateString("pt-BR");
    } catch {
      return d || "-";
    }
  };

  const fmtMoeda = (n) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const valPadrao = taxas.diaria_padrao || 85.00;
  const valDomingo = taxas.diaria_domingo || 95.00;
  const valLimpeza = taxas.diaria_limpeza || 75.00;

  // Arrays de Dados Serializados para o JavaScript Frontend
  const diaristasJson = JSON.stringify(diaristas.map(d => ({
      id: d.id, nome: d.nome, foto: d.foto ? `/uploads/${d.foto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(d.nome)}&background=0D5749&color=fff`
  })));

  const pastasJson = JSON.stringify(pastas.map(p => {
      let dtStr = '';
      if (p.data_criacao) {
          const dt = new Date(p.data_criacao);
          dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
          dtStr = dt.toLocaleDateString("pt-BR");
      }
      return {
          id: p.id,
          colaborador_id: p.colaborador_id,
          nome_colaborador: p.nome_colaborador,
          pix: p.pix || 'Não cadastrado',
          banco: p.banco || '',
          cpf: p.cpf || 'Não cadastrado', // Adicionado para o envio do WhatsApp
          data_abertura: dtStr,
          status: p.status,
          comprovante: p.comprovante,
          valor_total: p.valor_total,
          itens: p.itens || []
      };
  }));

  // =========================================================================
  // GERAÇÃO DOS CARDS DE DIARISTAS (CRIAR PASTA)
  // =========================================================================
  const cardsDiaristas = diaristas.length > 0 ? diaristas.map(d => {
      const fotoUrl = d.foto ? `/uploads/${d.foto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(d.nome)}&background=0D5749&color=fff`;
      const pixStatus = d.pix && d.pix.trim() !== '' ? '<span class="text-success"><i class="fa-brands fa-pix"></i> Cadastrado</span>' : '<span class="text-danger"><i class="fa-brands fa-pix"></i> Pendente</span>';

      return `
         <div class="col-12 col-sm-6 col-md-4 col-xl-3 diarista-card-item">
             <div class="card erp-card shadow-sm h-100 bg-white" style="cursor: pointer;" onclick="abrirModalCriarPasta('${d.id}')" title="Abrir uma nova pasta de fechamento para este colaborador">
                 <div class="card-body text-center p-4 d-flex flex-column justify-content-center align-items-center">
                     <div class="position-relative mb-3">
                         <img src="${fotoUrl}" class="rounded-circle shadow-sm border border-2 border-light" style="width: 80px; height: 80px; object-fit: cover;">
                         <span class="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle" title="Ativo"></span>
                     </div>
                     <h6 class="fw-bold text-dark mb-1 w-100 text-truncate px-2" title="${d.nome}">${d.nome}</h6>
                     <span class="badge bg-secondary mb-3 px-3 py-1" style="font-size: 0.65rem; letter-spacing: 1px;">DIARISTA</span>
                     
                     <div class="w-100 border-top pt-3 text-muted" style="font-size: 0.75rem;">
                         <div class="mb-1 text-truncate"><i class="fa-solid fa-id-card opacity-75 me-1"></i> CPF: ${d.cpf || 'N/A'}</div>
                         <div class="text-truncate">${pixStatus}</div>
                     </div>
                 </div>
             </div>
         </div>
      `;
  }).join('') : `<div class="col-12 text-center text-muted py-5"><i class="fa-solid fa-users-slash fa-3x opacity-25 mb-3"></i><p>Nenhum diarista cadastrado no sistema.</p></div>`;

  // =========================================================================
  // GERAÇÃO DO HISTÓRICO DE PASTAS
  // =========================================================================
  const modaisDinamicosExcluir = [];
  const linhasPastas = pastas.length > 0 ? pastas.map(p => {
      const fotoUrl = p.foto_colab ? `/uploads/${p.foto_colab}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome_colaborador || 'C')}&background=0D5749&color=fff`;
      
      let badgeStatus = p.status === 'PAGO' 
        ? '<span class="badge bg-success bg-opacity-10 text-success border border-success"><i class="fa-solid fa-check-double"></i> Paga (Fechada)</span>' 
        : '<span class="badge bg-warning bg-opacity-10 text-dark border border-warning"><i class="fa-solid fa-folder-open"></i> Aberta</span>';

      modaisDinamicosExcluir.push(`
        <div class="modal fade" id="excluirPastaModal${p.id}" tabindex="-1">
            <div class="modal-dialog modal-sm modal-dialog-centered">
                <form method="POST" action="/diaristas/pasta/excluir/${p.id}" class="modal-content border-0 shadow-lg erp-modal" onsubmit="prepararSubmissaoSimples(event, this, 'Pasta Excluída!')">
                    <div class="modal-body p-4 text-center">
                        <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                        <h6 class="fw-bold text-dark mb-2">Excluir Pasta?</h6>
                        <p class="text-muted mb-0" style="font-size:0.85rem;">Esta ação apagará <b>todas as diárias</b> dentro desta pasta de <b>${p.nome_colaborador}</b>!</p>
                    </div>
                    <div class="modal-footer bg-light border-0 justify-content-center d-flex flex-nowrap">
                        <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal" onclick="event.stopPropagation();">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold" onclick="event.stopPropagation();">Excluir Tudo</button>
                    </div>
                </form>
            </div>
        </div>
      `);

      return `
        <tr class="align-middle table-hover-row" style="cursor: pointer;" onclick="abrirPastaFechamento('${p.id}')" title="Clique para gerenciar as diárias desta pasta">
            <td class="py-3 px-3">
                <div class="d-flex align-items-center">
                    <img src="${fotoUrl}" alt="Foto" class="rounded-circle me-3 border shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">
                    <div>
                        <strong class="text-dark d-block" style="font-size:0.9rem;">${p.nome_colaborador}</strong>
                        <span class="text-muted" style="font-size:0.75rem;">Pasta #${p.id}</span>
                    </div>
                </div>
            </td>
            <td class="text-muted py-3 px-3 fw-medium"><i class="fa-regular fa-folder-open me-1"></i> ${fmtData(p.data_criacao)}</td>
            <td class="py-3 px-3 text-center">
                <span class="badge bg-dark bg-opacity-10 text-dark border border-dark border-opacity-25 shadow-sm" style="font-size:0.8rem;"><i class="fa-solid fa-calendar-day text-primary me-1"></i> ${p.qtd_diarias} Registros</span>
            </td>
            <td class="text-success fw-bold py-3 px-3" style="font-size:0.95rem;">R$ ${fmtMoeda(p.valor_total)}</td>
            <td class="py-3 px-3 text-center">${badgeStatus}</td>
            <td class="text-end py-3 px-3 text-nowrap" onclick="event.stopPropagation();">
                <button type="button" class="btn btn-sm btn-primary shadow-sm fw-bold ms-1" onclick="abrirPastaFechamento('${p.id}')" title="Gerenciar Pasta"><i class="fa-solid fa-arrow-right-to-bracket me-1"></i> Abrir</button>
                <button type="button" class="btn btn-sm btn-light border text-danger shadow-sm ms-1" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('excluirPastaModal${p.id}')).show();" title="Excluir Pasta"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
      `;
  }).join('') : `<tr><td colspan="6" class="text-center text-muted py-5 text-center-empty"><i class="fa-solid fa-folder-open fa-3x opacity-25 mb-3"></i><p>Nenhuma pasta de fechamento encontrada no período.</p></td></tr>`;

  // Paginação
  const qsParams = [];
  if (filtros.data_inicio) qsParams.push(`data_inicio=${filtros.data_inicio}`);
  if (filtros.data_fim) qsParams.push(`data_fim=${filtros.data_fim}`);
  const baseQueryString = qsParams.length > 0 ? '&' + qsParams.join('&') : '';

  const paginacaoHtml = (() => {
      if (totalPages <= 1) return "";
      let html = `<nav class="mt-4"><ul class="pagination pagination-sm justify-content-center mb-4">`;
      html += `<li class="page-item ${page <= 1 ? "disabled" : ""}"><a class="page-link text-dark" href="/diaristas?page=${page - 1}${baseQueryString}" onclick="navegarPagina(event, this.href)">«</a></li>`;
      
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);
      
      if (start > 1) {
          html += `<li class="page-item"><a class="page-link text-dark" href="/diaristas?page=1${baseQueryString}" onclick="navegarPagina(event, this.href)">1</a></li>`;
          if (start > 2) html += `<li class="page-item disabled"><span class="page-link text-muted">...</span></li>`;
      }
      for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === page ? "active" : ""}"><a class="page-link ${i === page ? "fw-bold text-white bg-success border-success" : "text-dark"}" href="/diaristas?page=${i}${baseQueryString}" onclick="navegarPagina(event, this.href)">${i}</a></li>`;
      }
      if (end < totalPages) {
          if (end < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link text-muted">...</span></li>`;
          html += `<li class="page-item"><a class="page-link text-dark" href="/diaristas?page=${totalPages}${baseQueryString}" onclick="navegarPagina(event, this.href)">${totalPages}</a></li>`;
      }
      
      html += `<li class="page-item ${page >= totalPages ? "disabled" : ""}"><a class="page-link text-dark" href="/diaristas?page=${page + 1}${baseQueryString}" onclick="navegarPagina(event, this.href)">»</a></li>`;
      html += `</ul></nav>`;
      return html;
  })();

  const menuHTML = menuLateral(user, "/diaristas");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Controle de Diaristas | ERP Ecoflow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
    <style>
      body { display: flex; height: 100vh; margin: 0; background-color: #f4f7f6; font-family: 'Segoe UI', sans-serif; }
      .sidebar { width: 240px; background-color: #0D5749; color: white; padding: 20px; display: flex; flex-direction: column;}
      .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s;}
      .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
      .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; }
      
      .erp-card { transition: all 0.3s ease; border-radius: 12px; border: 1px solid #eaeaea; }
      .erp-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important; border-color: #0D5749; }
      
      .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      .table-hover-row { transition: background-color 0.2s; }
      .table-hover-row:hover > td { background-color: rgba(13, 87, 73, 0.06) !important; }

      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 6px; background: rgba(255, 255, 255, 0.4); width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      .skeleton-view { background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%); background-size: 200% 100%; animation: skeleton-loading-view 1.5s infinite linear; border-radius: 4px; }
      .skeleton-text-view { height: 16px; width: 100%; margin-bottom: 8px; }
      .skeleton-avatar-view { height: 40px; width: 40px; border-radius: 50%; }
      @keyframes skeleton-loading-view { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 16px; }
      }
    </style>
  </head>
  <body>

    <script id="diaristasData" type="application/json">${diaristasJson}</script>
    <script id="pastasData" type="application/json">${pastasJson}</script>

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
              <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-users-gear text-muted me-2"></i>Controle de Diaristas</h4>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Equipe avulsa, limpeza e serviços gerais</span>
            </div>
        </div>
      </div>

      <h6 class="fw-bold text-dark mb-3"><i class="fa-solid fa-address-card text-primary me-2"></i> Diaristas (Clique para Iniciar uma Pasta de Fechamento)</h6>
      <div class="row g-3" id="diaristasGrid">
         ${cardsDiaristas}
      </div>
      <div id="paginationCards" class="d-flex justify-content-center mt-4 mb-5"></div>

      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 border-top pt-4">
         <h6 class="fw-bold text-dark mb-0"><i class="fa-solid fa-folder-tree text-success me-2"></i> Histórico de Pastas de Fechamento</h6>
         <div class="d-flex gap-2 flex-wrap">
            <form id="formFiltro" class="d-flex gap-2 flex-wrap" method="GET" action="/diaristas" onsubmit="prepararBuscaSimples(event, this, 'Filtros Aplicados!')">
                <div><input type="date" name="data_inicio" class="form-control form-control-sm" value="${filtros.data_inicio || ''}" title="Data Inicial"></div>
                <div><input type="date" name="data_fim" class="form-control form-control-sm" value="${filtros.data_fim || ''}" title="Data Final"></div>
                <button type="submit" class="btn btn-sm btn-outline-primary"><i class="fa-solid fa-filter"></i></button>
                <button type="button" class="btn btn-sm btn-light border" onclick="limparFiltros()"><i class="fa-solid fa-eraser"></i></button>
            </form>
            <button class="btn btn-sm btn-outline-dark fw-bold shadow-sm bg-white px-3" data-bs-toggle="modal" data-bs-target="#modalConfigTaxas" title="Configurar Diárias Diaristas">
               <i class="fa-solid fa-gear fs-6"></i> <span class="d-none d-sm-inline ms-1">Configurar Valores</span>
            </button>
         </div>
      </div>

      <div class="table-responsive bg-white rounded-3 shadow-sm border border-light mb-4" id="tabelaContainer">
         <table class="table table-hover align-middle mb-0" style="font-size: 0.85rem;">
           <thead class="table-light">
             <tr>
               <th class="py-2 px-3 fw-bold text-muted border-0">Colaborador / Pasta</th>
               <th class="py-2 px-3 fw-bold text-muted border-0">Data Abertura</th>
               <th class="py-2 px-3 fw-bold text-muted border-0 text-center">Registros Inseridos</th>
               <th class="py-2 px-3 fw-bold text-muted border-0">Valor Total</th>
               <th class="py-2 px-3 fw-bold text-muted border-0 text-center">Status da Pasta</th>
               <th class="py-2 px-3 fw-bold text-muted border-0 text-end">Ações</th>
             </tr>
           </thead>
           <tbody class="border-top-0">
             ${linhasPastas}
           </tbody>
         </table>
      </div>

      ${paginacaoHtml}
    </div>

    <div class="modal fade" id="modalConfigTaxas" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <form method="POST" action="/configuracoes/taxas" class="modal-content erp-modal shadow-lg" onsubmit="prepararSubmissaoSimples(event, this, 'Valores Salvos no Banco!')">
          <input type="hidden" name="redirect_to" value="/diaristas">
          <div class="modal-header bg-dark text-white border-0">
            <h6 class="modal-title fw-bold"><i class="fa-solid fa-gear me-2"></i> Valores das Diárias</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-light">
            <div class="mb-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Diária Padrão (R$)</label>
                <input type="number" step="0.01" name="diaria_padrao" class="form-control form-control-sm text-center fw-bold shadow-sm" value="${valPadrao}" required>
            </div>
            <div class="mb-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Diária aos Domingos (R$)</label>
                <input type="number" step="0.01" name="diaria_domingo" class="form-control form-control-sm text-center fw-bold shadow-sm" value="${valDomingo}" required>
            </div>
            <div class="mb-1">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Diária de Limpeza (R$)</label>
                <input type="number" step="0.01" name="diaria_limpeza" class="form-control form-control-sm text-center fw-bold shadow-sm" value="${valLimpeza}" required>
            </div>
          </div>
          <div class="modal-footer bg-white border-0">
            <button type="submit" class="btn btn-sm btn-success w-100 fw-bold shadow-sm">Salvar Valores Globais</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="modalCriarPasta" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <form method="POST" action="/diaristas/pasta/nova" class="modal-content erp-modal shadow-lg border-0" onsubmit="prepararSubmissaoSimples(event, this, 'Pasta de Fechamento Aberta!')">
          <input type="hidden" name="colaborador_id" id="inputCriarPastaColabId">
          <div class="modal-body p-4 text-center">
             <i class="fa-solid fa-folder-plus text-success fa-3x mb-3"></i>
             <h6 class="fw-bold text-dark mb-2">Abrir Nova Pasta?</h6>
             <p class="text-muted mb-0" style="font-size: 0.85rem;">Deseja iniciar um novo ciclo de lançamentos para <strong id="nomeCriarPasta" class="text-dark"></strong>?</p>
          </div>
          <div class="modal-footer bg-light border-0 d-flex flex-nowrap p-2">
             <button type="button" class="btn btn-sm btn-light border w-100" data-bs-dismiss="modal">Cancelar</button>
             <button type="submit" class="btn btn-sm btn-success w-100 fw-bold shadow-sm">Abrir Pasta</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="modalGerenciarPasta" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal shadow-lg border-0">
          <div class="modal-header bg-dark text-white border-0">
            <h6 class="modal-title fw-bold"><i class="fa-solid fa-folder-open text-warning me-2"></i> Pasta de Fechamento #<span id="visorPastaId"></span> - <span id="visorPastaNome"></span></h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0 bg-light">
             <div class="row g-0 h-100">
                 
                 <div class="col-12 col-md-4 p-4 bg-white border-end d-flex flex-column" id="ladoEsquerdoPasta">
                     <h6 class="fw-bold text-primary mb-3"><i class="fa-solid fa-plus-circle me-1"></i> Inserir Diária na Pasta</h6>
                     <form id="formInserirItem" method="POST" action="/diaristas/pasta/item" onsubmit="prepararSubmissaoSimples(event, this, 'Registro Inserido!')">
                         <input type="hidden" name="pasta_id" id="formItemPastaId">
                         <input type="hidden" name="colaborador_id" id="formItemColabId">

                         <div class="mb-3">
                             <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Data Executada</label>
                             <input type="date" name="data_servico" id="itemData" class="form-control form-control-sm shadow-sm" required onchange="verificarDataDomingoPasta(); calcularDiariaPasta()">
                         </div>
                         <div class="mb-3">
                             <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Qtd. Dias</label>
                             <input type="number" name="qtd_entregas" id="itemQtd" class="form-control form-control-sm text-center fw-bold shadow-sm" min="1" value="1" required oninput="calcularDiariaPasta()">
                         </div>
                         <div class="mb-3">
                             <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Tipo de Serviço</label>
                             <select name="tipo_viagem" id="itemTipoDiaria" class="form-select form-select-sm shadow-sm fw-bold text-dark" onchange="calcularDiariaPasta()">
                                 <option value="Diária Padrão">Diária Padrão (R$ ${fmtMoeda(valPadrao)})</option>
                                 <option value="Diária de Domingo">Diária de Domingo (R$ ${fmtMoeda(valDomingo)})</option>
                                 <option value="Diária de Limpeza">Diária de Limpeza (R$ ${fmtMoeda(valLimpeza)})</option>
                             </select>
                         </div>
                         <div class="mb-3 text-center p-3 bg-light rounded border border-light">
                             <span class="text-muted d-block mb-1" style="font-size:0.75rem;">Valor deste Registo</span>
                             <h4 class="fw-bold text-primary mb-0" id="itemValorVisor">R$ 0,00</h4>
                             <input type="hidden" name="valor_total" id="itemValorTotal" value="0.00">
                         </div>
                         <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm"><i class="fa-solid fa-arrow-down-short-wide me-1"></i> Adicionar à Lista</button>
                     </form>
                     
                     <div id="avisoPastaFechada" class="text-center mt-auto" style="display:none;">
                         <i class="fa-solid fa-lock fa-3x text-success opacity-50 mb-3"></i>
                         <p class="text-success fw-bold">Esta pasta já foi fechada e paga.</p>
                         <p class="text-muted small">Não é possível inserir novos registros. Abra uma nova pasta no menu principal se necessário.</p>
                     </div>
                 </div>
                 
                 <div class="col-12 col-md-8 d-flex flex-column">
                     
                     <div class="p-4 flex-grow-1" style="overflow-y: auto; max-height: 50vh;">
                         <h6 class="fw-bold text-dark mb-3 pb-2 border-bottom"><i class="fa-solid fa-list-check text-warning me-2"></i> Lançamentos desta Pasta</h6>
                         <div class="table-responsive bg-white shadow-sm border border-light rounded-3">
                             <table class="table table-hover align-middle mb-0" style="font-size: 0.8rem;">
                                 <thead class="table-light sticky-top">
                                     <tr>
                                         <th class="border-0 px-3">Data</th>
                                         <th class="border-0">Tipo</th>
                                         <th class="border-0 text-center">Dias</th>
                                         <th class="border-0 text-end">Valor R$</th>
                                         <th class="border-0 text-center" id="colunaAcaoPasta">Excluir</th>
                                     </tr>
                                 </thead>
                                 <tbody id="tabelaItensPasta" class="border-top-0">
                                     </tbody>
                             </table>
                         </div>
                     </div>

                     <div class="p-4 bg-white border-top shadow-sm d-flex flex-wrap align-items-center justify-content-between" id="rodapeFechamentoPasta">
                         <div class="mb-3 mb-md-0">
                             <span class="text-muted d-block mb-1" style="font-size: 0.8rem; text-transform: uppercase;">Total Acumulado na Pasta</span>
                             <h3 class="fw-bold text-success mb-0" id="visorSomaPasta">R$ 0,00</h3>
                             <div class="text-muted mt-1" style="font-size: 0.75rem;"><i class="fa-brands fa-pix text-success"></i> <span id="visorPixPasta"></span></div>
                         </div>
                         
                         <form id="formFecharPasta" method="POST" action="" enctype="multipart/form-data" class="d-flex align-items-center gap-2" onsubmit="prepararSubmissaoSimples(event, this, 'Pasta Fechada e Paga com Sucesso!')">
                             <div class="bg-light p-2 rounded border" style="min-width: 250px;">
                                 <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;"><i class="fa-solid fa-paperclip"></i> Anexar Comprovante Geral</label>
                                 <input type="file" name="comprovante" class="form-control form-control-sm shadow-sm" accept="image/*,.pdf" required>
                             </div>
                             <button type="button" id="btnWppPasta" class="btn btn-outline-success fw-bold shadow-sm px-3" style="height: fit-content;" title="Enviar Resumo por WhatsApp" onclick=""><i class="fa-brands fa-whatsapp fs-5"></i></button>
                             <button type="submit" class="btn btn-success fw-bold shadow-sm px-3" style="height: fit-content;"><i class="fa-solid fa-check-double me-1"></i> Pagar e Fechar Pasta</button>
                         </form>
                     </div>
                     
                     <div class="p-4 bg-success bg-opacity-10 border-top border-success d-flex align-items-center justify-content-between" id="rodapePastaMorta" style="display:none !important;">
                         <div>
                             <span class="text-success fw-bold d-block"><i class="fa-solid fa-check-circle me-1"></i> Liquidada e Fechada</span>
                             <h4 class="fw-bold text-success mb-0" id="visorSomaFechada">R$ 0,00</h4>
                         </div>
                         <div class="d-flex gap-2">
                             <a href="#" id="linkComprovanteFechada" target="_blank" class="btn btn-outline-success fw-bold bg-white shadow-sm"><i class="fa-solid fa-file-invoice"></i> Ver Comprovante</a>
                         </div>
                     </div>

                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-success text-white overflow-hidden position-relative" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-check fs-5 me-2"></i>
                    <strong class="fs-6" id="sucessoTitulo">Concluído!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.9rem; opacity: 0.9;" id="sucessoSub">Operação realizada.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 6px;"></div>
        </div>
        <div id="erroToast" class="toast shadow-lg border-0 bg-danger text-white overflow-hidden position-relative" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-xmark fs-5 me-2"></i>
                    <strong class="fs-6" id="erroTitulo">Erro!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.9rem; opacity: 0.9;" id="erroSub">Ocorreu um erro.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="erroTimer" style="display: none; height: 6px;"></div>
        </div>
    </div>

    ${modaisDinamicosExcluir.join('')}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

    <script>
      let listaDB = JSON.parse(document.getElementById('diaristasData').textContent);
      let pastasDB = JSON.parse(document.getElementById('pastasData').textContent);

      const TAXAS = {
          padrao: parseFloat(${valPadrao}),
          domingo: parseFloat(${valDomingo}),
          limpeza: parseFloat(${valLimpeza})
      };

      // =======================================================================
      // LÓGICA DE PAGINAÇÃO DOS CARDS
      // =======================================================================
      let currentPageCards = 1;
      const itemsPerPageCards = 8;
      
      function renderCardsPage(page) {
          const items = document.querySelectorAll('.diarista-card-item');
          if(items.length === 0) return;
          const totalPages = Math.ceil(items.length / itemsPerPageCards);
          if(page < 1) page = 1;
          if(page > totalPages) page = totalPages;
          currentPageCards = page;

          items.forEach((item, index) => {
              item.style.display = 'none';
              if (index >= (page - 1) * itemsPerPageCards && index < page * itemsPerPageCards) {
                  item.style.display = 'block';
              }
          });
          renderCardsPagination(totalPages);
      }

      function renderCardsPagination(totalPages) {
          const container = document.getElementById('paginationCards');
          if (totalPages <= 1) { container.innerHTML = ''; return; }
          let html = '<ul class="pagination pagination-sm shadow-sm m-0">';
          html += \`<li class="page-item \${currentPageCards === 1 ? 'disabled' : ''}"><a class="page-link text-dark" href="#" onclick="event.preventDefault(); renderCardsPage(\${currentPageCards - 1})">«</a></li>\`;
          for (let i = 1; i <= totalPages; i++) {
              html += \`<li class="page-item \${i === currentPageCards ? 'active' : ''}"><a class="page-link \${i === currentPageCards ? 'fw-bold text-white bg-primary border-primary' : 'text-dark'}" href="#" onclick="event.preventDefault(); renderCardsPage(\${i})">\${i}</a></li>\`;
          }
          html += \`<li class="page-item \${currentPageCards === totalPages ? 'disabled' : ''}"><a class="page-link text-dark" href="#" onclick="event.preventDefault(); renderCardsPage(\${currentPageCards + 1})">»</a></li></ul>\`;
          container.innerHTML = html;
      }

      // =======================================================================
      // LÓGICA DOS MODAIS E WHATSAPP
      // =======================================================================
      function fmtDataJs(dStr) {
          if(!dStr) return '-';
          const onlyDate = dStr.split('T')[0];
          const [ano, mes, dia] = onlyDate.split('-');
          return \`\${dia}/\${mes}/\${ano}\`;
      }

      function enviarWppPasta(pastaId) {
          const p = pastasDB.find(x => x.id == pastaId);
          if(!p) return;

          let msg = \`Relatório de Fechamento de Diárias - Ecoflow\\n\\n\`;
          msg += \`[ Colaborador: \${p.nome_colaborador} ]\\n\`;
          msg += \`Pasta #\${p.id}  |  Abertura: \${p.data_abertura}\\n\\n\`;
          msg += \`*Resumo de Registros:*\\n\`;

          if(p.itens && p.itens.length > 0) {
              p.itens.forEach(item => {
                  msg += \`> \${fmtDataJs(item.data_servico)} - \${item.tipo_viagem} (\${item.qtd_entregas} dia: R$ \${parseFloat(item.valor_total).toLocaleString('pt-BR', {minimumFractionDigits:2})}\\n\`;
              });
          }

          msg += \`\\n------------------------\\n\`;
          msg += \`*TOTAL A PAGAR: R$ \${parseFloat(p.valor_total).toLocaleString('pt-BR', {minimumFractionDigits:2})}*\\n\\n\`;
          msg += \`*Dados Bancários:*\\n\`;
          msg += \`> PIX: \${p.pix}\\n\`;
          msg += \`> Banco: \${p.banco}\\n\`;
          msg += \`> CPF: \${p.cpf}\`;

          const url = \`https://wa.me/557196785385?text=\${encodeURIComponent(msg)}\`;
          window.open(url, '_blank');
      }

      function abrirModalCriarPasta(colabId) {
          const c = listaDB.find(x => x.id == colabId);
          if(!c) return;
          document.getElementById('inputCriarPastaColabId').value = c.id;
          document.getElementById('nomeCriarPasta').innerText = c.nome;
          bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCriarPasta')).show();
      }

      function abrirPastaFechamento(pastaId) {
          const p = pastasDB.find(x => x.id == pastaId);
          if(!p) return;

          // Header do Modal
          document.getElementById('visorPastaId').innerText = p.id;
          document.getElementById('visorPastaNome').innerText = p.nome_colaborador;
          document.getElementById('visorPixPasta').innerText = p.pix + ' (' + p.banco + ')';
          
          // Formulario Esquerdo (Adição)
          document.getElementById('formItemPastaId').value = p.id;
          document.getElementById('formItemColabId').value = p.colaborador_id;
          document.getElementById('itemData').value = new Date().toISOString().split('T')[0];
          document.getElementById('itemQtd').value = 1;
          verificarDataDomingoPasta();
          calcularDiariaPasta();

          // Tabela Interna
          const tbody = document.getElementById('tabelaItensPasta');
          if (p.itens && p.itens.length > 0) {
              tbody.innerHTML = p.itens.map(item => {
                  const btnExcluir = p.status !== 'PAGO' ? \`<form method="POST" action="/pagamentos/excluir/\${item.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Item Excluído!');"><input type="hidden" name="redirect_to" value="/diaristas"><button type="submit" class="btn btn-sm btn-light text-danger p-1"><i class="fa-solid fa-trash"></i></button></form>\` : \`<i class="fa-solid fa-lock text-success opacity-50"></i>\`;
                  
                  return \`<tr>
                      <td class="text-muted fw-bold px-3">\${fmtDataJs(item.data_servico)}</td>
                      <td>\${item.tipo_viagem}</td>
                      <td class="text-center">\${item.qtd_entregas}</td>
                      <td class="text-end fw-bold text-success">R$ \${parseFloat(item.valor_total).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                      <td class="text-center">\${btnExcluir}</td>
                  </tr>\`;
              }).join('');
          } else {
              tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4"><i class="fa-solid fa-receipt fa-2x opacity-25 mb-2 d-block"></i>Pasta vazia.</td></tr>';
          }

          // Controle de Exibição (Aberta vs Paga)
          const colAcao = document.getElementById('colunaAcaoPasta');
          const areaEsq = document.getElementById('formInserirItem');
          const avisoEsq = document.getElementById('avisoPastaFechada');
          const rodapeAberto = document.getElementById('rodapeFechamentoPasta');
          const rodapeFechado = document.getElementById('rodapePastaMorta');

          if (p.status === 'PAGO') {
              colAcao.innerHTML = '<i class="fa-solid fa-lock"></i>';
              areaEsq.style.display = 'none';
              avisoEsq.style.display = 'block';
              
              rodapeAberto.classList.remove('d-flex');
              rodapeAberto.style.display = 'none';
              rodapeFechado.classList.add('d-flex');
              rodapeFechado.style.display = 'flex';
              
              document.getElementById('visorSomaFechada').innerText = "R$ " + parseFloat(p.valor_total).toLocaleString('pt-BR', {minimumFractionDigits:2});
              if(p.comprovante) {
                  document.getElementById('linkComprovanteFechada').href = '/uploads/' + p.comprovante;
                  document.getElementById('linkComprovanteFechada').style.display = 'inline-block';
              } else {
                  document.getElementById('linkComprovanteFechada').style.display = 'none';
              }

          } else {
              colAcao.innerHTML = 'Excluir';
              areaEsq.style.display = 'block';
              avisoEsq.style.display = 'none';
              
              rodapeFechado.classList.remove('d-flex');
              rodapeFechado.style.display = 'none';
              
              if (p.itens && p.itens.length > 0) {
                  rodapeAberto.classList.add('d-flex');
                  rodapeAberto.style.display = 'flex';
                  document.getElementById('visorSomaPasta').innerText = "R$ " + parseFloat(p.valor_total).toLocaleString('pt-BR', {minimumFractionDigits:2});
                  document.getElementById('formFecharPasta').action = "/diaristas/pasta/fechar/" + p.id;
                  
                  // Injeta o envio de WhatsApp no botão!
                  document.getElementById('btnWppPasta').setAttribute('onclick', \`enviarWppPasta('\${p.id}')\`);
              } else {
                  rodapeAberto.classList.remove('d-flex');
                  rodapeAberto.style.display = 'none';
              }
          }

          bootstrap.Modal.getOrCreateInstance(document.getElementById('modalGerenciarPasta')).show();
      }

      function verificarDataDomingoPasta() {
          const dataVal = document.getElementById('itemData').value;
          if(!dataVal) return;
          const [ano, mes, dia] = dataVal.split('-');
          const data = new Date(ano, mes - 1, dia);
          const isDomingo = data.getDay() === 0;
          
          const select = document.getElementById('itemTipoDiaria');
          if (isDomingo && select.value === 'Diária Padrão') {
              select.value = 'Diária de Domingo';
          } else if (!isDomingo && select.value === 'Diária de Domingo') {
              select.value = 'Diária Padrão';
          }
      }

      function calcularDiariaPasta() {
          const tipo = document.getElementById('itemTipoDiaria').value;
          const qtd = parseInt(document.getElementById('itemQtd').value) || 1;
          let valorBase = TAXAS.padrao;
          
          if (tipo === 'Diária de Domingo') valorBase = TAXAS.domingo;
          if (tipo === 'Diária de Limpeza') valorBase = TAXAS.limpeza;

          const total = valorBase * qtd;

          document.getElementById('itemValorVisor').innerText = "R$ " + total.toLocaleString('pt-BR', {minimumFractionDigits: 2});
          document.getElementById('itemValorTotal').value = total.toFixed(2);
      }

      // =======================================================================
      // AJAX E SUBMISSÃO ESTRUTURAL
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
              new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 }).show();
          }
      }

      function gerarSkeletonTabela(quantidade = 4) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += \`<tr class="align-middle"><td class="py-3 px-3"><div class="skeleton-view skeleton-text-view" style="width: 140px;"></div></td><td class="py-3 px-3"><div class="skeleton-view skeleton-text-view" style="width: 100px;"></div></td><td class="py-3 px-3"><div class="skeleton-view skeleton-text-view" style="width: 80px;"></div></td><td class="py-3 px-3"><div class="skeleton-view skeleton-text-view" style="width: 70px; margin: 0 auto;"></div></td><td class="text-end py-3 px-3"><div class="skeleton-view" style="height: 28px; width: 60px; border-radius: 4px; display: inline-block;"></div></td></tr>\`;
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const container = document.getElementById('tabelaContainer');
          if (document.getElementById('skeleton-temp-container')) return;
          if (container) {
              container.style.display = 'none';
              container.insertAdjacentHTML('beforebegin', \`<div id="skeleton-temp-container" class="table-responsive bg-white rounded-3 shadow-sm border border-light mb-4 skeleton-container"><table class="table table-hover align-middle mb-0" style="font-size: 0.85rem;"><thead class="table-light"><tr><th class="py-2 px-3 fw-bold text-muted border-0">Carregando...</th></tr></thead><tbody class="border-top-0">\${gerarSkeletonTabela(3)}</tbody></table></div>\`);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();
          const container = document.getElementById('tabelaContainer');
          if (container) container.style.display = '';
      }

      window.addEventListener('load', () => {
          ocultarSkeletonGlobais();
          renderCardsPage(1); 
      });

      let isSubmitting = false;

      async function prepararBuscaSimples(event, form, titleMsg) {
          if (event) event.preventDefault();
          mostrarSkeletonGlobais();
          try {
              const url = form.action + '?' + new URLSearchParams(new FormData(form)).toString();
              const response = await fetch(url, { method: 'GET' });
              if (response.ok) {
                  const html = await response.text();
                  const doc = new DOMParser().parseFromString(html, 'text/html');
                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) oldContent.innerHTML = newContent.innerHTML;
                  atualizarModaisDinamicos(doc);
                  renderCardsPage(currentPageCards);
                  window.history.pushState({}, '', url);
                  mostrarToast('sucesso', 'Busca Concluída!', titleMsg);
              } else {
                  mostrarToast('erro', 'Erro', 'Não foi possível realizar a busca.');
              }
          } catch (err) {
              mostrarToast('erro', 'Falha', 'Verifique a sua rede.');
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      function limparFiltros() {
          const form = document.getElementById('formFiltro');
          if (form) {
              form.querySelectorAll('input').forEach(i => i.value = '');
              prepararBuscaSimples(null, form, 'Filtros limpos!');
          }
      }

      async function navegarPagina(event, url) {
          event.preventDefault();
          mostrarSkeletonGlobais();
          try {
              const response = await fetch(url, { method: 'GET' });
              if (response.ok) {
                  const html = await response.text();
                  const doc = new DOMParser().parseFromString(html, 'text/html');
                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) oldContent.innerHTML = newContent.innerHTML;
                  atualizarModaisDinamicos(doc);
                  renderCardsPage(currentPageCards);
                  window.history.pushState({}, '', url);
              }
          } catch (err) {
              mostrarToast('erro', 'Erro', 'Falha ao carregar.');
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      async function prepararSubmissaoSimples(event, form, titleMsg) {
          event.preventDefault();
          if (!form.checkValidity()) { form.reportValidity(); return; }
          if (isSubmitting) return;

          let keepPastaIdOpen = null;
          if (form.id === 'formInserirItem') {
              keepPastaIdOpen = document.getElementById('formItemPastaId').value;
          } else if (form.action.includes('/pagamentos/excluir/') && form.closest('#modalGerenciarPasta')) {
              keepPastaIdOpen = document.getElementById('visorPastaId').innerText;
          }

          const modalEl = form.closest('.modal');
          if (modalEl) bootstrap.Modal.getInstance(modalEl).hide();
          
          document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
          document.body.classList.remove('modal-open');
          document.body.style = '';

          mostrarSkeletonGlobais();
          isSubmitting = true;

          try {
              let fetchOptions = { method: form.method || 'POST' };
              if (form.enctype === 'multipart/form-data') {
                  fetchOptions.body = new FormData(form);
              } else {
                  const formData = new URLSearchParams();
                  const fd = new FormData(form);
                  for (const [key, value] of fd.entries()) formData.append(key, value);
                  fetchOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
                  fetchOptions.body = formData.toString();
              }

              const response = await fetch(form.action, fetchOptions);

              if (response.ok) {
                  const freshResponse = await fetch(window.location.href);
                  const html = await freshResponse.text();
                  const doc = new DOMParser().parseFromString(html, 'text/html');
                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) oldContent.innerHTML = newContent.innerHTML;
                  
                  atualizarModaisDinamicos(doc);
                  renderCardsPage(currentPageCards);

                  if (keepPastaIdOpen) {
                      setTimeout(() => {
                          abrirPastaFechamento(keepPastaIdOpen);
                      }, 200);
                  }

                  mostrarToast('sucesso', 'Concluído!', titleMsg);
              } else {
                  mostrarToast('erro', 'Erro', 'Falha ao salvar no banco de dados.');
              }
          } catch (err) {
              mostrarToast('erro', 'Conexão', 'Verifique a sua internet.');
          } finally {
              isSubmitting = false;
              ocultarSkeletonGlobais();
          }
      }

      function atualizarModaisDinamicos(doc) {
          const staticModals = ['sidebarMenu'];
          document.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) m.remove();
          });
          doc.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
          });
          
          const newDiaristasData = doc.getElementById('diaristasData');
          if (newDiaristasData) listaDB = JSON.parse(newDiaristasData.textContent);
          
          const newPastasData = doc.getElementById('pastasData');
          if (newPastasData) pastasDB = JSON.parse(newPastasData.textContent);
      }
    </script>
  </body>
  </html>
  `;
}

module.exports = diaristasView;