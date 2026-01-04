const capitalizarTexto = (texto) => {
    if (!texto) {
        return null;
    }

    texto = texto.toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.substring(1);
}

export {
    capitalizarTexto,
}
