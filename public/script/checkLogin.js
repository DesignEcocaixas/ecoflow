/*

async function carregarNotificacoes() {
  try {
    const res = await fetch("/notificacoes");
    const notificacoes = await res.json();

    const container = document.getElementById("notificacoesContainer");
    if (!notificacoes.length) {
      container.innerHTML = "<p class='text-muted'>Nenhuma notificação encontrada.</p>";
      return;
    }

    container.innerHTML = notificacoes.map(n => `
  <div class="card mb-2 shadow-sm position-relative" id="notificacao-${n.id}">
    <button class="btn-close position-absolute top-0 end-0 m-2" aria-label="Fechar" onclick="removerNotificacao(${n.id})"></button>
    <div class="card-body p-2">
      <small class="text-muted">${new Date(n.criado_em).toLocaleString("pt-BR")}</small>
      <p class="mb-0">${n.mensagem}</p>
    </div>
  </div>
`).join("");

  } catch (err) {
    console.error("Erro ao carregar notificações:", err);
  }
}

// Carrega ao abrir a página
carregarNotificacoes();

// Atualiza a cada 30 segundos
setInterval(carregarNotificacoes, 30000);

async function removerNotificacao(id) {
  try {
    const res = await fetch("/notificacoes/excluir/" + id, { method: "POST" });
    if (res.ok) {
      document.getElementById("notificacao-" + id).remove();
    } else {
      alert("Erro ao excluir notificação");
    }
  } catch (err) {
    console.error("Erro ao excluir notificação:", err);
  }
}

*/

// Remove o preloader após todo o conteúdo carregar
window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    setTimeout(() => preloader.remove(), 300); // efeito suave
  }
});

// public/script/checkLogin.js

// Cria e exibe o modal vermelho padrão Ecoflow dinamicamente
function mostrarModalSessao() {
    // Verifica se o modal já foi criado para não duplicar
    if (!document.getElementById('sessaoExpiradaModal')) {
        const modalHtml = `
        <div class="modal fade" id="sessaoExpiradaModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" style="z-index: 10000;">
          <div class="modal-dialog modal-sm modal-dialog-centered">
            <div class="modal-content erp-modal border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">
              <div class="modal-body text-center p-4">
                <i class="fa-solid fa-clock-rotate-left fa-3x text-danger mb-3"></i>
                <h6 class="mb-2 fw-bold text-dark">Sessão Expirada!</h6>
                <p class="text-muted mb-0" style="font-size:0.85rem;">Sua conexão foi encerrada por inatividade. Faça login novamente para não perder seu trabalho.</p>
              </div>
              <div class="modal-footer justify-content-center bg-light border-0 p-3" style="border-top: 1px solid #f0f0f0;">
                <button type="button" class="btn btn-danger w-100 fw-bold shadow-sm" onclick="window.location.href='/login?erro=nao_logado'" style="border-radius: 6px;">
                  <i class="fa-solid fa-right-to-bracket me-1"></i> Entrar Novamente
                </button>
              </div>
            </div>
          </div>
        </div>
        `;
        // Injeta o HTML no fim da página
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Exibe o modal usando a API do Bootstrap
    const modalEl = document.getElementById('sessaoExpiradaModal');
    
    // Fallback de segurança: se a biblioteca do Bootstrap falhar por algum motivo, redireciona direto
    if (typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    } else {
        window.location.href = '/login?erro=nao_logado';
    }
}

function verificarSessao() {
    fetch('/ping-sessao', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(response => {
        if (response.status === 401) {
            mostrarModalSessao();
        }
    })
    .catch(err => console.error("Erro ao verificar sessão:", err));
}

// 1. Mantém a sessão viva a cada 15 minutos se a aba estiver aberta e em uso
setInterval(verificarSessao, 15 * 60 * 1000);

// 2. Verifica IMEDIATAMENTE a sessão assim que o usuário volta para a aba do sistema
window.addEventListener('focus', verificarSessao);