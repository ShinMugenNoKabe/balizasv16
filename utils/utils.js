const convertirHorasAMilisegundos = (horas) => {
    return horas * 1_000 * 60 * 60;
}

const calcularFechaHaceUnaHora = (fecha) => {
    return fecha - convertirHorasAMilisegundos(1);
}

const setearOffsetEnFechaLocal = (fechaIso, fechaUltimaActualizacion) => {
    if (!fechaIso) {
        return null;
    }

    const splitFechaIso = fechaIso.split("T");
    const splitDiaIso = splitFechaIso[0].split("-");
    const splitHoraIso = splitFechaIso[1].split(":");

    const [anio, mes, dia] = splitDiaIso.map(Number);
    const [hora, minuto, segundo] = splitHoraIso.map(Number);

    const fechaMadridUtc = new Date(Date.UTC(anio, mes - 1, dia, hora, minuto, segundo));

    const offsetMadrid = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Madrid",
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const partesFechaMadridUtc = Object.fromEntries(
        offsetMadrid.formatToParts(fechaMadridUtc)
            .filter(p => p.type !== "literal")
            .map(p => [p.type, Number(p.value)])
    );

    const fechaMadridEnUtc = Date.UTC(
        partesFechaMadridUtc.year,
        partesFechaMadridUtc.month - 1,
        partesFechaMadridUtc.day,
        partesFechaMadridUtc.hour,
        partesFechaMadridUtc.minute,
        partesFechaMadridUtc.second
    );

    const offsetMadridMs = fechaMadridEnUtc - fechaMadridUtc.getTime();

    return new Date(fechaMadridUtc.getTime() - offsetMadridMs);
}

export {
    calcularFechaHaceUnaHora,
    setearOffsetEnFechaLocal,
}
