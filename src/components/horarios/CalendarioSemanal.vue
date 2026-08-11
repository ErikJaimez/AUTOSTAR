<script setup>
import SlotHorario from '@/components/horarios/SlotHorario.vue';
import { computed } from 'vue';

const props = defineProps({
    slotsPorSemana: {
        type: Object,
        default: () => ({})
    },
    semanaActual: {
        type: String,
        default: ''
    },
    cargando: {
        type: Boolean,
        default: false
    },
    modoAdmin: {
        type: Boolean,
        default: false
    },
    limitarNavegacion: {
        type: Boolean,
        default: false
    },
    semanaMaxima: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['cambiar-semana', 'editar-slot', 'eliminar-slot', 'seleccionar-slot']);

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * Obtiene las fechas de lunes a domingo para la semana actual
 */
const diasDeLaSemana = computed(() => {
    if (!props.semanaActual) return [];

    const lunes = new Date(props.semanaActual + 'T00:00:00');
    const dias = [];

    for (let i = 0; i < 7; i++) {
        const dia = new Date(lunes);
        dia.setDate(lunes.getDate() + i);
        dias.push({
            nombre: DIAS_SEMANA[i],
            fecha: dia.toISOString().split('T')[0],
            esHoy: esMismoDia(dia, new Date())
        });
    }

    return dias;
});

/**
 * Etiqueta de la semana actual
 */
const etiquetaSemana = computed(() => {
    if (!props.semanaActual || diasDeLaSemana.value.length === 0) return '';
    const inicio = formatearFechaCorta(diasDeLaSemana.value[0].fecha);
    const fin = formatearFechaCorta(diasDeLaSemana.value[6].fecha);
    return `${inicio} — ${fin}`;
});

/**
 * Determina si se puede navegar a la semana anterior
 */
const puedeIrAtras = computed(() => {
    if (!props.limitarNavegacion) return true;
    const hoy = new Date();
    const lunesActual = obtenerLunesDeSemana(hoy);
    const semanaVista = new Date(props.semanaActual + 'T00:00:00');
    return semanaVista > lunesActual;
});

/**
 * Determina si se puede navegar a la semana siguiente
 */
const puedeIrAdelante = computed(() => {
    if (!props.limitarNavegacion) return true;
    if (!props.semanaMaxima) return true;
    const semanaVista = new Date(props.semanaActual + 'T00:00:00');
    const maxima = new Date(props.semanaMaxima + 'T00:00:00');
    return semanaVista < maxima;
});

function esMismoDia(fecha1, fecha2) {
    return fecha1.toISOString().split('T')[0] === fecha2.toISOString().split('T')[0];
}

function obtenerLunesDeSemana(fecha) {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatearFechaCorta(fechaStr) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function semanaAnterior() {
    if (!puedeIrAtras.value) return;
    const fecha = new Date(props.semanaActual + 'T00:00:00');
    fecha.setDate(fecha.getDate() - 7);
    emit('cambiar-semana', fecha.toISOString().split('T')[0]);
}

function semanaSiguiente() {
    if (!puedeIrAdelante.value) return;
    const fecha = new Date(props.semanaActual + 'T00:00:00');
    fecha.setDate(fecha.getDate() + 7);
    emit('cambiar-semana', fecha.toISOString().split('T')[0]);
}

function obtenerSlotsDia(fecha) {
    return props.slotsPorSemana[fecha] || [];
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- Navegación de semana -->
        <div class="flex items-center justify-between">
            <Button icon="pi pi-chevron-left" text rounded :disabled="!puedeIrAtras" @click="semanaAnterior" />
            <span class="font-semibold text-surface-900 dark:text-surface-0">{{ etiquetaSemana }}</span>
            <Button icon="pi pi-chevron-right" text rounded :disabled="!puedeIrAdelante" @click="semanaSiguiente" />
        </div>

        <!-- Estado de carga -->
        <div v-if="cargando" class="grid grid-cols-1 md:grid-cols-7 gap-2">
            <div v-for="i in 7" :key="i" class="flex flex-col gap-2">
                <Skeleton height="24px" class="mb-2" />
                <Skeleton height="60px" />
                <Skeleton height="60px" />
            </div>
        </div>

        <!-- Calendario semanal -->
        <div v-else class="grid grid-cols-1 md:grid-cols-7 gap-2">
            <div v-for="dia in diasDeLaSemana" :key="dia.fecha" class="flex flex-col gap-2">
                <!-- Encabezado del día -->
                <div class="text-center p-2 rounded-lg text-sm font-medium" :class="dia.esHoy ? 'bg-primary text-primary-contrast' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200'">
                    <span class="block">{{ dia.nombre }}</span>
                    <span class="text-xs">{{ formatearFechaCorta(dia.fecha) }}</span>
                </div>

                <!-- Slots del día -->
                <div class="flex flex-col gap-2 min-h-20">
                    <SlotHorario
                        v-for="slotItem in obtenerSlotsDia(dia.fecha)"
                        :key="slotItem.id"
                        :horario="slotItem"
                        :modo-admin="modoAdmin"
                        @editar="emit('editar-slot', $event)"
                        @eliminar="emit('eliminar-slot', $event)"
                        @seleccionar="emit('seleccionar-slot', $event)"
                    />
                    <p v-if="obtenerSlotsDia(dia.fecha).length === 0" class="text-xs text-surface-400 text-center py-4">—</p>
                </div>
            </div>
        </div>
    </div>
</template>
