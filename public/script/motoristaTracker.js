console.log("motoristaTracker carregou", new Date().toISOString());

// public/script/motoristaTracker.js
(() => {
  if (!window.io) return;

  const socket = io();
  const nome = window.NOME_USUARIO || "Motorista";

  socket.emit("motorista:online", { nome });

  function emitir(pos) {
    const { latitude, longitude, accuracy } = pos.coords;

    // Se vier muito ruim, você pode ignorar (ou aumentar o limite)
    if (accuracy && accuracy > 150) return;

    // guarda a última posição boa (pra fallback)
    try {
      localStorage.setItem("ultima_posicao", JSON.stringify({
        lat: latitude,
        lng: longitude,
        accuracy,
        ts: Date.now()
      }));
    } catch { }

    socket.emit("motorista:posicao", { lat: latitude, lng: longitude, accuracy });
  }

  function logErro(err, etapa) {
    console.warn(`[Geo ${etapa}]`, { code: err.code, message: err.message });

    if (err.code === 3) {
      console.warn("Timeout (demorou demais pra obter localização). Vou tentar fallback...");
    }
  }

  // 1) “Aquecida” do GPS (muito importante)
  navigator.geolocation.getCurrentPosition(
    (pos) => enviar(pos),
    (err) => console.warn("[Geo getCurrentPosition]", err),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 60000 }
  );

  navigator.geolocation.watchPosition(
    (pos) => enviar(pos),
    (err) => {
      console.warn("[Geo watch high]", err);
      if (err.code === 3) {
        console.warn("Timeout. Tentando fallback...");
        navigator.geolocation.watchPosition(
          (pos) => enviar(pos),
          (err2) => console.warn("[Geo watch fallback]", err2),
          { enableHighAccuracy: false, maximumAge: 10000, timeout: 60000 }
        );
      }
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 60000 }
  );
  // opcional: expõe pra debug
  window.__watchHigh = watchHigh;
})();