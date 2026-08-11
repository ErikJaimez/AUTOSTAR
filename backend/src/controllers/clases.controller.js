const ClaseService = require('../services/clase.service');

/**
 * Controlador de Clases.
 * Handlers de Express para los endpoints de gestión de clases, cancelaciones y avance.
 */
const ClasesController = {
    /**
     * GET /api/admin/clases
     * Lista clases con filtros opcionales.
     *
     * Query: reservacion_id, instructor_id, estado, fecha_desde, fecha_hasta
     * Respuesta: 200 { clases: [...] }
     */
    async listar(req, res, next) {
        try {
            const filtros = {};
            if (req.query.reservacion_id) filtros.reservacion_id = req.query.reservacion_id;
            if (req.query.instructor_id) filtros.instructor_id = req.query.instructor_id;
            if (req.query.estado) filtros.estado = req.query.estado;
            if (req.query.fecha_desde) filtros.fecha_desde = req.query.fecha_desde;
            if (req.query.fecha_hasta) filtros.fecha_hasta = req.query.fecha_hasta;

            const clases = await ClaseService.listar(filtros);

            return res.status(200).json({ clases });
        } catch (error) {
            next(error);
        }
    },

    /**
     * PATCH /api/admin/clases/:id/completar
     * Marca una clase como completada y actualiza el avance de horas.
     *
     * Params: id (UUID)
     * Respuesta: 200 { clase, avance, mensaje }
     * Errores: 400 (estado inválido), 404 (no encontrada)
     */
    async completar(req, res, next) {
        try {
            const { id } = req.params;

            const resultado = await ClaseService.completar(id);

            return res.status(200).json({
                ...resultado,
                mensaje: 'Clase marcada como completada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/admin/clases/:id/cancelar
     * Cancela una clase con registro de motivo.
     *
     * Params: id (UUID)
     * Body: { motivo: string }
     * Respuesta: 200 { clase, cancelacion, mensaje }
     * Errores: 400 (estado inválido, motivo corto/largo), 404 (no encontrada)
     */
    async cancelar(req, res, next) {
        try {
            const { id } = req.params;
            const { motivo } = req.body;
            const adminId = req.user.id;

            const resultado = await ClaseService.cancelar(id, motivo, adminId);

            return res.status(200).json({
                ...resultado,
                mensaje: 'Clase cancelada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/admin/clases/:id/reprogramar
     * Reprograma una clase cancelada creando una nueva clase.
     *
     * Params: id (UUID de la clase cancelada)
     * Body: { slot_horario_id: UUID }
     * Respuesta: 201 { clase_nueva, clase_original_id, mensaje }
     * Errores: 400 (estado no cancelada), 404 (clase o slot no encontrado)
     */
    async reprogramar(req, res, next) {
        try {
            const { id } = req.params;
            const { slot_horario_id } = req.body;

            const resultado = await ClaseService.reprogramar(id, slot_horario_id);

            return res.status(201).json({
                ...resultado,
                mensaje: 'Clase reprogramada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/admin/cancelaciones
     * Historial de cancelaciones con filtros y paginación (max 50/página).
     *
     * Query: page, instructor_id, curso_id, fecha_desde, fecha_hasta
     * Respuesta: 200 { cancelaciones, total, pagina, porPagina, totalPaginas }
     */
    async listarCancelaciones(req, res, next) {
        try {
            const pagina = parseInt(req.query.page, 10) || 1;

            const filtros = {};
            if (req.query.instructor_id) filtros.instructor_id = req.query.instructor_id;
            if (req.query.curso_id) filtros.curso_id = req.query.curso_id;
            if (req.query.fecha_desde) filtros.fecha_desde = req.query.fecha_desde;
            if (req.query.fecha_hasta) filtros.fecha_hasta = req.query.fecha_hasta;

            const resultado = await ClaseService.listarCancelaciones(filtros, pagina);

            return res.status(200).json(resultado);
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/admin/clientes/:id/avance
     * Avance de horas de un cliente.
     *
     * Params: id (UUID del cliente)
     * Respuesta: 200 { cliente_id, reservacion_id, curso_nombre, horas_totales, horas_completadas, horas_pendientes, porcentaje, clases }
     * Errores: 404 (sin reservación activa)
     */
    async obtenerAvance(req, res, next) {
        try {
            const { id } = req.params;

            const avance = await ClaseService.obtenerAvance(id);

            return res.status(200).json(avance);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = ClasesController;
