import { getDatosBalizasV16 } from "../services/balizasV16service.js";

const balizasV16Register = (fastify, opts, done) => {
    fastify.get("/",
        {
            schema: {
                description: `
                    Este endpoint se usa para obtener los datos en tiempo real de las Balizas V16 en España.
                    Utiliza la API pública de incidencias de la DGT 3.0.
                    Todas las balizas se cachean durante 1 hora. Si no se reciben actualizaciones, se marcan como inactivas.
                    Las balizas se eliminan de la caché si tras pasada 1 hora no se reciben datos.
                `,
                tags: [
                    "Balizas V16",
                ],
                summary: "Obtener datos en tiempo real",
                response: {
                    200: {
                        description: "Datos recibidos correctamente",
                        type: "object",
                        "$ref": "RespuestaBalizasV16",
                    },
                    500: {
                        description: "Error al recibir los datos",
                        type: "object",
                        "$ref": "RespuestaError",
                    },
                },
            },
        },
        async (req, reply) => {
            try {
                const datosBalizasV16 = await getDatosBalizasV16();
                return reply.send(datosBalizasV16);
            } catch (err) {
                reply.code(500);

                return {
                    detail: err.message,
                };
            }
        });

    done();
}

export default balizasV16Register;
