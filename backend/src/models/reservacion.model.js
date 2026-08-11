const db = require('../config/database');

/**
 * Modelo de Reservación.
 * Métodos de acceso a datos para la tabla `reservaciones`.
 */
const ReservacionModel = {
    /**
     * Busca una reservación por su ID con datos relacionados.
     * @param {string} id - UUID de la reservación
     * @returns {Promise<Object|null>} La reservación encontrada o null
     */
    async findById(id) {
        const reservacion = await db('reservaciones')
            .select(
                'reservaciones.*',
                'clientes.nombre_completo as cliente_nombre',
                'clientes.email as cliente_email',
                'clientes.telefono as cliente_telefono',
                'cursos.nombre as curso_nombre',
                'slots_horario.fecha as slot_fecha',
                'slots_horario.hora_inicio as slot_hora_inicio',
                'slots_horario.hora_fin as slot_hora_fin',
                'instructores.nombre_completo as instructor_nombre'
            )
            .leftJoin('clientes', 'reservaciones.cliente_id', 'clientes.id')
            .leftJoin('cursos', 'reservaciones.curso_id', 'cursos.id')
            .leftJoin('slots_horario', 'reservaciones.slot_horario_id', 'slots_horario.id')
            .leftJoin('instructores', 'slots_horario.instructor_id', 'instructores.id')
            .where('reservaciones.id', id)
            .first();

        return reservacion || null;
    },

    /**
     * Busca una reservación por su folio.
     * @param {string} folio - Folio único de la reservación
     * @returns {Promise<Object|null>} La reservación encontrada o null
     */
    async findByFolio(folio) {
        const reservacion = await db('reservaciones')
            .where({ folio })
            .first();
        return reservacion || null;
    },

    /**
     * Lista reservaciones con paginación y filtros combinados.
     * Filtros: estado, curso_id, instructor_id, fecha_desde, fecha_hasta.
     * @param {Object} filtros - Filtros a aplicar
     * @param {number} pagina - Número de página (1-indexed)
     * @param {number} porPagina - Registros por página (default 20)
     * @returns {Promise<{reservaciones: Array, total: number, pagina: number, porPagina: number, totalPaginas: number}>}
     */
    async findWithFilters(filtros = {}, pagina = 1, porPagina = 20) {
        const query = db('reservaciones')
            .select(
                'reservaciones.*',
                'clientes.nombre_completo as cliente_nombre',
                'clientes.email as cliente_email',
                'cursos.nombre as curso_nombre',
                'slots_horario.fecha as slot_fecha',
                'slots_horario.hora_inicio as slot_hora_inicio',
                'slots_horario.hora_fin as slot_hora_fin',
                'instructores.nombre_completo as instructor_nombre'
            )
            .leftJoin('clientes', 'reservaciones.cliente_id', 'clientes.id')
            .leftJoin('cursos', 'reservaciones.curso_id', 'cursos.id')
            .leftJoin('slots_horario', 'reservaciones.slot_horario_id', 'slots_horario.id')
            .leftJoin('instructores', 'slots_horario.instructor_id', 'instructores.id');

        // Aplicar filtros combinados
        if (filtros.estado) {
            query.where('reservaciones.estado', filtros.estado);
        }

        if (filtros.curso_id) {
            query.where('reservaciones.curso_id', filtros.curso_id);
        }

        if (filtros.instructor_id) {
            query.where('slots_horario.instructor_id', filtros.instructor_id);
        }

        if (filtros.fecha_desde) {
            query.where('slots_horario.fecha', '>=', filtros.fecha_desde);
        }

        if (filtros.fecha_hasta) {
            query.where('slots_horario.fecha', '<=', filtros.fecha_hasta);
        }

        // Contar total para paginación
        const countQuery = query.clone().clearSelect().clearOrder().count('reservaciones.id as total').first();
        const { total } = await countQuery;
        const totalRegistros = parseInt(total, 10);

        // Aplicar paginación y orden
        const offset = (pagina - 1) * porPagina;
        const reservaciones = await query
            .orderBy('reservaciones.created_at', 'desc')
            .limit(porPagina)
            .offset(offset);

        return {
            reservaciones,
            total: totalRegistros,
            pagina,
            porPagina,
            totalPaginas: Math.ceil(totalRegistros / porPagina)
        };
    },

    /**
     * Crea una nueva reservación.
     * @param {Object} datos - Datos de la reservación
     * @returns {Promise<Object>} La reservación creada
     */
    async create(datos) {
        const [reservacion] = await db('reservaciones')
            .insert({
                folio: datos.folio,
                cliente_id: datos.cliente_id,
                slot_horario_id: datos.slot_horario_id,
                curso_id: datos.curso_id,
                estado: 'pendiente'
            })
            .returning('*');

        return reservacion;
    },

    /**
     * Actualiza el estado de una reservación.
     * @param {string} id - UUID de la reservación
     * @param {string} nuevoEstado - Nuevo estado
     * @returns {Promise<Object|null>} La reservación actualizada o null
     */
    async updateEstado(id, nuevoEstado) {
        const [reservacion] = await db('reservaciones')
            .where({ id })
            .update({
                estado: nuevoEstado,
                fecha_cambio_estado: db.fn.now(),
                updated_at: db.fn.now()
            })
            .returning('*');

        return reservacion || null;
    },

    /**
     * Cuenta las reservaciones activas (no canceladas) para un slot.
     * @param {string} slotHorarioId - UUID del slot
     * @returns {Promise<number>} Cantidad de reservaciones activas
     */
    async contarPorSlot(slotHorarioId) {
        const result = await db('reservaciones')
            .where({ slot_horario_id: slotHorarioId })
            .where('estado', '!=', 'cancelada')
            .count('id as total')
            .first();

        return parseInt(result.total, 10);
    },

    /**
     * Obtiene hasta 3 slots alternativos disponibles para el mismo curso.
     * Excluye el slot original y solo retorna slots con capacidad libre.
     * @param {string} cursoId - UUID del curso
     * @param {string} slotExcluirId - UUID del slot a excluir
     * @returns {Promise<Array>} Hasta 3 slots alternativos
     */
    async findAlternativas(cursoId, slotExcluirId) {
        const hoy = new Date().toISOString().split('T')[0];

        return db('slots_horario')
            .select(
                'slots_horario.*',
                'instructores.nombre_completo as instructor_nombre',
                db.raw('COALESCE(reservaciones_count.total, 0) as reservaciones_count')
            )
            .leftJoin('instructores', 'slots_horario.instructor_id', 'instructores.id')
            .leftJoin(
                db('reservaciones')
                    .select('slot_horario_id')
                    .count('id as total')
                    .where('estado', '!=', 'cancelada')
                    .groupBy('slot_horario_id')
                    .as('reservaciones_count'),
                'slots_horario.id',
                'reservaciones_count.slot_horario_id'
            )
            .where('slots_horario.curso_id', cursoId)
            .where('slots_horario.fecha', '>=', hoy)
            .whereNot('slots_horario.id', slotExcluirId)
            .whereRaw('COALESCE(reservaciones_count.total, 0) < slots_horario.capacidad_maxima')
            .orderBy('slots_horario.fecha', 'asc')
            .orderBy('slots_horario.hora_inicio', 'asc')
            .limit(3);
    }
};

module.exports = ReservacionModel;
