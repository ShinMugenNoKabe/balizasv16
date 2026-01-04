import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

const registrarInfoSwagger = (fastify) => {
    fastify.register(fastifySwagger, {
        openapi: {
            openapi: "3.1.1",
            info: {
                title: "API REST de Balizas V16 en España",
                description: "API REST de Balizas V16 en España, en tiempo real; de uso completamente gratuito.",
                version: "0.0.1",
                contact: {
                    name: "ShinMugenNoKabe",
                    url: "https://github.com/ShinMugenNoKabe",
                },
                license: {
                    name: "GNU General Public License",
                    url: "https://www.gnu.org/licenses/gpl-3.0.html",
                },
            },
            tags: [
                {
                    name: "Balizas V16",
                    description: "Endpoints relacionados a las Balizas V16",
                },
            ],
            externalDocs: {
                description: "Ver mapa en tiempo real",
                url: "/",
            },
        }
    });

    fastify.register(fastifySwaggerUi, {
        routePrefix: "/api/v1/docs",
        theme: {
            title: "API REST de Balizas V16 en España",
        },
    });

    fastify.addSchema({
        $id: "RespuestaBalizasV16",
        description: "Respuesta del endpoint del listado de Balizas V16",
        type: "object",
        properties: {
            fechas: {
                description: "Fechas relacionadas a las peticiones de Balizas V16",
                type: "object",
                properties: {
                    realizadaPeticionEn: {
                        description: "Fecha en formato ISO en la que se realizó la petición a la DGT 3.0",
                        type: "string",
                        format: "date-time",
                    },
                },
            },
            contadoresBalizas: {
                description: "Contador de balizas V16 activas e inactivas",
                type: "object",
                properties: {
                    numeroBalizasActivas: {
                        description: "Número de balizas activas en el momento de la petición (se han recibido eventos)",
                        type: "integer",
                        minimum: 0,
                    },
                    numeroBalizasInactivas: {
                        description: "Número de balizas inactivas en el momento de la petición (no se recibieron eventos)",
                        type: "integer",
                        minimum: 0,
                    },
                },
            },
            balizas: {
                description: "Listado de balizas V16 en formato clave - valor (id baliza - datos baliza)",
                type: "object",
                additionalProperties: {
                    "$ref": "BalizaV16",
                },
            },
        },
    });

    fastify.addSchema({
        $id: "BalizaV16",
        description: "Datos de una Baliza V16 recibida de la API de la DGT 3.0",
        type: "object",
        properties: {
            identificadores: {
                description: "Identificadores de la DGT",
                type: "object",
                properties: {
                    idIncidenciaDgt: {
                        description: "Identificador de incidencia en la DGT",
                        type: "string",
                    },
                    idSituacionDgt: {
                        description: "Identificador de situación en la DGT",
                        type: "string",
                    },
                },
            },
            estado: {
                description: "Estado actual de la baliza V16. 'activa' indica que se han recibido datos, 'inactiva' indica que no se han recibido datos",
                type: "string",
                enum: [
                    "activa",
                    "inactiva",
                ],
            },
            localizacion: {
                description: "Información relacionada a la localización y punto en el mapa de la baliza V16",
                type: "object",
                properties: {
                    coordenadas: {
                        description: "Coordenadas del mapa donde se encuentra la baliza V16",
                        type: "object",
                        properties: {
                            latitud: {
                                description: "Latitud",
                                type: "number",
                            },
                            longitud: {
                                description: "Longitud",
                                type: "number",
                            },
                        },
                    },
                    localidad: {
                        description: "Información del municipio, provincia y Comunidad Autónoma",
                        type: "object",
                        properties: {
                            comunidad: {
                                description: "Nombre de la Comunidad Autónoma",
                                type: "string",
                            },
                            provincia: {
                                description: "Nombre de la provincia",
                                type: "string",
                            },
                            municipio: {
                                description: "Nombre del municipio/poblado",
                                type: "string",
                            },
                        },
                    },
                    via: {
                        description: "Información de la vía donde se encuentra la baliza V16 (carretera, autovía, etc)",
                        type: "object",
                        properties: {
                            nombre: {
                                description: "Nombre de la vía",
                                type: "string",
                            },
                            kilometro: {
                                description: "Punto Kilométrico en la que se encuentra la baliza V16, con respecto a la vía",
                                type: "number",
                            },
                        },
                    },
                },
            },
            posicion: {
                description: "Información relacionada a la forma en la que está colocada la baliza V16/vehículo",
                type: "object",
                properties: {
                    sentido: {
                        description: "Sentido en la que está colocada la baliza V16/vehículo",
                        type: "string",
                        enum: [
                            "creciente",
                            "decreciente",
                        ],
                    },
                    orientacion: {
                        description: "Orientación en los 8 puntos cardinales en la que está colocada la baliza V16/vehículo",
                        type: "string",
                        enum: [
                            "norte",
                            "noreste",
                            "este",
                            "sureste",
                            "sur",
                            "suroeste",
                            "oeste",
                            "noroeste",
                        ],
                    },
                },
            },
            fechas: {
                description: "Fechas relacionadas a la Baliza V16",
                type: "object",
                properties: {
                    activadaEn: {
                        description: "Fecha en la que se activó la baliza V16 por primera vez, en base a la información de la DGT 3.0",
                        type: "string",
                        format: "date-time",
                    },
                    primeraVezVistaEn: {
                        description: "Fecha en la que se recibió datos de la baliza V16 por primera vez por parte de la DGT 3.0",
                        type: "string",
                        format: "date-time",
                    },
                    ultimaActualizacionEn: {
                        description: "Fecha en la que se recibió datos de la baliza V16 por última vez por parte de la DGT 3.0",
                        type: "string",
                        format: "date-time",
                    },
                }
            },
        },
    });

    fastify.addSchema({
        $id: "RespuestaError",
        description: "Mensaje de error al realizar una petición",
        type: "object",
        properties: {
            detail: {
                description: "Mensaje de error",
                type: "string",
            },
        },
    });
}

export {
    registrarInfoSwagger,
}
