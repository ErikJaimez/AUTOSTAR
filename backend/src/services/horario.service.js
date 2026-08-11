const HorarioModel = require('../models/horario.model');
const InstructorModel = require('../models/instructor.model');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Servicio de Horarios.
 * Contiene la lógica de negocio para la gestión de slots de horario.
 */
const HorarioService = {
    /**
     * Lista todos los slots de horario (vista admin).
     * Incluye curso, instructor y conteo de reservaciones.
     * @returns {Promise<Array>} Lista de slots con detalles
     */
    async listar() {
        return HorarioModel.findAll();
    },

    /**
     * Lista los slots disponibles para un curso (vista pública).
     * Muestra slots de las próximas 4 semanas con información de disponibilidad.
     * @param {string} cursoId - UUID del curso
     * @returns {Promise<Array>} Slots con info de disponibilidad
     */
    async listarDisponiblesPorCurso(cursoId) {
        const slots = await HorarioModel.findDisponiblesPorCurso(cursoId);

        return slots.map((slot) => ({
            id: slot.id,
            curso_id: slot.curso_id,
            instructor_id: slot.instructor_id,
            instructor_nombre: slot.instructor_nombre,
            fecha: slot.fecha,
            hora_inicio: slot.hora_inicio,
            hora_fin: slot.hora_fin,
            capacidad_maxima: slot.capacidad_maxima,
            reservaciones_count: parseInt(slot.reservaciones_count, 10),
            disponible: parseInt(slot.reservaciones_count, 10) < slot.capacidad_maxima
        }));
    },

    /**
     * Crea un nuevo slot de horario.
     * Valida que el instructor esté activo y que no haya traslape.
     * @param {Object} datos - { curso_id, instructor_id, fecha, hora_inicio, hora_fin, capacidad_maxima }
     * @returns {Promise<Object>} El slot creado
     * @throws {AppError} Si el instructor no está activo o hay traslape
     */
    async crear(datos) {
        // Verificar que el instructor existe y está activo
        const instructor = await InstructorModel.findById(datos.instructor_id);
        if (!instructor) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El instructor especificado no fue encontrado',
                404,
                [{ campo: 'instructor_id', mensaje: 'El instructor no existe' }]
            );
        }

        if (!instructor.activo) {
            throw new AppError(
                'VALIDACION',
                'El instructor seleccionado no está activo',
                400,
                [{ campo: 'instructor_id', mensaje: 'Solo se pueden asignar instructores con estado activo' }]
            );
        }

        // Detectar traslape con otro slot del mismo instructor en la misma fecha
        const conflicto = await HorarioModel.detectarTraslape(
            datos.instructor_id,
            datos.fecha,
            datos.hora_inicio,
            datos.hora_fin
        );

        if (conflicto) {
            throw new AppError(
                'CONFLICTO',
                `El horario se traslapa con un slot existente del mismo instructor`,
                409,
                [{
                    campo: 'hora_inicio',
                    mensaje: `Conflicto con slot: ${conflicto.curso_nombre || 'Sin curso'} el ${conflicto.fecha} de ${conflicto.hora_inicio} a ${conflicto.hora_fin}`
                }]
            );
        }

        return HorarioModel.create(datos);
    },

    /**
     * Actualiza un slot de horario existente.
     * Valida traslape si se cambia fecha/hora/instructor.
     * Valida que el instructor esté activo si se cambia.
     * @param {string} id - UUID del slot
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>} El slot actualizado
     * @throws {AppError} Si no existe, instructor inactivo o hay traslape
     */
    async actualizar(id, datos) {
        // Verificar que el slot existe
        const slotExistente = await HorarioModel.findById(id);
        if (!slotExistente) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El slot de horario solicitado no fue encontrado',
                404
            );
        }

        // Determinar el instructor final (puede ser el existente o uno nuevo)
        const instructorId = datos.instructor_id || slotExistente.instructor_id;

        // Si se cambia el instructor, verificar que el nuevo esté activo
        if (datos.instructor_id && datos.instructor_id !== slotExistente.instructor_id) {
            const instructor = await InstructorModel.findById(datos.instructor_id);
            if (!instructor) {
                throw new AppError(
                    'NO_ENCONTRADO',
                    'El instructor especificado no fue encontrado',
                    404,
                    [{ campo: 'instructor_id', mensaje: 'El instructor no existe' }]
                );
            }

            if (!instructor.activo) {
                throw new AppError(
                    'VALIDACION',
                    'El instructor seleccionado no está activo',
                    400,
                    [{ campo: 'instructor_id', mensaje: 'Solo se pueden asignar instructores con estado activo' }]
                );
            }
        }

        // Verificar traslape si se cambia fecha, hora o instructor
        const fecha = datos.fecha || slotExistente.fecha;
        const horaInicio = datos.hora_inicio || slotExistente.hora_inicio;
        const horaFin = datos.hora_fin || slotExistente.hora_fin;

        const hayCambioHorario = datos.fecha || datos.hora_inicio || datos.hora_fin || datos.instructor_id;

        if (hayCambioHorario) {
            const conflicto = await HorarioModel.detectarTraslape(
                instructorId,
                fecha,
                horaInicio,
                horaFin,
                id // excluir el slot actual
            );

            if (conflicto) {
                throw new AppError(
                    'CONFLICTO',
                    `El horario se traslapa con un slot existente del mismo instructor`,
                    409,
                    [{
                        campo: 'hora_inicio',
                        mensaje: `Conflicto con slot: ${conflicto.curso_nombre || 'Sin curso'} el ${conflicto.fecha} de ${conflicto.hora_inicio} a ${conflicto.hora_fin}`
                    }]
                );
            }
        }

        return HorarioModel.update(id, datos);
    },

    /**
     * Elimina un slot de horario.
     * Verifica que no tenga reservaciones activas antes de eliminar.
     * @param {string} id - UUID del slot
     * @returns {Promise<void>}
     * @throws {AppError} Si no existe o tiene reservaciones activas
     */
    async eliminar(id) {
        // Verificar que el slot existe
        const slot = await HorarioModel.findById(id);
        if (!slot) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El slot de horario solicitado no fue encontrado',
                404
            );
        }

        // Verificar reservaciones activas
        const reservacionesActivas = await HorarioModel.contarReservacionesActivas(id);
        if (reservacionesActivas > 0) {
            throw new AppError(
                'CONFLICTO',
                `No se puede eliminar el slot porque tiene ${reservacionesActivas} reservación(es) activa(s)`,
                409,
                [{
                    campo: 'id',
                    mensaje: `Existen ${reservacionesActivas} reservación(es) activa(s) asociada(s) a este horario`
                }]
            );
        }

        await HorarioModel.delete(id);
    }
};

module.exports = HorarioService;
