/**
 * Tests unitarios para la lógica de avance de horas y cancelaciones.
 * Valida: Requisitos 8.1, 8.3, 8.4
 */
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const {
    calcularDuracionClase,
    calcularHorasCompletadas,
    calcularHorasPendientes,
    calcularPorcentaje,
    esCursoFinalizado,
    calcularAvance
} = require(resolve(__dirname, './clase.utils.js'));

describe('clase.utils — Cálculo de avance de horas', () => {
    describe('calcularHorasCompletadas', () => {
        it('calcula horas completadas a partir de una lista de clases con duraciones conocidas', () => {
            // Clase de 09:00 a 11:00 = 2 horas
            const clases = [
                { hora_inicio: '09:00', hora_fin: '11:00', estado: 'completada' },
                { hora_inicio: '14:00', hora_fin: '15:30', estado: 'completada' }
            ];

            const resultado = calcularHorasCompletadas(clases);

            // 2 + 1.5 = 3.5 horas
            expect(resultado).toBe(3.5);
        });

        it('suma duraciones de múltiples clases completadas', () => {
            const clases = [
                { hora_inicio: '08:00', hora_fin: '09:00', estado: 'completada' },
                { hora_inicio: '10:00', hora_fin: '11:00', estado: 'completada' },
                { hora_inicio: '12:00', hora_fin: '13:00', estado: 'completada' },
                { hora_inicio: '14:00', hora_fin: '15:00', estado: 'completada' }
            ];

            const resultado = calcularHorasCompletadas(clases);

            // 4 clases de 1 hora = 4 horas
            expect(resultado).toBe(4);
        });

        it('cancelar una clase no afecta el conteo de horas completadas', () => {
            const clases = [
                { hora_inicio: '09:00', hora_fin: '11:00', estado: 'completada' },
                { hora_inicio: '14:00', hora_fin: '16:00', estado: 'cancelada' },
                { hora_inicio: '10:00', hora_fin: '12:00', estado: 'programada' }
            ];

            const resultado = calcularHorasCompletadas(clases);

            // Solo la primera clase (completada) cuenta: 2 horas
            expect(resultado).toBe(2);
        });

        it('retorna 0 cuando no hay clases completadas', () => {
            const clases = [
                { hora_inicio: '09:00', hora_fin: '11:00', estado: 'programada' },
                { hora_inicio: '14:00', hora_fin: '16:00', estado: 'cancelada' }
            ];

            const resultado = calcularHorasCompletadas(clases);

            expect(resultado).toBe(0);
        });

        it('retorna 0 cuando la lista está vacía', () => {
            const resultado = calcularHorasCompletadas([]);
            expect(resultado).toBe(0);
        });
    });

    describe('calcularHorasPendientes', () => {
        it('calcula horas pendientes correctamente (total - completadas)', () => {
            const pendientes = calcularHorasPendientes(20, 8);
            expect(pendientes).toBe(12);
        });

        it('retorna 0 cuando completadas son iguales al total', () => {
            const pendientes = calcularHorasPendientes(10, 10);
            expect(pendientes).toBe(0);
        });

        it('retorna 0 cuando completadas exceden el total (nunca negativo)', () => {
            const pendientes = calcularHorasPendientes(10, 12);
            expect(pendientes).toBe(0);
        });

        it('retorna el total completo cuando completadas son 0', () => {
            const pendientes = calcularHorasPendientes(30, 0);
            expect(pendientes).toBe(30);
        });
    });

    describe('calcularPorcentaje', () => {
        it('calcula porcentaje redondeado a entero', () => {
            // 7 / 20 = 35%
            expect(calcularPorcentaje(7, 20)).toBe(35);
        });

        it('redondea al entero más cercano', () => {
            // 1 / 3 = 33.33% → 33
            expect(calcularPorcentaje(1, 3)).toBe(33);
            // 2 / 3 = 66.67% → 67
            expect(calcularPorcentaje(2, 3)).toBe(67);
        });

        it('retorna 0 cuando completadas son 0', () => {
            expect(calcularPorcentaje(0, 20)).toBe(0);
        });

        it('retorna 100 cuando completadas igualan el total', () => {
            expect(calcularPorcentaje(20, 20)).toBe(100);
        });

        it('no excede 100 cuando completadas superan el total', () => {
            expect(calcularPorcentaje(25, 20)).toBe(100);
        });

        it('retorna 0 cuando horas totales son 0', () => {
            expect(calcularPorcentaje(5, 0)).toBe(0);
        });
    });

    describe('esCursoFinalizado', () => {
        it('marca como finalizado cuando completadas >= total', () => {
            expect(esCursoFinalizado(20, 20)).toBe(true);
        });

        it('marca como finalizado cuando completadas exceden el total', () => {
            expect(esCursoFinalizado(22, 20)).toBe(true);
        });

        it('no marca como finalizado cuando completadas < total', () => {
            expect(esCursoFinalizado(19, 20)).toBe(false);
        });

        it('no marca como finalizado con 0 horas completadas', () => {
            expect(esCursoFinalizado(0, 20)).toBe(false);
        });
    });

    describe('calcularAvance — integración', () => {
        it('calcula avance completo cuando completadas = 0 → 0% con pendientes = total', () => {
            const clases = [
                { hora_inicio: '09:00', hora_fin: '11:00', estado: 'programada' }
            ];

            const avance = calcularAvance(20, clases);

            expect(avance.horas_completadas).toBe(0);
            expect(avance.horas_pendientes).toBe(20);
            expect(avance.porcentaje).toBe(0);
            expect(avance.finalizado).toBe(false);
        });

        it('calcula avance cuando hay progreso parcial', () => {
            const clases = [
                { hora_inicio: '09:00', hora_fin: '11:00', estado: 'completada' }, // 2h
                { hora_inicio: '14:00', hora_fin: '16:00', estado: 'completada' }, // 2h
                { hora_inicio: '09:00', hora_fin: '11:00', estado: 'programada' }  // no cuenta
            ];

            const avance = calcularAvance(10, clases);

            expect(avance.horas_completadas).toBe(4);
            expect(avance.horas_pendientes).toBe(6);
            expect(avance.porcentaje).toBe(40);
            expect(avance.finalizado).toBe(false);
        });

        it('finalización automática cuando completadas >= total → 100%', () => {
            const clases = [
                { hora_inicio: '08:00', hora_fin: '10:00', estado: 'completada' }, // 2h
                { hora_inicio: '10:00', hora_fin: '12:00', estado: 'completada' }, // 2h
                { hora_inicio: '14:00', hora_fin: '16:00', estado: 'completada' }  // 2h
            ];

            const avance = calcularAvance(6, clases);

            expect(avance.horas_completadas).toBe(6);
            expect(avance.horas_pendientes).toBe(0);
            expect(avance.porcentaje).toBe(100);
            expect(avance.finalizado).toBe(true);
        });

        it('edge case: clase que completa exactamente las horas restantes → 100%', () => {
            // Total: 5 horas. Ya tiene 3 completadas, la última completa las 2 restantes.
            const clases = [
                { hora_inicio: '09:00', hora_fin: '12:00', estado: 'completada' }, // 3h
                { hora_inicio: '14:00', hora_fin: '16:00', estado: 'completada' }  // 2h
            ];

            const avance = calcularAvance(5, clases);

            expect(avance.horas_completadas).toBe(5);
            expect(avance.horas_pendientes).toBe(0);
            expect(avance.porcentaje).toBe(100);
            expect(avance.finalizado).toBe(true);
        });

        it('cancelar clases no afecta horas completadas del avance', () => {
            const clases = [
                { hora_inicio: '09:00', hora_fin: '11:00', estado: 'completada' }, // 2h
                { hora_inicio: '14:00', hora_fin: '16:00', estado: 'cancelada' },  // no cuenta
                { hora_inicio: '09:00', hora_fin: '11:00', estado: 'cancelada' }   // no cuenta
            ];

            const avance = calcularAvance(10, clases);

            expect(avance.horas_completadas).toBe(2);
            expect(avance.horas_pendientes).toBe(8);
            expect(avance.porcentaje).toBe(20);
            expect(avance.finalizado).toBe(false);
        });
    });

    describe('calcularDuracionClase', () => {
        it('calcula duración con formato HH:MM', () => {
            expect(calcularDuracionClase('09:00', '11:00')).toBe(2);
            expect(calcularDuracionClase('14:00', '15:30')).toBe(1.5);
        });

        it('calcula duración con formato HH:MM:SS', () => {
            expect(calcularDuracionClase('09:00:00', '10:30:00')).toBe(1.5);
        });

        it('calcula duraciones fraccionarias', () => {
            // 45 minutos = 0.75 horas
            expect(calcularDuracionClase('10:00', '10:45')).toBe(0.75);
        });
    });
});
