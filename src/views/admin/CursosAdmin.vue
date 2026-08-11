<script setup>
import CursoForm from '@/components/cursos/CursoForm.vue';
import { useCursos } from '@/composables/useCursos';
import { ref } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

const { cursos, cargando, error, cargarCursos, crearCurso, actualizarCurso, eliminarCurso } = useCursos();
const confirm = useConfirm();
const toast = useToast();

const dialogVisible = ref(false);
const cursoEditando = ref(null);
const guardando = ref(false);

function formatPrecio(precio) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precio);
}

function abrirNuevo() {
    cursoEditando.value = null;
    dialogVisible.value = true;
}

function abrirEditar(curso) {
    cursoEditando.value = { ...curso };
    dialogVisible.value = true;
}

function cerrarDialog() {
    dialogVisible.value = false;
    cursoEditando.value = null;
}

async function guardarCurso(datos) {
    guardando.value = true;
    try {
        if (cursoEditando.value?.id) {
            await actualizarCurso(cursoEditando.value.id, datos);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Curso actualizado correctamente', life: 3000 });
        } else {
            await crearCurso(datos);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Curso creado correctamente', life: 3000 });
        }
        cerrarDialog();
    } catch (err) {
        const respuesta = err.response?.data;
        if (err.response?.status === 409) {
            toast.add({ severity: 'warn', summary: 'Conflicto', detail: respuesta?.mensaje || 'El curso tiene reservaciones activas', life: 5000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: respuesta?.mensaje || 'No se pudo guardar el curso', life: 3000 });
        }
    } finally {
        guardando.value = false;
    }
}

function confirmarEliminar(curso) {
    confirm.require({
        message: `¿Estás seguro de que deseas eliminar el curso "${curso.nombre}"?`,
        header: 'Confirmar eliminación',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Eliminar',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await eliminarCurso(curso.id);
                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Curso eliminado correctamente', life: 3000 });
            } catch (err) {
                const respuesta = err.response?.data;
                if (err.response?.status === 409) {
                    toast.add({ severity: 'warn', summary: 'No se puede eliminar', detail: respuesta?.mensaje || 'El curso tiene reservaciones activas asociadas', life: 5000 });
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: respuesta?.mensaje || 'No se pudo eliminar el curso', life: 3000 });
                }
            }
        }
    });
}

// Cargar cursos al montar
cargarCursos();
</script>

<template>
    <div class="card">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Gestión de Cursos</h2>
            <Button label="Nuevo Curso" icon="pi pi-plus" @click="abrirNuevo" />
        </div>

        <!-- Estado de error -->
        <div v-if="error && !cargando" class="flex flex-col items-center py-8">
            <i class="pi pi-exclamation-triangle text-3xl text-orange-500 mb-3"></i>
            <p class="text-surface-600 dark:text-surface-300 mb-3">{{ error }}</p>
            <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="cargarCursos" />
        </div>

        <!-- Tabla de cursos -->
        <DataTable v-else :value="cursos" :loading="cargando" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 20]" responsiveLayout="scroll" emptyMessage="No hay cursos registrados">
            <Column field="nombre" header="Nombre" sortable style="min-width: 200px" />
            <Column field="duracion_horas" header="Duración (hrs)" sortable style="min-width: 130px">
                <template #body="{ data }"> {{ data.duracion_horas }} h </template>
            </Column>
            <Column field="precio" header="Precio" sortable style="min-width: 130px">
                <template #body="{ data }">
                    {{ formatPrecio(data.precio) }}
                </template>
            </Column>
            <Column field="categoria_licencia" header="Categoría" sortable style="min-width: 120px">
                <template #body="{ data }">
                    <Tag :value="'Tipo ' + data.categoria_licencia" />
                </template>
            </Column>
            <Column field="activo" header="Estado" sortable style="min-width: 100px">
                <template #body="{ data }">
                    <Tag :value="data.activo ? 'Activo' : 'Inactivo'" :severity="data.activo ? 'success' : 'danger'" />
                </template>
            </Column>
            <Column header="Acciones" style="min-width: 150px">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" severity="info" text rounded @click="abrirEditar(data)" />
                        <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmarEliminar(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Dialog para crear/editar -->
        <Dialog v-model:visible="dialogVisible" :header="cursoEditando ? 'Editar Curso' : 'Nuevo Curso'" :modal="true" :style="{ width: '600px' }" :breakpoints="{ '768px': '90vw', '576px': '95vw' }" :closable="!guardando">
            <CursoForm :curso="cursoEditando" @guardar="guardarCurso" @cancelar="cerrarDialog" />
        </Dialog>

        <!-- ConfirmDialog para eliminación -->
        <ConfirmDialog />
        <Toast />
    </div>
</template>
