import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registrarPathArchivosEstaticos = (fastify) => {
    fastify.register(fastifyStatic, {
        root: path.join(__dirname, "..", "public"),
        prefix: "/public/",
    });
}

export {
    registrarPathArchivosEstaticos,
}
