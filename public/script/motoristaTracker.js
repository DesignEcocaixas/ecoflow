// public/script/motoristaTracker.js
(() => {
  if (!("geolocation" in navigator)) {
    console.warn("Geolocation não suportado neste navegador.");
    return;
  }
  if (!window.io) {
    console.warn("Socket.io não encontrado (window.io).");
    return;
  }

  const socket = io();
  const nome = window.NOME_USUARIO || "Motorista";

  let watchId = null;
  let iniciado = false;

  socket.emit("motorista:online", { nome });

  function emitPosicao(pos, origem) {
    const { latitude, longitude, accuracy } = pos.coords || {};
    if (typeof latitude !== "number" || typeof longitude !== "number") return;

    socket.emit("motorista:posicao", {
      nome,
      lat: latitude,
      lng: longitude,
      accuracy,
      origem
    });
  }

  function iniciarRastreamento() {
    if (iniciado) return;
    iniciado = true;

    console.log("Iniciando rastreamento GPS...", { nome });

    // 1) pega uma posição inicial (ajuda MUITO)
    navigator.geolocation.getCurrentPosition(
      (pos) => emitPosicao(pos, "getCurrentPosition"),
      (err) => console.warn("[Geo getCurrentPosition]", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );

    // 2) inicia watch
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // se quiser, pode filtrar precisão aqui:
        // if (pos.coords.accuracy && pos.coords.accuracy > 120) return;
        emitPosicao(pos, "watch");
      },
      (err) => console.warn("[Geo watch]", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 60000 }
    );
  }

  function pararRastreamento() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    iniciado = false;
    console.log("Rastreamento parado.");
  }

  // ✅ expõe pro botão chamar
  window.iniciarRastreamento = iniciarRastreamento;
  window.pararRastreamento = pararRastreamento;
})();
