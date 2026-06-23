// services/mapsService.js
const axios = require("axios");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const ENDERECO_FABRICA = "-12.7036939, -38.2923817";

// 1. Função de extração (Burlar bloqueios e capturar o PINO EXATO)
async function obterLocalizacao(nome, link) {
    if (link && link.includes("http")) {
        try {
            const response = await axios.get(link, {
                maxRedirects: 10,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                validateStatus: () => true
            });
            const finalUrl = response.request.res ? response.request.res.responseUrl : link;
            const htmlData = typeof response.data === 'string' ? response.data : '';

            let matchPin = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
            if (matchPin) return `${matchPin[1]},${matchPin[2]}`;

            matchPin = finalUrl.match(/query=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (matchPin) return `${matchPin[1]},${matchPin[2]}`;

            let metaPin = htmlData.match(/preview\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (metaPin) return `${metaPin[1]},${metaPin[2]}`;

            const metaRefresh = htmlData.match(/URL='([^']+)'/i);
            if (metaRefresh) {
                let refPin = metaRefresh[1].match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                if (refPin) return `${refPin[1]},${refPin[2]}`;

                refPin = metaRefresh[1].match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
                if (refPin) return `${refPin[1]},${refPin[2]}`;
            }

            let matchViewport = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (matchViewport) return `${matchViewport[1]},${matchViewport[2]}`;

            const matchPlace = finalUrl.match(/\/maps\/place\/([^\/]+)/) || finalUrl.match(/\/maps\/search\/([^\/]+)/);
            if (matchPlace) return decodeURIComponent(matchPlace[1].replace(/\+/g, ' '));

        } catch (e) {
            console.error(`[Aviso] Falha ao decodificar link de ${nome}:`, e.message);
        }
    }
    return `${nome}, Camaçari, Bahia, Brasil`;
}

// 2. Converte as coordenadas ou texto para o formato estrito da Nova Routes API
function formatarParaRoutesAPI(local) {
    const coords = local.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
    if (coords) {
        return {
            location: {
                latLng: {
                    latitude: parseFloat(coords[1]),
                    longitude: parseFloat(coords[2])
                }
            }
        };
    }
    return { address: local };
}

function extrairLatLon(texto) {
    const match = String(texto).match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
    if (match) return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    return null;
}

function calcularDistanciaReta(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function otimizarRotaGoogleAPI(entregas) {
    if (!entregas || entregas.length <= 1) return entregas || [];

    try {
        const coordFabrica = extrairLatLon(ENDERECO_FABRICA) || { lat: -12.6974, lon: -38.3241 };
        let indiceMaisDistante = 0;
        let maiorDistancia = -1;

        for (let i = 0; i < entregas.length; i++) {
            if (!entregas[i]) continue;
            const coordEntrega = extrairLatLon(entregas[i].queryLocation);
            if (coordEntrega) {
                const dist = calcularDistanciaReta(coordFabrica.lat, coordFabrica.lon, coordEntrega.lat, coordEntrega.lon);
                if (dist > maiorDistancia) {
                    maiorDistancia = dist;
                    indiceMaisDistante = i;
                }
            }
        }

        if (!entregas[indiceMaisDistante]) indiceMaisDistante = 0;

        const entregaDestino = entregas[indiceMaisDistante];
        const entregasIntermediarias = entregas.filter((_, index) => index !== indiceMaisDistante && entregas[index]);

        if (entregasIntermediarias.length === 0) return entregas;

        const originAPI = formatarParaRoutesAPI(ENDERECO_FABRICA);
        const destinationAPI = formatarParaRoutesAPI(entregaDestino.queryLocation);
        const intermediatesAPI = entregasIntermediarias.map(e => formatarParaRoutesAPI(e.queryLocation));

        console.log("\n[API GOOGLE] Enviando requisição para Google Routes...");

        const requestBody = {
            origin: originAPI,
            destination: destinationAPI,
            intermediates: intermediatesAPI,
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_AWARE",
            optimizeWaypointOrder: true
        };

        const res = await axios.post(
            'https://routes.googleapis.com/directions/v2:computeRoutes',
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                    'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex'
                },
                timeout: 5000
            }
        );

        if (res.data && res.data.routes && res.data.routes.length > 0) {
            const ordemOtimizada = res.data.routes[0].optimizedIntermediateWaypointIndex;
            let entregasReordenadas = [];

            if (Array.isArray(ordemOtimizada) && ordemOtimizada.length === entregasIntermediarias.length) {
                for (let i = 0; i < ordemOtimizada.length; i++) {
                    const wpIndex = ordemOtimizada[i];
                    if (entregasIntermediarias[wpIndex]) {
                        entregasReordenadas.push(entregasIntermediarias[wpIndex]);
                    }
                }
            } else {
                entregasReordenadas = [...entregasIntermediarias];
            }

            entregasReordenadas.push(entregaDestino);

            if (entregasReordenadas.length === entregas.length) {
                return entregasReordenadas;
            }
        }

        return entregas;
    } catch (error) {
        console.error("\n[API GOOGLE ERRO]:", error.message);
        return entregas;
    }
}

async function obterCidadeDasCoordenadas(coordenadas) {
    if (!coordenadas || !coordenadas.includes(',')) return null;
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordenadas.replace(/\s/g, '')}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await axios.get(url);

        if (response.data.status === 'OK') {
            for (let result of response.data.results) {
                for (let component of result.address_components) {
                    if (component.types.includes('administrative_area_level_2') || component.types.includes('locality')) {
                        return component.long_name;
                    }
                }
            }
        }
    } catch (e) {}
    return null;
}

// Exportamos APENAS as 3 funções que o sistema realmente chama de fora.
// As outras 3 viraram "funções privadas" que rodam apenas aqui dentro!
module.exports = {
    obterLocalizacao,
    otimizarRotaGoogleAPI,
    obterCidadeDasCoordenadas
};