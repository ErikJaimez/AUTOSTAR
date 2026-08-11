<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
    instructor: {
        type: Object,
        required: true
    },
    agenda: {
        type: Object,
        default: null
    },
    cargando: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['cambiar-semana']);

const fechaActual = ref(obtenerInicioSemana(new Date()));

function obtenerInicioSemana(fecha) {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1); // Lunes como inicio
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
}

function formatearHora(hora) {
    if (!hora) return '';
    // Formato HH:MM o HH:MM:SS → HH:MM
    return hora.substring(0, 5);
}

function formatearFechaISO(fecha) {
    const d = new Date(fecha);
    return d.toISOString().split('T')[0];
}

const diasSemana = computed(() => {
    const dias = [];
    const inicio = new Date(fechaActual.value);
    for (let i = 0; i < 7; i++) {
        const dia = new Date(inicio);
        dia.setDate(inicio.getDate() + i);
        dias.push(dia);
    }
    return dias;
});

const clasesPorDia = computed(() => {
    if (!props.agenda?.clases) return {};

    const agrupadas = {};
    for (const clase of props.agenda.clases) {
        const fechaClase = clase.fecha;
        if (!agrupadas[fechaClase]) {
            agrupadas[fechaClase] = [];
        }
        agrupadas[fechaClase].push(clase);
    }

    // Ordenar las clases de cada día por hora de inicio
    for (const fecha of Object.keys(agrupadas)) {
        agrupadas[fecha].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    }

    return agrupadas;
});

const rangoSemana = computed(() => {
    const inicio = new Date(fechaActual.value);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    return `${inicio.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${fin.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`;
});

function semanaAnterior() {
    const nueva = new Date(fechaActual.value);
    nueva.setDate(nueva.getDate() - 7);
    fechaActual.value = nueva;
    emit('cambiar-semana', formatearFechaISO(nueva));
}

function semanaSiguiente() {
    const nueva = new Date(fechaActual.value);
    nueva.setDate(nueva.getDate() + 7);
    fechaActual.value = nueva;
    emit('cambiar-semana', formatearFechaISO(nueva));
}

function obtenerSeveridadEstado(estado) {
    const mapa = {
        programada: 'info',
        completada: 'success',
        cancelada: 'danger'
    };
    return mapa[estado] || 'secondary';
}

// Emitir la semana inicial al montar
watch(
    () => props.instructor,
    () => {
        fechaActual.value = obtenerInicioSemana(new Date());
        emit('cambiar-semana', formatearFechaISO(fechaActual.value));
    },
    { immediate: true }
);
</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- Header con nombre y navegación -->
        <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold m-0">Agenda de {{ instructor.nombre_completo }}</h3>
        </div>

        <!-- Navegación de semana -->
        <div class="flex items-center justify-between bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
            <Button icon="pi pi-chevron-left" severity="secondary" text rounded aria-label="Semana anterior" @click="semanaAnterior" />
            <span class="font-medium text-surface-700 dark:text-surface-200">{{ rangoSemana }}</span>
            <Button icon="pi pi-chevron-right" severity="secondary" text rounded aria-label="Semana siguiente" @click="semanaSiguiente" />
        </div>

        <!-- Loading -->
        <div v-if="cargando" class="flex justify-center py-8">
            <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
        </div>

        <!-- Contenido de la agenda -->
        <div v-else class="flex flex-col gap-3">
            <div v-for="dia in diasSemana" :key="dia.toISOString()" class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                <!-- Encabezado del día -->
                <div class="bg-surface-100 dark:bg-surface-700 px-4 py-2">
                    <span class="font-medium capitalize">{{ formatearFecha(dia) }}</span>
                </div>

                <!-- Clases del día -->
                <div class="p-3">
                    <div v-if="clasesPorDia[formatearFechaISO(dia)]?.length" class="flex flex-col gap-2">
                        <div v-for="clase in clasesPorDia[formatearFechaISO(dia)]" :key="clase.id" class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-md">
                            <div class="flex flex-col gap-1">
                                <span class="font-medium">{{ clase.curso_nombre || 'Clase' }}</span>
                                <span class="text-sm text-surface-500"> {{ formatearHora(clase.hora_inicio) }} - {{ formatearHora(clase.hora_fin) }} </span>
                            </div>
                            <Tag :value="clase.estado" :severity="obtenerSeveridadEstado(clase.estado)" />
                        </div>
                    </div>
                    <div v-else class="text-center text-surface-400 py-3 text-sm">Sin clases programadas</div>
                </div>
            </div>
        </div>
    </div>
</template>
