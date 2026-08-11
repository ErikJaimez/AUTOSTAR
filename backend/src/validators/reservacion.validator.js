const { body, param, query } = require('express-validator');

/**
 * Validaciones para la creación de una reservación (endpoint público).
 * Valida todos los campos del formulario de reservación.
 */
const createReservacionValidation = [
    body('nombre_completo')
        .notEmpty()
        .withMessage('El nombre completo es obligatorio')
        .isString()
        .withMessage('El nombre completo debe ser texto')
        .isLength({ min: 1, max: 120 })
        .withMessage('El nombre completo debe tener entre 1 y 120 caracteres')
        .trim(),

    body('edad')
        .notEmpty()
        .withMessage('La edad es obligatoria')
        .isInt({ min: 16, max: 99 })
        .withMessage('La edad debe ser un número entero entre 16 y 99 años'),

    body('direccion')
        .notEmpty()
        .withMessage('La dirección es obligatoria')
        .isString()
        .withMessage('La dirección debe ser texto')
        .isLength({ min: 1, max: 100 })
        .withMessage('La dirección debe tener entre 1 y 100 caracteres')
        .trim(),

    body('codigo_postal')
        .notEmpty()
        .withMessage('El código postal es obligatorio')
        .matches(/^\d{5}$/)
        .withMessage('El código postal debe ser exactamente 5 dígitos numéricos'),

    body('telefono')
        .notEmpty()
        .withMessage('El teléfono es obligatorio')
        .matches(/^\d{10}$/)
        .withMessage('El teléfono debe ser exactamente 10 dígitos numéricos'),

    body('email')
        .notEmpty()
        .withMessage('El correo electrónico es obligatorio')
        .isEmail()
        .withMessage('El correo electrónico debe tener un formato válido (usuario@dominio)')
        .normalizeEmail(),

    body('slot_horario_id')
        .notEmpty()
        .withMessage('El horario es obligatorio')
        .isUUID()
        .withMessage('El ID del horario debe ser un UUID válido'),

    body('curso_id')
        .notEmpty()
        .withMessage('El curso es obligatorio')
        .isUUID()
        .withMessage('El ID del curso debe ser un UUID válido')
];

/**
 * Validaciones para cambio de estado de una reservación (endpoint admin).
 */
const cambiarEstadoValidation = [
    param('id')
        .isUUID()
        .withMessage('El ID de la reservación debe ser un UUID válido'),

    body('estado')
        .notEmpty()
        .withMessage('El nuevo estado es obligatorio')
        .isIn(['pendiente', 'confirmada', 'completada', 'cancelada'])
        .withMessage('El estado debe ser uno de: pendiente, confirmada, completada, cancelada')
];

/**
 * Validaciones para el parámetro ID en endpoints de detalle.
 */
const reservacionIdValidation = [
    param('id')
        .isUUID()
        .withMessage('El ID de la reservación debe ser un UUID válido')
];

/**
 * Validaciones para los filtros de listado (query params).
 */
const listarReservacionesValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero positivo'),

    query('estado')
        .optional()
        .isIn(['pendiente', 'confirmada', 'completada', 'cancelada'])
        .withMessage('El filtro de estado debe ser uno de: pendiente, confirmada, completada, cancelada'),

    query('curso_id')
        .optional()
        .isUUID()
        .withMessage('El filtro de curso debe ser un UUID válido'),

    query('instructor_id')
        .optional()
        .isUUID()
        .withMessage('El filtro de instructor debe ser un UUID válido'),

    query('fecha_desde')
        .optional()
        .isISO8601({ strict: true })
        .withMessage('La fecha desde debe tener formato válido (YYYY-MM-DD)'),

    query('fecha_hasta')
        .optional()
        .isISO8601({ strict: true })
        .withMessage('La fecha hasta debe tener formato válido (YYYY-MM-DD)')
];

module.exports = {
    createReservacionValidation,
    cambiarEstadoValidation,
    reservacionIdValidation,
    listarReservacionesValidation
};
