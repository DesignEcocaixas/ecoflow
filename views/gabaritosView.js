// views/gabaritosView.js
const menuLateral = require("./menuLateral");
const renderLoaderParticulas = require("./renderLoaderParticulas");

module.exports = function renderGabaritos(usuario, gabaritos = []) {
    const user = usuario || { nome: "Usu&aacute;rio", tipo_usuario: "admin" };
    const menuHTML = menuLateral(user, "/admin/gabaritos"); 
    
    // Função auxiliar para corrigir caracteres de upload quebrados (ex: alÃ§a -> alça)
    const fixEncoding = (str) => {
        if (!str) return '';
        try {
            // Converte a string de volta para a codificação correta
            return decodeURIComponent(escape(str));
        } catch(e) {
            return str; // Caso não precise de correção
        }
    };

    // Função auxiliar para renderizar os cards dos gabaritos
    const renderGabaritosCards = () => {
        if (gabaritos.length === 0) {
            return `
            <div class="col-12 text-center py-5 bg-white rounded-3 shadow-sm border border-light">
                <i class="fa-solid fa-folder-open fa-3x text-muted opacity-25 mb-3"></i>
                <h5 class="fw-bold text-dark mb-1">Nenhum gabarito encontrado</h5>
                <p class="text-muted small">Fa&ccedil;a o upload do seu primeiro arquivo .cdr ou .ai acima.</p>
            </div>`;
        }

        return gabaritos.map(gab => {
            const nomeCorreto = fixEncoding(gab.nome); // <- Aplica a correção do nome
            
            const isCorel = nomeCorreto.toLowerCase().endsWith('.cdr');
            const isAi = nomeCorreto.toLowerCase().endsWith('.ai');
            
            const nomeExibicao = nomeCorreto.replace(/\.(cdr|ai)$/i, '');
            
            // Cores dinâmicas: Verde para Corel, Laranja (warning) para Illustrator, Azul para outros
            const corTemaTexto = isCorel ? 'text-success' : (isAi ? 'text-warning' : 'text-primary');
            const corBadge = isCorel ? 'bg-success-subtle text-success border-success-subtle' : (isAi ? 'bg-warning-subtle text-warning border-warning-subtle' : 'bg-primary-subtle text-primary border-primary-subtle');
            const bgTemaIco = isCorel ? 'bg-success-subtle' : (isAi ? 'bg-warning-subtle' : 'bg-primary-subtle');
            const icone = isCorel ? 'fa-pen-nib' : (isAi ? 'fa-bezier-curve' : 'fa-file-lines');
            const labelTipo = isCorel ? 'CorelDraw' : (isAi ? 'Illustrator' : 'Arquivo');

            return `
            <div class="col-12 col-sm-6 col-md-4 col-xl-3 gabarito-card mb-3" data-nome="${nomeCorreto.toLowerCase()}">
                <div class="card erp-card shadow-sm h-100 border-0" style="border-left: 4px solid var(--bs-${isCorel ? 'success' : (isAi ? 'warning' : 'primary')}) !important;">
                    <div class="card-body p-4 flex-grow-1 d-flex flex-column align-items-center text-center position-relative">
                        
                        <span class="badge ${corBadge} border position-absolute top-0 start-0 m-2" style="font-size: 0.65rem;">
                            ${labelTipo}
                        </span>

                        <div class="rounded-circle ${bgTemaIco} d-flex align-items-center justify-content-center mb-3 mt-3 shadow-sm transition-hover-icon" style="width: 60px; height: 60px;">
                            <i class="fa-solid ${icone} fs-4 ${corTemaTexto}"></i>
                        </div>
                        
                        <h6 class="fw-bold text-dark mb-1 text-truncate w-100" title="${nomeCorreto}">
                            ${nomeExibicao}
                        </h6>
                        <p class="text-muted small text-truncate w-100 mb-0" style="font-size: 0.75rem;" title="Arquivo: ${nomeCorreto}">Arquivo: ${nomeCorreto}</p>
                    </div>
                    
                    <div class="card-footer bg-light border-top-0 p-3 d-flex gap-2">
                        <a href="${gab.url}" download="${nomeCorreto}" class="btn btn-sm btn-primary flex-grow-1 fw-bold shadow-sm">
                            <i class="fa-solid fa-download me-1"></i> Baixar
                        </a>
                        
                        <form action="/admin/gabaritos/delete/${gab.id}" method="POST" class="m-0" onsubmit="return confirm('Tem certeza que deseja excluir este gabarito permanentemente?')">
                            <button type="submit" class="btn btn-sm btn-outline-danger shadow-sm h-100" title="Excluir Gabarito">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    };

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Gabaritos | ERP Ecoflow</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { display: flex; height: 100vh; margin: 0; background-color: #f4f7f6; font-family: 'Segoe UI', sans-serif; }
            
            /* Layout Padrão Ecoflow */
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

            .btn-brand { background-color: #0D5749; color: white; }
            .btn-brand:hover { background-color: #0a4338; color: white; }
            .text-brand { color: #0D5749; }

            /* Estilos Específicos dos Cards de Gabarito */
            .erp-card { border-radius: 12px; transition: transform 0.2s; overflow: hidden; }
            .erp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.05) !important; }
            .transition-hover-icon { transition: transform 0.3s; }
            .erp-card:hover .transition-hover-icon { transform: scale(1.15); }

            /* Ajuste visual do Input de Arquivo */
            input[type=file]::file-selector-button {
                background: #0D5749;
                color: white;
                border: none;
                padding: 0.375rem 0.75rem;
                border-radius: 0.25rem;
                margin-right: 10px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            input[type=file]::file-selector-button:hover { background: #0a4338; }

            @media (max-width: 767.98px) {
                body { flex-direction: column; } .sidebar { display: none; } .content { padding: 16px; }
            }
        </style>
    </head>
    <body>

        ${renderLoaderParticulas("Carregando Gabaritos")}

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
                        <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-folder-open text-muted me-2"></i>Gabaritos de Caixas</h4>
                        <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Gerencie os arquivos base (.cdr e .ai) para cria&ccedil;&atilde;o das artes.</span>
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

            <div class="bg-white p-4 rounded-3 shadow-sm border border-light mb-4">
                <h6 class="text-dark fw-bold mb-3 border-bottom pb-2"><i class="fa-solid fa-cloud-arrow-up text-brand me-2"></i> Adicionar Novo Gabarito</h6>
                
                <form action="/admin/gabaritos/upload" method="POST" enctype="multipart/form-data" class="d-flex flex-column flex-md-row gap-3 align-items-md-center">
                    <div class="flex-grow-1">
                        <input type="file" name="arquivo_gabarito" accept=".cdr, .ai" class="form-control form-control-sm bg-light" required>
                    </div>
                    
                    <button type="submit" class="btn btn-sm btn-brand fw-bold shadow-sm px-4 py-2 text-nowrap">
                        <i class="fa-solid fa-upload me-1"></i> Salvar Gabarito
                    </button>
                </form>
                <div class="text-muted mt-2" style="font-size: 0.75rem;"><i class="fa-solid fa-circle-info me-1"></i> Formatos aceitos: <strong>.cdr</strong> (CorelDraw) e <strong>.ai</strong> (Adobe Illustrator).</div>
            </div>

            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3 border-bottom pb-3">
                <h6 class="fw-bold text-dark mb-0"><i class="fa-solid fa-layer-group text-muted me-2"></i> Arquivos Dispon&iacute;veis</h6>
                
                ${gabaritos.length > 0 ? `
                <div class="input-group input-group-sm w-100" style="max-width: 300px;">
                    <span class="input-group-text bg-white"><i class="fa-solid fa-search text-muted"></i></span>
                    <input type="text" id="buscaGabarito" onkeyup="filtrarGabaritos()" class="form-control" placeholder="Buscar por nome...">
                </div>
                ` : ''}
            </div>
                
            <div class="row" id="gridGabaritos">
                ${renderGabaritosCards()}
            </div>

            <div id="emptySearch" class="col-12 text-center py-5 bg-white rounded-3 shadow-sm border border-light mt-3" style="display: none;">
                <i class="fa-solid fa-search fa-3x text-muted opacity-25 mb-3"></i>
                <h6 class="fw-bold text-dark">Nenhum gabarito encontrado</h6>
                <p class="text-muted small mb-0">Tente buscar com outras palavras-chave.</p>
            </div>

        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        <script>
            // Função para filtrar os cards pelo nome digitado preservando o layout do Bootstrap
            function filtrarGabaritos() {
                const input = document.getElementById('buscaGabarito').value.toLowerCase();
                const cards = document.querySelectorAll('.gabarito-card');
                const emptyState = document.getElementById('emptySearch');
                let visiveis = 0;

                cards.forEach(card => {
                    // Busca também no atributo modificado com caracteres corretos
                    const nomeArquivo = card.getAttribute('data-nome');
                    
                    if (nomeArquivo.includes(input)) {
                        card.style.display = ''; // Restaura a visibilidade original
                        visiveis++;
                    } else {
                        card.style.display = 'none'; // Esconde a coluna
                    }
                });

                if (emptyState) {
                    emptyState.style.display = visiveis === 0 ? 'block' : 'none';
                }
            }
        </script>
    </body>
    </html>
    `;
};