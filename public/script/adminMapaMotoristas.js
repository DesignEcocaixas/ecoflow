// public/script/adminMapaMotoristas.js
(() => {
    if (!window.io) {
        console.warn("Socket.io não encontrado (window.io).");
        return;
    }
    if (!window.L) {
        console.warn("Leaflet não encontrado (window.L).");
        return;
    }

    let map;
    const markers = new Map(); // key = id (preferencial) ou nome (fallback)
    let ultimaLista = [];
    const socket = io();

    // entra como admin pra receber updates
    socket.emit("admin:join");

    function initMap() {
        if (map) return;

        const el = document.getElementById("mapaMotoristas");
        if (!el) {
            console.warn("#mapaMotoristas não encontrado.");
            return;
        }

        map = L.map("mapaMotoristas").setView([-12.9714, -38.5014], 11); // Salvador
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19
        }).addTo(map);
    }

    function render(lista) {
        if (!map) return;

        const idsAtuais = new Set(lista.map((x) => x.id || x.nome));

        // remove marcadores que sumiram
        for (const [id, mk] of markers.entries()) {
            if (!idsAtuais.has(id)) {
                map.removeLayer(mk);
                markers.delete(id);
            }
        }

        // atualiza/cria marcadores
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

    // quando abrir o modal, inicializa e renderiza o snapshot
    const modal = document.getElementById("mapaMotoristasModal");
    modal?.addEventListener("shown.bs.modal", () => {
        initMap();
        setTimeout(() => {
            map?.invalidateSize();
            render(ultimaLista);
        }, 200);
    });

    // recebe updates do backend
    socket.on("motoristas:update", (lista) => {
        ultimaLista = Array.isArray(lista) ? lista : [];
        render(ultimaLista);
    });
})();