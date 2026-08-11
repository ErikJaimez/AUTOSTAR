/**
 * Utilidades puras para el módulo de cursos.
 * Funciones de filtrado, agrupación y validación sin dependencias externas.
 */

/**
 * Filtra una lista de cursos retornando únicamente los que tienen estado activo.
 * @param {Array<Object>} cursos - Lista de cursos con campo `activo`
 * @returns {Array<Object>} Cursos con activo === true
 */
function filtrarCursosActivos(cursos) {
    if (!Array.isArray(cursos)) return [];
    return cursos.filter((curso) => curso.activo === true);
}

/**
 * Agrupa una lista de cursos por su categoría de licencia.
 * @param {Array<Object>} cursos - Lista de cursos con campo `categoria_licencia`
 * @returns {Object<string, Array<Object>>} Objeto donde cada llave es una categoría y el valor es un array de cursos
 */
function agruparPorCategoria(cursos) {
    if (!Array.isArray(cursos)) return {};
    return cursos.reduce((grupos, curso) => {
        const categoria = curso.categoria_licencia || '';
        if (!Object.hasOwn(grupos, categoria)) {
            grupos[categoria] = [];
        }
        grupos[categoria].push(curso);
        return grupos;
    }, Object.create(null));
}

/**
 * Valida los datos de entrada para crear/editar un curso.
 * Retorna un objeto con `valido` (boolean) y `errores` (array de strings por campo inválido).
 *
 * Reglas:
 * - nombre: obligatorio, string, 1-100 caracteres
 * - descripcion: obligatorio, string, 1-2000 caracteres
 * - duracion_horas: obligatorio, entero entre 1 y 200
 * - precio: obligatorio, número entre 0.01 y 99999.99
 * - categoria_licencia: obligatorio, string no vacío
 * - activo: obligatorio, boolean
 *
 * @param {Object} datos - Datos del curso a validar
 * @returns {{ valido: boolean, errores: Array<{campo: string, mensaje: string}> }}
 */
function validarDatosCurso(datos) {
    const errores = [];

    if (datos === null || datos === undefined || typeof datos !== 'object') {
        return { valido: false, errores: [{ campo: 'datos', mensaje: 'Los datos son requeridos' }] };
    }

    // nombre: obligatorio, string, 1-100 caracteres
    if (datos.nombre === undefined || datos.nombre === null) {
        errores.push({ campo: 'nombre', mensaje: 'El nombre es obligatorio' });
    } else if (typeof datos.nombre !== 'string') {
        errores.push({ campo: 'nombre', mensaje: 'El nombre debe ser texto' });
    } else if (datos.nombre.length < 1 || datos.nombre.length > 100) {
        errores.push({ campo: 'nombre', mensaje: 'El nombre debe tener entre 1 y 100 caracteres' });
    }

    // descripcion: obligatorio, string, 1-2000 caracteres
    if (datos.descripcion === undefined || datos.descripcion === null) {
        errores.push({ campo: 'descripcion', mensaje: 'La descripción es obligatoria' });
    } else if (typeof datos.descripcion !== 'string') {
        errores.push({ campo: 'descripcion', mensaje: 'La descripción debe ser texto' });
    } else if (datos.descripcion.length < 1 || datos.descripcion.length > 2000) {
        errores.push({ campo: 'descripcion', mensaje: 'La descripción debe tener entre 1 y 2000 caracteres' });
    }

    // duracion_horas: obligatorio, entero entre 1 y 200
    if (datos.duracion_horas === undefined || datos.duracion_horas === null) {
        errores.push({ campo: 'duracion_horas', mensaje: 'La duración en horas es obligatoria' });
    } else if (!Number.isInteger(datos.duracion_horas)) {
        errores.push({ campo: 'duracion_horas', mensaje: 'La duración debe ser un número entero' });
    } else if (datos.duracion_horas < 1 || datos.duracion_horas > 200) {
        errores.push({ campo: 'duracion_horas', mensaje: 'La duración debe estar entre 1 y 200 horas' });
    }

    // precio: obligatorio, número entre 0.01 y 99999.99
    if (datos.precio === undefined || datos.precio === null) {
        errores.push({ campo: 'precio', mensaje: 'El precio es obligatorio' });
    } else if (typeof datos.precio !== 'number' || isNaN(datos.precio)) {
        errores.push({ campo: 'precio', mensaje: 'El precio debe ser un número' });
    } else if (datos.precio < 0.01 || datos.precio > 99999.99) {
        errores.push({ campo: 'precio', mensaje: 'El precio debe estar entre $0.01 y $99,999.99' });
    }

    // categoria_licencia: obligatorio, string no vacío
    if (datos.categoria_licencia === undefined || datos.categoria_licencia === null) {
        errores.push({ campo: 'categoria_licencia', mensaje: 'La categoría de licencia es obligatoria' });
    } else if (typeof datos.categoria_licencia !== 'string') {
        errores.push({ campo: 'categoria_licencia', mensaje: 'La categoría de licencia debe ser texto' });
    } else if (datos.categoria_licencia.length < 1) {
        errores.push({ campo: 'categoria_licencia', mensaje: 'La categoría de licencia no puede estar vacía' });
    }

    // activo: obligatorio, boolean
    if (datos.activo === undefined || datos.activo === null) {
        errores.push({ campo: 'activo', mensaje: 'El estado activo es obligatorio' });
    } else if (typeof datos.activo !== 'boolean') {
        errores.push({ campo: 'activo', mensaje: 'El campo activo debe ser un valor booleano' });
    }

    return {
        valido: errores.length === 0,
        errores
    };
}

module.exports = {
    filtrarCursosActivos,
    agruparPorCategoria,
    validarDatosCurso
};
