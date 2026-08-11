const { Router } = require('express');
const ClasesController = require('../controllers/clases.controller');
const {
    completarClaseValidation,
    cancelarClaseValidation,
    reprogramarClaseValidation,
    listarClasesValidation,
    listarCancelacionesValidation,
    avanceClienteValidation
} = require('../validators/clase.validator');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/auth');

const router = Router();

// === Endpoints Admin — Clases (protegidos con JWT) ===
// Montado en: /api/admin/clases

// GET /api/admin/clases — Listar clases con filtros
router.get(
    '/',
    authMiddleware,
    validate(listarClasesValidation),
    ClasesController.listar
);

// PATCH /api/admin/clases/:id/completar — Marcar clase como completada
router.patch(
    '/:id/completar',
    authMiddleware,
    validate(completarClaseValidation),
    ClasesController.completar
);

// POST /api/admin/clases/:id/cancelar — Cancelar clase con motivo
router.post(
    '/:id/cancelar',
    authMiddleware,
    validate(cancelarClaseValidation),
    ClasesController.cancelar
);

// POST /api/admin/clases/:id/reprogramar — Reprogramar clase cancelada
router.post(
    '/:id/reprogramar',
    authMiddleware,
    validate(reprogramarClaseValidation),
    ClasesController.reprogramar
);

module.exports = router;
