import { GitHubRepositorioControl, TwitterControl, SwaggerControl, RefrescarMapaControl } from "/static/js/controles.js";
import { capitalizarTexto } from "/static/js/utils.js";

const TIEMPO_DE_REFRESCO_MS = 2_000 * 60;

let map = null;
let comunidadesControl = null;
let comunidadesLayerGroups = null;
let refrescadoTimeoutId = null;

const inicializarMapa = () => {
    map = L.map("map", {
        minZoom: 5,
    });

    const bounds = L.latLngBounds(
        [36, -9.5],  // esquins suroeste
        [43.8, 3.3], // esquina noreste
    );

    map.fitBounds(bounds);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}

const inicializarControles = () => {
    const refrescarMapaControl = new RefrescarMapaControl();
    const githubControl = new GitHubRepositorioControl();
    const twitterControl = new TwitterControl();
    const swaggerControl = new SwaggerControl();

    map.addControl(refrescarMapaControl);
    map.addControl(twitterControl);
    map.addControl(swaggerControl);
    map.addControl(githubControl);
}

const mostrarBalizasEnMapa = async () => {
    const balizasV16response = await fetch("/api/v1/balizasV16");

    if (!balizasV16response.ok) {
        limpiarMapa();

        const respuestaError = await balizasV16response.json();
        alert(respuestaError.detail);

        return;
    }

    const balizasV16 = await balizasV16response.json();

    const IconoBaliza = L.Icon.extend({
        options: {
            iconSize: [30, 28],
            iconAnchor: [15, 28],
            popupAnchor: [0, -30],
        },
    });

    const iconoBalizaEncendida = new IconoBaliza({
        iconUrl: "/static/images/baliza_encendida_min.png",
    });

    const iconoBalizaApagada = new IconoBaliza({
        iconUrl: "/static/images/baliza_apagada_min.png",
    });

    comunidadesLayerGroups = {};

    Object.values(balizasV16.balizas).forEach(baliza => {
        const comunidad = baliza.localizacion.localidad.comunidad;

        if (!comunidadesLayerGroups[comunidad]) {
            comunidadesLayerGroups[comunidad] = L.layerGroup().addTo(map);
        }

        const { latitud, longitud } = baliza.localizacion.coordenadas;

        L.marker([latitud, longitud], {
            icon: baliza.estado === "activa" ? iconoBalizaEncendida : iconoBalizaApagada,
        })
            .bindPopup(construirBalizaHtml(baliza, balizasV16.fechas.realizadaPeticionEn))
            .addTo(comunidadesLayerGroups[comunidad]);
    });

    comunidadesControl = L.control.layers({}, {}).addTo(map);
    const comunidades = Object.keys(comunidadesLayerGroups).sort((a, b) => a.localeCompare(b));

    comunidades.forEach(c => {
        comunidadesControl.addOverlay(comunidadesLayerGroups[c], c);
    });

    actualizarBotonRefrescado(balizasV16.fechas.realizadaPeticionEn);

    refrescadoTimeoutId = setTimeout(() => {
        limpiarMapa();
        mostrarBalizasEnMapa();
    }, TIEMPO_DE_REFRESCO_MS);
};

const limpiarMapa = () => {
    if (comunidadesControl) {
        map.removeControl(comunidadesControl);
    }

    if (comunidadesLayerGroups) {
        Object.values(comunidadesLayerGroups).forEach(layer => layer.clearLayers());
    }
}

const formatearFechaBaliza = (fechaBalizaIso) => {
    if (!fechaBalizaIso) {
        return "";
    }

    const fechaBaliza = new Date(fechaBalizaIso);

    return fechaBaliza.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

const construirBalizaHtml = (baliza, fechaPeticion) => {
    const { localizacion, posicion, fechas } = baliza;
    const { comunidad, provincia, municipio } = localizacion.localidad;
    const { nombre, kilometro } = localizacion.via;
    const { latitud, longitud } = localizacion.coordenadas;
    const { sentido, orientacion } = posicion;
    const { activadaEn, primeraVezVistaEn, ultimaActualizacionEn } = fechas;

    const balizaEstaActiva = baliza.estado === "activa";
    const claseEstado = balizaEstaActiva ? "popupBalizaHeaderVerde" : "popupBalizaHeaderRojo";
    const emojiEstado = balizaEstaActiva ? "🟢" : "🔴";

    // Enlaces a webs de navegación
    const enlaceGoogleMaps = `https://www.google.com/maps?q=${latitud},${longitud}`;
    const enlaceWaze = `https://waze.com/ul?ll=${latitud},${longitud}&navigate=yes`;
    const enlaceHere = `https://share.here.com/l/${latitud},${longitud}`;
    const enlaceAppleMaps = `https://maps.apple.com/?daddr=${latitud},${longitud}`;

    return `
        <div class="popupBalizaHeader ${claseEstado}">
            ${emojiEstado} BALIZA ${baliza.estado.toUpperCase()}
        </div>

        <div class="popupVia">
            <b>Vía ${nombre}</b> - <span title="Punto Kilométrico" class="textoPuntos">P.K.</span> ${kilometro}
        </div>

        <hr/>

        <table class="popupTable">
            <tr>
                <td><b>🌍 Comunidad</b></td>
                <td>${comunidad}</td>
            </tr>
            <tr>
                <td><b>🏢 Provincia</b></td>
                <td>${provincia}</td>
            </tr>
            <tr>
                <td><b>📍 Municipio</b></td>
                <td>${municipio}</td>
            </tr>
            <tr>
                <td colspan="2"><hr/></td>
            </tr>
            <tr>
                <td><b>🌐 Latitud</b></td>
                <td class="popupCoordenadas">${latitud}</td>
            </tr>
            <tr>
                <td><b>🌐 Longitud</b></td>
                <td class="popupCoordenadas">${longitud}</td>
            </tr>
            <tr>
                <td colspan="2"><hr/></td>
            </tr>
            <tr>
                <td><b>🧭 Sentido</b></td>
                <td>${capitalizarTexto(sentido)}</td>
            </tr>
            <tr>
                <td><b>📐 Orientación</b></td>
                <td>${capitalizarTexto(orientacion)}</td>
            </tr>
            <tr>
                <td colspan="2"><hr/></td>
            </tr>
            <tr>
                <td><b>🚨 Activada</b></td>
                <td>${formatearFechaBaliza(activadaEn)}</td>
            </tr>
            <tr>
                <td><b>👁️ Primera vez vista</b></td>
                <td>${formatearFechaBaliza(primeraVezVistaEn)}</td>
            </tr>
            <tr>
                <td><b>🔄 Última actualización</b></td>
                <td>${formatearFechaBaliza(ultimaActualizacionEn)}</td>
            </tr>
        </table>

        <hr/>

        <div class="popupMapas">
            <div>
                <a href="${enlaceGoogleMaps}" target="_blank">🗺️ Abrir en Google Maps</a>
                </div>
            <div>
                <a href="${enlaceWaze}" target="_blank">🚗 Abrir en Waze</a>
            </div>
            <div>
                <a href="${enlaceHere}" target="_blank">📍 Abrir en HERE</a>
            </div>
            <div>
                <a href="${enlaceAppleMaps}" target="_blank">🍎 Abrir en Apple Maps</a>
            </div>
        </div>
    `;
};

const actualizarBotonRefrescado = (fechaPeticion) => {
    const proximaActualizacion = new Date(fechaPeticion);
    proximaActualizacion.setMilliseconds(proximaActualizacion.getMilliseconds() + TIEMPO_DE_REFRESCO_MS);

    document.querySelector("#botonRefrescarUltimaActualizacion").textContent = formatearFechaBaliza(fechaPeticion);
    document.querySelector("#botonRefrescarProximaActualizacion").textContent = formatearFechaBaliza(proximaActualizacion);
}

const clearTimeoutRefrescado = () => {
    clearTimeout(refrescadoTimeoutId);
}

inicializarMapa();
inicializarControles();
await mostrarBalizasEnMapa();

export {
    clearTimeoutRefrescado,
    limpiarMapa,
    mostrarBalizasEnMapa,
}