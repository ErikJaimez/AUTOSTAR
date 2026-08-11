import api from './api';

/**
 * Servicio de reservaciones — encapsula las llamadas HTTP al backend
 */
const reservacionService = {
    /**
     * Crear una reservación (público)
     * @param {Object} datos - Datos del formulario de reservación
     * @returns {Promise<Object>} - { folio, ... }
     */
    async crear(datos) {
        const response = await api.post('/reservaciones', datos);
        return response.data;
    },

    /**
     * Listar reservaciones con filtros y paginación (admin)
     * @param {Object} params - Parámetros de consulta
     * @param {number} params.page - Página actual
     * @param {string} [params.estado] - Filtro por estado
     * @param {string} [params.curso_id] - Filtro por curso
     * @param {string} [params.instructor_id] - Filtro por instructor
     * @param {string} [params.fecha_desde] - Filtro fecha inicio
     * @param {string} [params.fecha_hasta] - Filtro fecha fin
     * @returns {Promise<Object>} - { data, total, page, per_page }
     */
    async listar(params = {}) {
        const query = {};
        if (params.page) query.page = params.page;
        if (params.estado) query.estado = params.estado;
        if (params.curso_id) query.curso_id = params.curso_id;
        if (params.instructor_id) query.instructor_id = params.instructor_id;
        if (params.fecha_desde) query.fecha_desde = params.fecha_desde;
        if (params.fecha_hasta) query.fecha_hasta = params.fecha_hasta;

        const response = await api.get('/admin/reservaciones', { params: query });
        return response.data;
    },

    /**
     * Cambiar estado de una reservación (admin)
     * @param {string} id - ID de la reservación
     * @param {string} nuevoEstado - Nuevo estado (confirmada, completada, cancelada)
     * @returns {Promise<Object>}
     */
    async cambiarEstado(id, nuevoEstado) {
        const response = await api.patch(`/admin/reservaciones/${id}/estado`, { estado: nuevoEstado });
        return response.data;
    }
};

export default reservacionService;
