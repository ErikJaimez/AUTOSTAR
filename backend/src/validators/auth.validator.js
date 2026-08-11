const { body } = require('express-validator');

/**
 * Validaciones para el endpoint de login.
 * Verifica que nombre_usuario y contrasena estén presentes y no estén vacíos.
 */
const loginValidation = [
    body('nombre_usuario')
        .notEmpty()
        .withMessage('El nombre de usuario es obligatorio')
        .isString()
        .withMessage('El nombre de usuario debe ser texto')
        .trim(),

    body('contrasena')
        .notEmpty()
        .withMessage('La contraseña es obligatoria')
        .isString()
        .withMessage('La contraseña debe ser texto')
];

module.exports = {
    loginValidation
};
