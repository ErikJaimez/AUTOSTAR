/**
 * Utilidades de formateo para la plataforma AUTOSTAR
 * Formateo de moneda MXN y fechas en español
 */

/**
 * Formatea un valor numérico como moneda mexicana (MXN)
 * @param {number} valor - Valor numérico a formatear
 * @returns {string} Valor formateado como moneda MXN (ej: "$1,500.00")
 */
export function formatearMoneda(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return '$0.00';
    }

    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

/**
 * Formatea una fecha en formato largo en español (DD de mes de YYYY)
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha formateada (ej: "15 de enero de 2025")
 */
export function formatearFecha(fecha) {
    if (!fecha) return '';

    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);

    if (isNaN(fechaObj.getTime())) return '';

    return new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(fechaObj);
}

/**
 * Formatea una fecha en formato corto (DD/MM/YYYY)
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha formateada (ej: "15/01/2025")
 */
export function formatearFechaCorta(fecha) {
    if (!fecha) return '';

    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);

    if (isNaN(fechaObj.getTime())) return '';

    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(fechaObj);
}

/**
 * Formatea una hora en formato HH:MM
 * @param {string} hora - Hora en formato HH:MM o HH:MM:SS
 * @returns {string} Hora formateada en HH:MM (ej: "14:30")
 */
export function formatearHora(hora) {
    if (!hora) return '';

    const partes = hora.split(':');
    if (partes.length < 2) return '';

    const hh = partes[0].padStart(2, '0');
    const mm = partes[1].padStart(2, '0');

    return `${hh}:${mm}`;
}
