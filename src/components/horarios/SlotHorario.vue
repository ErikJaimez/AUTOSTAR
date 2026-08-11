<script setup>
import { computed } from 'vue';

const props = defineProps({
    horario: {
        type: Object,
        required: true
    },
    modoAdmin: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['editar', 'eliminar', 'seleccionar']);

const estaDisponible = computed(() => {
    if (props.horario.disponible === false) return false;
    return (props.horario.reservaciones_count || 0) < (props.horario.capacidad_maxima || 1);
});

const horaFormateada = computed(() => {
    const inicio = props.horario.hora_inicio?.substring(0, 5) || '';
    const fin = props.horario.hora_fin?.substring(0, 5) || '';
    return `${inicio} - ${fin}`;
});

const ocupacion = computed(() => {
    return `${props.horario.reservaciones_count || 0}/${props.horario.capacidad_maxima || 0}`;
});
</script>

<template>
    <div
        class="border rounded-lg p-3 transition-colors cursor-pointer"
        :class="estaDisponible ? 'border-surface-200 dark:border-surface-700 hover:border-primary' : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 opacity-70'"
        @click="modoAdmin ? emit('editar', horario) : estaDisponible ? emit('seleccionar', horario) : null"
    >
        <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
                <!-- Nombre del curso (solo en admin) -->
                <p v-if="modoAdmin && horario.curso_nombre" class="text-sm font-semibold text-surface-900 dark:text-surface-0 truncate mb-1">
                    {{ horario.curso_nombre }}
                </p>

                <!-- Hora -->
                <p class="text-sm font-medium text-primary mb-1"><i class="pi pi-clock text-xs mr-1"></i>{{ horaFormateada }}</p>

                <!-- Instructor -->
                <p v-if="horario.instructor_nombre" class="text-xs text-surface-500 truncate"><i class="pi pi-user text-xs mr-1"></i>{{ horario.instructor_nombre }}</p>

                <!-- Ocupación (admin) -->
                <p v-if="modoAdmin" class="text-xs text-surface-500 mt-1"><i class="pi pi-users text-xs mr-1"></i>{{ ocupacion }}</p>
            </div>

            <div class="flex flex-col items-end gap-1">
                <!-- Badge de disponibilidad -->
                <Tag v-if="!estaDisponible" value="No disponible" severity="danger" class="text-xs" />
                <Tag v-else value="Disponible" severity="success" class="text-xs" />

                <!-- Botones admin -->
                <div v-if="modoAdmin" class="flex gap-1 mt-1">
                    <Button icon="pi pi-pencil" size="small" text rounded severity="info" @click.stop="emit('editar', horario)" />
                    <Button icon="pi pi-trash" size="small" text rounded severity="danger" @click.stop="emit('eliminar', horario)" />
                </div>
            </div>
        </div>
    </div>
</template>
