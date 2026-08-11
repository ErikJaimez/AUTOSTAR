const db = require('../config/database');

/**
 * Modelo de Usuario.
 * Métodos de acceso a datos para la tabla `usuarios`.
 */
const UsuarioModel = {
    /**
     * Busca un usuario por nombre de usuario.
     * @param {string} nombreUsuario
     * @returns {Promise<Object|null>} El usuario encontrado o null
     */
    async findByUsername(nombreUsuario) {
        const usuario = await db('usuarios')
            .where({ nombre_usuario: nombreUsuario })
            .first();

        return usuario || null;
    },

    /**
     * Incrementa el contador de intentos fallidos del usuario.
     * Si alcanza 5 intentos, establece bloqueado_hasta a 5 minutos desde ahora.
     * @param {string} id - UUID del usuario
     * @returns {Promise<Object>} Usuario actualizado
     */
    async incrementarIntentos(id) {
        const usuario = await db('usuarios').where({ id }).first();

        if (!usuario) return null;

        const nuevosIntentos = (usuario.intentos_fallidos || 0) + 1;
        const updateData = {
            intentos_fallidos: nuevosIntentos,
            updated_at: db.fn.now()
        };

        // Bloquear si alcanza 5 intentos
        if (nuevosIntentos >= 5) {
            const bloqueadoHasta = new Date(Date.now() + 5 * 60 * 1000);
            updateData.bloqueado_hasta = bloqueadoHasta;
        }

        await db('usuarios').where({ id }).update(updateData);

        return db('usuarios').where({ id }).first();
    },

    /**
     * Reinicia el contador de intentos fallidos y elimina el bloqueo.
     * @param {string} id - UUID del usuario
     * @returns {Promise<void>}
     */
    async resetearIntentos(id) {
        await db('usuarios').where({ id }).update({
            intentos_fallidos: 0,
            bloqueado_hasta: null,
            updated_at: db.fn.now()
        });
    },

    /**
     * Verifica si un usuario está actualmente bloqueado.
     * @param {string} id - UUID del usuario
     * @returns {Promise<{ bloqueado: boolean, tiempoRestante: number }>} tiempoRestante en segundos
     */
    async verificarBloqueo(id) {
        const usuario = await db('usuarios').where({ id }).first();

        if (!usuario || !usuario.bloqueado_hasta) {
            return { bloqueado: false, tiempoRestante: 0 };
        }

        const ahora = Date.now();
        const bloqueadoHasta = new Date(usuario.bloqueado_hasta).getTime();

        if (ahora < bloqueadoHasta) {
            const tiempoRestante = Math.ceil((bloqueadoHasta - ahora) / 1000);
            return { bloqueado: true, tiempoRestante };
        }

        // El bloqueo expiró, reiniciar
        await this.resetearIntentos(id);
        return { bloqueado: false, tiempoRestante: 0 };
    }
};

module.exports = UsuarioModel;
