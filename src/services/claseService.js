import api from './api';

/**
 * Servicio de clases — encapsula las llamadas HTTP al backend
 */
const claseService = {
    /**
     * Listar clases con filtros opcionales (admin)
     * @param {Object} params - Parámetros de consulta
     * @param {string} [params.estado] - Filtro por estado
     * @param {string} [params.instructor_id] - Filtro por instructor
     * @param {string} [params.curso_id] - Filtro por curso
     * @param {string} [params.fecha_desde] - Filtro fecha inicio
     * @param {string} [params.fecha_hasta] - Filtro fecha fin
     * @returns {Promise<Array>}
     */
    async listar(params = {}) {
        const query = {};
        if (params.estado) query.estado = params.estado;
        if (params.instructor_id) query.instructor_id = params.instructor_id;
        if (params.curso_id) query.curso_id = params.curso_id;
        if (params.fecha_desde) query.fecha_desde = params.fecha_desde;
        if (params.fecha_hasta) query.fecha_hasta = params.fecha_hasta;

        const response = await api.get('/admin/clases', { params: query });
        return response.data;
    },

    /**
     * Marcar una clase como completada (admin)
     * @param {string} id - ID de la clase
     * @returns {Promise<Object>}
     */
    async completar(id) {
        const response = await api.patch(`/admin/clases/${id}/completar`);
        return response.data;
    },

    /**
     * Cancelar una clase con motivo (admin)
     * @param {string} id - ID de la clase
     * @param {string} motivo - Motivo de cancelación (10-500 caracteres)
     * @returns {Promise<Object>}
     */
    async cancelar(id, motivo) {
        const response = await api.post(`/admin/clases/${id}/cancelar`, { motivo });
        return response.data;
    },

    /**
     * Reprogramar una clase cancelada (admin)
     * @param {string} id - ID de la clase cancelada
     * @param {Object} datos - Datos de reprogramación
     * @param {string} datos.slot_horario_id - ID del nuevo slot de horario
     * @param {string} datos.fecha - Nueva fecha
     * @param {string} datos.hora_inicio - Nueva hora de inicio
     * @param {string} datos.hora_fin - Nueva hora de fin
     * @returns {Promise<Object>}
     */
    async reprogramar(id, datos) {
        const response = await api.post(`/admin/clases/${id}/reprogramar`, datos);
        return response.data;
    },

    /**
     * Obtener historial de cancelaciones (admin)
     * @param {Object} params - Parámetros de consulta
     * @param {string} [params.instructor_id] - Filtro por instructor
     * @param {string} [params.curso_id] - Filtro por curso
     * @param {string} [params.fecha_desde] - Filtro fecha inicio
     * @param {string} [params.fecha_hasta] - Filtro fecha fin
     * @param {number} [params.page] - Página
     * @returns {Promise<Object>} - { data, total, page, per_page }
     */
    async listarCancelaciones(params = {}) {
        const query = {};
        if (params.instructor_id) query.instructor_id = params.instructor_id;
        if (params.curso_id) query.curso_id = params.curso_id;
        if (params.fecha_desde) query.fecha_desde = params.fecha_desde;
        if (params.fecha_hasta) query.fecha_hasta = params.fecha_hasta;
        if (params.page) query.page = params.page;

        const response = await api.get('/admin/cancelaciones', { params: query });
        return response.data;
    },

    /**
     * Obtener avance de horas de un cliente (admin)
     * @param {string} clienteId - ID del cliente
     * @returns {Promise<Object>} - { horas_totales, horas_completadas, horas_pendientes, porcentaje, clases, curso_finalizado }
     */
    async obtenerAvance(clienteId) {
        const response = await api.get(`/admin/clientes/${clienteId}/avance`);
        return response.data;
    }
};

export default claseService;
