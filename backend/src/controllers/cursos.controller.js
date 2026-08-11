const CursoService = require('../services/curso.service');

/**
 * Controlador de Cursos.
 * Handlers de Express para los endpoints de gestión de cursos.
 */
const CursosController = {
    /**
     * GET /api/cursos
     * Lista todos los cursos activos (endpoint público).
     *
     * Respuesta: 200 { cursos: [...] }
     */
    async listarActivos(req, res, next) {
        try {
            const cursos = await CursoService.listarActivos();

            return res.status(200).json({ cursos });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/cursos/:id
     * Obtiene el detalle de un curso activo (endpoint público).
     *
     * Params: id (UUID)
     * Respuesta: 200 { curso: {...} }
     * Errores: 404 (no encontrado)
     */
    async detalle(req, res, next) {
        try {
            const { id } = req.params;
            const curso = await CursoService.obtenerActivoPorId(id);

            return res.status(200).json({ curso });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/admin/cursos
     * Crea un nuevo curso (endpoint admin protegido).
     *
     * Body: { nombre, descripcion, descripcion_resumida?, duracion_horas, precio, categoria_licencia, requisitos_previos?, activo? }
     * Respuesta: 201 { curso: {...} }
     * Errores: 400 (validación)
     */
    async crear(req, res, next) {
        try {
            const curso = await CursoService.crear(req.body);

            return res.status(201).json({ curso });
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /api/admin/cursos/:id
     * Actualiza un curso existente (endpoint admin protegido).
     *
     * Params: id (UUID)
     * Body: campos a actualizar
     * Respuesta: 200 { curso: {...} }
     * Errores: 400 (validación), 404 (no encontrado)
     */
    async actualizar(req, res, next) {
        try {
            const { id } = req.params;
            const curso = await CursoService.actualizar(id, req.body);

            return res.status(200).json({ curso });
        } catch (error) {
            next(error);
        }
    },

    /**
     * DELETE /api/admin/cursos/:id
     * Elimina un curso (endpoint admin protegido).
     * Verifica que no tenga reservaciones activas antes de eliminar.
     *
     * Params: id (UUID)
     * Respuesta: 200 { mensaje: 'Curso eliminado exitosamente' }
     * Errores: 404 (no encontrado), 409 (conflicto por reservaciones activas)
     */
    async eliminar(req, res, next) {
        try {
            const { id } = req.params;
            await CursoService.eliminar(id);

            return res.status(200).json({ mensaje: 'Curso eliminado exitosamente' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = CursosController;
