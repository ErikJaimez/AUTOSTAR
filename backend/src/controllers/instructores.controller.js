const InstructorService = require('../services/instructor.service');

/**
 * Controlador de Instructores.
 * Handlers de Express para los endpoints de gestión de instructores.
 */
const InstructoresController = {
    /**
     * GET /api/admin/instructores
     * Lista todos los instructores ordenados alfabéticamente con conteo de clases.
     *
     * Respuesta exitosa: 200 { instructores: [...] }
     */
    async listar(req, res, next) {
        try {
            const instructores = await InstructorService.listar();

            return res.status(200).json({ instructores });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/admin/instructores
     * Crea un nuevo instructor.
     *
     * Body: { nombre_completo, telefono, email, activo? }
     * Respuesta exitosa: 201 { instructor }
     * Errores: 400 (validación), 409 (email duplicado)
     */
    async crear(req, res, next) {
        try {
            const { nombre_completo, telefono, email, activo } = req.body;

            const instructor = await InstructorService.crear({
                nombre_completo,
                telefono,
                email,
                activo
            });

            return res.status(201).json({ instructor });
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /api/admin/instructores/:id
     * Actualiza un instructor existente.
     *
     * Params: id (UUID)
     * Body: { nombre_completo?, telefono?, email?, activo? }
     * Respuesta exitosa: 200 { instructor }
     * Errores: 400 (validación), 404 (no encontrado), 409 (conflicto email o clases futuras)
     */
    async actualizar(req, res, next) {
        try {
            const { id } = req.params;
            const { nombre_completo, telefono, email, activo } = req.body;

            const instructor = await InstructorService.actualizar(id, {
                nombre_completo,
                telefono,
                email,
                activo
            });

            return res.status(200).json({ instructor });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/admin/instructores/:id/agenda
     * Obtiene la agenda semanal del instructor.
     *
     * Params: id (UUID)
     * Query: fecha (YYYY-MM-DD, opcional, default: semana actual)
     * Respuesta exitosa: 200 { instructor, semana, dias }
     * Errores: 404 (instructor no encontrado)
     */
    async agenda(req, res, next) {
        try {
            const { id } = req.params;
            const { fecha } = req.query;

            const agenda = await InstructorService.obtenerAgenda(id, fecha);

            return res.status(200).json(agenda);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = InstructoresController;
