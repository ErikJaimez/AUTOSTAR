const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Middleware de autenticación JWT.
 * Verifica el token Bearer del header Authorization,
 * decodifica el payload y lo adjunta a req.usuario.
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            tipo: 'AUTENTICACION',
            mensaje: 'Se requiere autenticación para acceder a este recurso'
        });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            tipo: 'AUTENTICACION',
            mensaje: 'Formato de token inválido. Use: Bearer <token>'
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, jwtConfig.secret, {
            algorithms: [jwtConfig.algorithm]
        });

        req.usuario = {
            id: decoded.id,
            nombre: decoded.nombre,
            email: decoded.email
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                tipo: 'AUTENTICACION',
                mensaje: 'La sesión ha expirado. Por favor, inicie sesión nuevamente'
            });
        }

        return res.status(401).json({
            tipo: 'AUTENTICACION',
            mensaje: 'Token de autenticación inválido'
        });
    }
}

module.exports = authMiddleware;
