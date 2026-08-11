/**
 * Utilidades puras para el módulo de horarios.
 * Funciones de filtrado, disponibilidad y validación sin dependencias externas.
 */

/**
 * Filtra una lista de slots retornando únicamente los que están dentro de las próximas 4 semanas
 * desde una fecha de referencia, y los ordena cronológicamente (fecha + hora_inicio ascendente).
 *
 * @param {Array<Object>} slots - Lista de slots con campos `fecha` (string YYYY-MM-DD) y `hora_inicio` (string HH:MM)
 * @param {Date} [fechaReferencia=new Date()] - Fecha desde la cual contar 4 semanas (por defecto hoy)
 * @returns {Array<Object>} Slots filtrados y ordenados cronológicamente
 */
function filtrarSlotsPróximas4Semanas(slots, fechaReferencia = new Date()) {
    if (!Array.isArray(slots)) return [];

    // Normalizar fecha de referencia al inicio del día
    const hoy = new Date(fechaReferencia);
    hoy.setHours(0, 0, 0, 0);

    // Calcular el límite: 4 semanas (28 días) desde hoy
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + 28);

    // Filtrar slots dentro del rango [hoy, hoy + 28 días)
    const filtrados = slots.filter((slot) => {
        if (!slot.fecha) return false;
        const fechaSlot = new Date(slot.fecha + 'T00:00:00');
        return fechaSlot >= hoy && fechaSlot < limite;
    });

    // Ordenar cronológicamente por fecha y luego hora_inicio
    filtrados.sort((a, b) => {
        const fechaA = a.fecha || '';
        const fechaB = b.fecha || '';
        if (fechaA !== fechaB) {
            return fechaA.localeCompare(fechaB);
        }
        const horaA = a.hora_inicio || '';
        const horaB = b.hora_inicio || '';
        return horaA.localeCompare(horaB);
    });

    return filtrados;
}

/**
 * Determina si un slot está disponible según su capacidad máxima y el conteo de reservaciones.
 * Un slot está disponible si y solo si el conteo de reservaciones es estrictamente menor que la capacidad máxima.
 *
 * @param {number} reservacionesCount - Número actual de reservaciones para el slot
 * @param {number} capacidadMaxima - Capacidad máxima del slot
 * @returns {boolean} true si el slot está disponible, false en caso contrario
 */
function esSlotDisponible(reservacionesCount, capacidadMaxima) {
    if (typeof reservacionesCount !== 'number' || typeof capacidadMaxima !== 'number') {
        return false;
    }
    return reservacionesCount < capacidadMaxima;
}

/**
 * Valida un slot de horario propuesto.
 * Rechaza cuando:
 * - hora_fin <= hora_inicio
 * - el instructor no está activo
 * - la capacidad no está entre 1-30
 * - existe un traslape temporal con otro slot del mismo instructor en la misma fecha
 *
 * Traslape: dos intervalos [a,b) y [c,d) se traslapan si a < d AND c < b.
 *
 * @param {Object} slotPropuesto - Slot a validar { hora_inicio, hora_fin, instructor_activo, capacidad_maxima, instructor_id, fecha }
 * @param {Array<Object>} slotsExistentes - Slots existentes del mismo instructor en la misma fecha
 * @returns {{ valido: boolean, errores: Array<{ campo: string, mensaje: string }> }}
 */
function validarSlotHorario(slotPropuesto, slotsExistentes = []) {
    const errores = [];

    if (!slotPropuesto || typeof slotPropuesto !== 'object') {
        return { valido: false, errores: [{ campo: 'datos', mensaje: 'Los datos del slot son requeridos' }] };
    }

    // Validar hora_fin > hora_inicio
    if (slotPropuesto.hora_inicio !== undefined && slotPropuesto.hora_fin !== undefined) {
        if (slotPropuesto.hora_fin <= slotPropuesto.hora_inicio) {
            errores.push({
                campo: 'hora_fin',
                mensaje: 'La hora de fin debe ser posterior a la hora de inicio'
            });
        }
    } else {
        if (slotPropuesto.hora_inicio === undefined || slotPropuesto.hora_inicio === null) {
            errores.push({ campo: 'hora_inicio', mensaje: 'La hora de inicio es obligatoria' });
        }
        if (slotPropuesto.hora_fin === undefined || slotPropuesto.hora_fin === null) {
            errores.push({ campo: 'hora_fin', mensaje: 'La hora de fin es obligatoria' });
        }
    }

    // Validar instructor activo
    if (slotPropuesto.instructor_activo === false) {
        errores.push({
            campo: 'instructor_id',
            mensaje: 'Solo se pueden asignar instructores con estado activo'
        });
    }

    // Validar capacidad entre 1 y 30
    if (slotPropuesto.capacidad_maxima === undefined || slotPropuesto.capacidad_maxima === null) {
        errores.push({ campo: 'capacidad_maxima', mensaje: 'La capacidad máxima es obligatoria' });
    } else if (!Number.isInteger(slotPropuesto.capacidad_maxima) || slotPropuesto.capacidad_maxima < 1 || slotPropuesto.capacidad_maxima > 30) {
        errores.push({
            campo: 'capacidad_maxima',
            mensaje: 'La capacidad máxima debe estar entre 1 y 30 alumnos'
        });
    }

    // Detectar traslape temporal con slots existentes del mismo instructor en la misma fecha
    if (slotPropuesto.hora_inicio !== undefined && slotPropuesto.hora_fin !== undefined && slotPropuesto.hora_fin > slotPropuesto.hora_inicio) {
        const slotsEnMismaFecha = Array.isArray(slotsExistentes) ? slotsExistentes : [];

        for (const existente of slotsEnMismaFecha) {
            // Traslape: [a,b) y [c,d) se traslapan si a < d AND c < b
            const a = slotPropuesto.hora_inicio;
            const b = slotPropuesto.hora_fin;
            const c = existente.hora_inicio;
            const d = existente.hora_fin;

            if (a < d && c < b) {
                errores.push({
                    campo: 'hora_inicio',
                    mensaje: `Conflicto de horario: se traslapa con slot de ${c} a ${d}`
                });
                break; // Solo reportar el primer conflicto
            }
        }
    }

    return {
        valido: errores.length === 0,
        errores
    };
}

module.exports = {
    filtrarSlotsPróximas4Semanas,
    esSlotDisponible,
    validarSlotHorario
};
