<script setup>
const props = defineProps({
    curso: {
        type: Object,
        required: true
    }
});

function formatPrecio(precio) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precio);
}

function truncarDescripcion(texto) {
    if (!texto) return '';
    return texto.length > 150 ? texto.substring(0, 150) + '...' : texto;
}
</script>

<template>
    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer min-h-[44px]">
        <router-link :to="{ name: 'detalle-curso', params: { id: props.curso.id } }" class="no-underline text-inherit block min-h-[44px]">
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-2">{{ props.curso.nombre }}</h3>
            <p class="text-surface-600 dark:text-surface-300 text-sm mb-3">{{ truncarDescripcion(props.curso.descripcion_resumida || props.curso.descripcion) }}</p>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <i class="pi pi-clock text-primary"></i>
                    <span class="text-sm text-surface-600 dark:text-surface-300">{{ props.curso.duracion_horas }} horas</span>
                </div>
                <span class="text-lg font-bold text-primary">{{ formatPrecio(props.curso.precio) }}</span>
            </div>
        </router-link>
    </div>
</template>
