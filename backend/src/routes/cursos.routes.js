const { Router } = require('express');
const CursosController = require('../controllers/cursos.controller');
const { createCursoValidation, updateCursoValidation, cursoIdValidation } = require('../validators/curso.validator');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/auth');

const router = Router();

// === Endpoints Públicos ===

// GET /api/cursos — Listar cursos activos (público)
router.get(
    '/',
    CursosController.listarActivos
);

// GET /api/cursos/:id — Detalle de un curso activo (público)
router.get(
    '/:id',
    validate(cursoIdValidation),
    CursosController.detalle
);

// === Endpoints Admin (protegidos con JWT) ===

// POST /api/admin/cursos — Crear curso
router.post(
    '/',
    authMiddleware,
    validate(createCursoValidation),
    CursosController.crear
);

// PUT /api/admin/cursos/:id — Actualizar curso
router.put(
    '/:id',
    authMiddleware,
    validate(updateCursoValidation),
    CursosController.actualizar
);

// DELETE /api/admin/cursos/:id — Eliminar curso
router.delete(
    '/:id',
    authMiddleware,
    validate(cursoIdValidation),
    CursosController.eliminar
);

module.exports = router;
