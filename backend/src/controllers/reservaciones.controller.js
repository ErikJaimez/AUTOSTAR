const ReservacionService = require('../services/reservacion.service');

/**
 * Controlador de Reservaciones.
 * Handlers de Express para los endpoints de gestión de reservaciones.
 */
const ReservacionesController = {
    /**
     * POST /api/reservaciones
     * Crea una nueva reservación (endpoint público).
     *
     * Body: { nombre_completo, edad, direccion, codigo_postal, telefono, email, slot_horario_id, curso_id }
     * Respuesta: 201 { reservacion: {...}, mensaje: '...' }
     * Errores: 400 (validación/zona), 404 (slot o curso no encontrado), 409 (slot lleno)
     */
    async crear(req, res, next) {
        try {
            const reservacion = await ReservacionService.crear(req.body);

            return res.status(201).json({
                reservacion,
                mensaje: 'Reservación creada exitosamente'
            });
        } catch (error) {
            // Si el error tiene alternativas (slot lleno), incluirlas en la respuesta
            if (error.statusCode === 409 && error.alternativas) {
                return res.status(409).json({
                    tipo: error.tipo,
                    mensaje: error.mensaje,
                    alternativas: error.alternativas
                });
            }
            next(error);
        }
    },

    /**
     * GET /api/admin/reservaciones
     * Lista reservaciones con paginación y filtros (endpoint admin).
     *
     * Query: page, estado, curso_id, instructor_id, fecha_desde, fecha_hasta
     * Respuesta: 200 { reservaciones: [...], total, pagina, porPagina, totalPaginas }
     */
    async listar(req, res, next) {
        try {
            const pagina = parseInt(req.query.page, 10) || 1;

            const filtros = {};
            if (req.query.estado) filtros.estado = req.query.estado;
            if (req.query.curso_id) filtros.curso_id = req.query.curso_id;
            if (req.query.instructor_id) filtros.instructor_id = req.query.instructor_id;
            if (req.query.fecha_desde) filtros.fecha_desde = req.query.fecha_desde;
            if (req.query.fecha_hasta) filtros.fecha_hasta = req.query.fecha_hasta;

            const resultado = await ReservacionService.listar(filtros, pagina);

            return res.status(200).json(resultado);
        } catch (error) {
            next(error);
        }
    },

    /**
     * PATCH /api/admin/reservaciones/:id/estado
     * Cambia el estado de una reservación (endpoint admin).
     *
     * Params: id (UUID)
     * Body: { estado: 'confirmada' | 'completada' | 'cancelada' }
     * Respuesta: 200 { reservacion: {...}, mensaje: '...' }
     * Errores: 400 (transición inválida), 404 (no encontrada)
     */
    async cambiarEstado(req, res, next) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            const reservacion = await ReservacionService.cambiarEstado(id, estado);

            return res.status(200).json({
                reservacion,
                mensaje: `Estado de la reservación actualizado a "${estado}"`
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = ReservacionesController;
