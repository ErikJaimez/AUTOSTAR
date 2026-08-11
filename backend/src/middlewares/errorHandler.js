/**
 * Clase base para errores de la aplicación.
 * Permite clasificar errores por tipo y asignar código HTTP apropiado.
 */
class AppError extends Error {
    constructor(tipo, mensaje, statusCode, campos = null) {
        super(mensaje);
        this.tipo = tipo;
        this.mensaje = mensaje;
        this.statusCode = statusCode;
        this.campos = campos;
    }
}

/**
 * Errores predefinidos por tipo con códigos HTTP y mensajes en español.
 */
const TIPOS_ERROR = {
    VALIDACION: { statusCode: 400, mensajeDefault: 'Los datos proporcionados no son válidos' },
    AUTENTICACION: { statusCode: 401, mensajeDefault: 'Se requiere autenticación para acceder a este recurso' },
    ACCESO_DENEGADO: { statusCode: 403, mensajeDefault: 'No tiene permisos para realizar esta acción' },
    NO_ENCONTRADO: { statusCode: 404, mensajeDefault: 'El recurso solicitado no fue encontrado' },
    CONFLICTO: { statusCode: 409, mensajeDefault: 'La operación genera un conflicto con el estado actual del recurso' },
    BLOQUEO_TEMPORAL: { statusCode: 429, mensajeDefault: 'Demasiados intentos. Por favor, espere antes de intentar nuevamente' },
    ERROR_INTERNO: { statusCode: 500, mensajeDefault: 'Ocurrió un error interno en el servidor' }
};

/**
 * Middleware de manejo centralizado de errores (4 parámetros para Express).
 * Clasifica el error por tipo y retorna respuesta HTTP apropiada en español.
 */
function errorHandler(err, req, res, _next) {
    // Si el error ya es un AppError con tipo conocido
    if (err instanceof AppError) {
        const response = {
            tipo: err.tipo,
            mensaje: err.mensaje
        };

        if (err.campos) {
            response.campos = err.campos;
        }

        if (err.tiempoRestante) {
            response.tiempo_restante = err.tiempoRestante;
        }

        return res.status(err.statusCode).json(response);
    }

    // Si el error tiene un tipo conocido asignado manualmente
    if (err.tipo && TIPOS_ERROR[err.tipo]) {
        const tipoConfig = TIPOS_ERROR[err.tipo];
        const response = {
            tipo: err.tipo,
            mensaje: err.mensaje || tipoConfig.mensajeDefault
        };

        if (err.campos) {
            response.campos = err.campos;
        }

        if (err.tiempo_restante || err.tiempoRestante) {
            response.tiempo_restante = err.tiempo_restante || err.tiempoRestante;
        }

        return res.status(err.statusCode || tipoConfig.statusCode).json(response);
    }

    // Error de validación de JSON (body mal formado)
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            tipo: 'VALIDACION',
            mensaje: 'El cuerpo de la solicitud contiene JSON inválido'
        });
    }

    // Error desconocido → ERROR_INTERNO con mensaje genérico
    console.error('Error no manejado:', err);

    return res.status(500).json({
        tipo: 'ERROR_INTERNO',
        mensaje: 'Ocurrió un error interno en el servidor'
    });
}

module.exports = { errorHandler, AppError, TIPOS_ERROR };
