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
    } catch {}

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
    (pos) => {
      console.log("GPS inicial OK");
      emitir(pos);
    },
    (err) => logErro(err, "getCurrentPosition"),
    { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
  );

  // 2) Watch principal (alta precisão)
  const watchHigh = navigator.geolocation.watchPosition(
    (pos) => emitir(pos),
    (err) => {
      logErro(err, "watch high");

      // 3) Se der timeout, tenta fallback (baixa precisão) e usa última posição salva
      if (err.code === 3) {
        try {
          const saved = JSON.parse(localStorage.getItem("ultima_posicao") || "null");
          if (saved) {
            socket.emit("motorista:posicao", {
              lat: saved.lat,
              lng: saved.lng,
              accuracy: saved.accuracy
            });
          }
        } catch {}

        // fallback: baixa precisão costuma “pegar” mais rápido
        navigator.geolocation.getCurrentPosition(
          (pos2) => emitir(pos2),
          (err2) => logErro(err2, "fallback getCurrentPosition"),
          { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
        );
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 30000,   // aumentamos
      maximumAge: 2000  // permite usar leitura recente (não “velha” demais)
    }
  );

  // opcional: expõe pra debug
  window.__watchHigh = watchHigh;
})();