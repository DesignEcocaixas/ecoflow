// public/script/motoristaTracker.js
(() => {
  if (!window.io) return;

  const socket = io();

  // tente achar o nome do usuário logado pela variável global (você vai setar na view)
  const nome = window.NOME_USUARIO || "Motorista";

  socket.emit("motorista:online", { nome });

  function enviarPosicao(pos) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    socket.emit("motorista:posicao", { lat, lng });
  }

  function erro(err) {
    console.warn("GPS erro:", err);
  }

  // atualiza continuamente
  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(enviarPosicao, erro, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000
    });
  } else {
    console.warn("Geolocation não suportado no navegador.");
  }
})();
