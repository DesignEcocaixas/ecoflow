// views/loginView.js
const renderLoaderParticulas = require("./renderLoaderParticulas");

function loginView(msg = "") {
  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login | ERP Ecoflow</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

      <style>
        body, html {
          height: 100%;
          margin: 0;
          overflow: hidden;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          background-color: #f4f7f6;
        }

        /* VÍDEO DE FUNDO */
        #bg-video {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: -1;
        }

        /* ======== ONDAS SUAVES NO RODAPÉ ======== */
        .waves {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          max-height: 400px;
          min-height: 80px;
          pointer-events: none;
          z-index: 5;
        }

        /* Cada camada de onda */
        .wave-layer {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .wave-layer svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        /* Camada de fundo: movimento bem suave */
        .wave-back { animation: waveBackMove 12s ease-in-out infinite; }
        /* Camada do meio */
        .wave-mid { animation: waveMidMove 9s ease-in-out infinite; }
        /* Camada frontal */
        .wave-front { animation: waveFrontMove 6s ease-in-out infinite; }

        /* Animações VERTICAIS */
        @keyframes waveBackMove {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
        @keyframes waveMidMove {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(14px); }
        }
        @keyframes waveFrontMove {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(18px); }
        }

        /* ======== CARD DE LOGIN (Estilo ERP) ======== */
        .login-card {
          z-index: 10;
          position: relative;
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.4);
          box-shadow: 0 15px 35px rgba(0,0,0,0.15) !important;
          width: 100%;
          max-width: 380px;
          padding: 2.5rem 2rem;
        }

        .login-title {
          font-weight: 700;
          color: #0D5749;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        /* Inputs modernos */
        .input-group-text {
          background-color: transparent;
          border-right: none;
          color: #0D5749;
        }
        .form-control {
          border-left: none;
        }
        .form-control:focus {
          box-shadow: none;
          border-color: #dee2e6;
        }
        .input-group:focus-within {
          box-shadow: 0 0 0 0.25rem rgba(13, 87, 73, 0.15);
          border-radius: 0.375rem;
        }
        .input-group:focus-within .input-group-text, 
        .input-group:focus-within .form-control {
          border-color: #0D5749;
        }

        /* Botão Primário (Verde ERP) */
        .btn-erp {
          background-color: #0D5749;
          border-color: #0D5749;
          color: white;
          font-weight: 600;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        .btn-erp:hover {
          background-color: #083930;
          border-color: #083930;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(13, 87, 73, 0.3);
        }

        /* Checkbox customizado */
        .form-check-input:checked {
          background-color: #0D5749;
          border-color: #0D5749;
        }
      </style>
  </head>

  <body class="d-flex align-items-center justify-content-center vh-100">
    
    ${renderLoaderParticulas("Preparando Sistema...")}

    <video id="bg-video" autoplay muted loop playsinline>
      <source src="/img/bg.mp4" type="video/mp4">
    </video>

    <div class="waves">
      <div class="wave-layer wave-back">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#01993433"
            d="M0,240 C180,260 360,230 540,240 C720,250 900,280 1080,270 C1260,260 1350,250 1440,260 L1440,320 L0,320 Z"/>
        </svg>
      </div>

      <div class="wave-layer wave-mid">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#01993466"
            d="M0,250 C200,270 380,240 560,250 C740,260 920,280 1100,275 C1280,270 1360,260 1440,265 L1440,320 L0,320 Z"/>
        </svg>
      </div>

      <div class="wave-layer wave-front">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#019934AA"
            d="M0,260 C220,280 380,260 580,265 C780,270 980,290 1180,285 C1340,280 1390,270 1440,268 L1440,320 L0,320 Z"/>
        </svg>
      </div>
    </div>

    <div class="login-card mx-3">
      <div class="text-center mb-4">
        <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid" style="max-width:160px;">
      </div>

      <div class="login-title">Acesso ao Sistema</div>

      ${msg ? `
        <div class="alert alert-danger d-flex align-items-center p-2 mb-4" style="font-size:0.85rem; border-radius:8px;">
          <i class="fa-solid fa-circle-exclamation me-2"></i>
          <div>${msg}</div>
        </div>
      ` : ""}

      <form method="POST" action="/login">
        
        <div class="mb-3">
            <label class="form-label text-muted fw-medium" style="font-size: 0.8rem;">E-mail</label>
            <div class="input-group">
              <span class="input-group-text"><i class="fa-regular fa-envelope"></i></span>
              <input type="email" name="email" class="form-control form-control-lg fs-6" placeholder="Digite seu e-mail" required>
            </div>
        </div>
        
        <div class="mb-4">
            <label class="form-label text-muted fw-medium" style="font-size: 0.8rem;">Senha</label>
            <div class="input-group">
              <span class="input-group-text"><i class="fa-solid fa-lock"></i></span>
              <input type="password" name="senha" class="form-control form-control-lg fs-6" placeholder="••••••••" required>
            </div>
        </div>
        
        <button type="submit" class="btn btn-erp w-100 shadow-sm">
          <i class="fa-solid fa-right-to-bracket me-2"></i> Entrar
        </button>

        <div class="form-check mt-4 d-flex justify-content-center align-items-center">
          <input class="form-check-input me-2 shadow-none" type="checkbox" id="lembrar" name="lembrar" style="cursor: pointer;">
          <label class="form-check-label text-muted" for="lembrar" style="font-size: 0.85rem; cursor: pointer; user-select: none;">
              Manter conectado
          </label>
        </div>

      </form>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

  </body>
  </html>
  `;
}

module.exports = loginView;