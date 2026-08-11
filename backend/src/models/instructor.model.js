const db = require('../config/database');

/**
 * Modelo de Instructor.
 * Métodos de acceso a datos para la tabla `instructores`.
 */
const InstructorModel = {
    /**
     * Obtiene todos los instructores ordenados alfabéticamente por nombre,
     * incluyendo el conteo de clases asignadas.
     * @returns {Promise<Array>} Lista de instructores con clases_asignadas
     */
    async findAll() {
        return db('instructores')
            .select(
                'instructores.*',
                db.raw('COALESCE(clases_count.total, 0) as clases_asignadas')
            )
            .leftJoin(
                db('clases')
                    .select('instructor_id')
                    .count('id as total')
                    .where('estado', 'programada')
                    .groupBy('instructor_id')
                    .as('clases_count'),
                'instructores.id',
                'clases_count.instructor_id'
            )
            .orderBy('instructores.nombre_completo', 'asc');
    },

    /**
     * Busca un instructor por su ID.
     * @param {string} id - UUID del instructor
     * @returns {Promise<Object|null>} El instructor encontrado o null
     */
    async findById(id) {
        const instructor = await db('instructores').where({ id }).first();
        return instructor || null;
    },

    /**
     * Busca un instructor por su email.
     * @param {string} email - Email del instructor
     * @returns {Promise<Object|null>} El instructor encontrado o null
     */
    async findByEmail(email) {
        const instructor = await db('instructores')
            .where({ email })
            .first();
        return instructor || null;
    },

    /**
     * Crea un nuevo instructor.
     * @param {Object} datos - Datos del instructor
     * @returns {Promise<Object>} El instructor creado
     */
    async create(datos) {
        const [instructor] = await db('instructores')
            .insert({
                nombre_completo: datos.nombre_completo,
                telefono: datos.telefono,
                email: datos.email,
                activo: datos.activo !== undefined ? datos.activo : true
            })
            .returning('*');

        return instructor;
    },

    /**
     * Actualiza un instructor existente.
     * @param {string} id - UUID del instructor
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object|null>} El instructor actualizado o null si no existe
     */
    async update(id, datos) {
        const updateData = { updated_at: db.fn.now() };

        if (datos.nombre_completo !== undefined) updateData.nombre_completo = datos.nombre_completo;
        if (datos.telefono !== undefined) updateData.telefono = datos.telefono;
        if (datos.email !== undefined) updateData.email = datos.email;
        if (datos.activo !== undefined) updateData.activo = datos.activo;

        const [instructor] = await db('instructores')
            .where({ id })
            .update(updateData)
            .returning('*');

        return instructor || null;
    },

    /**
     * Cuenta las clases futuras programadas para un instructor.
     * @param {string} instructorId - UUID del instructor
     * @returns {Promise<number>} Cantidad de clases futuras programadas
     */
    async contarClasesFuturas(instructorId) {
        const result = await db('clases')
            .where({ instructor_id: instructorId, estado: 'programada' })
            .where('fecha', '>=', db.fn.now())
            .count('id as total')
            .first();

        return parseInt(result.total, 10);
    },

    /**
     * Obtiene las clases futuras programadas de un instructor (detalles).
     * @param {string} instructorId - UUID del instructor
     * @returns {Promise<Array>} Lista de clases futuras con detalles
     */
    async obtenerClasesFuturas(instructorId) {
        return db('clases')
            .select(
                'clases.*',
                'cursos.nombre as curso_nombre'
            )
            .leftJoin('slots_horario', 'clases.slot_horario_id', 'slots_horario.id')
            .leftJoin('cursos', 'slots_horario.curso_id', 'cursos.id')
            .where({ 'clases.instructor_id': instructorId, 'clases.estado': 'programada' })
            .where('clases.fecha', '>=', db.fn.now())
            .orderBy('clases.fecha', 'asc')
            .orderBy('clases.hora_inicio', 'asc');
    },

    /**
     * Obtiene la agenda semanal de un instructor.
     * Retorna las clases para una semana dada (lunes a domingo),
     * incluyendo nombre del curso y estado.
     * @param {string} instructorId - UUID del instructor
     * @param {string} fechaInicio - Fecha de inicio de la semana (formato YYYY-MM-DD)
     * @param {string} fechaFin - Fecha de fin de la semana (formato YYYY-MM-DD)
     * @returns {Promise<Array>} Lista de clases de la semana
     */
    async obtenerAgendaSemanal(instructorId, fechaInicio, fechaFin) {
        return db('clases')
            .select(
                'clases.id',
                'clases.fecha',
                'clases.hora_inicio',
                'clases.hora_fin',
                'clases.estado',
                'cursos.nombre as curso_nombre'
            )
            .leftJoin('slots_horario', 'clases.slot_horario_id', 'slots_horario.id')
            .leftJoin('cursos', 'slots_horario.curso_id', 'cursos.id')
            .where({ 'clases.instructor_id': instructorId })
            .whereBetween('clases.fecha', [fechaInicio, fechaFin])
            .orderBy('clases.fecha', 'asc')
            .orderBy('clases.hora_inicio', 'asc');
    }
};

module.exports = InstructorModel;
