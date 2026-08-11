<script setup>
import { computed } from 'vue';

const props = defineProps({
    estado: {
        type: String,
        required: true,
        validator: (val) => ['pendiente', 'confirmada', 'completada', 'cancelada'].includes(val)
    }
});

const severityMap = {
    pendiente: 'warn',
    confirmada: 'info',
    completada: 'success',
    cancelada: 'danger'
};

const labelMap = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    completada: 'Completada',
    cancelada: 'Cancelada'
};

const severity = computed(() => severityMap[props.estado] || 'info');
const label = computed(() => labelMap[props.estado] || props.estado);
</script>

<template>
    <Tag :value="label" :severity="severity" />
</template>
