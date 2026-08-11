import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
    actualizarAvanceAlCompletar,
    calcularAvance,
    calcularHorasCompletadas,
    calcularPorcentaje,
    esCancelable,
    esCursoFinalizado,
    validarMotivoCancelacion
} from './clase.utils.js';

// --- Generadores compartidos ---

/**
 * Genera un par hora_inicio/hora_fin como strings "HH:MM" donde fin > inicio.
 */
const parHorasStrArb = fc.tuple(
    fc.integer({ min: 0, max: 20 }),
    fc.integer({ min: 0, max: 59 }),
    fc.integer({ min: 1, max: 4 })
).map(([horaBase, minutos, duracionHoras]) => {
    const horaInicio = `${String(horaBase).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    const finHora = horaBase + duracionHoras;
    const horaFin = `${String(finHora).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    return { hora_inicio: horaInicio, hora_fin: horaFin };
});

/**
 * Genera una clase completada con horas válidas (formato string "HH:MM").
 */
const claseCompletadaArb = parHorasStrArb.map(({ hora_inicio, hora_fin }) => ({
    hora_inicio,
    hora_fin,
    estado: 'completada'
}));

/**
 * Genera una clase programada con horas válidas.
 */
const claseProgramadaArb = parHorasStrArb.map(({ hora_inicio, hora_fin }) => ({
    hora_inicio,
    hora_fin,
    estado: 'programada'
}));

/**
 * Genera una clase cancelada con horas válidas.
 */
const claseCanceladaArb = parHorasStrArb.map(({ hora_inicio, hora_fin }) => ({
    hora_inicio,
    hora_fin,
    estado: 'cancelada'
}));

/**
 * Genera horas totales contratadas (1-200 como el schema del curso).
 */
const horasTotalesArb = fc.integer({ min: 1, max: 200 });

// =============================================================================
// Property 14: Invariante de cálculo de avance de horas
// =============================================================================

/**
 * Property 14: Invariante de cálculo de avance de horas
 * *Para cualquier* conjunto de horas totales contratadas y lista de clases completadas,
 * el avance satisface: horas_completadas = suma de duraciones, horas_pendientes = total - completadas,
 * porcentaje = entero redondeado de (completadas/total × 100) en rango [0, 100].
 *
 * **Validates: Requirements 8.1, 8.3**
 */
describe('Property 14: Invariante de cálculo de avance de horas', () => {
    it('horas_completadas es igual a la suma de duraciones de clases completadas', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.array(claseCompletadaArb, { minLength: 0, maxLength: 20 }),
                (horasTotales, clasesCompletadas) => {
                    const avance = calcularAvance(horasTotales, clasesCompletadas);
                    const sumaDirecta = calcularHorasCompletadas(clasesCompletadas);

                    expect(avance.horas_completadas).toBeCloseTo(
                        parseFloat(sumaDirecta.toFixed(1)), 1
                    );
                }
            ),
            { numRuns: 200 }
        );
    });

    it('horas_pendientes = horas_totales - horas_completadas (mínimo 0)', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.array(claseCompletadaArb, { minLength: 0, maxLength: 20 }),
                (horasTotales, clasesCompletadas) => {
                    const avance = calcularAvance(horasTotales, clasesCompletadas);
                    const pendientesEsperadas = Math.max(0, horasTotales - avance.horas_completadas);

                    expect(avance.horas_pendientes).toBeCloseTo(
                        parseFloat(pendientesEsperadas.toFixed(1)), 1
                    );
                }
            ),
            { numRuns: 200 }
        );
    });

    it('porcentaje es un entero redondeado en rango [0, 100]', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.array(claseCompletadaArb, { minLength: 0, maxLength: 20 }),
                (horasTotales, clasesCompletadas) => {
                    const avance = calcularAvance(horasTotales, clasesCompletadas);

                    expect(Number.isInteger(avance.porcentaje)).toBe(true);
                    expect(avance.porcentaje).toBeGreaterThanOrEqual(0);
                    expect(avance.porcentaje).toBeLessThanOrEqual(100);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('porcentaje = Math.round(completadas/total × 100) limitado a 100', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.array(claseCompletadaArb, { minLength: 0, maxLength: 20 }),
                (horasTotales, clasesCompletadas) => {
                    const horasComp = calcularHorasCompletadas(clasesCompletadas);
                    const porcentajeEsperado = calcularPorcentaje(horasComp, horasTotales);
                    const avance = calcularAvance(horasTotales, clasesCompletadas);

                    expect(avance.porcentaje).toBe(porcentajeEsperado);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('solo clases con estado "completada" contribuyen al avance', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.array(claseCompletadaArb, { minLength: 0, maxLength: 10 }),
                fc.array(claseProgramadaArb, { minLength: 0, maxLength: 10 }),
                fc.array(claseCanceladaArb, { minLength: 0, maxLength: 10 }),
                (horasTotales, completadas, programadas, canceladas) => {
                    const todasLasClases = [...completadas, ...programadas, ...canceladas];
                    const avanceTotal = calcularAvance(horasTotales, todasLasClases);
                    const avanceSoloCompletadas = calcularAvance(horasTotales, completadas);

                    expect(avanceTotal.horas_completadas).toBeCloseTo(
                        avanceSoloCompletadas.horas_completadas, 1
                    );
                }
            ),
            { numRuns: 200 }
        );
    });
});

// =============================================================================
// Property 15: Actualización de avance al completar clase
// =============================================================================

/**
 * Property 15: Actualización de avance al completar clase
 * *Para cualquier* clase completada con duración D, el avance incrementa
 * horas_completadas en D y decrementa pendientes en D.
 *
 * **Validates: Requirements 8.2**
 */
describe('Property 15: Actualización de avance al completar clase', () => {
    it('horas_completadas incrementa exactamente en la duración de la clase completada', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.float({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true })
                    .map(h => Math.round(h * 10) / 10),
                fc.float({ min: 0.5, max: 4, noNaN: true, noDefaultInfinity: true })
                    .map(d => Math.round(d * 10) / 10),
                (horasTotales, horasCompletadasAntes, duracionClase) => {
                    const avanceNuevo = actualizarAvanceAlCompletar(
                        horasTotales, horasCompletadasAntes, duracionClase
                    );

                    expect(avanceNuevo.horas_completadas).toBeCloseTo(
                        horasCompletadasAntes + duracionClase, 5
                    );
                }
            ),
            { numRuns: 200 }
        );
    });

    it('horas_pendientes decrementa exactamente en la duración (mínimo 0)', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.float({ min: 0, max: 50, noNaN: true, noDefaultInfinity: true })
                    .map(h => Math.round(h * 10) / 10),
                fc.float({ min: 0.5, max: 4, noNaN: true, noDefaultInfinity: true })
                    .map(d => Math.round(d * 10) / 10),
                (horasTotales, horasCompletadasAntes, duracionClase) => {
                    const avanceNuevo = actualizarAvanceAlCompletar(
                        horasTotales, horasCompletadasAntes, duracionClase
                    );

                    const pendientesEsperadas = Math.max(
                        0, horasTotales - (horasCompletadasAntes + duracionClase)
                    );
                    expect(avanceNuevo.horas_pendientes).toBeCloseTo(pendientesEsperadas, 5);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('el porcentaje nunca supera 100 al completar una clase', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.float({ min: 0, max: 200, noNaN: true, noDefaultInfinity: true })
                    .map(h => Math.round(h * 10) / 10),
                fc.float({ min: 0.5, max: 10, noNaN: true, noDefaultInfinity: true })
                    .map(d => Math.round(d * 10) / 10),
                (horasTotales, horasCompletadasAntes, duracionClase) => {
                    const avanceNuevo = actualizarAvanceAlCompletar(
                        horasTotales, horasCompletadasAntes, duracionClase
                    );

                    expect(avanceNuevo.porcentaje).toBeLessThanOrEqual(100);
                    expect(avanceNuevo.porcentaje).toBeGreaterThanOrEqual(0);
                }
            ),
            { numRuns: 200 }
        );
    });
});

// =============================================================================
// Property 16: Finalización automática al 100%
// =============================================================================

/**
 * Property 16: Finalización automática al 100%
 * *Para cualquier* cliente cuyas horas completadas alcanzan las totales, marcar curso
 * finalizado. Si completadas < total, NO marcar finalizado.
 *
 * **Validates: Requirements 8.4**
 */
describe('Property 16: Finalización automática al 100%', () => {
    it('cuando horas completadas >= horas totales, debe finalizar', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.float({ min: 0, max: 200, noNaN: true, noDefaultInfinity: true })
                    .map(h => Math.round(h * 10) / 10),
                (horasTotales, extra) => {
                    const horasCompletadas = horasTotales + extra;
                    expect(esCursoFinalizado(horasCompletadas, horasTotales)).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('cuando horas completadas < horas totales, NO debe finalizar', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 200 }),
                fc.integer({ min: 0, max: 99 }),
                (horasTotales, porcentaje) => {
                    // Generar horas completadas estrictamente menores al total
                    const horasCompletadas = (horasTotales * porcentaje) / 100;
                    if (horasCompletadas < horasTotales) {
                        expect(esCursoFinalizado(horasCompletadas, horasTotales)).toBe(false);
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    it('el umbral exacto (completadas === totales) siempre finaliza', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                (horasTotales) => {
                    expect(esCursoFinalizado(horasTotales, horasTotales)).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('0 horas completadas nunca finaliza (para total > 0)', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                (horasTotales) => {
                    expect(esCursoFinalizado(0, horasTotales)).toBe(false);
                }
            ),
            { numRuns: 200 }
        );
    });
});

// =============================================================================
// Property 17: Validación de motivo de cancelación
// =============================================================================

/**
 * Property 17: Validación de motivo de cancelación
 * *Para cualquier* string de motivo, aceptar si y solo si longitud entre 10 y 500 caracteres.
 *
 * **Validates: Requirements 9.1**
 */
describe('Property 17: Validación de motivo de cancelación', () => {
    it('motivo con longitud entre 10 y 500 siempre es aceptado', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 10, maxLength: 500 }),
                (motivo) => {
                    const resultado = validarMotivoCancelacion(motivo);
                    expect(resultado.valido).toBe(true);
                    expect(resultado.error).toBeNull();
                }
            ),
            { numRuns: 200 }
        );
    });

    it('motivo con longitud < 10 siempre es rechazado', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 9 }),
                (motivo) => {
                    const resultado = validarMotivoCancelacion(motivo);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.error).not.toBeNull();
                }
            ),
            { numRuns: 200 }
        );
    });

    it('motivo con longitud > 500 siempre es rechazado', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 501, maxLength: 1000 }),
                (motivo) => {
                    const resultado = validarMotivoCancelacion(motivo);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.error).not.toBeNull();
                }
            ),
            { numRuns: 200 }
        );
    });

    it('motivo null, undefined o no-string siempre es rechazado', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(null, undefined, 123, true, {}, []),
                (motivo) => {
                    const resultado = validarMotivoCancelacion(motivo);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.error).not.toBeNull();
                }
            ),
            { numRuns: 20 }
        );
    });

    it('el límite exacto 10 caracteres es aceptado', () => {
        fc.assert(
            fc.property(
                fc.stringOf(
                    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
                    { minLength: 10, maxLength: 10 }
                ),
                (motivo) => {
                    expect(motivo.length).toBe(10);
                    const resultado = validarMotivoCancelacion(motivo);
                    expect(resultado.valido).toBe(true);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('el límite exacto 500 caracteres es aceptado', () => {
        fc.assert(
            fc.property(
                fc.stringOf(
                    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
                    { minLength: 500, maxLength: 500 }
                ),
                (motivo) => {
                    expect(motivo.length).toBe(500);
                    const resultado = validarMotivoCancelacion(motivo);
                    expect(resultado.valido).toBe(true);
                }
            ),
            { numRuns: 50 }
        );
    });
});

// =============================================================================
// Property 18: Cancelación no altera horas completadas
// =============================================================================

/**
 * Property 18: Cancelación no altera horas completadas
 * *Para cualquier* clase cancelada, horas_completadas NO cambian.
 *
 * **Validates: Requirements 9.3**
 */
describe('Property 18: Cancelación no altera horas completadas', () => {
    it('cancelar una clase no cambia las horas completadas', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.array(claseCompletadaArb, { minLength: 0, maxLength: 10 }),
                claseProgramadaArb,
                (horasTotales, clasesCompletadas, claseProgramada) => {
                    // Calcular avance antes de cancelar (con la clase programada)
                    const clasesAntes = [...clasesCompletadas, claseProgramada];
                    const avanceAntes = calcularAvance(horasTotales, clasesAntes);

                    // Simular cancelación: cambiar estado de la clase programada a cancelada
                    const claseCancelada = { ...claseProgramada, estado: 'cancelada' };
                    const clasesDespues = [...clasesCompletadas, claseCancelada];
                    const avanceDespues = calcularAvance(horasTotales, clasesDespues);

                    // Las horas completadas no deben cambiar
                    expect(avanceDespues.horas_completadas).toBeCloseTo(
                        avanceAntes.horas_completadas, 1
                    );
                }
            ),
            { numRuns: 200 }
        );
    });

    it('cancelar múltiples clases programadas no altera horas completadas', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.array(claseCompletadaArb, { minLength: 1, maxLength: 10 }),
                fc.array(claseProgramadaArb, { minLength: 1, maxLength: 5 }),
                (horasTotales, clasesCompletadas, clasesProgramadas) => {
                    // Avance con clases programadas
                    const clasesAntes = [...clasesCompletadas, ...clasesProgramadas];
                    const avanceAntes = calcularAvance(horasTotales, clasesAntes);

                    // Cancelar todas las programadas
                    const clasesCanceladas = clasesProgramadas.map(c => ({ ...c, estado: 'cancelada' }));
                    const clasesDespues = [...clasesCompletadas, ...clasesCanceladas];
                    const avanceDespues = calcularAvance(horasTotales, clasesDespues);

                    expect(avanceDespues.horas_completadas).toBeCloseTo(
                        avanceAntes.horas_completadas, 1
                    );
                }
            ),
            { numRuns: 200 }
        );
    });

    it('el porcentaje de avance no cambia al cancelar una clase programada', () => {
        fc.assert(
            fc.property(
                horasTotalesArb,
                fc.array(claseCompletadaArb, { minLength: 0, maxLength: 10 }),
                claseProgramadaArb,
                (horasTotales, clasesCompletadas, claseProgramada) => {
                    const clasesAntes = [...clasesCompletadas, claseProgramada];
                    const avanceAntes = calcularAvance(horasTotales, clasesAntes);

                    const claseCancelada = { ...claseProgramada, estado: 'cancelada' };
                    const clasesDespues = [...clasesCompletadas, claseCancelada];
                    const avanceDespues = calcularAvance(horasTotales, clasesDespues);

                    expect(avanceDespues.porcentaje).toBe(avanceAntes.porcentaje);
                }
            ),
            { numRuns: 200 }
        );
    });
});

// =============================================================================
// Property 19: Solo clases programadas son cancelables
// =============================================================================

/**
 * Property 19: Solo clases programadas son cancelables
 * *Para cualquier* clase en cualquier estado, cancelación permitida si y solo si
 * estado es "programada".
 *
 * **Validates: Requirements 9.6**
 */
describe('Property 19: Solo clases programadas son cancelables', () => {
    it('clases en estado "programada" siempre son cancelables', () => {
        fc.assert(
            fc.property(
                fc.constant('programada'),
                (estado) => {
                    const resultado = esCancelable(estado);
                    expect(resultado.permitido).toBe(true);
                    expect(resultado.error).toBeNull();
                }
            ),
            { numRuns: 50 }
        );
    });

    it('clases en estado "completada" nunca son cancelables', () => {
        fc.assert(
            fc.property(
                fc.constant('completada'),
                (estado) => {
                    const resultado = esCancelable(estado);
                    expect(resultado.permitido).toBe(false);
                    expect(resultado.error).not.toBeNull();
                }
            ),
            { numRuns: 50 }
        );
    });

    it('clases en estado "cancelada" nunca son cancelables', () => {
        fc.assert(
            fc.property(
                fc.constant('cancelada'),
                (estado) => {
                    const resultado = esCancelable(estado);
                    expect(resultado.permitido).toBe(false);
                    expect(resultado.error).not.toBeNull();
                }
            ),
            { numRuns: 50 }
        );
    });

    it('cualquier estado diferente a "programada" no es cancelable', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s !== 'programada'),
                (estado) => {
                    const resultado = esCancelable(estado);
                    expect(resultado.permitido).toBe(false);
                    expect(resultado.error).not.toBeNull();
                }
            ),
            { numRuns: 200 }
        );
    });

    it('la cancelación es una decisión binaria: permitido XOR error', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('programada', 'completada', 'cancelada', 'en_progreso', 'otra'),
                (estado) => {
                    const resultado = esCancelable(estado);

                    // Exactamente uno debe ser verdadero
                    if (resultado.permitido) {
                        expect(resultado.error).toBeNull();
                    } else {
                        expect(resultado.error).not.toBeNull();
                    }
                }
            ),
            { numRuns: 50 }
        );
    });
});
