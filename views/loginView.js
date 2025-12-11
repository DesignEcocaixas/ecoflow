function loginView(msg = "") {
  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

      <style>
        body, html {
          height: 100%;
          margin: 0;
          overflow: hidden;
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

        /* ======== ONDAS EM CAMADAS ======== */
        .waves {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 240px;
          overflow: hidden;
          pointer-events: none;
          z-index: 5;
        }

        /* Cada "linha" de ondas é um tapete 200% mais largo que a tela,
           com duas ondas iguais lado a lado */
        .wave-row {
          position: absolute;
          bottom: 0;
          width: 200%;
          height: 100%;
          display: flex;
        }

        .wave {
          width: 50%;
          height: 100%;
          flex: 0 0 50%;
        }

        /* Camadas com tempos diferentes (passagem longa) */
        .wave-row1 {
          animation: waveMove1 40s linear infinite;
          z-index: 1;
        }

        .wave-row2 {
          animation: waveMove2 30s linear infinite;
          z-index: 2;
        }

        .wave-row3 {
          animation: waveMove3 22s linear infinite;
          z-index: 3;
        }

        /* Loop perfeito: 0% e 100% mostram a mesma coisa,
           pois o tapete andou exatamente metade da largura (50%) */
        @keyframes waveMove1 {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @keyframes waveMove2 {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @keyframes waveMove3 {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* CARD */
        .login-card {
          z-index: 10;
          position: relative;
          backdrop-filter: blur(4px);
        }
      </style>
  </head>

  <body class="d-flex align-items-center justify-content-center vh-100">

      <!-- VÍDEO DE FUNDO -->
      <video id="bg-video" autoplay muted loop>
        <source src="/img/bg.mp4" type="video/mp4">
      </video>

      <!-- ONDAS EM CAMADAS (tons de verde baseados no #019934) -->
      <div class="waves">
        <!-- Fundo -->
        <div class="wave-row wave-row1">
          <svg class="wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#01993433"
              d="M0,256 C180,220 260,300 440,280 C620,260 720,160 900,170 C1080,180 1260,260 1440,230 L1440,320 L0,320 Z" />
          </svg>
          <svg class="wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#01993433"
              d="M0,256 C180,220 260,300 440,280 C620,260 720,160 900,170 C1080,180 1260,260 1440,230 L1440,320 L0,320 Z" />
          </svg>
        </div>

        <!-- Meio -->
        <div class="wave-row wave-row2">
          <svg class="wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#01993455"
              d="M0,288 C200,260 260,320 420,300 C580,280 700,200 880,210 C1060,220 1280,300 1440,270 L1440,320 L0,320 Z" />
          </svg>
          <svg class="wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#01993455"
              d="M0,288 C200,260 260,320 420,300 C580,280 700,200 880,210 C1060,220 1280,300 1440,270 L1440,320 L0,320 Z" />
          </svg>
        </div>

        <!-- Frente -->
        <div class="wave-row wave-row3">
          <svg class="wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#01993488"
              d="M0,300 C160,270 240,320 380,310 C520,300 680,250 860,260 C1040,270 1210,320 1440,290 L1440,320 L0,320 Z" />
          </svg>
          <svg class="wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#01993488"
              d="M0,300 C160,270 240,320 380,310 C520,300 680,250 860,260 C1040,270 1210,320 1440,290 L1440,320 L0,320 Z" />
          </svg>
        </div>
      </div>

      <div class="card shadow p-4 login-card" style="width: 350px;">
        <div class="text-center">
          <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid" style="max-width:150px;">
        </div>

        ${msg ? `<div class="alert alert-danger">${msg}</div>` : ""}

        <form method="POST" action="/login">
              <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" name="email" class="form-control" required>
              </div>
              <div class="mb-3">
                  <label class="form-label">Senha</label>
                  <input type="password" name="senha" class="form-control" required>
              </div>
              <button type="submit" class="btn btn-primary w-100">Entrar</button>

              <div class="form-check mt-4">
                <input class="form-check-input" type="checkbox" id="lembrar" name="lembrar">
                <label class="form-check-label" for="lembrar">
                    Manter conectado
                </label>
              </div>
        </form>
      </div>

  </body>
  </html>
  `;
}

module.exports = loginView;