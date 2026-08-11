<script setup>
import { formatearFechaCorta, formatearHora } from '@/utils/formatters';
import { computed } from 'vue';

const props = defineProps({
    clase: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['completar', 'cancelar', 'reprogramar']);

const estadoLabel = computed(() => {
    const labels = {
        programada: 'Programada',
        completada: 'Completada',
        cancelada: 'Cancelada'
    };
    return labels[props.clase.estado] || props.clase.estado;
});

const estadoSeverity = computed(() => {
    const severities = {
        programada: 'info',
        completada: 'success',
        cancelada: 'danger'
    };
    return severities[props.clase.estado] || 'secondary';
});

const estadoIcon = computed(() => {
    const icons = {
        programada: 'pi pi-clock',
        completada: 'pi pi-check-circle',
        cancelada: 'pi pi-times-circle'
    };
    return icons[props.clase.estado] || 'pi pi-circle';
});

const esProgramada = computed(() => props.clase.estado === 'programada');
const esCancelada = computed(() => props.clase.estado === 'cancelada');

const duracion = computed(() => {
    if (!props.clase.hora_inicio || !props.clase.hora_fin) return '';
    const [hI, mI] = props.clase.hora_inicio.split(':').map(Number);
    const [hF, mF] = props.clase.hora_fin.split(':').map(Number);
    const totalMin = hF * 60 + mF - (hI * 60 + mI);
    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;
    if (horas > 0 && minutos > 0) return `${horas}h ${minutos}min`;
    if (horas > 0) return `${horas}h`;
    return `${minutos}min`;
});
</script>

<template>
    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
                <i :class="estadoIcon" class="text-lg"></i>
                <Tag :value="estadoLabel" :severity="estadoSeverity" />
            </div>
            <span class="text-sm text-surface-500 dark:text-surface-400">{{ duracion }}</span>
        </div>

        <div class="space-y-2 mb-4">
            <div class="flex items-center gap-2">
                <i class="pi pi-calendar text-surface-400"></i>
                <span class="text-surface-700 dark:text-surface-200">{{ formatearFechaCorta(clase.fecha) }}</span>
            </div>
            <div class="flex items-center gap-2">
                <i class="pi pi-clock text-surface-400"></i>
                <span class="text-surface-700 dark:text-surface-200">{{ formatearHora(clase.hora_inicio) }} - {{ formatearHora(clase.hora_fin) }}</span>
            </div>
            <div v-if="clase.instructor_nombre" class="flex items-center gap-2">
                <i class="pi pi-user text-surface-400"></i>
                <span class="text-surface-700 dark:text-surface-200">{{ clase.instructor_nombre }}</span>
            </div>
            <div v-if="clase.curso_nombre" class="flex items-center gap-2">
                <i class="pi pi-book text-surface-400"></i>
                <span class="text-surface-700 dark:text-surface-200">{{ clase.curso_nombre }}</span>
            </div>
            <div v-if="clase.cliente_nombre" class="flex items-center gap-2">
                <i class="pi pi-id-card text-surface-400"></i>
                <span class="text-surface-700 dark:text-surface-200">{{ clase.cliente_nombre }}</span>
            </div>
        </div>

        <div class="flex gap-2 flex-wrap">
            <Button v-if="esProgramada" label="Completar" icon="pi pi-check" size="small" severity="success" @click="emit('completar', clase)" />
            <Button v-if="esProgramada" label="Cancelar" icon="pi pi-times" size="small" severity="danger" outlined @click="emit('cancelar', clase)" />
            <Button v-if="esCancelada" label="Reprogramar" icon="pi pi-replay" size="small" severity="warn" @click="emit('reprogramar', clase)" />
        </div>
    </div>
</template>
