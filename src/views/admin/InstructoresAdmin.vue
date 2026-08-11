<script setup>
import AgendaInstructor from '@/components/instructores/AgendaInstructor.vue';
import InstructorForm from '@/components/instructores/InstructorForm.vue';
import InstructorTable from '@/components/instructores/InstructorTable.vue';
import { useInstructores } from '@/composables/useInstructores';
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const { instructores, agenda, cargando, error, cargarInstructores, crearInstructor, actualizarInstructor, cargarAgenda } = useInstructores();

// Estado del diálogo de formulario
const mostrarFormulario = ref(false);
const instructorEditando = ref(null);
const tituloFormulario = ref('Nuevo Instructor');

// Estado del diálogo de agenda
const mostrarAgenda = ref(false);
const instructorAgenda = ref(null);
const cargandoAgenda = ref(false);

// Estado del diálogo de confirmación de desactivación
const mostrarConfirmacion = ref(false);
const instructorConfirmacion = ref(null);
const mensajeConfirmacion = ref('');

onMounted(() => {
    cargarInstructores();
});

// --- Formulario crear/editar ---
function abrirCrear() {
    instructorEditando.value = null;
    tituloFormulario.value = 'Nuevo Instructor';
    mostrarFormulario.value = true;
}

function abrirEditar(instructor) {
    instructorEditando.value = { ...instructor };
    tituloFormulario.value = 'Editar Instructor';
    mostrarFormulario.value = true;
}

async function guardarInstructor(datos) {
    try {
        if (instructorEditando.value) {
            await actualizarInstructor(instructorEditando.value.id, datos);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Instructor actualizado correctamente', life: 3000 });
        } else {
            await crearInstructor(datos);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Instructor creado correctamente', life: 3000 });
        }
        mostrarFormulario.value = false;
    } catch (err) {
        const respuesta = err.response?.data;
        // Mostrar error específico del backend
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: respuesta?.mensaje || 'No se pudieron guardar los cambios',
            life: 5000
        });
    }
}

// --- Agenda ---
function abrirAgenda(instructor) {
    instructorAgenda.value = instructor;
    mostrarAgenda.value = true;
}

async function cambiarSemanaAgenda(fecha) {
    if (!instructorAgenda.value) return;
    cargandoAgenda.value = true;
    try {
        await cargarAgenda(instructorAgenda.value.id, fecha);
    } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la agenda', life: 3000 });
    } finally {
        cargandoAgenda.value = false;
    }
}

// --- Toggle estado (activar/desactivar) ---
async function toggleEstado(instructor) {
    if (instructor.activo) {
        // Intentar desactivar — puede tener clases futuras (CONFLICTO del API)
        instructorConfirmacion.value = instructor;
        mensajeConfirmacion.value = `¿Está seguro de desactivar a ${instructor.nombre_completo}?`;
        mostrarConfirmacion.value = true;
    } else {
        // Activar directamente
        try {
            await actualizarInstructor(instructor.id, { ...instructor, activo: true });
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Instructor activado correctamente', life: 3000 });
        } catch (err) {
            const respuesta = err.response?.data;
            toast.add({ severity: 'error', summary: 'Error', detail: respuesta?.mensaje || 'No se pudo activar el instructor', life: 5000 });
        }
    }
}

async function confirmarDesactivacion() {
    if (!instructorConfirmacion.value) return;
    try {
        await actualizarInstructor(instructorConfirmacion.value.id, { ...instructorConfirmacion.value, activo: false });
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Instructor desactivado correctamente', life: 3000 });
    } catch (err) {
        const respuesta = err.response?.data;
        // Si el backend responde con tipo CONFLICTO, mostrar advertencia sobre clases futuras
        if (respuesta?.tipo === 'CONFLICTO') {
            toast.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: respuesta.mensaje || 'El instructor tiene clases programadas que deben reasignarse',
                life: 8000
            });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: respuesta?.mensaje || 'No se pudo desactivar el instructor', life: 5000 });
        }
    } finally {
        mostrarConfirmacion.value = false;
        instructorConfirmacion.value = null;
    }
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <Toast />

        <!-- Encabezado -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 class="text-2xl font-bold m-0">Instructores</h2>
            <Button label="Nuevo Instructor" icon="pi pi-plus" @click="abrirCrear" />
        </div>

        <!-- Mensaje de error general -->
        <Message v-if="error" severity="error" :closable="true" @close="error = null">
            {{ error }}
        </Message>

        <!-- Tabla de instructores -->
        <InstructorTable :instructores="instructores" :cargando="cargando" @editar="abrirEditar" @ver-agenda="abrirAgenda" @toggle-estado="toggleEstado" />

        <!-- Diálogo de formulario crear/editar -->
        <Dialog v-model:visible="mostrarFormulario" :header="tituloFormulario" modal :style="{ width: '500px' }" :breakpoints="{ '768px': '90vw' }">
            <InstructorForm :instructor="instructorEditando" @guardar="guardarInstructor" @cancelar="mostrarFormulario = false" />
        </Dialog>

        <!-- Diálogo de agenda -->
        <Dialog v-model:visible="mostrarAgenda" header="Agenda Semanal" modal :style="{ width: '700px' }" :breakpoints="{ '768px': '95vw' }">
            <AgendaInstructor v-if="instructorAgenda" :instructor="instructorAgenda" :agenda="agenda" :cargando="cargandoAgenda" @cambiar-semana="cambiarSemanaAgenda" />
        </Dialog>

        <!-- Diálogo de confirmación de desactivación -->
        <Dialog v-model:visible="mostrarConfirmacion" header="Confirmar desactivación" modal :style="{ width: '400px' }" :breakpoints="{ '576px': '90vw' }">
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3">
                    <i class="pi pi-exclamation-triangle text-yellow-500 text-2xl"></i>
                    <span>{{ mensajeConfirmacion }}</span>
                </div>
                <p class="text-sm text-surface-500 m-0">Si el instructor tiene clases programadas futuras, deberán ser reasignadas antes de proceder.</p>
                <div class="flex justify-end gap-2">
                    <Button label="Cancelar" severity="secondary" outlined @click="mostrarConfirmacion = false" />
                    <Button label="Desactivar" severity="danger" @click="confirmarDesactivacion" />
                </div>
            </div>
        </Dialog>
    </div>
</template>
