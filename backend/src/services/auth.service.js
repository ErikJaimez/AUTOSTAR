const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const UsuarioModel = require('../models/usuario.model');
const { registrarIntentoFallido, registrarExito, verificarBloqueo } = require('../middlewares/rateLimit');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Servicio de autenticación.
 * Contiene la lógica de negocio para login, verificación de sesión y logout.
 */
const AuthService = {
    /**
     * Procesa un intento de login.
     * Flujo:
     * 1. Verifica bloqueo en memoria (rate limiter)
     * 2. Busca usuario por nombre_usuario
     * 3. Verifica bloqueo en BD (persistente)
     * 4. Verifica que el usuario esté activo
     * 5. Compara contraseña con hash almacenado
     * 6. Si éxito: resetear intentos, generar JWT
     * 7. Si fallo: incrementar intentos
     *
     * @param {string} nombreUsuario
     * @param {string} contrasena
     * @returns {Promise<{ token: string, usuario: Object }>}
     * @throws {AppError} En caso de credenciales inválidas o bloqueo
     */
    async login(nombreUsuario, contrasena) {
        // 1. Verificar bloqueo en memoria (rate limiter)
        const bloqueoMemoria = verificarBloqueo(nombreUsuario);
        if (bloqueoMemoria.bloqueado) {
            const error = new AppError(
                'BLOQUEO_TEMPORAL',
                `Demasiados intentos fallidos. Intente nuevamente en ${bloqueoMemoria.tiempoRestante} segundos`,
                429
            );
            error.tiempoRestante = bloqueoMemoria.tiempoRestante;
            throw error;
        }

        // 2. Buscar usuario en BD
        const usuario = await UsuarioModel.findByUsername(nombreUsuario);

        if (!usuario) {
            // Registrar intento fallido en rate limiter aunque el usuario no exista
            registrarIntentoFallido(nombreUsuario);
            throw new AppError(
                'AUTENTICACION',
                'Credenciales inválidas',
                401
            );
        }

        // 3. Verificar bloqueo en BD (persistente)
        const bloqueoBD = await UsuarioModel.verificarBloqueo(usuario.id);
        if (bloqueoBD.bloqueado) {
            const error = new AppError(
                'BLOQUEO_TEMPORAL',
                `Demasiados intentos fallidos. Intente nuevamente en ${bloqueoBD.tiempoRestante} segundos`,
                429
            );
            error.tiempoRestante = bloqueoBD.tiempoRestante;
            throw error;
        }

        // 4. Verificar que el usuario esté activo
        if (!usuario.activo) {
            throw new AppError(
                'AUTENTICACION',
                'Credenciales inválidas',
                401
            );
        }

        // 5. Comparar contraseña
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);

        if (!contrasenaValida) {
            // 7. Incrementar intentos fallidos
            await UsuarioModel.incrementarIntentos(usuario.id);
            registrarIntentoFallido(nombreUsuario);

            throw new AppError(
                'AUTENTICACION',
                'Credenciales inválidas',
                401
            );
        }

        // 6. Login exitoso: resetear intentos y generar JWT
        await UsuarioModel.resetearIntentos(usuario.id);
        registrarExito(nombreUsuario);

        const token = jwt.sign(
            {
                id: usuario.id,
                nombre: usuario.nombre_usuario,
                email: usuario.email
            },
            jwtConfig.secret,
            {
                expiresIn: jwtConfig.expiresIn,
                algorithm: jwtConfig.algorithm
            }
        );

        return {
            token,
            usuario: {
                id: usuario.id,
                nombre_usuario: usuario.nombre_usuario,
                email: usuario.email
            }
        };
    },

    /**
     * Cierra la sesión del usuario.
     * Por ahora solo retorna éxito (la invalidación real del token
     * se manejará con una blacklist en una iteración futura).
     *
     * @returns {Promise<{ mensaje: string }>}
     */
    async logout() {
        return { mensaje: 'Sesión cerrada exitosamente' };
    },

    /**
     * Obtiene los datos del usuario autenticado desde el token decodificado.
     *
     * @param {Object} usuarioToken - Datos del usuario extraídos del JWT { id, nombre, email }
     * @returns {Promise<Object>} Datos del usuario
     */
    async obtenerUsuarioActual(usuarioToken) {
        const usuario = await UsuarioModel.findByUsername(usuarioToken.nombre);

        if (!usuario) {
            throw new AppError(
                'NO_ENCONTRADO',
                'Usuario no encontrado',
                404
            );
        }

        return {
            id: usuario.id,
            nombre_usuario: usuario.nombre_usuario,
            email: usuario.email,
            activo: usuario.activo
        };
    }
};

module.exports = AuthService;
