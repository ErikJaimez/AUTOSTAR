import { describe, expect, it } from 'vitest';
import { AppError, errorHandler, TIPOS_ERROR } from './errorHandler';

describe('errorHandler middleware', () => {
    function createMockRes() {
        const res = {};
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => { res.body = data; return res; };
        return res;
    }

    const mockReq = {};
    const mockNext = () => {};

    describe('TIPOS_ERROR', () => {
        it('contiene VALIDACION con status 400', () => {
            expect(TIPOS_ERROR.VALIDACION.statusCode).toBe(400);
        });

        it('contiene AUTENTICACION con status 401', () => {
            expect(TIPOS_ERROR.AUTENTICACION.statusCode).toBe(401);
        });

        it('contiene ACCESO_DENEGADO con status 403', () => {
            expect(TIPOS_ERROR.ACCESO_DENEGADO.statusCode).toBe(403);
        });

        it('contiene NO_ENCONTRADO con status 404', () => {
            expect(TIPOS_ERROR.NO_ENCONTRADO.statusCode).toBe(404);
        });

        it('contiene CONFLICTO con status 409', () => {
            expect(TIPOS_ERROR.CONFLICTO.statusCode).toBe(409);
        });

        it('contiene BLOQUEO_TEMPORAL con status 429', () => {
            expect(TIPOS_ERROR.BLOQUEO_TEMPORAL.statusCode).toBe(429);
        });

        it('contiene ERROR_INTERNO con status 500', () => {
            expect(TIPOS_ERROR.ERROR_INTERNO.statusCode).toBe(500);
        });
    });

    describe('formato de respuesta', () => {
        it('retorna formato { tipo, mensaje } para AppError', () => {
            const err = new AppError('VALIDACION', 'Campo inválido', 400);
            const res = createMockRes();

            errorHandler(err, mockReq, res, mockNext);

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('tipo', 'VALIDACION');
            expect(res.body).toHaveProperty('mensaje', 'Campo inválido');
        });

        it('incluye campos cuando están presentes en AppError', () => {
            const campos = [{ campo: 'email', mensaje: 'Formato inválido' }];
            const err = new AppError('VALIDACION', 'Datos inválidos', 400, campos);
            const res = createMockRes();

            errorHandler(err, mockReq, res, mockNext);

            expect(res.body).toHaveProperty('campos');
            expect(res.body.campos).toEqual(campos);
        });

        it('no incluye campos cuando es null', () => {
            const err = new AppError('NO_ENCONTRADO', 'No existe', 404);
            const res = createMockRes();

            errorHandler(err, mockReq, res, mockNext);

            expect(res.body).not.toHaveProperty('campos');
        });

        it('maneja error con tipo ACCESO_DENEGADO (403)', () => {
            const err = new AppError('ACCESO_DENEGADO', 'Sin permisos', 403);
            const res = createMockRes();

            errorHandler(err, mockReq, res, mockNext);

            expect(res.statusCode).toBe(403);
            expect(res.body.tipo).toBe('ACCESO_DENEGADO');
            expect(res.body.mensaje).toBe('Sin permisos');
        });

        it('maneja errores con tipo manual conocido', () => {
            const err = { tipo: 'CONFLICTO', mensaje: 'Conflicto detectado' };
            const res = createMockRes();

            errorHandler(err, mockReq, res, mockNext);

            expect(res.statusCode).toBe(409);
            expect(res.body.tipo).toBe('CONFLICTO');
        });

        it('retorna 500 para errores desconocidos', () => {
            const err = new Error('algo salió mal');
            const res = createMockRes();

            errorHandler(err, mockReq, res, mockNext);

            expect(res.statusCode).toBe(500);
            expect(res.body.tipo).toBe('ERROR_INTERNO');
        });

        it('maneja JSON parse errors como VALIDACION 400', () => {
            const err = { type: 'entity.parse.failed' };
            const res = createMockRes();

            errorHandler(err, mockReq, res, mockNext);

            expect(res.statusCode).toBe(400);
            expect(res.body.tipo).toBe('VALIDACION');
        });
    });
});
