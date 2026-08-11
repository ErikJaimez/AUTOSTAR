<script setup>
defineProps({
    cargando: {
        type: Boolean,
        required: true
    },
    mensaje: {
        type: String,
        default: 'Cargando...'
    }
});
</script>

<template>
    <div v-if="cargando" class="flex flex-col items-center justify-center py-8 gap-4">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" animationDuration="1s" />
        <p class="text-surface-600 dark:text-surface-300 text-base">{{ mensaje }}</p>
    </div>
</template>
