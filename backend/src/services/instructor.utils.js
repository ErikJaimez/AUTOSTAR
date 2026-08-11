/**
 * Utilidades puras para instructores.
 * Funciones de ordenamiento y validación que no dependen de base de datos ni middlewares.
 */

/**
 * Ordena una lista de instructores alfabéticamente por nombre_completo.
 * Usa comparación locale-aware (español).
 * @param {Array<{nombre_completo: string}>} instructores - Lista de instructores
 * @returns {Array<{nombre_completo: string}>} Lista ordenada alfabéticamente
 */
function ordenarInstructoresAlfabeticamente(instructores) {
    return [...instructores].sort((a, b) =>
        a.nombre_completo.localeCompare(b.nombre_completo, 'es', { sensitivity: 'base' })
    );
}

/**
 * Valida los datos de entrada para crear/editar un instructor.
 * Retorna un objeto con el resultado de la validación.
 *
 * Reglas:
 * - nombre_completo: obligatorio, 1-120 caracteres
 * - telefono: obligatorio, exactamente 10 dígitos numéricos
 * - email: obligatorio, formato válido (usuario@dominio), máximo 150 caracteres
 *
 * @param {Object} datos - Datos del instructor a validar
 * @returns {{ valido: boolean, errores: Array<{ campo: string, mensaje: string }> }}
 */
function validarDatosInstructor(datos) {
    const errores = [];

    // Validar nombre_completo
    if (datos.nombre_completo === undefined || datos.nombre_completo === null || datos.nombre_completo === '') {
        errores.push({ campo: 'nombre_completo', mensaje: 'El nombre completo es obligatorio' });
    } else if (typeof datos.nombre_completo !== 'string') {
        errores.push({ campo: 'nombre_completo', mensaje: 'El nombre completo debe ser texto' });
    } else {
        const nombre = datos.nombre_completo.trim();
        if (nombre.length < 1 || nombre.length > 120) {
            errores.push({ campo: 'nombre_completo', mensaje: 'El nombre completo debe tener entre 1 y 120 caracteres' });
        }
    }

    // Validar telefono
    if (datos.telefono === undefined || datos.telefono === null || datos.telefono === '') {
        errores.push({ campo: 'telefono', mensaje: 'El teléfono es obligatorio' });
    } else if (typeof datos.telefono !== 'string') {
        errores.push({ campo: 'telefono', mensaje: 'El teléfono debe ser texto' });
    } else if (!/^\d{10}$/.test(datos.telefono)) {
        errores.push({ campo: 'telefono', mensaje: 'El teléfono debe tener exactamente 10 dígitos numéricos' });
    }

    // Validar email
    if (datos.email === undefined || datos.email === null || datos.email === '') {
        errores.push({ campo: 'email', mensaje: 'El correo electrónico es obligatorio' });
    } else if (typeof datos.email !== 'string') {
        errores.push({ campo: 'email', mensaje: 'El correo electrónico debe ser texto' });
    } else {
        if (datos.email.length > 150) {
            errores.push({ campo: 'email', mensaje: 'El correo electrónico no debe exceder 150 caracteres' });
        } else {
            // Validar formato email: usuario@dominio (con al menos un punto en dominio)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(datos.email)) {
                errores.push({ campo: 'email', mensaje: 'El formato del correo electrónico no es válido' });
            }
        }
    }

    return {
        valido: errores.length === 0,
        errores
    };
}

module.exports = {
    ordenarInstructoresAlfabeticamente,
    validarDatosInstructor
};
