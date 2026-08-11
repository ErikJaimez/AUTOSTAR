const ClaseModel = require('../models/clase.model');
const CancelacionModel = require('../models/cancelacion.model');
const ReservacionModel = require('../models/reservacion.model');
const HorarioModel = require('../models/horario.model');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Servicio de Clases.
 * Contiene la lógica de negocio para la gestión de clases, cancelaciones y avance de horas.
 */
const ClaseService = {
    /**
     * Lista clases con filtros opcionales.
     * @param {Object} filtros - Filtros: reservacion_id, instructor_id, estado, fecha_desde, fecha_hasta
     * @returns {Promise<Array>} Lista de clases
     */
    async listar(filtros) {
        return ClaseModel.findWithFilters(filtros);
    },

    /**
     * Marca una clase como completada y actualiza el avance de horas.
     * Solo clases en estado "programada" pueden completarse.
     * Si el avance llega al 100%, marca la reservación como "completada".
     *
     * @param {string} claseId - UUID de la clase
     * @returns {Promise<Object>} La clase actualizada con info de avance
     * @throws {AppError} Si la clase no existe o no está en estado "programada"
     */
    async completar(claseId) {
        const clase = await ClaseModel.findById(claseId);

        if (!clase) {
            throw new AppError(
                'NO_ENCONTRADO',
                'La clase solicitada no fue encontrada',
                404
            );
        }

        if (clase.estado !== 'programada') {
            throw new AppError(
                'VALIDACION',
                'Solo las clases en estado "programada" pueden ser completadas',
                400,
                [{ campo: 'estado', mensaje: `La clase tiene estado "${clase.estado}" y no puede ser completada` }]
            );
        }

        // Marcar como completada
        const claseActualizada = await ClaseModel.updateEstado(claseId, 'completada');

        // Calcular avance actualizado
        const horasCompletadas = await ClaseModel.calcularHorasCompletadas(clase.reservacion_id);
        const horasTotales = clase.curso_duracion_horas;
        const horasPendientes = Math.max(0, horasTotales - horasCompletadas);
        const porcentaje = Math.round((horasCompletadas / horasTotales) * 100);

        // Si alcanza 100%, marcar la reservación como completada
        if (horasCompletadas >= horasTotales) {
            await ReservacionModel.updateEstado(clase.reservacion_id, 'completada');
        }

        return {
            clase: claseActualizada,
            avance: {
                horas_totales: horasTotales,
                horas_completadas: parseFloat(horasCompletadas.toFixed(1)),
                horas_pendientes: parseFloat(horasPendientes.toFixed(1)),
                porcentaje: Math.min(porcentaje, 100)
            }
        };
    },

    /**
     * Cancela una clase en estado "programada".
     * Registra la cancelación con motivo y admin_id.
     * Las horas de la clase permanecen como pendientes.
     *
     * @param {string} claseId - UUID de la clase
     * @param {string} motivo - Motivo de cancelación (10-500 chars)
     * @param {string} adminId - UUID del admin que realiza la cancelación
     * @returns {Promise<Object>} La clase cancelada y registro de cancelación
     * @throws {AppError} Si la clase no existe o no está en estado "programada"
     */
    async cancelar(claseId, motivo, adminId) {
        const clase = await ClaseModel.findById(claseId);

        if (!clase) {
            throw new AppError(
                'NO_ENCONTRADO',
                'La clase solicitada no fue encontrada',
                404
            );
        }

        if (clase.estado !== 'programada') {
            throw new AppError(
                'VALIDACION',
                'Solo las clases en estado "programada" pueden ser canceladas',
                400,
                [{ campo: 'estado', mensaje: `La clase tiene estado "${clase.estado}" y no puede ser cancelada` }]
            );
        }

        // Marcar la clase como cancelada
        const claseActualizada = await ClaseModel.updateEstado(claseId, 'cancelada');

        // Registrar la cancelación
        const cancelacion = await CancelacionModel.create({
            clase_id: claseId,
            admin_id: adminId,
            motivo
        });

        return {
            clase: claseActualizada,
            cancelacion
        };
    },

    /**
     * Reprograma una clase cancelada creando una nueva clase vinculada.
     * Requiere un slot_horario_id válido para la nueva clase.
     * Actualiza cancelacion.clase_reprogramada_id.
     *
     * @param {string} claseId - UUID de la clase cancelada original
     * @param {string} slotHorarioId - UUID del nuevo slot de horario
     * @returns {Promise<Object>} La nueva clase creada
     * @throws {AppError} Si la clase no está cancelada o el slot no existe
     */
    async reprogramar(claseId, slotHorarioId) {
        const clase = await ClaseModel.findById(claseId);

        if (!clase) {
            throw new AppError(
                'NO_ENCONTRADO',
                'La clase solicitada no fue encontrada',
                404
            );
        }

        if (clase.estado !== 'cancelada') {
            throw new AppError(
                'VALIDACION',
                'Solo las clases canceladas pueden ser reprogramadas',
                400,
                [{ campo: 'estado', mensaje: `La clase tiene estado "${clase.estado}" y no puede ser reprogramada` }]
            );
        }

        // Verificar que el slot existe
        const slot = await HorarioModel.findById(slotHorarioId);
        if (!slot) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El horario seleccionado para la reprogramación no fue encontrado',
                404
            );
        }

        // Crear nueva clase en estado "programada" con datos del slot
        const nuevaClase = await ClaseModel.create({
            reservacion_id: clase.reservacion_id,
            instructor_id: slot.instructor_id,
            slot_horario_id: slotHorarioId,
            fecha: slot.fecha,
            hora_inicio: slot.hora_inicio,
            hora_fin: slot.hora_fin,
            estado: 'programada'
        });

        // Buscar la cancelación asociada y vincular la nueva clase
        const cancelacion = await CancelacionModel.findByClaseId(claseId);
        if (cancelacion) {
            await CancelacionModel.updateClaseReprogramada(cancelacion.id, nuevaClase.id);
        }

        return {
            clase_nueva: nuevaClase,
            clase_original_id: claseId
        };
    },

    /**
     * Obtiene el historial de cancelaciones con filtros y paginación.
     * Filtros: instructor_id, curso_id, fecha_desde, fecha_hasta.
     * Máximo 50 registros por página.
     *
     * @param {Object} filtros - Filtros a aplicar
     * @param {number} pagina - Número de página
     * @returns {Promise<Object>} Resultado paginado con cancelaciones
     */
    async listarCancelaciones(filtros, pagina = 1) {
        return CancelacionModel.findWithFilters(filtros, pagina);
    },

    /**
     * Calcula el avance de horas de un cliente para su reservación activa.
     * Avance: horas totales, completadas, pendientes y porcentaje.
     *
     * @param {string} clienteId - UUID del cliente
     * @returns {Promise<Object>} Datos de avance de horas
     * @throws {AppError} Si el cliente no tiene reservación activa
     */
    async obtenerAvance(clienteId) {
        const db = require('../config/database');

        // Buscar la reservación activa (no cancelada) del cliente
        const reservacion = await db('reservaciones')
            .select(
                'reservaciones.*',
                'cursos.nombre as curso_nombre',
                'cursos.duracion_horas'
            )
            .leftJoin('cursos', 'reservaciones.curso_id', 'cursos.id')
            .where('reservaciones.cliente_id', clienteId)
            .whereIn('reservaciones.estado', ['pendiente', 'confirmada'])
            .orderBy('reservaciones.created_at', 'desc')
            .first();

        if (!reservacion) {
            throw new AppError(
                'NO_ENCONTRADO',
                'No se encontró una reservación activa para el cliente',
                404
            );
        }

        // Calcular horas completadas
        const horasCompletadas = await ClaseModel.calcularHorasCompletadas(reservacion.id);
        const horasTotales = reservacion.duracion_horas;
        const horasPendientes = Math.max(0, horasTotales - horasCompletadas);
        const porcentaje = horasTotales > 0
            ? Math.min(Math.round((horasCompletadas / horasTotales) * 100), 100)
            : 0;

        // Obtener detalle de clases
        const clases = await ClaseModel.findByReservacion(reservacion.id);

        return {
            cliente_id: clienteId,
            reservacion_id: reservacion.id,
            curso_nombre: reservacion.curso_nombre,
            horas_totales: horasTotales,
            horas_completadas: parseFloat(horasCompletadas.toFixed(1)),
            horas_pendientes: parseFloat(horasPendientes.toFixed(1)),
            porcentaje,
            clases
        };
    }
};

module.exports = ClaseService;
