const AuthService = require('../services/auth.service');

/**
 * Controlador de autenticación.
 * Handlers de Express para los endpoints de login, logout y verificación de sesión.
 */
const AuthController = {
    /**
     * POST /api/auth/login
     * Procesa un intento de inicio de sesión.
     *
     * Body: { nombre_usuario, contrasena }
     * Respuesta exitosa: 200 { token, usuario }
     * Errores: 401 (credenciales inválidas), 429 (bloqueo temporal)
     */
    async login(req, res, next) {
        try {
            const { nombre_usuario, contrasena } = req.body;

            const resultado = await AuthService.login(nombre_usuario, contrasena);

            return res.status(200).json(resultado);
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/auth/logout
     * Cierra la sesión del usuario autenticado.
     *
     * Requiere: authMiddleware
     * Respuesta: 200 { mensaje }
     */
    async logout(req, res, next) {
        try {
            const resultado = await AuthService.logout();

            return res.status(200).json(resultado);
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/auth/me
     * Retorna los datos del usuario autenticado.
     *
     * Requiere: authMiddleware
     * Respuesta: 200 { id, nombre_usuario, email, activo }
     */
    async me(req, res, next) {
        try {
            const usuario = await AuthService.obtenerUsuarioActual(req.usuario);

            return res.status(200).json(usuario);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = AuthController;
