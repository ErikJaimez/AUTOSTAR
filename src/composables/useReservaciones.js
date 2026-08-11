import reservacionService from '@/services/reservacionService';
import { computed, reactive, ref } from 'vue';

// Estado compartido a nivel de módulo (singleton)
const estado = reactive({
    reservaciones: [],
    paginacion: {
        pagina: 1,
        total: 0,
        porPagina: 20
    }
});

const cargando = ref(false);
const error = ref(null);

/**
 * Transiciones de estado válidas para reservaciones
 */
const TRANSICIONES_VALIDAS = {
    pendiente: ['confirmada', 'cancelada'],
    confirmada: ['completada', 'cancelada'],
    completada: [],
    cancelada: []
};

export function useReservaciones() {
    const reservaciones = computed(() => estado.reservaciones);
    const paginacion = computed(() => estado.paginacion);

    /**
     * Verifica si una transición de estado es válida
     * @param {string} estadoActual
     * @param {string} nuevoEstado
     * @returns {boolean}
     */
    function esTransicionValida(estadoActual, nuevoEstado) {
        return TRANSICIONES_VALIDAS[estadoActual]?.includes(nuevoEstado) || false;
    }

    /**
     * Obtiene los estados disponibles desde un estado dado
     * @param {string} estadoActual
     * @returns {string[]}
     */
    function obtenerTransicionesDisponibles(estadoActual) {
        return TRANSICIONES_VALIDAS[estadoActual] || [];
    }

    /**
     * Cargar reservaciones con filtros y paginación (admin)
     * @param {Object} filtros - Filtros a aplicar
     * @param {number} pagina - Página a cargar
     */
    async function cargarReservaciones(filtros = {}, pagina = 1) {
        cargando.value = true;
        error.value = null;

        try {
            const resultado = await reservacionService.listar({ ...filtros, page: pagina });
            estado.reservaciones = resultado.data || resultado;
            estado.paginacion = {
                pagina: resultado.page || pagina,
                total: resultado.total || 0,
                porPagina: resultado.per_page || 20
            };
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudieron cargar las reservaciones';
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Crear una reservación (público)
     * @param {Object} datos - Datos del formulario
     * @returns {Promise<Object>} - { folio }
     */
    async function crearReservacion(datos) {
        cargando.value = true;
        error.value = null;

        try {
            const resultado = await reservacionService.crear(datos);
            return resultado;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo crear la reservación';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Cambiar estado de una reservación (admin)
     * @param {string} id - ID de la reservación
     * @param {string} nuevoEstado - Nuevo estado
     */
    async function cambiarEstado(id, nuevoEstado) {
        cargando.value = true;
        error.value = null;

        try {
            const resultado = await reservacionService.cambiarEstado(id, nuevoEstado);
            // Actualizar en la lista local
            const index = estado.reservaciones.findIndex((r) => r.id === id);
            if (index !== -1) {
                estado.reservaciones[index] = { ...estado.reservaciones[index], estado: nuevoEstado, ...resultado };
            }
            return resultado;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo cambiar el estado';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Cancelar una reservación (admin) — alias con validación adicional
     * @param {string} id - ID de la reservación
     */
    async function cancelarReservacion(id) {
        return cambiarEstado(id, 'cancelada');
    }

    return {
        reservaciones,
        paginacion,
        cargando,
        error,
        cargarReservaciones,
        crearReservacion,
        cambiarEstado,
        cancelarReservacion,
        esTransicionValida,
        obtenerTransicionesDisponibles
    };
}
