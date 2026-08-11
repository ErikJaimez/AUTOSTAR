import { describe, expect, it } from 'vitest';
import { findOversizedFields, inputLengthValidator, MAX_LENGTH } from './inputLength';

describe('inputLength middleware', () => {
    describe('findOversizedFields', () => {
        it('retorna array vacío para objetos con campos dentro del límite', () => {
            const obj = { nombre: 'Test', descripcion: 'Breve' };
            expect(findOversizedFields(obj)).toEqual([]);
        });

        it('detecta campo string que excede el límite', () => {
            const obj = { descripcion: 'x'.repeat(MAX_LENGTH + 1) };
            expect(findOversizedFields(obj)).toEqual(['descripcion']);
        });

        it('detecta múltiples campos que exceden el límite', () => {
            const obj = {
                nombre: 'x'.repeat(MAX_LENGTH + 1),
                descripcion: 'x'.repeat(MAX_LENGTH + 1),
                valido: 'ok'
            };
            const result = findOversizedFields(obj);
            expect(result).toContain('nombre');
            expect(result).toContain('descripcion');
            expect(result).not.toContain('valido');
        });

        it('detecta campos anidados que exceden el límite', () => {
            const obj = { datos: { nested: 'x'.repeat(MAX_LENGTH + 1) } };
            expect(findOversizedFields(obj)).toEqual(['datos.nested']);
        });

        it('detecta campos dentro de arrays que exceden el límite', () => {
            const obj = { items: ['ok', 'x'.repeat(MAX_LENGTH + 1)] };
            expect(findOversizedFields(obj)).toEqual(['items[1]']);
        });

        it('retorna array vacío para null o undefined', () => {
            expect(findOversizedFields(null)).toEqual([]);
            expect(findOversizedFields(undefined)).toEqual([]);
        });

        it('retorna array vacío para campos exactamente en el límite', () => {
            const obj = { campo: 'x'.repeat(MAX_LENGTH) };
            expect(findOversizedFields(obj)).toEqual([]);
        });

        it('detecta campo con longitud MAX_LENGTH + 1', () => {
            const obj = { campo: 'x'.repeat(MAX_LENGTH + 1) };
            expect(findOversizedFields(obj)).toEqual(['campo']);
        });
    });

    describe('inputLengthValidator middleware', () => {
        function createMockReq(body) {
            return { body };
        }

        function createMockRes() {
            const res = {};
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => { res.body = data; return res; };
            return res;
        }

        it('llama a next() cuando body es válido', () => {
            const req = createMockReq({ nombre: 'Test' });
            const res = createMockRes();
            let nextCalled = false;

            inputLengthValidator(req, res, () => { nextCalled = true; });

            expect(nextCalled).toBe(true);
        });

        it('llama a next() cuando body es null', () => {
            const req = createMockReq(null);
            const res = createMockRes();
            let nextCalled = false;

            inputLengthValidator(req, res, () => { nextCalled = true; });

            expect(nextCalled).toBe(true);
        });

        it('retorna 400 con formato correcto cuando un campo excede el límite', () => {
            const req = createMockReq({ descripcion: 'x'.repeat(MAX_LENGTH + 1) });
            const res = createMockRes();
            let nextCalled = false;

            inputLengthValidator(req, res, () => { nextCalled = true; });

            expect(nextCalled).toBe(false);
            expect(res.statusCode).toBe(400);
            expect(res.body.tipo).toBe('VALIDACION');
            expect(res.body.mensaje).toContain('10,000');
            expect(res.body.campos).toHaveLength(1);
            expect(res.body.campos[0].campo).toBe('descripcion');
        });

        it('identifica todos los campos que exceden el límite', () => {
            const req = createMockReq({
                campo1: 'x'.repeat(MAX_LENGTH + 1),
                campo2: 'x'.repeat(MAX_LENGTH + 1),
                campoOk: 'válido'
            });
            const res = createMockRes();

            inputLengthValidator(req, res, () => {});

            expect(res.statusCode).toBe(400);
            expect(res.body.campos).toHaveLength(2);
            const campos = res.body.campos.map(c => c.campo);
            expect(campos).toContain('campo1');
            expect(campos).toContain('campo2');
        });
    });
});
