import cursoService from '@/services/cursoService';
import { computed, reactive, ref } from 'vue';

// Estado compartido a nivel de módulo (singleton)
const estado = reactive({
    cursos: [],
    cursoActual: null
});

const cargando = ref(false);
const error = ref(null);

export function useCursos() {
    const cursos = computed(() => estado.cursos);
    const cursoActual = computed(() => estado.cursoActual);

    /**
     * Cargar cursos activos desde el backend
     */
    async function cargarCursos() {
        cargando.value = true;
        error.value = null;

        try {
            estado.cursos = await cursoService.listarActivos();
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudieron cargar los cursos';
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Cargar detalle de un curso específico
     * @param {string} id
     */
    async function cargarCurso(id) {
        cargando.value = true;
        error.value = null;

        try {
            estado.cursoActual = await cursoService.obtenerDetalle(id);
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo cargar el curso';
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Crear un nuevo curso
     * @param {Object} datos
     */
    async function crearCurso(datos) {
        cargando.value = true;
        error.value = null;

        try {
            const nuevoCurso = await cursoService.crear(datos);
            estado.cursos.push(nuevoCurso);
            return nuevoCurso;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo crear el curso';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Actualizar un curso existente
     * @param {string} id
     * @param {Object} datos
     */
    async function actualizarCurso(id, datos) {
        cargando.value = true;
        error.value = null;

        try {
            const cursoActualizado = await cursoService.actualizar(id, datos);
            const index = estado.cursos.findIndex((c) => c.id === id);
            if (index !== -1) {
                estado.cursos[index] = cursoActualizado;
            }
            if (estado.cursoActual?.id === id) {
                estado.cursoActual = cursoActualizado;
            }
            return cursoActualizado;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo actualizar el curso';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Eliminar un curso
     * @param {string} id
     */
    async function eliminarCurso(id) {
        cargando.value = true;
        error.value = null;

        try {
            await cursoService.eliminar(id);
            estado.cursos = estado.cursos.filter((c) => c.id !== id);
            if (estado.cursoActual?.id === id) {
                estado.cursoActual = null;
            }
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo eliminar el curso';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    return {
        cursos,
        cursoActual,
        cargando,
        error,
        cargarCursos,
        cargarCurso,
        crearCurso,
        actualizarCurso,
        eliminarCurso
    };
}
