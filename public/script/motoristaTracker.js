// public/script/motoristaTracker.js
(() => {
  if (!window.io) return;

  const socket = io();

  // Nome do usuário logado (vem da view)
  const nome = window.NOME_USUARIO || "Motorista";

  socket.emit("motorista:online", { nome });

  navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;

      // 🚫 Ignora leituras ruins (localização aproximada / IP / cache)
      if (accuracy && accuracy > 80) return;

      socket.emit("motorista:posicao", {
        lat: latitude,
        lng: longitude,
        accuracy
      });
    },
    (err) => {
      console.warn("Geo error:", err);
    },
    {
      enableHighAccuracy: true, // força GPS real quando disponível
      maximumAge: 0,           // NÃO usa posição antiga
      timeout: 15000
    }
  );
})();