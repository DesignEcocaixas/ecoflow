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

function verificarSessao() {
    fetch('/ping-sessao', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(response => {
        if (response.status === 401) {
            alert("⚠️ Sua sessão expirou por inatividade.\n\nPor favor, faça login novamente antes de preencher qualquer dado para não perder seu trabalho.");
            window.location.href = "/login";
        }
    })
    .catch(err => console.error("Erro ao verificar sessão:", err));
}

// 1. Mantém a sessão viva a cada 15 minutos se a aba estiver aberta e em uso
setInterval(verificarSessao, 15 * 60 * 1000);

// 2. Verifica IMEDIATAMENTE a sessão assim que o usuário volta para a aba do sistema
window.addEventListener('focus', verificarSessao);