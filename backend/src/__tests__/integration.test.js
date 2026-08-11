/**
 * Tests de integración para flujos completos de la plataforma AUTOSTAR.
 * Prueba la lógica de negocio conectada como un flujo end-to-end
 * usando funciones puras (sin base de datos ni HTTP).
 *
 * Flujo 1: Crear curso → crear horario → reservar → confirmar → completar clase → verificar avance
 * Flujo 2: Login → bloqueo → desbloqueo
 * Flujo 3: Cancelar clase → reprogramar → completar
 *
 * Validates: Requirements 3.4, 6.3, 8.2, 9.4, 10.6
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
    limpiarStore,
    MAX_INTENTOS,
    registrarExito,
    registrarIntentoFallido,
    verificarBloqueo
} from '../middlewares/rateLimit.js';
import {
    actualizarAvanceAlCompletar,
    calcularAvance,
    calcularDuracionClase,
    esCancelable,
    esCursoFinalizado,
    validarMotivoCancelacion
} from '../services/clase.utils.js';
import { filtrarCursosActivos, validarDatosCurso } from '../services/curso.utils.js';
import { esSlotDisponible, filtrarSlotsPróximas4Semanas, validarSlotHorario } from '../services/horario.utils.js';
import {
    esZonaServicio,
    generarFolio,
    validarFormularioReservacion,
    validarTransicionEstado
} from '../services/reservacion.utils.js';

describe('Flujo 1: Ciclo de vida completo del curso', () => {
    /**
     * Simula el flujo: crear curso → crear horario → reservar → confirmar → completar clase → verificar avance
     * Validates: Requirements 3.4, 6.3, 8.2
     */

    it('crear curso → crear horario → reservar → confirmar → completar clase → verificar avance', () => {
        // === PASO 1: Crear curso (validar datos) ===
        const datosCurso = {
            nombre: 'Curso de Manejo Básico',
            descripcion: 'Curso introductorio para aprender a conducir vehículos automáticos en zona urbana',
            duracion_horas: 10,
            precio: 3500.00,
            categoria_licencia: 'Tipo A',
            activo: true
        };

        const validacionCurso = validarDatosCurso(datosCurso);
        expect(validacionCurso.valido).toBe(true);
        expect(validacionCurso.errores).toHaveLength(0);

        // El curso creado aparece en la lista de activos
        const cursoCreado = { id: 'curso-001', ...datosCurso };
        const cursosActivos = filtrarCursosActivos([cursoCreado, { id: 'curso-002', activo: false, nombre: 'Inactivo' }]);
        expect(cursosActivos).toHaveLength(1);
        expect(cursosActivos[0].id).toBe('curso-001');

        // === PASO 2: Crear horario (validar slot) ===
        const slotPropuesto = {
            hora_inicio: '09:00',
            hora_fin: '11:00',
            instructor_activo: true,
            capacidad_maxima: 5,
            instructor_id: 'instructor-001',
            fecha: '2025-02-15'
        };

        const validacionSlot = validarSlotHorario(slotPropuesto, []);
        expect(validacionSlot.valido).toBe(true);
        expect(validacionSlot.errores).toHaveLength(0);

        // El slot está disponible (0 reservaciones de 5 capacidad)
        expect(esSlotDisponible(0, 5)).toBe(true);

        // El slot aparece en las próximas 4 semanas desde la fecha de referencia
        const slotCreado = { id: 'slot-001', ...slotPropuesto };
        const fechaRef = new Date('2025-02-10');
        const slotsDisponibles = filtrarSlotsPróximas4Semanas([slotCreado], fechaRef);
        expect(slotsDisponibles).toHaveLength(1);

        // === PASO 3: Reservar (validar formulario + zona + generar folio) ===
        const datosReservacion = {
            nombre: 'Juan Pérez García',
            edad: 25,
            codigo_postal: '14000', // Tlalpan - zona sur
            telefono: '5512345678',
            email: 'juan.perez@example.com'
        };

        const validacionForm = validarFormularioReservacion(datosReservacion);
        expect(validacionForm.valido).toBe(true);
        expect(validacionForm.errores).toHaveLength(0);

        // Validar zona de servicio
        expect(esZonaServicio(datosReservacion.codigo_postal)).toBe(true);

        // Generar folio único
        const fechaFolio = new Date(2025, 1, 15); // Feb 15, 2025 en zona local
        const folio = generarFolio(fechaFolio);
        expect(folio).toMatch(/^AUT-20250215-[A-Z0-9]{4}$/);

        // La reservación se crea en estado "pendiente"
        const reservacion = {
            id: 'reservacion-001',
            folio,
            cliente_id: 'cliente-001',
            slot_horario_id: 'slot-001',
            curso_id: 'curso-001',
            estado: 'pendiente'
        };

        // El slot ahora tiene 1 reservación pero aún disponible
        expect(esSlotDisponible(1, 5)).toBe(true);

        // === PASO 4: Confirmar reservación (transición de estado) ===
        const transicion1 = validarTransicionEstado(reservacion.estado, 'confirmada');
        expect(transicion1.valido).toBe(true);
        expect(transicion1.mensaje).toBeNull();

        reservacion.estado = 'confirmada';

        // === PASO 5: Completar clase (calcular duración y avance) ===
        const clase = {
            id: 'clase-001',
            reservacion_id: reservacion.id,
            instructor_id: 'instructor-001',
            fecha: '2025-02-15',
            hora_inicio: '09:00',
            hora_fin: '11:00',
            estado: 'programada'
        };

        // Marcar como completada
        clase.estado = 'completada';

        // La duración de la clase es 2 horas
        const duracion = calcularDuracionClase(clase.hora_inicio, clase.hora_fin);
        expect(duracion).toBe(2);

        // === PASO 6: Verificar avance ===
        const avance = calcularAvance(datosCurso.duracion_horas, [clase]);
        expect(avance.horas_completadas).toBe(2);
        expect(avance.horas_pendientes).toBe(8);
        expect(avance.porcentaje).toBe(20); // 2/10 * 100 = 20%
        expect(avance.finalizado).toBe(false);

        // Completar la reservación después del avance
        const transicion2 = validarTransicionEstado(reservacion.estado, 'completada');
        expect(transicion2.valido).toBe(true);
    });

    it('el avance se actualiza correctamente con múltiples clases completadas', () => {
        const horasTotales = 10;
        const clases = [
            { hora_inicio: '09:00', hora_fin: '11:00', estado: 'completada' }, // 2h
            { hora_inicio: '14:00', hora_fin: '16:00', estado: 'completada' }, // 2h
            { hora_inicio: '09:00', hora_fin: '11:00', estado: 'programada' }, // no cuenta
            { hora_inicio: '09:00', hora_fin: '12:00', estado: 'completada' }  // 3h
        ];

        const avance = calcularAvance(horasTotales, clases);
        expect(avance.horas_completadas).toBe(7);
        expect(avance.horas_pendientes).toBe(3);
        expect(avance.porcentaje).toBe(70);
        expect(avance.finalizado).toBe(false);
    });

    it('el curso se marca como finalizado al alcanzar 100% de avance', () => {
        const horasTotales = 4;
        const clases = [
            { hora_inicio: '09:00', hora_fin: '11:00', estado: 'completada' }, // 2h
            { hora_inicio: '14:00', hora_fin: '16:00', estado: 'completada' }  // 2h
        ];

        const avance = calcularAvance(horasTotales, clases);
        expect(avance.horas_completadas).toBe(4);
        expect(avance.horas_pendientes).toBe(0);
        expect(avance.porcentaje).toBe(100);
        expect(avance.finalizado).toBe(true);
        expect(esCursoFinalizado(4, 4)).toBe(true);
    });

    it('rechaza transiciones de estado no válidas', () => {
        // No se puede ir de pendiente a completada directamente
        const transicion = validarTransicionEstado('pendiente', 'completada');
        expect(transicion.valido).toBe(false);
        expect(transicion.mensaje).toBeTruthy();

        // No se puede cambiar un estado cancelado
        const transicion2 = validarTransicionEstado('cancelada', 'confirmada');
        expect(transicion2.valido).toBe(false);

        // No se puede cambiar un estado completado
        const transicion3 = validarTransicionEstado('completada', 'cancelada');
        expect(transicion3.valido).toBe(false);
    });
});

describe('Flujo 2: Login → bloqueo → desbloqueo', () => {
    /**
     * Simula el flujo de autenticación con bloqueo por intentos fallidos.
     * Validates: Requirement 10.6
     */

    beforeEach(() => {
        limpiarStore();
    });

    it('5 intentos fallidos → bloqueo → desbloqueo tras espera → login exitoso', () => {
        const username = 'admin_test';

        // === PASO 1: Verificar que no está bloqueado inicialmente ===
        const estadoInicial = verificarBloqueo(username);
        expect(estadoInicial.bloqueado).toBe(false);
        expect(estadoInicial.tiempoRestante).toBe(0);

        // === PASO 2: Registrar 4 intentos fallidos (no bloqueado todavía) ===
        for (let i = 1; i < MAX_INTENTOS; i++) {
            const resultado = registrarIntentoFallido(username);
            expect(resultado.bloqueado).toBe(false);
            expect(resultado.intentosRestantes).toBe(MAX_INTENTOS - i);
        }

        // Verificar que aún no está bloqueado después de 4 intentos
        const estadoAntes = verificarBloqueo(username);
        expect(estadoAntes.bloqueado).toBe(false);

        // === PASO 3: El 5to intento activa el bloqueo ===
        const resultadoBloqueo = registrarIntentoFallido(username);
        expect(resultadoBloqueo.bloqueado).toBe(true);
        expect(resultadoBloqueo.intentosRestantes).toBe(0);
        expect(resultadoBloqueo.tiempoRestante).toBeGreaterThan(0);

        // Verificar que el usuario está bloqueado
        const estadoBloqueado = verificarBloqueo(username);
        expect(estadoBloqueado.bloqueado).toBe(true);
        expect(estadoBloqueado.tiempoRestante).toBeGreaterThan(0);

        // === PASO 4: Simular desbloqueo (limpiar store como si hubiera pasado el tiempo) ===
        limpiarStore();

        // Verificar que ya no está bloqueado
        const estadoDesbloqueado = verificarBloqueo(username);
        expect(estadoDesbloqueado.bloqueado).toBe(false);

        // === PASO 5: Login exitoso reinicia el contador ===
        registrarIntentoFallido(username); // 1 intento fallido
        registrarIntentoFallido(username); // 2 intentos fallidos

        // Login exitoso
        registrarExito(username);

        // Verificar que el contador se reinició
        const estadoFinal = verificarBloqueo(username);
        expect(estadoFinal.bloqueado).toBe(false);

        // Ahora necesita 5 intentos nuevamente para bloquearse
        for (let i = 1; i < MAX_INTENTOS; i++) {
            const res = registrarIntentoFallido(username);
            expect(res.bloqueado).toBe(false);
        }
        const ultimoIntento = registrarIntentoFallido(username);
        expect(ultimoIntento.bloqueado).toBe(true);
    });

    it('login exitoso después de intentos fallidos reinicia el contador completamente', () => {
        const username = 'admin_reset';

        // 3 intentos fallidos
        registrarIntentoFallido(username);
        registrarIntentoFallido(username);
        registrarIntentoFallido(username);

        // Login exitoso reinicia
        registrarExito(username);

        // Ahora no está bloqueado y puede fallar 4 veces sin bloquearse
        for (let i = 0; i < 4; i++) {
            const resultado = registrarIntentoFallido(username);
            expect(resultado.bloqueado).toBe(false);
        }

        // El 5to intento (desde el reinicio) bloquea
        const resultado = registrarIntentoFallido(username);
        expect(resultado.bloqueado).toBe(true);
    });

    it('usuarios distintos tienen contadores independientes', () => {
        const user1 = 'admin_user1';
        const user2 = 'admin_user2';

        // Bloquear user1
        for (let i = 0; i < MAX_INTENTOS; i++) {
            registrarIntentoFallido(user1);
        }

        // user1 está bloqueado
        expect(verificarBloqueo(user1).bloqueado).toBe(true);

        // user2 no está bloqueado
        expect(verificarBloqueo(user2).bloqueado).toBe(false);

        // user2 puede intentar sin restricciones de user1
        const resultado = registrarIntentoFallido(user2);
        expect(resultado.bloqueado).toBe(false);
        expect(resultado.intentosRestantes).toBe(4);
    });
});

describe('Flujo 3: Cancelar clase → reprogramar → completar', () => {
    /**
     * Simula el flujo: cancelar clase → reprogramar → completar
     * Validates: Requirements 9.4, 8.2
     */

    it('cancelar clase programada → reprogramar nueva clase → completar → verificar avance', () => {
        const horasTotales = 10;

        // === PASO 1: Clase programada que será cancelada ===
        const claseOriginal = {
            id: 'clase-001',
            reservacion_id: 'reservacion-001',
            instructor_id: 'instructor-001',
            fecha: '2025-02-15',
            hora_inicio: '09:00',
            hora_fin: '11:00',
            estado: 'programada'
        };

        // Verificar que la clase es cancelable (estado = programada)
        const cancelable = esCancelable(claseOriginal.estado);
        expect(cancelable.permitido).toBe(true);
        expect(cancelable.error).toBeNull();

        // === PASO 2: Validar motivo de cancelación ===
        const motivo = 'El alumno solicitó reprogramar por motivos personales';
        const validacionMotivo = validarMotivoCancelacion(motivo);
        expect(validacionMotivo.valido).toBe(true);
        expect(validacionMotivo.error).toBeNull();

        // === PASO 3: Cancelar la clase ===
        claseOriginal.estado = 'cancelada';

        // Verificar que las horas completadas no cambian tras cancelación
        const clasesConCancelada = [
            { hora_inicio: '09:00', hora_fin: '11:00', estado: 'cancelada' } // no debe sumar
        ];
        const avanceTrasCancel = calcularAvance(horasTotales, clasesConCancelada);
        expect(avanceTrasCancel.horas_completadas).toBe(0);
        expect(avanceTrasCancel.horas_pendientes).toBe(10);
        expect(avanceTrasCancel.porcentaje).toBe(0);

        // === PASO 4: Reprogramar — crear nueva clase en estado "programada" ===
        const claseReprogramada = {
            id: 'clase-002',
            reservacion_id: 'reservacion-001',
            instructor_id: 'instructor-001',
            fecha: '2025-02-20',
            hora_inicio: '14:00',
            hora_fin: '16:00',
            estado: 'programada'
        };

        // Validar el nuevo slot para la reprogramación
        const slotReprogramado = {
            hora_inicio: '14:00',
            hora_fin: '16:00',
            instructor_activo: true,
            capacidad_maxima: 5
        };
        const validacionSlot = validarSlotHorario(slotReprogramado, []);
        expect(validacionSlot.valido).toBe(true);

        // El avance sigue en 0 mientras la clase está programada
        const clasesConReprogramada = [
            { hora_inicio: '09:00', hora_fin: '11:00', estado: 'cancelada' },
            { hora_inicio: '14:00', hora_fin: '16:00', estado: 'programada' }
        ];
        const avanceAntes = calcularAvance(horasTotales, clasesConReprogramada);
        expect(avanceAntes.horas_completadas).toBe(0);
        expect(avanceAntes.horas_pendientes).toBe(10);

        // === PASO 5: Completar la clase reprogramada ===
        claseReprogramada.estado = 'completada';

        const clasesConCompletada = [
            { hora_inicio: '09:00', hora_fin: '11:00', estado: 'cancelada' },
            { hora_inicio: '14:00', hora_fin: '16:00', estado: 'completada' }
        ];
        const avanceFinal = calcularAvance(horasTotales, clasesConCompletada);
        expect(avanceFinal.horas_completadas).toBe(2);
        expect(avanceFinal.horas_pendientes).toBe(8);
        expect(avanceFinal.porcentaje).toBe(20);
        expect(avanceFinal.finalizado).toBe(false);
    });

    it('no se puede cancelar una clase que ya está completada', () => {
        const claseCompletada = { id: 'clase-003', estado: 'completada' };
        const resultado = esCancelable(claseCompletada.estado);
        expect(resultado.permitido).toBe(false);
        expect(resultado.error).toContain('programada');
    });

    it('no se puede cancelar una clase que ya está cancelada', () => {
        const claseCancelada = { id: 'clase-004', estado: 'cancelada' };
        const resultado = esCancelable(claseCancelada.estado);
        expect(resultado.permitido).toBe(false);
        expect(resultado.error).toContain('programada');
    });

    it('motivo de cancelación rechazado si es muy corto', () => {
        const resultado = validarMotivoCancelacion('Corto');
        expect(resultado.valido).toBe(false);
        expect(resultado.error).toBeTruthy();
    });

    it('motivo de cancelación rechazado si excede 500 caracteres', () => {
        const motivoLargo = 'A'.repeat(501);
        const resultado = validarMotivoCancelacion(motivoLargo);
        expect(resultado.valido).toBe(false);
        expect(resultado.error).toBeTruthy();
    });

    it('el avance se actualiza correctamente con actualizarAvanceAlCompletar', () => {
        const horasTotales = 10;
        const horasCompletadasAntes = 4; // ya tenía 4 horas

        // Completar clase de 2 horas
        const duracion = calcularDuracionClase('09:00', '11:00');
        expect(duracion).toBe(2);

        const nuevoAvance = actualizarAvanceAlCompletar(horasTotales, horasCompletadasAntes, duracion);
        expect(nuevoAvance.horas_completadas).toBe(6);
        expect(nuevoAvance.horas_pendientes).toBe(4);
        expect(nuevoAvance.porcentaje).toBe(60);
    });

    it('cancelar y reprogramar múltiples veces mantiene consistencia del avance', () => {
        const horasTotales = 8;

        // Historial de clases: 2 canceladas, 1 completada, 1 programada
        const clases = [
            { hora_inicio: '09:00', hora_fin: '11:00', estado: 'cancelada' },  // cancelada 1
            { hora_inicio: '14:00', hora_fin: '16:00', estado: 'cancelada' },  // cancelada 2 (reprogramación también cancelada)
            { hora_inicio: '09:00', hora_fin: '11:00', estado: 'completada' }, // completada (2h)
            { hora_inicio: '14:00', hora_fin: '16:00', estado: 'programada' }  // pendiente
        ];

        const avance = calcularAvance(horasTotales, clases);
        // Solo la completada cuenta: 2 horas
        expect(avance.horas_completadas).toBe(2);
        expect(avance.horas_pendientes).toBe(6);
        expect(avance.porcentaje).toBe(25);
        expect(avance.finalizado).toBe(false);
    });
});
