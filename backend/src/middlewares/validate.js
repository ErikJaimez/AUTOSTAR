const { validationResult } = require('express-validator');

/**
 * Middleware wrapper para express-validator.
 * Ejecuta las validaciones y retorna errores estructurados en formato estándar.
 *
 * @param {Array} validations - Array de middlewares de express-validator
 * @returns {Function} Middleware de Express
 */
function validate(validations) {
    return async (req, res, next) => {
        // Ejecutar todas las validaciones
        for (const validation of validations) {
            await validation.run(req);
        }

        const errors = validationResult(req);

        if (errors.isEmpty()) {
            return next();
        }

        const campos = errors.array().map((error) => ({
            campo: error.path || error.param,
            mensaje: error.msg
        }));

        return res.status(400).json({
            tipo: 'VALIDACION',
            mensaje: 'Los datos proporcionados no son válidos',
            campos
        });
    };
}

module.exports = validate;
