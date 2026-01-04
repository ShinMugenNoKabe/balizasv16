import Fastify from "fastify";
import { registrarInfoSwagger } from "./server/swagger.js";
import { registrarPathArchivosEstaticos } from "./server/static.js";
import { registrarEndpoints } from "./server/endpoints.js";

const fastify = Fastify({
    logger: true,
});

registrarInfoSwagger(fastify);
registrarPathArchivosEstaticos(fastify);

registrarEndpoints(fastify);

await fastify.ready();

fastify.listen({
    port: 3_000,
}, (err, address) => {
    console.log(`Server listening on ${address}`);
});
