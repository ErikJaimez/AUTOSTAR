const { body, param } = require('express-validator');

/**
 * Validaciones para la creación de un curso.
 * Todos los campos obligatorios deben estar presentes y dentro de rangos.
 */
const createCursoValidation = [
    body('nombre')
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isString()
        .withMessage('El nombre debe ser texto')
        .isLength({ min: 1, max: 100 })
        .withMessage('El nombre debe tener entre 1 y 100 caracteres')
        .trim(),

    body('descripcion')
        .notEmpty()
        .withMessage('La descripción es obligatoria')
        .isString()
        .withMessage('La descripción debe ser texto')
        .isLength({ min: 1, max: 2000 })
        .withMessage('La descripción debe tener entre 1 y 2000 caracteres')
        .trim(),

    body('descripcion_resumida')
        .optional({ values: 'null' })
        .isString()
        .withMessage('La descripción resumida debe ser texto')
        .isLength({ max: 150 })
        .withMessage('La descripción resumida no debe exceder 150 caracteres')
        .trim(),

    body('duracion_horas')
        .notEmpty()
        .withMessage('La duración en horas es obligatoria')
        .isInt({ min: 1, max: 200 })
        .withMessage('La duración debe ser un número entero entre 1 y 200 horas'),

    body('precio')
        .notEmpty()
        .withMessage('El precio es obligatorio')
        .isFloat({ min: 0.01, max: 99999.99 })
        .withMessage('El precio debe estar entre $0.01 y $99,999.99'),

    body('categoria_licencia')
        .notEmpty()
        .withMessage('La categoría de licencia es obligatoria')
        .isString()
        .withMessage('La categoría de licencia debe ser texto')
        .isLength({ min: 1, max: 50 })
        .withMessage('La categoría de licencia debe tener entre 1 y 50 caracteres')
        .trim(),

    body('requisitos_previos')
        .optional({ values: 'null' })
        .isString()
        .withMessage('Los requisitos previos deben ser texto')
        .isLength({ max: 500 })
        .withMessage('Los requisitos previos no deben exceder 500 caracteres')
        .trim(),

    body('activo')
        .optional()
        .isBoolean()
        .withMessage('El campo activo debe ser un valor booleano')
];

/**
 * Validaciones para la actualización de un curso.
 * Los mismos campos que la creación pero todos opcionales.
 */
const updateCursoValidation = [
    param('id')
        .isUUID()
        .withMessage('El ID del curso debe ser un UUID válido'),

    body('nombre')
        .optional()
        .isString()
        .withMessage('El nombre debe ser texto')
        .isLength({ min: 1, max: 100 })
        .withMessage('El nombre debe tener entre 1 y 100 caracteres')
        .trim(),

    body('descripcion')
        .optional()
        .isString()
        .withMessage('La descripción debe ser texto')
        .isLength({ min: 1, max: 2000 })
        .withMessage('La descripción debe tener entre 1 y 2000 caracteres')
        .trim(),

    body('descripcion_resumida')
        .optional({ values: 'null' })
        .isString()
        .withMessage('La descripción resumida debe ser texto')
        .isLength({ max: 150 })
        .withMessage('La descripción resumida no debe exceder 150 caracteres')
        .trim(),

    body('duracion_horas')
        .optional()
        .isInt({ min: 1, max: 200 })
        .withMessage('La duración debe ser un número entero entre 1 y 200 horas'),

    body('precio')
        .optional()
        .isFloat({ min: 0.01, max: 99999.99 })
        .withMessage('El precio debe estar entre $0.01 y $99,999.99'),

    body('categoria_licencia')
        .optional()
        .isString()
        .withMessage('La categoría de licencia debe ser texto')
        .isLength({ min: 1, max: 50 })
        .withMessage('La categoría de licencia debe tener entre 1 y 50 caracteres')
        .trim(),

    body('requisitos_previos')
        .optional({ values: 'null' })
        .isString()
        .withMessage('Los requisitos previos deben ser texto')
        .isLength({ max: 500 })
        .withMessage('Los requisitos previos no deben exceder 500 caracteres')
        .trim(),

    body('activo')
        .optional()
        .isBoolean()
        .withMessage('El campo activo debe ser un valor booleano')
];

/**
 * Validación del parámetro ID para endpoints de detalle/eliminación.
 */
const cursoIdValidation = [
    param('id')
        .isUUID()
        .withMessage('El ID del curso debe ser un UUID válido')
];

module.exports = {
    createCursoValidation,
    updateCursoValidation,
    cursoIdValidation
};
