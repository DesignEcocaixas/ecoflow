(() => {
    console.log("[adminMapaMotoristas] carregou");

    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else fn();
    }

    ready(() => {
        if (!window.L) {
            console.warn("[adminMapaMotoristas] Leaflet (L) não encontrado");
            return;
        }
        if (!window.io) {
            console.warn("[adminMapaMotoristas] Socket.io (io) não encontrado");
            return;
        }

        const modalEl = document.getElementById("mapaMotoristasModal");
        const mapaEl = document.getElementById("mapaMotoristas");

        if (!modalEl || !mapaEl) {
            console.warn("[adminMapaMotoristas] modal/mapa não encontrados no DOM");
            return;
        }

        const socket = io();
        socket.emit("admin:join");

        let map = null;
        const markers = new Map(); // key: nome

        function initMap() {
            if (map) return;

            console.log("[adminMapaMotoristas] initMap()");

            map = L.map("mapaMotoristas", { zoomControl: true }).setView(
                [-12.9714, -38.5014],
                12
            );

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19
            }).addTo(map);
        }

        function render(lista) {
            if (!map) return;

            lista = Array.isArray(lista) ? lista : [];

            const nomesAtuais = new Set(lista.map(m => m.nome));

            for (const [nome, mk] of markers.entries()) {
                if (!nomesAtuais.has(nome)) {
                    map.removeLayer(mk);
                    markers.delete(nome);
                }
            }

            lista.forEach(m => {
                if (typeof m.lat !== "number" || typeof m.lng !== "number") return;

                const pos = [m.lat, m.lng];
                const label = `${m.nome || "Motorista"}<br>
          <small>${new Date(m.updatedAt).toLocaleString("pt-BR")}</small>
          ${m.accuracy ? `<br><small>Precisão: ${Math.round(m.accuracy)}m</small>` : ""}`;

                if (markers.has(m.nome)) {
                    markers.get(m.nome).setLatLng(pos).setPopupContent(label);
                } else {
                    const mk = L.marker(pos).addTo(map).bindPopup(label);
                    markers.set(m.nome, mk);
                }
            });
        }

        // 🔥 PONTO CHAVE: só cria/invalida quando o modal realmente abriu
        modalEl.addEventListener("shown.bs.modal", () => {
            console.log("[adminMapaMotoristas] modal shown");

            // garante que o container já “tem tamanho” quando criar o mapa
            setTimeout(() => {
                initMap();
                map.invalidateSize(true);
            }, 250);
        });

        socket.on("motoristas:update", (lista) => {
            // se ainda não abriu o modal, só guarda; quando abrir renderiza
            window.__ultimaListaMotoristas = lista;
            if (map) render(lista);
        });

        // quando abrir, renderiza o snapshot se já tiver
        modalEl.addEventListener("shown.bs.modal", () => {
            if (map && window.__ultimaListaMotoristas) {
                render(window.__ultimaListaMotoristas);
            }
        });
    });
})();
