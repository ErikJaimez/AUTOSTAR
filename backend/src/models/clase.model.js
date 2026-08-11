const db = require('../config/database');

/**
 * Modelo de Clase.
 * Métodos de acceso a datos para la tabla `clases`.
 */
const ClaseModel = {
    /**
     * Busca una clase por su ID con datos relacionados.
     * @param {string} id - UUID de la clase
     * @returns {Promise<Object|null>} La clase encontrada o null
     */
    async findById(id) {
        const clase = await db('clases')
            .select(
                'clases.*',
                'instructores.nombre_completo as instructor_nombre',
                'reservaciones.folio as reservacion_folio',
                'reservaciones.cliente_id',
                'reservaciones.curso_id',
                'cursos.nombre as curso_nombre',
                'cursos.duracion_horas as curso_duracion_horas',
                'clientes.nombre_completo as cliente_nombre'
            )
            .leftJoin('instructores', 'clases.instructor_id', 'instructores.id')
            .leftJoin('reservaciones', 'clases.reservacion_id', 'reservaciones.id')
            .leftJoin('cursos', 'reservaciones.curso_id', 'cursos.id')
            .leftJoin('clientes', 'reservaciones.cliente_id', 'clientes.id')
            .where('clases.id', id)
            .first();

        return clase || null;
    },

    /**
     * Lista clases con filtros opcionales.
     * @param {Object} filtros - Filtros: reservacion_id, instructor_id, estado, fecha_desde, fecha_hasta
     * @returns {Promise<Array>} Lista de clases con datos relacionados
     */
    async findWithFilters(filtros = {}) {
        const query = db('clases')
            .select(
                'clases.*',
                'instructores.nombre_completo as instructor_nombre',
                'reservaciones.folio as reservacion_folio',
                'reservaciones.cliente_id',
                'reservaciones.curso_id',
                'cursos.nombre as curso_nombre',
                'clientes.nombre_completo as cliente_nombre'
            )
            .leftJoin('instructores', 'clases.instructor_id', 'instructores.id')
            .leftJoin('reservaciones', 'clases.reservacion_id', 'reservaciones.id')
            .leftJoin('cursos', 'reservaciones.curso_id', 'cursos.id')
            .leftJoin('clientes', 'reservaciones.cliente_id', 'clientes.id');

        if (filtros.reservacion_id) {
            query.where('clases.reservacion_id', filtros.reservacion_id);
        }

        if (filtros.instructor_id) {
            query.where('clases.instructor_id', filtros.instructor_id);
        }

        if (filtros.estado) {
            query.where('clases.estado', filtros.estado);
        }

        if (filtros.fecha_desde) {
            query.where('clases.fecha', '>=', filtros.fecha_desde);
        }

        if (filtros.fecha_hasta) {
            query.where('clases.fecha', '<=', filtros.fecha_hasta);
        }

        return query.orderBy('clases.fecha', 'desc').orderBy('clases.hora_inicio', 'asc');
    },

    /**
     * Obtiene todas las clases de una reservación.
     * @param {string} reservacionId - UUID de la reservación
     * @returns {Promise<Array>} Lista de clases de la reservación
     */
    async findByReservacion(reservacionId) {
        return db('clases')
            .select(
                'clases.*',
                'instructores.nombre_completo as instructor_nombre'
            )
            .leftJoin('instructores', 'clases.instructor_id', 'instructores.id')
            .where('clases.reservacion_id', reservacionId)
            .orderBy('clases.fecha', 'asc')
            .orderBy('clases.hora_inicio', 'asc');
    },

    /**
     * Obtiene todas las clases completadas de una reservación.
     * @param {string} reservacionId - UUID de la reservación
     * @returns {Promise<Array>} Lista de clases completadas
     */
    async findCompletadasByReservacion(reservacionId) {
        return db('clases')
            .where({ reservacion_id: reservacionId, estado: 'completada' })
            .orderBy('fecha', 'asc');
    },

    /**
     * Crea una nueva clase.
     * @param {Object} datos - Datos de la clase
     * @returns {Promise<Object>} La clase creada
     */
    async create(datos) {
        const [clase] = await db('clases')
            .insert({
                reservacion_id: datos.reservacion_id,
                instructor_id: datos.instructor_id,
                slot_horario_id: datos.slot_horario_id,
                fecha: datos.fecha,
                hora_inicio: datos.hora_inicio,
                hora_fin: datos.hora_fin,
                estado: datos.estado || 'programada'
            })
            .returning('*');

        return clase;
    },

    /**
     * Actualiza el estado de una clase.
     * @param {string} id - UUID de la clase
     * @param {string} nuevoEstado - Nuevo estado ('completada' o 'cancelada')
     * @returns {Promise<Object|null>} La clase actualizada o null
     */
    async updateEstado(id, nuevoEstado) {
        const [clase] = await db('clases')
            .where({ id })
            .update({
                estado: nuevoEstado,
                updated_at: db.fn.now()
            })
            .returning('*');

        return clase || null;
    },

    /**
     * Calcula las horas completadas de una reservación.
     * Suma las duraciones (hora_fin - hora_inicio) de clases completadas.
     * @param {string} reservacionId - UUID de la reservación
     * @returns {Promise<number>} Horas completadas como número decimal
     */
    async calcularHorasCompletadas(reservacionId) {
        const result = await db('clases')
            .where({ reservacion_id: reservacionId, estado: 'completada' })
            .select(db.raw("COALESCE(SUM(EXTRACT(EPOCH FROM (hora_fin::time - hora_inicio::time)) / 3600), 0) as horas_completadas"))
            .first();

        return parseFloat(result.horas_completadas);
    }
};

module.exports = ClaseModel;
