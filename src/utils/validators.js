/**
 * Validaciones de formulario para la plataforma AUTOSTAR
 * Cada validador retorna un objeto { valido, mensaje } para uso en formularios
 */

/**
 * Valida el nombre completo del cliente
 * Regla: requerido, 1-120 caracteres
 * @param {string} nombre - Nombre a validar
 * @returns {{ valido: boolean, mensaje: string|null }}
 */
export function validarNombre(nombre) {
    if (!nombre || nombre.trim().length === 0) {
        return { valido: false, mensaje: 'El nombre completo es obligatorio' };
    }

    const nombreLimpio = nombre.trim();

    if (nombreLimpio.length > 120) {
        return { valido: false, mensaje: 'El nombre no debe exceder 120 caracteres' };
    }

    return { valido: true, mensaje: null };
}

/**
 * Valida la edad del cliente
 * Regla: requerido, entero entre 16 y 99
 * @param {number|string} edad - Edad a validar
 * @returns {{ valido: boolean, mensaje: string|null }}
 */
export function validarEdad(edad) {
    if (edad === null || edad === undefined || edad === '') {
        return { valido: false, mensaje: 'La edad es obligatoria' };
    }

    const edadNum = typeof edad === 'string' ? parseInt(edad, 10) : edad;

    if (isNaN(edadNum) || !Number.isInteger(edadNum)) {
        return { valido: false, mensaje: 'La edad debe ser un número entero' };
    }

    if (edadNum < 16 || edadNum > 99) {
        return { valido: false, mensaje: 'La edad debe estar entre 16 y 99 años' };
    }

    return { valido: true, mensaje: null };
}

/**
 * Valida el código postal
 * Regla: requerido, exactamente 5 dígitos numéricos
 * @param {string} codigoPostal - Código postal a validar
 * @returns {{ valido: boolean, mensaje: string|null }}
 */
export function validarCodigoPostal(codigoPostal) {
    if (!codigoPostal || codigoPostal.trim().length === 0) {
        return { valido: false, mensaje: 'El código postal es obligatorio' };
    }

    const cp = codigoPostal.trim();

    if (!/^\d{5}$/.test(cp)) {
        return { valido: false, mensaje: 'El código postal debe tener exactamente 5 dígitos numéricos' };
    }

    return { valido: true, mensaje: null };
}

/**
 * Valida el número de teléfono
 * Regla: requerido, exactamente 10 dígitos numéricos
 * @param {string} telefono - Teléfono a validar
 * @returns {{ valido: boolean, mensaje: string|null }}
 */
export function validarTelefono(telefono) {
    if (!telefono || telefono.trim().length === 0) {
        return { valido: false, mensaje: 'El teléfono es obligatorio' };
    }

    const tel = telefono.trim();

    if (!/^\d{10}$/.test(tel)) {
        return { valido: false, mensaje: 'El teléfono debe tener exactamente 10 dígitos numéricos' };
    }

    return { valido: true, mensaje: null };
}

/**
 * Valida el correo electrónico
 * Regla: requerido, formato válido usuario@dominio
 * @param {string} email - Correo electrónico a validar
 * @returns {{ valido: boolean, mensaje: string|null }}
 */
export function validarEmail(email) {
    if (!email || email.trim().length === 0) {
        return { valido: false, mensaje: 'El correo electrónico es obligatorio' };
    }

    const correo = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(correo)) {
        return { valido: false, mensaje: 'El correo electrónico debe tener un formato válido (usuario@dominio)' };
    }

    return { valido: true, mensaje: null };
}

/**
 * Valida todos los campos del formulario de reservación
 * @param {object} datos - Datos del formulario
 * @param {string} datos.nombre_completo - Nombre completo
 * @param {number|string} datos.edad - Edad
 * @param {string} datos.codigo_postal - Código postal
 * @param {string} datos.telefono - Teléfono
 * @param {string} datos.email - Correo electrónico
 * @returns {{ valido: boolean, errores: object }}
 */
export function validarFormularioReservacion(datos) {
    const errores = {};

    const resultNombre = validarNombre(datos.nombre_completo);
    if (!resultNombre.valido) errores.nombre_completo = resultNombre.mensaje;

    const resultEdad = validarEdad(datos.edad);
    if (!resultEdad.valido) errores.edad = resultEdad.mensaje;

    const resultCP = validarCodigoPostal(datos.codigo_postal);
    if (!resultCP.valido) errores.codigo_postal = resultCP.mensaje;

    const resultTel = validarTelefono(datos.telefono);
    if (!resultTel.valido) errores.telefono = resultTel.mensaje;

    const resultEmail = validarEmail(datos.email);
    if (!resultEmail.valido) errores.email = resultEmail.mensaje;

    return {
        valido: Object.keys(errores).length === 0,
        errores
    };
}
