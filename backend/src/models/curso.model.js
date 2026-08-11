const db = require('../config/database');

/**
 * Modelo de Curso.
 * Métodos de acceso a datos para la tabla `cursos`.
 */
const CursoModel = {
    /**
     * Obtiene todos los cursos con estado activo.
     * @returns {Promise<Array>} Lista de cursos activos
     */
    async findActivos() {
        return db('cursos')
            .where({ activo: true })
            .orderBy('categoria_licencia')
            .orderBy('nombre');
    },

    /**
     * Obtiene todos los cursos (activos e inactivos) para el panel admin.
     * @returns {Promise<Array>} Lista de todos los cursos
     */
    async findAll() {
        return db('cursos')
            .orderBy('created_at', 'desc');
    },

    /**
     * Busca un curso por su ID.
     * @param {string} id - UUID del curso
     * @returns {Promise<Object|null>} El curso encontrado o null
     */
    async findById(id) {
        const curso = await db('cursos').where({ id }).first();
        return curso || null;
    },

    /**
     * Busca un curso activo por su ID (para endpoints públicos).
     * @param {string} id - UUID del curso
     * @returns {Promise<Object|null>} El curso activo encontrado o null
     */
    async findActivoById(id) {
        const curso = await db('cursos')
            .where({ id, activo: true })
            .first();
        return curso || null;
    },

    /**
     * Crea un nuevo curso.
     * @param {Object} datos - Datos del curso
     * @returns {Promise<Object>} El curso creado
     */
    async create(datos) {
        const [curso] = await db('cursos')
            .insert({
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                descripcion_resumida: datos.descripcion_resumida || null,
                duracion_horas: datos.duracion_horas,
                precio: datos.precio,
                categoria_licencia: datos.categoria_licencia,
                requisitos_previos: datos.requisitos_previos || null,
                activo: datos.activo !== undefined ? datos.activo : true
            })
            .returning('*');

        return curso;
    },

    /**
     * Actualiza un curso existente.
     * @param {string} id - UUID del curso
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object|null>} El curso actualizado o null si no existe
     */
    async update(id, datos) {
        const updateData = { updated_at: db.fn.now() };

        if (datos.nombre !== undefined) updateData.nombre = datos.nombre;
        if (datos.descripcion !== undefined) updateData.descripcion = datos.descripcion;
        if (datos.descripcion_resumida !== undefined) updateData.descripcion_resumida = datos.descripcion_resumida;
        if (datos.duracion_horas !== undefined) updateData.duracion_horas = datos.duracion_horas;
        if (datos.precio !== undefined) updateData.precio = datos.precio;
        if (datos.categoria_licencia !== undefined) updateData.categoria_licencia = datos.categoria_licencia;
        if (datos.requisitos_previos !== undefined) updateData.requisitos_previos = datos.requisitos_previos;
        if (datos.activo !== undefined) updateData.activo = datos.activo;

        const [curso] = await db('cursos')
            .where({ id })
            .update(updateData)
            .returning('*');

        return curso || null;
    },

    /**
     * Elimina un curso por su ID.
     * @param {string} id - UUID del curso
     * @returns {Promise<number>} Número de filas eliminadas (0 o 1)
     */
    async delete(id) {
        return db('cursos').where({ id }).del();
    },

    /**
     * Cuenta las reservaciones activas (estado != 'cancelada') para un curso.
     * @param {string} cursoId - UUID del curso
     * @returns {Promise<number>} Cantidad de reservaciones activas
     */
    async contarReservacionesActivas(cursoId) {
        const result = await db('reservaciones')
            .where({ curso_id: cursoId })
            .whereNot({ estado: 'cancelada' })
            .count('id as total')
            .first();

        return parseInt(result.total, 10);
    }
};

module.exports = CursoModel;
