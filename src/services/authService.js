import api from './api';

/**
 * Servicio de autenticación — encapsula las llamadas HTTP al backend
 */
const authService = {
    /**
     * Iniciar sesión con credenciales
     * @param {{ usuario: string, contrasena: string }} credenciales
     * @returns {Promise<{ token: string, usuario: object }>}
     */
    async login(credenciales) {
        const response = await api.post('/auth/login', {
            nombre_usuario: credenciales.usuario,
            contrasena: credenciales.contrasena
        });
        return response.data;
    },

    /**
     * Cerrar sesión activa
     * @returns {Promise<void>}
     */
    async logout() {
        await api.post('/auth/logout');
    },

    /**
     * Verificar si la sesión actual es válida
     * @returns {Promise<{ usuario: object }>}
     */
    async verificarSesion() {
        const response = await api.get('/auth/me');
        return response.data;
    }
};

export default authService;
