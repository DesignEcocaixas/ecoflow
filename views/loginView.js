// views/loginView.js

function loginView(msg = "") {
  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Entrar | Ecoflow</title>
      <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

      <style>
        body, html {
          height: 100%;
          margin: 0;
          overflow: hidden;
          font-family: 'Segoe UI', Roboto, system-ui, -apple-system, sans-serif;
          background-color: #1f1f1f;
          color: #ffffff;
        }

        /* TEMA ESCURO CUSTOMIZADO */
        .bg-custom-dark { background-color: #2a2a2a !important; }
        .bg-custom-darker { background-color: #1f1f1f !important; }
        .border-custom { border-color: rgba(255,255,255,0.08) !important; border-style: solid; border-width: 1px; }
        .text-accent { color: #08c068 !important; }
        .hover-verde:hover { color: #08c068 !important; transform: scale(1.1); }
        .transition-btn { transition: all 0.25s ease; }

        /* VÍDEO DE FUNDO NO SLIDER */
        #bg-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }

        /* OVERLAY DO SLIDER */
        .slider-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(31,31,31,0.95) 0%, rgba(8,192,104,0.25) 100%);
          z-index: 1;
        }

        /* CAROUSEL */
        .carousel-container {
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center;
        }
        .carousel-item {
          transition: transform 1s ease-in-out, opacity 1s ease-out;
        }
        .carousel-indicators [data-bs-target] {
          background-color: #08c068;
          width: 30px;
          height: 4px;
          border-radius: 4px;
        }
        .slider-icon {
          font-size: 3.5rem;
          color: #08c068;
          margin-bottom: 1.5rem;
          filter: drop-shadow(0 0 15px rgba(8, 192, 104, 0.4));
        }

        /* CONTAINER DE LOGIN */
        .login-section {
          background-color: #1f1f1f;
          z-index: 10;
          box-shadow: -10px 0 30px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: 1px solid rgba(255,255,255,0.05);
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 2rem;
        }

        /* INPUTS MODERNOS (DARK MODE) */
        .input-group-text {
          background-color: #2a2a2a;
          border: 1px solid rgba(255,255,255,0.08);
          border-right: none;
          color: rgba(255,255,255,0.5);
        }
        .form-control {
          background-color: #2a2a2a;
          border: 1px solid rgba(255,255,255,0.08);
          border-left: none;
          color: #ffffff;
        }
        .form-control:focus {
          background-color: #2a2a2a;
          box-shadow: none;
          border-color: #08c068;
          color: #ffffff;
        }
        .form-control::placeholder {
          color: rgba(255,255,255,0.3);
        }
        .input-group:focus-within {
          box-shadow: 0 0 0 0.2rem rgba(8, 192, 104, 0.15);
          border-radius: 0.375rem;
        }
        .input-group:focus-within .input-group-text, 
        .input-group:focus-within .form-control {
          border-color: #08c068;
          color: #08c068;
        }

        /* BOTÃO PRIMÁRIO (ACCENT) */
        .btn-erp {
          background-color: #08c068;
          border-color: #08c068;
          color: #1f1f1f;
          font-weight: 700;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        .btn-erp:hover, .btn-erp:focus {
          background-color: #06a055;
          border-color: #06a055;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(8, 192, 104, 0.3);
        }
        .btn-erp:disabled {
          background-color: #08c068;
          color: #1f1f1f;
          opacity: 0.7;
        }

        /* CHECKBOX CUSTOMIZADO */
        .form-check-input {
          background-color: #2a2a2a;
          border-color: rgba(255,255,255,0.2);
        }
        .form-check-input:checked {
          background-color: #08c068;
          border-color: #08c068;
        }

        /* ANIMAÇÕES DO TOAST */
        .toast {
            transform: translateX(120%);
            transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important;
            border-radius: 12px;
            background-color: #2a2a2a !important;
            color: #fff !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
        }
        .toast.showing, .toast.show {
            transform: translateX(0);
        }
        .toast-timer {
            height: 4px;
            width: 100%;
            position: absolute;
            bottom: 0;
            left: 0;
            transform-origin: left;
        }
        @keyframes shrinkToast {
            from { width: 100%; }
            to { width: 0%; }
        }
      </style>
  </head>

  <body>

    <div class="d-flex w-100 h-100">
      
      <div class="d-none d-lg-block col-lg-7 col-xl-8 position-relative overflow-hidden">
        
        <video id="bg-video" autoplay muted loop playsinline>
          <source src="/img/bg.mp4" type="video/mp4">
        </video>
        <div class="slider-overlay"></div>

        <div id="loginSlider" class="carousel slide carousel-fade h-100 carousel-container w-100" data-bs-ride="carousel" data-bs-interval="5000">
          
          <div class="carousel-indicators mb-5">
            <button type="button" data-bs-target="#loginSlider" data-bs-slide-to="0" class="active" aria-current="true"></button>
            <button type="button" data-bs-target="#loginSlider" data-bs-slide-to="1"></button>
            <button type="button" data-bs-target="#loginSlider" data-bs-slide-to="2"></button>
            <button type="button" data-bs-target="#loginSlider" data-bs-slide-to="3"></button>
            <button type="button" data-bs-target="#loginSlider" data-bs-slide-to="4"></button>
            <button type="button" data-bs-target="#loginSlider" data-bs-slide-to="5"></button>
          </div>

          <div class="carousel-inner w-100 px-5 text-center">
            
            <div class="carousel-item active">
              <i class="fa-solid fa-map-location-dot slider-icon"></i>
              <h2 class="fw-bold text-white mb-3" style="letter-spacing: 1px;">Gestão de Entregas</h2>
              <p class="text-white opacity-75 fs-5 mx-auto" style="max-width: 600px; line-height: 1.6;">
                Otimize rotas, controle clientes e acompanhe todas as entregas do dia com a geração de mapas automáticos.
              </p>
            </div>

            <div class="carousel-item">
              <i class="fa-solid fa-money-bill-transfer slider-icon"></i>
              <h2 class="fw-bold text-white mb-3" style="letter-spacing: 1px;">Controle Financeiro</h2>
              <p class="text-white opacity-75 fs-5 mx-auto" style="max-width: 600px; line-height: 1.6;">
                Registe entradas e saídas e emita comprovativos num ambiente seguro. Controle diário e relatórios detalhados.
              </p>
            </div>

            <div class="carousel-item">
              <i class="fa-solid fa-layer-group slider-icon"></i>
              <h2 class="fw-bold text-white mb-3" style="letter-spacing: 1px;">Produção & Estoque</h2>
              <p class="text-white opacity-75 fs-5 mx-auto" style="max-width: 600px; line-height: 1.6;">
                Acompanhe ordens de produção em tempo real, gira o stock de chapas e o fluxo de flexografia e rotativa.
              </p>
            </div>

            <div class="carousel-item">
              <i class="fa-solid fa-clipboard-check slider-icon"></i>
              <h2 class="fw-bold text-white mb-3" style="letter-spacing: 1px;">Inspeção de Frota</h2>
              <p class="text-white opacity-75 fs-5 mx-auto" style="max-width: 600px; line-height: 1.6;">
                Checklists digitais para todos os veículos. Controle manutenção, quilometragem e o estado da frota.
              </p>
            </div>
            
            <div class="carousel-item">
              <i class="fa-solid fa-route slider-icon"></i>
              <h2 class="fw-bold text-white mb-3" style="letter-spacing: 1px;">Cadernos de Entrega</h2>
              <p class="text-white opacity-75 fs-5 mx-auto" style="max-width: 600px; line-height: 1.6;">
                Sincronize coordenadas GPS precisas e trace as rotas mais rápidas. Gere relatórios e exporte dados para PDF ou Excel facilmente.
              </p>
            </div>

            <div class="carousel-item">
              <i class="fa-solid fa-users-gear slider-icon"></i>
              <h2 class="fw-bold text-white mb-3" style="letter-spacing: 1px;">Diaristas & Pagamentos</h2>
              <p class="text-white opacity-75 fs-5 mx-auto" style="max-width: 600px; line-height: 1.6;">
                Controle integral dos turnos, pagamentos em lote e geração rápida de comprovativos e mensagens padronizadas de WhatsApp.
              </p>
            </div>

          </div>
        </div>
      </div>

      <div class="col-12 col-lg-5 col-xl-4 login-section position-relative flex-column justify-content-between">
        
        <div class="w-100 mt-auto">
          <div class="login-card mx-auto">
            
            <div class="text-center mb-5">
              <img src="/img/logo-branca.png" alt="Logo Ecoflow" class="img-fluid" style="max-width: 170px;">
            </div>

            <h5 class="fw-bold text-white mb-1">Acesso ao Sistema</h5>
            <p class="text-white-50 mb-4" style="font-size: 0.85rem;">Por favor, insira as suas credenciais para continuar.</p>

            ${msg ? `
              <div class="alert bg-danger bg-opacity-10 border border-danger border-opacity-50 text-white d-flex align-items-center p-3 mb-4 shadow-sm" style="font-size:0.85rem; border-radius:8px;">
                <i class="fa-solid fa-circle-exclamation text-danger me-2"></i>
                <div>${msg}</div>
              </div>
            ` : ""}

            <form id="formLogin" method="POST" action="/login" onsubmit="prepararLogin(event, this)">
              
              <div class="mb-3">
                  <label class="form-label text-white-50 fw-bold" style="font-size: 0.75rem; letter-spacing: 0.5px; text-transform: uppercase;">E-mail</label>
                  <div class="input-group input-group-lg shadow-sm">
                    <span class="input-group-text"><i class="fa-regular fa-envelope"></i></span>
                    <input type="email" name="email" class="form-control fs-6" placeholder="email@ecoflow.com" required>
                  </div>
              </div>
              
              <div class="mb-4">
                  <label class="form-label text-white-50 fw-bold" style="font-size: 0.75rem; letter-spacing: 0.5px; text-transform: uppercase;">Senha</label>
                  <div class="input-group input-group-lg shadow-sm">
                    <span class="input-group-text"><i class="fa-solid fa-lock"></i></span>
                    <input type="password" name="senha" class="form-control fs-6" placeholder="••••••••" required>
                  </div>
              </div>
              
              <div class="d-flex justify-content-between align-items-center mb-4">
                  <div class="form-check d-flex align-items-center">
                      <input class="form-check-input me-2 shadow-none mt-0" type="checkbox" id="lembrar" name="lembrar" style="cursor: pointer;">
                      <label class="form-check-label text-white-50" for="lembrar" style="font-size: 0.8rem; cursor: pointer; user-select: none;">
                          Lembrar de mim
                      </label>
                  </div>
              </div>

              <button type="submit" class="btn btn-erp w-100 shadow">
                Acessar<i class="fa-solid fa-arrow-right-to-bracket ms-1"></i>
              </button>

            </form>
          </div>
        </div>

        <div class="w-100 pb-4 pt-4 mt-auto">
          <div class="text-center w-100" style="font-size: 0.75rem; color: rgba(255,255,255,0.4);">
            <div class="d-flex flex-column align-items-center justify-content-center gap-2 mb-1">
              <span class="sidebar-text" style="letter-spacing: 0.5px;">Desenvolvido por <strong class="text-accent">71DEV</strong></span>
              <div class="d-flex align-items-center justify-content-center gap-3 mt-1">
                <a href="https://www.instagram.com/71dev_/" target="_blank" class="text-white-50 hover-verde transition-btn d-flex align-items-center justify-content-center" title="Instagram" style="text-decoration: none; background: transparent; padding: 2px; line-height: 1;">
                  <i class="fa-brands fa-instagram" style="font-size: 1.1rem;"></i>
                </a>
                <a href="https://wa.me/557183174920" target="_blank" class="text-white-50 hover-verde transition-btn d-flex align-items-center justify-content-center" title="WhatsApp" style="text-decoration: none; background: transparent; padding: 2px; line-height: 1;">
                  <i class="fa-brands fa-whatsapp" style="font-size: 1.1rem;"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        
        <div id="sucessoToast" class="toast shadow-lg border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-check fs-5 me-2 text-accent"></i>
                    <strong class="fs-6" id="sucessoTitulo">Acesso Permitido!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white-50 mb-0" style="font-size:0.85rem;" id="sucessoSub">Bem-vindo(a) ao sistema.</p>
            </div>
            <div class="toast-timer bg-accent" id="sucessoTimer" style="display: none; background-color: #08c068;"></div>
        </div>

        <div id="erroToast" class="toast shadow-lg border-0" style="border-color: rgba(220,53,69,0.3) !important;" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-xmark fs-5 me-2 text-danger"></i>
                    <strong class="fs-6" id="erroTitulo">Erro!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white-50 mb-0" style="font-size:0.85rem;" id="erroSub">Ocorreu um erro.</p>
            </div>
            <div class="toast-timer bg-danger" id="erroTimer" style="display: none;"></div>
        </div>

    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        // Função Genérica de Toasts adaptada
        function mostrarToastLogin(tipo, titulo, mensagem) {
            const isSuccess = tipo === 'sucesso';
            const toastId = isSuccess ? 'sucessoToast' : 'erroToast';
            const tituloId = isSuccess ? 'sucessoTitulo' : 'erroTitulo';
            const subId = isSuccess ? 'sucessoSub' : 'erroSub';
            const timerId = isSuccess ? 'sucessoTimer' : 'erroTimer';

            const toastEl = document.getElementById(toastId);
            if (toastEl) {
                document.getElementById(tituloId).innerText = titulo;
                document.getElementById(subId).innerText = mensagem;
                
                const timerEl = document.getElementById(timerId);
                if (timerEl) {
                    timerEl.style.display = 'block';
                    timerEl.style.animation = 'none';
                    timerEl.offsetHeight; // Força reflow
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

        // Submissão do Login em Segundo Plano (AJAX)
        async function prepararLogin(event, form) {
            event.preventDefault();
            
            const btn = form.querySelector('button[type="submit"]');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-2"></i> Validando...';
            btn.disabled = true;

            try {
                const formData = new URLSearchParams();
                new FormData(form).forEach((value, key) => formData.append(key, value));

                const response = await fetch(form.action, {
                    method: form.method || 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });

                // O fetch segue os redirecionamentos configurados no backend
                const responseUrl = new URL(response.url);

                if (responseUrl.pathname.includes('/home')) {
                    // Login com sucesso!
                    mostrarToastLogin('sucesso', 'Acesso Permitido', 'A redirecionar...');
                    
                    // Atraso para mostrar a animação de sucesso bonita antes de recarregar
                    setTimeout(() => {
                        window.location.href = '/home';
                    }, 1200); 
                } else if (responseUrl.searchParams.has('erro')) {
                    // Trata os erros
                    const tipoErro = responseUrl.searchParams.get('erro');
                    if (tipoErro === 'credenciais') {
                        mostrarToastLogin('erro', 'Acesso Negado', 'E-mail ou senha incorretos. Tente novamente.');
                    } else if (tipoErro === 'servidor') {
                        mostrarToastLogin('erro', 'Erro de Conexão', 'Falha ao conectar com o banco de dados.');
                    } else {
                        mostrarToastLogin('erro', 'Acesso Negado', 'Verifique as suas credenciais.');
                    }
                    
                    // Restaura o botão e limpa a password
                    btn.innerHTML = originalContent;
                    btn.disabled = false;
                    form.querySelector('input[name="senha"]').value = '';
                    form.querySelector('input[name="senha"]').focus();
                    
                } else {
                    // Para qualquer outro redirecionamento inesperado, deixa seguir o fluxo normal
                    window.location.href = response.url;
                }

            } catch (err) {
                console.error(err);
                mostrarToastLogin('erro', 'Falha na Rede', 'Verifique a sua internet e tente novamente.');
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        }

        // Verifica os erros na URL assim que a página carrega (Ex: quando vem de redirecionamentos diretos de views protegidas)
        window.addEventListener('load', () => {
            const urlParams = new URLSearchParams(window.location.search);
            
            if (urlParams.has('erro')) {
                const tipoErro = urlParams.get('erro');
                
                if (tipoErro === 'credenciais') {
                    mostrarToastLogin('erro', 'Acesso Negado', 'E-mail ou senha incorretos. Tente novamente.');
                } else if (tipoErro === 'servidor') {
                    mostrarToastLogin('erro', 'Erro', 'Falha ao conectar com o servidor.');
                } else if (tipoErro === 'perfil_invalido') {
                    mostrarToastLogin('erro', 'Acesso Restrito', 'O seu perfil não tem permissões configuradas.');
                } else if (tipoErro === 'nao_logado') {
                    mostrarToastLogin('erro', 'Sessão Expirada', 'Por favor, faça login para continuar.');
                }

                // Limpa a URL para que o erro não volte a aparecer no refresh
                if (window.history.replaceState) {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('erro');
                    window.history.replaceState({}, document.title, url.toString());
                }
            }
        });
    </script>
  </body>
  </html>
  `;
}

module.exports = loginView;