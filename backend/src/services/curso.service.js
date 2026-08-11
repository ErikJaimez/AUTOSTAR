const CursoModel = require('../models/curso.model');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Servicio de Cursos.
 * Contiene la lógica de negocio para la gestión de cursos.
 */
const CursoService = {
    /**
     * Obtiene la lista de cursos activos (endpoint público).
     * @returns {Promise<Array>} Lista de cursos activos
     */
    async listarActivos() {
        return CursoModel.findActivos();
    },

    /**
     * Obtiene la lista de todos los cursos (endpoint admin).
     * @returns {Promise<Array>} Lista de todos los cursos
     */
    async listarTodos() {
        return CursoModel.findAll();
    },

    /**
     * Obtiene el detalle de un curso activo por ID (endpoint público).
     * @param {string} id - UUID del curso
     * @returns {Promise<Object>} Curso encontrado
     * @throws {AppError} Si el curso no existe o no está activo
     */
    async obtenerActivoPorId(id) {
        const curso = await CursoModel.findActivoById(id);

        if (!curso) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El curso solicitado no fue encontrado',
                404
            );
        }

        return curso;
    },

    /**
     * Obtiene el detalle de un curso por ID (endpoint admin).
     * @param {string} id - UUID del curso
     * @returns {Promise<Object>} Curso encontrado
     * @throws {AppError} Si el curso no existe
     */
    async obtenerPorId(id) {
        const curso = await CursoModel.findById(id);

        if (!curso) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El curso solicitado no fue encontrado',
                404
            );
        }

        return curso;
    },

    /**
     * Crea un nuevo curso.
     * @param {Object} datos - Datos del curso
     * @returns {Promise<Object>} El curso creado
     */
    async crear(datos) {
        return CursoModel.create(datos);
    },

    /**
     * Actualiza un curso existente.
     * @param {string} id - UUID del curso
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>} El curso actualizado
     * @throws {AppError} Si el curso no existe
     */
    async actualizar(id, datos) {
        const cursoExistente = await CursoModel.findById(id);

        if (!cursoExistente) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El curso solicitado no fue encontrado',
                404
            );
        }

        return CursoModel.update(id, datos);
    },

    /**
     * Elimina un curso verificando que no tenga reservaciones activas.
     * @param {string} id - UUID del curso
     * @returns {Promise<void>}
     * @throws {AppError} Si el curso no existe o tiene reservaciones activas
     */
    async eliminar(id) {
        const cursoExistente = await CursoModel.findById(id);

        if (!cursoExistente) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El curso solicitado no fue encontrado',
                404
            );
        }

        // Verificar reservaciones activas antes de eliminar
        const reservacionesActivas = await CursoModel.contarReservacionesActivas(id);

        if (reservacionesActivas > 0) {
            throw new AppError(
                'CONFLICTO',
                `No se puede eliminar el curso porque tiene ${reservacionesActivas} reservación(es) activa(s)`,
                409
            );
        }

        await CursoModel.delete(id);
    }
};

module.exports = CursoService;
