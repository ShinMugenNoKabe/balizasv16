import fastifyRateLimiter from "@fastify/rate-limit";
import { TIEMPO_SEGUNDOS_PETICION_CACHE } from "../integrations/balizasV16.js";

const MAX_PETICIONES = 10;

const registrarLimitePeticiones = (fastify) => {
    fastify.register(fastifyRateLimiter, {
        global: false,
        max: MAX_PETICIONES,
        timeWindow: TIEMPO_SEGUNDOS_PETICION_CACHE * 1_000,
        errorResponseBuilder: (request, context) => {
            return {
                statusCode: 429,
                detail: `Demasiadas peticiones, inténtelo de nuevo dentro de ${context.after.replace("second", "segundo")}`,
            };
        },
    });
}

export {
    registrarLimitePeticiones,
}
