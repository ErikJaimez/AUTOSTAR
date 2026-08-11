import api from './api';

/**
 * Servicio de cursos — encapsula las llamadas HTTP al backend
 */
const cursoService = {
    /**
     * Listar cursos activos (público)
     * @returns {Promise<Array>}
     */
    async listarActivos() {
        const response = await api.get('/cursos');
        return response.data;
    },

    /**
     * Obtener detalle de un curso (público)
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async obtenerDetalle(id) {
        const response = await api.get(`/cursos/${id}`);
        return response.data;
    },

    /**
     * Crear un nuevo curso (admin)
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    async crear(datos) {
        const response = await api.post('/admin/cursos', datos);
        return response.data;
    },

    /**
     * Actualizar un curso existente (admin)
     * @param {string} id
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    async actualizar(id, datos) {
        const response = await api.put(`/admin/cursos/${id}`, datos);
        return response.data;
    },

    /**
     * Eliminar un curso (admin)
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async eliminar(id) {
        const response = await api.delete(`/admin/cursos/${id}`);
        return response.data;
    }
};

export default cursoService;
