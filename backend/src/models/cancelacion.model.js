const db = require('../config/database');

/**
 * Modelo de Cancelación.
 * Métodos de acceso a datos para la tabla `cancelaciones`.
 */
const CancelacionModel = {
    /**
     * Busca una cancelación por su ID.
     * @param {string} id - UUID de la cancelación
     * @returns {Promise<Object|null>} La cancelación encontrada o null
     */
    async findById(id) {
        const cancelacion = await db('cancelaciones')
            .select(
                'cancelaciones.*',
                'clases.fecha as clase_fecha',
                'clases.hora_inicio as clase_hora_inicio',
                'clases.hora_fin as clase_hora_fin',
                'usuarios.nombre_usuario as admin_nombre'
            )
            .leftJoin('clases', 'cancelaciones.clase_id', 'clases.id')
            .leftJoin('usuarios', 'cancelaciones.admin_id', 'usuarios.id')
            .where('cancelaciones.id', id)
            .first();

        return cancelacion || null;
    },

    /**
     * Busca la cancelación asociada a una clase.
     * @param {string} claseId - UUID de la clase
     * @returns {Promise<Object|null>} La cancelación encontrada o null
     */
    async findByClaseId(claseId) {
        const cancelacion = await db('cancelaciones')
            .where({ clase_id: claseId })
            .first();

        return cancelacion || null;
    },

    /**
     * Lista cancelaciones con paginación y filtros.
     * Filtros: instructor_id, curso_id, fecha_desde, fecha_hasta.
     * Máximo 50 registros por página.
     * @param {Object} filtros - Filtros a aplicar
     * @param {number} pagina - Número de página (1-indexed)
     * @returns {Promise<{cancelaciones: Array, total: number, pagina: number, porPagina: number, totalPaginas: number}>}
     */
    async findWithFilters(filtros = {}, pagina = 1) {
        const porPagina = 50;

        const query = db('cancelaciones')
            .select(
                'cancelaciones.*',
                'clases.fecha as clase_fecha',
                'clases.hora_inicio as clase_hora_inicio',
                'clases.hora_fin as clase_hora_fin',
                'clases.instructor_id',
                'instructores.nombre_completo as instructor_nombre',
                'reservaciones.curso_id',
                'cursos.nombre as curso_nombre',
                'clientes.nombre_completo as cliente_nombre',
                'usuarios.nombre_usuario as admin_nombre'
            )
            .leftJoin('clases', 'cancelaciones.clase_id', 'clases.id')
            .leftJoin('instructores', 'clases.instructor_id', 'instructores.id')
            .leftJoin('reservaciones', 'clases.reservacion_id', 'reservaciones.id')
            .leftJoin('cursos', 'reservaciones.curso_id', 'cursos.id')
            .leftJoin('clientes', 'reservaciones.cliente_id', 'clientes.id')
            .leftJoin('usuarios', 'cancelaciones.admin_id', 'usuarios.id');

        // Aplicar filtros
        if (filtros.instructor_id) {
            query.where('clases.instructor_id', filtros.instructor_id);
        }

        if (filtros.curso_id) {
            query.where('reservaciones.curso_id', filtros.curso_id);
        }

        if (filtros.fecha_desde) {
            query.where('cancelaciones.fecha_cancelacion', '>=', filtros.fecha_desde);
        }

        if (filtros.fecha_hasta) {
            query.where('cancelaciones.fecha_cancelacion', '<=', filtros.fecha_hasta);
        }

        // Contar total para paginación
        const countQuery = query.clone().clearSelect().clearOrder().count('cancelaciones.id as total').first();
        const { total } = await countQuery;
        const totalRegistros = parseInt(total, 10);

        // Aplicar paginación y orden
        const offset = (pagina - 1) * porPagina;
        const cancelaciones = await query
            .orderBy('cancelaciones.fecha_cancelacion', 'desc')
            .limit(porPagina)
            .offset(offset);

        return {
            cancelaciones,
            total: totalRegistros,
            pagina,
            porPagina,
            totalPaginas: Math.ceil(totalRegistros / porPagina)
        };
    },

    /**
     * Crea un registro de cancelación.
     * @param {Object} datos - Datos de la cancelación
     * @returns {Promise<Object>} La cancelación creada
     */
    async create(datos) {
        const [cancelacion] = await db('cancelaciones')
            .insert({
                clase_id: datos.clase_id,
                admin_id: datos.admin_id,
                motivo: datos.motivo,
                fecha_cancelacion: db.fn.now()
            })
            .returning('*');

        return cancelacion;
    },

    /**
     * Actualiza el campo clase_reprogramada_id de una cancelación.
     * @param {string} id - UUID de la cancelación
     * @param {string} claseReprogramadaId - UUID de la nueva clase
     * @returns {Promise<Object|null>} La cancelación actualizada o null
     */
    async updateClaseReprogramada(id, claseReprogramadaId) {
        const [cancelacion] = await db('cancelaciones')
            .where({ id })
            .update({
                clase_reprogramada_id: claseReprogramadaId,
                updated_at: db.fn.now()
            })
            .returning('*');

        return cancelacion || null;
    }
};

module.exports = CancelacionModel;
