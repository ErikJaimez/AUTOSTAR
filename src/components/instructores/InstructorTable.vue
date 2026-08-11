<script setup>
defineProps({
    instructores: {
        type: Array,
        required: true
    },
    cargando: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['editar', 'ver-agenda', 'toggle-estado']);
</script>

<template>
    <DataTable :value="instructores" :loading="cargando" stripedRows responsiveLayout="scroll" class="w-full" dataKey="id">
        <template #empty>
            <div class="text-center py-6 text-surface-500">No hay instructores registrados</div>
        </template>

        <Column field="nombre_completo" header="Nombre" sortable class="min-w-[200px]" />

        <Column field="telefono" header="Teléfono" class="min-w-[120px]">
            <template #body="{ data }">
                <span>{{ data.telefono }}</span>
            </template>
        </Column>

        <Column field="email" header="Correo electrónico" class="min-w-[200px]">
            <template #body="{ data }">
                <span>{{ data.email }}</span>
            </template>
        </Column>

        <Column field="activo" header="Estado" class="min-w-[100px]">
            <template #body="{ data }">
                <Tag :value="data.activo ? 'Activo' : 'Inactivo'" :severity="data.activo ? 'success' : 'danger'" />
            </template>
        </Column>

        <Column field="clases_asignadas" header="Clases asignadas" class="min-w-[130px]">
            <template #body="{ data }">
                <span>{{ data.clases_asignadas ?? 0 }}</span>
            </template>
        </Column>

        <Column header="Acciones" class="min-w-[200px]">
            <template #body="{ data }">
                <div class="flex gap-2">
                    <Button icon="pi pi-pencil" severity="info" text rounded aria-label="Editar" @click="emit('editar', data)" />
                    <Button icon="pi pi-calendar" severity="secondary" text rounded aria-label="Ver agenda" @click="emit('ver-agenda', data)" />
                    <Button :icon="data.activo ? 'pi pi-ban' : 'pi pi-check-circle'" :severity="data.activo ? 'warn' : 'success'" text rounded :aria-label="data.activo ? 'Desactivar' : 'Activar'" @click="emit('toggle-estado', data)" />
                </div>
            </template>
        </Column>
    </DataTable>
</template>
