console.log("motoristaTracker carregou", new Date().toISOString());

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

  console.log("motoristaTracker carregou", new Date().toISOString(), { nome });

  // garante que reenvia online quando reconectar
  socket.on("connect", () => {
    socket.emit("motorista:online", { nome });
  });

  socket.emit("motorista:online", { nome });

  let watchId = null;
  let usandoFallback = false;

  function stopWatch() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  function emitPosicao(pos, origem = "watch") {
    const { latitude, longitude, accuracy } = pos.coords || {};
    if (typeof latitude !== "number" || typeof longitude !== "number") return;

    // Ignora leituras muito ruins (ajuste se quiser)
    if (accuracy && accuracy > 80) return;

    socket.emit("motorista:posicao", {
      nome,
      lat: latitude,
      lng: longitude,
      accuracy,
      origem
    });
  }

  function logErro(tag, err) {
    console.warn(tag, err);
  }

  function watchHigh() {
    stopWatch();
    usandoFallback = false;

    watchId = navigator.geolocation.watchPosition(
      (pos) => emitPosicao(pos, "watch_high"),
      (err) => {
        logErro("[Geo watch high]", err);

        // code 3 = timeout (muito comum no início)
        if (err && err.code === 3 && !usandoFallback) {
          console.warn("Timeout (alta precisão). Vou tentar fallback...");
          watchFallback();
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 60000
      }
    );
  }

  function watchFallback() {
    stopWatch();
    usandoFallback = true;

    watchId = navigator.geolocation.watchPosition(
      (pos) => emitPosicao(pos, "watch_fallback"),
      (err) => logErro("[Geo watch fallback]", err),
      {
        enableHighAccuracy: false,
        maximumAge: 10000,
        timeout: 60000
      }
    );
  }

  // Primeira leitura (ajuda a “fixar” antes do watch)
  navigator.geolocation.getCurrentPosition(
    (pos) => emitPosicao(pos, "getCurrentPosition"),
    (err) => logErro("[Geo getCurrentPosition]", err),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 60000 }
  );

  // Inicia watch principal
  watchHigh();

  // opcional: se a aba voltar a ficar visível, reinicia o watch (melhora no mobile)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      // reinicia para pegar posição “fresca”
      watchHigh();
    }
  });
})();