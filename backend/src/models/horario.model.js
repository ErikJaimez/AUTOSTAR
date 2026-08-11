const db = require('../config/database');

/**
 * Modelo de Horario (Slot de Horario).
 * Métodos de acceso a datos para la tabla `slots_horario`.
 */
const HorarioModel = {
    /**
     * Obtiene todos los slots de horario con información del curso e instructor.
     * Incluye el conteo de reservaciones activas por slot.
     * @returns {Promise<Array>} Lista de slots con detalles
     */
    async findAll() {
        return db('slots_horario')
            .select(
                'slots_horario.*',
                'cursos.nombre as curso_nombre',
                'instructores.nombre_completo as instructor_nombre',
                db.raw('COALESCE(reservaciones_count.total, 0) as reservaciones_count')
            )
            .leftJoin('cursos', 'slots_horario.curso_id', 'cursos.id')
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
            .orderBy('slots_horario.fecha', 'asc')
            .orderBy('slots_horario.hora_inicio', 'asc');
    },

    /**
     * Obtiene los slots disponibles para un curso en las próximas 4 semanas.
     * Incluye información de disponibilidad (reservaciones vs capacidad).
     * @param {string} cursoId - UUID del curso
     * @returns {Promise<Array>} Slots disponibles con info de disponibilidad
     */
    async findDisponiblesPorCurso(cursoId) {
        const hoy = new Date().toISOString().split('T')[0];
        const en4Semanas = new Date();
        en4Semanas.setDate(en4Semanas.getDate() + 28);
        const fechaLimite = en4Semanas.toISOString().split('T')[0];

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
            .where('slots_horario.fecha', '<=', fechaLimite)
            .orderBy('slots_horario.fecha', 'asc')
            .orderBy('slots_horario.hora_inicio', 'asc');
    },

    /**
     * Busca un slot de horario por su ID.
     * @param {string} id - UUID del slot
     * @returns {Promise<Object|null>} El slot encontrado o null
     */
    async findById(id) {
        const slot = await db('slots_horario').where({ id }).first();
        return slot || null;
    },

    /**
     * Crea un nuevo slot de horario.
     * @param {Object} datos - Datos del slot
     * @returns {Promise<Object>} El slot creado
     */
    async create(datos) {
        const [slot] = await db('slots_horario')
            .insert({
                curso_id: datos.curso_id,
                instructor_id: datos.instructor_id,
                fecha: datos.fecha,
                hora_inicio: datos.hora_inicio,
                hora_fin: datos.hora_fin,
                capacidad_maxima: datos.capacidad_maxima
            })
            .returning('*');

        return slot;
    },

    /**
     * Actualiza un slot de horario existente.
     * @param {string} id - UUID del slot
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object|null>} El slot actualizado o null si no existe
     */
    async update(id, datos) {
        const updateData = { updated_at: db.fn.now() };

        if (datos.curso_id !== undefined) updateData.curso_id = datos.curso_id;
        if (datos.instructor_id !== undefined) updateData.instructor_id = datos.instructor_id;
        if (datos.fecha !== undefined) updateData.fecha = datos.fecha;
        if (datos.hora_inicio !== undefined) updateData.hora_inicio = datos.hora_inicio;
        if (datos.hora_fin !== undefined) updateData.hora_fin = datos.hora_fin;
        if (datos.capacidad_maxima !== undefined) updateData.capacidad_maxima = datos.capacidad_maxima;

        const [slot] = await db('slots_horario')
            .where({ id })
            .update(updateData)
            .returning('*');

        return slot || null;
    },

    /**
     * Elimina un slot de horario por su ID.
     * @param {string} id - UUID del slot
     * @returns {Promise<number>} Cantidad de registros eliminados (0 o 1)
     */
    async delete(id) {
        return db('slots_horario').where({ id }).del();
    },

    /**
     * Detecta traslape de horario para un instructor en una fecha dada.
     * Dos intervalos [a,b) y [c,d) se traslapan si a < d AND c < b.
     * @param {string} instructorId - UUID del instructor
     * @param {string} fecha - Fecha (YYYY-MM-DD)
     * @param {string} horaInicio - Hora de inicio (HH:MM)
     * @param {string} horaFin - Hora de fin (HH:MM)
     * @param {string|null} excludeId - UUID del slot a excluir (para ediciones)
     * @returns {Promise<Object|null>} El slot en conflicto o null si no hay traslape
     */
    async detectarTraslape(instructorId, fecha, horaInicio, horaFin, excludeId = null) {
        const query = db('slots_horario')
            .select(
                'slots_horario.*',
                'cursos.nombre as curso_nombre'
            )
            .leftJoin('cursos', 'slots_horario.curso_id', 'cursos.id')
            .where('slots_horario.instructor_id', instructorId)
            .where('slots_horario.fecha', fecha)
            .where('slots_horario.hora_inicio', '<', horaFin)
            .where('slots_horario.hora_fin', '>', horaInicio);

        if (excludeId) {
            query.whereNot('slots_horario.id', excludeId);
        }

        const conflicto = await query.first();
        return conflicto || null;
    },

    /**
     * Cuenta las reservaciones activas (estado != 'cancelada') para un slot.
     * @param {string} slotId - UUID del slot
     * @returns {Promise<number>} Cantidad de reservaciones activas
     */
    async contarReservacionesActivas(slotId) {
        const result = await db('reservaciones')
            .where({ slot_horario_id: slotId })
            .where('estado', '!=', 'cancelada')
            .count('id as total')
            .first();

        return parseInt(result.total, 10);
    }
};

module.exports = HorarioModel;
