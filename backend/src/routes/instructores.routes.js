const { Router } = require('express');
const InstructoresController = require('../controllers/instructores.controller');
const { crearInstructorValidation, actualizarInstructorValidation } = require('../validators/instructor.validator');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/auth');

const router = Router();

// Todas las rutas de instructores requieren autenticación
router.use(authMiddleware);

// GET /api/admin/instructores — Listar instructores (ordenados alfabéticamente)
router.get(
    '/',
    InstructoresController.listar
);

// POST /api/admin/instructores — Crear instructor
router.post(
    '/',
    validate(crearInstructorValidation),
    InstructoresController.crear
);

// PUT /api/admin/instructores/:id — Actualizar instructor
router.put(
    '/:id',
    validate(actualizarInstructorValidation),
    InstructoresController.actualizar
);

// GET /api/admin/instructores/:id/agenda — Agenda semanal del instructor
router.get(
    '/:id/agenda',
    InstructoresController.agenda
);

module.exports = router;
