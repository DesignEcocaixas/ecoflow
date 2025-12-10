// views/loginView.js
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
          body {
            background: url('/img/bg.png') no-repeat center center fixed;
            background-size: cover;
          }
      </style>
  </head>
  <body class="d-flex align-items-center justify-content-center vh-100">
      <div class="card shadow p-4" style="width: 350px;">
        <div class="text-center">
          <img src="/img/logo.png" alt="Logo da Empresa" class="img-fluid" style="max-width:150px;">
        </div>
          ${msg ? `<div class="alert alert-danger">${msg}</div>` : ""}
          <form method="POST" action="/login">
              <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" name="email" class="form-control" required>
              </div>
              <div class="mb-3">
                  <label for="senha" class="form-label">Senha</label>
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
