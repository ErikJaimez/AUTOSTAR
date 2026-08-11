<script setup>
defineProps({
    categoria: {
        type: String,
        required: true
    }
});
</script>

<template>
    <div class="mb-6">
        <div class="flex items-center gap-3 mb-4">
            <i class="pi pi-car text-xl text-primary"></i>
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Licencia {{ categoria }}</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <slot></slot>
        </div>
    </div>
</template>
