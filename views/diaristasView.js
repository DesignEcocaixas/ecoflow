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

  // Funções de formatação para injetar os valores já com máscara no HTML gerado da tabela
  const applyMaskPhone = (v) => {
      if (!v) return "";
      v = String(v).replace(/\D/g, "");
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 10) return v.replace(/^(\d{2})(\d{1})(\d{4})(\d{4}).*/, "($1) $2 $3-$4");
      if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
      if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
      if (v.length > 0) return v.replace(/^(\d*)/, "($1");
      return v;
  };

  const applyMaskCPF = (v) => {
      if (!v) return "";
      v = String(v).replace(/\D/g, "");
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 9) return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.$2.$3-$4");
      if (v.length > 6) return v.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, "$1.$2.$3");
      if (v.length > 3) return v.replace(/^(\d{3})(\d{0,3})/, "$1.$2");
      return v;
  };

  const valPadrao = taxas.diaria_padrao || 85.00;
  const valDomingo = taxas.diaria_domingo || 95.00;
  const valLimpeza = taxas.diaria_limpeza || 75.00;

  // Arrays de Dados Serializados para o JavaScript Frontend
  const diaristasJson = JSON.stringify(diaristas.map(d => ({
      id: d.id, 
      nome: d.nome, 
      tipo_usuario: d.tipo_usuario,
      cpf: d.cpf || '',
      telefone: d.telefone || '',
      pix: d.pix || '',
      banco: d.banco || '',
      foto: d.foto ? `/uploads/${d.foto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(d.nome)}&background=1f1f1f&color=08c068`,
      fotoRaw: d.foto || ''
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
          cpf: p.cpf || 'Não cadastrado',
          data_abertura: dtStr,
          status: p.status,
          comprovante: p.comprovante,
          valor_total: p.valor_total,
          itens: p.itens || []
      };
  }));

  // =========================================================================
  // GERAÇÃO DOS CARDS (APENAS DIARISTAS NA TELA PRINCIPAL)
  // =========================================================================
  const apenasDiaristas = diaristas.filter(d => d.tipo_usuario === 'diarista');
  const cardsDiaristas = apenasDiaristas.length > 0 ? apenasDiaristas.map(d => {
      const fotoUrl = d.foto ? `/uploads/${d.foto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(d.nome)}&background=1f1f1f&color=08c068`;
      const pixStatus = d.pix && d.pix.trim() !== '' ? '<span class="text-success"><i class="fa-brands fa-pix"></i> Cadastrado</span>' : '<span class="text-danger"><i class="fa-brands fa-pix"></i> Pendente</span>';

      return `
         <div class="col-12 col-sm-6 col-md-4 col-xl-3 diarista-card-item">
             <div class="card erp-card shadow-sm h-100 bg-custom-darker border-custom" style="cursor: pointer;" onclick="abrirModalCriarPasta('${d.id}')" title="Abrir uma nova pasta de fechamento para este colaborador">
                 <div class="card-body text-center p-3 d-flex flex-column justify-content-center align-items-center">
                     <div class="position-relative mb-2">
                         <img src="${fotoUrl}" class="rounded-circle shadow-sm border border-custom" style="width: 55px; height: 55px; object-fit: cover;">
                         <span class="position-absolute bottom-0 end-0 p-1 bg-success border border-custom rounded-circle" style="width: 12px; height: 12px;" title="Ativo"></span>
                     </div>
                     <h6 class="fw-bold text-white mb-1 w-100 text-truncate px-2" style="font-size: 0.85rem;" title="${d.nome}">${d.nome}</h6>
                     <span class="badge bg-custom-dark border-custom text-muted mb-2 px-2 py-1" style="font-size: 0.60rem; letter-spacing: 0.5px;">DIARISTA</span>
                     
                     <div class="w-100 border-top border-custom pt-2 text-muted" style="font-size: 0.70rem;">
                         <div class="mb-1 text-truncate"><i class="fa-solid fa-id-card opacity-75 me-1"></i> CPF: ${applyMaskCPF(d.cpf) || 'N/A'}</div>
                         <div class="text-truncate">${pixStatus}</div>
                     </div>
                 </div>
             </div>
         </div>
      `;
  }).join('') : `<div class="col-12 text-center text-muted py-5"><i class="fa-solid fa-users-slash fa-2x opacity-25 mb-3"></i><p style="font-size:0.8rem;">Nenhum diarista cadastrado no sistema.</p></div>`;

  // =========================================================================
  // GERAÇÃO DO HISTÓRICO DE PASTAS
  // =========================================================================
  const modaisDinamicosExcluir = [];
  const linhasPastas = pastas.length > 0 ? pastas.map(p => {
      const fotoUrl = p.foto_colab ? `/uploads/${p.foto_colab}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome_colaborador || 'C')}&background=1f1f1f&color=08c068`;
      
      let badgeStatus = p.status === 'PAGO' 
        ? '<span class="badge bg-success bg-opacity-10 text-success border border-success" style="font-size: 0.65rem;"><i class="fa-solid fa-check-double"></i> Paga</span>' 
        : '<span class="badge bg-warning bg-opacity-10 text-warning border border-warning" style="font-size: 0.65rem;"><i class="fa-solid fa-folder-open"></i> Aberta</span>';

      modaisDinamicosExcluir.push(`
        <div class="modal fade" id="excluirPastaModal${p.id}" tabindex="-1">
            <div class="modal-dialog modal-sm modal-dialog-centered">
                <form method="POST" action="/diaristas/pasta/excluir/${p.id}" class="modal-content border-0 shadow-lg erp-modal" onsubmit="prepararSubmissaoSimples(event, this, 'Pasta Excluída!')">
                    <div class="modal-body p-4 text-center bg-custom-darker">
                        <i class="fa-solid fa-triangle-exclamation fa-2x text-danger mb-3"></i>
                        <h6 class="fw-bold text-white mb-2" style="font-size:0.9rem;">Excluir Pasta?</h6>
                        <p class="text-muted mb-0" style="font-size:0.8rem;">Esta ação apagará <b>todas as diárias</b> dentro desta pasta de <b>${p.nome_colaborador}</b>!</p>
                    </div>
                    <div class="modal-footer bg-custom-darker border-0 justify-content-center d-flex flex-nowrap">
                        <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" data-bs-dismiss="modal" onclick="event.stopPropagation();">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold" onclick="event.stopPropagation();">Excluir Tudo</button>
                    </div>
                </form>
            </div>
        </div>
      `);

      return `
        <tr class="align-middle table-hover-row" style="cursor: pointer; height: 45px;" onclick="abrirPastaFechamento('${p.id}')" title="Clique para gerenciar as diárias desta pasta">
            <td class="py-1 px-3">
                <div class="d-flex align-items-center">
                    <img src="${fotoUrl}" alt="Foto" class="rounded-circle me-2 border-custom shadow-sm" style="width: 28px; height: 28px; object-fit: cover;">
                    <div style="line-height: 1.1;">
                        <strong class="text-white d-block" style="font-size:0.8rem;">${p.nome_colaborador}</strong>
                        <span class="text-muted" style="font-size:0.6rem;">Pasta #${p.id}</span>
                    </div>
                </div>
            </td>
            <td class="text-muted py-1 px-3 fw-medium" style="font-size: 0.75rem;"><i class="fa-regular fa-folder-open me-1"></i> ${fmtData(p.data_criacao)}</td>
            <td class="py-1 px-3 text-center">
                <span class="badge bg-custom-darker text-white border-custom shadow-sm" style="font-size:0.7rem;"><i class="fa-solid fa-calendar-day text-accent me-1"></i> ${p.qtd_diarias} Regs</span>
            </td>
            <td class="text-success fw-bold py-1 px-3" style="font-size:0.85rem;">R$ ${fmtMoeda(p.valor_total)}</td>
            <td class="py-1 px-3 text-center">${badgeStatus}</td>
            <td class="text-end py-1 px-3 text-nowrap" onclick="event.stopPropagation();">
                <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger shadow-sm ms-1 py-0 px-2" style="font-size: 0.75rem;" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('excluirPastaModal${p.id}')).show();" title="Excluir Pasta"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
      `;
  }).join('') : `<tr><td colspan="6" class="text-center text-muted py-4 text-center-empty"><i class="fa-solid fa-folder-open fa-2x opacity-25 mb-3"></i><p style="font-size:0.8rem;">Nenhuma pasta de fechamento encontrada no período.</p></td></tr>`;

  // =========================================================================
  // GERAÇÃO DA TABELA DO MODAL GESTÃO DE EQUIPE (TODOS OS COLABORADORES)
  // =========================================================================
  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'diarista': return '<span class="badge bg-custom-darker border-custom text-info">Diarista</span>';
      case 'ajudante': return '<span class="badge bg-custom-darker border-custom text-warning">Ajudante</span>';
      case 'motorista': return '<span class="badge bg-custom-darker border-custom text-accent">Motorista</span>';
      case 'motorista_avulso': return '<span class="badge bg-custom-darker border-custom text-danger">Mot. Avulso</span>';
      default: return `<span class="badge bg-custom-darker border-custom text-muted">${tipo}</span>`;
    }
  };

  const linhasGestaoEquipe = diaristas.length > 0 ? diaristas.map(c => {
      const fotoUrl = c.foto ? `/uploads/${c.foto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nome)}&background=1f1f1f&color=08c068`;
      
      return `
      <tr class="align-middle colab-row-filtro table-hover-row" style="cursor: pointer;" onclick="abrirModalFormColaborador('${c.id}')" title="Clique para editar este colaborador">
          <td class="py-2 px-3">
              <div class="d-flex align-items-center">
                  <img src="${fotoUrl}" class="rounded-circle me-2 border-custom shadow-sm" style="width: 35px; height: 35px; object-fit: cover;">
                  <div style="line-height: 1.1;">
                      <strong class="text-white d-block colab-nome-filtro" style="font-size:0.8rem;">${c.nome}</strong>
                      <span class="mt-1 colab-funcao-filtro" style="font-size:0.55rem; letter-spacing: 0.5px;">${getTipoBadge(c.tipo_usuario)}</span>
                  </div>
              </div>
          </td>
          <td class="py-2 px-3 text-muted" style="font-size: 0.75rem;">
              <div><i class="fa-solid fa-id-card me-1 opacity-75"></i> ${applyMaskCPF(c.cpf) || '-'}</div>
              <div class="mt-1"><i class="fa-solid fa-phone me-1 opacity-75"></i> ${applyMaskPhone(c.telefone) || '-'}</div>
          </td>
          <td class="py-2 px-3 text-muted" style="font-size: 0.75rem;">
              <div class="text-success fw-bold"><i class="fa-brands fa-pix me-1"></i> ${c.pix || '-'}</div>
              <div class="mt-1"><i class="fa-solid fa-building-columns me-1 opacity-75"></i> ${c.banco || '-'}</div>
          </td>
          <td class="py-2 px-3 text-end text-nowrap" onclick="event.stopPropagation();">
              <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger shadow-sm py-1 px-2 ms-1" onclick="abrirModalExcluirColaborador('${c.id}')" title="Excluir"><i class="fa-solid fa-trash" style="font-size: 0.75rem;"></i></button>
          </td>
      </tr>
      `;
  }).join('') : `<tr><td colspan="4" class="text-center text-muted py-5"><i class="fa-solid fa-users-slash fa-2x mb-3 opacity-25"></i><br><span style="font-size:0.8rem;">Nenhum colaborador cadastrado.</span></td></tr>`;

  // Paginação
  const qsParams = [];
  if (filtros.data_inicio) qsParams.push(`data_inicio=${filtros.data_inicio}`);
  if (filtros.data_fim) qsParams.push(`data_fim=${filtros.data_fim}`);
  const baseQueryString = qsParams.length > 0 ? '&' + qsParams.join('&') : '';

  const paginacaoHtml = (() => {
      if (totalPages <= 1) return "";
      let html = `<nav class="mt-4"><ul class="pagination pagination-sm justify-content-center mb-4">`;
      html += `<li class="page-item ${page <= 1 ? "disabled" : ""}"><a class="page-link" href="/diaristas?page=${page - 1}${baseQueryString}" onclick="navegarPagina(event, this.href)">«</a></li>`;
      
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);
      
      if (start > 1) {
          html += `<li class="page-item"><a class="page-link" href="/diaristas?page=1${baseQueryString}" onclick="navegarPagina(event, this.href)">1</a></li>`;
          if (start > 2) html += `<li class="page-item disabled"><span class="page-link text-muted">...</span></li>`;
      }
      for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === page ? "active" : ""}"><a class="page-link ${i === page ? "fw-bold" : ""}" href="/diaristas?page=${i}${baseQueryString}" onclick="navegarPagina(event, this.href)">${i}</a></li>`;
      }
      if (end < totalPages) {
          if (end < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link text-muted">...</span></li>`;
          html += `<li class="page-item"><a class="page-link" href="/diaristas?page=${totalPages}${baseQueryString}" onclick="navegarPagina(event, this.href)">${totalPages}</a></li>`;
      }
      
      html += `<li class="page-item ${page >= totalPages ? "disabled" : ""}"><a class="page-link" href="/diaristas?page=${page + 1}${baseQueryString}" onclick="navegarPagina(event, this.href)">»</a></li>`;
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
      /* Scrollbars Globais (Dark & Green) */
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
      html, body, .content, .table-responsive, .modal-body, .offcanvas-body { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

      body { display: flex; height: 100vh; margin: 0; background-color: #1f1f1f; color: #ffffff; font-family: 'Segoe UI', sans-serif; }
      .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column;}
      
      .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; background-color: #1f1f1f; }
      
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

      .erp-card { transition: all 0.3s ease; border-radius: 12px; border-width: 1px !important; background-color: #2a2a2a !important; border-style: solid; border-color: rgba(255,255,255,0.05) !important; }
      .erp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.2) !important; border-color: #08c068 !important; }

      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
      .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
      
      /* Pagination */
      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
      .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.05); }

      /* ANIMAÇÕES GLOBAIS (TOASTS E MODAIS) */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      .modal.fade .modal-dialog { transform: scale(0.85) translateY(30px); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
      .modal.show .modal-dialog { transform: scale(1) translateY(0); }

      /* CONTAINER DE FOTO DE PERFIL (Para Upload) */
      .profile-upload-container {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          background-color: #1f1f1f;
          border: 3px solid rgba(8,192,104,0.3);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
      }
      .profile-upload-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
      }
      .profile-upload-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 35%;
          background: rgba(0,0,0,0.65);
          color: white;
          font-size: 0.65rem;
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.3s ease;
      }
      .profile-upload-container:hover .profile-upload-overlay {
          opacity: 1;
      }

      .btn-flutuante {
        position: fixed; bottom: 30px; right: 30px; width: 45px; height: 45px; border-radius: 50%;
        background-color: #08c068; color: #1f1f1f; border: none; box-shadow: 0 4px 15px rgba(8, 192, 104, 0.3);
        display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 1050; transition: all 0.3s ease;
      }
      .btn-flutuante:hover { transform: scale(1.1); background-color: #06a055; color: #1f1f1f; box-shadow: 0 6px 20px rgba(8, 192, 104, 0.5); }

      /* SKELETON LOADING (MODO ESCURO) */
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
      .skeleton-avatar-view { height: 40px; width: 40px; border-radius: 50%; }
      .skeleton-btn-view { height: 22px; width: 50px; border-radius: 4px; display: inline-block; }
      
      @keyframes skeleton-loading-view {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
      }

      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 16px; }
      }
      .offcanvas { background-color: #1f1f1f !important; }
    </style>
  </head>
  <body>

    <script id="diaristasData" type="application/json">${diaristasJson}</script>
    <script id="pastasData" type="application/json">${pastasJson}</script>

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
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-users-gear text-muted me-2"></i>Controle de Diaristas</h5>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.7rem;">Equipe avulsa, limpeza e serviços gerais</span>
            </div>
        </div>
        
        <button class="btn btn-sm btn-primary shadow-sm fw-bold px-3" data-bs-toggle="modal" data-bs-target="#modalGerirColaboradores">
           <i class="fa-solid fa-users me-1"></i> Gestão de Equipe
        </button>
      </div>

      <div class="row g-3" id="diaristasGrid">
         ${cardsDiaristas}
      </div>
      <div id="paginationCards" class="d-flex justify-content-center mt-4 mb-5"></div>

      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 border-top border-custom pt-4">
         <h6 class="fw-bold text-white mb-0" style="font-size: 0.85rem;"><i class="fa-solid fa-folder-tree text-accent me-2"></i> Histórico de Pastas de Fechamento</h6>
         <div class="d-flex gap-2 flex-wrap">
            <form id="formFiltro" class="d-flex gap-2 flex-wrap" method="GET" action="/diaristas" onsubmit="prepararBuscaSimples(event, this, 'Filtros Aplicados!')">
                <div class="input-group input-group-sm shadow-sm" style="flex-wrap: nowrap; width: auto;">
                    <span class="input-group-text border-custom d-none d-sm-block"><i class="fa-regular fa-calendar"></i></span>
                    <input type="date" name="data_inicio" class="form-control" value="${filtros.data_inicio || ''}" title="Data Inicial">
                    <span class="input-group-text border-custom">até</span>
                    <input type="date" name="data_fim" class="form-control" value="${filtros.data_fim || ''}" title="Data Final">
                    <button type="submit" class="btn btn-primary px-3"><i class="fa-solid fa-filter"></i></button>
                    <button type="button" class="btn btn-outline-secondary border-custom px-2 text-danger bg-custom-darker" onclick="limparFiltros()"><i class="fa-solid fa-eraser"></i></button>
                </div>
            </form>
            <button class="btn btn-sm btn-outline-primary fw-bold shadow-sm px-3" data-bs-toggle="modal" data-bs-target="#modalConfigTaxas" title="Configurar Diárias Diaristas">
               <i class="fa-solid fa-gear fs-6"></i> <span class="d-none d-sm-inline ms-1">Valores</span>
            </button>
         </div>
      </div>

      <div class="table-responsive bg-custom-darker rounded-3 shadow-sm border border-custom mb-4" id="tabelaContainer">
         <table class="table table-sm align-middle mb-0" style="font-size: 0.8rem;">
           <thead>
             <tr>
               <th class="py-2 px-3">Colaborador / Pasta</th>
               <th class="py-2 px-3">Data Abertura</th>
               <th class="py-2 px-3 text-center">Registros Inseridos</th>
               <th class="py-2 px-3">Valor Total</th>
               <th class="py-2 px-3 text-center">Status da Pasta</th>
               <th class="py-2 px-3 text-end">Ações</th>
             </tr>
           </thead>
           <tbody class="border-top-0">
             ${linhasPastas}
           </tbody>
         </table>
      </div>

      ${paginacaoHtml}

      <button type="button" class="btn-flutuante" data-bs-toggle="modal" data-bs-target="#modalInstrucoesDiaristas" title="Instruções de Uso">
          <i class="fa-solid fa-question"></i>
      </button>

    </div>

    <div class="modal fade" id="modalInstrucoesDiaristas" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content erp-modal shadow-lg border-0">
          <div class="modal-header text-white border-0 bg-custom-darker">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-circle-info text-accent me-2"></i> Instruções de Uso - Diaristas</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark text-sm">
            <h6 class="fw-bold text-white border-bottom border-custom pb-2" style="font-size: 0.8rem;"><i class="fa-solid fa-users-gear text-accent me-2"></i> Como funciona este módulo?</h6>
            <p class="text-muted mb-4" style="font-size: 0.75rem;">Este módulo foi desenhado para gerir de forma eficiente os colaboradores classificados como <strong>Diaristas</strong>, permitindo o agrupamento das suas diárias de trabalho em <b>Pastas de Fechamento (Semanas)</b>.</p>

            <div class="row g-3">
                <div class="col-12 col-md-6">
                    <div class="bg-custom-darker p-3 rounded border-custom shadow-sm h-100">
                        <h6 class="fw-bold text-white mb-2" style="font-size:0.75rem;"><i class="fa-solid fa-folder-plus text-success me-1"></i> Criação de Pastas</h6>
                        <p class="text-muted mb-0" style="font-size:0.7rem;">Para iniciar o registo de trabalho de um diarista, clique no card do colaborador. Isto irá criar uma nova <strong>Pasta de Fechamento Aberta</strong> no histórico, que agrupará todas as diárias daquela semana.</p>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="bg-custom-darker p-3 rounded border-custom shadow-sm h-100">
                        <h6 class="fw-bold text-white mb-2" style="font-size:0.75rem;"><i class="fa-solid fa-list-check text-warning me-1"></i> Inserção de Diárias</h6>
                        <p class="text-muted mb-0" style="font-size:0.7rem;">Ao clicar em "Abrir" numa pasta, você acede ao painel interno. Lá pode registar o tipo de diária (Padrão, Limpeza, Domingo), definir os dias e adicionar o valor acumulado.</p>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="bg-custom-darker p-3 rounded border-custom shadow-sm h-100">
                        <h6 class="fw-bold text-white mb-2" style="font-size:0.75rem;"><i class="fa-brands fa-whatsapp text-success me-1"></i> Relatório WhatsApp</h6>
                        <p class="text-muted mb-0" style="font-size:0.7rem;">Dentro da pasta, antes de fechar, pode clicar no ícone do WhatsApp para enviar ao colaborador um resumo detalhado de todas as diárias lançadas e o valor total a receber.</p>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="bg-custom-darker p-3 rounded border-custom shadow-sm h-100">
                        <h6 class="fw-bold text-white mb-2" style="font-size:0.75rem;"><i class="fa-solid fa-lock text-danger me-1"></i> Fechamento e Pagamento</h6>
                        <p class="text-muted mb-0" style="font-size:0.7rem;">Após o pagamento, anexe o comprovativo e clique em "Pagar e Fechar Pasta". A pasta será trancada (nenhum novo registo poderá ser adicionado) e passará para o estado <strong>Pago</strong>.</p>
                    </div>
                </div>
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-0">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white px-4 fw-bold" data-bs-dismiss="modal">Entendi</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- GESTÃO DE EQUIPE (MODAL PRINCIPAL DA LISTAGEM)                          -->
    <!-- ======================================================================= -->
    <div class="modal fade" id="modalGerirColaboradores" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal shadow-lg border-0">
          <div class="modal-header text-white border-0 bg-custom-darker">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-users-gear text-accent me-2"></i> Gestão de Diaristas & Colaboradores</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
             <div class="d-flex justify-content-between mb-3 gap-2 flex-wrap align-items-end">
                 <h6 class="fw-bold text-white mb-0" style="font-size: 0.8rem;">
                     <i class="fa-solid fa-list text-muted me-1"></i> Equipe Avulsa / Operacional Cadastrada
                 </h6>
                 <button class="btn btn-sm btn-success fw-bold shadow-sm" onclick="abrirModalFormColaborador()">
                     <i class="fa-solid fa-user-plus me-1"></i> Adicionar
                 </button>
             </div>

             <div class="input-group input-group-sm mb-2 shadow-sm">
                 <span class="input-group-text bg-custom-darker border-custom border-end-0"><i class="fa-solid fa-search text-muted"></i></span>
                 <input type="text" class="form-control border-start-0 border-end-0 border-custom bg-custom-darker text-white" id="buscaEquipe" placeholder="Buscar colaborador..." onkeyup="filtrarTabelaEquipe()">
                 <button class="btn btn-outline-secondary bg-custom-darker border-custom border-start-0 text-danger" type="button" onclick="limparBuscaEquipe()" title="Limpar pesquisa"><i class="fa-solid fa-xmark"></i></button>
             </div>
             
             <div class="table-responsive bg-custom-darker rounded shadow-sm border-custom" style="max-height: 50vh; overflow-y: auto;">
                 <table class="table table-hover align-middle mb-0 text-sm" style="font-size: 0.8rem;">
                     <thead style="position: sticky; top: 0; z-index: 1;">
                         <tr>
                             <th class="py-2 px-3">Colaborador</th>
                             <th class="py-2 px-3">Contato</th>
                             <th class="py-2 px-3">Dados Bancários</th>
                             <th class="py-2 px-3 text-end">Ações</th>
                         </tr>
                     </thead>
                     <tbody id="tabelaGestaoEquipe">
                         ${linhasGestaoEquipe}
                     </tbody>
                 </table>
             </div>
          </div>
          <div class="modal-footer bg-custom-darker border-0">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100 fw-bold" data-bs-dismiss="modal">Fechar Painel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE FORMULÁRIO (NOVO/EDITAR COLABORADOR) -->
    <div class="modal fade" id="modalFormColaborador" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
            <form id="formColaborador" method="POST" action="/cadastros/usuarios/novo" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0" onsubmit="prepararSubmissaoSimples(event, this, 'Colaborador Salvo com Sucesso!')">
                <input type="hidden" name="redirect_to" value="/diaristas">
                <div class="modal-header bg-custom-darker text-white border-0">
                    <h6 class="modal-title fw-bold" id="formColabMainTitle" style="font-size: 0.85rem;"><i class="fa-solid fa-user-plus text-accent me-2"></i> Formulário de Colaborador</h6>
                    <button type="button" class="btn-close btn-close-white" onclick="voltarParaGestaoModal('modalFormColaborador')"></button>
                </div>
                <div class="modal-body p-4 bg-custom-dark">
                    <div class="text-center mb-3">
                        <div class="profile-upload-container position-relative mx-auto" onclick="document.getElementById('uploadFotoColab').click()" title="Clique para alterar a foto">
                            <img id="previewFotoColab" src="https://ui-avatars.com/api/?name=Novo&background=1f1f1f&color=08c068" data-default-src="https://ui-avatars.com/api/?name=Novo&background=1f1f1f&color=08c068" alt="Foto">
                            <div class="profile-upload-overlay d-flex align-items-center justify-content-center">
                                <span><i class="fa-solid fa-camera mb-1 d-block"></i> Alterar</span>
                            </div>
                        </div>
                        <input type="file" name="foto" id="uploadFotoColab" class="d-none" accept="image/*" onchange="previewImage(this, 'previewFotoColab')">
                    </div>

                    <div class="row g-3 mt-1">
                        <div class="col-12">
                            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Nome Completo</label>
                            <input type="text" name="nome" class="form-control form-control-sm shadow-sm" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Perfil / Tipo de cadastro</label>
                            <select name="tipo_usuario" class="form-select form-select-sm shadow-sm" required>
                                <option value="diarista">Diarista</option>
                                <option value="ajudante">Ajudante</option>
                                <option value="motorista_avulso">Motorista Avulso</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">CPF</label>
                            <input type="text" name="cpf" class="form-control form-control-sm shadow-sm" placeholder="000.000.000-00" oninput="this.value = maskCPF(this.value)">
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Celular / Telefone</label>
                            <input type="text" name="telefone" class="form-control form-control-sm shadow-sm" placeholder="(00) 00000-0000" oninput="this.value = maskPhone(this.value)">
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Chave PIX</label>
                            <input type="text" name="pix" class="form-control form-control-sm shadow-sm">
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Banco</label>
                            <input type="text" name="banco" class="form-control form-control-sm shadow-sm" placeholder="Ex: Nubank">
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-custom-darker border-0 d-flex flex-nowrap">
                    <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" onclick="voltarParaGestaoModal('modalFormColaborador')">Cancelar</button>
                    <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold"><i class="fa-solid fa-save me-1"></i> Salvar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL DE EXCLUSÃO DE COLABORADOR -->
    <div class="modal fade" id="modalExcluirColaborador" tabindex="-1">
        <div class="modal-dialog modal-sm modal-dialog-centered">
            <form id="formExcluirColaborador" method="POST" action="" class="modal-content erp-modal shadow-lg border-0" onsubmit="prepararSubmissaoSimples(event, this, 'Colaborador Excluído!')">
                <input type="hidden" name="redirect_to" value="/diaristas">
                <div class="modal-body p-4 text-center bg-custom-darker">
                    <i class="fa-solid fa-triangle-exclamation fa-2x text-danger mb-3"></i>
                    <h6 class="fw-bold text-white mb-2" style="font-size: 0.9rem;">Excluir Colaborador?</h6>
                    <p class="text-muted mb-0" style="font-size:0.75rem;">Esta ação removerá o acesso e os dados de perfil de <strong class="text-white" id="excluirColaboradorNome"></strong> do sistema!</p>
                </div>
                <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
                    <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" onclick="voltarParaGestaoModal('modalExcluirColaborador')">Cancelar</button>
                    <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold">Excluir</button>
                </div>
            </form>
        </div>
    </div>

    <div class="modal fade" id="modalConfigTaxas" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <form method="POST" action="/configuracoes/taxas" class="modal-content erp-modal shadow-lg border-0" onsubmit="prepararSubmissaoSimples(event, this, 'Valores Salvos no Banco!')">
          <input type="hidden" name="redirect_to" value="/diaristas">
          <div class="modal-header bg-custom-darker text-white border-0">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-gear text-accent me-2"></i> Valores das Diárias</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            <div class="mb-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Diária Padrão (R$)</label>
                <input type="number" step="0.01" name="diaria_padrao" class="form-control form-control-sm text-center fw-bold shadow-sm" value="${valPadrao}" required>
            </div>
            <div class="mb-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Diária aos Domingos (R$)</label>
                <input type="number" step="0.01" name="diaria_domingo" class="form-control form-control-sm text-center fw-bold shadow-sm" value="${valDomingo}" required>
            </div>
            <div class="mb-1">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Diária de Limpeza (R$)</label>
                <input type="number" step="0.01" name="diaria_limpeza" class="form-control form-control-sm text-center fw-bold shadow-sm" value="${valLimpeza}" required>
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-0">
            <button type="submit" class="btn btn-sm btn-success w-100 fw-bold shadow-sm text-dark">Salvar Valores Globais</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="modalCriarPasta" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <form method="POST" action="/diaristas/pasta/nova" class="modal-content erp-modal shadow-lg border-0" onsubmit="prepararSubmissaoSimples(event, this, 'Pasta de Fechamento Aberta!')">
          <input type="hidden" name="colaborador_id" id="inputCriarPastaColabId">
          <div class="modal-body p-4 text-center bg-custom-darker">
             <i class="fa-solid fa-folder-plus text-accent fa-3x mb-3"></i>
             <h6 class="fw-bold text-white mb-2" style="font-size: 0.9rem;">Abrir Nova Pasta?</h6>
             <p class="text-muted mb-0" style="font-size: 0.75rem;">Deseja iniciar um novo ciclo de lançamentos para <strong id="nomeCriarPasta" class="text-white"></strong>?</p>
          </div>
          <div class="modal-footer bg-custom-darker border-0 d-flex flex-nowrap p-2">
             <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" data-bs-dismiss="modal">Cancelar</button>
             <button type="submit" class="btn btn-sm btn-success text-dark w-100 fw-bold shadow-sm">Abrir Pasta</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="modalGerenciarPasta" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content erp-modal shadow-lg border-0">
          <div class="modal-header bg-custom-darker text-white border-0">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-folder-open text-warning me-2"></i> Pasta de Fechamento #<span id="visorPastaId"></span> - <span id="visorPastaNome"></span></h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0 bg-custom-dark">
             <div class="row g-0 h-100">
                 
                 <div class="col-12 col-md-4 p-4 bg-custom-darker border-end border-custom d-flex flex-column" id="ladoEsquerdoPasta">
                     <h6 class="fw-bold text-accent mb-3" style="font-size: 0.8rem;"><i class="fa-solid fa-plus-circle me-1"></i> Inserir Diária na Pasta</h6>
                     <form id="formInserirItem" method="POST" action="/diaristas/pasta/item" onsubmit="prepararSubmissaoSimples(event, this, 'Registro Inserido!')">
                         <input type="hidden" name="pasta_id" id="formItemPastaId">
                         <input type="hidden" name="colaborador_id" id="formItemColabId">

                         <div class="mb-3">
                             <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Data Executada</label>
                             <input type="date" name="data_servico" id="itemData" class="form-control form-control-sm shadow-sm" required onchange="verificarDataDomingoPasta(); calcularDiariaPasta()">
                         </div>
                         <div class="mb-3">
                             <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Qtd. Dias</label>
                             <input type="number" name="qtd_entregas" id="itemQtd" class="form-control form-control-sm text-center fw-bold shadow-sm" min="1" value="1" required oninput="calcularDiariaPasta()">
                         </div>
                         <div class="mb-3">
                             <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Tipo de Serviço</label>
                             <select name="tipo_viagem" id="itemTipoDiaria" class="form-select form-select-sm shadow-sm fw-bold text-white" onchange="calcularDiariaPasta()">
                                 <option value="Diária Padrão">Diária Padrão (R$ ${fmtMoeda(valPadrao)})</option>
                                 <option value="Diária de Domingo">Diária de Domingo (R$ ${fmtMoeda(valDomingo)})</option>
                                 <option value="Diária de Limpeza">Diária de Limpeza (R$ ${fmtMoeda(valLimpeza)})</option>
                             </select>
                         </div>
                         <div class="mb-3 text-center p-3 bg-custom-dark rounded border-custom">
                             <span class="text-muted d-block mb-1" style="font-size:0.7rem;">Valor deste Registo</span>
                             <h4 class="fw-bold text-accent mb-0" id="itemValorVisor">R$ 0,00</h4>
                             <input type="hidden" name="valor_total" id="itemValorTotal" value="0.00">
                         </div>
                         <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm"><i class="fa-solid fa-arrow-down-short-wide me-1"></i> Adicionar à Lista</button>
                     </form>
                     
                     <div id="avisoPastaFechada" class="text-center mt-auto" style="display:none;">
                         <i class="fa-solid fa-lock fa-3x text-accent opacity-50 mb-3"></i>
                         <p class="text-accent fw-bold" style="font-size: 0.85rem;">Esta pasta já foi fechada e paga.</p>
                         <p class="text-muted small">Não é possível inserir novos registros. Abra uma nova pasta no menu principal se necessário.</p>
                     </div>
                 </div>
                 
                 <div class="col-12 col-md-8 d-flex flex-column">
                     
                     <div class="p-4 flex-grow-1" style="overflow-y: auto; max-height: 50vh;">
                         <h6 class="fw-bold text-white mb-3 pb-2 border-bottom border-custom" style="font-size: 0.8rem;"><i class="fa-solid fa-list-check text-warning me-2"></i> Lançamentos desta Pasta</h6>
                         <div class="table-responsive bg-custom-darker shadow-sm border-custom rounded-3">
                             <table class="table table-hover align-middle mb-0" style="font-size: 0.75rem;">
                                 <thead style="position: sticky; top: 0; z-index: 1;">
                                     <tr>
                                         <th class="py-2 px-3">Data</th>
                                         <th class="py-2 px-3">Tipo</th>
                                         <th class="py-2 px-3 text-center">Dias</th>
                                         <th class="py-2 px-3 text-end">Valor R$</th>
                                         <th class="py-2 px-3 text-center" id="colunaAcaoPasta">Excluir</th>
                                     </tr>
                                 </thead>
                                 <tbody id="tabelaItensPasta" class="border-top-0">
                                     </tbody>
                             </table>
                         </div>
                     </div>

                     <div class="p-4 bg-custom-darker border-top border-custom shadow-sm d-flex flex-wrap align-items-center justify-content-between" id="rodapeFechamentoPasta">
                         <div class="mb-3 mb-md-0">
                             <span class="text-muted d-block mb-1" style="font-size: 0.7rem; text-transform: uppercase;">Total Acumulado na Pasta</span>
                             <h4 class="fw-bold text-accent mb-0" id="visorSomaPasta">R$ 0,00</h4>
                             <div class="text-muted mt-1" style="font-size: 0.7rem;"><i class="fa-brands fa-pix text-accent"></i> <span id="visorPixPasta"></span></div>
                         </div>
                         
                         <form id="formFecharPasta" method="POST" action="" enctype="multipart/form-data" class="d-flex align-items-center gap-2" onsubmit="prepararSubmissaoSimples(event, this, 'Pasta Fechada e Paga com Sucesso!')">
                             <div class="bg-custom-dark p-2 rounded border-custom" style="min-width: 250px;">
                                 <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;"><i class="fa-solid fa-paperclip"></i> Anexar Comprovante Geral</label>
                                 <input type="file" name="comprovante" class="form-control form-control-sm shadow-sm" accept="image/*,.pdf" required>
                             </div>
                             <button type="button" id="btnWppPasta" class="btn btn-outline-secondary border-custom text-accent fw-bold shadow-sm px-3" style="height: fit-content;" title="Enviar Resumo por WhatsApp" onclick=""><i class="fa-brands fa-whatsapp fs-5"></i></button>
                             <button type="submit" class="btn btn-success fw-bold text-dark shadow-sm px-3" style="height: fit-content;"><i class="fa-solid fa-check-double me-1"></i> Pagar e Fechar Pasta</button>
                         </form>
                     </div>
                     
                     <div class="p-4 bg-success bg-opacity-10 border-top border-success d-flex align-items-center justify-content-between" id="rodapePastaMorta" style="display:none !important;">
                         <div>
                             <span class="text-success fw-bold d-block" style="font-size: 0.8rem;"><i class="fa-solid fa-check-circle me-1"></i> Liquidada e Fechada</span>
                             <h4 class="fw-bold text-success mb-0" id="visorSomaFechada">R$ 0,00</h4>
                         </div>
                         <div class="d-flex gap-2">
                             <a href="#" id="linkComprovanteFechada" target="_blank" class="btn btn-sm btn-outline-secondary text-white fw-bold shadow-sm"><i class="fa-solid fa-file-invoice"></i> Ver Comprovante</a>
                         </div>
                     </div>

                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-check fs-5 me-2 text-accent" id="sucessoIcon"></i>
                    <strong class="fs-6" id="sucessoTitulo">Concluído!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="sucessoSub">Operação realizada com sucesso.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 4px; background: #08c068;"></div>
        </div>

        <div id="erroToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(220,53,69,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-xmark fs-5 me-2 text-danger"></i>
                    <strong class="fs-6" id="erroTitulo">Erro!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="erroSub">Ocorreu um erro ao processar.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
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
      // MÁSCARAS DE INPUT PARA CPF E TELEFONE NO FRONT-END
      // =======================================================================
      function maskPhone(v) {
          v = v.replace(/\\D/g, "");
          if (v.length > 11) v = v.slice(0, 11);
          if (v.length > 10) return v.replace(/^(\\d{2})(\\d{1})(\\d{4})(\\d{4}).*/, "($1) $2 $3-$4");
          if (v.length > 6) return v.replace(/^(\\d{2})(\\d{4})(\\d{0,4}).*/, "($1) $2-$3");
          if (v.length > 2) return v.replace(/^(\\d{2})(\\d{0,5})/, "($1) $2");
          if (v.length > 0) return v.replace(/^(\\d*)/, "($1");
          return v;
      }

      function maskCPF(v) {
          v = v.replace(/\\D/g, "");
          if (v.length > 11) v = v.slice(0, 11);
          if (v.length > 9) return v.replace(/^(\\d{3})(\\d{3})(\\d{3})(\\d{2}).*/, "$1.$2.$3-$4");
          if (v.length > 6) return v.replace(/^(\\d{3})(\\d{3})(\\d{0,3}).*/, "$1.$2.$3");
          if (v.length > 3) return v.replace(/^(\\d{3})(\\d{0,3})/, "$1.$2");
          return v;
      }

      function previewImage(inputElement, imgId) {
          if (inputElement.files && inputElement.files[0]) {
              const reader = new FileReader();
              reader.onload = function(e) {
                  document.getElementById(imgId).src = e.target.result;
              }
              reader.readAsDataURL(inputElement.files[0]);
          }
      }

      // =======================================================================
      // FILTRO E BUSCA DE COLABORADORES DO MODAL
      // =======================================================================
      function filtrarTabelaEquipe() {
          const input = document.getElementById("buscaEquipe");
          const filter = input.value.toLowerCase();
          const tbody = document.getElementById("tabelaGestaoEquipe");
          const trs = tbody.getElementsByTagName("tr");

          for (let i = 0; i < trs.length; i++) {
              const tdNome = trs[i].querySelector(".colab-nome-filtro");
              if (tdNome) {
                  const txtValue = tdNome.textContent || tdNome.innerText;
                  trs[i].style.display = txtValue.toLowerCase().indexOf(filter) > -1 ? "" : "none";
              }
          }
      }

      function limparBuscaEquipe() {
          const input = document.getElementById("buscaEquipe");
          input.value = "";
          filtrarTabelaEquipe();
          input.focus();
      }

      function abrirModalFormColaborador(id = null) {
          const modalEl = document.getElementById('modalFormColaborador');
          const form = document.getElementById('formColaborador');
          const formTitle = modalEl.querySelector('.modal-title');
          const preview = document.getElementById('previewFotoColab');

          form.reset();
          preview.src = 'https://ui-avatars.com/api/?name=Novo&background=1f1f1f&color=08c068';
          document.getElementById('uploadFotoColab').value = '';

          if (id) {
              const c = listaDB.find(x => x.id == id);
              formTitle.innerHTML = '<i class="fa-solid fa-user-pen me-2 text-accent"></i> Editar Colaborador';
              form.action = '/cadastros/usuarios/editar/' + id;
              
              form.nome.value = c.nome;
              form.tipo_usuario.value = c.tipo_usuario;
              form.cpf.value = maskCPF(c.cpf || '');
              form.telefone.value = maskPhone(c.telefone || '');
              form.banco.value = c.banco;
              form.pix.value = c.pix;
              
              if(c.fotoRaw) {
                  preview.src = c.foto;
              } else {
                  preview.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(c.nome)}&background=1f1f1f&color=08c068\`;
              }
          } else {
              formTitle.innerHTML = '<i class="fa-solid fa-user-plus me-2 text-accent"></i> Adicionar Colaborador';
              form.action = '/cadastros/usuarios/novo';
          }

          bootstrap.Modal.getOrCreateInstance(document.getElementById('modalGerirColaboradores')).hide();
          setTimeout(() => {
              bootstrap.Modal.getOrCreateInstance(modalEl).show();
          }, 400);
      }

      function abrirModalExcluirColaborador(id) {
          const c = listaDB.find(x => x.id == id);
          document.getElementById('excluirColaboradorNome').innerText = c.nome;
          document.getElementById('formExcluirColaborador').action = '/cadastros/usuarios/excluir/' + id;
          
          bootstrap.Modal.getOrCreateInstance(document.getElementById('modalGerirColaboradores')).hide();
          setTimeout(() => {
              bootstrap.Modal.getOrCreateInstance(document.getElementById('modalExcluirColaborador')).show();
          }, 400);
      }

      function voltarParaGestaoModal(idModalAtual) {
          bootstrap.Modal.getInstance(document.getElementById(idModalAtual)).hide();
          setTimeout(() => {
              bootstrap.Modal.getOrCreateInstance(document.getElementById('modalGerirColaboradores')).show();
          }, 400);
      }

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
          html += \`<li class="page-item \${currentPageCards === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="event.preventDefault(); renderCardsPage(\${currentPageCards - 1})">«</a></li>\`;
          for (let i = 1; i <= totalPages; i++) {
              html += \`<li class="page-item \${i === currentPageCards ? 'active' : ''}"><a class="page-link \${i === currentPageCards ? 'fw-bold' : ''}" href="#" onclick="event.preventDefault(); renderCardsPage(\${i})">\${i}</a></li>\`;
          }
          html += \`<li class="page-item \${currentPageCards === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="event.preventDefault(); renderCardsPage(\${currentPageCards + 1})">»</a></li></ul>\`;
          container.innerHTML = html;
      }

      // =======================================================================
      // LÓGICA DOS MODAIS E WHATSAPP
      // =======================================================================
      function fmtDataJs(dStr) {
          if(!dStr) return '-';
          try {
              const onlyDate = dStr.split('T')[0];
              const [ano, mes, dia] = onlyDate.split('-');
              return \`\${dia}/\${mes}/\${ano}\`;
          } catch(e) {
              return dStr;
          }
      }

      function enviarWppPasta(pastaId) {
          const p = pastasDB.find(x => x.id == pastaId);
          if(!p) return;

          let msg = \`Relatório de Fechamento de Diárias - Ecoflow\\n\\n\`;
          msg += \`[Diarista: \${p.nome_colaborador} ]\\n\`;
          msg += \`Pasta #\${p.id}  |  Início: \${p.data_abertura}\\n\\n\`;
          msg += \`Resumo de Registros:\\n\`;

          if(p.itens && p.itens.length > 0) {
              p.itens.forEach(item => {
                  msg += \`> \${fmtDataJs(item.data_servico)} - \${item.tipo_viagem}: R$ \${parseFloat(item.valor_total).toLocaleString('pt-BR', {minimumFractionDigits:2})}\\n\`;
              });
          }

          msg += \`\\n-------------------------------------------------\\n\\n\`;
          msg += \`Dados Bancários:\\n\`;
          msg += \`> PIX: \${p.pix}\\n\`;
          msg += \`> Banco: \${p.banco}\\n\`;
          msg += \`> CPF: \${p.cpf}\\n\`;
          msg += \`> TOTAL A PAGAR: R$ \${parseFloat(p.valor_total).toLocaleString('pt-BR', {minimumFractionDigits:2})}\`;

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
                  const btnExcluir = p.status !== 'PAGO' ? \`<form method="POST" action="/pagamentos/excluir/\${item.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Item Excluído!');"><input type="hidden" name="redirect_to" value="/diaristas"><button type="submit" class="btn btn-sm btn-outline-secondary text-danger border-custom p-1"><i class="fa-solid fa-trash"></i></button></form>\` : \`<i class="fa-solid fa-lock text-accent opacity-50"></i>\`;
                  
                  return \`<tr>
                      <td class="text-white px-3" style="font-size:0.75rem;">\${fmtDataJs(item.data_servico)}</td>
                      <td style="font-size:0.75rem;">\${item.tipo_viagem}</td>
                      <td class="text-center" style="font-size:0.75rem;">\${item.qtd_entregas}</td>
                      <td class="text-end fw-bold text-success" style="font-size:0.75rem;">R$ \${parseFloat(item.valor_total).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
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
      // AJAX E SUBMISSÃO ESTRUTURAL (SKELETON GENERATORS)
      // =======================================================================
      function gerarSkeletonCards(quantidade = 4) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += \`
              <div class="col-12 col-sm-6 col-md-4 col-xl-3">
                  <div class="card erp-card shadow-sm h-100 bg-custom-darker border-custom p-3 text-center d-flex flex-column align-items-center">
                      <div class="skeleton-dark skeleton-avatar-view mb-2" style="width: 55px; height: 55px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="width: 60%; height: 14px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="width: 40%; height: 12px; border-radius: 12px;"></div>
                      <div class="w-100 border-top border-custom pt-2 mt-2">
                          <div class="skeleton-dark skeleton-text-view mx-auto mb-1" style="width: 70%; height: 10px;"></div>
                          <div class="skeleton-dark skeleton-text-view mx-auto" style="width: 50%; height: 10px; margin-bottom: 0;"></div>
                      </div>
                  </div>
              </div>\`;
          }
          return html;
      }

      function gerarSkeletonTabela(quantidade = 4) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += \`
              <tr class="align-middle" style="height: 45px;">
                  <td class="py-1 px-3">
                      <div class="d-flex align-items-center">
                          <div class="skeleton-dark skeleton-avatar-view me-2 flex-shrink-0" style="width: 28px; height: 28px;"></div>
                          <div class="skeleton-dark skeleton-text-view" style="width: 120px; margin: 0; height: 12px;"></div>
                      </div>
                  </td>
                  <td class="py-1 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 90px; margin: 0; height: 12px;"></div></td>
                  <td class="py-1 px-3 text-center"><div class="skeleton-dark skeleton-text-view" style="width: 65px; margin: 0 auto; height: 12px;"></div></td>
                  <td class="py-1 px-3"><div class="skeleton-dark skeleton-text-view" style="width: 80px; margin: 0; height: 12px;"></div></td>
                  <td class="py-1 px-3 text-center"><div class="skeleton-dark skeleton-text-view" style="width: 90px; margin: 0 auto; height: 12px;"></div></td>
                  <td class="text-end py-1 px-3"><div class="skeleton-dark skeleton-btn-view"></div></td>
              </tr>\`;
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const container = document.getElementById('tabelaContainer');
          const grid = document.getElementById('diaristasGrid');
          const emptyState = document.querySelector('.content > .text-center-empty');
          
          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="skeleton-container">
              <div class="row g-3 mb-5">
                  \${gerarSkeletonCards(4)}
              </div>
              <div class="table-responsive bg-custom-darker rounded-3 shadow-sm border-custom mb-4">
                  <table class="table table-hover align-middle mb-0" style="font-size: 0.8rem;">
                     <thead>
                       <tr>
                         <th class="py-2 px-3">Colaborador / Pasta</th>
                         <th class="py-2 px-3">Data Abertura</th>
                         <th class="py-2 px-3 text-center">Registros Inseridos</th>
                         <th class="py-2 px-3">Valor Total</th>
                         <th class="py-2 px-3 text-center">Status da Pasta</th>
                         <th class="py-2 px-3 text-end">Ações</th>
                       </tr>
                     </thead>
                     <tbody class="border-top-0">
                        \${gerarSkeletonTabela(4)}
                     </tbody>
                  </table>
              </div>
          </div>\`;

          if (container) container.style.display = 'none';
          if (grid) grid.style.display = 'none';
          if (emptyState) emptyState.style.display = 'none';

          const insertTarget = grid || container || emptyState;
          if (insertTarget) {
              insertTarget.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const container = document.getElementById('tabelaContainer');
          const grid = document.getElementById('diaristasGrid');
          const emptyState = document.querySelector('.content > .text-center-empty');

          if (container) container.style.display = '';
          if (grid) grid.style.display = '';
          if (emptyState) emptyState.style.display = '';
      }

      mostrarSkeletonGlobais();
      window.addEventListener('load', () => {
          ocultarSkeletonGlobais();
          renderCardsPage(1); 
      });

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
          let keepGestaoEquipeOpen = false;

          if (form.id === 'formInserirItem') {
              keepPastaIdOpen = document.getElementById('formItemPastaId').value;
          } else if (form.action.includes('/diaristas/pasta/excluir/') && form.closest('#modalGerenciarPasta')) {
              keepPastaIdOpen = document.getElementById('visorPastaId').innerText;
          } else if (form.action.includes('/pagamentos/excluir/') && form.closest('#modalGerenciarPasta')) {
              keepPastaIdOpen = document.getElementById('visorPastaId').innerText;
          } else if (form.id === 'formColaborador' || form.id === 'formExcluirColaborador') {
              keepGestaoEquipeOpen = true;
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
                  } else if (keepGestaoEquipeOpen) {
                      setTimeout(() => {
                          bootstrap.Modal.getOrCreateInstance(document.getElementById('modalGestaoEquipe')).show();
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