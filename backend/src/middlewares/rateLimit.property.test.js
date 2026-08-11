import * as fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    limpiarStore,
    MAX_INTENTOS,
    registrarExito,
    registrarIntentoFallido,
    verificarBloqueo
} from './rateLimit.js';

/**
 * Property 20: Bloqueo por intentos fallidos de login
 * *Para cualquier* secuencia de intentos de login, el bloqueo temporal SHALL activarse
 * si y solo si se acumulan exactamente 5 intentos fallidos consecutivos.
 * Un inicio de sesión exitoso SHALL reiniciar el contador a 0.
 *
 * **Validates: Requirements 10.6**
 */
describe('Property 20: Bloqueo por intentos fallidos de login', () => {
    beforeEach(() => {
        limpiarStore();
    });

    it('después de exactamente 5 intentos fallidos consecutivos, el usuario es bloqueado', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                (username) => {
                    limpiarStore();

                    // Realizar exactamente MAX_INTENTOS (5) intentos fallidos
                    for (let i = 0; i < MAX_INTENTOS - 1; i++) {
                        const resultado = registrarIntentoFallido(username);
                        expect(resultado.bloqueado).toBe(false);
                    }

                    // El 5to intento debe activar el bloqueo
                    const resultadoFinal = registrarIntentoFallido(username);
                    expect(resultadoFinal.bloqueado).toBe(true);
                    expect(resultadoFinal.intentosRestantes).toBe(0);

                    // Verificar que el bloqueo persiste
                    const estado = verificarBloqueo(username);
                    expect(estado.bloqueado).toBe(true);
                    expect(estado.tiempoRestante).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('menos de 5 intentos fallidos no bloquean al usuario', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.integer({ min: 1, max: MAX_INTENTOS - 1 }),
                (username, numIntentos) => {
                    limpiarStore();

                    // Realizar menos de MAX_INTENTOS intentos fallidos
                    let ultimoResultado;
                    for (let i = 0; i < numIntentos; i++) {
                        ultimoResultado = registrarIntentoFallido(username);
                    }

                    // No debe estar bloqueado
                    expect(ultimoResultado.bloqueado).toBe(false);
                    expect(ultimoResultado.intentosRestantes).toBe(MAX_INTENTOS - numIntentos);

                    // Verificar que el usuario no está bloqueado
                    const estado = verificarBloqueo(username);
                    expect(estado.bloqueado).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('un login exitoso reinicia el contador (incluso después de 4 intentos fallidos)', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.integer({ min: 1, max: MAX_INTENTOS - 1 }),
                (username, intentosAntes) => {
                    limpiarStore();

                    // Acumular intentos fallidos (menos de 5)
                    for (let i = 0; i < intentosAntes; i++) {
                        registrarIntentoFallido(username);
                    }

                    // Login exitoso reinicia el contador
                    registrarExito(username);

                    // Verificar que no está bloqueado
                    const estado = verificarBloqueo(username);
                    expect(estado.bloqueado).toBe(false);

                    // Verificar que el contador se reinició: un intento fallido post-éxito
                    // debe mostrar MAX_INTENTOS - 1 intentos restantes
                    const resultado = registrarIntentoFallido(username);
                    expect(resultado.bloqueado).toBe(false);
                    expect(resultado.intentosRestantes).toBe(MAX_INTENTOS - 1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('después de un reinicio por login exitoso, se necesitan 5 nuevos intentos fallidos para bloquear', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.integer({ min: 1, max: MAX_INTENTOS - 1 }),
                (username, intentosPrimeraRonda) => {
                    limpiarStore();

                    // Primera ronda: acumular intentos fallidos (sin llegar al bloqueo)
                    for (let i = 0; i < intentosPrimeraRonda; i++) {
                        registrarIntentoFallido(username);
                    }

                    // Login exitoso reinicia
                    registrarExito(username);

                    // Segunda ronda: se necesitan exactamente 5 nuevos fallos para bloquear
                    for (let i = 0; i < MAX_INTENTOS - 1; i++) {
                        const resultado = registrarIntentoFallido(username);
                        expect(resultado.bloqueado).toBe(false);
                    }

                    // El 5to nuevo intento fallido activa el bloqueo
                    const resultadoFinal = registrarIntentoFallido(username);
                    expect(resultadoFinal.bloqueado).toBe(true);
                    expect(resultadoFinal.intentosRestantes).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
});
