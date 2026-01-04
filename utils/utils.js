const convertirHorasAMilisegundos = (horas) => {
    return horas * 1_000 * 60 * 60;
}

const calcularFechaHaceUnaHora = (fecha) => {
    return fecha - convertirHorasAMilisegundos(1);
}

export {
    calcularFechaHaceUnaHora,
}
