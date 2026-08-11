/**
 * Utilidades puras para el módulo de clases y avance de horas.
 * Funciones de cálculo de avance sin dependencias externas.
 */

/**
 * Calcula la duración en horas de una clase a partir de hora_inicio y hora_fin.
 * Acepta strings en formato "HH:MM" o "HH:MM:SS".
 *
 * @param {string} horaInicio - Hora de inicio (formato "HH:MM" o "HH:MM:SS")
 * @param {string} horaFin - Hora de fin (formato "HH:MM" o "HH:MM:SS")
 * @returns {number} Duración en horas (decimal)
 */
function calcularDuracionClase(horaInicio, horaFin) {
    const parsearHora = (hora) => {
        const partes = hora.split(':');
        const h = parseInt(partes[0], 10);
        const m = parseInt(partes[1], 10);
        const s = partes[2] ? parseInt(partes[2], 10) : 0;
        return h * 3600 + m * 60 + s;
    };

    const inicioSegundos = parsearHora(horaInicio);
    const finSegundos = parsearHora(horaFin);
    const diferenciaSegundos = finSegundos - inicioSegundos;

    return diferenciaSegundos / 3600;
}

/**
 * Calcula las horas completadas sumando las duraciones de todas las clases completadas.
 *
 * @param {Array<Object>} clases - Lista de clases con campos: hora_inicio, hora_fin, estado
 * @returns {number} Total de horas completadas (decimal)
 */
function calcularHorasCompletadas(clases) {
    if (!Array.isArray(clases)) return 0;

    return clases
        .filter((clase) => clase.estado === 'completada')
        .reduce((total, clase) => {
            const duracion = calcularDuracionClase(clase.hora_inicio, clase.hora_fin);
            return total + duracion;
        }, 0);
}

/**
 * Calcula las horas pendientes (total - completadas).
 * Nunca retorna valores negativos.
 *
 * @param {number} horasTotales - Horas totales contratadas del curso
 * @param {number} horasCompletadas - Horas ya completadas
 * @returns {number} Horas pendientes (>=0)
 */
function calcularHorasPendientes(horasTotales, horasCompletadas) {
    return Math.max(0, horasTotales - horasCompletadas);
}

/**
 * Calcula el porcentaje de avance como entero redondeado entre 0 y 100.
 *
 * @param {number} horasCompletadas - Horas completadas
 * @param {number} horasTotales - Horas totales contratadas
 * @returns {number} Porcentaje entero entre 0 y 100
 */
function calcularPorcentaje(horasCompletadas, horasTotales) {
    if (horasTotales <= 0) return 0;
    const porcentaje = Math.round((horasCompletadas / horasTotales) * 100);
    return Math.min(Math.max(porcentaje, 0), 100);
}

/**
 * Determina si el curso debe marcarse como finalizado (avance >= 100%).
 *
 * @param {number} horasCompletadas - Horas completadas
 * @param {number} horasTotales - Horas totales contratadas
 * @returns {boolean} true si el curso está finalizado
 */
function esCursoFinalizado(horasCompletadas, horasTotales) {
    if (horasTotales <= 0) return false;
    return horasCompletadas >= horasTotales;
}

/**
 * Calcula el avance completo de un alumno dado el total de horas y la lista de clases.
 *
 * @param {number} horasTotales - Horas totales contratadas del curso
 * @param {Array<Object>} clases - Lista de clases con campos: hora_inicio, hora_fin, estado
 * @returns {{ horas_completadas: number, horas_pendientes: number, porcentaje: number, finalizado: boolean }}
 */
function calcularAvance(horasTotales, clases) {
    const horasCompletadas = calcularHorasCompletadas(clases);
    const horasPendientes = calcularHorasPendientes(horasTotales, horasCompletadas);
    const porcentaje = calcularPorcentaje(horasCompletadas, horasTotales);
    const finalizado = esCursoFinalizado(horasCompletadas, horasTotales);

    return {
        horas_completadas: parseFloat(horasCompletadas.toFixed(1)),
        horas_pendientes: parseFloat(horasPendientes.toFixed(1)),
        porcentaje,
        finalizado
    };
}

/**
 * Calcula el avance actualizado después de completar una clase específica.
 * Retorna el nuevo avance con horas_completadas incrementadas en D y pendientes decrementadas en D.
 *
 * @param {number} horasTotales - Horas totales contratadas
 * @param {number} horasCompletadasAntes - Horas completadas antes de esta clase
 * @param {number} duracionClase - Duración de la clase completada (en horas)
 * @returns {{ horas_completadas: number, horas_pendientes: number, porcentaje: number }}
 */
function actualizarAvanceAlCompletar(horasTotales, horasCompletadasAntes, duracionClase) {
    const nuevasCompletadas = horasCompletadasAntes + duracionClase;
    const nuevasPendientes = calcularHorasPendientes(horasTotales, nuevasCompletadas);
    const porcentaje = calcularPorcentaje(nuevasCompletadas, horasTotales);

    return {
        horas_completadas: nuevasCompletadas,
        horas_pendientes: nuevasPendientes,
        porcentaje
    };
}

/**
 * Valida un motivo de cancelación.
 * Acepta si y solo si la longitud está entre 10 y 500 caracteres inclusive.
 *
 * @param {*} motivo - El motivo de cancelación
 * @returns {{ valido: boolean, error: string|null }}
 */
function validarMotivoCancelacion(motivo) {
    if (motivo === undefined || motivo === null || typeof motivo !== 'string') {
        return { valido: false, error: 'El motivo de cancelación es obligatorio' };
    }

    if (motivo.length < 10) {
        return { valido: false, error: 'El motivo debe tener al menos 10 caracteres' };
    }

    if (motivo.length > 500) {
        return { valido: false, error: 'El motivo no debe exceder 500 caracteres' };
    }

    return { valido: true, error: null };
}

/**
 * Determina si una clase puede ser cancelada basándose en su estado.
 * Solo clases en estado "programada" son cancelables.
 *
 * @param {string} estado - Estado actual de la clase
 * @returns {{ permitido: boolean, error: string|null }}
 */
function esCancelable(estado) {
    if (estado === 'programada') {
        return { permitido: true, error: null };
    }

    return {
        permitido: false,
        error: `Solo las clases en estado "programada" pueden ser canceladas. Estado actual: "${estado}"`
    };
}

module.exports = {
    calcularDuracionClase,
    calcularHorasCompletadas,
    calcularHorasPendientes,
    calcularPorcentaje,
    esCursoFinalizado,
    calcularAvance,
    actualizarAvanceAlCompletar,
    validarMotivoCancelacion,
    esCancelable
};
