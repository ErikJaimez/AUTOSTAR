const { Router } = require('express');
const AuthController = require('../controllers/auth.controller');
const { loginValidation } = require('../validators/auth.validator');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/auth');
const { rateLimitMiddleware } = require('../middlewares/rateLimit');

const router = Router();

// POST /api/auth/login — Inicio de sesión (público)
router.post(
    '/login',
    rateLimitMiddleware,
    validate(loginValidation),
    AuthController.login
);

// POST /api/auth/logout — Cerrar sesión (protegido)
router.post(
    '/logout',
    authMiddleware,
    AuthController.logout
);

// GET /api/auth/me — Verificar sesión activa (protegido)
router.get(
    '/me',
    authMiddleware,
    AuthController.me
);

module.exports = router;
