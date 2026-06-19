// views/checklistMotoristasView.js
const menuLateral = require("./menuLateral");

function checklistMotoristasView(usuario, itens = [], paginacao = {}, filtrosDb = []) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;
  
  // Parâmetros de Filtro
  const data_inicio = paginacao.data_inicio || "";
  const data_fim = paginacao.data_fim || "";
  
  // Constrói a string de query parameters para não perder o filtro na paginação
  const qParam = (data_inicio ? `&data_inicio=${encodeURIComponent(data_inicio)}` : "") + 
                 (data_fim ? `&data_fim=${encodeURIComponent(data_fim)}` : "");

  // Recebe os dados de relacionamento unificado do banco de dados
  const filtrosData = Array.isArray(filtrosDb) ? filtrosDb : [];
  const motoristasUnicos = [...new Set(filtrosData.map(f => f.motorista))].sort();

  const fmtDataHora = (d) => {
    try {
      return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return d || "-";
    }
  };

  // 1. GERAR OS CARDS COMPACTOS COM CORES DINÂMICAS POR VEÍCULO
  const cards = itens.map(item => {
    let badgeClass = "bg-custom-dark border-custom text-muted shadow-sm";
    let iconClass = "text-muted";
    
    if (item.veiculo === "Master") {
        badgeClass = "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-50 shadow-sm";
        iconClass = "text-primary";
    } else if (item.veiculo === "Strada") {
        badgeClass = "bg-warning bg-opacity-10 text-warning border border-warning border-opacity-50 shadow-sm";
        iconClass = "text-warning";
    } else if (item.veiculo === "Fiorino") {
        badgeClass = "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-50 shadow-sm";
        iconClass = "text-danger";
    }

    return `
    <div class="col-12 col-md-6 col-lg-4 col-xl-3">
      <div class="card erp-card bg-custom-darker border-custom shadow-sm h-100 transition-hover" 
           style="cursor: pointer;" 
           data-bs-toggle="modal" 
           data-bs-target="#editarModal${item.id}"
           title="Clique para editar este checklist">
        <div class="card-body p-3 d-flex flex-column">
          
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="fw-bold text-white mb-0 text-truncate" style="font-size:0.85rem;" title="${item.motorista || "Não informado"}">
              <i class="fa-solid fa-id-card text-accent me-1"></i> ${item.motorista || "Não informado"}
            </h6>
            <span class="badge ${badgeClass}" style="font-size:0.65rem;">
              <i class="fa-solid fa-car-side ${iconClass} me-1"></i> ${item.veiculo || "-"}
            </span>
          </div>
          
          <div class="text-muted mb-3 mt-1" style="font-size:0.75rem;">
            <div class="text-truncate mb-1"><i class="fa-regular fa-clock me-1"></i> ${fmtDataHora(item.criado_em)}</div>
            <div class="text-truncate"><i class="fa-solid fa-user-pen me-1"></i> Por: ${item.registrado_por || "-"}</div>
          </div>

          <div class="mt-auto border-top border-custom pt-3 d-flex justify-content-between align-items-center gap-2">
            <a href="/checklist-motoristas/download/${item.id}" 
               class="btn btn-sm btn-outline-secondary text-white fw-medium flex-grow-1 d-flex justify-content-center align-items-center py-1" 
               title="Baixar Planilha Excel"
               onclick="event.stopPropagation();">
              <i class="fa-solid fa-file-excel text-success me-1"></i> Planilha
            </a>
            <div class="btn-group">
              <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-warning py-1 px-2" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#editarModal${item.id}" title="Editar">
                <i class="fa-solid fa-pen" style="font-size: 0.75rem;"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger py-1 px-2 ms-1" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#excluirModal${item.id}" title="Excluir">
                <i class="fa-solid fa-trash" style="font-size: 0.75rem;"></i>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `}).join("");

  // 2. GERAR OS MODAIS DE EDIÇÃO E EXCLUSÃO (COM AJAX onSubmit)
  const modais = itens.map(item => `
    <div class="modal fade" id="editarModal${item.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
        <form method="POST" action="/checklist-motoristas/editar/${item.id}" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="prepararSubmissaoSimples(event, this, 'Checklist Atualizado!')">
          <div class="modal-header bg-custom-darker border-custom">
            <h6 class="modal-title fw-bold text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Checklist</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-sm bg-custom-dark p-4">
             <div class="card bg-custom-darker border-custom shadow-sm p-3 mb-3">
              <h6 class="fw-bold mb-3 text-accent" style="font-size:0.8rem;">Informações Gerais</h6>
              <div class="row g-2">
                <div class="col-12 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.75rem;">Motorista</label>
                  <select name="motorista" class="form-select form-select-sm shadow-sm" required>
                    <option value="Flávio" ${item.motorista === "Flávio" ? "selected" : ""}>Flávio</option>
                    <option value="Alexandre" ${item.motorista === "Alexandre" ? "selected" : ""}>Alexandre</option>
                    <option value="Damião" ${item.motorista === "Damião" ? "selected" : ""}>Damião</option>
                  </select>
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.75rem;">Veículo</label>
                  <select name="veiculo" class="form-select form-select-sm shadow-sm" required>
                    <option ${item.veiculo === "Master" ? "selected" : ""}>Master</option>
                    <option ${item.veiculo === "Strada" ? "selected" : ""}>Strada</option>
                    <option ${item.veiculo === "Fiorino" ? "selected" : ""}>Fiorino</option>
                  </select>
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label text-muted mb-1" style="font-size:0.75rem;">Responsável Logístico</label>
                  <select name="responsavel" class="form-select form-select-sm shadow-sm" required>
                    <option ${item.responsavel === "Eliege" ? "selected" : ""}>Eliege</option>
                    <option ${item.responsavel === "Mirna" ? "selected" : ""}>Mirna</option>
                    <option ${item.responsavel === "Renilson" ? "selected" : ""}>Renilson</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="card bg-custom-darker border-custom shadow-sm p-3 mb-3">
                <h6 class="fw-bold mb-3 text-accent" style="font-size:0.8rem;">Estado do Veículo</h6>
                <div class="row g-2">
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;">Óleo</label><select name="oleo" class="form-select form-select-sm"><option ${item.oleo === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${item.oleo === 'Médio' ? 'selected' : ''}>Médio</option><option ${item.oleo === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;">Água</label><select name="agua" class="form-select form-select-sm"><option ${item.agua === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${item.agua === 'Médio' ? 'selected' : ''}>Médio</option><option ${item.agua === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;">Freio</label><select name="freio" class="form-select form-select-sm"><option ${item.freio === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${item.freio === 'Médio' ? 'selected' : ''}>Médio</option><option ${item.freio === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;">Direção</label><select name="direcao" class="form-select form-select-sm"><option ${item.direcao === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${item.direcao === 'Médio' ? 'selected' : ''}>Médio</option><option ${item.direcao === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;">Combustível</label><select name="combustivel" class="form-select form-select-sm"><option ${item.combustivel === 'Reserva' ? 'selected' : ''}>Reserva</option><option ${item.combustivel === 'Abaixo de meio tanque' ? 'selected' : ''}>Abaixo de meio tanque</option><option ${item.combustivel === 'Meio tanque' ? 'selected' : ''}>Meio tanque</option><option ${item.combustivel === 'Acima de meio tanque' ? 'selected' : ''}>Acima de meio tanque</option><option ${item.combustivel === 'Completo' ? 'selected' : ''}>Completo</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;">Luzes</label><select name="luzes" class="form-select form-select-sm"><option ${item.luzes === 'Todos Aptos' ? 'selected' : ''}>Todos Aptos</option><option ${item.luzes === 'Defeito pisca' ? 'selected' : ''}>Defeito pisca</option><option ${item.luzes === 'Defeito lanterna' ? 'selected' : ''}>Defeito lanterna</option><option ${item.luzes === 'Defeito farol' ? 'selected' : ''}>Defeito farol</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;">Pneu Calibragem</label><select name="pneu_calibragem" class="form-select form-select-sm"><option ${item.pneu_calibragem === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${item.pneu_calibragem === 'Médio' ? 'selected' : ''}>Médio</option><option ${item.pneu_calibragem === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;">Pneu Estado</label><select name="pneu_estado" class="form-select form-select-sm"><option ${item.pneu_estado === 'Desgastado' ? 'selected' : ''}>Desgastado</option><option ${item.pneu_estado === 'Meia vida' ? 'selected' : ''}>Meia vida</option><option ${item.pneu_estado === 'Apto' ? 'selected' : ''}>Apto</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;">Ruídos</label><select name="ruidos" class="form-select form-select-sm"><option ${item.ruidos === 'Sem ruídos anormais' ? 'selected' : ''}>Sem ruídos anormais</option><option ${item.ruidos === 'Ruído motor' ? 'selected' : ''}>Ruído motor</option><option ${item.ruidos === 'Ruído suspensão' ? 'selected' : ''}>Ruído suspensão</option><option ${item.ruidos === 'Ruído portas' ? 'selected' : ''}>Ruído portas</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;">Lixo Interno</label><select name="lixo" class="form-select form-select-sm"><option ${item.lixo === 'Pendente' ? 'selected' : ''}>Pendente</option><option ${item.lixo === 'Feito' ? 'selected' : ''}>Feito</option></select></div>
                    
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;" title="Macaco, triângulo, chave de roda">Kit Pneu</label><select name="kit_pneu" class="form-select form-select-sm"><option ${item.kit_pneu === 'Completo' ? 'selected' : ''}>Completo</option><option ${item.kit_pneu === 'Incompleto' ? 'selected' : ''}>Incompleto</option><option ${item.kit_pneu === 'Ausente' ? 'selected' : ''}>Ausente</option></select></div>
                    <div class="col-6"><label class="form-label mb-1 text-muted" style="font-size:0.75rem;" title="Cabos e suporte de celular">Acessórios Cabine</label><select name="acessorios_cabine" class="form-select form-select-sm"><option ${item.acessorios_cabine === 'Presentes' ? 'selected' : ''}>Presentes</option><option ${item.acessorios_cabine === 'Danificados' ? 'selected' : ''}>Danificados</option><option ${item.acessorios_cabine === 'Ausentes' ? 'selected' : ''}>Ausentes</option></select></div>
                </div>
            </div>
            <div class="card bg-custom-darker border-custom shadow-sm p-3 mb-1">
              <h6 class="fw-bold mb-3 text-accent" style="font-size:0.8rem;">Observações e Anexos</h6>
              <div class="row g-2">
                <div class="col-12 col-md-7">
                  <label class="form-label text-muted mb-1" style="font-size:0.75rem;">Observação Extra</label>
                  <textarea name="observacao" class="form-control form-control-sm shadow-sm" rows="3" placeholder="Algo a reportar?">${item.observacao || ""}</textarea>
                </div>
                <div class="col-12 col-md-5">
                  <label class="form-label text-muted mb-1" style="font-size:0.75rem;">Anexar Foto</label><br>
                  ${item.foto ? `<a href="/uploads/${item.foto}" target="_blank" class="btn btn-sm btn-outline-success w-100 mb-2 shadow-sm"><i class="fa-solid fa-image me-1"></i> Ver Foto</a>` : ""}
                  <input type="file" name="foto" class="form-control form-control-sm shadow-sm" accept="image/*">
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top border-custom bg-custom-darker">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-primary fw-bold text-dark shadow-sm"><i class="fa-solid fa-save me-1"></i> Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="excluirModal${item.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <form method="POST" action="/checklist-motoristas/excluir/${item.id}" onsubmit="prepararSubmissaoSimples(event, this, 'Checklist Excluído!')">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="mb-2 fw-bold text-white">Excluir Checklist?</h6>
              <p class="text-muted mb-0" style="font-size:0.8rem;">Deseja excluir o checklist do motorista <b>${item.motorista}</b>?</p>
            </div>
            <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Sim, Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `).join("");

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
          html += `<li class="page-item"><a class="page-link" href="/checklist-motoristas?page=${ultima + 1}${qParam}" onclick="navegarPagina(event, this.href)">${ultima + 1}</a></li>`;
        } else if (p - ultima > 2) {
          html += `<li class="page-item disabled"><span class="page-link text-muted border-0 bg-transparent">...</span></li>`;
        }
      }
      html += `<li class="page-item ${p === page ? "active" : ""}"><a class="page-link ${p === page ? "fw-bold" : ""}" href="/checklist-motoristas?page=${p}${qParam}" onclick="navegarPagina(event, this.href)">${p}</a></li>`;
      ultima = p;
    });

    return html;
  })();

  const paginacaoHtml = totalPages > 1 ? `
    <nav aria-label="Paginação" class="mt-4">
      <ul class="pagination pagination-sm justify-content-center mb-4">
        <li class="page-item ${page <= 1 ? "disabled" : ""}">
          <a class="page-link" href="/checklist-motoristas?page=${page - 1}${qParam}" onclick="navegarPagina(event, this.href)">&laquo;</a>
        </li>
        ${pageLinks}
        <li class="page-item ${page >= totalPages ? "disabled" : ""}">
          <a class="page-link" href="/checklist-motoristas?page=${page + 1}${qParam}" onclick="navegarPagina(event, this.href)">&raquo;</a>
        </li>
      </ul>
    </nav>
  ` : "";

  const menuHTML = menuLateral(user, "/checklist-motoristas");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Checklist | Ecoflow</title>
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

      .erp-card { border-radius: 12px; transition: transform 0.2s; overflow: hidden; background-color: #2a2a2a; border: 1px solid rgba(255,255,255,0.05); }
      .transition-hover:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.3) !important; border-color: rgba(255,255,255,0.15); }
      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      
      /* Pagination */
      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
      .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.05); }

      /* Wizard Styles (Adaptado Dark) */
      .wizard-step { display: none; animation: slideIn 0.3s ease-out forwards; }
      .wizard-step.active { display: block; }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .slide-img-container {
        width: 100%;
        height: 180px;
        background: #2a2a2a;
        border-radius: 10px;
        margin-bottom: 20px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .slide-img-container img { width: 100%; height: 100%; object-fit: contain; filter: brightness(0.9); }
      .wizard-header { background: #222; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 15px 20px; border-radius: 12px 12px 0 0; }
      .wizard-progress { height: 6px; background-color: #1f1f1f; border-radius: 10px; overflow: hidden; margin-top: 10px; border: 1px solid rgba(255,255,255,0.05); }
      .wizard-progress-bar { height: 100%; background-color: #08c068; width: 0%; transition: width 0.3s ease; }

      /* ANIMAÇÕES GLOBAIS (TOASTS E MODAIS) */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .modal.fade .modal-dialog { transform: scale(0.85) translateY(30px); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
      .modal.show .modal-dialog { transform: scale(1) translateY(0); }

      .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      /* SKELETON LOADING (DARK) */
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
      .skeleton-btn-view { height: 26px; width: 50px; border-radius: 4px; display: inline-block; }
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
        <hr class="border-custom mt-4">
        <a href="/logout" class="text-danger mt-2" style="font-size: 0.85rem;"><i class="fas fa-sign-out-alt me-2"></i>Sair do Sistema</a>
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-clipboard-list text-muted me-2"></i>Checklist Diário</h5>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.7rem;">Controle e inspeção de frota</span>
            </div>
        </div>
      </div>

      <div class="bg-custom-darker p-3 rounded-3 shadow-sm border border-custom mb-4">
        <div class="row g-3 align-items-end">
          
          <div class="col-12 col-lg-8">
            <form id="formFiltro" method="GET" action="/checklist-motoristas" class="row g-2 align-items-end" onsubmit="prepararBuscaSimples(event, this, 'Filtros Aplicados!')">
              <div class="col-12 col-sm-5">
                <label class="form-label text-muted mb-1" style="font-size:0.75rem;">Data Inicial (De:)</label>
                <input type="date" name="data_inicio" class="form-control form-control-sm shadow-sm" value="${data_inicio}">
              </div>
              <div class="col-12 col-sm-5">
                <label class="form-label text-muted mb-1" style="font-size:0.75rem;">Data Final (Até:)</label>
                <input type="date" name="data_fim" class="form-control form-control-sm shadow-sm" value="${data_fim}">
              </div>
              <div class="col-12 col-sm-2 d-flex gap-2 mt-2 mt-sm-0">
                <button type="submit" class="btn btn-sm btn-primary flex-grow-1 shadow-sm px-0 fw-bold text-dark">Buscar</button>
                <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger px-2 shadow-sm" title="Limpar Filtros" onclick="limparFiltrosChecklist()"><i class="fa-solid fa-eraser"></i></button>
              </div>
            </form>
          </div>

          <div class="col-12 col-lg-4 d-flex justify-content-lg-end gap-2">
              <button class="btn btn-sm btn-success shadow-sm flex-grow-1 flex-lg-grow-0 text-nowrap fw-bold text-dark" data-bs-toggle="modal" data-bs-target="#novoChecklistModal">
                <i class="fa-solid fa-plus me-1"></i> Novo Checklist
              </button>
              <button class="btn btn-sm btn-outline-success shadow-sm flex-grow-1 flex-lg-grow-0 text-nowrap fw-bold" data-bs-toggle="modal" data-bs-target="#relatorioModal">
                <i class="fa-solid fa-file-excel me-1"></i> Relatório
              </button>
          </div>

        </div>
      </div>

      <div class="row g-3">
        ${itens.length > 0 ? cards : `<div class="col-12 text-center text-muted mt-4"><i class="fa-solid fa-clipboard fa-3x opacity-25 mb-3 d-block"></i><span style="font-size:0.8rem;">Nenhum checklist encontrado.</span></div>`}
      </div>
      
      ${paginacaoHtml}
    </div>

    <div class="modal fade" id="novoChecklistModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form id="wizardForm" method="POST" action="/checklist-motoristas/novo" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0 bg-custom-darker" onsubmit="event.preventDefault();">
          
          <div class="wizard-header bg-custom-darker border-custom">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-0 text-white" id="stepTitle" style="font-size: 0.85rem;">Passo 1</h6>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" onclick="resetWizard()"></button>
            </div>
            <div class="wizard-progress">
              <div class="wizard-progress-bar" id="progressBar"></div>
            </div>
          </div>
          
          <div class="modal-body p-4 bg-custom-dark" style="min-height: 480px;">

            <div class="wizard-step active" data-title="Identificação">
              <div class="slide-img-container bg-custom-darker border-custom shadow-sm">
                <img src="/img/motorista.png" onerror="this.src='./img/motorista.png'" alt="Identificação">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Motorista</label>
                <select name="motorista" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Flávio">Flávio</option>
                  <option value="Alexandre">Alexandre</option>
                  <option value="Damião">Damião</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Veículo</label>
                <select name="veiculo" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Master">Renault Master</option>
                  <option value="Strada">Fiat Strada</option>
                  <option value="Fiorino">Fiat Fiorino</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Responsável Logístico</label>
                <select name="responsavel" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Eliege">Eliege</option>
                  <option value="Mirna">Mirna</option>
                  <option value="Renilson">Renilson</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Nível de Óleo e Água">
              <div class="slide-img-container bg-custom-darker border-custom shadow-sm">
                <img src="./img/oleo-e-agua.png" onerror="this.src='./img/oleo-e-agua.png'" alt="Motor">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Como está o nível do Óleo?</label>
                <select name="oleo" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto (Normal)</option>
                  <option value="Médio">Médio</option>
                  <option value="Baixo">Baixo (Crítico)</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Como está a Água do Radiador?</label>
                <select name="agua" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto (Normal)</option>
                  <option value="Médio">Médio</option>
                  <option value="Baixo">Baixo (Crítico)</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Fluidos Complementares">
              <div class="slide-img-container bg-custom-darker border-custom shadow-sm">
                <img src="./img/freio.png" onerror="this.src='./img/freio.png'" alt="Fluidos">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Fluido de Freio</label>
                <select name="freio" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto</option>
                  <option value="Médio">Médio</option>
                  <option value="Baixo">Baixo</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Fluido de Direção Hidráulica</label>
                <select name="direcao" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto</option>
                  <option value="Médio">Médio</option>
                  <option value="Baixo">Baixo</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Pneus">
              <div class="slide-img-container bg-custom-darker border-custom shadow-sm">
                <img src="./img/pneus.png" onerror="this.src='./img/pneus.png'" alt="Pneus">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Calibragem dos Pneus</label>
                <select name="pneu_calibragem" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto (Calibrados)</option>
                  <option value="Médio">Médio</option>
                  <option value="Baixo">Baixo (Murchos)</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Estado de Conservação</label>
                <select name="pneu_estado" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Apto">Apto (Bons)</option>
                  <option value="Meia vida">Meia vida</option>
                  <option value="Desgastado">Desgastados (Carecas)</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Sinalização e Mecânica">
              <div class="slide-img-container bg-custom-darker border-custom shadow-sm">
                <img src="/img/luzes-e-ruidos.png" onerror="this.src='./img/luzes-e-ruidos.png'" alt="Luzes e Motor">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Luzes e Lanternas</label>
                <select name="luzes" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Todos Aptos">Todos Aptos (Funcionando)</option>
                  <option value="Defeito pisca">Defeito no Pisca</option>
                  <option value="Defeito lanterna">Defeito na Lanterna</option>
                  <option value="Defeito farol">Defeito no Farol</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Ruídos Anormais no Veículo</label>
                <select name="ruidos" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Sem ruídos anormais">Sem ruídos (Normal)</option>
                  <option value="Ruído motor">Barulho no Motor</option>
                  <option value="Ruído suspensão">Barulho na Suspensão</option>
                  <option value="Ruído portas">Barulho nas Portas</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Interior e Autonomia">
              <div class="slide-img-container bg-custom-darker border-custom shadow-sm">
                <img src="/img/limpeza-e-combustivel.png" onerror="this.src='./img/limpeza-e-combustivel.png'" alt="Interior">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Nível de Combustível</label>
                <select name="combustivel" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Completo">Tanque Cheio</option>
                  <option value="Acima de meio tanque">Acima de meio tanque</option>
                  <option value="Meio tanque">Meio tanque</option>
                  <option value="Abaixo de meio tanque">Abaixo de meio tanque</option>
                  <option value="Reserva">Reserva</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Limpeza: Lixo interno removido?</label>
                <select name="lixo" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Feito">Sim, Feito (Limpo)</option>
                  <option value="Pendente">Pendente (Sujo)</option>
                </select>
              </div>
            </div>
            
            <div class="wizard-step" data-title="Ferramentas e Acessórios">
              <div class="slide-img-container bg-custom-darker border-custom shadow-sm d-flex align-items-center justify-content-center">
                <i class="fa-solid fa-toolbox fa-5x text-muted opacity-25"></i>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-0 fw-bold" style="font-size:0.75rem;">Kit básico de troca de pneu</label>
                <div class="text-muted mb-1" style="font-size:0.65rem;">(Macaco, triângulo, chave de roda)</div>
                <select name="kit_pneu" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Completo">Completo</option>
                  <option value="Incompleto">Incompleto</option>
                  <option value="Ausente">Ausente</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-0 fw-bold" style="font-size:0.75rem;">Acessórios de Cabine</label>
                <div class="text-muted mb-1" style="font-size:0.65rem;">(Cabos e suporte de celular)</div>
                <select name="acessorios_cabine" class="form-select form-select-sm shadow-sm" required>
                  <option value="" disabled selected>Selecione...</option>
                  <option value="Presentes">Presentes (Aptos)</option>
                  <option value="Danificados">Danificados</option>
                  <option value="Ausentes">Ausentes</option>
                </select>
              </div>
            </div>

            <div class="wizard-step" data-title="Finalização">
              <div class="slide-img-container bg-custom-darker border-custom shadow-sm">
                 <img src="/img/observacoes.png" onerror="this.src='./img/observacoes.png'" alt="Foto">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Anexar Foto do Veículo</label>
                <input type="file" name="foto" class="form-control form-control-sm shadow-sm" accept="image/*">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted mb-1 fw-bold" style="font-size:0.75rem;">Observações Extras</label>
                <textarea name="observacao" class="form-control form-control-sm shadow-sm" rows="3" placeholder="Algo mais a reportar? Descreva aqui..."></textarea>
              </div>
            </div>

          </div>

          <div class="modal-footer bg-custom-darker border-custom d-flex justify-content-between p-3 rounded-bottom-3">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white px-3 py-1" id="prevBtn" onclick="nextPrev(-1)" style="display:none;">Voltar</button>
            <button type="button" class="btn btn-sm btn-primary flex-grow-1 ms-2 py-1 fw-bold shadow-sm text-dark" id="nextBtn" onclick="nextPrev(1)">Próximo <i class="fa-solid fa-chevron-right ms-1"></i></button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="relatorioModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <form method="GET" action="/checklist-motoristas/relatorio" target="_blank" onsubmit="iniciarDownloadRelatorio(this)">
            <div class="modal-header bg-custom-darker border-custom pb-3">
              <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-file-excel text-success me-2"></i> Relatório Mensal</h6>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4 bg-custom-dark">
              <p class="text-muted mb-3" style="font-size:0.75rem;">Filtre os dados para gerar a planilha consolidada.</p>
              
              <div class="mb-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Motorista</label>
                <select id="relatorioMotorista" name="motorista" class="form-select form-select-sm shadow-sm">
                  <option value="">Todos os Motoristas</option>
                  ${motoristasUnicos.map(m => `<option value="${m}">${m}</option>`).join("")}
                </select>
              </div>

              <div class="row g-2 mb-2">
                <div class="col-6">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Ano</label>
                  <select id="relatorioAno" name="ano" class="form-select form-select-sm shadow-sm">
                    <option value="">Todos</option>
                    </select>
                </div>
                <div class="col-6">
                  <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Mês</label>
                  <select id="relatorioMes" name="mes" class="form-select form-select-sm shadow-sm">
                    <option value="">Todos</option>
                    </select>
                </div>
              </div>
            </div>
            <div class="modal-footer bg-custom-darker border-custom d-flex justify-content-between">
              <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-success w-100 mt-2 m-0 fw-bold shadow-sm text-dark"><i class="fa-solid fa-download me-1"></i> Gerar Excel</button>
            </div>
          </form>
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
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
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
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="erroSub">Ocorreu um erro ao processar.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
        </div>
    </div>

    ${modais}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      // ==========================================
      // LÓGICA CASCATA DO FILTRO (MOTORISTA -> ANO -> MÊS)
      // ==========================================
      const filtrosData = ${JSON.stringify(filtrosData)};
      const nomesMesesJs = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];

      const selectMot = document.getElementById('relatorioMotorista');
      const selectAno = document.getElementById('relatorioAno');
      const selectMes = document.getElementById('relatorioMes');

      function atualizaFiltros(e) {
          if(!selectMot || !selectAno || !selectMes) return;

          const changedElement = e ? e.target.id : null;
          const motSel = selectMot.value;
          const anoSel = selectAno.value;
          const mesSel = selectMes.value;

          let dadosFiltradosMot = filtrosData;
          if (motSel) {
              dadosFiltradosMot = filtrosData.filter(f => f.motorista === motSel);
          }

          if (changedElement === 'relatorioMotorista' || !changedElement) {
              const anosDisponiveis = [...new Set(dadosFiltradosMot.map(f => f.ano))].sort((a,b) => b - a);
              const keepsAno = anosDisponiveis.includes(Number(anoSel));
              
              selectAno.innerHTML = '<option value="">Todos</option>';
              anosDisponiveis.forEach(a => {
                  selectAno.innerHTML += \`<option value="\${a}" \${keepsAno && anoSel == a ? 'selected' : ''}>\${a}</option>\`;
              });
          }

          const anoAtualizado = selectAno.value;
          let dadosFiltradosAno = dadosFiltradosMot;
          if (anoAtualizado) {
              dadosFiltradosAno = dadosFiltradosMot.filter(f => f.ano == anoAtualizado);
          }

          const mesesDisponiveis = [...new Set(dadosFiltradosAno.map(f => f.mes))].sort((a,b) => a - b);
          const keepsMes = mesesDisponiveis.includes(Number(mesSel));

          selectMes.innerHTML = '<option value="">Todos</option>';
          mesesDisponiveis.forEach(m => {
              const valStr = String(m).padStart(2, '0');
              const nomeM = nomesMesesJs[m - 1];
              selectMes.innerHTML += \`<option value="\${valStr}" \${keepsMes && Number(mesSel) == m ? 'selected' : ''}>\${nomeM}</option>\`;
          });
      }

      if (selectMot && selectAno && selectMes) {
          selectMot.addEventListener('change', atualizaFiltros);
          selectAno.addEventListener('change', atualizaFiltros);
          atualizaFiltros(); 
      }

      // =======================================================================
      // FUNÇÃO GENÉRICA DE TOASTS
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

              const toast = new bootstrap.Toast(toastEl, {
                  autohide: true,
                  delay: 5000
              });
              
              toast.show();
          }
      }

      function mostrarToastCarregando(mensagem) {
          const successToastEl = document.getElementById('sucessoToast');
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
      // SKELETON LOADING (MODO ESCURO)
      // =======================================================================
      function gerarSkeletonCards(quantidade = 8) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += \`
              <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                <div class="card erp-card bg-custom-darker border-custom shadow-sm border-0 h-100 p-2">
                  <div class="card-body p-2 d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div class="skeleton-dark skeleton-text-view" style="width: 60%; margin: 0;"></div>
                      <div class="skeleton-dark skeleton-text-view" style="width: 30%; height: 20px; border-radius: 10px; margin: 0;"></div>
                    </div>
                    <div class="mb-2 mt-2">
                      <div class="skeleton-dark skeleton-text-view" style="width: 80%;"></div>
                      <div class="skeleton-dark skeleton-text-view" style="width: 50%;"></div>
                    </div>
                    <div class="mt-auto border-top border-custom pt-2 d-flex justify-content-between align-items-center gap-2">
                       <div class="skeleton-dark skeleton-btn-view" style="width: 60%;"></div>
                       <div class="skeleton-dark skeleton-btn-view" style="width: 30%;"></div>
                    </div>
                  </div>
                </div>
              </div>\`;
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const cardContainer = document.querySelector('.content > .row.g-3');
          const emptyState = document.querySelector('.content > .row.g-3 > .col-12.text-center');

          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="row g-3 skeleton-container">
              \${gerarSkeletonCards(8)}
          </div>\`;

          if (cardContainer && !cardContainer.classList.contains('skeleton-container')) {
              cardContainer.style.display = 'none';
              cardContainer.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const cardContainer = document.querySelector('.content > .row.g-3:not(.skeleton-container)');
          if (cardContainer) cardContainer.style.display = 'flex';
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
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      function limparFiltrosChecklist() {
          const form = document.getElementById('formFiltro');
          if (form) {
              form.querySelectorAll('input').forEach(i => i.value = '');
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
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      function atualizarModaisDinamicos(doc) {
          const staticModals = ['novoChecklistModal', 'relatorioModal', 'sidebarMenu'];
          document.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) m.remove();
          });
          doc.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
          });
      }

      // =======================================================================
      // DOWNLOAD DE RELATÓRIO COM TOAST (Nativo via target="_blank")
      // =======================================================================
      function iniciarDownloadRelatorio(form) {
          const modalEl = form.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }
          mostrarToast('sucesso', 'Download Iniciado!', 'O seu relatório Excel está sendo baixado.');
      }

      // =======================================================================
      // SUBMISSÃO AJAX SEM RECARREGAR A PÁGINA (SUPORTA FOTOS) PARA CRUD
      // =======================================================================
      let isSubmitting = false;

      async function prepararSubmissaoSimples(event, form, titleMsg) {
          if (event) event.preventDefault();
          if (isSubmitting) return;

          const modalEl = form.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }

          document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
          document.body.classList.remove('modal-open');
          document.body.style = '';

          mostrarToastCarregando("Aguarde um momento...");
          isSubmitting = true;

          try {
              const formData = new FormData(form);

              const response = await fetch(form.action, {
                  method: form.method || 'POST',
                  body: formData 
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
                  if (form.id === 'wizardForm') {
                      resetWizard();
                  }

                  mostrarToast('sucesso', 'Concluído!', titleMsg);
              } else {
                  mostrarToast('erro', 'Erro', 'Não foi possível guardar os dados no servidor.');
              }
          } catch (err) {
              console.error(err);
              mostrarToast('erro', 'Falha de Conexão', 'Verifique a sua rede e tente novamente.');
          } finally {
              isSubmitting = false;
          }
      }

      // ==========================================
      // LÓGICA DO WIZARD ANIMADO
      // ==========================================
      let currentTab = 0;

      function showTab(n) {
        const steps = document.getElementsByClassName("wizard-step");
        if(steps.length === 0) return;
        
        for (let i = 0; i < steps.length; i++) {
          steps[i].classList.remove("active");
        }
        steps[n].classList.add("active");
        
        const title = steps[n].getAttribute("data-title");
        const stepTitle = document.getElementById("stepTitle");
        if(stepTitle) stepTitle.innerText = "Passo " + (n + 1) + " de " + steps.length + " - " + title;
        
        const progress = ((n + 1) / steps.length) * 100;
        const progressBar = document.getElementById("progressBar");
        if(progressBar) progressBar.style.width = progress + "%";

        const prevBtn = document.getElementById("prevBtn");
        if (prevBtn) {
            if (n === 0) {
              prevBtn.style.display = "none";
            } else {
              prevBtn.style.display = "inline-block";
            }
        }

        const nextBtn = document.getElementById("nextBtn");
        if (nextBtn) {
            if (n === (steps.length - 1)) {
              nextBtn.innerHTML = 'Finalizar e Enviar <i class="fa-solid fa-check ms-1"></i>';
              nextBtn.classList.replace("btn-primary", "btn-success");
            } else {
              nextBtn.innerHTML = 'Próximo <i class="fa-solid fa-chevron-right ms-1"></i>';
              nextBtn.classList.replace("btn-success", "btn-primary");
            }
        }
      }

      function validateForm(tabIndex) {
        const steps = document.getElementsByClassName("wizard-step");
        if(steps.length === 0) return true;
        const step = steps[tabIndex];
        const inputs = step.querySelectorAll("input[required], select[required], textarea[required]");
        let valid = true;
        for (let i = 0; i < inputs.length; i++) {
          if (!inputs[i].checkValidity()) {
            inputs[i].reportValidity();
            valid = false;
            break;
          }
        }
        return valid;
      }

      function nextPrev(n) {
        const steps = document.getElementsByClassName("wizard-step");
        if (n === 1 && !validateForm(currentTab)) return false;
        currentTab = currentTab + n;
        
        if (currentTab >= steps.length) {
          const form = document.getElementById("wizardForm");
          prepararSubmissaoSimples(null, form, 'Checklist Registrado!');
          return false;
        }
        showTab(currentTab);
      }

      function resetWizard() {
        currentTab = 0;
        showTab(0);
      }

      window.addEventListener('load', () => {
        resetWizard(); 
        const modalEl = document.getElementById('novoChecklistModal');
        if(modalEl) {
           modalEl.addEventListener('hidden.bs.modal', function () {
             if (!isSubmitting) {
               const formW = document.getElementById("wizardForm");
               if(formW) formW.reset();
               resetWizard();
             }
           });
        }
      });
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = checklistMotoristasView;