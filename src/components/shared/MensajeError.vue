<script setup>
defineProps({
    mensaje: {
        type: String,
        required: true
    },
    reintentar: {
        type: Function,
        default: null
    }
});
</script>

<template>
    <div class="flex flex-col items-center justify-center py-8 gap-4">
        <div class="flex items-center gap-3 text-red-500">
            <i class="pi pi-exclamation-circle text-3xl"></i>
            <p class="text-base text-surface-700 dark:text-surface-200">{{ mensaje }}</p>
        </div>
        <Button v-if="reintentar" icon="pi pi-refresh" label="Reintentar" severity="secondary" outlined @click="reintentar" />
    </div>
</template>
