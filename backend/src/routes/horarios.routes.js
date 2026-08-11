const { Router } = require('express');
const HorariosController = require('../controllers/horarios.controller');
const { crearHorarioValidation, actualizarHorarioValidation, horarioIdValidation } = require('../validators/horario.validator');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/auth');

const router = Router();

// === Endpoints Admin (protegidos con JWT) ===

// GET /api/admin/horarios — Listar todos los slots (admin)
router.get(
    '/',
    authMiddleware,
    HorariosController.listar
);

// POST /api/admin/horarios — Crear slot
router.post(
    '/',
    authMiddleware,
    validate(crearHorarioValidation),
    HorariosController.crear
);

// PUT /api/admin/horarios/:id — Actualizar slot
router.put(
    '/:id',
    authMiddleware,
    validate(actualizarHorarioValidation),
    HorariosController.actualizar
);

// DELETE /api/admin/horarios/:id — Eliminar slot
router.delete(
    '/:id',
    authMiddleware,
    validate(horarioIdValidation),
    HorariosController.eliminar
);

module.exports = router;
