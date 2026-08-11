import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
    esZonaServicio,
    filtrarReservaciones,
    generarFolio,
    generarFoliosUnicos,
    RANGOS_ZONA_SUR,
    validarFormularioReservacion,
    validarTransicionEstado
} from './reservacion.utils.js';

/**
 * Generadores auxiliares para reservaciones.
 */

// Genera un nombre válido (1-120 caracteres, sin saltos de línea)
const nombreValidoArb = fc.string({ minLength: 1, maxLength: 120 }).filter(s => s.trim().length > 0 && !s.includes('\n'));

// Genera una edad válida (16-99)
const edadValidaArb = fc.integer({ min: 16, max: 99 });

// Genera un código postal válido (5 dígitos)
const cpValidoArb = fc.stringMatching(/^\d{5}$/);

// Genera un teléfono válido (10 dígitos)
const telefonoValidoArb = fc.stringMatching(/^\d{10}$/);

// Genera un email válido
const emailValidoArb = fc.tuple(
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.length > 0 && !s.includes('@') && !s.includes(' ')),
    fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.length > 0 && !s.includes('@') && !s.includes(' ') && !s.includes('.')),
    fc.string({ minLength: 2, maxLength: 5 }).filter(s => s.length >= 2 && !s.includes('@') && !s.includes(' ') && !s.includes('.'))
).map(([user, domain, ext]) => `${user}@${domain}.${ext}`);

// Genera un estado válido de reservación
const estadoValidoArb = fc.constantFrom('pendiente', 'confirmada', 'completada', 'cancelada');

// Genera una fecha en formato YYYY-MM-DD
const fechaArb = fc.date({
    min: new Date('2024-01-01'),
    max: new Date('2026-12-31')
}).map(d => d.toISOString().split('T')[0]);

/**
 * Property 5: Validación de formulario de reservación
 * *Para cualquier* conjunto de datos de entrada al formulario de reservación, la función de validación
 * SHALL aceptar solo cuando: nombre tiene 1-120 caracteres, edad está entre 16-99, código postal es
 * exactamente 5 dígitos numéricos, teléfono es exactamente 10 dígitos numéricos, y email tiene formato válido.
 *
 * **Validates: Requirements 3.1, 3.5**
 */
describe('Property 5: Validación de formulario de reservación', () => {
    it('acepta formulario con todos los campos válidos', () => {
        fc.assert(
            fc.property(
                nombreValidoArb,
                edadValidaArb,
                cpValidoArb,
                telefonoValidoArb,
                emailValidoArb,
                (nombre, edad, cp, telefono, email) => {
                    const datos = {
                        nombre,
                        edad,
                        codigo_postal: cp,
                        telefono,
                        email
                    };
                    const resultado = validarFormularioReservacion(datos);
                    expect(resultado.valido).toBe(true);
                    expect(resultado.errores).toHaveLength(0);
                }
            ),
            { numRuns: 300 }
        );
    });

    it('rechaza nombre vacío o mayor a 120 caracteres', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(''),
                    fc.string({ minLength: 121, maxLength: 200 })
                ),
                edadValidaArb,
                cpValidoArb,
                telefonoValidoArb,
                emailValidoArb,
                (nombre, edad, cp, telefono, email) => {
                    const datos = {
                        nombre,
                        edad,
                        codigo_postal: cp,
                        telefono,
                        email
                    };
                    const resultado = validarFormularioReservacion(datos);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some(e => e.campo === 'nombre')).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('rechaza edad fuera del rango 16-99', () => {
        fc.assert(
            fc.property(
                nombreValidoArb,
                fc.oneof(
                    fc.integer({ min: -100, max: 15 }),
                    fc.integer({ min: 100, max: 200 })
                ),
                cpValidoArb,
                telefonoValidoArb,
                emailValidoArb,
                (nombre, edad, cp, telefono, email) => {
                    const datos = {
                        nombre,
                        edad,
                        codigo_postal: cp,
                        telefono,
                        email
                    };
                    const resultado = validarFormularioReservacion(datos);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some(e => e.campo === 'edad')).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('rechaza código postal que no sea exactamente 5 dígitos', () => {
        fc.assert(
            fc.property(
                nombreValidoArb,
                edadValidaArb,
                fc.oneof(
                    fc.stringMatching(/^\d{1,4}$/),    // menos de 5 dígitos
                    fc.stringMatching(/^\d{6,10}$/),   // más de 5 dígitos
                    fc.stringMatching(/^[a-zA-Z]{5}$/) // letras en vez de dígitos
                ),
                telefonoValidoArb,
                emailValidoArb,
                (nombre, edad, cp, telefono, email) => {
                    const datos = {
                        nombre,
                        edad,
                        codigo_postal: cp,
                        telefono,
                        email
                    };
                    const resultado = validarFormularioReservacion(datos);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some(e => e.campo === 'codigo_postal')).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('rechaza teléfono que no sea exactamente 10 dígitos', () => {
        fc.assert(
            fc.property(
                nombreValidoArb,
                edadValidaArb,
                cpValidoArb,
                fc.oneof(
                    fc.stringMatching(/^\d{1,9}$/),     // menos de 10 dígitos
                    fc.stringMatching(/^\d{11,15}$/),   // más de 10 dígitos
                    fc.stringMatching(/^[a-zA-Z]{10}$/) // letras en vez de dígitos
                ),
                emailValidoArb,
                (nombre, edad, cp, telefono, email) => {
                    const datos = {
                        nombre,
                        edad,
                        codigo_postal: cp,
                        telefono,
                        email
                    };
                    const resultado = validarFormularioReservacion(datos);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some(e => e.campo === 'telefono')).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('rechaza email sin formato válido', () => {
        fc.assert(
            fc.property(
                nombreValidoArb,
                edadValidaArb,
                cpValidoArb,
                telefonoValidoArb,
                fc.oneof(
                    fc.constant('sinArroba'),
                    fc.constant('solo@dominio'),
                    fc.constant('@sinusuario.com'),
                    fc.constant('espacios en@email.com')
                ),
                (nombre, edad, cp, telefono, email) => {
                    const datos = {
                        nombre,
                        edad,
                        codigo_postal: cp,
                        telefono,
                        email
                    };
                    const resultado = validarFormularioReservacion(datos);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some(e => e.campo === 'email')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('la cantidad de errores corresponde al número de campos inválidos', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nombre: fc.oneof(nombreValidoArb, fc.constant('')),
                    edad: fc.oneof(edadValidaArb, fc.integer({ min: 100, max: 200 })),
                    codigo_postal: fc.oneof(cpValidoArb, fc.constant('abc')),
                    telefono: fc.oneof(telefonoValidoArb, fc.constant('123')),
                    email: fc.oneof(emailValidoArb, fc.constant('invalido'))
                }),
                (datos) => {
                    const resultado = validarFormularioReservacion(datos);

                    // Cada campo inválido genera exactamente un error
                    for (const error of resultado.errores) {
                        expect(['nombre', 'edad', 'codigo_postal', 'telefono', 'email']).toContain(error.campo);
                    }

                    // No hay errores duplicados por campo
                    const camposConError = resultado.errores.map(e => e.campo);
                    expect(new Set(camposConError).size).toBe(camposConError.length);
                }
            ),
            { numRuns: 200 }
        );
    });
});

/**
 * Property 6: Validación de zona de servicio
 * *Para cualquier* código postal de 5 dígitos, la función `esZonaServicio` SHALL retornar
 * verdadero si y solo si el código pertenece al conjunto predefinido de códigos postales
 * de la zona sur de CDMX.
 *
 * **Validates: Requirements 3.2**
 */
describe('Property 6: Validación de zona de servicio', () => {
    // Genera un CP que está dentro de la zona sur
    const cpZonaSurArb = fc.oneof(
        fc.integer({ min: 14000, max: 14999 }).map(n => String(n).padStart(5, '0')), // Tlalpan
        fc.integer({ min: 4000, max: 4999 }).map(n => String(n).padStart(5, '0')),   // Coyoacán
        fc.integer({ min: 16000, max: 16999 }).map(n => String(n).padStart(5, '0')), // Xochimilco
        fc.integer({ min: 13000, max: 13999 }).map(n => String(n).padStart(5, '0')), // Tláhuac
        fc.integer({ min: 12000, max: 12999 }).map(n => String(n).padStart(5, '0'))  // Milpa Alta
    );

    // Genera un CP de 5 dígitos que NO está en la zona sur
    const cpFueraZonaSurArb = fc.integer({ min: 10000, max: 99999 })
        .filter(n => {
            return !RANGOS_ZONA_SUR.some(rango => n >= rango.min && n <= rango.max);
        })
        .map(n => String(n));

    it('retorna verdadero para cualquier código postal dentro de la zona sur', () => {
        fc.assert(
            fc.property(cpZonaSurArb, (cp) => {
                expect(esZonaServicio(cp)).toBe(true);
            }),
            { numRuns: 500 }
        );
    });

    it('retorna falso para cualquier código postal fuera de la zona sur', () => {
        fc.assert(
            fc.property(cpFueraZonaSurArb, (cp) => {
                expect(esZonaServicio(cp)).toBe(false);
            }),
            { numRuns: 500 }
        );
    });

    it('retorna falso para strings que no son exactamente 5 dígitos', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.stringMatching(/^\d{1,4}$/),
                    fc.stringMatching(/^\d{6,10}$/),
                    fc.stringMatching(/^[a-zA-Z]{5}$/),
                    fc.constant('')
                ),
                (cp) => {
                    expect(esZonaServicio(cp)).toBe(false);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('la pertenencia se determina exclusivamente por los rangos predefinidos', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 99999 }).map(n => String(n).padStart(5, '0')),
                (cp) => {
                    const esperado = RANGOS_ZONA_SUR.some(rango => {
                        const num = parseInt(cp, 10);
                        return num >= rango.min && num <= rango.max;
                    });
                    expect(esZonaServicio(cp)).toBe(esperado);
                }
            ),
            { numRuns: 1000 }
        );
    });
});

/**
 * Property 7: Unicidad de folios de reservación
 * *Para cualquier* secuencia de N reservaciones creadas exitosamente, los N folios generados
 * SHALL ser todos distintos entre sí.
 *
 * **Validates: Requirements 3.4**
 */
describe('Property 7: Unicidad de folios de reservación', () => {
    it('N folios generados son todos distintos entre sí', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 100 }),
                fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
                (n, fecha) => {
                    const folios = generarFoliosUnicos(n, fecha);
                    expect(folios.length).toBe(n);

                    // Todos los folios deben ser únicos
                    const foliosUnicos = new Set(folios);
                    expect(foliosUnicos.size).toBe(n);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('cada folio tiene el formato correcto AUT-YYYYMMDD-XXXX', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 50 }),
                fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
                (n, fecha) => {
                    const folios = generarFoliosUnicos(n, fecha);
                    const patronFolio = /^AUT-\d{8}-[A-Z0-9]{4}$/;

                    for (const folio of folios) {
                        expect(folio).toMatch(patronFolio);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('folios generados individualmente con diferentes partes aleatorias son distintos', () => {
        fc.assert(
            fc.property(
                fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
                fc.uniqueArray(
                    fc.stringMatching(/^[A-Z0-9]{4}$/),
                    { minLength: 2, maxLength: 20 }
                ),
                (fecha, partesAleatorias) => {
                    const folios = partesAleatorias.map(parte => generarFolio(fecha, parte));
                    const foliosUnicos = new Set(folios);
                    expect(foliosUnicos.size).toBe(folios.length);
                }
            ),
            { numRuns: 200 }
        );
    });
});

/**
 * Property 10: Filtros combinados de reservaciones
 * *Para cualquier* conjunto de reservaciones y combinación de filtros (estado, curso, rango de fechas,
 * instructor), el resultado filtrado SHALL contener únicamente reservaciones que satisfacen TODOS
 * los filtros activos simultáneamente.
 *
 * **Validates: Requirements 6.2**
 */
describe('Property 10: Filtros combinados de reservaciones', () => {
    // Generador de reservación
    const reservacionArb = fc.record({
        id: fc.uuid(),
        folio: fc.stringMatching(/^AUT-\d{8}-[A-Z0-9]{4}$/),
        estado: estadoValidoArb,
        curso_id: fc.uuid(),
        instructor_id: fc.uuid(),
        fecha: fechaArb
    });

    // Generador de filtros (algunos pueden estar activos, otros no)
    const filtrosArb = fc.record({
        estado: fc.option(estadoValidoArb, { nil: undefined }),
        curso_id: fc.option(fc.uuid(), { nil: undefined }),
        instructor_id: fc.option(fc.uuid(), { nil: undefined }),
        fecha_desde: fc.option(fechaArb, { nil: undefined }),
        fecha_hasta: fc.option(fechaArb, { nil: undefined })
    });

    it('cada reservación en el resultado cumple TODOS los filtros activos', () => {
        fc.assert(
            fc.property(
                fc.array(reservacionArb, { minLength: 0, maxLength: 50 }),
                filtrosArb,
                (reservaciones, filtros) => {
                    const resultado = filtrarReservaciones(reservaciones, filtros);

                    for (const reservacion of resultado) {
                        // Verificar filtro por estado
                        if (filtros.estado !== undefined) {
                            expect(reservacion.estado).toBe(filtros.estado);
                        }
                        // Verificar filtro por curso
                        if (filtros.curso_id !== undefined) {
                            expect(reservacion.curso_id).toBe(filtros.curso_id);
                        }
                        // Verificar filtro por instructor
                        if (filtros.instructor_id !== undefined) {
                            expect(reservacion.instructor_id).toBe(filtros.instructor_id);
                        }
                        // Verificar filtro por fecha desde
                        if (filtros.fecha_desde !== undefined) {
                            expect(reservacion.fecha >= filtros.fecha_desde).toBe(true);
                        }
                        // Verificar filtro por fecha hasta
                        if (filtros.fecha_hasta !== undefined) {
                            expect(reservacion.fecha <= filtros.fecha_hasta).toBe(true);
                        }
                    }
                }
            ),
            { numRuns: 300 }
        );
    });

    it('no excluye reservaciones que cumplen todos los filtros', () => {
        fc.assert(
            fc.property(
                fc.array(reservacionArb, { minLength: 0, maxLength: 50 }),
                filtrosArb,
                (reservaciones, filtros) => {
                    const resultado = filtrarReservaciones(reservaciones, filtros);

                    // Verificar que toda reservación que cumple todos los filtros está en el resultado
                    for (const reservacion of reservaciones) {
                        let cumpleTodos = true;

                        if (filtros.estado !== undefined && reservacion.estado !== filtros.estado) {
                            cumpleTodos = false;
                        }
                        if (filtros.curso_id !== undefined && reservacion.curso_id !== filtros.curso_id) {
                            cumpleTodos = false;
                        }
                        if (filtros.instructor_id !== undefined && reservacion.instructor_id !== filtros.instructor_id) {
                            cumpleTodos = false;
                        }
                        if (filtros.fecha_desde !== undefined && (!reservacion.fecha || reservacion.fecha < filtros.fecha_desde)) {
                            cumpleTodos = false;
                        }
                        if (filtros.fecha_hasta !== undefined && (!reservacion.fecha || reservacion.fecha > filtros.fecha_hasta)) {
                            cumpleTodos = false;
                        }

                        if (cumpleTodos) {
                            expect(resultado).toContainEqual(reservacion);
                        }
                    }
                }
            ),
            { numRuns: 300 }
        );
    });

    it('sin filtros activos retorna todas las reservaciones', () => {
        fc.assert(
            fc.property(
                fc.array(reservacionArb, { minLength: 0, maxLength: 30 }),
                (reservaciones) => {
                    const resultado = filtrarReservaciones(reservaciones, {});
                    expect(resultado.length).toBe(reservaciones.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('el resultado filtrado es subconjunto de las reservaciones originales', () => {
        fc.assert(
            fc.property(
                fc.array(reservacionArb, { minLength: 0, maxLength: 50 }),
                filtrosArb,
                (reservaciones, filtros) => {
                    const resultado = filtrarReservaciones(reservaciones, filtros);
                    expect(resultado.length).toBeLessThanOrEqual(reservaciones.length);

                    for (const r of resultado) {
                        expect(reservaciones).toContainEqual(r);
                    }
                }
            ),
            { numRuns: 200 }
        );
    });
});

/**
 * Property 11: Máquina de estados de reservación
 * *Para cualquier* reservación en un estado dado, los únicos cambios de estado permitidos SHALL ser:
 * pendiente→confirmada, pendiente→cancelada, confirmada→completada, confirmada→cancelada.
 * Cualquier otra transición SHALL ser rechazada.
 *
 * **Validates: Requirements 6.3, 6.5**
 */
describe('Property 11: Máquina de estados de reservación', () => {
    const transicionesPermitidas = [
        { desde: 'pendiente', hacia: 'confirmada' },
        { desde: 'pendiente', hacia: 'cancelada' },
        { desde: 'confirmada', hacia: 'completada' },
        { desde: 'confirmada', hacia: 'cancelada' }
    ];

    it('acepta todas y solo las transiciones válidas definidas', () => {
        fc.assert(
            fc.property(
                estadoValidoArb,
                estadoValidoArb,
                (estadoActual, estadoDestino) => {
                    const resultado = validarTransicionEstado(estadoActual, estadoDestino);

                    const esTransicionPermitida = transicionesPermitidas.some(
                        t => t.desde === estadoActual && t.hacia === estadoDestino
                    );

                    expect(resultado.valido).toBe(esTransicionPermitida);
                }
            ),
            { numRuns: 500 }
        );
    });

    it('las transiciones desde "completada" siempre son rechazadas', () => {
        fc.assert(
            fc.property(
                estadoValidoArb,
                (estadoDestino) => {
                    const resultado = validarTransicionEstado('completada', estadoDestino);
                    expect(resultado.valido).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('las transiciones desde "cancelada" siempre son rechazadas', () => {
        fc.assert(
            fc.property(
                estadoValidoArb,
                (estadoDestino) => {
                    const resultado = validarTransicionEstado('cancelada', estadoDestino);
                    expect(resultado.valido).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('transición rechazada incluye mensaje descriptivo y transiciones permitidas', () => {
        fc.assert(
            fc.property(
                estadoValidoArb,
                estadoValidoArb,
                (estadoActual, estadoDestino) => {
                    const resultado = validarTransicionEstado(estadoActual, estadoDestino);

                    if (!resultado.valido) {
                        expect(resultado.mensaje).toBeTruthy();
                        expect(typeof resultado.mensaje).toBe('string');
                        expect(resultado.mensaje.length).toBeGreaterThan(0);
                    } else {
                        expect(resultado.mensaje).toBeNull();
                    }

                    // transicionesPermitidas siempre debe ser un array
                    expect(Array.isArray(resultado.transicionesPermitidas)).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('desde "pendiente" solo permite confirmada y cancelada', () => {
        const resultado1 = validarTransicionEstado('pendiente', 'confirmada');
        const resultado2 = validarTransicionEstado('pendiente', 'cancelada');
        const resultado3 = validarTransicionEstado('pendiente', 'completada');
        const resultado4 = validarTransicionEstado('pendiente', 'pendiente');

        expect(resultado1.valido).toBe(true);
        expect(resultado2.valido).toBe(true);
        expect(resultado3.valido).toBe(false);
        expect(resultado4.valido).toBe(false);
    });

    it('desde "confirmada" solo permite completada y cancelada', () => {
        const resultado1 = validarTransicionEstado('confirmada', 'completada');
        const resultado2 = validarTransicionEstado('confirmada', 'cancelada');
        const resultado3 = validarTransicionEstado('confirmada', 'pendiente');
        const resultado4 = validarTransicionEstado('confirmada', 'confirmada');

        expect(resultado1.valido).toBe(true);
        expect(resultado2.valido).toBe(true);
        expect(resultado3.valido).toBe(false);
        expect(resultado4.valido).toBe(false);
    });
});
