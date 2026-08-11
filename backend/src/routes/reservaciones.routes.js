const { Router } = require('express');
const ReservacionesController = require('../controllers/reservaciones.controller');
const {
    createReservacionValidation,
    cambiarEstadoValidation,
    listarReservacionesValidation
} = require('../validators/reservacion.validator');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/auth');

const router = Router();

// === Endpoint Público ===

// POST /api/reservaciones — Crear reservación (público, sin auth)
router.post(
    '/',
    validate(createReservacionValidation),
    ReservacionesController.crear
);

// === Endpoints Admin (protegidos con JWT) ===

// GET /api/admin/reservaciones — Listar reservaciones con filtros y paginación
router.get(
    '/',
    authMiddleware,
    validate(listarReservacionesValidation),
    ReservacionesController.listar
);

// PATCH /api/admin/reservaciones/:id/estado — Cambiar estado de reservación
router.patch(
    '/:id/estado',
    authMiddleware,
    validate(cambiarEstadoValidation),
    ReservacionesController.cambiarEstado
);

module.exports = router;
