import horarioService from '@/services/horarioService';
import { computed, reactive, ref } from 'vue';

// Estado compartido a nivel de módulo (singleton)
const estado = reactive({
    slots: [],
    semanaActual: null
});

const cargando = ref(false);
const error = ref(null);

/**
 * Obtiene el lunes de la semana que contiene la fecha dada
 * @param {Date} fecha
 * @returns {Date}
 */
function obtenerLunesDeSemana(fecha) {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Formatea una fecha como YYYY-MM-DD
 * @param {Date} fecha
 * @returns {string}
 */
function formatearFecha(fecha) {
    return fecha.toISOString().split('T')[0];
}

export function useHorarios() {
    const slots = computed(() => estado.slots);

    /**
     * Agrupa los slots por día de la semana (lun-dom)
     */
    const slotsPorSemana = computed(() => {
        const grupos = {};
        for (const slot of estado.slots) {
            const fecha = slot.fecha;
            if (!grupos[fecha]) {
                grupos[fecha] = [];
            }
            grupos[fecha].push(slot);
        }
        // Ordenar dentro de cada día por hora_inicio
        for (const fecha of Object.keys(grupos)) {
            grupos[fecha].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
        }
        return grupos;
    });

    /**
     * Cargar slots de horario
     * @param {string} [cursoId] - Si se pasa, carga los públicos por curso; si no, carga todos (admin)
     * @param {string} [semana] - Fecha de inicio de semana en formato YYYY-MM-DD
     */
    async function cargarSlots(cursoId, semana) {
        cargando.value = true;
        error.value = null;

        try {
            const params = {};
            if (semana) params.semana = semana;

            if (cursoId) {
                estado.slots = await horarioService.listarPorCurso(cursoId, params);
            } else {
                estado.slots = await horarioService.listar(params);
            }
            estado.semanaActual = semana || formatearFecha(obtenerLunesDeSemana(new Date()));
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudieron cargar los horarios';
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Crear un nuevo slot de horario
     * @param {Object} datos
     */
    async function crearSlot(datos) {
        cargando.value = true;
        error.value = null;

        try {
            const nuevoSlot = await horarioService.crear(datos);
            estado.slots.push(nuevoSlot);
            return nuevoSlot;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo crear el horario';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Actualizar un slot existente
     * @param {string} id
     * @param {Object} datos
     */
    async function actualizarSlot(id, datos) {
        cargando.value = true;
        error.value = null;

        try {
            const slotActualizado = await horarioService.actualizar(id, datos);
            const index = estado.slots.findIndex((s) => s.id === id);
            if (index !== -1) {
                estado.slots[index] = slotActualizado;
            }
            return slotActualizado;
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo actualizar el horario';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Eliminar un slot de horario
     * @param {string} id
     */
    async function eliminarSlot(id) {
        cargando.value = true;
        error.value = null;

        try {
            await horarioService.eliminar(id);
            estado.slots = estado.slots.filter((s) => s.id !== id);
        } catch (err) {
            const respuesta = err.response?.data;
            error.value = respuesta?.mensaje || 'No se pudo eliminar el horario';
            throw err;
        } finally {
            cargando.value = false;
        }
    }

    /**
     * Verificar disponibilidad de un slot
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async function verificarDisponibilidad(id) {
        const slot = estado.slots.find((s) => s.id === id);
        if (!slot) return false;
        return slot.disponible !== false && (slot.reservaciones_count || 0) < (slot.capacidad_maxima || 1);
    }

    return {
        slots,
        slotsPorSemana,
        cargando,
        error,
        cargarSlots,
        crearSlot,
        actualizarSlot,
        eliminarSlot,
        verificarDisponibilidad
    };
}
