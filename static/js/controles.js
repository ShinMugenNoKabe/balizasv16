import { clearTimeoutRefrescado, limpiarMapa, mostrarBalizasEnMapa } from "/static/js/mapa.js";

const ENLACE_GITHUB = "https://github.com/ShinMugenNoKabe/balizasv16api";
const ENLACE_TWITTER = "https://twitter.com/Muralla1nfinita";
const ENLACE_SWAGGER = "/api/v1/docs";

const GitHubRepositorioControl = L.Control.extend({
    options: {
        position: "bottomleft"
    },

    onAdd(map) {
        const div = L.DomUtil.create("div", "leaflet-control");

        div.innerHTML = `
            <a href="${ENLACE_GITHUB}" target="_blank" title="Somos Open Source!">
                <img src="/static/images/logo_github_min.png" class="iconoEnlace" alt="Repositorio de GitHub" />
            </a>
        `;

        return div;
    },
});

const TwitterControl = L.Control.extend({
    options: {
        position: "bottomleft"
    },

    onAdd(map) {
        const div = L.DomUtil.create("div", "leaflet-control");

        div.innerHTML = `
            <a href="${ENLACE_TWITTER}" target="_blank" title="Mi Twitter!">
                <img src="/static/images/logo_twitter_min.png" class="iconoEnlace" alt="Mi Twitter" />
            </a>
        `;

        return div;
    },
});

const SwaggerControl = L.Control.extend({
    options: {
        position: "bottomleft"
    },

    onAdd(map) {
        const div = L.DomUtil.create("div", "leaflet-control");

        div.innerHTML = `
            <a href="${ENLACE_SWAGGER}" target="_blank" title="Documentación de la API gratuita!">
                <img src="/static/images/logo_swagger_min.png" class="iconoEnlace" alt="Documentación de la API gratuita" />
            </a>
        `;

        return div;
    },
});

const RefrescarMapaControl = L.Control.extend({
    options: {
        position: "topleft"
    },

    onAdd(map) {
        const div = L.DomUtil.create("div", "leaflet-control");

        div.innerHTML = `
            <button class="leaflet-bar botonRefrescar" title="Refrescar mapa">
                🔄 Refrescar mapa
                <br/>
                Última actualización - <span id="botonRefrescarUltimaActualizacion">-</span>
                <br/>
                Próxima actualización - <span id="botonRefrescarProximaActualizacion">-</span>
            </button>
        `;

        L.DomEvent.disableClickPropagation(div);

        div.querySelector("button").addEventListener("click", () => {
            this.refrescarDatos();
        });

        return div;
    },

    refrescarDatos() {
        clearTimeoutRefrescado();
        limpiarMapa();
        mostrarBalizasEnMapa();
    }
});

export {
    GitHubRepositorioControl,
    TwitterControl,
    SwaggerControl,
    RefrescarMapaControl,
}
