import { parsearNombreComunidadAutonoma, parsearRespuestaBase64 } from "../utils/balizasV16utils.js";
import { calcularFechaHaceUnaHora } from "../utils/utils.js";

const DGT_INCIDENCIAS_API_URL = "https://etraffic.dgt.es/etrafficWEB/api/cache/getFilteredData";
const DGT_FUENTE_INCIDENCIAS_BALIZAS_V16 = "DGT3.0";

const MAPEO_SENTIDOS_DGT = {
    "positive": "creciente",
    "negative": "decreciente",
};

const MAPEO_ORIENTACIONES_DGT = {
    "northBound": "norte",
    "northEastBound": "noreste",
    "eastBound": "este",
    "southEastBound": "sureste",
    "southBound": "sur",
    "southWestBound": "suroeste",
    "westBound": "oeste",
    "northWestBound": "noroeste",
};

let datosBalizasV16Cacheados = null;

const getDatosBalizasV16 = async () => {
    const respuestaDgtBase64 = await fetchApiIncidenciasDgt();
    const incidenciasBalizasDgt = parsearRespuestaApiIncidenciasDgt(respuestaDgtBase64);

    actualizarDatosBalizaV16Cacheados(incidenciasBalizasDgt);
    return datosBalizasV16Cacheados;
}

const fetchApiIncidenciasDgt = async () => {
    const filtrosDgt = {
        filtrosVia: [],
        filtrosCausa: [
            "Otras incidencias",
        ]
    };

    const dgtResponse = await fetch(DGT_INCIDENCIAS_API_URL, {
        body: JSON.stringify(filtrosDgt),
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!dgtResponse.ok) {
        throw new Error("No se ha podido recuperar la información de las balizas V16. Inténtelo de nuevo más tarde.")
    }

    return await dgtResponse.text();
}

const parsearRespuestaApiIncidenciasDgt = (respuestaDgtBase64) => {
    const respuestaDgtJson = parsearRespuestaBase64(respuestaDgtBase64);
    const incidenciasDgt = JSON.parse(respuestaDgtJson);

    const incidenciasBalizasDgt = incidenciasDgt.situationsRecords.filter(i => i.fuente === DGT_FUENTE_INCIDENCIAS_BALIZAS_V16);
    return incidenciasBalizasDgt;
}

const actualizarDatosBalizaV16Cacheados = (incidenciasBalizasDgt) => {
    inicializarDatosCacheados();

    const fechaUltimaActualizacion = new Date();
    datosBalizasV16Cacheados.fechas.realizadaPeticionEn = fechaUltimaActualizacion;

    const idsBalizasActivas = new Set();

    incidenciasBalizasDgt.forEach(b => {
        const idBaliza = b.id;
        idsBalizasActivas.add(idBaliza);

        datosBalizasV16Cacheados.balizas[idBaliza] = mapearIncidenciaBalizaADatosBaliza(b);
    });

    actualizarDatosInactivos(idsBalizasActivas);
    actualizarContadorBalizas();
    
    return datosBalizasV16Cacheados;
}

const inicializarDatosCacheados = () => {
    if (datosBalizasV16Cacheados) {
        return;
    }
    
    datosBalizasV16Cacheados = {
        fechas: {},
        contadoresBalizas: {
            numeroBalizasActivas: 0,
            numeroBalizasInactivas: 0,
        },
        balizas: {},
    };
}

const mapearIncidenciaBalizaADatosBaliza = (incidenciaBalizaDgt) => {
    const datosGeometria = JSON.parse(incidenciaBalizaDgt.geometria);
    const [longitud, latitud] = datosGeometria.coordinates;

    const idBaliza = incidenciaBalizaDgt.id;
    const datosExistentesBalizaV16 = datosBalizasV16Cacheados.balizas[idBaliza];

    const fechaUltimaActualizacion = datosBalizasV16Cacheados.fechas.realizadaPeticionEn;

    const datosBalizaV16Mapeados = {
        identificadores: {
            idIncidenciaDgt: idBaliza,
            idSituacionDgt: incidenciaBalizaDgt.situationId,
        },
        estado: "activa",
        localizacion: {
            coordenadas: {
                latitud,
                longitud,
            },
            localidad: {
                comunidad: parsearNombreComunidadAutonoma(incidenciaBalizaDgt.cAutonomaIni),
                provincia: incidenciaBalizaDgt.provinciaIni,
                municipio: incidenciaBalizaDgt.municipioIni,
            },
            via: {
                nombre: incidenciaBalizaDgt.carretera,
                kilometro: incidenciaBalizaDgt.pkIni,
            },
        },
        posicion: {
            sentido: MAPEO_SENTIDOS_DGT[incidenciaBalizaDgt.sentido] ?? null,
            orientacion: MAPEO_ORIENTACIONES_DGT[incidenciaBalizaDgt.orientacion] ?? null,
        },
        fechas: {
            activadaEn: new Date(incidenciaBalizaDgt.fechaInicio),
            primeraVezVistaEn: datosExistentesBalizaV16
                ? datosExistentesBalizaV16.fechas.primeraVezVistaEn
                : fechaUltimaActualizacion,
            ultimaActualizacionEn: fechaUltimaActualizacion,
        },
    }

    return datosBalizaV16Mapeados;
}

const actualizarDatosInactivos = (idsBalizasActivas) =>  {
    const idsBalizasInactivas = new Set();

    const fechaUltimaActualizacion = datosBalizasV16Cacheados.fechas.realizadaPeticionEn;
    const fechaHaceUnaHora = calcularFechaHaceUnaHora(fechaUltimaActualizacion);

    Object.entries(datosBalizasV16Cacheados.balizas).forEach(([idBaliza, datosBaliza]) => {
        if (!balizaHaEnviadoActualizaciones(idBaliza, idsBalizasActivas)) {
            datosBaliza.estado = "inactiva";
        }
        
        if (balizaEstaCaducada(datosBaliza, fechaHaceUnaHora)) {
            idsBalizasInactivas.add(idBaliza);
        }
    });

    idsBalizasInactivas.forEach(idBaliza => {
        delete datosBalizasV16Cacheados.balizas[idBaliza];
    });
}

const balizaHaEnviadoActualizaciones = (idBaliza, idsBalizasActivas) => {
    return idsBalizasActivas.has(idBaliza);
}

const balizaEstaCaducada = (datosBaliza, fechaHaceUnaHora) => {
    return datosBaliza.estado === "inactiva" && datosBaliza.fechas.ultimaActualizacionEn <= fechaHaceUnaHora;
}

const actualizarContadorBalizas = () => {
    const { contadoresBalizas } = datosBalizasV16Cacheados;
    contadoresBalizas.numeroBalizasActivas = 0;
    contadoresBalizas.numeroBalizasInactivas = 0;

    Object.values(datosBalizasV16Cacheados.balizas).forEach(b => {
        if (b.estado === "activa") {
            contadoresBalizas.numeroBalizasActivas++;
        } else if (b.estado === "inactiva") {
            contadoresBalizas.numeroBalizasInactivas++;
        }
    });
}

export {
    getDatosBalizasV16,
}
