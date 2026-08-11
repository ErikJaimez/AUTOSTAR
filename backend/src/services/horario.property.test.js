import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
    esSlotDisponible,
    filtrarSlotsPróximas4Semanas,
    validarSlotHorario
} from './horario.utils.js';

/**
 * Generadores auxiliares para slots de horario.
 */

// Genera una fecha en formato YYYY-MM-DD dentro de un rango amplio
const fechaArbitrary = fc.date({
    min: new Date('2024-01-01'),
    max: new Date('2026-12-31')
}).map((d) => d.toISOString().split('T')[0]);

// Genera una hora en formato HH:MM (00:00 a 23:59)
const horaArbitrary = fc.tuple(
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

// Genera un par de horas donde hora_inicio < hora_fin
const parHorasValidasArbitrary = fc.tuple(
    fc.integer({ min: 0, max: 22 }),
    fc.integer({ min: 0, max: 59 }),
    fc.integer({ min: 1, max: 23 }),
    fc.integer({ min: 0, max: 59 })
).filter(([h1, m1, h2, m2]) => {
    const inicio = h1 * 60 + m1;
    const fin = h2 * 60 + m2;
    return inicio < fin;
}).map(([h1, m1, h2, m2]) => ({
    hora_inicio: `${String(h1).padStart(2, '0')}:${String(m1).padStart(2, '0')}`,
    hora_fin: `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`
}));

// Genera un slot con fecha y horas
const slotArbitrary = fc.record({
    fecha: fechaArbitrary,
    hora_inicio: horaArbitrary,
    hora_fin: horaArbitrary
});

/**
 * Property 3: Filtrado y ordenamiento cronológico de slots
 * *Para cualquier* lista de slots con fechas variadas, la función de filtrado SHALL retornar
 * únicamente slots dentro de las próximas 4 semanas desde hoy, y estos resultados estarán
 * ordenados cronológicamente (fecha + hora_inicio ascendente).
 *
 * **Validates: Requirements 2.1**
 */
describe('Property 3: Filtrado y ordenamiento cronológico de slots', () => {
    // Generador de slots con fechas distribuidas ampliamente
    const slotConFechaAmpliaArb = fc.record({
        id: fc.uuid(),
        fecha: fc.date({
            min: new Date('2024-01-01'),
            max: new Date('2026-12-31')
        }).map((d) => d.toISOString().split('T')[0]),
        hora_inicio: horaArbitrary,
        hora_fin: horaArbitrary
    });

    it('retorna únicamente slots dentro de las próximas 4 semanas', () => {
        fc.assert(
            fc.property(
                fc.array(slotConFechaAmpliaArb, { minLength: 0, maxLength: 50 }),
                fc.date({ min: new Date('2024-06-01'), max: new Date('2025-12-31') }),
                (slots, fechaRef) => {
                    const resultado = filtrarSlotsPróximas4Semanas(slots, fechaRef);

                    const hoy = new Date(fechaRef);
                    hoy.setHours(0, 0, 0, 0);
                    const limite = new Date(hoy);
                    limite.setDate(limite.getDate() + 28);

                    for (const slot of resultado) {
                        const fechaSlot = new Date(slot.fecha + 'T00:00:00');
                        expect(fechaSlot.getTime()).toBeGreaterThanOrEqual(hoy.getTime());
                        expect(fechaSlot.getTime()).toBeLessThan(limite.getTime());
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    it('los resultados están ordenados cronológicamente (fecha + hora_inicio ascendente)', () => {
        fc.assert(
            fc.property(
                fc.array(slotConFechaAmpliaArb, { minLength: 0, maxLength: 50 }),
                fc.date({ min: new Date('2024-06-01'), max: new Date('2025-12-31') }),
                (slots, fechaRef) => {
                    const resultado = filtrarSlotsPróximas4Semanas(slots, fechaRef);

                    for (let i = 0; i < resultado.length - 1; i++) {
                        const actual = resultado[i];
                        const siguiente = resultado[i + 1];

                        const comparacionFecha = actual.fecha.localeCompare(siguiente.fecha);
                        if (comparacionFecha === 0) {
                            // Misma fecha: hora_inicio debe ser ascendente
                            expect(actual.hora_inicio.localeCompare(siguiente.hora_inicio)).toBeLessThanOrEqual(0);
                        } else {
                            // Fecha debe ser ascendente
                            expect(comparacionFecha).toBeLessThan(0);
                        }
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    it('no incluye slots con fechas anteriores a la fecha de referencia', () => {
        fc.assert(
            fc.property(
                fc.array(slotConFechaAmpliaArb, { minLength: 1, maxLength: 30 }),
                fc.date({ min: new Date('2025-06-01'), max: new Date('2025-12-31') }),
                (slots, fechaRef) => {
                    const resultado = filtrarSlotsPróximas4Semanas(slots, fechaRef);

                    const hoy = new Date(fechaRef);
                    hoy.setHours(0, 0, 0, 0);

                    for (const slot of resultado) {
                        const fechaSlot = new Date(slot.fecha + 'T00:00:00');
                        expect(fechaSlot.getTime()).toBeGreaterThanOrEqual(hoy.getTime());
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    it('no incluye slots con fechas a más de 28 días de la referencia', () => {
        fc.assert(
            fc.property(
                fc.array(slotConFechaAmpliaArb, { minLength: 1, maxLength: 30 }),
                fc.date({ min: new Date('2024-06-01'), max: new Date('2025-06-01') }),
                (slots, fechaRef) => {
                    const resultado = filtrarSlotsPróximas4Semanas(slots, fechaRef);

                    const hoy = new Date(fechaRef);
                    hoy.setHours(0, 0, 0, 0);
                    const limite = new Date(hoy);
                    limite.setDate(limite.getDate() + 28);

                    for (const slot of resultado) {
                        const fechaSlot = new Date(slot.fecha + 'T00:00:00');
                        expect(fechaSlot.getTime()).toBeLessThan(limite.getTime());
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    it('la cantidad de resultados es menor o igual a la lista original', () => {
        fc.assert(
            fc.property(
                fc.array(slotConFechaAmpliaArb, { minLength: 0, maxLength: 50 }),
                fc.date({ min: new Date('2024-06-01'), max: new Date('2025-12-31') }),
                (slots, fechaRef) => {
                    const resultado = filtrarSlotsPróximas4Semanas(slots, fechaRef);
                    expect(resultado.length).toBeLessThanOrEqual(slots.length);
                }
            ),
            { numRuns: 200 }
        );
    });
});

/**
 * Property 4: Disponibilidad de slot según capacidad
 * *Para cualquier* slot con una capacidad máxima y un conteo de reservaciones,
 * el slot SHALL mostrarse como disponible si y solo si el conteo de reservaciones
 * es estrictamente menor que la capacidad máxima.
 *
 * **Validates: Requirements 2.3**
 */
describe('Property 4: Disponibilidad de slot según capacidad', () => {
    it('slot está disponible si y solo si reservaciones < capacidad máxima', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 100 }),
                fc.integer({ min: 1, max: 30 }),
                (reservaciones, capacidad) => {
                    const disponible = esSlotDisponible(reservaciones, capacidad);
                    expect(disponible).toBe(reservaciones < capacidad);
                }
            ),
            { numRuns: 500 }
        );
    });

    it('slot con reservaciones igual a capacidad NO está disponible', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 30 }),
                (capacidad) => {
                    const disponible = esSlotDisponible(capacidad, capacidad);
                    expect(disponible).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('slot con 0 reservaciones y capacidad positiva SIEMPRE está disponible', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 30 }),
                (capacidad) => {
                    const disponible = esSlotDisponible(0, capacidad);
                    expect(disponible).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('slot con reservaciones mayor a capacidad NO está disponible', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 30 }),
                fc.integer({ min: 1, max: 50 }),
                (capacidad, extra) => {
                    const reservaciones = capacidad + extra;
                    const disponible = esSlotDisponible(reservaciones, capacidad);
                    expect(disponible).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Property 9: Validación de slot de horario con detección de traslape
 * *Para cualquier* slot de horario propuesto, la validación SHALL rechazar cuando:
 * hora_fin ≤ hora_inicio, el instructor no está activo, la capacidad no está entre 1-30,
 * o existe un traslape temporal con otro slot del mismo instructor en la misma fecha
 * (dos intervalos [a,b) y [c,d) se traslapan si a < d AND c < b).
 *
 * **Validates: Requirements 5.2, 5.3, 5.4**
 */
describe('Property 9: Validación de slot de horario con detección de traslape', () => {
    // Generador de slot válido completo
    const slotValidoArb = fc.record({
        hora_inicio: fc.constant('08:00'),
        hora_fin: fc.constant('09:00'),
        instructor_activo: fc.constant(true),
        capacidad_maxima: fc.integer({ min: 1, max: 30 })
    });

    it('acepta slot válido sin slots existentes', () => {
        fc.assert(
            fc.property(
                parHorasValidasArbitrary,
                fc.integer({ min: 1, max: 30 }),
                (horas, capacidad) => {
                    const slot = {
                        hora_inicio: horas.hora_inicio,
                        hora_fin: horas.hora_fin,
                        instructor_activo: true,
                        capacidad_maxima: capacidad
                    };
                    const resultado = validarSlotHorario(slot, []);
                    expect(resultado.valido).toBe(true);
                    expect(resultado.errores).toHaveLength(0);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('rechaza cuando hora_fin <= hora_inicio', () => {
        fc.assert(
            fc.property(
                horaArbitrary,
                fc.boolean(),
                (hora, igual) => {
                    // Crear hora_fin <= hora_inicio
                    const horaInicio = hora;
                    let horaFin;
                    if (igual) {
                        horaFin = horaInicio; // hora_fin === hora_inicio
                    } else {
                        // hora_fin < hora_inicio: restar al menos un minuto
                        const [h, m] = horaInicio.split(':').map(Number);
                        const totalMin = h * 60 + m;
                        if (totalMin === 0) return; // No se puede generar hora menor
                        const menorMin = totalMin - 1;
                        horaFin = `${String(Math.floor(menorMin / 60)).padStart(2, '0')}:${String(menorMin % 60).padStart(2, '0')}`;
                    }

                    const slot = {
                        hora_inicio: horaInicio,
                        hora_fin: horaFin,
                        instructor_activo: true,
                        capacidad_maxima: 10
                    };
                    const resultado = validarSlotHorario(slot, []);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some((e) => e.campo === 'hora_fin')).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('rechaza cuando el instructor no está activo', () => {
        fc.assert(
            fc.property(
                parHorasValidasArbitrary,
                fc.integer({ min: 1, max: 30 }),
                (horas, capacidad) => {
                    const slot = {
                        hora_inicio: horas.hora_inicio,
                        hora_fin: horas.hora_fin,
                        instructor_activo: false,
                        capacidad_maxima: capacidad
                    };
                    const resultado = validarSlotHorario(slot, []);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some((e) => e.campo === 'instructor_id')).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('rechaza cuando la capacidad no está entre 1 y 30', () => {
        fc.assert(
            fc.property(
                parHorasValidasArbitrary,
                fc.oneof(
                    fc.integer({ min: -10, max: 0 }),
                    fc.integer({ min: 31, max: 100 })
                ),
                (horas, capacidad) => {
                    const slot = {
                        hora_inicio: horas.hora_inicio,
                        hora_fin: horas.hora_fin,
                        instructor_activo: true,
                        capacidad_maxima: capacidad
                    };
                    const resultado = validarSlotHorario(slot, []);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some((e) => e.campo === 'capacidad_maxima')).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('rechaza cuando existe traslape con slot existente del mismo instructor', () => {
        fc.assert(
            fc.property(
                // Generamos dos intervalos que se traslapan
                fc.integer({ min: 0, max: 20 }), // hora inicio del primero
                fc.integer({ min: 1, max: 3 }),   // duración del primero en horas
                fc.integer({ min: 0, max: 2 }),   // offset del segundo (dentro del primero)
                fc.integer({ min: 1, max: 3 }),   // duración del segundo en horas
                (h1, dur1, offset, dur2) => {
                    const inicio1 = h1;
                    const fin1 = Math.min(h1 + dur1, 23);
                    if (fin1 <= inicio1) return; // Saltar si no es válido

                    // El segundo slot empieza dentro del rango del primero
                    const inicio2 = inicio1 + offset;
                    const fin2 = Math.min(inicio2 + dur2, 23);
                    if (fin2 <= inicio2) return; // Saltar si no es válido

                    // Verificar que realmente se traslapan: inicio1 < fin2 AND inicio2 < fin1
                    const horaIni1 = `${String(inicio1).padStart(2, '0')}:00`;
                    const horaFin1 = `${String(fin1).padStart(2, '0')}:00`;
                    const horaIni2 = `${String(inicio2).padStart(2, '0')}:00`;
                    const horaFin2 = `${String(fin2).padStart(2, '0')}:00`;

                    // Solo testeamos si realmente se traslapan
                    if (!(horaIni1 < horaFin2 && horaIni2 < horaFin1)) return;

                    const slotExistente = {
                        hora_inicio: horaIni1,
                        hora_fin: horaFin1
                    };

                    const slotPropuesto = {
                        hora_inicio: horaIni2,
                        hora_fin: horaFin2,
                        instructor_activo: true,
                        capacidad_maxima: 10
                    };

                    const resultado = validarSlotHorario(slotPropuesto, [slotExistente]);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some((e) => e.campo === 'hora_inicio')).toBe(true);
                }
            ),
            { numRuns: 300 }
        );
    });

    it('acepta cuando los intervalos NO se traslapan (slot termina antes o empieza después)', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 30 }),
                fc.boolean(),
                (capacidad, antes) => {
                    let slotPropuesto;
                    let slotExistente;

                    if (antes) {
                        // Slot propuesto termina antes de que el existente comience
                        slotPropuesto = {
                            hora_inicio: '08:00',
                            hora_fin: '09:00',
                            instructor_activo: true,
                            capacidad_maxima: capacidad
                        };
                        slotExistente = {
                            hora_inicio: '09:00',
                            hora_fin: '10:00'
                        };
                    } else {
                        // Slot propuesto empieza después de que el existente termina
                        slotPropuesto = {
                            hora_inicio: '11:00',
                            hora_fin: '12:00',
                            instructor_activo: true,
                            capacidad_maxima: capacidad
                        };
                        slotExistente = {
                            hora_inicio: '09:00',
                            hora_fin: '11:00'
                        };
                    }

                    const resultado = validarSlotHorario(slotPropuesto, [slotExistente]);
                    expect(resultado.valido).toBe(true);
                    expect(resultado.errores).toHaveLength(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('propiedad completa: datos aleatorios validan correctamente según todas las reglas', () => {
        fc.assert(
            fc.property(
                horaArbitrary,
                horaArbitrary,
                fc.boolean(),
                fc.integer({ min: -10, max: 50 }),
                (horaInicio, horaFin, instructorActivo, capacidad) => {
                    const slot = {
                        hora_inicio: horaInicio,
                        hora_fin: horaFin,
                        instructor_activo: instructorActivo,
                        capacidad_maxima: capacidad
                    };

                    const resultado = validarSlotHorario(slot, []);

                    const horaFinValida = horaFin > horaInicio;
                    const instructorValido = instructorActivo === true;
                    const capacidadValida = Number.isInteger(capacidad) && capacidad >= 1 && capacidad <= 30;

                    const deberiaSerValido = horaFinValida && instructorValido && capacidadValida;

                    expect(resultado.valido).toBe(deberiaSerValido);
                }
            ),
            { numRuns: 500 }
        );
    });
});
