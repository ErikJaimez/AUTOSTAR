<script setup>
import { useClases } from '@/composables/useClases';
import { useCursos } from '@/composables/useCursos';
import { useInstructores } from '@/composables/useInstructores';
import { useReservaciones } from '@/composables/useReservaciones';
import { computed, onMounted } from 'vue';

const { reservaciones, cargarReservaciones, cargando: cargandoReservaciones } = useReservaciones();
const { clases, cargarClases, cargando: cargandoClases } = useClases();
const { cursos, cargarCursos, cargando: cargandoCursos } = useCursos();
const { instructores, cargarInstructores, cargando: cargandoInstructores } = useInstructores();

const reservacionesPendientes = computed(() => {
    return reservaciones.value.filter((r) => r.estado === 'pendiente').length;
});

const clasesDelDia = computed(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return clases.value.filter((c) => c.fecha === hoy && c.estado === 'programada').length;
});

const cursosActivos = computed(() => {
    return cursos.value.filter((c) => c.activo).length;
});

const instructoresActivos = computed(() => {
    return instructores.value.filter((i) => i.activo).length;
});

const cargando = computed(() => {
    return cargandoReservaciones.value || cargandoClases.value || cargandoCursos.value || cargandoInstructores.value;
});

onMounted(async () => {
    await Promise.all([cargarReservaciones({ estado: 'pendiente' }), cargarClases(), cargarCursos(), cargarInstructores()]);
});
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <span class="text-surface-500 dark:text-surface-400 font-medium">Reservaciones Pendientes</span>
                <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-full" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-bookmark text-blue-500 dark:text-blue-400 text-xl"></i>
                </div>
            </div>
            <div class="flex items-center">
                <span v-if="!cargandoReservaciones" class="text-surface-900 dark:text-surface-0 text-3xl font-bold">{{ reservacionesPendientes }}</span>
                <i v-else class="pi pi-spin pi-spinner text-2xl text-surface-400"></i>
            </div>
        </div>

        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <span class="text-surface-500 dark:text-surface-400 font-medium">Clases del Día</span>
                <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-full" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-calendar text-orange-500 dark:text-orange-400 text-xl"></i>
                </div>
            </div>
            <div class="flex items-center">
                <span v-if="!cargandoClases" class="text-surface-900 dark:text-surface-0 text-3xl font-bold">{{ clasesDelDia }}</span>
                <i v-else class="pi pi-spin pi-spinner text-2xl text-surface-400"></i>
            </div>
        </div>

        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <span class="text-surface-500 dark:text-surface-400 font-medium">Cursos Activos</span>
                <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-full" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-book text-cyan-500 dark:text-cyan-400 text-xl"></i>
                </div>
            </div>
            <div class="flex items-center">
                <span v-if="!cargandoCursos" class="text-surface-900 dark:text-surface-0 text-3xl font-bold">{{ cursosActivos }}</span>
                <i v-else class="pi pi-spin pi-spinner text-2xl text-surface-400"></i>
            </div>
        </div>

        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <span class="text-surface-500 dark:text-surface-400 font-medium">Instructores Activos</span>
                <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-full" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-users text-purple-500 dark:text-purple-400 text-xl"></i>
                </div>
            </div>
            <div class="flex items-center">
                <span v-if="!cargandoInstructores" class="text-surface-900 dark:text-surface-0 text-3xl font-bold">{{ instructoresActivos }}</span>
                <i v-else class="pi pi-spin pi-spinner text-2xl text-surface-400"></i>
            </div>
        </div>
    </div>
</template>
