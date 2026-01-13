import fastify from "./server/server.js";

fastify.listen({
    port: 3_000,
}, (err, address) => {
    console.log(`Servidor ejecutándose en ${address}`);
});
