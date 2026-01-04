import balizasV16Register from "../routers/balizasV16router.js";

const registrarEndpoints = (fastify) => {
    fastify.register(balizasV16Register, {
        prefix: "/api/v1/balizasV16",
    });

    fastify.get("/", (req, reply) => {
        return reply.sendFile("/views/mapa.html");
    });
}

export {
    registrarEndpoints,
}
