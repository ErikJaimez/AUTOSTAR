import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

/**
 * Property tests para estados reactivos y lógica de reintento
 * Validates: Requirements 14.3, 14.4
 */

// --- Funciones puras que modelan la máquina de estados ---

/**
 * Simula las transiciones de estado de una operación asíncrona en un composable.
 * Dado un resultado de operación (éxito o fallo), retorna la secuencia de estados.
 *
 * Estado inicial: { cargando: false, exito: false, error: null }
 * Durante petición: { cargando: true, exito: false, error: null }
 * Éxito: { cargando: false, exito: true, error: null }
 * Fallo: { cargando: false, exito: false, error: mensaje }
 */
function transicionarEstadoOperacion(operacionExitosa, mensajeError = 'Error de conexión') {
    const estadoInicial = { cargando: false, exito: false, error: null };
    const estadoCargando = { cargando: true, exito: false, error: null };

    let estadoFinal;
    if (operacionExitosa) {
        estadoFinal = { cargando: false, exito: true, error: null };
    } else {
        estadoFinal = { cargando: false, exito: false, error: mensajeError };
    }

    return {
        estadoInicial,
        estadoCargando,
        estadoFinal
    };
}

/**
 * Calcula cuántos reintentos se deben realizar dado un historial de resultados.
 * Cada resultado es true (éxito) o false (fallo por red/timeout).
 * Máximo 3 reintentos. Si encuentra un éxito, se detiene.
 *
 * @param {boolean[]} resultados - Array de resultados de cada intento
 * @returns {{ intentosRealizados: number, exitoFinal: boolean, errorPersistente: boolean }}
 */
function calcularReintentos(resultados) {
    const MAX_REINTENTOS = 3;

    // El primer intento siempre se realiza
    let intentosRealizados = 0;
    let exitoFinal = false;
    let errorPersistente = false;

    for (let i = 0; i < resultados.length && intentosRealizados <= MAX_REINTENTOS; i++) {
        intentosRealizados++;

        if (resultados[i]) {
            exitoFinal = true;
            break;
        }

        // Si ya usamos todos los reintentos (1 intento original + 3 reintentos = 4 total)
        if (intentosRealizados > MAX_REINTENTOS) {
            break;
        }
    }

    // Si no hubo éxito después de todos los intentos permitidos
    if (!exitoFinal && intentosRealizados > MAX_REINTENTOS) {
        errorPersistente = true;
    }

    return { intentosRealizados, exitoFinal, errorPersistente };
}

/**
 * Simula la lógica de reintento con backoff exponencial.
 * Retorna los tiempos de espera calculados para cada reintento.
 *
 * @param {number} reintentos - Número de reintentos realizados (1-3)
 * @param {number} backoffInicialMs - Tiempo base en ms
 * @returns {number[]} - Array con los tiempos de espera por reintento
 */
function calcularTiemposBackoff(reintentos, backoffInicialMs = 1000) {
    const tiempos = [];
    for (let i = 1; i <= reintentos; i++) {
        tiempos.push(backoffInicialMs * Math.pow(2, i - 1));
    }
    return tiempos;
}

// --- Property Tests ---

describe('Property 23: Estados reactivos de operación asíncrona', () => {
    /**
     * **Validates: Requirements 14.3**
     *
     * Para cualquier operación de datos en un composable, el estado SHALL transicionar de:
     * cargando=false → cargando=true (durante petición) → cargando=false con éxito=true (si OK)
     * o error con mensaje (si falla).
     * Los estados cargando y éxito nunca SHALL ser ambos verdaderos simultáneamente.
     */

    it('el estado transiciona correctamente: inicial → cargando → final', () => {
        fc.assert(
            fc.property(fc.boolean(), (operacionExitosa) => {
                const { estadoInicial, estadoCargando, estadoFinal } = transicionarEstadoOperacion(operacionExitosa);

                // Estado inicial: cargando=false, exito=false
                expect(estadoInicial.cargando).toBe(false);
                expect(estadoInicial.exito).toBe(false);
                expect(estadoInicial.error).toBeNull();

                // Estado durante petición: cargando=true, exito=false
                expect(estadoCargando.cargando).toBe(true);
                expect(estadoCargando.exito).toBe(false);
                expect(estadoCargando.error).toBeNull();

                // Estado final: cargando=false siempre
                expect(estadoFinal.cargando).toBe(false);
            })
        );
    });

    it('cargando y éxito nunca son ambos verdaderos simultáneamente', () => {
        fc.assert(
            fc.property(fc.boolean(), fc.string({ minLength: 1 }), (operacionExitosa, mensajeError) => {
                const { estadoInicial, estadoCargando, estadoFinal } = transicionarEstadoOperacion(operacionExitosa, mensajeError);

                // Invariante: cargando y éxito nunca son ambos true
                const estados = [estadoInicial, estadoCargando, estadoFinal];
                for (const estado of estados) {
                    expect(estado.cargando && estado.exito).toBe(false);
                }
            })
        );
    });

    it('operación exitosa produce éxito=true y error=null', () => {
        fc.assert(
            fc.property(fc.constant(true), () => {
                const { estadoFinal } = transicionarEstadoOperacion(true);
                expect(estadoFinal.exito).toBe(true);
                expect(estadoFinal.error).toBeNull();
            })
        );
    });

    it('operación fallida produce éxito=false y error con mensaje no vacío', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1 }), (mensajeError) => {
                const { estadoFinal } = transicionarEstadoOperacion(false, mensajeError);
                expect(estadoFinal.exito).toBe(false);
                expect(estadoFinal.error).toBe(mensajeError);
                expect(estadoFinal.error.length).toBeGreaterThan(0);
            })
        );
    });

    it('éxito y error son mutuamente excluyentes en el estado final', () => {
        fc.assert(
            fc.property(fc.boolean(), fc.string({ minLength: 1 }), (operacionExitosa, mensajeError) => {
                const { estadoFinal } = transicionarEstadoOperacion(operacionExitosa, mensajeError);

                // Si hay éxito, no hay error
                if (estadoFinal.exito) {
                    expect(estadoFinal.error).toBeNull();
                }

                // Si hay error, no hay éxito
                if (estadoFinal.error !== null) {
                    expect(estadoFinal.exito).toBe(false);
                }
            })
        );
    });
});

describe('Property 24: Lógica de reintento con máximo 3 intentos', () => {
    /**
     * **Validates: Requirements 14.4**
     *
     * Para cualquier llamada HTTP que falla por error de red o timeout, el sistema SHALL
     * reintentar hasta un máximo de 3 veces. Después de 3 reintentos fallidos, SHALL mostrar
     * un error persistente y no realizar más reintentos automáticos.
     */

    it('nunca realiza más de 4 intentos totales (1 original + 3 reintentos)', () => {
        fc.assert(
            fc.property(
                fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
                (resultados) => {
                    const { intentosRealizados } = calcularReintentos(resultados);
                    // Máximo 4 intentos: 1 original + 3 reintentos
                    expect(intentosRealizados).toBeLessThanOrEqual(4);
                }
            )
        );
    });

    it('si todos los intentos fallan, marca error persistente después de 4 intentos', () => {
        fc.assert(
            fc.property(
                fc.array(fc.constant(false), { minLength: 4, maxLength: 10 }),
                (resultadosFallidos) => {
                    const { intentosRealizados, exitoFinal, errorPersistente } = calcularReintentos(resultadosFallidos);
                    expect(intentosRealizados).toBe(4);
                    expect(exitoFinal).toBe(false);
                    expect(errorPersistente).toBe(true);
                }
            )
        );
    });

    it('si algún intento tiene éxito, se detiene sin error persistente', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 3 }),
                (fallosAntesDeExito) => {
                    // Construir una secuencia con N fallos seguida de un éxito
                    const resultados = Array(fallosAntesDeExito).fill(false).concat([true]);
                    const { exitoFinal, errorPersistente } = calcularReintentos(resultados);
                    expect(exitoFinal).toBe(true);
                    expect(errorPersistente).toBe(false);
                }
            )
        );
    });

    it('no realiza reintentos adicionales después de éxito', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 3 }),
                fc.array(fc.boolean(), { minLength: 0, maxLength: 5 }),
                (fallosAntes, resultadosPostExito) => {
                    // Construir: N fallos + 1 éxito + resultados extra (que no deben procesarse)
                    const resultados = Array(fallosAntes).fill(false).concat([true], resultadosPostExito);
                    const { intentosRealizados, exitoFinal } = calcularReintentos(resultados);

                    expect(exitoFinal).toBe(true);
                    // Los intentos realizados son exactamente: fallos + 1 éxito
                    expect(intentosRealizados).toBe(fallosAntes + 1);
                }
            )
        );
    });

    it('el backoff exponencial duplica el tiempo entre reintentos', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 3 }),
                fc.integer({ min: 100, max: 5000 }),
                (numReintentos, backoffInicial) => {
                    const tiempos = calcularTiemposBackoff(numReintentos, backoffInicial);

                    expect(tiempos.length).toBe(numReintentos);

                    // El primer reintento espera el backoff inicial
                    expect(tiempos[0]).toBe(backoffInicial);

                    // Cada reintento subsecuente duplica el tiempo anterior
                    for (let i = 1; i < tiempos.length; i++) {
                        expect(tiempos[i]).toBe(tiempos[i - 1] * 2);
                    }
                }
            )
        );
    });

    it('con exactamente 3 fallos seguidos, aún no marca error persistente (necesita el 4to intento)', () => {
        fc.assert(
            fc.property(fc.constant([false, false, false]), (resultados) => {
                const { intentosRealizados, exitoFinal, errorPersistente } = calcularReintentos(resultados);
                // Con solo 3 resultados (todos false), ha hecho 3 intentos pero no alcanza el máximo (4)
                expect(intentosRealizados).toBe(3);
                expect(exitoFinal).toBe(false);
                // No se marca como persistente porque no se completaron los 4 intentos
                expect(errorPersistente).toBe(false);
            })
        );
    });
});
