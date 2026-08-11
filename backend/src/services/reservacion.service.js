const ReservacionModel = require('../models/reservacion.model');
const ClienteModel = require('../models/cliente.model');
const HorarioModel = require('../models/horario.model');
const CursoModel = require('../models/curso.model');
const EmailService = require('./email.service');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Códigos postales válidos de la zona sur de CDMX.
 * Tlalpan: 14000-14999, Coyoacán: 04000-04999,
 * Xochimilco: 16000-16999, Tláhuac: 13000-13999,
 * Milpa Alta: 12000-12999
 */
const RANGOS_ZONA_SUR = [
    { min: 14000, max: 14999 }, // Tlalpan
    { min: 4000, max: 4999 },   // Coyoacán
    { min: 16000, max: 16999 }, // Xochimilco
    { min: 13000, max: 13999 }, // Tláhuac
    { min: 12000, max: 12999 }  // Milpa Alta
];

/**
 * Transiciones de estado válidas para reservaciones.
 */
const TRANSICIONES_VALIDAS = {
    pendiente: ['confirmada', 'cancelada'],
    confirmada: ['completada', 'cancelada'],
    completada: [],
    cancelada: []
};

/**
 * Servicio de Reservaciones.
 * Contiene la lógica de negocio para la gestión de reservaciones.
 */
const ReservacionService = {
    /**
     * Valida que un código postal pertenezca a la zona sur de CDMX.
     * @param {string} codigoPostal - Código postal de 5 dígitos
     * @returns {boolean} true si pertenece a la zona sur
     */
    esZonaSur(codigoPostal) {
        const cp = parseInt(codigoPostal, 10);
        return RANGOS_ZONA_SUR.some(rango => cp >= rango.min && cp <= rango.max);
    },

    /**
     * Genera un folio único con formato AUT-YYYYMMDD-XXXX.
     * @returns {Promise<string>} Folio único generado
     */
    async generarFolio() {
        const fecha = new Date();
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        const fechaStr = `${yyyy}${mm}${dd}`;

        // Generar parte aleatoria (4 caracteres alfanuméricos)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let intentos = 0;
        const maxIntentos = 10;

        while (intentos < maxIntentos) {
            let aleatorio = '';
            for (let i = 0; i < 4; i++) {
                aleatorio += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const folio = `AUT-${fechaStr}-${aleatorio}`;

            // Verificar unicidad en base de datos
            const existente = await ReservacionModel.findByFolio(folio);
            if (!existente) {
                return folio;
            }

            intentos++;
        }

        throw new AppError(
            'ERROR_INTERNO',
            'No se pudo generar un folio único. Intente nuevamente.',
            500
        );
    },

    /**
     * Crea una nueva reservación (endpoint público).
     * Flujo: validar zona → verificar disponibilidad slot → crear/encontrar cliente → generar folio → crear reservación → enviar email.
     * @param {Object} datos - Datos del formulario de reservación
     * @returns {Promise<Object>} La reservación creada con folio
     * @throws {AppError} Si la zona no es válida, el slot no está disponible, etc.
     */
    async crear(datos) {
        const { nombre_completo, edad, direccion, codigo_postal, telefono, email, slot_horario_id, curso_id } = datos;

        // 1. Validar zona de servicio (CP en zona sur)
        if (!this.esZonaSur(codigo_postal)) {
            throw new AppError(
                'VALIDACION',
                'El servicio está disponible únicamente para la zona sur de la Ciudad de México',
                400,
                [{ campo: 'codigo_postal', mensaje: 'El código postal no pertenece a la zona de servicio (zona sur CDMX)' }]
            );
        }

        // 2. Verificar que el slot existe
        const slot = await HorarioModel.findById(slot_horario_id);
        if (!slot) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El horario seleccionado no fue encontrado',
                404
            );
        }

        // 3. Verificar que el curso existe y está activo
        const curso = await CursoModel.findActivoById(curso_id);
        if (!curso) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El curso seleccionado no fue encontrado o no está disponible',
                404
            );
        }

        // 4. Verificar disponibilidad del slot (capacidad)
        const reservacionesActuales = await ReservacionModel.contarPorSlot(slot_horario_id);
        if (reservacionesActuales >= slot.capacidad_maxima) {
            // Slot lleno: buscar alternativas
            const alternativas = await ReservacionModel.findAlternativas(curso_id, slot_horario_id);

            const error = new AppError(
                'CONFLICTO',
                'El horario seleccionado ya no tiene lugares disponibles',
                409
            );
            error.alternativas = alternativas;
            throw error;
        }

        // 5. Crear cliente o encontrar existente por email
        const cliente = await ClienteModel.findOrCreate({
            nombre_completo,
            edad,
            direccion,
            codigo_postal,
            telefono,
            email
        });

        // 6. Generar folio único
        const folio = await this.generarFolio();

        // 7. Crear la reservación
        const reservacion = await ReservacionModel.create({
            folio,
            cliente_id: cliente.id,
            slot_horario_id,
            curso_id
        });

        // 8. Enviar email de confirmación (no bloquea el flujo)
        try {
            await EmailService.enviarConfirmacionReservacion({
                destinatario: email,
                folio,
                cursoNombre: curso.nombre,
                fecha: slot.fecha,
                horaInicio: slot.hora_inicio,
                horaFin: slot.hora_fin,
                clienteNombre: nombre_completo
            });
        } catch (emailError) {
            // No interrumpir la reservación si el email falla
            console.error('Error al enviar email de confirmación:', emailError.message);
        }

        return {
            ...reservacion,
            curso_nombre: curso.nombre,
            slot_fecha: slot.fecha,
            slot_hora_inicio: slot.hora_inicio,
            slot_hora_fin: slot.hora_fin
        };
    },

    /**
     * Lista reservaciones con paginación y filtros combinados (endpoint admin).
     * @param {Object} filtros - Filtros: estado, curso_id, instructor_id, fecha_desde, fecha_hasta
     * @param {number} pagina - Número de página
     * @returns {Promise<Object>} Resultado paginado con reservaciones
     */
    async listar(filtros, pagina = 1) {
        return ReservacionModel.findWithFilters(filtros, pagina, 20);
    },

    /**
     * Cambia el estado de una reservación validando transiciones permitidas.
     * @param {string} id - UUID de la reservación
     * @param {string} nuevoEstado - Estado destino
     * @returns {Promise<Object>} La reservación actualizada
     * @throws {AppError} Si la transición no es válida
     */
    async cambiarEstado(id, nuevoEstado) {
        const reservacion = await ReservacionModel.findById(id);

        if (!reservacion) {
            throw new AppError(
                'NO_ENCONTRADO',
                'La reservación solicitada no fue encontrada',
                404
            );
        }

        // Validar transición de estado
        const transicionesPermitidas = TRANSICIONES_VALIDAS[reservacion.estado] || [];

        if (!transicionesPermitidas.includes(nuevoEstado)) {
            throw new AppError(
                'VALIDACION',
                `La transición de estado "${reservacion.estado}" a "${nuevoEstado}" no es válida. Transiciones permitidas desde "${reservacion.estado}": ${transicionesPermitidas.length > 0 ? transicionesPermitidas.join(', ') : 'ninguna'}`,
                400
            );
        }

        // Actualizar estado
        const reservacionActualizada = await ReservacionModel.updateEstado(id, nuevoEstado);

        // Si se cancela, enviar notificación por email
        if (nuevoEstado === 'cancelada') {
            try {
                await EmailService.enviarNotificacionCancelacion({
                    destinatario: reservacion.cliente_email,
                    folio: reservacion.folio,
                    cursoNombre: reservacion.curso_nombre,
                    fecha: reservacion.slot_fecha,
                    clienteNombre: reservacion.cliente_nombre
                });
            } catch (emailError) {
                console.error('Error al enviar email de cancelación:', emailError.message);
            }
        }

        return reservacionActualizada;
    }
};

module.exports = ReservacionService;
