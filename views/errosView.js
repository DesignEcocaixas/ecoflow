// views/errosView.js

function errosView(status = 500, titulo = "Erro no Servidor", mensagem = "Ocorreu um erro inesperado ao processar sua solicitação.", stack = null) {
  let corDestaque = "#08c068";

  if (status === 404) {
    titulo = titulo || "Página Não Encontrada";
    mensagem = mensagem || "O caminho ou registro que você está tentando acessar não existe, foi excluído ou mudou de endereço.";
  } else if (status === 403 || status === 401) {
    titulo = titulo || "Acesso Negado";
    mensagem = mensagem || "Seu nível de permissão não permite acessar esta área ou realizar esta ação no sistema.";
    corDestaque = "#ffc107";
  } else {
    titulo = titulo || "Erro Interno";
    mensagem = mensagem || "Ocorreu uma falha inesperada no servidor ao processar sua solicitação. Verifique os logs do sistema.";
    corDestaque = "#dc3545";
  }

  // =========================================================================
  // MAPEAMENTO DINÂMICO DE ARQUIVOS SVG
  // =========================================================================
  const mapaImagensErro = {
    404: "/img/error-404.svg",
    403: "/img/error-403.svg",
    401: "/img/error-401.svg",
    500: "/img/error-500.svg",
    default: "/img/error.svg"
  };

  const caminhoImagemErro = mapaImagensErro[status] || mapaImagensErro.default;

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${status} - ${titulo} | ERP Ecoflow</title>
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(8, 192, 104, 0.3); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(8, 192, 104, 0.7); }

      body { 
        display: flex; 
        height: 100vh; 
        width: 100vw;
        margin: 0; 
        background-color: #1f1f1f; 
        color: #ffffff; 
        font-family: 'Segoe UI', sans-serif; 
        overflow: hidden; 
      }
      
      .content { 
        flex: 1; 
        padding: 40px; 
        overflow-y: auto; 
        background-color: #1f1f1f; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        width: 100%;
      }
      
      /* ZERO BORDAS E ZERO SOMBREAMENTOS */
      * { box-shadow: none !important; }

      .error-wrapper {
        max-width: 860px;
        width: 100%;
      }

      .error-code {
        font-size: 7.5rem;
        font-weight: 900;
        line-height: 0.9;
        letter-spacing: -3px;
        color: ${corDestaque};
        margin-bottom: 12px;
      }

      /* Botão Voltar Preenchido */
      .btn-voltar {
        background-color: #08c068;
        color: #1f1f1f;
        border: none;
        padding: 12px 28px;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s, transform 0.1s;
      }
      .btn-voltar:hover { background-color: #06a055; color: #ffffff; }
      .btn-voltar:active { transform: scale(0.98); }

      @media (max-width: 767.98px) {
        .content { padding: 24px; }
        .error-code { font-size: 5.5rem; }
      }
    </style>
  </head>
  <body>

    <div class="content">
      <div class="error-wrapper">
        <div class="row align-items-center g-5">
          
          <div class="col-12 col-md-6 text-center text-md-start order-2 order-md-1">
            <div class="error-code">${status}</div>
            <h3 class="fw-bold text-white mb-3" style="font-size: 1.5rem;">${titulo}</h3>
            
            <p class="text-white mb-4" style="font-size: 0.95rem; line-height: 1.6; opacity: 0.85; max-width: 380px;">
              ${mensagem}
            </p>

            ${stack && process.env.NODE_ENV !== 'production' ? `
            <div class="mb-4 p-3 rounded text-start" style="background-color: #1a1a1a; font-family: monospace; font-size: 0.7rem; color: #ff6b6b; max-height: 120px; overflow-y: auto;">
              ${stack.replace(/\n/g, '<br>')}
            </div>
            ` : ''}

            <div class="d-flex justify-content-center justify-content-md-start mt-3">
              <button onclick="window.history.back()" class="btn-voltar d-inline-flex align-items-center">
                <i class="fa-solid fa-arrow-left me-2"></i> Voltar
              </button>
            </div>
          </div>

          <div class="col-12 col-md-6 text-center order-1 order-md-2 d-flex justify-content-center">
            <img src="${caminhoImagemErro}" alt="Erro ${status}" class="img-fluid" style="max-width: 340px;">
          </div>

        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  </body>
  </html>
  `;
}

module.exports = errosView;