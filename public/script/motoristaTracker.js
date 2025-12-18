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

      // Ignora leituras ruins
      if (accuracy && accuracy > 80) return;

      socket.emit("motorista:posicao", { lat: latitude, lng: longitude, accuracy });
    },
    (err) => {
      console.warn("Geo error:", {
        code: err.code,
        message: err.message
      });

      // Logs amigáveis
      if (err.code === 1) console.warn("Permissão negada (verifique permissões do navegador e do sistema).");
      if (err.code === 2) console.warn("Posição indisponível (GPS/localização desligada ou sem sinal).");
      if (err.code === 3) console.warn("Timeout (demorou demais pra obter localização).");
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
  );
})();