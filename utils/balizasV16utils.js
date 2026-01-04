const parsearRespuestaBase64 = (base64String, a = "K") =>  {
    const i = a.charCodeAt(0)
      , t = atob(base64String)
      , r = new Uint8Array(t.length);
    for (let o = 0; o < t.length; o++)
        r[o] = t.charCodeAt(o) ^ i;
    return new TextDecoder("utf-8").decode(r)
}

const parsearNombreComunidadAutonoma = (comunidad) => {
    if (!comunidad) {
        return null;
    }

    if (!comunidad.includes(", ")) {
        return comunidad;
    }

    const comunidadSplit = comunidad.split(", ");
    return `${comunidadSplit[1]} ${comunidadSplit[0]}`;
}

export {
    parsearRespuestaBase64,
    parsearNombreComunidadAutonoma,
}
