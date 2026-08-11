/**
 * Utilidades puras para el módulo de reservaciones.
 * Funciones de validación, zona de servicio, generación de folios,
 * máquina de estados y filtros sin dependencias externas.
 */

/**
 * Rangos de códigos postales válidos de la zona sur de CDMX.
 * Tlalpan: 14000-14999, Coyoacán: 04000-04999,
 * Xochimilco: 16000-16999, Tláhuac: 13000-13999,
 * Milpa Alta: 12000-12999
 */
const RANGOS_ZONA_SUR = [
    { min: 14000, max: 14999 }, // Tlalpan
    { min: 4000, max: 4999 },   // Coyoacán
    { min: 16000, max: 16999 }, // Xochimilco
    { min: 13000, max: 13999 }, // Tláhuac
    { min: 12000, max: 12999 }  // Milpa Alta
];

/**
 * Transiciones de estado válidas para reservaciones.
 * Cada estado tiene un array de estados destino permitidos.
 */
const TRANSICIONES_VALIDAS = {
    pendiente: ['confirmada', 'cancelada'],
    confirmada: ['completada', 'cancelada'],
    completada: [],
    cancelada: []
};

/**
 * Valida que un código postal pertenezca a la zona sur de CDMX.
 * El código debe ser exactamente 5 dígitos numéricos y pertenecer a uno de los rangos definidos.
 *
 * @param {string} codigoPostal - Código postal de 5 dígitos
 * @returns {boolean} true si pertenece a la zona sur
 */
function esZonaServicio(codigoPostal) {
    if (typeof codigoPostal !== 'string') return false;
    if (!/^\d{5}$/.test(codigoPostal)) return false;

    const cp = parseInt(codigoPostal, 10);
    return RANGOS_ZONA_SUR.some(rango => cp >= rango.min && cp <= rango.max);
}

/**
 * Valida los datos del formulario de reservación.
 * Retorna un objeto con `valido` (boolean) y `errores` (array de errores por campo).
 *
 * Reglas:
 * - nombre: 1-120 caracteres
 * - edad: entero entre 16-99
 * - codigo_postal: exactamente 5 dígitos numéricos
 * - telefono: exactamente 10 dígitos numéricos
 * - email: formato válido (usuario@dominio)
 *
 * @param {Object} datos - Datos del formulario
 * @returns {{ valido: boolean, errores: Array<{ campo: string, mensaje: string }> }}
 */
function validarFormularioReservacion(datos) {
    const errores = [];

    if (!datos || typeof datos !== 'object') {
        return { valido: false, errores: [{ campo: 'datos', mensaje: 'Los datos del formulario son requeridos' }] };
    }

    // Validar nombre: 1-120 caracteres
    if (datos.nombre === undefined || datos.nombre === null || typeof datos.nombre !== 'string' || datos.nombre.length < 1 || datos.nombre.length > 120) {
        errores.push({
            campo: 'nombre',
            mensaje: 'El nombre debe tener entre 1 y 120 caracteres'
        });
    }

    // Validar edad: entero entre 16-99
    if (datos.edad === undefined || datos.edad === null || !Number.isInteger(datos.edad) || datos.edad < 16 || datos.edad > 99) {
        errores.push({
            campo: 'edad',
            mensaje: 'La edad debe ser un número entero entre 16 y 99'
        });
    }

    // Validar código postal: exactamente 5 dígitos numéricos
    if (datos.codigo_postal === undefined || datos.codigo_postal === null || typeof datos.codigo_postal !== 'string' || !/^\d{5}$/.test(datos.codigo_postal)) {
        errores.push({
            campo: 'codigo_postal',
            mensaje: 'El código postal debe ser exactamente 5 dígitos numéricos'
        });
    }

    // Validar teléfono: exactamente 10 dígitos numéricos
    if (datos.telefono === undefined || datos.telefono === null || typeof datos.telefono !== 'string' || !/^\d{10}$/.test(datos.telefono)) {
        errores.push({
            campo: 'telefono',
            mensaje: 'El teléfono debe ser exactamente 10 dígitos numéricos'
        });
    }

    // Validar email: formato válido (usuario@dominio)
    if (datos.email === undefined || datos.email === null || typeof datos.email !== 'string' || !validarFormatoEmail(datos.email)) {
        errores.push({
            campo: 'email',
            mensaje: 'El correo electrónico debe tener un formato válido (usuario@dominio)'
        });
    }

    return {
        valido: errores.length === 0,
        errores
    };
}

/**
 * Valida el formato de un correo electrónico.
 * Formato: al menos 1 caracter antes de @, luego @, luego dominio con al menos un punto.
 *
 * @param {string} email - Correo electrónico a validar
 * @returns {boolean} true si el formato es válido
 */
function validarFormatoEmail(email) {
    if (typeof email !== 'string' || email.length === 0) return false;
    // Patrón simple: usuario@dominio.extension
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return patron.test(email);
}

/**
 * Genera un folio único con formato AUT-YYYYMMDD-XXXX.
 * Esta es una función pura que genera el folio sin verificación en base de datos.
 * La unicidad se garantiza por la parte aleatoria + verificación en el servicio.
 *
 * @param {Date} [fecha=new Date()] - Fecha para el folio
 * @param {string} [parteAleatoria] - Parte aleatoria opcional (4 chars alfanuméricos). Si no se provee, se genera.
 * @returns {string} Folio generado
 */
function generarFolio(fecha = new Date(), parteAleatoria) {
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    const fechaStr = `${yyyy}${mm}${dd}`;

    let aleatorio = parteAleatoria;
    if (!aleatorio) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        aleatorio = '';
        for (let i = 0; i < 4; i++) {
            aleatorio += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }

    return `AUT-${fechaStr}-${aleatorio}`;
}

/**
 * Genera N folios únicos. Cada folio generado es distinto a todos los anteriores.
 *
 * @param {number} n - Número de folios a generar
 * @param {Date} [fecha=new Date()] - Fecha para los folios
 * @returns {string[]} Array de folios únicos
 */
function generarFoliosUnicos(n, fecha = new Date()) {
    const folios = new Set();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const maxIntentos = n * 10;
    let intentos = 0;

    while (folios.size < n && intentos < maxIntentos) {
        let aleatorio = '';
        for (let i = 0; i < 4; i++) {
            aleatorio += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const folio = generarFolio(fecha, aleatorio);
        folios.add(folio);
        intentos++;
    }

    return Array.from(folios);
}

/**
 * Valida si una transición de estado es permitida.
 *
 * @param {string} estadoActual - Estado actual de la reservación
 * @param {string} estadoDestino - Estado destino propuesto
 * @returns {{ valido: boolean, mensaje: string|null, transicionesPermitidas: string[] }}
 */
function validarTransicionEstado(estadoActual, estadoDestino) {
    const estadosValidos = ['pendiente', 'confirmada', 'completada', 'cancelada'];

    if (!estadosValidos.includes(estadoActual)) {
        return {
            valido: false,
            mensaje: `El estado actual "${estadoActual}" no es un estado válido`,
            transicionesPermitidas: []
        };
    }

    if (!estadosValidos.includes(estadoDestino)) {
        return {
            valido: false,
            mensaje: `El estado destino "${estadoDestino}" no es un estado válido`,
            transicionesPermitidas: TRANSICIONES_VALIDAS[estadoActual] || []
        };
    }

    const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActual] || [];
    const esValida = transicionesPermitidas.includes(estadoDestino);

    return {
        valido: esValida,
        mensaje: esValida
            ? null
            : `La transición de "${estadoActual}" a "${estadoDestino}" no es válida. Transiciones permitidas: ${transicionesPermitidas.length > 0 ? transicionesPermitidas.join(', ') : 'ninguna'}`,
        transicionesPermitidas
    };
}

/**
 * Filtra reservaciones aplicando todos los filtros activos simultáneamente.
 * Solo se aplican los filtros que están presentes (no undefined/null).
 *
 * @param {Array<Object>} reservaciones - Lista de reservaciones
 * @param {Object} filtros - Filtros a aplicar
 * @param {string} [filtros.estado] - Filtrar por estado
 * @param {string} [filtros.curso_id] - Filtrar por ID de curso
 * @param {string} [filtros.instructor_id] - Filtrar por ID de instructor
 * @param {string} [filtros.fecha_desde] - Filtrar desde esta fecha (YYYY-MM-DD, inclusive)
 * @param {string} [filtros.fecha_hasta] - Filtrar hasta esta fecha (YYYY-MM-DD, inclusive)
 * @returns {Array<Object>} Reservaciones que cumplen TODOS los filtros activos
 */
function filtrarReservaciones(reservaciones, filtros = {}) {
    if (!Array.isArray(reservaciones)) return [];
    if (!filtros || typeof filtros !== 'object') return reservaciones;

    return reservaciones.filter(reservacion => {
        // Filtro por estado
        if (filtros.estado !== undefined && filtros.estado !== null) {
            if (reservacion.estado !== filtros.estado) return false;
        }

        // Filtro por curso
        if (filtros.curso_id !== undefined && filtros.curso_id !== null) {
            if (reservacion.curso_id !== filtros.curso_id) return false;
        }

        // Filtro por instructor
        if (filtros.instructor_id !== undefined && filtros.instructor_id !== null) {
            if (reservacion.instructor_id !== filtros.instructor_id) return false;
        }

        // Filtro por fecha desde (inclusive)
        if (filtros.fecha_desde !== undefined && filtros.fecha_desde !== null) {
            if (!reservacion.fecha || reservacion.fecha < filtros.fecha_desde) return false;
        }

        // Filtro por fecha hasta (inclusive)
        if (filtros.fecha_hasta !== undefined && filtros.fecha_hasta !== null) {
            if (!reservacion.fecha || reservacion.fecha > filtros.fecha_hasta) return false;
        }

        return true;
    });
}

module.exports = {
    esZonaServicio,
    validarFormularioReservacion,
    validarFormatoEmail,
    generarFolio,
    generarFoliosUnicos,
    validarTransicionEstado,
    filtrarReservaciones,
    RANGOS_ZONA_SUR,
    TRANSICIONES_VALIDAS
};
