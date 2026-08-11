const { body } = require('express-validator');

/**
 * Validaciones para crear un instructor.
 * Campos obligatorios: nombre_completo, telefono, email.
 * Campo opcional: activo.
 */
const crearInstructorValidation = [
    body('nombre_completo')
        .notEmpty()
        .withMessage('El nombre completo es obligatorio')
        .isString()
        .withMessage('El nombre completo debe ser texto')
        .trim()
        .isLength({ min: 1, max: 120 })
        .withMessage('El nombre completo debe tener entre 1 y 120 caracteres'),

    body('telefono')
        .notEmpty()
        .withMessage('El teléfono es obligatorio')
        .matches(/^\d{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos numéricos'),

    body('email')
        .notEmpty()
        .withMessage('El correo electrónico es obligatorio')
        .isEmail()
        .withMessage('El formato del correo electrónico no es válido')
        .isLength({ max: 150 })
        .withMessage('El correo electrónico no debe exceder 150 caracteres')
        .normalizeEmail(),

    body('activo')
        .optional()
        .isBoolean()
        .withMessage('El campo activo debe ser verdadero o falso')
];

/**
 * Validaciones para actualizar un instructor.
 * Todos los campos son opcionales pero se validan si están presentes.
 */
const actualizarInstructorValidation = [
    body('nombre_completo')
        .optional()
        .isString()
        .withMessage('El nombre completo debe ser texto')
        .trim()
        .isLength({ min: 1, max: 120 })
        .withMessage('El nombre completo debe tener entre 1 y 120 caracteres'),

    body('telefono')
        .optional()
        .matches(/^\d{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos numéricos'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('El formato del correo electrónico no es válido')
        .isLength({ max: 150 })
        .withMessage('El correo electrónico no debe exceder 150 caracteres')
        .normalizeEmail(),

    body('activo')
        .optional()
        .isBoolean()
        .withMessage('El campo activo debe ser verdadero o falso')
];

module.exports = {
    crearInstructorValidation,
    actualizarInstructorValidation
};
