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

        /* ======== NOVAS ONDAS ======== */
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
.wave-back {
  animation: waveBackMove 12s ease-in-out infinite;
}

/* Camada do meio */
.wave-mid {
  animation: waveMidMove 9s ease-in-out infinite;
}

/* Camada frontal */
.wave-front {
  animation: waveFrontMove 6s ease-in-out infinite;
}

/* Animações apenas VERTICAIS (sem deslocar no X) */
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




        /* CARD */
        .login-card {
          z-index: 10;
          position: relative;
          backdrop-filter: blur(4px);
        }
      </style>
  </head>

  <body class="d-flex align-items-center justify-content-center vh-100">
    <!-- PRELOADER -->
<div id="preloader" style="
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    transition: opacity .3s ease;
">
    <div class="spinner-border text-success" role="status" style="width: 4rem; height: 4rem;">
        <span class="visually-hidden">Carregando...</span>
    </div>
</div>

      <!-- VÍDEO DE FUNDO -->
      <video id="bg-video" autoplay muted loop>
        <source src="/img/bg.mp4" type="video/mp4">
      </video>

      <!-- ONDAS EM CAMADAS (tons de verde baseados no #019934) -->
      <div class="waves">
        <!-- Fundo -->
        <div class="wave-layer wave-back">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#01993433"
              d="M0,240 C180,260 360,230 540,240 C720,250 900,280 1080,270 C1260,260 1350,250 1440,260 L1440,320 L0,320 Z"/>
          </svg>
        </div>

        <!-- Meio -->
        <div class="wave-layer wave-mid">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#01993466"
              d="M0,250 C200,270 380,240 560,250 C740,260 920,280 1100,275 C1280,270 1360,260 1440,265 L1440,320 L0,320 Z"/>
          </svg>
        </div>

        <!-- Frente -->
        <div class="wave-layer wave-front">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#019934AA"
              d="M0,260 C220,280 380,260 580,265 C780,270 980,290 1180,285 C1340,280 1390,270 1440,268 L1440,320 L0,320 Z"/>
          </svg>
        </div>
      </div>


  <!-- Camada frontal -->
  <div class="wave-row wave-row3">
    <svg class="wave" viewBox="0 0 1440 300" preserveAspectRatio="none">
      <path fill="#019934bb"
        d="M0,240 C180,260 380,220 600,240 C820,260 1100,260 1300,240 C1440,230 1440,260 1440,260 L1440,300 L0,300 Z" />
    </svg>
    <svg class="wave" viewBox="0 0 1440 300" preserveAspectRatio="none">
      <path fill="#019934bb"
        d="M0,240 C180,260 380,220 600,240 C820,260 1100,260 1300,240 C1440,230 1440,260 1440,260 L1440,300 L0,300 Z" />
    </svg>
    <svg class="wave" viewBox="0 0 1440 300" preserveAspectRatio="none">
      <path fill="#019934bb"
        d="M0,240 C180,260 380,220 600,240 C820,260 1100,260 1300,240 C1440,230 1440,260 1440,260 L1440,300 L0,300 Z" />
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
      <script src="./script/checkLogin.js"></script>

  </body>
  </html>
  `;
}

module.exports = loginView;