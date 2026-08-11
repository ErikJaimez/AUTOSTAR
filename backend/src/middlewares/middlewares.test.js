import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ========== errorHandler tests ==========
describe('errorHandler', () => {
    let errorHandler, AppError;

    beforeEach(async () => {
        const mod = await import('./errorHandler.js');
        errorHandler = mod.errorHandler;
        AppError = mod.AppError;
    });

    function createRes() {
        const res = {
            statusCode: null,
            body: null,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.body = data;
                return this;
            }
        };
        return res;
    }

    const req = {};
    const next = () => {};

    it('maneja AppError de tipo VALIDACION con campos', () => {
        const err = new AppError('VALIDACION', 'Datos inválidos', 400, [
            { campo: 'email', mensaje: 'Formato inválido' }
        ]);
        const res = createRes();

        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res.body.tipo).toBe('VALIDACION');
        expect(res.body.mensaje).toBe('Datos inválidos');
        expect(res.body.campos).toHaveLength(1);
        expect(res.body.campos[0].campo).toBe('email');
    });

    it('maneja AppError de tipo AUTENTICACION', () => {
        const err = new AppError('AUTENTICACION', 'Token inválido', 401);
        const res = createRes();

        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.tipo).toBe('AUTENTICACION');
        expect(res.body.mensaje).toBe('Token inválido');
        expect(res.body.campos).toBeUndefined();
    });

    it('maneja AppError de tipo NO_ENCONTRADO', () => {
        const err = new AppError('NO_ENCONTRADO', 'Curso no encontrado', 404);
        const res = createRes();

        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(404);
        expect(res.body.tipo).toBe('NO_ENCONTRADO');
    });

    it('maneja AppError de tipo CONFLICTO', () => {
        const err = new AppError('CONFLICTO', 'El horario se traslapa', 409);
        const res = createRes();

        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(409);
        expect(res.body.tipo).toBe('CONFLICTO');
    });

    it('maneja errores con tipo asignado manualmente', () => {
        const err = new Error();
        err.tipo = 'NO_ENCONTRADO';
        err.mensaje = 'Recurso no existe';
        const res = createRes();

        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(404);
        expect(res.body.tipo).toBe('NO_ENCONTRADO');
        expect(res.body.mensaje).toBe('Recurso no existe');
    });

    it('maneja error de JSON mal formado', () => {
        const err = new Error('Unexpected token');
        err.type = 'entity.parse.failed';
        const res = createRes();

        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res.body.tipo).toBe('VALIDACION');
    });

    it('maneja errores desconocidos como ERROR_INTERNO', () => {
        const err = new Error('algo inesperado');
        const res = createRes();

        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(500);
        expect(res.body.tipo).toBe('ERROR_INTERNO');
        expect(res.body.mensaje).toBe('Ocurrió un error interno en el servidor');
    });

    it('incluye tiempo_restante cuando el error lo tiene', () => {
        const err = new AppError('BLOQUEO_TEMPORAL', 'Muchos intentos', 429);
        err.tiempoRestante = 120;
        const res = createRes();

        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(429);
        expect(res.body.tipo).toBe('BLOQUEO_TEMPORAL');
        expect(res.body.tiempo_restante).toBe(120);
    });
});

// ========== auth middleware tests ==========
describe('auth middleware', () => {
    let authMiddleware;
    let jwtConfig;

    beforeEach(async () => {
        const mod = await import('./auth.js');
        authMiddleware = mod.default;
        const configMod = await import('../config/jwt.js');
        jwtConfig = configMod.default;
    });

    function createReq(authHeader) {
        return { headers: { authorization: authHeader } };
    }

    function createRes() {
        const res = {
            statusCode: null,
            body: null,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.body = data;
                return this;
            }
        };
        return res;
    }

    it('rechaza si no hay header Authorization', () => {
        const req = { headers: {} };
        const res = createRes();
        const next = vi.fn();

        authMiddleware(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.tipo).toBe('AUTENTICACION');
        expect(next).not.toHaveBeenCalled();
    });

    it('rechaza formato de token incorrecto (sin Bearer)', () => {
        const req = createReq('Basic abc123');
        const res = createRes();
        const next = vi.fn();

        authMiddleware(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.mensaje).toContain('Formato de token inválido');
        expect(next).not.toHaveBeenCalled();
    });

    it('rechaza token inválido', () => {
        const req = createReq('Bearer token-invalido-123');
        const res = createRes();
        const next = vi.fn();

        authMiddleware(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.tipo).toBe('AUTENTICACION');
        expect(next).not.toHaveBeenCalled();
    });

    it('acepta token válido y adjunta usuario a req', () => {
        const payload = { id: 'user-123', nombre: 'Admin AUTOSTAR', email: 'admin@autostar.mx' };
        const token = jwt.sign(payload, jwtConfig.secret, {
            algorithm: jwtConfig.algorithm,
            expiresIn: '60m'
        });

        const req = createReq(`Bearer ${token}`);
        const res = createRes();
        const next = vi.fn();

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.usuario).toBeDefined();
        expect(req.usuario.id).toBe('user-123');
        expect(req.usuario.nombre).toBe('Admin AUTOSTAR');
        expect(req.usuario.email).toBe('admin@autostar.mx');
    });
});

// ========== rateLimit tests ==========
describe('rateLimit', () => {
    let registrarIntentoFallido, registrarExito, verificarBloqueo, limpiarStore, rateLimitMiddleware, MAX_INTENTOS;

    beforeEach(async () => {
        const mod = await import('./rateLimit.js');
        registrarIntentoFallido = mod.registrarIntentoFallido;
        registrarExito = mod.registrarExito;
        verificarBloqueo = mod.verificarBloqueo;
        limpiarStore = mod.limpiarStore;
        rateLimitMiddleware = mod.rateLimitMiddleware;
        MAX_INTENTOS = mod.MAX_INTENTOS;
        limpiarStore();
    });

    it('no bloquea en el primer intento fallido', () => {
        const resultado = registrarIntentoFallido('user1');
        expect(resultado.bloqueado).toBe(false);
        expect(resultado.intentosRestantes).toBe(MAX_INTENTOS - 1);
    });

    it('bloquea después de 5 intentos fallidos consecutivos', () => {
        for (let i = 0; i < 4; i++) {
            registrarIntentoFallido('user1');
        }
        const resultado = registrarIntentoFallido('user1');
        expect(resultado.bloqueado).toBe(true);
        expect(resultado.intentosRestantes).toBe(0);
        expect(resultado.tiempoRestante).toBeGreaterThan(0);
    });

    it('verificarBloqueo retorna bloqueado=true cuando el usuario está bloqueado', () => {
        for (let i = 0; i < 5; i++) {
            registrarIntentoFallido('user2');
        }
        const { bloqueado, tiempoRestante } = verificarBloqueo('user2');
        expect(bloqueado).toBe(true);
        expect(tiempoRestante).toBeGreaterThan(0);
    });

    it('verificarBloqueo retorna bloqueado=false para usuario sin intentos', () => {
        const { bloqueado } = verificarBloqueo('user-nuevo');
        expect(bloqueado).toBe(false);
    });

    it('registrarExito reinicia el contador', () => {
        registrarIntentoFallido('user3');
        registrarIntentoFallido('user3');
        registrarExito('user3');

        const { bloqueado } = verificarBloqueo('user3');
        expect(bloqueado).toBe(false);

        // Después del reset, se necesitan 5 nuevos intentos para bloquear
        for (let i = 0; i < 4; i++) {
            const resultado = registrarIntentoFallido('user3');
            expect(resultado.bloqueado).toBe(false);
        }
        const resultado = registrarIntentoFallido('user3');
        expect(resultado.bloqueado).toBe(true);
    });

    it('middleware permite el paso si el usuario no está bloqueado', () => {
        const req = { body: { usuario: 'libre' } };
        const res = {
            statusCode: null,
            body: null,
            status(code) { this.statusCode = code; return this; },
            json(data) { this.body = data; return this; }
        };
        const next = vi.fn();

        rateLimitMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.statusCode).toBeNull();
    });

    it('middleware bloquea si el usuario tiene 5 intentos fallidos', () => {
        for (let i = 0; i < 5; i++) {
            registrarIntentoFallido('bloqueado');
        }

        const req = { body: { usuario: 'bloqueado' } };
        const res = {
            statusCode: null,
            body: null,
            status(code) { this.statusCode = code; return this; },
            json(data) { this.body = data; return this; }
        };
        const next = vi.fn();

        rateLimitMiddleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(429);
        expect(res.body.tipo).toBe('BLOQUEO_TEMPORAL');
        expect(res.body.tiempo_restante).toBeGreaterThan(0);
    });

    it('middleware permite el paso si no hay username en el body', () => {
        const req = { body: {} };
        const res = {
            statusCode: null,
            body: null,
            status(code) { this.statusCode = code; return this; },
            json(data) { this.body = data; return this; }
        };
        const next = vi.fn();

        rateLimitMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ========== validate middleware tests ==========
describe('validate middleware', () => {
    let validate;

    beforeEach(async () => {
        const mod = await import('./validate.js');
        validate = mod.default;
    });

    function createRes() {
        const res = {
            statusCode: null,
            body: null,
            status(code) { this.statusCode = code; return this; },
            json(data) { this.body = data; return this; }
        };
        return res;
    }

    it('pasa al siguiente middleware si no hay errores de validación', async () => {
        const validations = [
            body('email').isEmail().withMessage('Email inválido')
        ];

        const middleware = validate(validations);
        const req = { body: { email: 'test@example.com' } };
        const res = createRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.statusCode).toBeNull();
    });

    it('retorna 400 con formato VALIDACION si hay errores', async () => {
        const validations = [
            body('email').isEmail().withMessage('El formato del correo electrónico no es válido'),
            body('telefono').isLength({ min: 10, max: 10 }).withMessage('El teléfono debe tener exactamente 10 dígitos')
        ];

        const middleware = validate(validations);
        const req = { body: { email: 'invalido', telefono: '123' } };
        const res = createRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(400);
        expect(res.body.tipo).toBe('VALIDACION');
        expect(res.body.mensaje).toBe('Los datos proporcionados no son válidos');
        expect(res.body.campos).toHaveLength(2);
        expect(res.body.campos[0].campo).toBe('email');
        expect(res.body.campos[0].mensaje).toBe('El formato del correo electrónico no es válido');
        expect(res.body.campos[1].campo).toBe('telefono');
    });

    it('mapea correctamente un solo campo con error', async () => {
        const validations = [
            body('nombre').notEmpty().withMessage('El nombre es obligatorio')
        ];

        const middleware = validate(validations);
        const req = { body: { nombre: '' } };
        const res = createRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res.body.campos).toHaveLength(1);
        expect(res.body.campos[0]).toEqual({
            campo: 'nombre',
            mensaje: 'El nombre es obligatorio'
        });
    });
});
