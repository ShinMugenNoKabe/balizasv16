import Fastify from "fastify";
import { realizarPeticionDatosBalizasV16 } from "../integrations/balizasV16.js";
import { registrarLimitePeticiones } from "./rateLimiter.js";
import { registrarInfoSwagger } from "./swagger.js";
import { registrarPathArchivosEstaticos } from "./static.js";
import { registrarEndpoints } from "./endpoints.js";

const fastify = Fastify({
    logger: true,
});

const logger = fastify.log;

await realizarPeticionDatosBalizasV16();

registrarLimitePeticiones(fastify);
registrarInfoSwagger(fastify);
registrarPathArchivosEstaticos(fastify);

registrarEndpoints(fastify);

await fastify.ready();

export default fastify;

export {
    logger,
};
