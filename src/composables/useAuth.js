import { clearToken, setToken } from '@/services/api';
import authService from '@/services/authService';
import { computed, reactive, ref } from 'vue';

// Estado compartido a nivel de módulo (singleton)
const estado = reactive({
    usuario: null // { id, nombre, email } | null
});

const cargando = ref(false);
const error = ref(null);

export function useAuth() {
    const usuario = computed(() => estado.usuario);
    const estaAutenticado = computed(() => estado.usuario !== null);

    /**
     * Iniciar sesión con credenciales
     * @param {{ usuario: string, contrasena: string }} credenciales
     */
    async function login(credenciales) {
        cargando.value = true;
        error.value = null;

        try {
            const data = await authService.login(credenciales);
            setToken(data.token);
            estado.usuario = data.usuario;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'Error al iniciar sesión';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Cerrar sesión activa
     */
    async function logout() {
        cargando.value = true;
        error.value = null;

        try {
            await authService.logout();
        } catch {
            // Incluso si falla la llamada al backend, limpiamos localmente
        } finally {
            clearToken();
            estado.usuario = null;
            cargando.value = false;
        }
    }

    /**
     * Verificar si existe una sesión válida
     * @returns {Promise<boolean>}
     */
    async function verificarSesion() {
        cargando.value = true;
        error.value = null;

        try {
            const data = await authService.verificarSesion();
            estado.usuario = data.usuario;
            return true;
        } catch {
            clearToken();
            estado.usuario = null;
            return false;
        } finally {
            cargando.value = false;
        }
    }

    return {
        usuario,
        estaAutenticado,
        cargando,
        error,
        login,
        logout,
        verificarSesion
    };
}
