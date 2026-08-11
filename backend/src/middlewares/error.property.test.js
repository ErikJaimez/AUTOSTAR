import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { AppError, errorHandler, TIPOS_ERROR } from './errorHandler.js';
import { findOversizedFields, MAX_LENGTH } from './inputLength.js';

/**
 * Property 21: Formato de respuesta de error del backend
 * *Para cualquier* error procesado por el manejador centralizado, la respuesta SHALL contener
 * los campos `tipo` (string no vacío), `mensaje` (string en español no vacío), y cuando el
 * tipo es "VALIDACION" SHALL incluir `campos` (array con al menos un objeto con `campo` y `mensaje`).
 *
 * **Validates: Requirements 12.3, 12.4**
 */
describe('Property 21: Formato de respuesta de error del backend', () => {
    function createMockRes() {
        const res = {};
        res.statusCode = null;
        res.body = null;
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => { res.body = data; return res; };
        return res;
    }

    function createMockReq() {
        return { method: 'GET', url: '/test' };
    }

    const tiposValidos = Object.keys(TIPOS_ERROR);

    it('para cualquier AppError con tipo conocido, la respuesta contiene tipo (string no vacío) y mensaje (string no vacío)', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...tiposValidos),
                fc.string({ minLength: 1, maxLength: 200 }),
                (tipo, mensaje) => {
                    const statusCode = TIPOS_ERROR[tipo].statusCode;
                    const err = new AppError(tipo, mensaje, statusCode);
                    const req = createMockReq();
                    const res = createMockRes();

                    errorHandler(err, req, res, () => {});

                    // tipo debe ser string no vacío
                    expect(typeof res.body.tipo).toBe('string');
                    expect(res.body.tipo.length).toBeGreaterThan(0);

                    // mensaje debe ser string no vacío
                    expect(typeof res.body.mensaje).toBe('string');
                    expect(res.body.mensaje.length).toBeGreaterThan(0);

                    // El statusCode de la respuesta debe coincidir
                    expect(res.statusCode).toBe(statusCode);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('cuando el tipo es VALIDACION, la respuesta incluye campos (array con al menos un objeto con campo y mensaje)', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 200 }),
                fc.array(
                    fc.record({
                        campo: fc.string({ minLength: 1, maxLength: 50 }),
                        mensaje: fc.string({ minLength: 1, maxLength: 200 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (mensajeError, campos) => {
                    const err = new AppError('VALIDACION', mensajeError, 400, campos);
                    const req = createMockReq();
                    const res = createMockRes();

                    errorHandler(err, req, res, () => {});

                    // tipo debe ser VALIDACION
                    expect(res.body.tipo).toBe('VALIDACION');

                    // mensaje debe ser string no vacío
                    expect(typeof res.body.mensaje).toBe('string');
                    expect(res.body.mensaje.length).toBeGreaterThan(0);

                    // campos debe ser un array con al menos un elemento
                    expect(Array.isArray(res.body.campos)).toBe(true);
                    expect(res.body.campos.length).toBeGreaterThanOrEqual(1);

                    // cada elemento de campos debe tener campo y mensaje
                    for (const c of res.body.campos) {
                        expect(typeof c.campo).toBe('string');
                        expect(c.campo.length).toBeGreaterThan(0);
                        expect(typeof c.mensaje).toBe('string');
                        expect(c.mensaje.length).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('para errores no-VALIDACION con tipo conocido, la respuesta NO incluye campos', () => {
        const tiposNoValidacion = tiposValidos.filter(t => t !== 'VALIDACION');

        fc.assert(
            fc.property(
                fc.constantFrom(...tiposNoValidacion),
                fc.string({ minLength: 1, maxLength: 200 }),
                (tipo, mensaje) => {
                    const statusCode = TIPOS_ERROR[tipo].statusCode;
                    const err = new AppError(tipo, mensaje, statusCode);
                    const req = createMockReq();
                    const res = createMockRes();

                    errorHandler(err, req, res, () => {});

                    // No debe incluir campos
                    expect(res.body.campos).toBeUndefined();

                    // tipo y mensaje siguen presentes
                    expect(res.body.tipo).toBe(tipo);
                    expect(res.body.mensaje).toBe(mensaje);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('para errores desconocidos sin tipo, la respuesta tiene tipo ERROR_INTERNO y mensaje no vacío', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 200 }),
                (mensaje) => {
                    const err = new Error(mensaje);
                    const req = createMockReq();
                    const res = createMockRes();

                    errorHandler(err, req, res, () => {});

                    // Siempre debe retornar tipo y mensaje
                    expect(res.body.tipo).toBe('ERROR_INTERNO');
                    expect(typeof res.body.mensaje).toBe('string');
                    expect(res.body.mensaje.length).toBeGreaterThan(0);
                    expect(res.statusCode).toBe(500);
                }
            ),
            { numRuns: 50 }
        );
    });
});

/**
 * Property 22: Rechazo de entrada excesivamente larga
 * *Para cualquier* solicitud al backend que contenga un campo de texto con más de 10,000 caracteres,
 * el backend SHALL rechazarla con código HTTP 400 e indicar el campo inválido.
 *
 * **Validates: Requirements 12.8**
 */
describe('Property 22: Rechazo de entrada excesivamente larga', () => {
    it('para cualquier campo string con más de 10,000 caracteres, findOversizedFields lo detecta', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z_]\w*$/.test(s)),
                fc.integer({ min: MAX_LENGTH + 1, max: MAX_LENGTH + 5000 }),
                (fieldName, length) => {
                    const obj = { [fieldName]: 'x'.repeat(length) };
                    const result = findOversizedFields(obj);

                    // Debe detectar el campo
                    expect(result.length).toBeGreaterThanOrEqual(1);
                    expect(result).toContain(fieldName);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('para cualquier campo string con 10,000 caracteres o menos, findOversizedFields no lo reporta', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z_]\w*$/.test(s)),
                fc.integer({ min: 0, max: MAX_LENGTH }),
                (fieldName, length) => {
                    const obj = { [fieldName]: 'x'.repeat(length) };
                    const result = findOversizedFields(obj);

                    // No debe reportar el campo
                    expect(result).not.toContain(fieldName);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('para cualquier objeto con campos anidados excesivamente largos, findOversizedFields los detecta con path completo', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_]\w*$/.test(s)),
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_]\w*$/.test(s)),
                fc.integer({ min: MAX_LENGTH + 1, max: MAX_LENGTH + 1000 }),
                (parentKey, childKey, length) => {
                    const obj = { [parentKey]: { [childKey]: 'x'.repeat(length) } };
                    const result = findOversizedFields(obj);

                    // Debe detectar con path anidado
                    expect(result.length).toBeGreaterThanOrEqual(1);
                    expect(result).toContain(`${parentKey}.${childKey}`);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('para cualquier objeto con mezcla de campos válidos e inválidos, solo reporta los inválidos', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 5 }),
                fc.integer({ min: 1, max: 5 }),
                (numValid, numInvalid) => {
                    const obj = {};

                    // Campos válidos
                    for (let i = 0; i < numValid; i++) {
                        obj[`valido_${i}`] = 'a'.repeat(100);
                    }

                    // Campos inválidos
                    for (let i = 0; i < numInvalid; i++) {
                        obj[`invalido_${i}`] = 'x'.repeat(MAX_LENGTH + 1);
                    }

                    const result = findOversizedFields(obj);

                    // Debe reportar exactamente los campos inválidos
                    expect(result.length).toBe(numInvalid);

                    for (let i = 0; i < numInvalid; i++) {
                        expect(result).toContain(`invalido_${i}`);
                    }

                    for (let i = 0; i < numValid; i++) {
                        expect(result).not.toContain(`valido_${i}`);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
