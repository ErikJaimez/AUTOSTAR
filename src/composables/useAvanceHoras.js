import claseService from '@/services/claseService';
import { computed, reactive, ref } from 'vue';

// Estado compartido a nivel de módulo (singleton)
const estado = reactive({
    avance: null,
    cliente: null
});

const cargando = ref(false);
const error = ref(null);

export function useAvanceHoras() {
    const avance = computed(() => estado.avance);
    const cliente = computed(() => estado.cliente);

    /**
     * Horas totales contratadas del curso
     */
    const horasTotales = computed(() => {
        return estado.avance?.horas_totales ?? 0;
    });

    /**
     * Horas completadas (suma de duraciones de clases completadas)
     */
    const horasCompletadas = computed(() => {
        return estado.avance?.horas_completadas ?? 0;
    });

    /**
     * Horas pendientes (total - completadas)
     */
    const horasPendientes = computed(() => {
        return estado.avance?.horas_pendientes ?? horasTotales.value - horasCompletadas.value;
    });

    /**
     * Porcentaje de avance como número entero (0-100)
     */
    const porcentaje = computed(() => {
        if (!estado.avance || horasTotales.value === 0) return 0;
        return estado.avance.porcentaje ?? Math.round((horasCompletadas.value / horasTotales.value) * 100);
    });

    /**
     * Indica si el curso está finalizado (100% completado)
     */
    const cursoFinalizado = computed(() => {
        return estado.avance?.curso_finalizado ?? porcentaje.value >= 100;
    });

    /**
     * Lista de clases del cliente
     */
    const clases = computed(() => {
        return estado.avance?.clases ?? [];
    });

    /**
     * Información del curso asociado
     */
    const curso = computed(() => {
        return estado.avance?.curso ?? null;
    });

    /**
     * Cargar avance de horas de un cliente desde el backend
     * @param {string} clienteId - ID del cliente
     */
    async function cargarAvance(clienteId) {
        cargando.value = true;
        error.value = null;

        try {
            const resultado = await claseService.obtenerAvance(clienteId);
            estado.avance = resultado;
            estado.cliente = resultado.cliente || null;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo cargar el avance de horas';
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Limpiar el estado del avance
     */
    function limpiarAvance() {
        estado.avance = null;
        estado.cliente = null;
        error.value = null;
    }

    return {
        avance,
        cliente,
        horasTotales,
        horasCompletadas,
        horasPendientes,
        porcentaje,
        cursoFinalizado,
        clases,
        curso,
        cargando,
        error,
        cargarAvance,
        limpiarAvance
    };
}
