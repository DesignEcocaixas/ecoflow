// views/configView.js
const menuLateral = require("./menuLateral");

function configView(usuario, taxas = {}, historicoNotificacoes = []) {
    const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

    const fmtDataHora = (d) => {
        try {
            if (!d) return "-";
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
        const imgSrc = n.imagem ? `/uploads/mensagensSistema/${n.imagem}` : '';
        const imgHtml = n.imagem
            ? `<img src="${imgSrc}" class="rounded me-2 border border-custom shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">`
            : `<div class="rounded me-2 bg-custom-dark border border-custom d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px;"><i class="fa-solid fa-image text-muted opacity-50"></i></div>`;

        // Modal de Edição
        modaisDinamicos.push(`
        <div class="modal fade" id="editarNotificacao${n.id}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <form method="POST" action="/notificacoes/global/editar/${n.id}" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg border-0" onsubmit="prepararSubmissaoSimples(event, this, 'Notificação Atualizada!')">
                    <div class="modal-header bg-custom-darker border-0 p-3">
                        <h6 class="modal-title text-white fw-bold"><i class="fa-solid fa-pen-to-square text-warning me-2"></i> Editar Aviso #${n.id}</h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4 bg-custom-dark">
                        <div class="mb-3">
                            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Título do Aviso</label>
                            <input type="text" name="titulo_notificacao" class="form-control form-control-sm shadow-sm" value="${n.titulo}" required maxlength="100">
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Mensagem</label>
                            <textarea name="mensagem_notificacao" class="form-control form-control-sm shadow-sm" rows="4" required>${n.mensagem}</textarea>
                        </div>

                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Exibir a partir de:</label>
                                <input type="datetime-local" name="data_inicio" class="form-control form-control-sm shadow-sm" value="${fmtInputDateTime(n.data_inicio)}" required>
                            </div>
                            <div class="col-6">
                                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Ocultar após:</label>
                                <input type="datetime-local" name="data_fim" class="form-control form-control-sm shadow-sm" value="${fmtInputDateTime(n.data_fim)}" required>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Status da Notificação</label>
                            <select name="status_notificacao" class="form-select form-select-sm shadow-sm text-white">
                                <option value="ATIVA" ${n.status === 'ATIVA' ? 'selected' : ''}>Ativa</option>
                                <option value="INATIVA" ${n.status === 'INATIVA' ? 'selected' : ''}>Inativa</option>
                            </select>
                        </div>

                        <div class="mb-2">
                            <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;"><i class="fa-solid fa-image text-accent me-1"></i> Substituir Imagem (Opcional)</label>
                            <div class="image-upload-wrapper shadow-sm" onclick="document.getElementById('imgEditNotif${n.id}').click()" style="padding: 10px;">
                                ${n.imagem ? `<img id="previewEditImg${n.id}" src="${imgSrc}" style="width: 100%; max-height: 120px; object-fit: contain;">` : `<i class="fa-solid fa-cloud-arrow-up fa-2x text-muted mb-2" id="iconEditNotif${n.id}"></i><p class="text-muted mb-0" id="textEditNotif${n.id}" style="font-size: 0.75rem;">Clique para anexar nova imagem.</p><img id="previewEditImg${n.id}" src="" style="display: none; width: 100%; max-height: 120px; object-fit: contain;">`}
                            </div>
                            <input type="file" name="imagem_notificacao" id="imgEditNotif${n.id}" class="d-none" accept="image/*" onchange="previewEditImage(this, 'previewEditImg${n.id}', 'iconEditNotif${n.id}', 'textEditNotif${n.id}')">
                        </div>
                    </div>
                    <div class="modal-footer bg-custom-darker border-top border-custom p-3 d-flex flex-nowrap">
                        <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-primary fw-bold text-dark w-100 shadow-sm"><i class="fa-solid fa-save me-1"></i> Salvar</button>
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
                    <div class="modal-body p-4 text-center bg-custom-darker">
                        <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                        <h6 class="fw-bold text-white mb-2" style="font-size:0.9rem;">Excluir Aviso?</h6>
                        <p class="text-muted mb-0" style="font-size:0.8rem;">Tem certeza que deseja apagar definitivamente o aviso <b>"${n.titulo}"</b> do histórico?</p>
                    </div>
                    <div class="modal-footer bg-custom-darker border-0 justify-content-center d-flex flex-nowrap">
                        <button type="button" class="btn btn-sm btn-outline-secondary text-white w-100" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold shadow-sm">Excluir</button>
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
                      <strong class="text-white d-block text-truncate" style="max-width: 200px; font-size: 0.85rem;" title="${n.titulo}">${n.titulo}</strong>
                      <span class="text-muted d-block mt-1" style="font-size: 0.7rem;" title="Período de Exibição">
                          <i class="fa-regular fa-calendar-check text-accent me-1"></i>${n.data_inicio ? fmtDataHora(n.data_inicio) : '-'} <br>
                          <i class="fa-regular fa-calendar-xmark text-danger me-1"></i>${n.data_fim ? fmtDataHora(n.data_fim) : '-'}
                      </span>
                  </div>
              </div>
          </td>
          <td class="text-muted py-2 px-3" style="font-size: 0.8rem;">
              <span class="d-inline-block text-truncate text-white" style="max-width: 180px;" title="${n.mensagem}">${n.mensagem}</span>
          </td>
          <td class="text-center py-2 px-3">
              <span class="badge ${n.status === 'ATIVA' ? 'bg-success bg-opacity-10 text-success border-success border-opacity-50' : 'bg-custom-dark border-custom text-muted'} border shadow-sm" style="font-size: 0.65rem;">
                  ${n.status}
              </span>
          </td>
          <td class="text-end py-2 px-3 text-nowrap">
             <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-warning shadow-sm py-1 px-2 me-1" style="font-size: 0.75rem;" title="Editar" data-bs-toggle="modal" data-bs-target="#editarNotificacao${n.id}">
                 <i class="fa-solid fa-pen"></i>
             </button>
             <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger shadow-sm py-1 px-2" style="font-size: 0.75rem;" title="Excluir" data-bs-toggle="modal" data-bs-target="#excluirNotificacao${n.id}">
                 <i class="fa-solid fa-trash"></i>
             </button>
          </td>
      </tr>
      `;
    }).join('') : `<tr><td colspan="4" class="text-center text-muted py-5"><i class="fa-solid fa-bullhorn fa-2x opacity-25 mb-3 d-block"></i><span style="font-size: 0.8rem;">Nenhum disparo de notificação encontrado no histórico.</span></td></tr>`;

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

      /* Placeholder dos inputs e textareas */
    .form-control::placeholder,
    textarea.form-control::placeholder {
        color: rgba(255, 255, 255, 0.38) !important;
        opacity: 1;
    }

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

      .erp-card { transition: all 0.3s ease; border-width: 1px !important; background-color: #2a2a2a !important; border-style: solid; border-color: rgba(255,255,255,0.05) !important; }
      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .erp-modal .modal-header { border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }
      .erp-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); background-color: #222 !important; }

      /* ANIMAÇÕES GLOBAIS (TOASTS E MODAIS) */
      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      .modal.fade .modal-dialog { transform: scale(0.85) translateY(30px); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; }
      .modal.show .modal-dialog { transform: scale(1) translateY(0); }

      /* Upload de Imagem Notificação (Dark) */
      .image-upload-wrapper { border: 2px dashed rgba(255,255,255,0.2); border-radius: 8px; text-align: center; padding: 20px; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; background: #222; }
      .image-upload-wrapper:hover { border-color: #08c068; background: #2a2a2a; }
      .image-upload-wrapper img { max-height: 150px; object-fit: contain; position: relative; z-index: 2; border-radius: 6px; }

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
      .skeleton-btn-view { height: 26px; width: 32px; border-radius: 4px; display: inline-block; }
      
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
            <button class="btn btn-sm btn-outline-secondary border d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-cogs text-muted me-2"></i>Configurações Gerais</h5>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Gerencie as comunicações do sistema</span>
            </div>
        </div>
      </div>

      <div class="row g-4">
          
          <div class="col-12 col-lg-5">
              <form method="POST" action="/notificacoes/global/nova" enctype="multipart/form-data" class="card erp-card shadow-sm h-100" id="formNovaNotificacao" onsubmit="prepararSubmissaoSimples(event, this, 'Notificação enviada a todos os usuários!')">
                  <div class="card-header bg-custom-darker border-bottom border-custom p-3">
                      <h6 class="fw-bold mb-0 text-white" style="font-size: 0.85rem;"><i class="fa-solid fa-paper-plane text-accent me-2"></i> Configurar aviso</h6>
                  </div>
                  <div class="card-body p-4 bg-custom-dark">
                      <p class="text-muted" style="font-size: 0.75rem;">Defina o período em que esta mensagem aparecerá como um Pop-up na tela inicial de todos os colaboradores.</p>
                      
                      <div class="mb-3">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Título</label>
                          <input type="text" name="titulo_notificacao" class="form-control form-control-sm shadow-sm" placeholder="Ex: Atualização do sistema" required maxlength="100">
                      </div>
                      
                      <div class="mb-3">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Mensagem Detalhada</label>
                          <textarea name="mensagem_notificacao" class="form-control form-control-sm shadow-sm" rows="4" placeholder="Escreva aqui as instruções ou o aviso para os colaboradores..." required></textarea>
                      </div>

                      <div class="row g-2 mb-3">
                          <div class="col-6">
                              <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Exibir a partir de:</label>
                              <input type="datetime-local" name="data_inicio" class="form-control form-control-sm shadow-sm" required>
                          </div>
                          <div class="col-6">
                              <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Ocultar após:</label>
                              <input type="datetime-local" name="data_fim" class="form-control form-control-sm shadow-sm" required>
                          </div>
                      </div>

                      <div class="mb-4">
                          <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;"><i class="fa-solid fa-image text-accent me-1"></i> Imagem (Opcional)</label>
                          <div class="image-upload-wrapper shadow-sm" onclick="document.getElementById('imgNotificacaoInput').click()">
                              <i class="fa-solid fa-cloud-arrow-up fa-2x text-muted mb-2 opacity-50" id="iconUploadNotificacao"></i>
                              <p class="text-muted mb-0" id="textUploadNotificacao" style="font-size: 0.75rem;">Clique para anexar</p>
                              <img id="previewImgNotificacao" src="" style="display: none; width: 100%;" class="mt-2">
                          </div>
                          <input type="file" name="imagem_notificacao" id="imgNotificacaoInput" class="d-none" accept="image/*" onchange="previewNotificationImage(this)">
                      </div>
                      
                  </div>
                  <div class="card-footer bg-custom-darker border-top border-custom p-3 text-end d-flex flex-nowrap gap-2 justify-content-end">
                      <button type="button" class="btn btn-sm btn-outline-secondary text-white px-3 fw-bold shadow-sm" onclick="resetFormNotificacao()">Limpar</button>
                      <button type="submit" class="btn btn-sm btn-primary text-dark fw-bold px-4 shadow-sm"><i class="fa-solid fa-paper-plane me-1"></i> Publicar</button>
                  </div>
              </form>
          </div>

          <div class="col-12 col-lg-7">
              <div class="card erp-card shadow-sm border-light h-100 bg-custom-darker">
                  <div class="card-header bg-custom-darker border-bottom border-custom p-3">
                      <h6 class="fw-bold text-white mb-0" style="font-size: 0.85rem;"><i class="fa-solid fa-clock-rotate-left text-warning me-2"></i> Avisos ativos e histórico</h6>
                  </div>
                  <div class="card-body p-0">
                      <div class="table-responsive border-0 m-0" style="max-height: 70vh; overflow-y: auto;">
                          <table class="table table-hover align-middle mb-0 border-0" style="font-size: 0.8rem;">
                              <thead style="position: sticky; top: 0; z-index: 1;">
                                  <tr>
                                      <th class="py-2 px-3 text-muted">Aviso / Exibição</th>
                                      <th class="py-2 px-3 text-muted">Conteúdo</th>
                                      <th class="py-2 px-3 text-center text-muted">Estado</th>
                                      <th class="py-2 px-3 text-end text-muted">Ações</th>
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

          <div class="col-12">
              <div class="card erp-card shadow-sm h-100 bg-custom-darker border-custom">
                <div class="card-header bg-custom-darker border-bottom border-custom p-3 d-flex justify-content-between align-items-center">
                    <h6 class="fw-bold text-white mb-0" style="font-size: 0.85rem;">
                        <i class="fa-solid fa-satellite-dish text-info me-2"></i>
                        Console
                    </h6>
                </div>

                <div class="card-body p-4 bg-custom-dark">
                    <div class="row g-4 h-100">

                        <!-- LADO ESQUERDO -->
                        <div class="col-lg-4">
                            <label class="form-label text-muted fw-bold mb-2" style="font-size:0.75rem;">
                                Endpoint
                            </label>

                            <div class="input-group input-group-sm shadow-sm mb-3">
                                <span class="input-group-text bg-custom-darker border-custom text-accent">
                                    <i class="fa-solid fa-link"></i>
                                </span>

                                <input
                                    type="text"
                                    id="webhookUrlInput"
                                    class="form-control border-custom bg-custom-darker text-white-50"
                                    value="Carregando..."
                                    readonly>

                                <button
                                    class="btn btn-outline-secondary border-custom bg-custom-darker text-white"
                                    type="button"
                                    onclick="copiarUrlWebhook()">
                                    <i class="fa-regular fa-copy"></i>
                                    Copiar
                                </button>
                            </div>

                            <div class="small text-white-50">
                                Utilize este endpoint para receber os eventos enviados pelo Omie e processá-los automaticamente no EcoFlow.
                            </div>
                        </div>

                        <!-- LADO DIREITO -->
                        <div class="col-lg-8 d-flex flex-column">

                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <label class="form-label text-muted fw-bold mb-0" style="font-size:0.75rem;">
                                    Console
                                </label>

                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary border-custom text-white-50 py-1"
                                    onclick="limparConsoleWebhook()">
                                    Limpar
                                </button>
                            </div>

                            <div class="terminal-container flex-grow-1 p-3 rounded border border-custom shadow-sm"
                                style="
                                    background-color:#0d0d0d;
                                    min-height:500px;
                                    height:65vh;
                                    overflow-y:auto;
                                    font-family:monospace;
                                    font-size:0.8rem;
                                ">

                                <div id="consoleWebhook" class="d-flex flex-column gap-2">
                                    <div class="text-white-50">
                                        # Escutando eventos
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>
                </div>
            </div>
          </div>

      </div>

    </div>

    ${modaisDinamicos.join('')}

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
            <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/socket.io/socket.io.js"></script>
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
          const mainRow = document.querySelector('.content > .row.g-4');
          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="row g-4 skeleton-container">
              <div class="col-12 col-lg-5">
                  <div class="card erp-card bg-custom-darker border-custom h-100 p-4">
                      <div class="skeleton-dark skeleton-text-view mb-4" style="width: 50%; height: 20px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="height: 35px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="height: 100px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-4" style="height: 35px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="height: 150px;"></div>
                  </div>
              </div>
              <div class="col-12 col-lg-7">
                  <div class="card erp-card bg-custom-darker border-custom h-100 p-4">
                      <div class="skeleton-dark skeleton-text-view mb-4" style="width: 40%; height: 20px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="height: 40px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="height: 40px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="height: 40px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="height: 40px;"></div>
                  </div>
              </div>
              <div class="col-12 mt-4">
                  <div class="card erp-card bg-custom-darker border-custom p-4">
                      <div class="skeleton-dark skeleton-text-view mb-4" style="width: 30%; height: 20px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="height: 35px;"></div>
                      <div class="skeleton-dark skeleton-text-view mb-2" style="height: 150px;"></div>
                  </div>
              </div>
          </div>\`;

          if (mainRow && !mainRow.classList.contains('skeleton-container')) {
              mainRow.style.display = 'none';
              mainRow.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();
          const mainRow = document.querySelector('.content > .row.g-4:not(.skeleton-container)');
          if (mainRow) mainRow.style.display = 'flex';
      }

      // Executa no load
      mostrarSkeletonGlobais();
      window.addEventListener('load', () => {
          ocultarSkeletonGlobais();
      });
      window.addEventListener('beforeunload', () => {
          mostrarSkeletonGlobais();
      });

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

      function escapeHtmlWebhook(text) {
          const div = document.createElement('div');
          div.innerText = text;
          return div.innerHTML;
      }

    // LÓGICA DO CONSOLE WEBHOOK (OMIE)
    function formatarPayloadWebhook(payload) {
        try {
            if (typeof payload === 'string') {
                const parsed = JSON.parse(payload);
                return JSON.stringify(parsed, null, 2);
            }

            return JSON.stringify(payload, null, 2);
        } catch (e) {
            return payload;
        }
    }

    // Função para ler o Histórico de Logs do banco ao carregar a página
    async function carregarHistoricoWebhook() {
        try {
            const resp = await fetch('/webhook/omie/logs');
            const data = await resp.json();

            if (data.success && data.logs.length > 0) {
                const consoleEl = document.getElementById('consoleWebhook');
                consoleEl.innerHTML = '';

                data.logs.forEach(log => {
                    const time = new Date(log.criado_em).toLocaleTimeString('pt-BR');
                    const isPing = log.topico === 'PING';
                    const colorTitle = isPing ? 'text-info' : 'text-success';
                    const titleMsg = isPing ? '[PING] Validação do Omie' : '[EVENTO] ' + log.topico;

                    const stringified = formatarPayloadWebhook(log.payload);

                    const logEntry = document.createElement('div');
                    logEntry.className = "border-bottom border-custom pb-2 mb-2";

                    logEntry.innerHTML =
                        '<span class="text-white-50">[' + time + ']</span> <strong class="' + colorTitle + '">' + titleMsg + '</strong>' +
                        '<pre class="m-0 mt-2 p-2 bg-custom-dark border border-custom rounded text-white-50" style="font-size: 0.75rem; white-space: pre-wrap; word-break: break-all;">' +
                        escapeHtmlWebhook(stringified) +
                        '</pre>';

                    consoleEl.appendChild(logEntry);
                });

                consoleEl.parentElement.scrollTop = consoleEl.parentElement.scrollHeight;
            }
        } catch (e) {
            console.error("Erro ao buscar histórico de webhooks", e);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const urlInput = document.getElementById('webhookUrlInput');

        if (urlInput) {
            urlInput.value = window.location.origin + '/webhook/omie/pedidos';
        }

        carregarHistoricoWebhook();

        if (typeof io !== 'undefined') {
            const socket = io();

            socket.on('webhook_omie_recebido', (data) => {
                const consoleEl = document.getElementById('consoleWebhook');

                if (consoleEl.innerHTML.includes('# Escutando eventos')) {
                    consoleEl.innerHTML = '';
                }

                const time = new Date().toLocaleTimeString('pt-BR');
                const isPing = data.payload && data.payload.ping;

                const colorTitle = isPing ? 'text-info' : 'text-success';
                const titleMsg = isPing ? '[PING] Validação do Omie' : '[EVENTO] ' + (data.payload.topic || 'Desconhecido');

                const stringified = formatarPayloadWebhook(data.payload);

                const logEntry = document.createElement('div');
                logEntry.className = "border-bottom border-custom pb-2 mb-2";

                logEntry.innerHTML =
                    '<span class="text-white-50">[' + time + ']</span> <strong class="' + colorTitle + '">' + titleMsg + '</strong>' +
                    '<pre class="m-0 mt-2 p-2 bg-custom-dark border border-custom rounded text-white-50" style="font-size: 0.75rem; white-space: pre-wrap; word-break: break-all;">' +
                    escapeHtmlWebhook(stringified) +
                    '</pre>';

                consoleEl.appendChild(logEntry);

                consoleEl.parentElement.scrollTop = consoleEl.parentElement.scrollHeight;
            });
        }
    });

    function copiarUrlWebhook() {
        const copyText = document.getElementById("webhookUrlInput");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);
        mostrarToast('sucesso', 'Copiado!', 'Link do endpoint copiado para a área de transferência.');
    }

    function limparConsoleWebhook() {
        document.getElementById('consoleWebhook').innerHTML = '<div class="text-white-50"># Escutando eventos</div>';
    }
    </script>
  </body>
  </html>
  `;
}

module.exports = configView;