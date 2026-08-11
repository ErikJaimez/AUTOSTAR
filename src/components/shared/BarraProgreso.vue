<script setup>
import { computed } from 'vue';

const props = defineProps({
    porcentaje: {
        type: Number,
        required: true,
        validator: (val) => val >= 0 && val <= 100
    },
    horasCompletadas: {
        type: Number,
        default: 0
    },
    horasTotales: {
        type: Number,
        default: 0
    },
    horasPendientes: {
        type: Number,
        default: 0
    },
    mostrarDetalle: {
        type: Boolean,
        default: true
    },
    height: {
        type: String,
        default: '1.5rem'
    }
});

const colorBarra = computed(() => {
    if (props.porcentaje >= 100) return 'bg-green-500';
    if (props.porcentaje >= 75) return 'bg-blue-500';
    if (props.porcentaje >= 50) return 'bg-yellow-500';
    if (props.porcentaje >= 25) return 'bg-orange-500';
    return 'bg-red-500';
});

const porcentajeTexto = computed(() => {
    return `${props.porcentaje}%`;
});
</script>

<template>
    <div class="w-full">
        <!-- Barra de progreso -->
        <div class="relative w-full bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden" :style="{ height }">
            <div class="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-center" :class="colorBarra" :style="{ width: porcentajeTexto }">
                <span v-if="porcentaje >= 15" class="text-xs font-bold text-white">{{ porcentajeTexto }}</span>
            </div>
            <span v-if="porcentaje < 15" class="absolute inset-0 flex items-center justify-center text-xs font-bold text-surface-600 dark:text-surface-300">{{ porcentajeTexto }}</span>
        </div>

        <!-- Detalle de horas -->
        <div v-if="mostrarDetalle" class="flex justify-between mt-2 text-sm text-surface-600 dark:text-surface-300">
            <span>
                <i class="pi pi-check-circle text-green-500 mr-1"></i>
                {{ horasCompletadas.toFixed(1) }}h completadas
            </span>
            <span>
                <i class="pi pi-clock text-orange-500 mr-1"></i>
                {{ horasPendientes.toFixed(1) }}h pendientes
            </span>
            <span>
                <i class="pi pi-chart-bar text-blue-500 mr-1"></i>
                {{ horasTotales.toFixed(1) }}h totales
            </span>
        </div>
    </div>
</template>
