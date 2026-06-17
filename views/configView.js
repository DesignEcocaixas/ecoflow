// views/configView.js
const menuLateral = require("./menuLateral");

function configView(usuario, taxas = {}, historicoNotificacoes = []) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  const fmtDataHora = (d) => {
      try {
          if(!d) return "-";
          const dt = new Date(d);
          return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
      } catch {
          return d || "-";
      }
  };

  // Formatador especial para os inputs do tipo datetime-local
  const fmtInputDateTime = (d) => {
      try {
          if (!d) return "";
          const dt = new Date(d);
          // Ajusta o fuso horário local para exibir corretamente no input
          dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
          return dt.toISOString().slice(0, 16);
      } catch {
          return "";
      }
  };

  const modaisDinamicos = [];

  // Histórico de Notificações Globais Lançadas
  const linhasNotificacoes = historicoNotificacoes.length > 0 ? historicoNotificacoes.map(n => {
      const imgSrc = n.imagem ? `/uploads/${n.imagem}` : '';
      const imgHtml = n.imagem 
        ? `<img src="${imgSrc}" class="rounded me-2 border shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">` 
        : `<div class="rounded me-2 bg-light border d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px;"><i class="fa-solid fa-image opacity-25"></i></div>`;

      // Modal de Edição
      modaisDinamicos.push(`
        <div class="modal fade" id="editarNotificacao${n.id}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <form method="POST" action="/notificacoes/global/editar/${n.id}" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0" onsubmit="prepararSubmissaoSimples(event, this, 'Notificação Atualizada!')">
                    <div class="modal-header bg-primary text-white border-0 p-3">
                        <h6 class="modal-title fw-bold"><i class="fa-solid fa-pen-to-square me-2"></i> Editar Aviso #${n.id}</h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4 bg-light">
                        <div class="mb-3">
                            <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Título do Aviso</label>
                            <input type="text" name="titulo_notificacao" class="form-control form-control-sm shadow-sm" value="${n.titulo}" required maxlength="100">
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Mensagem</label>
                            <textarea name="mensagem_notificacao" class="form-control form-control-sm shadow-sm" rows="4" required>${n.mensagem}</textarea>
                        </div>

                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Exibir a partir de:</label>
                                <input type="datetime-local" name="data_inicio" class="form-control form-control-sm shadow-sm" value="${fmtInputDateTime(n.data_inicio)}" required>
                            </div>
                            <div class="col-6">
                                <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Ocultar após:</label>
                                <input type="datetime-local" name="data_fim" class="form-control form-control-sm shadow-sm" value="${fmtInputDateTime(n.data_fim)}" required>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Status da Notificação</label>
                            <select name="status_notificacao" class="form-select form-select-sm shadow-sm">
                                <option value="ATIVA" ${n.status === 'ATIVA' ? 'selected' : ''}>ATIVA (Visível no período)</option>
                                <option value="INATIVA" ${n.status === 'INATIVA' ? 'selected' : ''}>INATIVA (Oculta forçadamente)</option>
                            </select>
                        </div>

                        <div class="mb-2">
                            <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;"><i class="fa-solid fa-image text-primary me-1"></i> Substituir Imagem (Opcional)</label>
                            <div class="image-upload-wrapper shadow-sm" onclick="document.getElementById('imgEditNotif${n.id}').click()" style="padding: 10px;">
                                ${n.imagem ? `<img id="previewEditImg${n.id}" src="${imgSrc}" style="width: 100%; max-height: 120px; object-fit: contain;">` : `<i class="fa-solid fa-cloud-arrow-up fa-2x text-muted mb-2" id="iconEditNotif${n.id}"></i><p class="text-muted mb-0" id="textEditNotif${n.id}" style="font-size: 0.75rem;">Clique para anexar nova imagem.</p><img id="previewEditImg${n.id}" src="" style="display: none; width: 100%; max-height: 120px; object-fit: contain;">`}
                            </div>
                            <input type="file" name="imagem_notificacao" id="imgEditNotif${n.id}" class="d-none" accept="image/*" onchange="previewEditImage(this, 'previewEditImg${n.id}', 'iconEditNotif${n.id}', 'textEditNotif${n.id}')">
                        </div>
                    </div>
                    <div class="modal-footer bg-white border-top p-3 d-flex flex-nowrap">
                        <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-primary fw-bold w-100 shadow-sm"><i class="fa-solid fa-save me-1"></i> Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
      `);

      // Modal de Exclusão
      modaisDinamicos.push(`
        <div class="modal fade" id="excluirNotificacao${n.id}" tabindex="-1">
            <div class="modal-dialog modal-sm modal-dialog-centered">
                <form method="POST" action="/notificacoes/global/deletar/${n.id}" class="modal-content border-0 shadow-lg erp-modal" onsubmit="prepararSubmissaoSimples(event, this, 'Notificação Excluída!')">
                    <div class="modal-body p-4 text-center">
                        <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                        <h6 class="fw-bold text-dark mb-2">Excluir Aviso?</h6>
                        <p class="text-muted mb-0" style="font-size:0.85rem;">Tem certeza que deseja apagar definitivamente o aviso <b>"${n.titulo}"</b> do histórico?</p>
                    </div>
                    <div class="modal-footer bg-light border-0 justify-content-center d-flex flex-nowrap">
                        <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold">Excluir</button>
                    </div>
                </form>
            </div>
        </div>
      `);

      return `
      <tr class="align-middle table-hover-row">
          <td class="py-2 px-3">
              <div class="d-flex align-items-center">
                  ${imgHtml}
                  <div>
                      <strong class="text-dark d-block text-truncate" style="max-width: 200px; font-size: 0.85rem;" title="${n.titulo}">${n.titulo}</strong>
                      <span class="text-muted d-block mt-1" style="font-size: 0.7rem;" title="Período de Exibição">
                          <i class="fa-regular fa-calendar-check text-success me-1"></i>${n.data_inicio ? fmtDataHora(n.data_inicio) : '-'} <br>
                          <i class="fa-regular fa-calendar-xmark text-danger me-1"></i>${n.data_fim ? fmtDataHora(n.data_fim) : '-'}
                      </span>
                  </div>
              </div>
          </td>
          <td class="text-muted py-2 px-3" style="font-size: 0.8rem;">
              <span class="d-inline-block text-truncate" style="max-width: 180px;" title="${n.mensagem}">${n.mensagem}</span>
          </td>
          <td class="text-center py-2 px-3">
              <span class="badge ${n.status === 'ATIVA' ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${n.status === 'ATIVA' ? 'text-success border-success' : 'text-dark border-secondary'} border shadow-sm" style="font-size: 0.7rem;">
                  ${n.status}
              </span>
          </td>
          <td class="text-end py-2 px-3 text-nowrap">
             <button type="button" class="btn btn-sm btn-light border text-primary shadow-sm py-0 px-2 me-1" style="font-size: 0.75rem;" title="Editar" data-bs-toggle="modal" data-bs-target="#editarNotificacao${n.id}">
                 <i class="fa-solid fa-pen"></i> Editar
             </button>
             <button type="button" class="btn btn-sm btn-light border text-danger shadow-sm py-0 px-2" style="font-size: 0.75rem;" title="Excluir" data-bs-toggle="modal" data-bs-target="#excluirNotificacao${n.id}">
                 <i class="fa-solid fa-trash"></i> Excluir
             </button>
          </td>
      </tr>
      `;
  }).join('') : `<tr><td colspan="4" class="text-center text-muted py-5"><i class="fa-solid fa-bullhorn fa-2x opacity-25 mb-3 d-block"></i><span style="font-size: 0.85rem;">Nenhum disparo de notificação encontrado no histórico.</span></td></tr>`;

  const menuHTML = menuLateral(user, "/configuracoes");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configurações do Sistema | ERP Ecoflow</title>
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
      .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      .table-hover-row { transition: background-color 0.2s; }
      .table-hover-row:hover > td { background-color: rgba(13, 87, 73, 0.06) !important; }

      /* ANIMAÇÕES GLOBAIS (TOASTS E MODAIS) */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 6px; background: rgba(255, 255, 255, 0.4); width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      .modal.fade .modal-dialog { transform: scale(0.85) translateY(30px); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
      .modal.show .modal-dialog { transform: scale(1) translateY(0); }

      /* Upload de Imagem Notificação */
      .image-upload-wrapper { border: 2px dashed #d1d3e2; border-radius: 8px; text-align: center; padding: 20px; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; background: #fafbfc; }
      .image-upload-wrapper:hover { border-color: #0D5749; background: #f0f8f6; }
      .image-upload-wrapper img { max-height: 150px; object-fit: contain; position: relative; z-index: 2; border-radius: 6px; }

      /* SKELETON LOADING */
      .skeleton-view { background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%); background-size: 200% 100%; animation: skeleton-loading-view 1.5s infinite linear; border-radius: 4px; }
      .skeleton-text-view { height: 16px; width: 100%; margin-bottom: 8px; }
      @keyframes skeleton-loading-view { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 16px; }
      }
    </style>
  </head>
  <body>

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
              <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-cogs text-muted me-2"></i>Configurações Gerais</h4>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Gerencie as comunicações do sistema</span>
            </div>
        </div>
      </div>

      <div class="row g-4">
          
          <div class="col-12 col-lg-5">
              <form method="POST" action="/notificacoes/global/nova" enctype="multipart/form-data" class="card erp-card shadow-sm border-light h-100" id="formNovaNotificacao" onsubmit="prepararSubmissaoSimples(event, this, 'Notificação enviada a todos os usuários!')">
                  <div class="card-header bg-primary text-white border-0 p-3">
                      <h6 class="fw-bold mb-0"><i class="fa-solid fa-paper-plane me-2"></i> Configurar aviso</h6>
                  </div>
                  <div class="card-body p-4 bg-light">
                      <p class="text-muted" style="font-size: 0.8rem;">Defina o período em que esta mensagem aparecerá como um Pop-up na tela inicial de todos os colaboradores.</p>
                      
                      <div class="mb-3">
                          <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Título</label>
                          <input type="text" name="titulo_notificacao" class="form-control form-control-sm shadow-sm" placeholder="Ex: Atualização do sistema" required maxlength="100">
                      </div>
                      
                      <div class="mb-3">
                          <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Mensagem Detalhada</label>
                          <textarea name="mensagem_notificacao" class="form-control form-control-sm shadow-sm" rows="4" placeholder="Escreva aqui as instruções ou o aviso para os colaboradores..." required></textarea>
                      </div>

                      <div class="row g-2 mb-3">
                          <div class="col-6">
                              <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Exibir a partir de:</label>
                              <input type="datetime-local" name="data_inicio" class="form-control form-control-sm shadow-sm" required>
                          </div>
                          <div class="col-6">
                              <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;">Ocultar após:</label>
                              <input type="datetime-local" name="data_fim" class="form-control form-control-sm shadow-sm" required>
                          </div>
                      </div>

                      <div class="mb-4">
                          <label class="form-label text-dark fw-bold mb-1" style="font-size:0.8rem;"><i class="fa-solid fa-image text-primary me-1"></i> Imagem (Opcional)</label>
                          <div class="image-upload-wrapper shadow-sm" onclick="document.getElementById('imgNotificacaoInput').click()">
                              <i class="fa-solid fa-cloud-arrow-up fa-2x text-muted mb-2" id="iconUploadNotificacao"></i>
                              <p class="text-muted mb-0" id="textUploadNotificacao" style="font-size: 0.75rem;">Clique para anexar um banner ou imagem descritiva.</p>
                              <img id="previewImgNotificacao" src="" style="display: none; width: 100%;" class="mt-2">
                          </div>
                          <input type="file" name="imagem_notificacao" id="imgNotificacaoInput" class="d-none" accept="image/*" onchange="previewNotificationImage(this)">
                      </div>
                      
                  </div>
                  <div class="card-footer bg-white border-top p-3 text-end">
                      <button type="button" class="btn btn-sm btn-outline-secondary me-2 px-3" onclick="resetFormNotificacao()">Limpar</button>
                      <button type="submit" class="btn btn-sm btn-primary fw-bold px-4 shadow-sm"><i class="fa-solid fa-bullhorn me-1"></i> Publicar</button>
                  </div>
              </form>
          </div>

          <div class="col-12 col-lg-7">
              <div class="card erp-card shadow-sm border-light h-100">
                  <div class="card-header bg-white border-bottom p-3">
                      <h6 class="fw-bold text-dark mb-0"><i class="fa-solid fa-clock-rotate-left text-warning me-2"></i> Avisos ativos e histórico</h6>
                  </div>
                  <div class="card-body p-0">
                      <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                          <table class="table table-hover align-middle mb-0">
                              <thead class="table-light sticky-top">
                                  <tr>
                                      <th class="border-0 px-3 fw-bold text-muted" style="font-size: 0.75rem;">Aviso / Intervalo de Exibição</th>
                                      <th class="border-0 px-3 fw-bold text-muted" style="font-size: 0.75rem;">Conteúdo</th>
                                      <th class="border-0 px-3 text-center fw-bold text-muted" style="font-size: 0.75rem;">Estado Manual</th>
                                      <th class="border-0 px-3 text-end fw-bold text-muted" style="font-size: 0.75rem;">Ações</th>
                                  </tr>
                              </thead>
                              <tbody class="border-top-0">
                                  ${linhasNotificacoes}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>

      </div>

    </div>

    ${modaisDinamicos.join('')}

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-success text-white overflow-hidden position-relative" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-check fs-5 me-2" id="sucessoIcon"></i>
                    <strong class="fs-6" id="sucessoTitulo">Concluído!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
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
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.9rem; opacity: 0.9;" id="erroSub">Ocorreu um erro ao processar.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="erroTimer" style="display: none; height: 6px;"></div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

    <script>
      // =======================================================================
      // FUNÇÃO DE PREVIEW DE IMAGEM DA NOTIFICAÇÃO (NOVO E EDIÇÃO)
      // =======================================================================
      function previewNotificationImage(inputElement) {
          const previewImg = document.getElementById('previewImgNotificacao');
          const icon = document.getElementById('iconUploadNotificacao');
          const text = document.getElementById('textUploadNotificacao');

          if (inputElement.files && inputElement.files[0]) {
              const reader = new FileReader();
              reader.onload = function(e) {
                  previewImg.src = e.target.result;
                  previewImg.style.display = 'block';
                  icon.style.display = 'none';
                  text.style.display = 'none';
              }
              reader.readAsDataURL(inputElement.files[0]);
          } else {
              resetImagePreview();
          }
      }

      function previewEditImage(inputElement, imgId, iconId, textId) {
          const previewImg = document.getElementById(imgId);
          const icon = document.getElementById(iconId);
          const text = document.getElementById(textId);

          if (inputElement.files && inputElement.files[0]) {
              const reader = new FileReader();
              reader.onload = function(e) {
                  previewImg.src = e.target.result;
                  previewImg.style.display = 'block';
                  if(icon) icon.style.display = 'none';
                  if(text) text.style.display = 'none';
              }
              reader.readAsDataURL(inputElement.files[0]);
          }
      }

      function resetImagePreview() {
          const previewImg = document.getElementById('previewImgNotificacao');
          const icon = document.getElementById('iconUploadNotificacao');
          const text = document.getElementById('textUploadNotificacao');
          
          if(previewImg) {
              previewImg.src = '';
              previewImg.style.display = 'none';
          }
          if(icon) icon.style.display = 'block';
          if(text) text.style.display = 'block';
      }

      function resetFormNotificacao() {
          const form = document.getElementById('formNovaNotificacao');
          if(form) form.reset();
          resetImagePreview();
      }

      // =======================================================================
      // AJAX E SUBMISSÃO DE FORMS COM SKELETON
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

      let isSubmitting = false;

      function mostrarSkeletonGlobais() {
          const content = document.querySelector('.content');
          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="position-absolute top-0 start-0 w-100 h-100 bg-white d-flex flex-column align-items-center justify-content-center" style="z-index: 9999; opacity: 0.9;">
             <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
             <p class="text-muted mt-3 fw-bold">A processar...</p>
          </div>\`;

          if (content) {
              content.insertAdjacentHTML('afterbegin', skeletonHTML);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();
      }

      async function prepararSubmissaoSimples(event, form, titleMsg) {
          event.preventDefault();
          if (!form.checkValidity()) { form.reportValidity(); return; }
          if (isSubmitting) return;

          // Fecha os modais que possam estar abertos
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

              if (form.enctype === 'multipart/form-data') {
                  fetchOptions.body = new FormData(form);
              } else {
                  const formData = new URLSearchParams();
                  const fd = new FormData(form);
                  for (const [key, value] of fd.entries()) {
                      formData.append(key, value);
                  }
                  fetchOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
                  fetchOptions.body = formData.toString();
              }

              const response = await fetch(form.action, fetchOptions);

              if (response.ok) {
                  const freshResponse = await fetch(window.location.href);
                  const html = await freshResponse.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }

                  if(form.id === 'formNovaNotificacao') {
                      resetFormNotificacao();
                  }

                  // Atualiza modais dinamicos de exclusão/edição no dom
                  const staticModals = ['sidebarMenu'];
                  document.querySelectorAll('.modal').forEach(m => {
                      if (!staticModals.includes(m.id)) m.remove();
                  });
                  doc.querySelectorAll('.modal').forEach(m => {
                      if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
                  });

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
    </script>
  </body>
  </html>
  `;
}

module.exports = configView;