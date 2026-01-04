import fastifyStatic from "@fastify/static";
import path from "node:path";

const registrarPathArchivosEstaticos = (fastify) => {
    fastify.register(fastifyStatic, {
        root: path.join(import.meta.dirname, "..", "static"),
        prefix: "/static/",
    });
}

export {
    registrarPathArchivosEstaticos,
}
