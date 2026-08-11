<script setup>
import BarraProgreso from '@/components/shared/BarraProgreso.vue';
import ClaseCard from '@/components/clases/ClaseCard.vue';
import CancelacionForm from '@/components/clases/CancelacionForm.vue';
import { useAvanceHoras } from '@/composables/useAvanceHoras';
import { useClases } from '@/composables/useClases';
import { formatearFechaCorta, formatearHora } from '@/utils/formatters';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const { horasTotales, horasCompletadas, horasPendientes, porcentaje, cursoFinalizado, clases, curso, cliente, cargando, error, cargarAvance, limpiarAvance } = useAvanceHoras();
const { completarClase, cancelarClase, reprogramarClase } = useClases();

const clienteId = computed(() => route.params.id);

// Cancelación
const cancelacionVisible = ref(false);
const claseACancelar = ref(null);

// Reprogramación
const reprogramarVisible = ref(false);
const claseAReprogramar = ref(null);
const datosReprogramacion = ref({
    fecha: null,
    hora_inicio: '',
    hora_fin: ''
});

const clasesOrdenadas = computed(() => {
    if (!clases.value) return [];
    return [...clases.value].sort((a, b) => {
        // Ordenar por fecha descendente
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return fechaB - fechaA;
    });
});

const clasesCompletadas = computed(() => clasesOrdenadas.value.filter((c) => c.estado === 'completada'));
const clasesProgramadas = computed(() => clasesOrdenadas.value.filter((c) => c.estado === 'programada'));
const clasesCanceladas = computed(() => clasesOrdenadas.value.filter((c) => c.estado === 'cancelada'));

async function cargar() {
    if (clienteId.value) {
        await cargarAvance(clienteId.value);
    }
}

// --- Completar clase ---
function onCompletar(clase) {
    confirm.require({
        message: '¿Deseas marcar esta clase como completada? Se actualizará el avance de horas.',
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
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Clase completada. Avance actualizado.', life: 3000 });
        cargar();
    } catch (err) {
        const respuesta = err.response?.data;
        toast.add({ severity: 'error', summary: 'Error', detail: respuesta?.mensaje || 'No se pudo completar la clase', life: 3000 });
    }
}

// --- Cancelar clase ---
function onCancelar(clase) {
    claseACancelar.value = clase;
    cancelacionVisible.value = true;
}

async function onConfirmarCancelacion({ claseId, motivo }) {
    try {
        await cancelarClase(claseId, motivo);
        cancelacionVisible.value = false;
        claseACancelar.value = null;
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Clase cancelada. Las horas se mantienen pendientes.', life: 3000 });
        cargar();
    } catch (err) {
        const respuesta = err.response?.data;
        toast.add({ severity: 'error', summary: 'Error', detail: respuesta?.mensaje || 'No se pudo cancelar la clase', life: 3000 });
    }
}

// --- Reprogramar clase ---
function onReprogramar(clase) {
    claseAReprogramar.value = clase;
    datosReprogramacion.value = { fecha: null, hora_inicio: '', hora_fin: '' };
    reprogramarVisible.value = true;
}

async function ejecutarReprogramar() {
    if (!datosReprogramacion.value.fecha || !datosReprogramacion.value.hora_inicio || !datosReprogramacion.value.hora_fin) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Complete todos los campos', life: 3000 });
        return;
    }

    try {
        const datos = {
            fecha: datosReprogramacion.value.fecha instanceof Date ? datosReprogramacion.value.fecha.toISOString().split('T')[0] : datosReprogramacion.value.fecha,
            hora_inicio: datosReprogramacion.value.hora_inicio,
            hora_fin: datosReprogramacion.value.hora_fin
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

function volver() {
    router.back();
}

onMounted(() => {
    limpiarAvance();
    cargar();
});
</script>

<template>
    <div class="card">
        <!-- Header con botón volver -->
        <div class="flex items-center gap-3 mb-6">
            <Button icon="pi pi-arrow-left" severity="secondary" text rounded @click="volver" />
            <div>
                <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Avance de Horas</h2>
                <p v-if="cliente" class="text-surface-500 dark:text-surface-400">{{ cliente.nombre_completo }}</p>
            </div>
        </div>

        <!-- Estado de carga -->
        <div v-if="cargando" class="flex justify-center py-12">
            <ProgressSpinner style="width: 50px; height: 50px" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex flex-col items-center py-8">
            <i class="pi pi-exclamation-triangle text-3xl text-orange-500 mb-3"></i>
            <p class="text-surface-600 dark:text-surface-300 mb-3">{{ error }}</p>
            <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="cargar" />
        </div>

        <!-- Contenido principal -->
        <div v-else>
            <!-- Info del curso -->
            <div v-if="curso" class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg mb-6">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100">{{ curso.nombre }}</h3>
                        <p class="text-sm text-surface-500 dark:text-surface-400">{{ curso.categoria_licencia }} | {{ curso.duracion_horas }}h totales</p>
                    </div>
                    <Tag v-if="cursoFinalizado" value="Curso Finalizado" severity="success" class="text-base" />
                    <Tag v-else value="En progreso" severity="info" class="text-base" />
                </div>
            </div>

            <!-- Barra de progreso -->
            <div class="mb-8">
                <h3 class="text-lg font-medium text-surface-800 dark:text-surface-100 mb-3">Progreso general</h3>
                <BarraProgreso :porcentaje="porcentaje" :horas-completadas="horasCompletadas" :horas-totales="horasTotales" :horas-pendientes="horasPendientes" height="2rem" />
            </div>

            <!-- Resumen rápido en tarjetas -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                    <i class="pi pi-check-circle text-2xl text-green-500 mb-2"></i>
                    <p class="text-2xl font-bold text-green-700 dark:text-green-300">{{ clasesCompletadas.length }}</p>
                    <p class="text-sm text-green-600 dark:text-green-400">Clases completadas</p>
                </div>
                <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                    <i class="pi pi-clock text-2xl text-blue-500 mb-2"></i>
                    <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ clasesProgramadas.length }}</p>
                    <p class="text-sm text-blue-600 dark:text-blue-400">Clases programadas</p>
                </div>
                <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                    <i class="pi pi-times-circle text-2xl text-red-500 mb-2"></i>
                    <p class="text-2xl font-bold text-red-700 dark:text-red-300">{{ clasesCanceladas.length }}</p>
                    <p class="text-sm text-red-600 dark:text-red-400">Clases canceladas</p>
                </div>
            </div>

            <!-- Detalle de clases -->
            <div>
                <h3 class="text-lg font-medium text-surface-800 dark:text-surface-100 mb-4">Detalle de clases</h3>

                <div v-if="clasesOrdenadas.length === 0" class="text-center py-8">
                    <i class="pi pi-calendar text-3xl text-surface-300 mb-3"></i>
                    <p class="text-surface-500 dark:text-surface-400">No hay clases registradas para este alumno</p>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ClaseCard v-for="clase in clasesOrdenadas" :key="clase.id" :clase="clase" @completar="onCompletar" @cancelar="onCancelar" @reprogramar="onReprogramar" />
                </div>
            </div>
        </div>

        <!-- Dialog Cancelación -->
        <CancelacionForm v-if="claseACancelar" :clase="claseACancelar" :visible="cancelacionVisible" @confirmar="onConfirmarCancelacion" @cancelar="cancelacionVisible = false" @update:visible="cancelacionVisible = $event" />

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
