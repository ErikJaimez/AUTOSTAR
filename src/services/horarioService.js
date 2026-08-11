import api from './api';

/**
 * Servicio de horarios — encapsula las llamadas HTTP al backend
 */
const horarioService = {
    /**
     * Listar horarios disponibles por curso (público)
     * @param {string} cursoId - UUID del curso
     * @param {Object} [params] - Parámetros opcionales (semana, etc.)
     * @returns {Promise<Array>}
     */
    async listarPorCurso(cursoId, params = {}) {
        const response = await api.get(`/cursos/${cursoId}/horarios`, { params });
        return response.data;
    },

    /**
     * Listar todos los slots de horario (admin)
     * @param {Object} [params] - Filtros opcionales
     * @returns {Promise<Array>}
     */
    async listar(params = {}) {
        const response = await api.get('/admin/horarios', { params });
        return response.data;
    },

    /**
     * Crear un nuevo slot de horario (admin)
     * @param {{ curso_id: string, instructor_id: string, fecha: string, hora_inicio: string, hora_fin: string, capacidad_maxima: number }} datos
     * @returns {Promise<Object>}
     */
    async crear(datos) {
        const response = await api.post('/admin/horarios', datos);
        return response.data;
    },

    /**
     * Actualizar un slot de horario existente (admin)
     * @param {string} id - UUID del slot
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    async actualizar(id, datos) {
        const response = await api.put(`/admin/horarios/${id}`, datos);
        return response.data;
    },

    /**
     * Eliminar un slot de horario (admin)
     * @param {string} id - UUID del slot
     * @returns {Promise<Object>}
     */
    async eliminar(id) {
        const response = await api.delete(`/admin/horarios/${id}`);
        return response.data;
    }
};

export default horarioService;
