// views/clientesView.js
const menuLateral = require("./menuLateral");
const termosComponent = require("./termosComponent");

function clientesView(usuario, clientesHistorico = []) {
  const termosHTML = termosComponent(usuario);
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  const modaisEdicaoExclusaoClientes = (clientesHistorico && clientesHistorico.length > 0) ? clientesHistorico.map((c, i) => {
      const logoSrc = c.logo ? `/uploads/${c.logo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nome)}&background=2a2a2a&color=08c068`;
      const arteSrc = c.arte ? `/uploads/${c.arte}` : null;
      const contatoFmt = c.contato || '';
      const contatoSecundarioFmt = c.contato_secundario || ''; // Recupera o contato secundário do DB

      return `
      <div class="modal fade" id="editarClienteModal${i}" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 540px;">
        <form method="POST" action="/caderno-entregas/clientes/editar" enctype="multipart/form-data" class="modal-content shadow-lg erp-modal" onsubmit="prepararSubmissaoArquivos(event, this, 'Cliente Atualizado!')">
            <input type="hidden" name="nomeOriginal" value="${c.nome}">
            
            <div class="modal-header bg-custom-darker text-white border-0">
                <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Editar Dados de ${c.nome}</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body p-4 bg-custom-dark text-sm">
                <div class="d-flex align-items-start gap-3 mb-3">
                    
                    <div class="text-center flex-shrink-0">
                        <label class="form-label text-white-50 fw-bold mb-2 d-block" style="font-size:0.75rem;">Logo</label>
                        <div class="upload-box-square border-custom position-relative shadow-sm m-0" onclick="document.getElementById('inputLogoEdit${i}').click()">
                            <img id="previewLogoEdit${i}" src="${logoSrc}" alt="Logo">
                            <div class="upload-overlay d-flex align-items-center justify-content-center"><span>Alterar</span></div>
                        </div>
                        <input type="file" name="logo" id="inputLogoEdit${i}" class="d-none" accept="image/*" onchange="previewImage(this, 'previewLogoEdit${i}', 'removerLogoFlag${i}')">
                        <input type="hidden" name="removerLogo" id="removerLogoFlag${i}" value="false">
                        ${c.logo ? `<button type="button" class="btn btn-sm btn-link text-danger p-0 mt-2 text-decoration-none w-100" style="font-size: 0.7rem;" onclick="removerLogoEdit(${i}, 'previewLogoEdit${i}', '${encodeURIComponent(c.nome)}')"><i class="fa-solid fa-trash me-1"></i>Remover</button>` : ''}
                    </div>

                    <div class="flex-grow-1">
                        <div class="mb-2">
                            <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Cliente</label>
                            <input type="text" name="nomeNovo" class="form-control form-control-sm shadow-sm" value="${c.nome}" required>
                        </div>
                        <div class="row g-2">
                            <div class="col-6">
                                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Contato Principal</label>
                                <input type="text" name="contato" class="form-control form-control-sm shadow-sm" value="${contatoFmt}" placeholder="(00) 0 0000-0000" oninput="mascaraTelefone(this)" maxlength="16">
                            </div>
                            <div class="col-6">
                                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Contato Secundário</label>
                                <input type="text" name="contato_secundario" class="form-control form-control-sm shadow-sm" value="${contatoSecundarioFmt}" placeholder="(00) 0 0000-0000" oninput="mascaraTelefone(this)" maxlength="16">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row g-2">
                    <div class="col-12">
                        <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Link do Google Maps</label>
                        <input type="url" name="link_endereco" class="form-control form-control-sm shadow-sm" value="${c.link_endereco || ''}" placeholder="https://maps.app.goo.gl/..." oninput="extrairCoordenadasAoColar(this)">
                    </div>
                    <div class="col-12">
                        <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;"><i class="fa-solid fa-location-crosshairs text-accent me-1"></i> Coordenadas Exatas (Opcional)</label>
                        <input type="text" name="coordenadas" class="form-control form-control-sm shadow-sm" value="${c.coordenadas || ''}" placeholder="Ex: -12.6974, -38.3241">
                    </div>
                </div>

                <div class="mt-4">
                    <hr class="border-custom my-1">
                    <label class="form-label text-white fw-bold mt-2 mb-2 d-block" style="font-size:0.8rem;"><i class="fa-solid fa-palette text-accent me-1"></i> Arte / Layout de Embalagem</label>
                    <div class="p-3 bg-custom-darker rounded border-custom d-flex align-items-center gap-3">
                        <div class="preview-arte-box bg-custom-dark border-custom rounded d-flex align-items-center justify-content-center flex-shrink-0" style="width: 100px; height: 70px; overflow: hidden;">
                            ${arteSrc 
                                ? `<img id="previewArteEdit${i}" src="${arteSrc}" class="img-fluid" style="max-height: 100%; object-fit: contain;">`
                                : `<img id="previewArteEdit${i}" src="" class="img-fluid d-none" style="max-height: 100%; object-fit: contain;"><span id="placeholderArteEdit${i}" class="text-white-50 small text-center"><i class="fa-solid fa-image-slash d-block"></i></span>`
                            }
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex gap-2 mb-1">
                                <button type="button" class="btn btn-sm btn-outline-success fw-bold w-100" onclick="document.getElementById('inputArteEdit${i}').click()"><i class="fa-solid fa-upload me-1"></i> Alterar</button>
                                ${arteSrc ? `<a href="${arteSrc}" target="_blank" class="btn btn-sm btn-outline-secondary text-white w-100"><i class="fa-solid fa-expand me-1"></i> Ampliar</a>` : ''}
                            </div>
                            <span class="text-white-50 d-block" style="font-size: 0.65rem;">JPG ou PNG</span>
                            <input type="file" name="arte" id="inputArteEdit${i}" class="d-none" accept="image/*" onchange="previewArte(this, 'previewArteEdit${i}', 'placeholderArteEdit${i}')">
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer bg-custom-darker border-0 d-flex flex-nowrap">
                <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold text-dark"><i class="fa-solid fa-save me-1"></i> Salvar</button>
            </div>
        </form>
    </div>
</div>

      <div class="modal fade" id="excluirClienteModal${i}" tabindex="-1">
          <div class="modal-dialog modal-sm modal-dialog-centered">
              <form method="POST" action="/caderno-entregas/clientes/excluir" class="modal-content shadow-lg erp-modal" onsubmit="prepararSubmissaoSimples(event, this, 'Cliente Excluído!')">
                  <input type="hidden" name="nome" value="${c.nome}">
                  <div class="modal-body text-center p-4">
                      <i class="fa-solid fa-triangle-exclamation fa-2x text-danger mb-3"></i>
                      <h6 class="mb-2 fw-bold text-white" style="font-size: 0.9rem;">Excluir Cliente?</h6>
                      <p class="text-white-50 mb-0" style="font-size:0.75rem;"><strong>${c.nome}</strong> será removido permanentemente, assim como sua arte e logo cadastrados.</p>
                  </div>
                  <div class="modal-footer justify-content-center bg-custom-darker border-0 d-flex flex-nowrap">
                      <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                      <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold">Sim, Excluir</button>
                  </div>
              </form>
          </div>
      </div>
  `}).join('') : '';

  const menuHTML = menuLateral(user, "/clientes");

  const dadosClientesJSON = JSON.stringify(clientesHistorico || []).replace(/</g, '\\u003c');

  const modalVisualizarImagemHTML = `
    <div class="modal fade" id="modalVisualizarImagem" tabindex="-1" style="z-index: 2060;" aria-hidden="true">
        <div class="modal-dialog modal-fullscreen" style="background-color: rgba(0,0,0,0.85);">
            <div class="modal-content bg-transparent border-0 shadow-none position-relative w-100 h-100 d-flex align-items-center justify-content-center" data-bs-dismiss="modal">
                <button type="button" class="btn-close btn-close-white position-absolute" style="top: 25px; left: 25px; z-index: 2070; opacity: 1;" aria-label="Fechar" data-bs-dismiss="modal"></button>
                <img id="imagemAmpliadaModal" src="" class="img-fluid shadow-lg rounded" style="max-height: 85vh; max-width: 90vw; object-fit: contain;" onclick="event.stopPropagation();">
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
    <title>Clientes | Ecoflow</title>
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

      .form-control { background-color: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.8rem; }
      .form-control:focus { background-color: #2a2a2a; border-color: #08c068; color: #fff; box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.25); }

      /* PLACEHOLDERS EM CINZA CLARO */
      .form-control::placeholder,
      .form-select::placeholder,
      input::placeholder,
      textarea::placeholder {
          color: rgba(255, 255, 255, 0.45) !important;
          opacity: 1 !important;
      }
      .form-control::-webkit-input-placeholder { color: rgba(255, 255, 255, 0.45) !important; }
      .form-control::-moz-placeholder { color: rgba(255, 255, 255, 0.45) !important; opacity: 1 !important; }

      .table { --bs-table-bg: transparent; --bs-table-color: #fff; --bs-table-hover-bg: rgba(255,255,255,0.06); --bs-table-hover-color: #fff; color: #fff; margin-bottom: 0; }
      .table thead th { background-color: #222 !important; color: rgba(255,255,255,0.6) !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; font-weight: 600; }
      .table tbody td { border-bottom: 1px solid rgba(255,255,255,0.05) !important; background-color: transparent !important; color: #fff !important; }
      .table-hover-row { transition: background-color 0.2s ease; }
      .table-hover-row:hover > td { background-color: rgba(255,255,255,0.06) !important; color: #fff !important; }

      .erp-modal { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: #2a2a2a; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      
      .upload-box-square { width: 115px; height: 115px; border-radius: 12px; overflow: hidden; background: #1f1f1f; border: 2px dashed rgba(8,192,104,0.4); cursor: pointer; }
      .upload-box-square img { width: 100%; height: 100%; object-fit: cover; }
      .upload-overlay { position: absolute; bottom: 0; left: 0; right: 0; height: 35%; background: rgba(0,0,0,0.75); font-size: 0.7rem; font-weight: bold; opacity: 0; transition: opacity 0.2s; }
      .upload-box-square:hover .upload-overlay { opacity: 1; }

      .pagination .page-link { background-color: #222; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); cursor: pointer; }
      .pagination .page-item.active .page-link { background-color: #08c068; border-color: #08c068; color: #1f1f1f !important; font-weight: bold; }
      .pagination .page-link:hover { background-color: #2a2a2a; color: #fff; }
      .pagination .page-item.disabled .page-link { background-color: #1f1f1f; color: rgba(255,255,255,0.25); border-color: rgba(255,255,255,0.05); }

      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 4px; background: #08c068; width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      /* SKELETON LOADING */
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
        <h5 class="offcanvas-title ms-2" style="font-size: 0.9rem;"><i class="fa-solid fa-bars text-white-50 me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2"><img src="/img/logo.png" class="img-fluid" style="max-width:140px;"></div>
        ${menuHTML}
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary border-custom d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars text-white"></i></button>
            <div>
              <h5 class="mb-0 fw-bold text-white"><i class="fa-solid fa-users text-accent me-2"></i>Clientes & Locais</h5>
              <span class="text-white-50 d-none d-sm-block mt-1" style="font-size:0.7rem;">Base de dados para preenchimento automático de rotas e embalagens</span>
            </div>
        </div>
        <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-sm btn-outline-warning shadow-sm fw-bold" data-bs-toggle="modal" data-bs-target="#migracaoModal" title="Sincronizar clientes antigos">
                <i class="fa-solid fa-satellite-dish"></i> <span class="d-none d-md-inline ms-1">Sincronizar GPS</span>
            </button>
            <a href="/caderno-entregas/clientes/exportar-excel" target="_blank" class="btn btn-sm btn-outline-success shadow-sm fw-bold">
                <i class="fa-solid fa-file-excel"></i> <span class="d-none d-md-inline ms-1">Relatório</span>
            </a>
            <button class="btn btn-sm btn-success shadow-sm fw-bold text-dark px-3" data-bs-toggle="modal" data-bs-target="#novoClienteModal">
                <i class="fa-solid fa-user-plus me-1"></i> Novo Cliente
            </button>
        </div>
      </div>

      <div class="input-group input-group-sm mb-3 shadow-sm" style="max-width: 600px;" id="searchBarClientes">
          <span class="input-group-text bg-custom-dark border-end-0 border-custom"><i class="fa-solid fa-magnifying-glass text-white-50"></i></span>
          <input type="text" id="searchInputClientes" class="form-control border-start-0 border-end-0 border-custom bg-custom-dark text-white" placeholder="Pesquisar cliente por nome ou cidade..." oninput="filtrarClientesPaginado(1)">
          <button class="btn btn-outline-secondary bg-custom-dark border-custom border-start-0 text-danger" type="button" onclick="limparBuscaClientes()" title="Limpar"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <span id="resumoRegistrosText" class="text-white-50 d-block w-100 text-end" style="font-size: 0.75rem; margin-bottom: 0.5rem;">Exibindo registros...</span>

      <div class="table-responsive bg-custom-dark rounded-3 border-custom shadow-sm mb-3" style="min-height: 480px;" id="tabelaContainer">
          <table class="table table-sm align-middle mb-0" style="font-size: 0.8rem;">
              <thead>
                  <tr>
                      <th class="py-2 px-3">Nome / Pizzaria</th>
                      <th class="py-2 px-3">Telefone / Contato</th>
                      <th class="py-2 px-3">Cidade</th>
                      <th class="py-2 px-3 text-end">Ações</th>
                  </tr>
              </thead>
              <tbody id="tabelaClientesBody">
              </tbody>
          </table>
      </div>

      <div id="paginacaoClientesContainer" class="d-flex flex-column align-items-center justify-content-center mt-4 gap-2 text-white-50 small w-100">
          <nav><ul class="pagination pagination-sm mb-0 shadow-sm" id="listaPaginasUl"></ul></nav>
      </div>
    </div>

    <div class="modal fade" id="novoClienteModal" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 540px;">
        <form method="POST" action="/caderno-entregas/clientes/novo" enctype="multipart/form-data" class="modal-content shadow-lg erp-modal" onsubmit="prepararSubmissaoArquivos(event, this, 'Cliente Cadastrado!')">
            <div class="modal-header bg-custom-darker text-white border-0">
                <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-user-plus me-2 text-accent"></i> Cadastrar Novo Cliente</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body p-4 bg-custom-dark text-sm">
                
                <div class="d-flex align-items-start gap-3 mb-3">
                    
                    <div class="text-center flex-shrink-0">
                        <label class="form-label text-white-50 fw-bold mb-2 d-block" style="font-size:0.75rem;">Logo</label>
                        <div class="upload-box-square border-custom position-relative shadow-sm m-0" onclick="document.getElementById('inputLogoNovo').click()">
                            <img id="previewLogoNovo" src="https://ui-avatars.com/api/?name=Novo+Cliente&background=1f1f1f&color=08c068" alt="Novo">
                            <div class="upload-overlay d-flex align-items-center justify-content-center"><span>Escolher</span></div>
                        </div>
                        <input type="file" name="logo" id="inputLogoNovo" class="d-none" accept="image/*" onchange="previewImage(this, 'previewLogoNovo')">
                    </div>

                    <div class="flex-grow-1">
                        <div class="mb-2">
                            <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Cliente</label>
                            <input type="text" name="nome" class="form-control form-control-sm shadow-sm" required placeholder="Ex: Pizzaria Bella Napoli">
                        </div>
                        <div class="row g-2">
                            <div class="col-6">
                                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Contato Principal</label>
                                <input type="text" name="contato" class="form-control form-control-sm shadow-sm" placeholder="(00) 0 0000-0000" oninput="mascaraTelefone(this)" maxlength="16">
                            </div>
                            <div class="col-6">
                                <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Contato Secundário</label>
                                <input type="text" name="contato_secundario" class="form-control form-control-sm shadow-sm" placeholder="(00) 0 0000-0000" oninput="mascaraTelefone(this)" maxlength="16">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row g-2">
                    <div class="col-12">
                        <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;">Link do Google Maps</label>
                        <input type="url" name="link_endereco" class="form-control form-control-sm shadow-sm" placeholder="https://maps.app.goo.gl/..." oninput="extrairCoordenadasAoColar(this)">
                    </div>
                    <div class="col-12">
                        <label class="form-label text-white-50 fw-bold mb-1" style="font-size:0.75rem;"><i class="fa-solid fa-location-crosshairs text-accent me-1"></i> Coordenadas (Opcional)</label>
                        <input type="text" name="coordenadas" class="form-control form-control-sm shadow-sm" placeholder="Lat, Lng">
                    </div>
                </div>

                <div class="mt-4">
                    <hr class="border-custom my-1">
                    <label class="form-label text-white fw-bold mt-2 mb-2 d-block" style="font-size:0.8rem;"><i class="fa-solid fa-palette text-accent me-1"></i> Arte / Embalagem da Caixa</label>
                    <div class="p-3 bg-custom-darker rounded border-custom d-flex align-items-center gap-3">
                        <div class="preview-arte-box bg-custom-dark border-custom rounded d-flex align-items-center justify-content-center flex-shrink-0" style="width: 100px; height: 70px; overflow: hidden;">
                            <img id="previewArteNovo" src="" class="img-fluid d-none" style="max-height: 100%; object-fit: contain;">
                            <span id="placeholderArteNovo" class="text-white-50 small text-center"><i class="fa-solid fa-image-slash d-block"></i></span>
                        </div>
                        <div class="flex-grow-1">
                            <button type="button" class="btn btn-sm btn-outline-success fw-bold w-100 mb-1" onclick="document.getElementById('inputArteNovo').click()"><i class="fa-solid fa-upload me-1"></i> Selecionar Arquivo</button>
                            <span class="text-white-50 d-block" style="font-size: 0.65rem;">JPG ou PNG</span>
                            <input type="file" name="arte" id="inputArteNovo" class="d-none" accept="image/*" onchange="previewArte(this, 'previewArteNovo', 'placeholderArteNovo')">
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer bg-custom-darker border-0 d-flex flex-nowrap">
                <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold text-dark"><i class="fa-solid fa-check me-1"></i> Cadastrar</button>
            </div>
        </form>
    </div>
</div>

    <div class="modal fade" id="migracaoModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 520px;">
            <div class="modal-content erp-modal shadow-lg">
                <div class="modal-header bg-custom-darker text-white border-0">
                    <h6 class="modal-title fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-satellite-dish me-2 text-warning"></i> Sincronizar Coordenadas</h6>
                    <button type="button" class="btn-close btn-close-white" onclick="fecharMigracao()"></button>
                </div>
                <div class="modal-body p-4 bg-custom-dark text-center" id="migracaoStartScreen">
                    <i class="fa-solid fa-satellite-dish fa-2x text-warning mb-3"></i>
                    <h6 class="fw-bold text-white mb-2" style="font-size: 0.9rem;">Atualizar Clientes Antigos?</h6>
                    <p class="text-white-50 small mb-0">O sistema varrerá todos os clientes em busca de coordenadas exatas e cidades correspondentes através do Google Maps.</p>
                </div>
                <div class="modal-body p-0 bg-custom-darker" id="migracaoProcessScreen" style="display: none; height: 400px;">
                    <iframe id="iframeMigracao" src="about:blank" style="width: 100%; height: 100%; border: none; background: #2a2a2a;"></iframe>
                </div>
                <div class="modal-footer bg-custom-darker border-0 p-3">
                    <div class="d-flex gap-2 w-100">
                        <button type="button" class="btn btn-sm btn-warning fw-bold text-dark w-50" onclick="iniciarMigracao()"><i class="fa-solid fa-rotate me-1"></i> Sincronizar</button>
                        <button type="button" class="btn btn-sm btn-outline-secondary text-white fw-bold w-50" onclick="fecharMigracao()">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(8,192,104,0.3) !important;" role="alert">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div><i class="fa-solid fa-circle-check fs-5 me-2 text-accent" id="sucessoIcon"></i><strong class="fs-6" id="sucessoTitulo">Concluído!</strong></div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative"><p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="sucessoSub">Sucesso.</p></div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 4px; background: #08c068;"></div>
        </div>
        <div id="erroToast" class="toast shadow-lg border-0 bg-custom-darker text-white overflow-hidden position-relative" style="border: 1px solid rgba(220,53,69,0.3) !important;" role="alert">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div><i class="fa-solid fa-circle-xmark fs-5 me-2 text-danger"></i><strong class="fs-6" id="erroTitulo">Erro!</strong></div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative"><p class="text-white mb-0" style="font-size:0.8rem; opacity: 0.8;" id="erroSub">Ocorreu um erro.</p></div>
            <div class="toast-timer position-absolute bottom-0 start-0 bg-danger" id="erroTimer" style="display: none; height: 4px;"></div>
        </div>
    </div>

    ${modaisEdicaoExclusaoClientes}
    ${modalVisualizarImagemHTML}
    ${termosHTML}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      let isSubmitting = false;
      const todosClientesDB = ${dadosClientesJSON};
      let paginaAtual = 1;
      const limitePorPagina = 12;

      // =======================================================================
      // MÁSCARA AUTOMÁTICA DE TELEFONE/WHATSAPP
      // =======================================================================
      function mascaraTelefone(input) {
          let v = input.value.replace(/\\D/g, ''); // Remove o que não é dígito
          if (v.length > 11) v = v.slice(0, 11);
          
          if (v.length > 10) {
              v = v.replace(/^(\\d{2})(\\d{1})(\\d{4})(\\d{4})$/, '($1) $2 $3-$4');
          } else if (v.length > 6) {
              v = v.replace(/^(\\d{2})(\\d{4})(\\d{0,4})/, '($1) $2-$3');
          } else if (v.length > 2) {
              v = v.replace(/^(\\d{2})(\\d{0,5})/, '($1) $2');
          } else if (v.length > 0) {
              v = v.replace(/^(\\d{0,2})/, '($1');
          }
          input.value = v;
      }

      // =======================================================================
      // SKELETON LOADING
      // =======================================================================
      function mostrarSkeletonGlobais() {
          const tableContainer = document.getElementById('tabelaContainer');
          if (!tableContainer || document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="w-100">
              <div class="skeleton-dark mb-3" style="width: 100%; height: 40px; border-radius: 6px;"></div>
              <div class="skeleton-dark" style="width: 100%; height: 480px; border-radius: 8px;"></div>
          </div>\`;

          const searchBar = document.getElementById('searchBarClientes');
          const paginacao = document.getElementById('paginacaoClientesContainer');
          
          if(searchBar) searchBar.style.display = 'none';
          if(paginacao) paginacao.style.display = 'none';
          tableContainer.style.display = 'none';

          tableContainer.insertAdjacentHTML('beforebegin', skeletonHTML);
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const tableContainer = document.getElementById('tabelaContainer');
          const searchBar = document.getElementById('searchBarClientes');
          const paginacao = document.getElementById('paginacaoClientesContainer');

          if(tableContainer) tableContainer.style.display = 'block';
          if(searchBar) searchBar.style.display = 'flex';
          if(paginacao) paginacao.style.display = 'flex';
      }

      mostrarSkeletonGlobais();
      window.addEventListener('load', ocultarSkeletonGlobais);
      window.addEventListener('beforeunload', mostrarSkeletonGlobais);

      function previewImage(input, imgId, flagId) {
          if (input.files && input.files[0]) {
              const reader = new FileReader();
              reader.onload = e => document.getElementById(imgId).src = e.target.result;
              reader.readAsDataURL(input.files[0]);

              // Reseta a flag de remoção se o usuário escolher um arquivo novo
              if(flagId) {
                  const flagInput = document.getElementById(flagId);
                  if(flagInput) flagInput.value = 'false';
              }
          }
      }

      function removerLogoEdit(idx, imgId, clientNameRaw) {
          const flagInput = document.getElementById('removerLogoFlag' + idx);
          if (flagInput) flagInput.value = 'true';

          const fileInput = document.getElementById('inputLogoEdit' + idx);
          if (fileInput) fileInput.value = '';

          const img = document.getElementById(imgId);
          if (img) {
              const nomeDecode = decodeURIComponent(clientNameRaw || 'Cliente');
              img.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(nomeDecode)}&background=1f1f1f&color=08c068\`;
          }
      }

      function previewArte(input, imgId, placeholderId) {
          if (input.files && input.files[0]) {
              const reader = new FileReader();
              reader.onload = e => {
                  const img = document.getElementById(imgId);
                  const placeholder = document.getElementById(placeholderId);
                  img.src = e.target.result;
                  img.classList.remove('d-none');
                  if(placeholder) placeholder.classList.add('d-none');
              };
              reader.readAsDataURL(input.files[0]);
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
              new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 }).show();
          }
      }

      document.addEventListener("DOMContentLoaded", () => {
          filtrarClientesPaginado(1);

          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('sucessoCliente')) {
              mostrarToast('sucesso', 'Concluído!', 'Cliente atualizado com sucesso');
              const url = new URL(window.location.href);
              url.searchParams.delete('sucessoCliente');
              window.history.replaceState({}, document.title, url.toString());
          }
      });

      function filtrarClientesPaginado(pg = 1) {
          const termo = (document.getElementById("searchInputClientes").value || "").toLowerCase().trim();

          const clientesFiltrados = todosClientesDB.filter(c => {
              const nm = (c.nome || "").toLowerCase();
              const cid = (c.cidade || "").toLowerCase();
              return nm.includes(termo) || cid.includes(termo);
          });

          const totalRegistros = clientesFiltrados.length;
          const totalPaginas = Math.max(1, Math.ceil(totalRegistros / limitePorPagina));

          paginaAtual = pg;
          if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
          if (paginaAtual < 1) paginaAtual = 1;

          const inicio = (paginaAtual - 1) * limitePorPagina;
          const fim = inicio + limitePorPagina;
          const paginaItens = clientesFiltrados.slice(inicio, fim);

          renderizarTabelaClientes(paginaItens);
          renderizarControlesPaginacao(totalPaginas, totalRegistros, inicio + 1, Math.min(fim, totalRegistros));
      }

      function renderizarTabelaClientes(itens) {
          const tbody = document.getElementById("tabelaClientesBody");
          if (!tbody) return;

          if (itens.length === 0) {
              tbody.innerHTML = \`
                <tr>
                    <td colspan="4" class="text-center text-white-50 py-5">
                        <i class="fa-solid fa-users-slash fa-2x opacity-25 mb-3 d-block"></i>
                        <span style="font-size: 0.8rem;">Nenhum cliente encontrado.</span>
                    </td>
                </tr>
              \`;
              return;
          }

          tbody.innerHTML = itens.map(c => {
              const idxOriginal = todosClientesDB.findIndex(dbItem => dbItem.nome === c.nome);
              const logoSrc = c.logo ? \`/uploads/\${c.logo}\` : \`https://ui-avatars.com/api/?name=\${encodeURIComponent(c.nome)}&background=2a2a2a&color=08c068\`;
              const contatoFmt = c.contato || '';

              return \`
                <tr class="cliente-row-filtro table-hover-row" data-bs-toggle="modal" data-bs-target="#editarClienteModal\${idxOriginal}" style="cursor: pointer;">
                    <td class="py-2 px-3">
                        <div class="d-flex align-items-center">
                            <img src="\${logoSrc}" alt="\${c.nome}" class="rounded-circle me-3 border-custom shadow-sm" style="width: 34px; height: 34px; object-fit: cover; flex-shrink: 0; cursor: zoom-in;" data-bs-toggle="modal" data-bs-target="#modalVisualizarImagem" onclick="event.stopPropagation(); document.getElementById('imagemAmpliadaModal').src='\${logoSrc}';">
                            <div>
                                <span class="fw-bold text-white d-block" style="font-size:0.85rem;">\${c.nome}</span>
                                <div class="d-flex gap-2 mt-1">
                                    \${c.coordenadas ? '<span class="badge bg-success" style="font-size:0.55rem;"><i class="fa-solid fa-location-crosshairs me-1"></i>GPS</span>' : ''}
                                    \${c.arte ? '<span class="badge bg-info text-dark" style="font-size:0.55rem;"><i class="fa-solid fa-image me-1"></i>Arte</span>' : ''}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="py-2 px-3 text-white-50" style="font-size: 0.8rem;">
                        \${contatoFmt ? \`<i class="fa-solid fa-phone me-1 opacity-50"></i> \${contatoFmt}\` : '<span class="opacity-50">-</span>'}
                    </td>
                    <td class="py-2 px-3">
                        \${c.cidade ? \`<span class="badge text-dark" style="background-color: #08c068; font-size:0.65rem;">\${c.cidade}</span>\` : '<span class="badge bg-secondary" style="font-size:0.65rem;">Sem cidade</span>'}
                    </td>
                    <td class="text-end py-2 px-3">
                        <button type="button" class="btn btn-sm btn-outline-secondary border-custom text-danger shadow-sm py-1 px-2" data-bs-toggle="modal" data-bs-target="#excluirClienteModal\${idxOriginal}" onclick="event.stopPropagation();">
                            <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
                        </button>
                    </td>
                </tr>
              \`;
          }).join("");
      }

      function renderizarControlesPaginacao(totalPaginas, totalRegistros, exibInicio, exibFim) {
          const ul = document.getElementById("listaPaginasUl");
          const infoText = document.getElementById("resumoRegistrosText");

          if (infoText) {
              infoText.innerText = totalRegistros > 0 ? \`Exibindo \${exibInicio} - \${exibFim} de \${totalRegistros} clientes\` : "0 registros encontrados";
          }

          if (!ul) return;
          if (totalPaginas <= 1) { ul.innerHTML = ""; return; }

          let liHtml = \`<li class="page-item \${paginaAtual === 1 ? 'disabled' : ''}"><a class="page-link" onclick="filtrarClientesPaginado(\${paginaAtual - 1})">«</a></li>\`;

          const addBotaoPagina = (num) => {
              liHtml += \`<li class="page-item \${paginaAtual === num ? 'active' : ''}"><a class="page-link" onclick="filtrarClientesPaginado(\text{num})">\${num}</a></li>\`;
          };

          const addReticencias = () => {
              liHtml += \`<li class="page-item disabled"><a class="page-link">...</a></li>\`;
          };

          const maxBotoesVisiveis = 5;

          if (totalPaginas <= maxBotoesVisiveis + 2) {
              for (let i = 1; i <= totalPaginas; i++) addBotaoPagina(i);
          } else {
              addBotaoPagina(1);
              if (paginaAtual > 3) addReticencias();

              let limInf = Math.max(2, paginaAtual - 1);
              let limSup = Math.min(totalPaginas - 1, paginaAtual + 1);

              if (paginaAtual <= 2) limSup = 3;
              if (paginaAtual >= totalPaginas - 1) limInf = totalPaginas - 2;

              for (let i = limInf; i <= limSup; i++) addBotaoPagina(i);

              if (paginaAtual < totalPaginas - 2) addReticencias();
              addBotaoPagina(totalPaginas);
          }

          liHtml += \`<li class="page-item \${paginaAtual === totalPaginas ? 'disabled' : ''}"><a class="page-link" onclick="filtrarClientesPaginado(\${paginaAtual + 1})">»</a></li>\`;
          ul.innerHTML = liHtml;
      }

      function limparBuscaClientes() {
          const input = document.getElementById("searchInputClientes");
          input.value = "";
          filtrarClientesPaginado(1);
          input.focus();
      }

      function extrairCoordenadasAoColar(inputElement) {
          const container = inputElement.closest('form');
          if (!container) return;
          const inputCoords = container.querySelector('input[name="coordenadas"]');
          if (!inputCoords) return;

          const url = inputElement.value;
          if (!url) return;

          let match = url.match(/!3d(-?\\d+\\.\\d+)!4d(-?\\d+\\.\\d+)/) || url.match(/query=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/) || url.match(/@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);
          if (match && match.length >= 3) {
              inputCoords.value = match[1] + ", " + match[2];
              inputCoords.style.transition = "all 0.3s";
              inputCoords.style.backgroundColor = "rgba(8,192,104,0.15)";
              setTimeout(() => inputCoords.style.backgroundColor = "", 1500);
          }
      }

      function iniciarMigracao() {
          document.getElementById('migracaoStartScreen').style.display = 'none';
          document.getElementById('migracaoProcessScreen').style.display = 'block';
          document.getElementById('iframeMigracao').src = '/caderno-entregas/migrar-coordenadas';
      }

      function fecharMigracao() {
          const iframe = document.getElementById('iframeMigracao');
          if (iframe.src !== "about:blank" && !iframe.src.endsWith("about:blank")) {
              window.location.reload();
          } else {
              bootstrap.Modal.getInstance(document.getElementById('migracaoModal')).hide();
          }
      }

      async function prepararSubmissaoArquivos(event, form, titleMsg) {
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
              const formData = new FormData(form);
              const response = await fetch(form.action, {
                  method: form.method || 'POST',
                  body: formData
              });

              if (response.ok) {
                  window.location.href = "/clientes?sucessoCliente=1";
              } else {
                  mostrarToast('erro', 'Erro', 'Falha ao salvar os dados ou arte do cliente.');
                  isSubmitting = false;
                  ocultarSkeletonGlobais();
              }
          } catch (err) {
              mostrarToast('erro', 'Falha de Conexão', 'Verifique a sua internet e tente novamente.');
              isSubmitting = false;
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
              const formData = new URLSearchParams(new FormData(form));
              
              const response = await fetch(form.action, {
                  method: form.method || 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: formData.toString()
              });

              if (response.ok) {
                  window.location.href = "/clientes?sucessoCliente=1";
              } else {
                  mostrarToast('erro', 'Erro', 'Não foi possível concluir a exclusão no servidor.');
                  isSubmitting = false;
                  ocultarSkeletonGlobais();
              }
          } catch (err) {
              mostrarToast('erro', 'Falha de Conexão', 'Verifique a sua internet e tente novamente.');
              isSubmitting = false;
              ocultarSkeletonGlobais();
          }
      }
    </script>
    <script src="./script/checkLogin.js"></script>
  </body>
  </html>
  `;
}

module.exports = clientesView;