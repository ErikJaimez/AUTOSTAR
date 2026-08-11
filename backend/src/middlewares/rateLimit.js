/**
 * Middleware de limitación de intentos de login por usuario.
 * Almacena intentos en memoria (Map) — suficiente para desarrollo/MVP.
 *
 * Configuración:
 * - Máximo 5 intentos fallidos consecutivos
 * - Bloqueo temporal de 5 minutos tras alcanzar el máximo
 * - Un login exitoso reinicia el contador
 */

const MAX_INTENTOS = 5;
const TIEMPO_BLOQUEO_MS = 5 * 60 * 1000; // 5 minutos en milisegundos

// Store en memoria: Map<username, { intentos: number, bloqueadoHasta: Date | null }>
const intentosStore = new Map();

/**
 * Verifica si un usuario está actualmente bloqueado.
 * @param {string} username
 * @returns {{ bloqueado: boolean, tiempoRestante: number }} tiempoRestante en segundos
 */
function verificarBloqueo(username) {
    const registro = intentosStore.get(username);

    if (!registro || !registro.bloqueadoHasta) {
        return { bloqueado: false, tiempoRestante: 0 };
    }

    const ahora = Date.now();

    if (ahora < registro.bloqueadoHasta) {
        const tiempoRestante = Math.ceil((registro.bloqueadoHasta - ahora) / 1000);
        return { bloqueado: true, tiempoRestante };
    }

    // El bloqueo expiró, reiniciar
    intentosStore.delete(username);
    return { bloqueado: false, tiempoRestante: 0 };
}

/**
 * Registra un intento fallido de login para un usuario.
 * Si alcanza MAX_INTENTOS, activa el bloqueo temporal.
 * @param {string} username
 * @returns {{ bloqueado: boolean, intentosRestantes: number, tiempoRestante: number }}
 */
function registrarIntentoFallido(username) {
    let registro = intentosStore.get(username);

    if (!registro) {
        registro = { intentos: 0, bloqueadoHasta: null };
    }

    registro.intentos += 1;

    if (registro.intentos >= MAX_INTENTOS) {
        registro.bloqueadoHasta = Date.now() + TIEMPO_BLOQUEO_MS;
        intentosStore.set(username, registro);
        const tiempoRestante = Math.ceil(TIEMPO_BLOQUEO_MS / 1000);
        return { bloqueado: true, intentosRestantes: 0, tiempoRestante };
    }

    intentosStore.set(username, registro);
    return {
        bloqueado: false,
        intentosRestantes: MAX_INTENTOS - registro.intentos,
        tiempoRestante: 0
    };
}

/**
 * Registra un login exitoso, reiniciando el contador de intentos fallidos.
 * @param {string} username
 */
function registrarExito(username) {
    intentosStore.delete(username);
}

/**
 * Middleware de Express que verifica bloqueo antes de permitir el intento de login.
 * Espera que req.body.usuario contenga el nombre de usuario.
 */
function rateLimitMiddleware(req, res, next) {
    const username = req.body.usuario || req.body.nombre_usuario || req.body.username;

    if (!username) {
        return next();
    }

    const { bloqueado, tiempoRestante } = verificarBloqueo(username);

    if (bloqueado) {
        return res.status(429).json({
            tipo: 'BLOQUEO_TEMPORAL',
            mensaje: `Demasiados intentos fallidos. Intente nuevamente en ${tiempoRestante} segundos`,
            tiempo_restante: tiempoRestante
        });
    }

    next();
}

/**
 * Limpia el store de intentos (útil para testing).
 */
function limpiarStore() {
    intentosStore.clear();
}

module.exports = {
    rateLimitMiddleware,
    registrarIntentoFallido,
    registrarExito,
    verificarBloqueo,
    limpiarStore,
    MAX_INTENTOS,
    TIEMPO_BLOQUEO_MS
};
