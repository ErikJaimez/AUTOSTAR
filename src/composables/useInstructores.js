import instructorService from '@/services/instructorService';
import { computed, reactive, ref } from 'vue';

// Estado compartido a nivel de módulo (singleton)
const estado = reactive({
    instructores: [], // Instructor[]
    agenda: null // { semana, clases: [] } | null
});

const cargando = ref(false);
const error = ref(null);

export function useInstructores() {
    const instructores = computed(() => estado.instructores);

    /**
     * Cargar la lista de instructores desde el backend
     */
    async function cargarInstructores() {
        cargando.value = true;
        error.value = null;

        try {
            const data = await instructorService.listar();
            estado.instructores = data;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'Error al cargar instructores';
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Crear un nuevo instructor
     * @param {{ nombre_completo: string, telefono: string, email: string, activo: boolean }} datos
     * @returns {Promise<object>}
     */
    async function crearInstructor(datos) {
        cargando.value = true;
        error.value = null;

        try {
            const nuevoInstructor = await instructorService.crear(datos);
            estado.instructores.push(nuevoInstructor);
            // Reordenar alfabéticamente tras agregar
            estado.instructores.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo, 'es'));
            return nuevoInstructor;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'Error al crear instructor';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Actualizar un instructor existente
     * @param {string} id - UUID del instructor
     * @param {{ nombre_completo?: string, telefono?: string, email?: string, activo?: boolean }} datos
     * @returns {Promise<object>}
     */
    async function actualizarInstructor(id, datos) {
        cargando.value = true;
        error.value = null;

        try {
            const actualizado = await instructorService.actualizar(id, datos);
            const index = estado.instructores.findIndex((i) => i.id === id);
            if (index !== -1) {
                estado.instructores[index] = actualizado;
            }
            // Reordenar alfabéticamente tras actualizar
            estado.instructores.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo, 'es'));
            return actualizado;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'Error al actualizar instructor';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Cargar la agenda semanal de un instructor
     * @param {string} id - UUID del instructor
     * @param {string} [fecha] - Fecha en formato YYYY-MM-DD
     * @returns {Promise<object>}
     */
    async function cargarAgenda(id, fecha) {
        cargando.value = true;
        error.value = null;

        try {
            const data = await instructorService.obtenerAgenda(id, fecha);
            estado.agenda = data;
            return data;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'Error al cargar agenda';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    return {
        instructores,
        agenda: computed(() => estado.agenda),
        cargando,
        error,
        cargarInstructores,
        crearInstructor,
        actualizarInstructor,
        cargarAgenda
    };
}
