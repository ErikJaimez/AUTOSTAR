const { body, param, query } = require('express-validator');

/**
 * Validación para marcar una clase como completada.
 */
const completarClaseValidation = [
    param('id')
        .isUUID()
        .withMessage('El ID de la clase debe ser un UUID válido')
];

/**
 * Validación para cancelar una clase.
 * Requiere motivo con longitud entre 10 y 500 caracteres.
 */
const cancelarClaseValidation = [
    param('id')
        .isUUID()
        .withMessage('El ID de la clase debe ser un UUID válido'),

    body('motivo')
        .notEmpty()
        .withMessage('El motivo de cancelación es obligatorio')
        .isString()
        .withMessage('El motivo debe ser texto')
        .isLength({ min: 10, max: 500 })
        .withMessage('El motivo debe tener entre 10 y 500 caracteres')
        .trim()
];

/**
 * Validación para reprogramar una clase.
 * Requiere un slot_horario_id válido.
 */
const reprogramarClaseValidation = [
    param('id')
        .isUUID()
        .withMessage('El ID de la clase debe ser un UUID válido'),

    body('slot_horario_id')
        .notEmpty()
        .withMessage('El horario para la reprogramación es obligatorio')
        .isUUID()
        .withMessage('El ID del horario debe ser un UUID válido')
];

/**
 * Validación para los filtros de listado de clases (query params).
 */
const listarClasesValidation = [
    query('reservacion_id')
        .optional()
        .isUUID()
        .withMessage('El filtro de reservación debe ser un UUID válido'),

    query('instructor_id')
        .optional()
        .isUUID()
        .withMessage('El filtro de instructor debe ser un UUID válido'),

    query('estado')
        .optional()
        .isIn(['programada', 'completada', 'cancelada'])
        .withMessage('El filtro de estado debe ser uno de: programada, completada, cancelada'),

    query('fecha_desde')
        .optional()
        .isISO8601({ strict: true })
        .withMessage('La fecha desde debe tener formato válido (YYYY-MM-DD)'),

    query('fecha_hasta')
        .optional()
        .isISO8601({ strict: true })
        .withMessage('La fecha hasta debe tener formato válido (YYYY-MM-DD)')
];

/**
 * Validación para los filtros del historial de cancelaciones.
 */
const listarCancelacionesValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero positivo'),

    query('instructor_id')
        .optional()
        .isUUID()
        .withMessage('El filtro de instructor debe ser un UUID válido'),

    query('curso_id')
        .optional()
        .isUUID()
        .withMessage('El filtro de curso debe ser un UUID válido'),

    query('fecha_desde')
        .optional()
        .isISO8601({ strict: true })
        .withMessage('La fecha desde debe tener formato válido (YYYY-MM-DD)'),

    query('fecha_hasta')
        .optional()
        .isISO8601({ strict: true })
        .withMessage('La fecha hasta debe tener formato válido (YYYY-MM-DD)')
];

/**
 * Validación para el parámetro de cliente ID (avance de horas).
 */
const avanceClienteValidation = [
    param('id')
        .isUUID()
        .withMessage('El ID del cliente debe ser un UUID válido')
];

module.exports = {
    completarClaseValidation,
    cancelarClaseValidation,
    reprogramarClaseValidation,
    listarClasesValidation,
    listarCancelacionesValidation,
    avanceClienteValidation
};
