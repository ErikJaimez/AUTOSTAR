import axios from 'axios';

// Token almacenado en memoria (no localStorage por seguridad)
let accessToken = null;

export function getToken() {
    return accessToken;
}

export function setToken(token) {
    accessToken = token;
}

export function clearToken() {
    accessToken = null;
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor: adjuntar JWT en cada solicitud
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Configuración de reintentos
const MAX_REINTENTOS = 3;
const BACKOFF_INICIAL_MS = 1000;

/**
 * Determina si un error es retriable (error de red o 5xx)
 * No reintenta en errores 4xx (incluido 401)
 */
function esErrorRetriable(error) {
    // Error de red (sin respuesta del servidor)
    if (!error.response) return true;

    const status = error.response.status;

    // Solo reintentar en errores de servidor (5xx)
    // No reintentar en 4xx (401, 403, 404, 400, etc.)
    return status >= 500;
}

/**
 * Espera un tiempo determinado (para backoff exponencial)
 * @param {number} ms
 */
function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Interceptor: manejo de errores centralizados con lógica de reintento
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        // Manejo de 401 — sesión expirada, no reintentar
        if (error.response?.status === 401) {
            clearToken();
            const currentPath = window.location.pathname;
            if (currentPath !== '/auth/login') {
                window.location.href = '/auth/login?sesionExpirada=1';
            }
            return Promise.reject(error);
        }

        // Inicializar contador de reintentos
        if (!config._retryCount) {
            config._retryCount = 0;
        }

        // Verificar si debemos reintentar
        if (esErrorRetriable(error) && config._retryCount < MAX_REINTENTOS) {
            config._retryCount += 1;

            // Backoff exponencial: 1s, 2s, 4s
            const tiempoEspera = BACKOFF_INICIAL_MS * Math.pow(2, config._retryCount - 1);

            await esperar(tiempoEspera);

            // Reintentar la solicitud con la misma configuración
            return api(config);
        }

        // Después de agotar reintentos o si no es retriable, rechazar
        return Promise.reject(error);
    }
);

export default api;
