<script setup>
import CalendarioSemanal from '@/components/horarios/CalendarioSemanal.vue';
import SlotForm from '@/components/horarios/SlotForm.vue';
import { useHorarios } from '@/composables/useHorarios';
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const { slotsPorSemana, cargando, error, cargarSlots, crearSlot, actualizarSlot, eliminarSlot } = useHorarios();

// Estado del diálogo de formulario
const mostrarFormulario = ref(false);
const slotEditando = ref(null);
const tituloFormulario = ref('Nuevo Horario');
const errorConflicto = ref(null);

// Estado del diálogo de confirmación de eliminación
const mostrarConfirmacion = ref(false);
const slotEliminar = ref(null);
const mensajeConfirmacion = ref('');

// Semana actual
const semanaActual = ref('');

onMounted(() => {
    const hoy = new Date();
    semanaActual.value = obtenerLunesDeSemana(hoy);
    cargarSlots(null, semanaActual.value);
});

function obtenerLunesDeSemana(fecha) {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
}

function cambiarSemana(nuevaSemana) {
    semanaActual.value = nuevaSemana;
    cargarSlots(null, nuevaSemana);
}

// --- Crear/Editar slot ---
function abrirCrear() {
    slotEditando.value = null;
    tituloFormulario.value = 'Nuevo Horario';
    errorConflicto.value = null;
    mostrarFormulario.value = true;
}

function abrirEditar(slot) {
    slotEditando.value = { ...slot };
    tituloFormulario.value = 'Editar Horario';
    errorConflicto.value = null;
    mostrarFormulario.value = true;
}

async function guardarSlot(datos) {
    errorConflicto.value = null;

    try {
        if (slotEditando.value) {
            await actualizarSlot(slotEditando.value.id, datos);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Horario actualizado correctamente', life: 3000 });
        } else {
            await crearSlot(datos);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Horario creado correctamente', life: 3000 });
        }
        mostrarFormulario.value = false;
        // Recargar la semana actual para reflejar cambios
        cargarSlots(null, semanaActual.value);
    } catch (err) {
        const respuesta = err.response?.data;
        // Error 409: conflicto de horario (traslape)
        if (err.response?.status === 409) {
            errorConflicto.value = respuesta?.mensaje || 'Existe un conflicto de horario con otro slot del mismo instructor';
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: respuesta?.mensaje || 'No se pudo guardar el horario',
                life: 5000
            });
        }
    }
}

// --- Eliminar slot ---
function confirmarEliminacion(slot) {
    slotEliminar.value = slot;
    const reservaciones = slot.reservaciones_count || 0;
    if (reservaciones > 0) {
        mensajeConfirmacion.value = `Este horario tiene ${reservaciones} reservación(es) activa(s). Los clientes afectados serán notificados. ¿Desea continuar?`;
    } else {
        mensajeConfirmacion.value = '¿Está seguro de eliminar este horario?';
    }
    mostrarConfirmacion.value = true;
}

async function ejecutarEliminacion() {
    if (!slotEliminar.value) return;

    try {
        await eliminarSlot(slotEliminar.value.id);
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Horario eliminado correctamente', life: 3000 });
    } catch (err) {
        const respuesta = err.response?.data;
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: respuesta?.mensaje || 'No se pudo eliminar el horario',
            life: 5000
        });
    } finally {
        mostrarConfirmacion.value = false;
        slotEliminar.value = null;
    }
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <Toast />

        <!-- Encabezado -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 class="text-2xl font-bold m-0">Horarios</h2>
            <Button label="Nuevo Horario" icon="pi pi-plus" @click="abrirCrear" />
        </div>

        <!-- Mensaje de error general -->
        <Message v-if="error" severity="error" :closable="true">
            {{ error }}
        </Message>

        <!-- Calendario semanal -->
        <CalendarioSemanal :slots-por-semana="slotsPorSemana" :semana-actual="semanaActual" :cargando="cargando" :modo-admin="true" @cambiar-semana="cambiarSemana" @editar-slot="abrirEditar" @eliminar-slot="confirmarEliminacion" />

        <!-- Diálogo de formulario crear/editar -->
        <Dialog v-model:visible="mostrarFormulario" :header="tituloFormulario" modal :style="{ width: '550px' }" :breakpoints="{ '768px': '90vw' }">
            <SlotForm :horario-editar="slotEditando" :error-conflicto="errorConflicto" @guardar="guardarSlot" @cancelar="mostrarFormulario = false" />
        </Dialog>

        <!-- Diálogo de confirmación de eliminación -->
        <Dialog v-model:visible="mostrarConfirmacion" header="Confirmar eliminación" modal :style="{ width: '450px' }" :breakpoints="{ '576px': '90vw' }">
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3">
                    <i class="pi pi-exclamation-triangle text-yellow-500 text-2xl"></i>
                    <span>{{ mensajeConfirmacion }}</span>
                </div>
                <div class="flex justify-end gap-2">
                    <Button label="Cancelar" severity="secondary" outlined @click="mostrarConfirmacion = false" />
                    <Button label="Eliminar" severity="danger" @click="ejecutarEliminacion" />
                </div>
            </div>
        </Dialog>
    </div>
</template>
