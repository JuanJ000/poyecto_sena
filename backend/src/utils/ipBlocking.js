/**
 * Map para rastrear IPs bloqueadas temporalmente por fallidos intentos de login
 */
const ipsBloqueadas = new Map();

/**
 * Registrar intento fallido de login desde una IP
 */
function registrarIntento(ip) {
    const ahora = Date.now();
    const registro = ipsBloqueadas.get(ip) || { intentos: 0, bloqueadaHasta: 0 };

    // Si el bloqueo ya expiró, resetear
    if (registro.bloqueadaHasta && ahora > registro.bloqueadaHasta) {
        ipsBloqueadas.delete(ip);
        return false;
    }

    // Si está bloqueada
    if (registro.bloqueadaHasta && ahora < registro.bloqueadaHasta) {
        return true;
    }

    registro.intentos++;

    // Bloquear progresivamente: 3 intentos → 5 min, 6 → 30 min, 10 → 24h
    if (registro.intentos >= 10) {
        registro.bloqueadaHasta = ahora + 24 * 60 * 60 * 1000;
        console.warn(`🔒 IP ${ip} bloqueada por 24h tras ${registro.intentos} intentos fallidos`);
    } else if (registro.intentos >= 6) {
        registro.bloqueadaHasta = ahora + 30 * 60 * 1000;
        console.warn(`🔒 IP ${ip} bloqueada por 30 min tras ${registro.intentos} intentos`);
    } else if (registro.intentos >= 3) {
        registro.bloqueadaHasta = ahora + 5 * 60 * 1000;
        console.warn(`🔒 IP ${ip} bloqueada por 5 min tras ${registro.intentos} intentos`);
    }

    ipsBloqueadas.set(ip, registro);
    return false;
}

/**
 * Verificar si una IP está bloqueada
 */
function estasBloqueada(ip) {
    const registro = ipsBloqueadas.get(ip);
    if (!registro) return false;
    if (Date.now() < registro.bloqueadaHasta) return true;
    ipsBloqueadas.delete(ip);
    return false;
}

/**
 * Limpiar bloqueo de IP en login exitoso
 */
function limpiarIpEnExito(ip) {
    ipsBloqueadas.delete(ip);
}

/**
 * Limpiar IPs con bloqueos expirados (ejecutar periódicamente)
 */
function limpiarIpsExpiradas() {
    const ahora = Date.now();
    for (const [ip, reg] of ipsBloqueadas.entries()) {
        if (ahora > reg.bloqueadaHasta) {
            ipsBloqueadas.delete(ip);
        }
    }
}

module.exports = {
    registrarIntento,
    estasBloqueada,
    limpiarIpEnExito,
    limpiarIpsExpiradas
};
