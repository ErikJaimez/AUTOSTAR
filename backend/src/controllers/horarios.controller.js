const HorarioService = require('../services/horario.service');

/**
 * Controlador de Horarios.
 * Handlers de Express para los endpoints de gestión de slots de horario.
 */
const HorariosController = {
    /**
     * GET /api/cursos/:id/horarios
     * Lista los slots disponibles para un curso (público, próximas 4 semanas).
     * Incluye disponibilidad y nombre del instructor.
     *
     * Params: id (UUID del curso)
     * Respuesta exitosa: 200 { horarios: [...] }
     */
    async listarPorCurso(req, res, next) {
        try {
            const { id } = req.params;

            const horarios = await HorarioService.listarDisponiblesPorCurso(id);

            return res.status(200).json({ horarios });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/admin/horarios
     * Lista todos los slots de horario (admin).
     * Incluye curso, instructor y conteo de reservaciones.
     *
     * Respuesta exitosa: 200 { horarios: [...] }
     */
    async listar(req, res, next) {
        try {
            const horarios = await HorarioService.listar();

            return res.status(200).json({ horarios });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/admin/horarios
     * Crea un nuevo slot de horario.
     *
     * Body: { curso_id, instructor_id, fecha, hora_inicio, hora_fin, capacidad_maxima }
     * Respuesta exitosa: 201 { horario }
     * Errores: 400 (validación, instructor inactivo), 404 (instructor no encontrado), 409 (traslape)
     */
    async crear(req, res, next) {
        try {
            const { curso_id, instructor_id, fecha, hora_inicio, hora_fin, capacidad_maxima } = req.body;

            const horario = await HorarioService.crear({
                curso_id,
                instructor_id,
                fecha,
                hora_inicio,
                hora_fin,
                capacidad_maxima
            });

            return res.status(201).json({ horario });
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /api/admin/horarios/:id
     * Actualiza un slot de horario existente.
     *
     * Params: id (UUID)
     * Body: { curso_id?, instructor_id?, fecha?, hora_inicio?, hora_fin?, capacidad_maxima? }
     * Respuesta exitosa: 200 { horario }
     * Errores: 400 (validación), 404 (no encontrado), 409 (traslape)
     */
    async actualizar(req, res, next) {
        try {
            const { id } = req.params;
            const { curso_id, instructor_id, fecha, hora_inicio, hora_fin, capacidad_maxima } = req.body;

            const horario = await HorarioService.actualizar(id, {
                curso_id,
                instructor_id,
                fecha,
                hora_inicio,
                hora_fin,
                capacidad_maxima
            });

            return res.status(200).json({ horario });
        } catch (error) {
            next(error);
        }
    },

    /**
     * DELETE /api/admin/horarios/:id
     * Elimina un slot de horario.
     *
     * Params: id (UUID)
     * Respuesta exitosa: 200 { mensaje }
     * Errores: 404 (no encontrado), 409 (tiene reservaciones activas)
     */
    async eliminar(req, res, next) {
        try {
            const { id } = req.params;

            await HorarioService.eliminar(id);

            return res.status(200).json({
                mensaje: 'El slot de horario fue eliminado exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = HorariosController;
