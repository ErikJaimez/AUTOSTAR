/**
 * Middleware de validación global de longitud máxima por campo de texto.
 * Rechaza solicitudes donde cualquier campo de texto en req.body exceda 10,000 caracteres.
 */

const MAX_LENGTH = 10000;

/**
 * Recorre recursivamente un objeto y retorna los paths de campos string
 * que exceden la longitud máxima permitida.
 * @param {*} obj - El objeto a inspeccionar
 * @param {string} prefix - Prefijo para construir el path del campo
 * @returns {string[]} - Array con los paths de campos que exceden la longitud
 */
function findOversizedFields(obj, prefix = '') {
    const oversized = [];

    if (obj === null || obj === undefined) {
        return oversized;
    }

    if (typeof obj === 'string') {
        if (obj.length > MAX_LENGTH) {
            oversized.push(prefix || 'valor');
        }
        return oversized;
    }

    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            const fieldPath = prefix ? `${prefix}[${i}]` : `[${i}]`;
            oversized.push(...findOversizedFields(obj[i], fieldPath));
        }
        return oversized;
    }

    if (typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
            const fieldPath = prefix ? `${prefix}.${key}` : key;
            oversized.push(...findOversizedFields(obj[key], fieldPath));
        }
    }

    return oversized;
}

/**
 * Middleware Express que valida longitud de campos de texto en req.body.
 * Si algún campo excede 10,000 caracteres, retorna 400 con tipo VALIDACION
 * e identifica los campos específicos.
 */
function inputLengthValidator(req, res, next) {
    if (!req.body || typeof req.body !== 'object') {
        return next();
    }

    const oversizedFields = findOversizedFields(req.body);

    if (oversizedFields.length > 0) {
        return res.status(400).json({
            tipo: 'VALIDACION',
            mensaje: 'Uno o más campos exceden la longitud máxima permitida de 10,000 caracteres',
            campos: oversizedFields.map(campo => ({
                campo,
                mensaje: `El campo excede la longitud máxima permitida de ${MAX_LENGTH} caracteres`
            }))
        });
    }

    next();
}

module.exports = { inputLengthValidator, findOversizedFields, MAX_LENGTH };
