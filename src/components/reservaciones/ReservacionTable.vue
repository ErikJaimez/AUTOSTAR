<script setup>
import EstadoBadge from '@/components/reservaciones/EstadoBadge.vue';
import { useReservaciones } from '@/composables/useReservaciones';
import { formatearFechaCorta, formatearHora } from '@/utils/formatters';

defineProps({
    reservaciones: { type: Array, default: () => [] },
    cargando: { type: Boolean, default: false },
    totalRegistros: { type: Number, default: 0 },
    filasPorPagina: { type: Number, default: 20 }
});

const emit = defineEmits(['cambiarEstado', 'paginar']);
const { obtenerTransicionesDisponibles } = useReservaciones();

function onPage(event) {
    emit('paginar', event.page + 1);
}

function onCambiarEstado(reservacion, nuevoEstado) {
    emit('cambiarEstado', { reservacion, nuevoEstado });
}
</script>

<template>
    <DataTable :value="reservaciones" :loading="cargando" stripedRows paginator :rows="filasPorPagina" :totalRecords="totalRegistros" :lazy="true" @page="onPage" responsiveLayout="scroll" emptyMessage="No hay reservaciones registradas">
        <Column field="folio" header="Folio" sortable style="min-width: 120px" />
        <Column field="cliente_nombre" header="Cliente" sortable style="min-width: 180px" />
        <Column field="curso_nombre" header="Curso" sortable style="min-width: 160px" />
        <Column header="Fecha" sortable style="min-width: 120px">
            <template #body="{ data }">
                {{ formatearFechaCorta(data.slot_fecha) }}
            </template>
        </Column>
        <Column header="Hora" style="min-width: 120px">
            <template #body="{ data }"> {{ formatearHora(data.hora_inicio) }} - {{ formatearHora(data.hora_fin) }} </template>
        </Column>
        <Column header="Estado" sortable style="min-width: 120px">
            <template #body="{ data }">
                <EstadoBadge :estado="data.estado" />
            </template>
        </Column>
        <Column header="Acciones" style="min-width: 180px">
            <template #body="{ data }">
                <div class="flex gap-2 items-center">
                    <Select v-if="obtenerTransicionesDisponibles(data.estado).length > 0" :options="obtenerTransicionesDisponibles(data.estado)" placeholder="Cambiar estado" class="w-40" @change="(e) => onCambiarEstado(data, e.value)" />
                    <span v-else class="text-surface-400 text-sm italic">Sin acciones</span>
                </div>
            </template>
        </Column>
    </DataTable>
</template>
