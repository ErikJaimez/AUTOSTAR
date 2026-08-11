const { body, param } = require('express-validator');

/**
 * Validaciones para crear un slot de horario.
 * Campos obligatorios: curso_id, instructor_id, fecha, hora_inicio, hora_fin, capacidad_maxima.
 */
const crearHorarioValidation = [
    body('curso_id')
        .notEmpty()
        .withMessage('El curso es obligatorio')
        .isUUID()
        .withMessage('El ID del curso debe ser un UUID válido'),

    body('instructor_id')
        .notEmpty()
        .withMessage('El instructor es obligatorio')
        .isUUID()
        .withMessage('El ID del instructor debe ser un UUID válido'),

    body('fecha')
        .notEmpty()
        .withMessage('La fecha es obligatoria')
        .isDate()
        .withMessage('La fecha debe tener formato válido (YYYY-MM-DD)'),

    body('hora_inicio')
        .notEmpty()
        .withMessage('La hora de inicio es obligatoria')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('La hora de inicio debe tener formato HH:MM (00:00-23:59)'),

    body('hora_fin')
        .notEmpty()
        .withMessage('La hora de fin es obligatoria')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('La hora de fin debe tener formato HH:MM (00:00-23:59)')
        .custom((value, { req }) => {
            if (req.body.hora_inicio && value <= req.body.hora_inicio) {
                throw new Error('La hora de fin debe ser posterior a la hora de inicio');
            }
            return true;
        }),

    body('capacidad_maxima')
        .notEmpty()
        .withMessage('La capacidad máxima es obligatoria')
        .isInt({ min: 1, max: 30 })
        .withMessage('La capacidad máxima debe ser un número entero entre 1 y 30')
];

/**
 * Validaciones para actualizar un slot de horario.
 * Todos los campos son opcionales pero se validan si están presentes.
 */
const actualizarHorarioValidation = [
    param('id')
        .isUUID()
        .withMessage('El ID del slot debe ser un UUID válido'),

    body('curso_id')
        .optional()
        .isUUID()
        .withMessage('El ID del curso debe ser un UUID válido'),

    body('instructor_id')
        .optional()
        .isUUID()
        .withMessage('El ID del instructor debe ser un UUID válido'),

    body('fecha')
        .optional()
        .isDate()
        .withMessage('La fecha debe tener formato válido (YYYY-MM-DD)'),

    body('hora_inicio')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('La hora de inicio debe tener formato HH:MM (00:00-23:59)'),

    body('hora_fin')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('La hora de fin debe tener formato HH:MM (00:00-23:59)')
        .custom((value, { req }) => {
            const horaInicio = req.body.hora_inicio;
            if (horaInicio && value && value <= horaInicio) {
                throw new Error('La hora de fin debe ser posterior a la hora de inicio');
            }
            return true;
        }),

    body('capacidad_maxima')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('La capacidad máxima debe ser un número entero entre 1 y 30')
];

/**
 * Validación de parámetro ID para operaciones de lectura/eliminación.
 */
const horarioIdValidation = [
    param('id')
        .isUUID()
        .withMessage('El ID del slot debe ser un UUID válido')
];

module.exports = {
    crearHorarioValidation,
    actualizarHorarioValidation,
    horarioIdValidation
};
