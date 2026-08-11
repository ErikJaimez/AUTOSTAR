<script setup>
import { useClases } from '@/composables/useClases';
import { formatearFechaCorta, formatearHora } from '@/utils/formatters';
import { ref, reactive, onMounted } from 'vue';

const { cancelaciones, paginacionCancelaciones, cargando, error, cargarCancelaciones } = useClases();

const filtros = reactive({
    instructor_id: null,
    curso_id: null,
    fecha_desde: null,
    fecha_hasta: null
});

const paginaActual = ref(1);

defineProps({
    instructores: {
        type: Array,
        default: () => []
    },
    cursos: {
        type: Array,
        default: () => []
    }
});

async function cargar() {
    const filtrosActivos = {};
    if (filtros.instructor_id) filtrosActivos.instructor_id = filtros.instructor_id;
    if (filtros.curso_id) filtrosActivos.curso_id = filtros.curso_id;
    if (filtros.fecha_desde) {
        filtrosActivos.fecha_desde = filtros.fecha_desde instanceof Date ? filtros.fecha_desde.toISOString().split('T')[0] : filtros.fecha_desde;
    }
    if (filtros.fecha_hasta) {
        filtrosActivos.fecha_hasta = filtros.fecha_hasta instanceof Date ? filtros.fecha_hasta.toISOString().split('T')[0] : filtros.fecha_hasta;
    }

    await cargarCancelaciones(filtrosActivos, paginaActual.value);
}

function onPage(event) {
    paginaActual.value = event.page + 1;
    cargar();
}

function aplicarFiltros() {
    paginaActual.value = 1;
    cargar();
}

function limpiarFiltros() {
    filtros.instructor_id = null;
    filtros.curso_id = null;
    filtros.fecha_desde = null;
    filtros.fecha_hasta = null;
    paginaActual.value = 1;
    cargar();
}

onMounted(() => {
    cargar();
});
</script>

<template>
    <div>
        <!-- Filtros -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-surface-600 dark:text-surface-300">Instructor</label>
                <Select v-model="filtros.instructor_id" :options="instructores" optionLabel="nombre_completo" optionValue="id" placeholder="Todos" showClear class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-surface-600 dark:text-surface-300">Curso</label>
                <Select v-model="filtros.curso_id" :options="cursos" optionLabel="nombre" optionValue="id" placeholder="Todos" showClear class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-surface-600 dark:text-surface-300">Fecha desde</label>
                <DatePicker v-model="filtros.fecha_desde" dateFormat="dd/mm/yy" placeholder="Fecha inicio" showIcon class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-surface-600 dark:text-surface-300">Fecha hasta</label>
                <DatePicker v-model="filtros.fecha_hasta" dateFormat="dd/mm/yy" placeholder="Fecha fin" showIcon class="w-full" />
            </div>
        </div>

        <div class="flex gap-2 mb-4">
            <Button label="Filtrar" icon="pi pi-filter" size="small" @click="aplicarFiltros" />
            <Button label="Limpiar" icon="pi pi-filter-slash" size="small" severity="secondary" @click="limpiarFiltros" />
        </div>

        <!-- Error -->
        <div v-if="error && !cargando" class="flex flex-col items-center py-6">
            <i class="pi pi-exclamation-triangle text-2xl text-orange-500 mb-2"></i>
            <p class="text-surface-600 dark:text-surface-300 mb-2">{{ error }}</p>
            <Button label="Reintentar" icon="pi pi-refresh" size="small" severity="secondary" @click="cargar" />
        </div>

        <!-- Tabla de cancelaciones -->
        <DataTable
            v-else
            :value="cancelaciones"
            :loading="cargando"
            stripedRows
            :paginator="true"
            :rows="50"
            :totalRecords="paginacionCancelaciones.total"
            :lazy="true"
            @page="onPage"
            responsiveLayout="scroll"
            emptyMessage="No hay cancelaciones registradas"
        >
            <Column header="Fecha cancelación" style="min-width: 130px">
                <template #body="{ data }">
                    {{ formatearFechaCorta(data.fecha_cancelacion) }}
                </template>
            </Column>
            <Column header="Clase (Fecha)" style="min-width: 120px">
                <template #body="{ data }">
                    {{ formatearFechaCorta(data.clase_fecha) }}
                </template>
            </Column>
            <Column header="Horario" style="min-width: 120px">
                <template #body="{ data }"> {{ formatearHora(data.clase_hora_inicio) }} - {{ formatearHora(data.clase_hora_fin) }} </template>
            </Column>
            <Column field="instructor_nombre" header="Instructor" style="min-width: 150px" />
            <Column field="curso_nombre" header="Curso" style="min-width: 150px" />
            <Column field="motivo" header="Motivo" style="min-width: 250px">
                <template #body="{ data }">
                    <span class="text-sm">{{ data.motivo }}</span>
                </template>
            </Column>
            <Column field="admin_nombre" header="Cancelado por" style="min-width: 130px" />
            <Column header="Reprogramada" style="min-width: 100px">
                <template #body="{ data }">
                    <Tag v-if="data.clase_reprogramada_id" value="Sí" severity="success" />
                    <Tag v-else value="No" severity="secondary" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
