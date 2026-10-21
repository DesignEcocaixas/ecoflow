// views/facasView.js
const menuLateral = require("./menuLateral");
const termosComponent = require("./termosComponent");

function facasView(usuario, facas = [], filtros = {}, paginacao = {}, chapasDisponiveis = []) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };
  const termosHTML = termosComponent(user);
  
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  const qsParams = [];
  if (filtros.busca) qsParams.push(`busca=${encodeURIComponent(filtros.busca)}`);
  if (filtros.categoria) qsParams.push(`categoria=${encodeURIComponent(filtros.categoria)}`);
  const baseQueryString = qsParams.length > 0 ? '&' + qsParams.join('&') : '';

  const selectOptionsNovo = (chapasDisponiveis || []).map(c => {
      const safeValue = c.modelo ? c.modelo.replace(/"/g, '&quot;') : '';
      const labelParts = [c.modelo, c.material, c.fornecedor, c.medida].filter(val => val && val.trim() !== '');
      const label = labelParts.length > 0 ? labelParts.join(' / ') : (c.modelo || 'Sem identificação');
      return '<option value="' + safeValue + '">' + label + '</option>';
  }).join('');

  const cardsFacas = facas.length > 0 ? facas.map(f => {
      const imgCapa = f.foto ? '/uploads/' + f.foto : null;
      const catColor = f.categoria === 'rotativa' ? 'bg-primary' : 'bg-warning text-dark';
      
      let chapasHtml = '';
      try {
          const chapas = Array.isArray(f.chapas_utilizadas) ? f.chapas_utilizadas : JSON.parse(f.chapas_utilizadas || '[]');
          if (chapas.length > 0) {
              chapasHtml = chapas.map(ch => '<span class="badge bg-custom-dark border border-custom text-muted" style="font-size: 0.6rem; padding: 3px 5px;">' + ch + '</span>').join('');
          } else {
              chapasHtml = '<span class="text-muted small">-</span>';
          }
      } catch (e) {
          chapasHtml = '<span class="text-muted small">' + (f.chapas_utilizadas || '-') + '</span>';
      }

      return '' +
      '<div class="col-12 col-md-6 col-lg-4 col-xl-3 faca-card-item">' +
          '<div class="card erp-card border-custom bg-custom-darker h-100 shadow-sm d-flex flex-column" style="cursor: pointer;" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById(\'detalheFacaModal' + f.id + '\')).show();">' +
              '<div class="position-relative">' +
                  (imgCapa 
                      ? '<img src="' + imgCapa + '" class="card-img-top border-bottom border-custom" style="height: 140px; object-fit: cover;" alt="' + f.modelo + '">' 
                      : '<div class="card-img-top border-bottom border-custom d-flex align-items-center justify-content-center bg-custom-dark" style="height: 140px;"><i class="fa-solid fa-image fa-2x text-muted opacity-25"></i></div>'
                  ) +
                  '<span class="badge ' + catColor + ' position-absolute shadow-sm" style="top: 8px; right: 8px; font-size: 0.6rem; text-transform: uppercase; padding: 4px 6px;">' +
                      (f.categoria || 'Não definida') +
                  '</span>' +
              '</div>' +
              '<div class="card-body p-3 flex-grow-1">' +
                  '<div class="mb-2">' +
                      '<h6 class="fw-bold text-white mb-0 text-truncate" style="font-size: 0.9rem;" title="' + f.modelo + ' | Ref: ' + (f.tamanho_referencia || '-') + '">' + 
                          (f.modelo || 'Sem Modelo') + 
                          ' <span class="text-accent fw-normal ms-1" style="font-size: 0.7rem;"><i class="fa-solid fa-tag me-1"></i>' + (f.tamanho_referencia || '-') + '</span>' +
                      '</h6>' +
                  '</div>' +
                  
                  '<div class="d-flex flex-column gap-1" style="font-size: 0.7rem;">' +
                      '<div class="d-flex justify-content-between border-bottom border-custom pb-1">' +
                          '<span class="text-white-50">Versão:</span>' +
                          '<span class="text-white fw-medium text-truncate" style="max-width: 65%;" title="' + (f.versao || '') + '">' + (f.versao || '-') + '</span>' +
                      '</div>' +
                      '<div class="d-flex justify-content-between border-bottom border-custom pb-1">' +
                          '<span class="text-white-50">Medida:</span>' +
                          '<span class="text-white fw-medium text-truncate" style="max-width: 65%;" title="' + (f.medida || '') + '">' + (f.medida || '-') + '</span>' +
                      '</div>' +
                      '<div class="d-flex justify-content-between border-bottom border-custom pb-1">' +
                          '<span class="text-white-50">Componente:</span>' +
                          '<span class="text-white fw-medium text-truncate" style="max-width: 65%;" title="' + (f.componente || '') + '">' + (f.componente || '-') + '</span>' +
                      '</div>' +
                      '<div class="d-flex justify-content-between border-bottom border-custom pb-1">' +
                          '<span class="text-white-50">Utilização:</span>' +
                          '<span class="text-white fw-medium text-truncate" style="max-width: 65%;" title="' + (f.utilizacao || '') + '">' + (f.utilizacao || '-') + '</span>' +
                      '</div>' +
                      '<div class="mt-1">' +
                          '<span class="text-white-50 d-block mb-1">Chapas:</span>' +
                          '<div class="d-flex flex-wrap gap-1">' + chapasHtml + '</div>' +
                      '</div>' +
                  '</div>' +
              '</div>' +
              '<div class="card-footer bg-transparent border-top border-custom p-2 d-flex justify-content-between">' +
                  '<button class="btn btn-sm btn-outline-warning border-0 py-1 px-2" style="font-size: 0.7rem;" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#editarFacaModal' + f.id + '" title="Editar"><i class="fa-solid fa-pen me-1"></i> Editar</button>' +
                  '<button class="btn btn-sm btn-outline-danger border-0 py-1 px-2" style="font-size: 0.7rem;" onclick="event.stopPropagation();" data-bs-toggle="modal" data-bs-target="#excluirFacaModal' + f.id + '" title="Excluir"><i class="fa-solid fa-trash"></i></button>' +
              '</div>' +
          '</div>' +
      '</div>';
  }).join('') : '<div class="col-12 text-center text-muted py-5 text-center-empty"><i class="fa-solid fa-scissors fa-3x opacity-25 mb-3"></i><p style="font-size:0.85rem;">Nenhuma faca encontrada no catálogo.</p></div>';

  const modais = facas.map(f => {
      let chapasSelecionadas = [];
      try {
          chapasSelecionadas = Array.isArray(f.chapas_utilizadas) ? f.chapas_utilizadas : JSON.parse(f.chapas_utilizadas || '[]');
      } catch(e) {}

      let chapasEdicaoHtml = '';
      if (chapasSelecionadas.length > 0) {
          chapasEdicaoHtml = chapasSelecionadas.map((chapaSel, idx) => {
              const opts = (chapasDisponiveis || []).map(c => {
                  const safeValue = c.modelo ? c.modelo.replace(/"/g, '&quot;') : '';
                  const sel = (c.modelo === chapaSel) ? 'selected' : '';
                  const labelParts = [c.modelo, c.material, c.fornecedor, c.medida].filter(val => val && val.trim() !== '');
                  const label = labelParts.length > 0 ? labelParts.join(' / ') : (c.modelo || 'Sem identificação');
                  return '<option value="' + safeValue + '" ' + sel + '>' + label + '</option>';
              }).join('');
              
              return '<div class="d-flex gap-2 align-items-center chapa-row ' + (idx > 0 ? 'mt-2' : '') + '">' +
                  '<select name="chapas_utilizadas" class="form-select form-select-sm shadow-sm">' +
                      '<option value="">Nenhuma / Selecione...</option>' +
                      opts +
                  '</select>' +
                  '<button type="button" class="btn btn-sm btn-outline-danger border-0 p-1" onclick="this.closest(\'.chapa-row\').remove();" title="Remover"><i class="fa-solid fa-xmark"></i></button>' +
              '</div>';
          }).join('');
      } else {
          chapasEdicaoHtml = '<div class="d-flex gap-2 align-items-center chapa-row">' +
              '<select name="chapas_utilizadas" class="form-select form-select-sm shadow-sm">' +
                  '<option value="">Nenhuma / Selecione...</option>' +
                  selectOptionsNovo +
              '</select>' +
              '<button type="button" class="btn btn-sm btn-outline-danger border-0 p-1" onclick="this.closest(\'.chapa-row\').remove();" title="Remover"><i class="fa-solid fa-xmark"></i></button>' +
          '</div>';
      }

      const imgCapa = f.foto ? '/uploads/' + f.foto : null;
      const catColor = f.categoria === 'rotativa' ? 'bg-primary' : 'bg-warning text-dark';
      
      let chapasHtml = '';
      if (chapasSelecionadas.length > 0) {
          chapasHtml = chapasSelecionadas.map(ch => '<span class="badge bg-custom-darker border border-custom text-muted me-1 mb-1">' + ch + '</span>').join('');
      } else {
          chapasHtml = '<span class="text-muted small">-</span>';
      }

      return '' +
      '<!-- Modal Detalhes -->' +
      '<div class="modal fade" id="detalheFacaModal' + f.id + '" tabindex="-1">' +
          '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
              '<div class="modal-content erp-modal shadow-lg border-0">' +
                  '<div class="modal-header bg-custom-darker border-custom text-white py-3">' +
                      '<h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-scissors text-accent me-2"></i> Detalhes da Faca</h6>' +
                      '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>' +
                  '</div>' +
                  '<div class="modal-body p-4 bg-custom-dark text-sm">' +
                      '<div class="text-center mb-4">' +
                          (imgCapa ? '<img src="' + imgCapa + '" class="img-fluid rounded border border-custom shadow-sm" style="max-height: 200px; object-fit: contain; width: 100%;">' : '<div class="bg-custom-darker rounded border border-custom d-flex align-items-center justify-content-center mx-auto" style="height: 150px; width: 100%;"><i class="fa-solid fa-image fa-3x text-muted opacity-25"></i></div>') +
                      '</div>' +
                      '<div class="row g-3">' +
                          '<div class="col-6"><strong class="d-block text-white-50 mb-1" style="font-size: 0.7rem;">Código / ID</strong><span class="text-white fw-bold">' + f.id + '</span></div>' +
                          '<div class="col-6"><strong class="d-block text-white-50 mb-1" style="font-size: 0.7rem;">Categoria</strong><span class="badge ' + catColor + ' text-uppercase">' + f.categoria + '</span></div>' +
                          '<div class="col-12"><strong class="d-block text-white-50 mb-1" style="font-size: 0.7rem;">Modelo</strong><span class="text-white fs-6 fw-bold">' + f.modelo + '</span></div>' +
                          '<div class="col-4"><strong class="d-block text-white-50 mb-1" style="font-size: 0.7rem;">Tam. Ref.</strong><span class="text-white">' + (f.tamanho_referencia || '-') + '</span></div>' +
                          '<div class="col-4"><strong class="d-block text-white-50 mb-1" style="font-size: 0.7rem;">Medida</strong><span class="text-white">' + (f.medida || '-') + '</span></div>' +
                          '<div class="col-4"><strong class="d-block text-white-50 mb-1" style="font-size: 0.7rem;">Versão</strong><span class="text-white">' + (f.versao || '-') + '</span></div>' +
                          '<div class="col-6"><strong class="d-block text-white-50 mb-1" style="font-size: 0.7rem;">Componente</strong><span class="text-white">' + (f.componente || '-') + '</span></div>' +
                          '<div class="col-6"><strong class="d-block text-white-50 mb-1" style="font-size: 0.7rem;">Configuração</strong><span class="text-white">' + (f.configuracao || '-') + '</span></div>' +
                          '<div class="col-12"><strong class="d-block text-white-50 mb-1" style="font-size: 0.7rem;">Utilização</strong><span class="text-white">' + (f.utilizacao || '-') + '</span></div>' +
                          '<div class="col-12"><strong class="d-block text-white-50 mb-1" style="font-size: 0.7rem;">Chapas Utilizadas</strong><div class="d-flex flex-wrap mt-1">' + chapasHtml + '</div></div>' +
                      '</div>' +
                  '</div>' +
                  '<div class="modal-footer bg-custom-darker border-custom d-flex justify-content-between py-2">' +
                      '<button type="button" class="btn btn-sm btn-outline-secondary text-white fw-bold" data-bs-dismiss="modal">Fechar</button>' +
                      '<div class="d-flex gap-2">' +
                          '<a href="/catalogo-facas/ficha/' + f.id + '" target="_blank" class="btn btn-sm btn-info fw-bold text-dark shadow-sm"><i class="fa-solid fa-qrcode me-1"></i> Ficha / QR</a>' +
                          '<button type="button" class="btn btn-sm btn-warning fw-bold text-dark" onclick="bootstrap.Modal.getInstance(document.getElementById(\'detalheFacaModal' + f.id + '\')).hide(); bootstrap.Modal.getOrCreateInstance(document.getElementById(\'editarFacaModal' + f.id + '\')).show();"><i class="fa-solid fa-pen me-1"></i> Editar</button>' +
                      '</div>' +
                  '</div>' +
              '</div>' +
          '</div>' +
      '</div>' +

      '<!-- Modal Editar -->' +
      '<div class="modal fade" id="editarFacaModal' + f.id + '" tabindex="-1" data-bs-backdrop="static">' +
          '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
              '<form method="POST" action="/catalogo-facas/editar/' + f.id + '" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0" onsubmit="prepararSubmissaoSimples(event, this, \'Faca Atualizada!\')">' +
                  '<div class="modal-header bg-custom-darker border-custom text-white py-3">' +
                      '<h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-pen text-warning me-2"></i> Editar Faca de Corte</h6>' +
                      '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>' +
                  '</div>' +
                  '<div class="modal-body p-3 bg-custom-dark text-sm">' +
                      '<div class="row g-2">' +
                          '<div class="col-6">' +
                              '<label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Código / ID</label>' +
                              '<input type="text" class="form-control form-control-sm shadow-sm border-0 text-white-50 bg-custom-darker" value="' + f.id + '" readonly>' +
                          '</div>' +
                          '<div class="col-6">' +
                              '<label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Categoria</label>' +
                              '<select name="categoria" class="form-select form-select-sm shadow-sm" required>' +
                                  '<option value="rotativa" ' + (f.categoria === 'rotativa' ? 'selected' : '') + '>Rotativa</option>' +
                                  '<option value="plana" ' + (f.categoria === 'plana' ? 'selected' : '') + '>Plana</option>' +
                              '</select>' +
                          '</div>' +
                          
                          '<div class="col-12 mt-2">' +
                              '<label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Modelo</label>' +
                              '<input type="text" name="modelo" class="form-control form-control-sm shadow-sm" value="' + (f.modelo || '') + '" required placeholder="Ex: Bela Parma">' +
                          '</div>' +

                          '<div class="col-4 mt-2">' +
                              '<label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Tam. Ref.</label>' +
                              '<input type="text" name="tamanho_referencia" class="form-control form-control-sm shadow-sm" value="' + (f.tamanho_referencia || '') + '" placeholder="Ex: 15613">' +
                          '</div>' +
                          '<div class="col-4 mt-2">' +
                              '<label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Medida</label>' +
                              '<input type="text" name="medida" class="form-control form-control-sm shadow-sm" value="' + (f.medida || '') + '" placeholder="Dimensões">' +
                          '</div>' +
                          '<div class="col-4 mt-2">' +
                              '<label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Versão</label>' +
                              '<input type="text" name="versao" class="form-control form-control-sm shadow-sm" value="' + (f.versao || '') + '" placeholder="Nova/Antiga">' +
                          '</div>' +
                          
                          '<div class="col-6 mt-2">' +
                              '<label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Componente</label>' +
                              '<input type="text" name="componente" class="form-control form-control-sm shadow-sm" value="' + (f.componente || '') + '" placeholder="Componentes">' +
                          '</div>' +
                          '<div class="col-6 mt-2">' +
                              '<label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Configuração</label>' +
                              '<input type="text" name="configuracao" class="form-control form-control-sm shadow-sm" value="' + (f.configuracao || '') + '" placeholder="Detalhes">' +
                          '</div>' +

                          '<div class="col-12 mt-2">' +
                              '<label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Utilização</label>' +
                              '<input type="text" name="utilizacao" class="form-control form-control-sm shadow-sm" value="' + (f.utilizacao || '') + '" placeholder="Ex: Caixa de Pizza 35cm">' +
                          '</div>' +

                          '<div class="col-12 mt-2">' +
                              '<label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Chapas Utilizadas</label>' +
                              '<div class="chapas-container">' +
                                  chapasEdicaoHtml +
                              '</div>' +
                              '<button type="button" class="btn btn-xs btn-link text-accent text-decoration-none p-0 mt-2 fw-bold" style="font-size:0.7rem;" onclick="adicionarSelectChapa(this)">' +
                                  '<i class="fa-solid fa-plus-circle me-1"></i> Adicionar outra chapa' +
                              '</button>' +
                          '</div>' +

                          '<div class="col-12 mt-2">' +
                              '<label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;"><i class="fa-solid fa-camera me-1"></i> Nova Foto</label>' +
                              '<input type="file" name="foto" class="form-control form-control-sm shadow-sm" accept="image/*">' +
                              (f.foto ? '<small class="text-accent mt-1 d-block" style="font-size: 0.65rem;">Já possui foto. Enviar outra irá substituí-la.</small>' : '') +
                          '</div>' +
                      '</div>' +
                  '</div>' +
                  '<div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap py-2">' +
                      '<button type="button" class="btn btn-sm btn-outline-secondary text-white w-100 fw-bold" data-bs-dismiss="modal">Cancelar</button>' +
                      '<button type="submit" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm"><i class="fa-solid fa-save me-1"></i> Salvar</button>' +
                  '</div>' +
              '</form>' +
          '</div>' +
      '</div>' +

      '<!-- Modal Excluir -->' +
      '<div class="modal fade" id="excluirFacaModal' + f.id + '" tabindex="-1">' +
          '<div class="modal-dialog modal-sm modal-dialog-centered">' +
              '<div class="modal-content erp-modal border-0">' +
                  '<form method="POST" action="/catalogo-facas/excluir/' + f.id + '" onsubmit="prepararSubmissaoSimples(event, this, \'Faca Excluída!\')">' +
                      '<div class="modal-body text-center p-4 bg-custom-darker">' +
                          '<i class="fa-solid fa-triangle-exclamation fa-2x text-danger mb-3"></i>' +
                          '<h6 class="mb-2 fw-bold text-white" style="font-size: 0.9rem;">Excluir Faca?</h6>' +
                          '<p class="text-muted mb-0" style="font-size:0.75rem;">A faca <b>' + f.modelo + '</b> será apagada permanentemente do sistema.</p>' +
                      '</div>' +
                      '<div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">' +
                          '<button type="button" class="btn btn-sm btn-secondary w-100 fw-bold" data-bs-dismiss="modal">Cancelar</button>' +
                          '<button type="submit" class="btn btn-sm btn-danger w-100 fw-bold">Excluir</button>' +
                      '</div>' +
                  '</form>' +
              '</div>' +
          '</div>' +
      '</div>';
  }).join('');

  const paginacaoHtml = (() => {
      if (totalPages <= 1) return "<div id='paginacaoFacas'></div>";
      let html = '<div id="paginacaoFacas"><nav class="mt-4 w-100 d-flex justify-content-center"><ul class="pagination pagination-sm mb-4 shadow-sm">';
      html += '<li class="page-item ' + (page <= 1 ? "disabled" : "") + '"><a class="page-link" href="/catalogo-facas?page=' + (page - 1) + baseQueryString + '" onclick="navegarPagina(event, this.href)">«</a></li>';
      
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);
      
      if (start > 1) {
          html += '<li class="page-item"><a class="page-link" href="/catalogo-facas?page=1' + baseQueryString + '" onclick="navegarPagina(event, this.href)">1</a></li>';
          if (start > 2) html += '<li class="page-item disabled"><span class="page-link text-muted">...</span></li>';
      }
      for (let i = start; i <= end; i++) {
        html += '<li class="page-item ' + (i === page ? "active" : "") + '"><a class="page-link ' + (i === page ? "fw-bold" : "") + '" href="/catalogo-facas?page=' + i + baseQueryString + '" onclick="navegarPagina(event, this.href)">' + i + '</a></li>';
      }
      if (end < totalPages) {
          if (end < totalPages - 1) html += '<li class="page-item disabled"><span class="page-link text-muted">...</span></li>';
          html += '<li class="page-item"><a class="page-link" href="/catalogo-facas?page=' + totalPages + baseQueryString + '" onclick="navegarPagina(event, this.href)">' + totalPages + '</a></li>';
      }
      
      html += '<li class="page-item ' + (page >= totalPages ? "disabled" : "") + '"><a class="page-link" href="/catalogo-facas?page=' + (page + 1) + baseQueryString + '" onclick="navegarPagina(event, this.href)">»</a></li>';
      html += '</ul></nav></div>';
      return html;
  })();

  const menuHTML = menuLateral(user, "/catalogo-facas");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facas de Corte | Ecoflow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
    <style>
      /* =========================================================
        CORREÇÃO DOS PLACEHOLDERS NO TEMA ESCURO
        ========================================================= */
      .form-control::placeholder,
      .form-select::placeholder,
      input::placeholder,
      textarea::placeholder {
          color: rgba(255, 255, 255, 0.45) !important; 
          opacity: 1 !important; 
      }
      .form-control::-webkit-input-placeholder { color: rgba(255, 255, 255, 0.45) !important; }
      .form-control::-moz-placeholder { color: rgba(255, 255, 255, 0.45) !important; opacity: 1 !important; }

      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
      html, body, .content, .modal-body, .offcanvas-body { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

      body { display: flex; height: 100vh; margin: 0; background-color: #1f1f1f; color: #ffffff; font-family: 'Segoe UI', sans-serif; }
      .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column;}
      .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; background-color: #1f1f1f; }
      
      .bg-custom-dark { background-color: #2a2a2a !important; }
      .bg-custom-darker { background-color: #222222 !important; }
      .border-custom { border-color: rgba(255,255,255,0.08) !important; }
      .text-accent { color: #08c068 !important; }

      .text-dark { color: #ffffff !important; }
      .text-muted { color: rgba(255,255,255,0.5) !important; }
      
      .btn-primary, .btn-success { background-color: #08c068; border-color: #08c068; color: #1f1f1f; }
      .btn-primary:hover, .btn-success:hover { background-color: #06a055 !important; border-color: #06a055 !important; color: #ffffff !important; }
      .btn-outline-primary, .btn-outline-success { color: #08c068; border-color: #08c068; }
      .btn-outline-primary:hover, .btn-outline-success:hover { background-color: #08c068; color: #1f1f1f; border-color: #08c068; }
      
      .btn-outline-secondary { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }
      .btn-outline-secondary:hover { background-color: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.3); }

      .form-control, .form-select, .input-group-text { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.8rem; }
      .form-control:focus, .form-select:focus { background-color: #2a2a2a; border-color: #08c068; color: #fff; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }
      .input-group-text { background-color: #2a2a2a; color: rgba(255,255,255,0.6); }

      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .erp-card { transition: all 0.2s ease; border-radius: 12px; border-width: 1px !important; background-color: #2a2a2a !important; border-style: solid; border-color: rgba(255,255,255,0.08) !important; overflow: hidden; }
      .erp-card:hover { border-color: #08c068 !important; }

      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); cursor: pointer; }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
      .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.05); }

      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      .skeleton-dark {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%) !important;
          background-size: 200% 100% !important;
          animation: skeleton-loading-view 1.5s infinite linear !important;
          border-radius: 4px; color: transparent !important; border-color: transparent !important; box-shadow: none !important; pointer-events: none;
      }
      .skeleton-dark * { visibility: hidden !important; }
      .skeleton-text-view { height: 14px; width: 100%; margin-bottom: 8px; }
      @keyframes skeleton-loading-view { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 16px; }
      }
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
            <button class="btn btn-sm btn-outline-secondary d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-scissors text-muted me-2"></i>Gestão de Facas de Corte</h5>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.7rem;">Catálogo e configurações técnicas</span>
            </div>
        </div>
      </div>

      <div class="bg-custom-darker p-3 rounded-3 shadow-sm border border-custom mb-4 d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3">
         <h6 class="fw-bold text-white mb-0 text-nowrap" style="font-size: 0.85rem;"><i class="fa-solid fa-magnifying-glass text-accent me-2"></i> Pesquisar</h6>
         
         <div class="d-flex flex-wrap align-items-center gap-3 justify-content-xl-end w-100">
            <form id="formFiltroFacas" class="d-flex align-items-center mb-0 gap-2 flex-grow-1 flex-xl-grow-0" method="GET" action="/catalogo-facas" onsubmit="prepararBuscaSimples(event, this, 'Filtros Aplicados!')">
                <div class="input-group input-group-sm shadow-sm flex-nowrap w-100">
                    <span class="input-group-text border-custom"><i class="fa-solid fa-magnifying-glass"></i></span>
                    <input type="text" name="busca" class="form-control" value="${filtros.busca || ''}" placeholder="Buscar por modelo ou ID..." oninput="pesquisaTempoReal(this.form)">
                    <select name="categoria" class="form-select border-custom" style="max-width: 140px;" onchange="pesquisaTempoReal(this.form)">
                        <option value="">Todas</option>
                        <option value="rotativa" ${filtros.categoria === 'rotativa' ? 'selected' : ''}>Rotativas</option>
                        <option value="plana" ${filtros.categoria === 'plana' ? 'selected' : ''}>Planas</option>
                    </select>
                    <button type="submit" class="btn btn-primary px-3" title="Pesquisar"><i class="fa-solid fa-search"></i></button>
                    <button type="button" class="btn btn-outline-secondary border-custom px-3 text-danger bg-custom-darker" onclick="limparFiltrosFacas()" title="Limpar Filtro"><i class="fa-solid fa-eraser"></i></button>
                </div>
            </form>

            <div class="vr d-none d-xl-block mx-1"></div>

            <button class="btn btn-sm btn-outline-info fw-bold shadow-sm px-3 text-nowrap flex-shrink-0" onclick="window.open('/catalogo-facas/qrcodes', '_blank')">
                <i class="fa-solid fa-qrcode me-1"></i> Gerar QRs
            </button>
            <button class="btn btn-sm btn-success fw-bold shadow-sm px-4 text-nowrap flex-shrink-0" data-bs-toggle="modal" data-bs-target="#novaFacaModal">
                <i class="fa-solid fa-plus me-1"></i> Nova Faca
            </button>
         </div>
      </div>

      <div class="row g-3" id="facasGrid">
         ${cardsFacas}
      </div>

      ${paginacaoHtml}

    </div>

    <!-- MODAL NOVA FACA -->
    <div class="modal fade" id="novaFacaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form method="POST" action="/catalogo-facas/novo" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0" onsubmit="prepararSubmissaoSimples(event, this, 'Faca Cadastrada!')">
          <div class="modal-header bg-custom-darker border-custom text-white py-3">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-plus-circle text-accent me-2"></i> Cadastrar Nova Faca</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-3 bg-custom-dark text-sm">
            <div class="row g-2">
                <div class="col-12">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Categoria</label>
                    <select name="categoria" class="form-select form-select-sm shadow-sm" required>
                        <option value="" disabled selected>Selecione a categoria...</option>
                        <option value="rotativa">Rotativa</option>
                        <option value="plana">Plana</option>
                    </select>
                </div>

                <div class="col-12 mt-2">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Modelo</label>
                    <input type="text" name="modelo" class="form-control form-control-sm shadow-sm" placeholder="Ex: Bela Parma" required>
                </div>

                <div class="col-4 mt-2">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Tam. Ref.</label>
                    <input type="text" name="tamanho_referencia" class="form-control form-control-sm shadow-sm" placeholder="Ex: 15613">
                </div>
                <div class="col-4 mt-2">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Medida</label>
                    <input type="text" name="medida" class="form-control form-control-sm shadow-sm" placeholder="Dimensões">
                </div>
                <div class="col-4 mt-2">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Versão</label>
                    <input type="text" name="versao" class="form-control form-control-sm shadow-sm" placeholder="Ex: v2.0">
                </div>
                
                <div class="col-6 mt-2">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Componente</label>
                    <input type="text" name="componente" class="form-control form-control-sm shadow-sm" placeholder="Componentes">
                </div>
                <div class="col-6 mt-2">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Configuração</label>
                    <input type="text" name="configuracao" class="form-control form-control-sm shadow-sm" placeholder="Detalhes">
                </div>

                <div class="col-12 mt-2">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Utilização</label>
                    <input type="text" name="utilizacao" class="form-control form-control-sm shadow-sm" placeholder="Ex: Caixa de Pizza 35cm">
                </div>

                <div class="col-12 mt-2">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;">Chapas Utilizadas</label>
                    <div class="chapas-container">
                        <div class="d-flex gap-2 align-items-center chapa-row">
                            <select name="chapas_utilizadas" class="form-select form-select-sm shadow-sm">
                                <option value="">Nenhuma / Selecione...</option>
                                ${selectOptionsNovo}
                            </select>
                            <button type="button" class="btn btn-sm btn-outline-danger border-0 p-1" onclick="this.closest('.chapa-row').remove();" title="Remover"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-xs btn-link text-accent text-decoration-none p-0 mt-2 fw-bold" style="font-size:0.7rem;" onclick="adicionarSelectChapa(this)">
                        <i class="fa-solid fa-plus-circle me-1"></i> Adicionar outra chapa
                    </button>
                </div>

                <div class="col-12 mt-2">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.7rem;"><i class="fa-solid fa-camera me-1"></i> Foto da Faca</label>
                    <input type="file" name="foto" class="form-control form-control-sm shadow-sm" accept="image/*">
                </div>
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap py-2">
            <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100 fw-bold" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success w-100 fw-bold shadow-sm"><i class="fa-solid fa-save me-1"></i> Cadastrar</button>
          </div>
        </form>
      </div>
    </div>

    ${modais}

    <!-- TOASTS -->
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
            <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none;"></div>
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
            <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none;"></div>
        </div>
    </div>

    ${termosHTML}
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      let isSubmitting = false;
      const opcoesChapasHtml = \`${selectOptionsNovo}\`;

      function adicionarSelectChapa(btn) {
          const container = btn.previousElementSibling;
          const html = '<div class="d-flex gap-2 align-items-center chapa-row mt-2">' +
              '<select name="chapas_utilizadas" class="form-select form-select-sm shadow-sm">' +
                  '<option value="">Nenhuma / Selecione...</option>' +
                  opcoesChapasHtml +
              '</select>' +
              '<button type="button" class="btn btn-sm btn-outline-danger border-0 p-1" onclick="this.closest(\\' .chapa-row\\').remove();" title="Remover"><i class="fa-solid fa-xmark"></i></button>' +
          '</div>';
          container.insertAdjacentHTML('beforeend', html);
      }

      function limparFiltrosFacas() {
          const form = document.getElementById('formFiltroFacas');
          if (form) {
              form.querySelectorAll('input').forEach(i => i.value = '');
              form.querySelectorAll('select').forEach(i => i.value = '');
              prepararBuscaSimples(null, form, 'Filtros limpos!');
          }
      }

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

      function gerarSkeletonCards(quantidade = 8) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += '<div class="col-12 col-md-6 col-lg-4 col-xl-3">' +
                  '<div class="card erp-card shadow-sm h-100 bg-custom-darker border border-custom p-0 d-flex flex-column">' +
                      '<div class="skeleton-dark" style="height: 140px; width: 100%; border-bottom-left-radius:0; border-bottom-right-radius:0;"></div>' +
                      '<div class="card-body p-3 flex-grow-1">' +
                          '<div class="skeleton-dark skeleton-text-view mb-3" style="width: 70%; height: 16px;"></div>' +
                          '<div class="skeleton-dark skeleton-text-view mb-2" style="width: 100%;"></div>' +
                          '<div class="skeleton-dark skeleton-text-view mb-2" style="width: 80%;"></div>' +
                          '<div class="skeleton-dark skeleton-text-view" style="width: 90%;"></div>' +
                      '</div>' +
                      '<div class="card-footer bg-transparent border-top border-custom p-2 d-flex justify-content-between">' +
                          '<div class="skeleton-dark skeleton-text-view" style="width: 40px; height: 26px; margin:0;"></div>' +
                          '<div class="skeleton-dark skeleton-text-view" style="width: 40px; height: 26px; margin:0;"></div>' +
                      '</div>' +
                  '</div>' +
              '</div>';
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const grid = document.getElementById('facasGrid');
          const emptyState = document.querySelector('.content > .text-center-empty');
          
          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = '<div id="skeleton-temp-container" class="row g-3 mb-4 skeleton-container">' +
              gerarSkeletonCards(8) +
          '</div>';

          if (grid) grid.style.display = 'none';
          if (emptyState) emptyState.style.display = 'none';
          
          const insertTarget = grid || emptyState;
          if (insertTarget) {
              insertTarget.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const grid = document.getElementById('facasGrid');
          const emptyState = document.querySelector('.content > .text-center-empty');

          if (grid) grid.style.display = '';
          if (emptyState) emptyState.style.display = '';
      }

      window.addEventListener('load', ocultarSkeletonGlobais);
      window.addEventListener('beforeunload', mostrarSkeletonGlobais);

      let timerBusca;
      function pesquisaTempoReal(form) {
          clearTimeout(timerBusca);
          timerBusca = setTimeout(() => {
              prepararBuscaSimples(null, form, '', true);
          }, 400);
      }

      async function prepararBuscaSimples(event, form, titleMsg, silencioso = false) {
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

                  const oldGrid = document.getElementById('facasGrid');
                  const newGrid = doc.getElementById('facasGrid');
                  if (oldGrid && newGrid) {
                      oldGrid.innerHTML = newGrid.innerHTML;
                  }

                  const oldPagination = document.getElementById('paginacaoFacas');
                  const newPagination = doc.getElementById('paginacaoFacas');
                  if (oldPagination && newPagination) {
                      oldPagination.innerHTML = newPagination.innerHTML;
                  }

                  atualizarModaisDinamicos(doc);
                  window.history.pushState({}, '', url);
                  
                  if (!silencioso && titleMsg) mostrarToast('sucesso', 'Busca Concluída!', titleMsg);
              } else {
                  if (!silencioso) mostrarToast('erro', 'Erro', 'Não foi possível realizar a busca.');
              }
          } catch (err) {
              if (!silencioso) mostrarToast('erro', 'Falha de Conexão', 'Verifique a sua rede e tente novamente.');
          } finally {
              ocultarSkeletonGlobais();
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

      async function prepararSubmissaoSimples(event, form, titleMsg) {
          event.preventDefault();
          if (!form.checkValidity()) { form.reportValidity(); return; }
          if (isSubmitting) return;

          const modalEl = form.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }
          document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
          document.body.classList.remove('modal-open');
          document.body.style = '';

          mostrarSkeletonGlobais();
          isSubmitting = true;

          try {
              let fetchOptions = { method: form.method || 'POST' };

              const selects = form.querySelectorAll('select[name="chapas_utilizadas"]');
              selects.forEach(s => {
                  if (!s.value || s.value.trim() === '') s.disabled = true;
              });

              if (form.enctype === 'multipart/form-data') {
                  const fd = new FormData(form);
                  const allChapas = fd.getAll('chapas_utilizadas');
                  fd.delete('chapas_utilizadas');
                  allChapas.forEach(val => {
                      if (val && val.trim() !== '') fd.append('chapas_utilizadas', val);
                  });
                  fetchOptions.body = fd;
              } else {
                  const formData = new URLSearchParams();
                  const fd = new FormData(form);
                  for (const [key, value] of fd.entries()) {
                      if (key === 'chapas_utilizadas' && (!value || value.trim() === '')) continue;
                      formData.append(key, value);
                  }
                  fetchOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
                  fetchOptions.body = formData.toString();
              }

              selects.forEach(s => s.disabled = false);

              const response = await fetch(form.action, fetchOptions);

              if (response.ok) {
                  const separator = window.location.href.includes('?') ? '&' : '?';
                  const cacheBusterUrl = window.location.href + separator + '_t=' + new Date().getTime();
                  
                  const freshResponse = await fetch(cacheBusterUrl);
                  const html = await freshResponse.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }

                  atualizarModaisDinamicos(doc);
                  form.reset();
                  mostrarToast('sucesso', 'Concluído!', titleMsg);
              } else {
                  mostrarToast('erro', 'Erro', 'Não foi possível salvar os dados no servidor.');
              }
          } catch (err) {
              mostrarToast('erro', 'Conexão', 'Verifique a sua internet.');
          } finally {
              isSubmitting = false;
              ocultarSkeletonGlobais();
          }
      }

      function atualizarModaisDinamicos(doc) {
          const staticModals = ['novaFacaModal', 'sidebarMenu'];
          document.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) m.remove();
          });
          doc.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
          });
      }
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = facasView;