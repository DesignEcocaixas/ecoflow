// views/downloadsView.js
const menuLateral = require("./menuLateral");
const termosComponent = require("./termosComponent");

function downloadsView(req, arquivos = [], pastas = [], pastaAtual = null, breadcrumbs = [], paginacao = {}, usuarios = [], bloqueios = []) {
  const usuarioObj = (req && req.session) ? req.session.user : req;
  const termosHTML = termosComponent(usuarioObj);
  const user = usuarioObj || { nome: "Usuário", tipo_usuario: "admin", id: 0 };
  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;
  const isUserAdmin = user.tipo_usuario === 'admin';

  const escapeHtmlAttr = (str) => {
      if (!str) return "";
      return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const fmtData = (d) => {
    try {
      if(!d) return "-";
      const dt = new Date(d);
      return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    } catch {
      return d || "-";
    }
  };

  const formatarTamanho = (bytes) => {
      if (!bytes || bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = 2;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const obterIconeEcor = (extensao) => {
      const ext = String(extensao).toLowerCase();
      if (['pdf'].includes(ext)) return { icone: 'fa-file-pdf', cor: 'text-danger' };
      if (['doc', 'docx'].includes(ext)) return { icone: 'fa-file-word', cor: 'text-primary' };
      if (['xls', 'xlsx'].includes(ext)) return { icone: 'fa-file-excel', cor: 'text-success' };
      if (['cdr', 'ai', 'eps', 'svg'].includes(ext)) return { icone: 'fa-bezier-curve', cor: 'text-warning' };
      if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return { icone: 'fa-file-image', cor: 'text-info' };
      if (['zip', 'rar', '7z'].includes(ext)) return { icone: 'fa-file-zipper', cor: 'text-secondary' };
      return { icone: 'fa-file', cor: 'text-white-50' };
  };

  // NAVEGAÇÃO BREADCRUMB
  let breadcrumbsHtml = `<a href="/downloads" class="text-accent text-decoration-none fw-bold" onclick="navegarPagina(event, this.href)"><i class="fa-solid fa-home"></i> Raiz</a>`;
  if (breadcrumbs.length > 0) {
      breadcrumbs.forEach((b, index) => {
          breadcrumbsHtml += ` <span class="text-white-50 mx-1">/</span> `;
          if (index === breadcrumbs.length - 1) {
              breadcrumbsHtml += `<span class="text-white fw-bold">${b.nome}</span>`;
          } else {
              breadcrumbsHtml += `<a href="/downloads?pasta=${b.id}" class="text-accent text-decoration-none" onclick="navegarPagina(event, this.href)">${b.nome}</a>`;
          }
      });
  }

  let gearHtml = '';
  const pastaAtualObj = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;
  const canManageCurrentFolder = pastaAtualObj && (isUserAdmin || user.id === pastaAtualObj.criador_id);
  
  if (canManageCurrentFolder) {
      gearHtml = `
      <div class="dropdown d-inline-block">
          <button class="btn btn-sm btn-outline-warning border-custom shadow-sm fw-bold px-3 py-2" data-bs-toggle="dropdown" data-bs-auto-close="outside" title="Permissões da Pasta">
              <i class="fa-solid fa-user-lock me-1"></i> <span class="d-none d-sm-inline">Acesso</span>
          </button>
          <div class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow-lg border-custom p-3" style="width: 260px; max-height: 350px; overflow-y: auto; z-index: 1050;">
              <h6 class="dropdown-header px-0 text-white fw-bold border-bottom border-custom pb-2 mb-2"><i class="fa-solid fa-shield-halved text-warning me-2"></i> Restringir Usuários</h6>
              <div class="d-flex flex-column gap-2">
                  ${usuarios.filter(u => u.id !== user.id && u.tipo_usuario !== 'admin').map(u => {
                      const isBlocked = bloqueios.some(b => b.pasta_id === pastaAtualObj.id && b.usuario_id === u.id);
                      return `
                      <div class="form-check form-switch d-flex align-items-center justify-content-between ps-0 mb-0">
                          <label class="form-check-label text-white-50 small mb-0 text-truncate pe-2" for="blockAccess_${pastaAtualObj.id}_${u.id}">${u.nome}</label>
                          <input class="form-check-input m-0 float-none flex-shrink-0" type="checkbox" role="switch" id="blockAccess_${pastaAtualObj.id}_${u.id}" ${isBlocked ? 'checked' : ''} onchange="toggleBloqueioPasta(${pastaAtualObj.id}, ${u.id}, this.checked)">
                      </div>
                      `;
                  }).join('') || '<div class="text-muted small text-center mt-2">Nenhum usuário aplicável</div>'}
              </div>
          </div>
      </div>
      `;
  }

  const pastaPaiId = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].id : 'null';
  const pastaPaiUrl = pastaPaiId !== 'null' ? `/downloads?pasta=${pastaPaiId}` : '/downloads';

  // --- RENDERIZAÇÃO: MODO LISTA ---
  let linhasTabela = "";
  if (pastaAtual) {
      linhasTabela += `
      <tr class="align-middle cursor-pointer" 
          onclick="navegarPagina(event, '${pastaPaiUrl}')"
          ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${pastaPaiId})">
        <td class="text-center py-2 px-2" style="width: 40px;"><i class="fa-solid fa-turn-up fa-lg text-accent"></i></td>
        <td class="py-2 px-2 fw-bold text-accent">Voltar</td>
        <td class="py-2 px-2"></td>
        <td class="py-2 px-2"></td>
        <td class="py-2 px-2"></td>
      </tr>`;
  }

  pastas.forEach(p => {
      const isBlockedForMe = !isUserAdmin && p.criador_id !== user.id && bloqueios.some(b => b.pasta_id === p.id && b.usuario_id === user.id);
      
      if (isBlockedForMe) {
          linhasTabela += `
          <tr class="align-middle" style="opacity: 0.5; cursor: not-allowed;" onclick="mostrarToast('erro', 'Acesso Restrito', 'Você não tem permissão para visualizar esta pasta.')">
            <td class="text-center py-2 px-2" style="width: 40px;"><i class="fa-solid fa-lock fa-xl text-secondary"></i></td>
            <td class="py-2 px-2 text-white-50 fw-bold item-title">${escapeHtmlAttr(p.nome)}</td>
            <td class="text-white-50 py-2 px-2"><span class="badge bg-custom-darker border-custom text-danger">BLOQUEADA</span></td>
            <td class="text-white-50 py-2 px-2">-</td>
            <td class="text-white-50 fw-medium py-2 px-2" style="font-size: 0.75rem;">${fmtData(p.data_criacao)}</td>
          </tr>`;
      } else {
          linhasTabela += `
          <tr class="align-middle cursor-pointer folder-row" 
              draggable="true" 
              ondragstart="handleDragStart(event, 'pasta', ${p.id})" 
              ondragover="handleDragOver(event)" 
              ondragleave="handleDragLeave(event)" 
              ondrop="handleDrop(event, ${p.id})" 
              oncontextmenu="abrirContextMenu(event, 'pasta', ${p.id}, '${escapeHtmlAttr(p.nome)}')" 
              onclick="navegarPagina(event, '/downloads?pasta=${p.id}')">
            <td class="text-center py-2 px-2" style="width: 40px;"><i class="fa-solid fa-folder fa-xl text-warning"></i></td>
            <td class="py-2 px-2 text-white fw-bold item-title editable-title" ondblclick="event.stopPropagation(); editarNomeElemento(this, 'pasta', ${p.id})">${p.nome}</td>
            <td class="text-white-50 py-2 px-2"><span class="badge bg-custom-darker border-custom text-white-50">PASTA</span></td>
            <td class="text-white-50 py-2 px-2">-</td>
            <td class="text-white-50 fw-medium py-2 px-2" style="font-size: 0.75rem;">${fmtData(p.data_criacao)}</td>
          </tr>`;
      }
  });

  arquivos.forEach(arq => {
      const infoFicheiro = obterIconeEcor(arq.extensao);
      linhasTabela += `
      <tr class="align-middle file-row"
          draggable="true" 
          ondragstart="handleDragStart(event, 'arquivo', ${arq.id})" 
          oncontextmenu="abrirContextMenu(event, 'arquivo', ${arq.id}, '${escapeHtmlAttr(arq.nome_original)}')">
        <td class="text-center py-1 px-2" style="width: 40px;"><i class="fa-solid ${infoFicheiro.icone} fa-lg ${infoFicheiro.cor}"></i></td>
        <td class="py-1 px-2">
          <div class="text-truncate text-white fw-bold item-title editable-title" style="max-width: 280px; font-size: 0.8rem; cursor: text;" title="${escapeHtmlAttr(arq.nome_original)}" ondblclick="event.stopPropagation(); editarNomeElemento(this, 'arquivo', ${arq.id})">${arq.nome_original}</div>
          <div class="text-white-50" style="font-size: 0.65rem;">Enviado por: ${arq.responsavel || 'Sistema'}</div>
        </td>
        <td class="text-white-50 py-1 px-2"><span class="badge bg-custom-darker border border-custom text-white-50 text-uppercase" style="font-size: 0.65rem; padding: 0.25em 0.5em;">${arq.extensao}</span></td>
        <td class="text-white-50 py-1 px-2" style="font-size: 0.75rem;">${formatarTamanho(arq.tamanho)}</td>
        <td class="text-white-50 fw-medium py-1 px-2" style="font-size: 0.75rem;"><i class="fa-regular fa-calendar-check me-1"></i> ${fmtData(arq.data_upload)}</td>
      </tr>`;
  });

  // --- RENDERIZAÇÃO: MODO GRID ---
  let gridItemsHtml = "";
  
  if (pastaAtual) {
      gridItemsHtml += `
      <div class="grid-item shadow-sm cursor-pointer" onclick="navegarPagina(event, '${pastaPaiUrl}')" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${pastaPaiId})">
          <div class="grid-icon"><i class="fa-solid fa-turn-up text-accent"></i></div>
          <div class="grid-title text-accent">Voltar</div>
      </div>`;
  }

  pastas.forEach(p => {
      const isBlockedForMe = !isUserAdmin && p.criador_id !== user.id && bloqueios.some(b => b.pasta_id === p.id && b.usuario_id === user.id);

      if (isBlockedForMe) {
          gridItemsHtml += `
          <div class="grid-item shadow-sm" style="opacity: 0.5; cursor: not-allowed;" onclick="mostrarToast('erro', 'Acesso Restrito', 'Você não tem permissão para visualizar esta pasta.')">
              <div class="grid-icon"><i class="fa-solid fa-lock text-secondary"></i></div>
              <div class="grid-title text-white-50 item-title">${escapeHtmlAttr(p.nome)}</div>
          </div>`;
      } else {
          gridItemsHtml += `
          <div class="grid-item shadow-sm folder-row cursor-pointer" 
               draggable="true" 
               ondragstart="handleDragStart(event, 'pasta', ${p.id})" 
               ondragover="handleDragOver(event)" 
               ondragleave="handleDragLeave(event)" 
               ondrop="handleDrop(event, ${p.id})" 
               oncontextmenu="abrirContextMenu(event, 'pasta', ${p.id}, '${escapeHtmlAttr(p.nome)}')" 
               onclick="navegarPagina(event, '/downloads?pasta=${p.id}')">
              <div class="grid-icon"><i class="fa-solid fa-folder text-warning"></i></div>
              <div class="grid-title text-white item-title editable-title" ondblclick="event.stopPropagation(); editarNomeElemento(this, 'pasta', ${p.id})">${p.nome}</div>
          </div>`;
      }
  });

  arquivos.forEach(arq => {
      const infoFicheiro = obterIconeEcor(arq.extensao);
      gridItemsHtml += `
      <div class="grid-item shadow-sm file-row cursor-pointer"
           draggable="true" 
           ondragstart="handleDragStart(event, 'arquivo', ${arq.id})" 
           oncontextmenu="abrirContextMenu(event, 'arquivo', ${arq.id}, '${escapeHtmlAttr(arq.nome_original)}')">
          <div class="grid-icon"><i class="fa-solid ${infoFicheiro.icone} ${infoFicheiro.cor}"></i></div>
          <div class="grid-title text-white item-title editable-title" title="${escapeHtmlAttr(arq.nome_original)}" ondblclick="event.stopPropagation(); editarNomeElemento(this, 'arquivo', ${arq.id})">${arq.nome_original}</div>
          <div class="text-white-50 mt-1" style="font-size: 0.65rem;">${formatarTamanho(arq.tamanho)}</div>
      </div>`;
  });

  const vazioGlobal = pastas.length === 0 && arquivos.length === 0;

  // Modais de exclusão de arquivos e pastas
  const modaisExclusaoArquivos = arquivos.map(arq => `
    <div class="modal fade" id="excluirModal${arq.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <form method="POST" action="/downloads/excluir/${arq.id}">
            <input type="hidden" name="pasta_id" value="${pastaAtual || ''}">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
              <h6 class="fw-bold text-white mb-2" style="font-size: 0.95rem;">Excluir Ficheiro?</h6>
              <p class="text-white-50 mb-0" style="font-size:0.8rem; word-break: break-all;">${arq.nome_original}</p>
              <p class="text-danger mt-2 fw-bold" style="font-size:0.75rem;">Esta ação não pode ser desfeita.</p>
            </div>
            <div class="modal-footer modal-footer-dark border-0 justify-content-center d-flex flex-nowrap pt-0">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm" onclick="this.innerHTML='<i class=\\'fa-solid fa-spinner fa-spin\\'></i> Apagando...'; this.disabled=true; this.form.submit();">Sim, Excluir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `).join("");

  const modaisExclusaoPastas = pastas.map(p => `
    <div class="modal fade" id="excluirPastaModal${p.id}" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content erp-modal border-0 shadow-lg bg-custom-darker">
          <form method="POST" action="/downloads/excluir-pasta/${p.id}">
            <input type="hidden" name="pasta_pai" value="${pastaAtual || ''}">
            <div class="modal-body text-center p-4">
              <i class="fa-solid fa-folder-minus fa-3x text-danger mb-3"></i>
              <h6 class="fw-bold text-white mb-2" style="font-size: 0.95rem;">Excluir Pasta?</h6>
              <p class="text-white-50 mb-0" style="font-size:0.8rem; word-break: break-all;">${p.nome}</p>
              <p class="text-danger mt-2 fw-bold" style="font-size:0.75rem;">ATENÇÃO: Todos os arquivos e subpastas contidos nela também serão apagados!</p>
            </div>
            <div class="modal-footer modal-footer-dark border-0 justify-content-center d-flex flex-nowrap pt-0">
              <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm" onclick="this.innerHTML='<i class=\\'fa-solid fa-spinner fa-spin\\'></i> Apagando...'; this.disabled=true; this.form.submit();">Apagar Tudo</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `).join("");

  const pageLinks = (() => {
    if(totalPages <= 1) return '';
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="/downloads?page=${i}${pastaAtual ? '&pasta=' + pastaAtual : ''}" onclick="navegarPagina(event, this.href)">${i}</a></li>`;
    }
    return html;
  })();

  const paginacaoHtml = totalPages > 1 ? `
    <div class="d-flex flex-column align-items-center justify-content-center mt-4 gap-2 text-white-50 small w-100 pagnacao-container">
        <nav><ul class="pagination pagination-sm mb-0 shadow-sm">
            <li class="page-item ${page <= 1 ? "disabled" : ""}"><a class="page-link" href="/downloads?page=${page - 1}${pastaAtual ? '&pasta=' + pastaAtual : ''}" onclick="navegarPagina(event, this.href)">«</a></li>
            ${pageLinks}
            <li class="page-item ${page >= totalPages ? "disabled" : ""}"><a class="page-link" href="/downloads?page=${page + 1}${pastaAtual ? '&pasta=' + pastaAtual : ''}" onclick="navegarPagina(event, this.href)">»</a></li>
        </ul></nav>
    </div>
  ` : "";

  const menuHTML = menuLateral(user, "/downloads");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Central de Downloads | Ecoflow</title>
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }
      html, body, .content, .table-responsive, .modal-body, .offcanvas-body { scrollbar-width: thin; scrollbar-color: rgba(8, 192, 104, 0.3) transparent; }

      body { display: flex; height: 100vh; margin: 0; background-color: #1f1f1f; color: #ffffff; font-family: 'Segoe UI', sans-serif; }
      .sidebar { width: 240px; background-color: #1f1f1f; border-right: 1px solid rgba(255,255,255,0.05); color: white; padding: 20px; display: flex; flex-direction: column; }
      .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; background-color: #1f1f1f; }
      
      .bg-custom-dark { background-color: #2a2a2a !important; }
      .bg-custom-darker { background-color: #222222 !important; }
      .border-custom { border-color: rgba(255,255,255,0.08) !important; border-width: 1px; }
      .text-accent { color: #08c068 !important; }

      .btn-primary, .btn-success { background-color: #08c068; border-color: #08c068; color: #1f1f1f; }
      .btn-primary:hover, .btn-success:hover { background-color: #06a055 !important; border-color: #06a055 !important; color: #ffffff !important; }
      
      .btn-outline-secondary { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }
      .btn-outline-secondary:hover { background-color: rgba(255,255,255,0.1); color: #fff; }
      .btn-outline-secondary.active { background-color: #08c068; color: #1f1f1f; border-color: #08c068; }
      
      .btn-outline-success { color: #08c068; border-color: rgba(8, 192, 104, 0.3); background: transparent; }
      .btn-outline-success:hover { background-color: #08c068; color: #1f1f1f; border-color: #08c068; }

      .btn-outline-warning { color: #ffc107; border-color: rgba(255, 193, 7, 0.3); background: transparent; }
      .btn-outline-warning:hover { background-color: #ffc107; color: #1f1f1f; border-color: #ffc107; }

      .btn-xs { padding: 0.15rem 0.4rem; font-size: 0.7rem; border-radius: 0.2rem; }
      .cursor-pointer { cursor: pointer; }

      .form-control { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.8rem; }
      .form-control:focus { background-color: #2a2a2a; border-color: #08c068; color: #fff; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }
      .form-control::file-selector-button { background-color: #151515; color: #fff; border: none; border-right: 1px solid rgba(255,255,255,0.1); padding: 0.375rem 0.75rem; margin-right: 1rem; transition: 0.2s; cursor: pointer; }
      .form-control::file-selector-button:hover { background-color: #08c068; color: #1f1f1f; }

      .table { --bs-table-bg: transparent; --bs-table-color: #fff; margin-bottom: 0; }
      .table thead th { background-color: #222 !important; color: rgba(255,255,255,0.6) !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; font-weight: 600; font-size: 0.75rem; }
      .table tbody td { border-bottom: 1px solid rgba(255,255,255,0.05) !important; background-color: transparent !important; color: #fff !important; }

      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .erp-modal .modal-header, .erp-modal .modal-footer { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; border-top: 1px solid rgba(255,255,255,0.08); }

      /* Visualização Grid */
      .grid-container { display: none; flex-wrap: wrap; gap: 1rem; }
      .grid-item { width: 140px; height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: #222; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; transition: 0.2s; position: relative; padding: 10px; }
      .grid-icon { font-size: 3rem; margin-bottom: 10px; }
      .grid-title { font-size: 0.75rem; font-weight: bold; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: none; }

      /* Dropdown Item Customization */
      .dropdown-item:hover { background-color: rgba(255, 255, 255, 0.1); }

      /* Paginação */
      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); cursor: pointer; }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; font-weight: bold; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
      .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.25); border-color: rgba(255,255,255,0.05); }

      /* Toasts */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; background-color: #2a2a2a !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.08) !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }
      .modal.fade .modal-dialog { transform: scale(0.85) translateY(30px); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
      .modal.show .modal-dialog { transform: scale(1) translateY(0); }

      /* Efeito de Drag and Drop */
      .drag-over-folder { background-color: rgba(8, 192, 104, 0.15) !important; border: 2px dashed #08c068 !important; border-radius: 8px; }
      .folder-row[draggable="true"] { cursor: grab; }
      .folder-row[draggable="true"]:active { cursor: grabbing; }
      .file-row[draggable="true"] { cursor: grab; }
      .file-row[draggable="true"]:active { cursor: grabbing; }

      .skeleton-dark { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%) !important; background-size: 200% 100% !important; animation: skeleton-loading-view 1.5s infinite linear !important; border-radius: 4px; color: transparent !important; border-color: transparent !important; box-shadow: none !important; pointer-events: none; }
      .skeleton-dark * { visibility: hidden !important; }
      .skeleton-text-view { height: 14px; width: 100%; margin-bottom: 8px; }
      .skeleton-btn-view { height: 26px; width: 32px; border-radius: 4px; display: inline-block; }
      @keyframes skeleton-loading-view { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

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
        <h5 class="offcanvas-title ms-2" style="font-size: 0.9rem;"><i class="fa-solid fa-bars text-white-50 me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2"><img src="/img/logo.png" class="img-fluid" style="max-width:140px;"></div>
        ${menuHTML}
      </div>
    </div>

    <div class="content">
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-cloud-arrow-down text-accent me-2"></i>Central de Downloads</h5>
              <div class="mt-2" style="font-size:0.85rem;">
                ${breadcrumbsHtml}
              </div>
            </div>
        </div>
        <div class="d-flex gap-2 align-items-center flex-wrap">
            <div class="bg-custom-darker border-custom rounded d-flex p-1 me-2 shadow-sm">
                <button type="button" id="btnViewList" class="btn btn-sm btn-outline-secondary border-0 active" onclick="setViewMode('list')" title="Visualização em Lista"><i class="fa-solid fa-list"></i></button>
                <button type="button" id="btnViewGrid" class="btn btn-sm btn-outline-secondary border-0" onclick="setViewMode('grid')" title="Visualização em Grade"><i class="fa-solid fa-border-all"></i></button>
            </div>
            ${gearHtml}
            <button class="btn btn-sm btn-outline-warning border-custom shadow-sm fw-bold px-3 py-2" data-bs-toggle="modal" data-bs-target="#novaPastaModal">
                <i class="fa-solid fa-folder-plus me-1"></i> <span class="d-none d-sm-inline">Nova Pasta</span>
            </button>
            <button class="btn btn-sm btn-success shadow-sm fw-bold px-3 py-2" data-bs-toggle="modal" data-bs-target="#novoArquivoModal">
                <i class="fa-solid fa-cloud-arrow-up me-1"></i> <span class="d-none d-sm-inline">Enviar Arquivo</span>
            </button>
        </div>
      </div>

      ${!vazioGlobal 
        ? `<div id="viewList" class="table-responsive bg-custom-darker rounded-3 shadow-sm border-custom mb-4">
             <table class="table table-sm align-middle mb-0" style="font-size: 0.75rem; border-collapse: separate; border-spacing: 0;">
               <thead>
                 <tr>
                   <th class="py-1 px-2 text-center border-0">Formato</th>
                   <th class="py-1 px-2 border-0">Nome</th>
                   <th class="py-1 px-2 border-0">Extensão</th>
                   <th class="py-1 px-2 border-0">Tamanho</th>
                   <th class="py-1 px-2 border-0">Data</th>
                 </tr>
               </thead>
               <tbody class="border-top-0">
                 ${linhasTabela}
               </tbody>
             </table>
           </div>
           
           <div id="viewGrid" class="grid-container mb-4">
                ${gridItemsHtml}
           </div>
           ` 
        : `<div class="col-12 text-center text-white-50 mt-5 text-center-empty bg-custom-darker p-5 rounded-3 border-custom shadow-sm" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${pastaAtual || 'null'})">
             <i class="fa-solid fa-folder-open fa-3x opacity-25 mb-3 d-block"></i>
             <p style="font-size:0.85rem;">Esta pasta está vazia.</p>
           </div>`
      }

      ${paginacaoHtml}
    </div>

    <!-- MENU DE CONTEXTO PERSONALIZADO (CLIQUE DIREITO) -->
    <ul id="customContextMenu" class="dropdown-menu dropdown-menu-dark shadow-lg border-custom" style="display:none; position: fixed; z-index: 9999; min-width: 180px; font-size: 0.85rem;">
        <li><a class="dropdown-item text-white fw-bold py-2" href="#" id="ctxBtnRenomear"><i class="fa-solid fa-pen text-warning me-2"></i> Renomear</a></li>
        <li id="ctxBtnBaixarLi"><a class="dropdown-item text-white fw-bold py-2" href="#" id="ctxBtnBaixar"><i class="fa-solid fa-download text-success me-2"></i> Baixar Arquivo</a></li>
        <li><hr class="dropdown-divider border-custom"></li>
        <li><a class="dropdown-item text-danger fw-bold py-2" href="#" id="ctxBtnExcluir"><i class="fa-solid fa-trash me-2"></i> Excluir</a></li>
    </ul>

    <!-- MODAL NOVA PASTA -->
    <div class="modal fade" id="novaPastaModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <form method="POST" action="/downloads/nova-pasta" class="modal-content erp-modal shadow-lg border-0">
          <input type="hidden" name="pasta_id" value="${pastaAtual || ''}">
          <div class="modal-header bg-custom-darker text-white border-custom">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-folder-plus text-warning me-2"></i> Criar Nova Pasta</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            <div class="mb-2">
              <label class="form-label text-white-50 fw-bold mb-2" style="font-size:0.75rem;">Nome da Pasta:</label>
              <input type="text" name="nome_pasta" class="form-control shadow-sm" required placeholder="Ex: Manuais 2026">
            </div>
          </div>
          <div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-warning text-dark fw-bold w-100 shadow-sm"><i class="fa-solid fa-check me-1"></i> Criar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL UPLOAD -->
    <div class="modal fade" id="novoArquivoModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form method="POST" action="/downloads/novo" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0" onsubmit="mostrarToastCarregando('Enviando arquivo ao servidor...'); document.getElementById('btnSubmitUpload').disabled = true; document.getElementById('btnSubmitUpload').innerHTML = '<i class=\\'fa-solid fa-spinner fa-spin me-1\\'></i> Enviando.';">
          <input type="hidden" name="pasta_id" value="${pastaAtual || ''}">
          <div class="modal-header bg-custom-darker text-white border-custom">
            <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-cloud-arrow-up text-accent me-2"></i> Adicionar Arquivo</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-custom-dark">
            
            <div class="alert bg-custom-darker border-custom text-white-50 shadow-sm" style="font-size:0.8rem;">
              <i class="fa-solid fa-circle-info text-accent me-2"></i> Limite de 50MB. O arquivo será salvo na pasta atual.
            </div>

            <div class="mb-3 mt-4">
              <label class="form-label text-white-50 fw-bold mb-2" style="font-size:0.75rem;">Selecione o arquivo do seu computador:</label>
              <input type="file" name="arquivo" class="form-control shadow-sm p-2" required accept=".pdf,.doc,.docx,.xls,.xlsx,.cdr,.ai,.eps,.svg,.png,.jpg,.jpeg,.zip,.rar">
            </div>

          </div>
          <div class="modal-footer bg-custom-darker border-custom d-flex flex-nowrap gap-2 pt-3 pb-3">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100 text-white" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" id="btnSubmitUpload" class="btn btn-sm btn-primary text-dark fw-bold w-100 shadow-sm"><i class="fa-solid fa-upload me-1"></i> Fazer Upload</button>
          </div>
        </form>
      </div>
    </div>

    ${modaisExclusaoArquivos}
    ${modaisExclusaoPastas}

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div><i class="fa-solid fa-circle-check fs-5 me-2 text-accent" id="sucessoIcon"></i><strong class="fs-6" id="sucessoTitulo">Concluído!</strong></div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3"><p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="sucessoSub"></p></div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 4px; background: #08c068;"></div>
        </div>

        <div id="erroToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(220,53,69,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div><i class="fa-solid fa-circle-xmark fs-5 me-2 text-danger"></i><strong class="fs-6" id="erroTitulo">Erro!</strong></div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3"><p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="erroSub"></p></div>
            <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
        </div>
    </div>

    ${termosHTML}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      // ==========================================
      // VIEW TOGGLE (LIST / GRID)
      // ==========================================
      function setViewMode(mode) {
          localStorage.setItem('ecoflow_downloads_view', mode);
          
          const btnList = document.getElementById('btnViewList');
          const btnGrid = document.getElementById('btnViewGrid');
          const viewList = document.getElementById('viewList');
          const viewGrid = document.getElementById('viewGrid');
          
          if(mode === 'grid') {
              if (btnList) btnList.classList.remove('active');
              if (btnGrid) btnGrid.classList.add('active');
              if (viewList) viewList.style.display = 'none';
              if (viewGrid) viewGrid.style.display = 'flex';
          } else {
              if (btnGrid) btnGrid.classList.remove('active');
              if (btnList) btnList.classList.add('active');
              if (viewGrid) viewGrid.style.display = 'none';
              if (viewList) viewList.style.display = 'block';
          }
      }

      function initViewMode() {
          const savedMode = localStorage.getItem('ecoflow_downloads_view') || 'list';
          setViewMode(savedMode);
      }

      document.addEventListener("DOMContentLoaded", initViewMode);

      // ==========================================
      // FUNÇÃO AJAX PARA BLOQUEIO/LIBERAÇÃO DE PASTA
      // ==========================================
      async function toggleBloqueioPasta(pastaId, usuarioId, isBlocked) {
          try {
              const response = await fetch('/api/downloads/pasta/bloqueio', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pasta_id: pastaId, usuario_id: usuarioId, bloqueado: isBlocked })
              });
              const result = await response.json();
              
              if (response.ok && result.success) {
                  mostrarToast('sucesso', 'Permissões Atualizadas', isBlocked ? 'O usuário foi bloqueado e não verá esta pasta.' : 'O acesso foi liberado para o usuário.');
                  const cbAccess = document.getElementById('blockAccess_' + pastaId + '_' + usuarioId);
                  if(cbAccess) cbAccess.checked = isBlocked;
              } else {
                  mostrarToast('erro', 'Falha na Operação', result.error || 'Não foi possível alterar as permissões.');
                  const cbAtual = event.target;
                  if(cbAtual) cbAtual.checked = !isBlocked;
              }
          } catch (e) {
              mostrarToast('erro', 'Erro de Conexão', 'Falha ao comunicar com o servidor.');
              const cbAtual = event.target;
              if(cbAtual) cbAtual.checked = !isBlocked;
          }
      }

      // ==========================================
      // RENOMEAR ELEMENTOS (INLINE EDIT - OPTIMISTIC UI)
      // ==========================================
      function editarNomeElemento(el, tipo, id) {
          if(!el || el.querySelector('input')) return;
          
          const nomeAtual = el.textContent.trim();
          
          const input = document.createElement('input');
          input.type = 'text';
          input.value = nomeAtual;
          input.className = 'form-control form-control-sm border-warning shadow text-white bg-custom-darker';
          input.style.minWidth = '120px';
          input.onclick = (ev) => ev.stopPropagation();
          input.ondblclick = (ev) => ev.stopPropagation();
          
          let isSaved = false;

          const saveFunc = async () => {
              if (isSaved) return;
              isSaved = true;

              const novoNome = input.value.trim();
              if(!novoNome || novoNome === nomeAtual) {
                  el.textContent = nomeAtual;
                  return;
              }

              // Update visualmente antes da resposta do servidor (Optimistic UI)
              el.textContent = novoNome;
              if (el.hasAttribute('title')) {
                  el.setAttribute('title', novoNome);
              }

              try {
                  const endpoint = tipo === 'pasta' ? '/api/downloads/pasta/renomear' : '/api/downloads/arquivo/renomear';
                  const res = await fetch(endpoint, {
                      method: 'POST', headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({id: id, novo_nome: novoNome})
                  });
                  if(res.ok) {
                      mostrarToast('sucesso', 'Renomeado!', (tipo === 'pasta' ? 'A pasta' : 'O arquivo') + ' foi renomeado(a) com sucesso.');
                  } else {
                      // Rollback se falhar
                      el.textContent = nomeAtual;
                      if (el.hasAttribute('title')) el.setAttribute('title', nomeAtual);
                      mostrarToast('erro', 'Erro', 'Falha ao renomear.');
                  }
              } catch(err) {
                  // Rollback se falhar a rede
                  el.textContent = nomeAtual;
                  if (el.hasAttribute('title')) el.setAttribute('title', nomeAtual);
                  mostrarToast('erro', 'Conexão', 'Erro ao salvar o nome.');
              }
          };

          input.onblur = saveFunc;
          input.onkeydown = (ev) => {
              if(ev.key === 'Enter') { 
                  ev.preventDefault(); 
                  input.blur(); 
              }
              if(ev.key === 'Escape') { 
                  isSaved = true;
                  el.textContent = nomeAtual; 
              }
          };

          el.textContent = '';
          el.appendChild(input);
          input.focus();
          input.select();
      }

      // ==========================================
      // DRAG AND DROP LÓGICA (MOVER)
      // ==========================================
      function handleDragStart(e, tipo, id) {
          e.dataTransfer.setData('application/json', JSON.stringify({ tipo, id }));
          e.dataTransfer.effectAllowed = 'move';
          e.target.style.opacity = '0.5';
          
          e.target.addEventListener('dragend', function() {
              e.target.style.opacity = '1';
          }, { once: true });
      }

      function handleDragOver(e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const container = e.currentTarget;
          container.classList.add('drag-over-folder');
      }

      function handleDragLeave(e) {
          const container = e.currentTarget;
          container.classList.remove('drag-over-folder');
      }

      async function handleDrop(e, destinoId) {
          e.preventDefault();
          e.currentTarget.classList.remove('drag-over-folder');
          
          try {
              const rawData = e.dataTransfer.getData('application/json');
              if(!rawData) return;
              
              const data = JSON.parse(rawData);
              
              if (data.tipo === 'pasta' && data.id == destinoId) {
                  return; // Impede mover pra dentro de si
              }

              mostrarToastCarregando('A mover ' + data.tipo + '...');

              const res = await fetch('/api/downloads/mover', {
                  method: 'POST', 
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ item_id: data.id, tipo: data.tipo, destino_id: destinoId })
              });

              if (res.ok) {
                  window.location.reload(); 
              } else {
                  const result = await res.json();
                  mostrarToast('erro', 'Ação Inválida', result.error || 'Não foi possível mover o item.');
              }
          } catch(err) {
              mostrarToast('erro', 'Erro de Conexão', 'Falha ao processar o movimento.');
          }
      }

      // ==========================================
      // MENU DE CONTEXTO PERSONALIZADO
      // ==========================================
      let ctxTarget = null;
      
      function abrirContextMenu(e, tipo, id) {
          e.preventDefault();
          e.stopPropagation();
          const ctxMenu = document.getElementById('customContextMenu');
          if(!ctxMenu) return;

          const titleEl = e.currentTarget.querySelector('.item-title') || e.currentTarget;
          ctxTarget = { tipo, id, el: titleEl };

          const baixarLi = document.getElementById('ctxBtnBaixarLi');
          if(tipo === 'pasta') {
              baixarLi.style.display = 'none';
          } else {
              baixarLi.style.display = 'block';
          }

          ctxMenu.style.display = 'block';
          
          let x = e.clientX;
          let y = e.clientY;
          const rect = ctxMenu.getBoundingClientRect();
          
          if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 5;
          if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 5;
          
          ctxMenu.style.left = x + 'px';
          ctxMenu.style.top = y + 'px';
      }

      document.addEventListener('click', (e) => {
          const ctxMenu = document.getElementById('customContextMenu');
          if(ctxMenu) {
              ctxMenu.style.display = 'none';
          }
      });

      document.getElementById('ctxBtnRenomear').addEventListener('click', (e) => {
          e.preventDefault();
          document.getElementById('customContextMenu').style.display = 'none';
          if(!ctxTarget) return;
          editarNomeElemento(ctxTarget.el, ctxTarget.tipo, ctxTarget.id);
      });

      document.getElementById('ctxBtnBaixar').addEventListener('click', (e) => {
          e.preventDefault();
          document.getElementById('customContextMenu').style.display = 'none';
          if(!ctxTarget || ctxTarget.tipo !== 'arquivo') return;
          mostrarToast('sucesso', 'Download Iniciado', 'A transferência começou.');
          window.location.href = '/downloads/baixar/' + ctxTarget.id;
      });

      document.getElementById('ctxBtnExcluir').addEventListener('click', (e) => {
          e.preventDefault();
          document.getElementById('customContextMenu').style.display = 'none';
          if(!ctxTarget) return;

          if(ctxTarget.tipo === 'pasta') {
              const modalEl = document.getElementById('excluirPastaModal' + ctxTarget.id);
              if(modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
          } else {
              const modalEl = document.getElementById('excluirModal' + ctxTarget.id);
              if(modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
          }
      });

      // ==========================================
      // TOASTS
      // ==========================================
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

      function mostrarToastCarregando(mensagem) {
          const successToastEl = document.getElementById('sucessoToast');
          if(!successToastEl) return;
          document.getElementById('sucessoIcon').className = "fa-solid fa-circle-notch fa-spin fs-5 me-2 text-accent";
          document.getElementById('sucessoTitulo').innerText = "A Processar...";
          document.getElementById('sucessoSub').innerText = mensagem;

          successToastEl.setAttribute('data-bs-autohide', 'false');
          const timerEl = document.getElementById('sucessoTimer');
          if (timerEl) timerEl.style.display = 'none';

          const oldInstance = bootstrap.Toast.getInstance(successToastEl);
          if (oldInstance) oldInstance.dispose();
          new bootstrap.Toast(successToastEl).show();
      }

      // ==========================================
      // SKELETON LOADING
      // ==========================================
      function gerarSkeletonTabela(quantidade) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += '<tr class="align-middle">' +
                      '<td class="text-center py-1 px-2"><div class="skeleton-dark skeleton-btn-view" style="width: 20px; height: 20px;"></div></td>' +
                      '<td class="py-1 px-2">' +
                          '<div class="skeleton-dark skeleton-text-view" style="width: 60%; height: 12px; margin-bottom: 4px;"></div>' +
                          '<div class="skeleton-dark skeleton-text-view" style="width: 40%; height: 8px; margin-bottom: 0;"></div>' +
                      '</td>' +
                      '<td class="py-1 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 50%; height: 12px;"></div></td>' +
                      '<td class="py-1 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 40%; height: 12px;"></div></td>' +
                      '<td class="py-1 px-2"><div class="skeleton-dark skeleton-text-view" style="width: 70%; height: 12px;"></div></td>' +
                      '</tr>';
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const viewList = document.getElementById('viewList');
          const viewGrid = document.getElementById('viewGrid');
          const emptyState = document.querySelector('.content > .text-center-empty');
          const paginacao = document.querySelector('.content > .pagnacao-container');

          if (document.getElementById('skeleton-temp-container')) return;

          const savedMode = localStorage.getItem('ecoflow_downloads_view') || 'list';
          let skeletonHTML = '';

          if (savedMode === 'grid') {
             let gridItems = '';
             for(let i=0; i<8; i++){
                 gridItems += '<div class="grid-item shadow-sm">' +
                              '<div class="skeleton-dark skeleton-btn-view mb-2" style="width: 50px; height: 50px; border-radius: 50%;"></div>' +
                              '<div class="skeleton-dark skeleton-text-view" style="width: 80%;"></div>' +
                              '</div>';
             }
             skeletonHTML = '<div id="skeleton-temp-container" class="grid-container skeleton-container mb-4" style="display:flex;">' + gridItems + '</div>';
          } else {
             skeletonHTML = '<div id="skeleton-temp-container" class="table-responsive bg-custom-darker rounded-3 shadow-sm border-custom mb-4 skeleton-container">' +
              '<table class="table table-sm align-middle mb-0" style="font-size: 0.75rem; border-collapse: separate; border-spacing: 0;">' +
                 '<thead>' +
                   '<tr>' +
                     '<th class="py-1 px-2 text-center border-0">Formato</th>' +
                     '<th class="py-1 px-2 border-0">Nome</th>' +
                     '<th class="py-1 px-2 border-0">Extensão</th>' +
                     '<th class="py-1 px-2 border-0">Tamanho</th>' +
                     '<th class="py-1 px-2 border-0">Data</th>' +
                   '</tr>' +
                 '</thead>' +
                 '<tbody class="border-top-0">' +
                    gerarSkeletonTabela(5) +
                 '</tbody>' +
              '</table>' +
             '</div>';
          }

          if (viewList) viewList.style.display = 'none';
          if (viewGrid) viewGrid.style.display = 'none';

          if ((viewList || viewGrid) && !document.querySelector('.skeleton-container')) {
              const target = viewList || viewGrid;
              target.insertAdjacentHTML('beforebegin', skeletonHTML);
          } else if (emptyState) {
              emptyState.style.display = 'none';
              emptyState.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
          
          if (paginacao) paginacao.style.display = 'none';
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          initViewMode();

          const emptyState = document.querySelector('.content > .text-center-empty');
          const paginacao = document.querySelector('.content > .pagnacao-container');

          if (emptyState) emptyState.style.display = '';
          if (paginacao) paginacao.style.display = '';
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

      // ==========================================
      // NAVEGAÇÃO AJAX (PAGINAÇÃO E PASTAS)
      // ==========================================
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
                  mostrarToast('erro', 'Erro', 'Falha ao carregar a pasta.');
              }
          } catch (err) {
              mostrarToast('erro', 'Erro de Conexão', 'Falha ao carregar os dados. Verifique a rede.');
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      function atualizarModaisDinamicos(doc) {
          const dynamicPrefixes = ['excluirModal', 'excluirPastaModal'];
          
          document.querySelectorAll('.modal').forEach(m => {
              const isDynamic = dynamicPrefixes.some(prefix => m.id.startsWith(prefix));
              if (isDynamic) m.remove();
          });
          
          doc.querySelectorAll('.modal').forEach(m => {
              const isDynamic = dynamicPrefixes.some(prefix => m.id.startsWith(prefix));
              if (isDynamic) document.body.appendChild(m.cloneNode(true));
          });

          const newUploadModal = doc.getElementById('novoArquivoModal');
          if (newUploadModal) {
              const oldUploadModal = document.getElementById('novoArquivoModal');
              if (oldUploadModal) oldUploadModal.querySelector('input[name="pasta_id"]').value = newUploadModal.querySelector('input[name="pasta_id"]').value;
          }

          const newFolderModal = doc.getElementById('novaPastaModal');
          if (newFolderModal) {
              const oldFolderModal = document.getElementById('novaPastaModal');
              if (oldFolderModal) oldFolderModal.querySelector('input[name="pasta_id"]').value = newFolderModal.querySelector('input[name="pasta_id"]').value;
          }
      }

      // ==========================================
      // RESPOSTAS E AVISOS DA URL
      // ==========================================
      document.addEventListener("DOMContentLoaded", () => {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('sucesso')) {
              const acao = urlParams.get('sucesso');
              if (acao === 'upload') {
                  mostrarToast('sucesso', 'Upload Concluído!', 'O arquivo foi enviado para o servidor com sucesso.');
              } else if (acao === 'excluido') {
                  mostrarToast('sucesso', 'Arquivo Apagado', 'O arquivo foi removido do servidor permanentemente.');
              } else if (acao === 'pasta_criada') {
                  mostrarToast('sucesso', 'Pasta Criada', 'A nova pasta foi criada com sucesso.');
              } else if (acao === 'pasta_excluida') {
                  mostrarToast('sucesso', 'Pasta Excluída', 'A pasta e todo o seu conteúdo foram removidos.');
              }
              const url = new URL(window.location.href);
              url.searchParams.delete('sucesso');
              window.history.replaceState({}, document.title, url.toString());
          }

          if (urlParams.has('erro')) {
              const erro = urlParams.get('erro');
              if (erro === 'nofile') mostrarToast('erro', 'Atenção', 'Não selecionou nenhum arquivo para envio.');
              else if (erro === 'acesso_negado') mostrarToast('erro', 'Acesso Restrito', 'Você não tem permissão para visualizar esta pasta.');
              else mostrarToast('erro', 'Falha na Operação', 'Ocorreu um erro no servidor ao processar o seu pedido.');
              
              const url = new URL(window.location.href);
              url.searchParams.delete('erro');
              window.history.replaceState({}, document.title, url.toString());
          }
      });
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = downloadsView;