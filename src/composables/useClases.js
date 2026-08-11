import claseService from '@/services/claseService';
import { computed, reactive, ref } from 'vue';

// Estado compartido a nivel de módulo (singleton)
const estado = reactive({
    clases: [],
    cancelaciones: [],
    paginacionCancelaciones: {
        pagina: 1,
        total: 0,
        porPagina: 50
    }
});

const cargando = ref(false);
const error = ref(null);

export function useClases() {
    const clases = computed(() => estado.clases);
    const cancelaciones = computed(() => estado.cancelaciones);
    const paginacionCancelaciones = computed(() => estado.paginacionCancelaciones);

    /**
     * Cargar clases con filtros (admin)
     * @param {Object} filtros - Filtros a aplicar
     */
    async function cargarClases(filtros = {}) {
        cargando.value = true;
        error.value = null;

        try {
            estado.clases = await claseService.listar(filtros);
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudieron cargar las clases';
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Marcar una clase como completada
     * @param {string} id - ID de la clase
     */
    async function completarClase(id) {
        cargando.value = true;
        error.value = null;

        try {
            const resultado = await claseService.completar(id);
            const index = estado.clases.findIndex((c) => c.id === id);
            if (index !== -1) {
                estado.clases[index] = { ...estado.clases[index], estado: 'completada', ...resultado };
            }
            return resultado;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo completar la clase';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Cancelar una clase con motivo
     * @param {string} id - ID de la clase
     * @param {string} motivo - Motivo de cancelación (10-500 caracteres)
     */
    async function cancelarClase(id, motivo) {
        cargando.value = true;
        error.value = null;

        try {
            const resultado = await claseService.cancelar(id, motivo);
            const index = estado.clases.findIndex((c) => c.id === id);
            if (index !== -1) {
                estado.clases[index] = { ...estado.clases[index], estado: 'cancelada', ...resultado };
            }
            return resultado;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo cancelar la clase';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Reprogramar una clase cancelada
     * @param {string} id - ID de la clase cancelada
     * @param {Object} datos - Datos de reprogramación
     */
    async function reprogramarClase(id, datos) {
        cargando.value = true;
        error.value = null;

        try {
            const resultado = await claseService.reprogramar(id, datos);
            // Agregar la nueva clase a la lista
            if (resultado) {
                estado.clases.push(resultado);
            }
            return resultado;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo reprogramar la clase';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Cargar historial de cancelaciones con filtros
     * @param {Object} filtros - Filtros a aplicar
     * @param {number} pagina - Página a cargar
     */
    async function cargarCancelaciones(filtros = {}, pagina = 1) {
        cargando.value = true;
        error.value = null;

        try {
            const resultado = await claseService.listarCancelaciones({ ...filtros, page: pagina });
            estado.cancelaciones = resultado.data || resultado;
            estado.paginacionCancelaciones = {
                pagina: resultado.page || pagina,
                total: resultado.total || 0,
                porPagina: resultado.per_page || 50
            };
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudieron cargar las cancelaciones';
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Verifica si una clase puede ser cancelada
     * @param {string} estadoClase - Estado actual de la clase
     * @returns {boolean}
     */
    function esCancelable(estadoClase) {
        return estadoClase === 'programada';
    }

    /**
     * Verifica si una clase puede ser completada
     * @param {string} estadoClase - Estado actual de la clase
     * @returns {boolean}
     */
    function esCompletable(estadoClase) {
        return estadoClase === 'programada';
    }

    /**
     * Verifica si una clase puede ser reprogramada (debe estar cancelada)
     * @param {string} estadoClase - Estado actual de la clase
     * @returns {boolean}
     */
    function esReprogramable(estadoClase) {
        return estadoClase === 'cancelada';
    }

    return {
        clases,
        cancelaciones,
        paginacionCancelaciones,
        cargando,
        error,
        cargarClases,
        completarClase,
        cancelarClase,
        reprogramarClase,
        cargarCancelaciones,
        esCancelable,
        esCompletable,
        esReprogramable
    };
}
