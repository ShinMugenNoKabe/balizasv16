import { parsearNombreComunidadAutonoma, parsearRespuestaBase64, parsearDatosGeometria } from "../utils/balizasV16utils.js";
import { calcularFechaHaceUnaHora, setearOffsetEnFechaLocal } from "../utils/utils.js";
import { logger } from "../server/server.js";

const TIEMPO_SEGUNDOS_PETICION_CACHE = 30;

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

const realizarPeticionDatosBalizasV16 = async () => {
    logger.info(`Realizada peticion de Balizas V16 a fecha ${new Date().toISOString()}`);

    const respuestaDgtBase64 = await fetchApiIncidenciasDgt();
    const incidenciasBalizasDgt = parsearRespuestaApiIncidenciasDgt(respuestaDgtBase64);

    actualizarDatosBalizaV16Cacheados(incidenciasBalizasDgt);
    iniciarTemporizadorCache();

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

    const respuestaDgtBase64 = await dgtResponse.text();

    if (!dgtResponse.ok) {
        logger.error(`Error al realizar la petición de Balizas V16: ${dgtResponse.status}, ${respuestaDgtBase64}`);
        throw new Error("No se ha podido recuperar la información de las balizas V16. Inténtelo de nuevo más tarde.")
    }

    return respuestaDgtBase64;
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
    const idBaliza = incidenciaBalizaDgt.id;
    const datosExistentesBalizaV16 = datosBalizasV16Cacheados.balizas[idBaliza];

    const fechaUltimaActualizacion = datosBalizasV16Cacheados.fechas.realizadaPeticionEn;
    const { latitud, longitud } = parsearDatosGeometria(incidenciaBalizaDgt);

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
            activadaEn: setearOffsetEnFechaLocal(incidenciaBalizaDgt.fechaInicio, fechaUltimaActualizacion),
            primeraVezVistaEn: datosExistentesBalizaV16
                ? datosExistentesBalizaV16.fechas.primeraVezVistaEn
                : fechaUltimaActualizacion,
            ultimaActualizacionEn: fechaUltimaActualizacion,
        },
    }

    return datosBalizaV16Mapeados;
}

const actualizarDatosInactivos = (idsBalizasActivas) =>  {
    const idsBalizasCaducadas = new Set();

    const fechaUltimaActualizacion = datosBalizasV16Cacheados.fechas.realizadaPeticionEn;
    const fechaHaceUnaHora = calcularFechaHaceUnaHora(fechaUltimaActualizacion);

    Object.entries(datosBalizasV16Cacheados.balizas).forEach(([idBaliza, datosBaliza]) => {
        if (!balizaHaEnviadoActualizaciones(idBaliza, idsBalizasActivas)) {
            datosBaliza.estado = "inactiva";
        }
        
        if (balizaEstaCaducada(datosBaliza, fechaHaceUnaHora)) {
            idsBalizasCaducadas.add(idBaliza);
        }
    });

    // Quitamos de la caché las balizas de las cuales no hemos recibido datos
    idsBalizasCaducadas.forEach(idBaliza => {
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

const iniciarTemporizadorCache = () => {
    setTimeout(realizarPeticionDatosBalizasV16, 1_000 * TIEMPO_SEGUNDOS_PETICION_CACHE);
}

const getDatosBalizasV16Cacheados = () => {
    return datosBalizasV16Cacheados;
}

export {
    realizarPeticionDatosBalizasV16,
    getDatosBalizasV16Cacheados,
}
