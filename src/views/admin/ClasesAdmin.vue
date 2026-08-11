<script setup>
import CancelacionForm from '@/components/clases/CancelacionForm.vue';
import HistorialCancelaciones from '@/components/clases/HistorialCancelaciones.vue';
import { useClases } from '@/composables/useClases';
import { useCursos } from '@/composables/useCursos';
import { useInstructores } from '@/composables/useInstructores';
import { formatearFechaCorta, formatearHora } from '@/utils/formatters';
import { ref, reactive, onMounted, computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

const { clases, cargando, error, cargarClases, completarClase, cancelarClase, reprogramarClase, esCancelable, esCompletable, esReprogramable } = useClases();
const { cursos, cargarCursos } = useCursos();
const { instructores, cargarInstructores } = useInstructores();
const confirm = useConfirm();
const toast = useToast();

const tabActiva = ref(0);

// Filtros para listado de clases
const filtros = reactive({
    estado: null,
    instructor_id: null,
    curso_id: null,
    fecha_desde: null,
    fecha_hasta: null
});

const estadosDisponibles = ref([
    { label: 'Todos', value: null },
    { label: 'Programada', value: 'programada' },
    { label: 'Completada', value: 'completada' },
    { label: 'Cancelada', value: 'cancelada' }
]);

// Cancelación
const cancelacionVisible = ref(false);
const claseACancelar = ref(null);

// Reprogramación
const reprogramarVisible = ref(false);
const claseAReprogramar = ref(null);
const datosReprogramacion = reactive({
    slot_horario_id: '',
    fecha: null,
    hora_inicio: '',
    hora_fin: ''
});

const estadoLabel = computed(() => {
    return (estado) => {
        const labels = { programada: 'Programada', completada: 'Completada', cancelada: 'Cancelada' };
        return labels[estado] || estado;
    };
});

const estadoSeverity = computed(() => {
    return (estado) => {
        const severities = { programada: 'info', completada: 'success', cancelada: 'danger' };
        return severities[estado] || 'secondary';
    };
});

async function cargar() {
    const filtrosActivos = {};
    if (filtros.estado) filtrosActivos.estado = filtros.estado;
    if (filtros.instructor_id) filtrosActivos.instructor_id = filtros.instructor_id;
    if (filtros.curso_id) filtrosActivos.curso_id = filtros.curso_id;
    if (filtros.fecha_desde) {
        filtrosActivos.fecha_desde = filtros.fecha_desde instanceof Date ? filtros.fecha_desde.toISOString().split('T')[0] : filtros.fecha_desde;
    }
    if (filtros.fecha_hasta) {
        filtrosActivos.fecha_hasta = filtros.fecha_hasta instanceof Date ? filtros.fecha_hasta.toISOString().split('T')[0] : filtros.fecha_hasta;
    }

    await cargarClases(filtrosActivos);
}

function aplicarFiltros() {
    cargar();
}

function limpiarFiltros() {
    filtros.estado = null;
    filtros.instructor_id = null;
    filtros.curso_id = null;
    filtros.fecha_desde = null;
    filtros.fecha_hasta = null;
    cargar();
}

// --- Completar clase ---
function onCompletar(clase) {
    confirm.require({
        message: `¿Deseas marcar esta clase como completada? Se actualizará el avance de horas del alumno.`,
        header: 'Completar clase',
        icon: 'pi pi-check-circle',
        rejectLabel: 'No',
        acceptLabel: 'Sí, completar',
        acceptClass: 'p-button-success',
        accept: () => ejecutarCompletar(clase)
    });
}

async function ejecutarCompletar(clase) {
    try {
        await completarClase(clase.id);
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Clase marcada como completada', life: 3000 });
        cargar();
    } catch (err) {
        const respuesta = err.response?.data;
        toast.add({ severity: 'error', summary: 'Error', detail: respuesta?.mensaje || 'No se pudo completar la clase', life: 3000 });
    }
}

// --- Cancelar clase ---
function onCancelar(clase) {
    if (!esCancelable(clase.estado)) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Solo las clases programadas pueden ser canceladas', life: 3000 });
        return;
    }
    claseACancelar.value = clase;
    cancelacionVisible.value = true;
}

async function onConfirmarCancelacion({ claseId, motivo }) {
    try {
        await cancelarClase(claseId, motivo);
        cancelacionVisible.value = false;
        claseACancelar.value = null;
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Clase cancelada correctamente', life: 3000 });
        cargar();
    } catch (err) {
        const respuesta = err.response?.data;
        toast.add({ severity: 'error', summary: 'Error', detail: respuesta?.mensaje || 'No se pudo cancelar la clase', life: 3000 });
    }
}

function onCancelarCancelacion() {
    cancelacionVisible.value = false;
    claseACancelar.value = null;
}

// --- Reprogramar clase ---
function onReprogramar(clase) {
    if (!esReprogramable(clase.estado)) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Solo las clases canceladas pueden reprogramarse', life: 3000 });
        return;
    }
    claseAReprogramar.value = clase;
    datosReprogramacion.slot_horario_id = '';
    datosReprogramacion.fecha = null;
    datosReprogramacion.hora_inicio = '';
    datosReprogramacion.hora_fin = '';
    reprogramarVisible.value = true;
}

async function ejecutarReprogramar() {
    if (!datosReprogramacion.fecha || !datosReprogramacion.hora_inicio || !datosReprogramacion.hora_fin) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Complete todos los campos de reprogramación', life: 3000 });
        return;
    }

    try {
        const datos = {
            slot_horario_id: datosReprogramacion.slot_horario_id || undefined,
            fecha: datosReprogramacion.fecha instanceof Date ? datosReprogramacion.fecha.toISOString().split('T')[0] : datosReprogramacion.fecha,
            hora_inicio: datosReprogramacion.hora_inicio,
            hora_fin: datosReprogramacion.hora_fin
        };
        await reprogramarClase(claseAReprogramar.value.id, datos);
        reprogramarVisible.value = false;
        claseAReprogramar.value = null;
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Clase reprogramada correctamente', life: 3000 });
        cargar();
    } catch (err) {
        const respuesta = err.response?.data;
        toast.add({ severity: 'error', summary: 'Error', detail: respuesta?.mensaje || 'No se pudo reprogramar la clase', life: 3000 });
    }
}

onMounted(() => {
    cargar();
    cargarCursos();
    cargarInstructores();
});
</script>

<template>
    <div class="card">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Gestión de Clases</h2>
        </div>

        <TabView v-model:activeIndex="tabActiva">
            <!-- Tab: Listado de clases -->
            <TabPanel header="Clases">
                <!-- Filtros -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300">Estado</label>
                        <Select v-model="filtros.estado" :options="estadosDisponibles" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" />
                    </div>
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
                        <DatePicker v-model="filtros.fecha_desde" dateFormat="dd/mm/yy" placeholder="Inicio" showIcon class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium text-surface-600 dark:text-surface-300">Fecha hasta</label>
                        <DatePicker v-model="filtros.fecha_hasta" dateFormat="dd/mm/yy" placeholder="Fin" showIcon class="w-full" />
                    </div>
                </div>

                <div class="flex gap-2 mb-4">
                    <Button label="Filtrar" icon="pi pi-filter" @click="aplicarFiltros" />
                    <Button label="Limpiar" icon="pi pi-filter-slash" severity="secondary" @click="limpiarFiltros" />
                </div>

                <!-- Error -->
                <div v-if="error && !cargando" class="flex flex-col items-center py-8">
                    <i class="pi pi-exclamation-triangle text-3xl text-orange-500 mb-3"></i>
                    <p class="text-surface-600 dark:text-surface-300 mb-3">{{ error }}</p>
                    <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="cargar" />
                </div>

                <!-- Tabla de clases -->
                <DataTable v-else :value="clases" :loading="cargando" stripedRows responsiveLayout="scroll" emptyMessage="No hay clases registradas" :paginator="true" :rows="20">
                    <Column header="Fecha" sortable sortField="fecha" style="min-width: 120px">
                        <template #body="{ data }">
                            {{ formatearFechaCorta(data.fecha) }}
                        </template>
                    </Column>
                    <Column header="Horario" style="min-width: 130px">
                        <template #body="{ data }"> {{ formatearHora(data.hora_inicio) }} - {{ formatearHora(data.hora_fin) }} </template>
                    </Column>
                    <Column field="instructor_nombre" header="Instructor" style="min-width: 150px" />
                    <Column field="curso_nombre" header="Curso" style="min-width: 160px" />
                    <Column field="cliente_nombre" header="Alumno" style="min-width: 150px" />
                    <Column header="Estado" style="min-width: 120px">
                        <template #body="{ data }">
                            <Tag :value="estadoLabel(data.estado)" :severity="estadoSeverity(data.estado)" />
                        </template>
                    </Column>
                    <Column header="Acciones" style="min-width: 250px">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button v-if="esCompletable(data.estado)" label="Completar" icon="pi pi-check" size="small" severity="success" @click="onCompletar(data)" />
                                <Button v-if="esCancelable(data.estado)" label="Cancelar" icon="pi pi-times" size="small" severity="danger" outlined @click="onCancelar(data)" />
                                <Button v-if="esReprogramable(data.estado)" label="Reprogramar" icon="pi pi-replay" size="small" severity="warn" @click="onReprogramar(data)" />
                                <span v-if="data.estado === 'completada'" class="text-surface-400 text-sm italic flex items-center">Finalizada</span>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </TabPanel>

            <!-- Tab: Historial de cancelaciones -->
            <TabPanel header="Historial de Cancelaciones">
                <HistorialCancelaciones :instructores="instructores" :cursos="cursos" />
            </TabPanel>
        </TabView>

        <!-- Dialog Cancelación -->
        <CancelacionForm v-if="claseACancelar" :clase="claseACancelar" :visible="cancelacionVisible" @confirmar="onConfirmarCancelacion" @cancelar="onCancelarCancelacion" @update:visible="cancelacionVisible = $event" />

        <!-- Dialog Reprogramar -->
        <Dialog :visible="reprogramarVisible" @update:visible="reprogramarVisible = $event" modal header="Reprogramar clase" :style="{ width: '500px' }" :breakpoints="{ '768px': '90vw', '576px': '95vw' }">
            <div class="space-y-4">
                <div v-if="claseAReprogramar" class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                    <p class="text-sm text-surface-600 dark:text-surface-300">
                        <strong>Clase original:</strong> {{ formatearFechaCorta(claseAReprogramar.fecha) }} | {{ formatearHora(claseAReprogramar.hora_inicio) }} - {{ formatearHora(claseAReprogramar.hora_fin) }}
                    </p>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="font-medium text-surface-700 dark:text-surface-200">Nueva fecha <span class="text-red-500">*</span></label>
                    <DatePicker v-model="datosReprogramacion.fecha" dateFormat="dd/mm/yy" showIcon class="w-full" placeholder="Seleccione fecha" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium text-surface-700 dark:text-surface-200">Hora inicio <span class="text-red-500">*</span></label>
                        <InputText v-model="datosReprogramacion.hora_inicio" placeholder="HH:MM" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-medium text-surface-700 dark:text-surface-200">Hora fin <span class="text-red-500">*</span></label>
                        <InputText v-model="datosReprogramacion.hora_fin" placeholder="HH:MM" class="w-full" />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancelar" severity="secondary" @click="reprogramarVisible = false" />
                    <Button label="Reprogramar" icon="pi pi-replay" severity="warn" @click="ejecutarReprogramar" />
                </div>
            </template>
        </Dialog>

        <ConfirmDialog />
        <Toast />
    </div>
</template>
