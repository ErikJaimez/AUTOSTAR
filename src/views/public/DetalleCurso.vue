<script setup>
import { useCursos } from '@/composables/useCursos';
import { useHorarios } from '@/composables/useHorarios';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { cursoActual, cargando, error, cargarCurso } = useCursos();
const { slots, cargando: cargandoHorarios, error: errorHorarios, cargarSlots } = useHorarios();

const cursoId = computed(() => route.params.id);

// Semana de horarios
const semanaActual = ref('');
const SEMANAS_FUTURO = 4;

/**
 * Obtiene el lunes de la semana
 */
function obtenerLunesDeSemana(fecha) {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatearFecha(fecha) {
    return fecha.toISOString().split('T')[0];
}

const lunesHoy = computed(() => formatearFecha(obtenerLunesDeSemana(new Date())));

const semanaMaxima = computed(() => {
    const d = obtenerLunesDeSemana(new Date());
    d.setDate(d.getDate() + (SEMANAS_FUTURO - 1) * 7);
    return formatearFecha(d);
});

const puedeIrAtras = computed(() => semanaActual.value > lunesHoy.value);
const puedeIrAdelante = computed(() => semanaActual.value < semanaMaxima.value);

const etiquetaSemana = computed(() => {
    if (!semanaActual.value) return '';
    const lunes = new Date(semanaActual.value + 'T00:00:00');
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const opciones = { day: 'numeric', month: 'short' };
    return `${lunes.toLocaleDateString('es-MX', opciones)} — ${domingo.toLocaleDateString('es-MX', opciones)}`;
});

/**
 * Agrupa los slots por día para la semana actual
 */
const slotsPorDia = computed(() => {
    const grupos = {};
    for (const slot of slots.value) {
        const fecha = slot.fecha;
        if (!grupos[fecha]) {
            grupos[fecha] = [];
        }
        grupos[fecha].push(slot);
    }
    // Ordenar por hora dentro de cada día
    for (const fecha of Object.keys(grupos)) {
        grupos[fecha].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    }
    return grupos;
});

const tieneHorarios = computed(() => slots.value.length > 0);

function formatPrecio(precio) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precio);
}

function formatHora(hora) {
    return hora?.substring(0, 5) || '';
}

function estaDisponible(slot) {
    if (slot.disponible === false) return false;
    return (slot.reservaciones_count || 0) < (slot.capacidad_maxima || 1);
}

function cambiarSemana(direccion) {
    const fecha = new Date(semanaActual.value + 'T00:00:00');
    fecha.setDate(fecha.getDate() + direccion * 7);
    semanaActual.value = formatearFecha(fecha);
    cargarSlots(cursoId.value, semanaActual.value);
}

onMounted(async () => {
    await cargarCurso(cursoId.value);
    // Inicializar semana y cargar horarios
    semanaActual.value = lunesHoy.value;
    cargarSlots(cursoId.value, semanaActual.value);
});
</script>

<template>
    <div class="px-4 py-8 md:px-6 lg:px-8 max-w-5xl mx-auto overflow-hidden">
        <!-- Estado de carga -->
        <div v-if="cargando" class="flex flex-col gap-4">
            <Skeleton width="60%" height="36px" class="mb-2" />
            <Skeleton width="120px" height="24px" class="mb-4" />
            <Skeleton width="100%" height="100px" class="mb-4" />
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton height="80px" />
                <Skeleton height="80px" />
                <Skeleton height="80px" />
            </div>
        </div>

        <!-- Estado de error -->
        <div v-else-if="error" class="flex flex-col items-center justify-center py-16">
            <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
            <p class="text-lg text-surface-700 dark:text-surface-200 mb-4">{{ error }}</p>
            <Button label="Reintentar" icon="pi pi-refresh" @click="cargarCurso(cursoId)" />
        </div>

        <!-- Detalle del curso -->
        <div v-else-if="cursoActual">
            <div class="mb-6">
                <router-link to="/cursos" class="text-primary hover:underline text-sm inline-flex items-center min-h-[44px]"> <i class="pi pi-arrow-left mr-1"></i>Volver al catálogo</router-link>
            </div>

            <div class="flex flex-col lg:flex-row gap-8">
                <!-- Información principal -->
                <div class="flex-1">
                    <Tag :value="'Licencia ' + cursoActual.categoria_licencia" class="mb-3" />
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-4">{{ cursoActual.nombre }}</h1>
                    <p class="text-surface-700 dark:text-surface-200 leading-relaxed mb-6">{{ cursoActual.descripcion }}</p>

                    <!-- Requisitos previos -->
                    <div v-if="cursoActual.requisitos_previos" class="mb-6">
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-2">Requisitos previos</h2>
                        <p class="text-surface-600 dark:text-surface-300">{{ cursoActual.requisitos_previos }}</p>
                    </div>
                </div>

                <!-- Panel lateral con datos clave -->
                <div class="w-full lg:w-80 lg:flex-shrink-0">
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-6 sticky top-4">
                        <div class="text-center mb-4">
                            <span class="text-3xl font-bold text-primary">{{ formatPrecio(cursoActual.precio) }}</span>
                        </div>

                        <Divider />

                        <div class="flex flex-col gap-3">
                            <div class="flex items-center gap-3">
                                <i class="pi pi-clock text-primary"></i>
                                <div>
                                    <span class="text-sm text-surface-500">Duración</span>
                                    <p class="font-medium text-surface-900 dark:text-surface-0">{{ cursoActual.duracion_horas }} horas</p>
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <i class="pi pi-id-card text-primary"></i>
                                <div>
                                    <span class="text-sm text-surface-500">Categoría</span>
                                    <p class="font-medium text-surface-900 dark:text-surface-0">Licencia {{ cursoActual.categoria_licencia }}</p>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        <!-- Horarios disponibles -->
                        <div class="mb-4">
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Horarios disponibles</h3>

                            <!-- Navegación por semana -->
                            <div class="flex items-center justify-between mb-3">
                                <Button icon="pi pi-chevron-left" text rounded size="small" :disabled="!puedeIrAtras" @click="cambiarSemana(-1)" />
                                <span class="text-xs font-medium text-surface-600 dark:text-surface-300">{{ etiquetaSemana }}</span>
                                <Button icon="pi pi-chevron-right" text rounded size="small" :disabled="!puedeIrAdelante" @click="cambiarSemana(1)" />
                            </div>

                            <!-- Estado de carga de horarios -->
                            <div v-if="cargandoHorarios" class="flex flex-col gap-2">
                                <Skeleton height="40px" />
                                <Skeleton height="40px" />
                            </div>

                            <!-- Error al cargar horarios -->
                            <div v-else-if="errorHorarios" class="text-center py-2">
                                <p class="text-sm text-red-500 mb-2">{{ errorHorarios }}</p>
                                <Button label="Reintentar" size="small" text @click="cargarSlots(cursoId, semanaActual)" />
                            </div>

                            <!-- Sin horarios -->
                            <div v-else-if="!tieneHorarios" class="text-center py-4">
                                <i class="pi pi-calendar-times text-2xl text-surface-400 mb-2"></i>
                                <p class="text-sm text-surface-500">No hay horarios disponibles para esta semana.</p>
                            </div>

                            <!-- Lista de horarios agrupados por día -->
                            <div v-else class="flex flex-col gap-2 max-h-72 overflow-y-auto">
                                <div v-for="(slotsDelDia, fecha) in slotsPorDia" :key="fecha">
                                    <p class="text-xs font-medium text-surface-500 mb-1 capitalize">
                                        {{ new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }) }}
                                    </p>
                                    <div v-for="slot in slotsDelDia" :key="slot.id" class="border border-surface-200 dark:border-surface-700 rounded p-2 mb-1" :class="estaDisponible(slot) ? '' : 'opacity-60'">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <span class="text-sm font-medium text-primary">{{ formatHora(slot.hora_inicio) }} - {{ formatHora(slot.hora_fin) }}</span>
                                                <p v-if="slot.instructor_nombre" class="text-xs text-surface-500 mt-0.5">{{ slot.instructor_nombre }}</p>
                                            </div>
                                            <Tag v-if="!estaDisponible(slot)" value="No disponible" severity="danger" class="text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button label="Reservar" icon="pi pi-calendar" class="w-full" :disabled="!tieneHorarios" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
