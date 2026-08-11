import api from './api';

/**
 * Servicio de instructores — encapsula las llamadas HTTP al backend
 */
const instructorService = {
    /**
     * Listar todos los instructores (ordenados alfabéticamente, con conteo de clases)
     * @returns {Promise<Array>}
     */
    async listar() {
        const response = await api.get('/admin/instructores');
        return response.data;
    },

    /**
     * Crear un nuevo instructor
     * @param {{ nombre_completo: string, telefono: string, email: string, activo: boolean }} datos
     * @returns {Promise<object>}
     */
    async crear(datos) {
        const response = await api.post('/admin/instructores', datos);
        return response.data;
    },

    /**
     * Actualizar un instructor existente
     * @param {string} id - UUID del instructor
     * @param {{ nombre_completo?: string, telefono?: string, email?: string, activo?: boolean }} datos
     * @returns {Promise<object>}
     */
    async actualizar(id, datos) {
        const response = await api.put(`/admin/instructores/${id}`, datos);
        return response.data;
    },

    /**
     * Obtener la agenda semanal de un instructor
     * @param {string} id - UUID del instructor
     * @param {string} [fecha] - Fecha en formato YYYY-MM-DD (inicio de semana). Si no se envía, usa la semana actual
     * @returns {Promise<object>}
     */
    async obtenerAgenda(id, fecha) {
        const params = {};
        if (fecha) params.fecha = fecha;
        const response = await api.get(`/admin/instructores/${id}/agenda`, { params });
        return response.data;
    }
};

export default instructorService;
