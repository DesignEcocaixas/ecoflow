// public/script/adminMapaMotoristas.js
(() => {
    if (!window.io) return console.warn("Socket.io não encontrado (window.io).");
    if (!window.L) return console.warn("Leaflet não encontrado (window.L).");

    let map = null;
    const markers = new Map();
    let ultimaLista = [];
    const socket = io();

    socket.emit("admin:join");

    function initMap() {
        if (map) return;

        const el = document.getElementById("mapaMotoristas");
        if (!el) return console.warn("#mapaMotoristas não encontrado.");

        // GARANTE QUE O CONTAINER NÃO TEM INSTÂNCIA ANTIGA
        if (el._leaflet_id) {
            try { el._leaflet_id = null; } catch { }
            el.innerHTML = "";
        }

        map = L.map("mapaMotoristas").setView([-12.9714, -38.5014], 11);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19
        }).addTo(map);
    }

    function render(lista) {
        if (!map) return;

        const keysAtuais = new Set(lista.map(x => x.id || x.nome));

        for (const [key, mk] of markers.entries()) {
            if (!keysAtuais.has(key)) {
                map.removeLayer(mk);
                markers.delete(key);
            }
        }

        lista.forEach((m) => {
            const key = m.id || m.nome;
            const pos = [m.lat, m.lng];

            const label = `
        <b>${m.nome || "Motorista"}</b><br>
        <small>${m.updatedAt ? new Date(m.updatedAt).toLocaleString("pt-BR") : ""}</small>
        ${m.accuracy ? `<br><small>Precisão: ${Math.round(m.accuracy)}m</small>` : ""}
      `;

            if (markers.has(key)) {
                markers.get(key).setLatLng(pos).setPopupContent(label);
            } else {
                const mk = L.marker(pos).addTo(map).bindPopup(label);
                markers.set(key, mk);
            }
        });
    }

    const modal = document.getElementById("mapaMotoristasModal");

    modal?.addEventListener("shown.bs.modal", () => {
        initMap();
        setTimeout(() => {
            map?.invalidateSize();
            render(ultimaLista);
        }, 200);
    });

    // ✅ AQUI: DESTROI O MAPA AO FECHAR (resolve o erro)
    modal?.addEventListener("hidden.bs.modal", () => {
        if (map) {
            map.remove();
            map = null;
        }
        markers.clear();
    });

    socket.on("motoristas:update", (lista) => {
        ultimaLista = Array.isArray(lista) ? lista : [];
        render(ultimaLista);
    });
})();