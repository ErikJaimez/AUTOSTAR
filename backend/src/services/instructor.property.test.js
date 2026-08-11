import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
    ordenarInstructoresAlfabeticamente,
    validarDatosInstructor
} from './instructor.utils.js';

/**
 * Property 12: Ordenamiento alfabético de instructores
 * *Para cualquier* lista de instructores, la función de ordenamiento SHALL producir
 * una lista donde cada nombre es lexicográficamente menor o igual al siguiente.
 *
 * **Validates: Requirements 7.1**
 */
describe('Property 12: Ordenamiento alfabético de instructores', () => {
    const instructorArb = fc.record({
        nombre_completo: fc.string({ minLength: 1, maxLength: 120 }),
        telefono: fc.string({ minLength: 10, maxLength: 10 }),
        email: fc.string({ minLength: 5, maxLength: 150 }),
        activo: fc.boolean()
    });

    it('la lista resultante tiene cada nombre lexicográficamente menor o igual al siguiente', () => {
        fc.assert(
            fc.property(
                fc.array(instructorArb, { minLength: 0, maxLength: 50 }),
                (instructores) => {
                    const resultado = ordenarInstructoresAlfabeticamente(instructores);

                    // Verificar que el resultado está ordenado
                    for (let i = 0; i < resultado.length - 1; i++) {
                        const comparacion = resultado[i].nombre_completo.localeCompare(
                            resultado[i + 1].nombre_completo, 'es', { sensitivity: 'base' }
                        );
                        expect(comparacion).toBeLessThanOrEqual(0);
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    it('la lista resultante conserva todos los elementos originales (mismo tamaño)', () => {
        fc.assert(
            fc.property(
                fc.array(instructorArb, { minLength: 0, maxLength: 50 }),
                (instructores) => {
                    const resultado = ordenarInstructoresAlfabeticamente(instructores);
                    expect(resultado.length).toBe(instructores.length);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('la función no muta la lista original', () => {
        fc.assert(
            fc.property(
                fc.array(instructorArb, { minLength: 1, maxLength: 50 }),
                (instructores) => {
                    const copia = [...instructores];
                    ordenarInstructoresAlfabeticamente(instructores);

                    // La lista original no debe haber cambiado
                    expect(instructores).toEqual(copia);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('una lista vacía retorna una lista vacía', () => {
        const resultado = ordenarInstructoresAlfabeticamente([]);
        expect(resultado).toEqual([]);
    });

    it('una lista de un solo instructor retorna esa misma lista', () => {
        fc.assert(
            fc.property(
                instructorArb,
                (instructor) => {
                    const resultado = ordenarInstructoresAlfabeticamente([instructor]);
                    expect(resultado.length).toBe(1);
                    expect(resultado[0].nombre_completo).toBe(instructor.nombre_completo);
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Property 13: Validación de datos de instructor
 * *Para cualquier* conjunto de datos de entrada para crear/editar un instructor,
 * la validación SHALL aceptar solo cuando: nombre completo tiene 1-120 caracteres,
 * teléfono es exactamente 10 dígitos numéricos, email tiene formato válido con
 * máximo 150 caracteres, y todos los campos obligatorios están presentes.
 *
 * **Validates: Requirements 7.2, 7.6**
 */
describe('Property 13: Validación de datos de instructor', () => {
    // Generador de datos válidos de instructor
    const nombreValidoArb = fc.string({ minLength: 1, maxLength: 120 })
        .filter(s => s.trim().length >= 1 && s.trim().length <= 120);

    const telefonoValidoArb = fc.stringOf(
        fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
        { minLength: 10, maxLength: 10 }
    );

    const emailValidoArb = fc.tuple(
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 30 }),
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 20 }),
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 2, maxLength: 5 })
    ).map(([user, domain, tld]) => `${user}@${domain}.${tld}`)
        .filter(email => email.length <= 150);

    const datosValidosArb = fc.record({
        nombre_completo: nombreValidoArb,
        telefono: telefonoValidoArb,
        email: emailValidoArb
    });

    it('datos válidos siempre son aceptados', () => {
        fc.assert(
            fc.property(
                datosValidosArb,
                (datos) => {
                    const resultado = validarDatosInstructor(datos);
                    expect(resultado.valido).toBe(true);
                    expect(resultado.errores).toHaveLength(0);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('nombre vacío o ausente siempre es rechazado', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(undefined, null, '', '   '),
                telefonoValidoArb,
                emailValidoArb,
                (nombre, telefono, email) => {
                    const resultado = validarDatosInstructor({
                        nombre_completo: nombre,
                        telefono,
                        email
                    });
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some(e => e.campo === 'nombre_completo')).toBe(true);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('nombre mayor a 120 caracteres siempre es rechazado', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 121, maxLength: 300 }).filter(s => s.trim().length > 120),
                telefonoValidoArb,
                emailValidoArb,
                (nombre, telefono, email) => {
                    const resultado = validarDatosInstructor({
                        nombre_completo: nombre,
                        telefono,
                        email
                    });
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some(e => e.campo === 'nombre_completo')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('teléfono que no son exactamente 10 dígitos siempre es rechazado', () => {
        // Teléfonos inválidos: longitud incorrecta o caracteres no numéricos
        const telefonoInvalidoArb = fc.oneof(
            // Muy corto (menos de 10 dígitos)
            fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 1, maxLength: 9 }),
            // Muy largo (más de 10 dígitos)
            fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 11, maxLength: 20 }),
            // Con letras
            fc.stringOf(fc.constantFrom(...'0123456789abcdef'.split('')), { minLength: 10, maxLength: 10 })
                .filter(s => /[a-f]/.test(s))
        );

        fc.assert(
            fc.property(
                nombreValidoArb,
                telefonoInvalidoArb,
                emailValidoArb,
                (nombre, telefono, email) => {
                    const resultado = validarDatosInstructor({
                        nombre_completo: nombre,
                        telefono,
                        email
                    });
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some(e => e.campo === 'telefono')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('email sin formato válido siempre es rechazado', () => {
        const emailInvalidoArb = fc.oneof(
            // Sin @
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 30 }),
            // Sin dominio después de @
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 20 })
                .map(s => `${s}@`),
            // Sin punto en dominio
            fc.tuple(
                fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 10 }),
                fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 10 })
            ).map(([u, d]) => `${u}@${d}`)
        );

        fc.assert(
            fc.property(
                nombreValidoArb,
                telefonoValidoArb,
                emailInvalidoArb,
                (nombre, telefono, email) => {
                    const resultado = validarDatosInstructor({
                        nombre_completo: nombre,
                        telefono,
                        email
                    });
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some(e => e.campo === 'email')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('email mayor a 150 caracteres siempre es rechazado', () => {
        fc.assert(
            fc.property(
                nombreValidoArb,
                telefonoValidoArb,
                fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 140, maxLength: 140 })
                    .map(s => `${s}@dominio.com`),
                (nombre, telefono, email) => {
                    // email generado tendrá más de 150 caracteres
                    expect(email.length).toBeGreaterThan(150);
                    const resultado = validarDatosInstructor({
                        nombre_completo: nombre,
                        telefono,
                        email
                    });
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some(e => e.campo === 'email')).toBe(true);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('cuando faltan todos los campos obligatorios, se reportan errores para cada campo', () => {
        const resultado = validarDatosInstructor({});
        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.campo === 'nombre_completo')).toBe(true);
        expect(resultado.errores.some(e => e.campo === 'telefono')).toBe(true);
        expect(resultado.errores.some(e => e.campo === 'email')).toBe(true);
    });
});
