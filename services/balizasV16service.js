import { realizarPeticionDatosBalizasV16, getDatosBalizasV16Cacheados } from "../integrations/balizasV16.js";

const getDatosCacheadosBalizasV16 = async () => {
    if (!getDatosBalizasV16Cacheados()) {
        return await realizarPeticionDatosBalizasV16();
    }

    return getDatosBalizasV16Cacheados();
}

export {
    getDatosCacheadosBalizasV16,
}
