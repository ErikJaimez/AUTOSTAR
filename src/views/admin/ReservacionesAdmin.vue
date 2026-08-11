<script setup>
import EstadoBadge from '@/components/reservaciones/EstadoBadge.vue';
import { useCursos } from '@/composables/useCursos';
import { useReservaciones } from '@/composables/useReservaciones';
import { formatearFechaCorta, formatearHora } from '@/utils/formatters';
import { ref, reactive, onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

const { reservaciones, paginacion, cargando, error, cargarReservaciones, cambiarEstado, obtenerTransicionesDisponibles, esTransicionValida } = useReservaciones();
const { cursos, cargarCursos } = useCursos();
const confirm = useConfirm();
const toast = useToast();

const filtros = reactive({
    estado: null,
    curso_id: null,
    fecha_desde: null,
    fecha_hasta: null
});

const estadosDisponibles = ref([
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Confirmada', value: 'confirmada' },
    { label: 'Completada', value: 'completada' },
    { label: 'Cancelada', value: 'cancelada' }
]);

const paginaActual = ref(1);

async function cargar() {
    const filtrosActivos = {};
    if (filtros.estado) filtrosActivos.estado = filtros.estado;
    if (filtros.curso_id) filtrosActivos.curso_id = filtros.curso_id;
    if (filtros.fecha_desde) {
        filtrosActivos.fecha_desde = filtros.fecha_desde instanceof Date ? filtros.fecha_desde.toISOString().split('T')[0] : filtros.fecha_desde;
    }
    if (filtros.fecha_hasta) {
        filtrosActivos.fecha_hasta = filtros.fecha_hasta instanceof Date ? filtros.fecha_hasta.toISOString().split('T')[0] : filtros.fecha_hasta;
    }

    await cargarReservaciones(filtrosActivos, paginaActual.value);
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
    filtros.estado = null;
    filtros.curso_id = null;
    filtros.fecha_desde = null;
    filtros.fecha_hasta = null;
    paginaActual.value = 1;
    cargar();
}

function onCambiarEstado(reservacion, nuevoEstado) {
    if (!esTransicionValida(reservacion.estado, nuevoEstado)) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'La transición de estado no es válida', life: 3000 });
        return;
    }

    if (nuevoEstado === 'cancelada') {
        confirm.require({
            message: `¿Estás seguro de que deseas cancelar la reservación con folio "${reservacion.folio}"? Se liberará el espacio en el horario y se notificará al cliente.`,
            header: 'Confirmar cancelación',
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'No, mantener',
            acceptLabel: 'Sí, cancelar',
            acceptClass: 'p-button-danger',
            accept: () => ejecutarCambioEstado(reservacion, nuevoEstado)
        });
    } else {
        ejecutarCambioEstado(reservacion, nuevoEstado);
    }
}

async function ejecutarCambioEstado(reservacion, nuevoEstado) {
    try {
        await cambiarEstado(reservacion.id, nuevoEstado);
        toast.add({ severity: 'success', summary: 'Éxito', detail: `Estado cambiado a "${nuevoEstado}"`, life: 3000 });
        cargar();
    } catch (err) {
        const respuesta = err.response?.data;
        toast.add({ severity: 'error', summary: 'Error', detail: respuesta?.mensaje || 'No se pudo cambiar el estado', life: 3000 });
    }
}

onMounted(() => {
    cargar();
    cargarCursos();
});
</script>

<template>
    <div class="card">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Gestión de Reservaciones</h2>
        </div>

        <!-- Filtros -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-surface-600 dark:text-surface-300">Estado</label>
                <Select v-model="filtros.estado" :options="estadosDisponibles" optionLabel="label" optionValue="value" placeholder="Todos los estados" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-surface-600 dark:text-surface-300">Curso</label>
                <Select v-model="filtros.curso_id" :options="cursos" optionLabel="nombre" optionValue="id" placeholder="Todos los cursos" showClear class="w-full" />
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
            <Button label="Filtrar" icon="pi pi-filter" @click="aplicarFiltros" />
            <Button label="Limpiar" icon="pi pi-filter-slash" severity="secondary" @click="limpiarFiltros" />
        </div>

        <!-- Estado de error -->
        <div v-if="error && !cargando" class="flex flex-col items-center py-8">
            <i class="pi pi-exclamation-triangle text-3xl text-orange-500 mb-3"></i>
            <p class="text-surface-600 dark:text-surface-300 mb-3">{{ error }}</p>
            <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="cargar" />
        </div>

        <!-- Tabla de reservaciones -->
        <DataTable v-else :value="reservaciones" :loading="cargando" stripedRows :paginator="true" :rows="20" :totalRecords="paginacion.total" :lazy="true" @page="onPage" responsiveLayout="scroll" emptyMessage="No hay reservaciones registradas">
            <Column field="folio" header="Folio" sortable style="min-width: 120px" />
            <Column field="cliente_nombre" header="Cliente" sortable style="min-width: 180px" />
            <Column field="curso_nombre" header="Curso" sortable style="min-width: 160px" />
            <Column header="Fecha" style="min-width: 120px">
                <template #body="{ data }">
                    {{ formatearFechaCorta(data.slot_fecha) }}
                </template>
            </Column>
            <Column header="Hora" style="min-width: 130px">
                <template #body="{ data }"> {{ formatearHora(data.hora_inicio) }} - {{ formatearHora(data.hora_fin) }} </template>
            </Column>
            <Column header="Estado" style="min-width: 120px">
                <template #body="{ data }">
                    <EstadoBadge :estado="data.estado" />
                </template>
            </Column>
            <Column header="Acciones" style="min-width: 200px">
                <template #body="{ data }">
                    <div class="flex gap-2 items-center">
                        <Select v-if="obtenerTransicionesDisponibles(data.estado).length > 0" :options="obtenerTransicionesDisponibles(data.estado)" placeholder="Cambiar estado" class="w-40" @change="(e) => onCambiarEstado(data, e.value)" />
                        <span v-else class="text-surface-400 text-sm italic">Sin acciones</span>
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- ConfirmDialog y Toast -->
        <ConfirmDialog />
        <Toast />
    </div>
</template>
