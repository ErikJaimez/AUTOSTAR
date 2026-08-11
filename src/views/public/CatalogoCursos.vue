<script setup>
import CursoCard from '@/components/cursos/CursoCard.vue';
import CursoCategoria from '@/components/cursos/CursoCategoria.vue';
import { useCursos } from '@/composables/useCursos';
import { computed, onMounted } from 'vue';

const { cursos, cargando, error, cargarCursos } = useCursos();

// Agrupar cursos por categoría de licencia
const cursosPorCategoria = computed(() => {
    const grupos = {};
    for (const curso of cursos.value) {
        const cat = curso.categoria_licencia || 'Sin categoría';
        if (!grupos[cat]) {
            grupos[cat] = [];
        }
        grupos[cat].push(curso);
    }
    return grupos;
});

const tieneCursos = computed(() => cursos.value.length > 0);

onMounted(() => {
    cargarCursos();
});
</script>

<template>
    <div class="px-4 py-8 md:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Nuestros Cursos</h1>
            <p class="text-surface-600 dark:text-surface-300">Encuentra el curso ideal para obtener tu licencia de conducir</p>
        </div>

        <!-- Estado de carga -->
        <div v-if="cargando" class="flex flex-col gap-6">
            <div v-for="i in 2" :key="i" class="flex flex-col gap-4">
                <Skeleton width="200px" height="28px" class="mb-2" />
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div v-for="j in 3" :key="j" class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <Skeleton width="80%" height="24px" class="mb-3" />
                        <Skeleton width="100%" height="40px" class="mb-3" />
                        <div class="flex justify-between">
                            <Skeleton width="100px" height="20px" />
                            <Skeleton width="80px" height="24px" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Estado de error -->
        <div v-else-if="error" class="flex flex-col items-center justify-center py-16">
            <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
            <p class="text-lg text-surface-700 dark:text-surface-200 mb-4">{{ error }}</p>
            <Button label="Reintentar" icon="pi pi-refresh" @click="cargarCursos" />
        </div>

        <!-- Estado vacío -->
        <div v-else-if="!tieneCursos" class="flex flex-col items-center justify-center py-16">
            <i class="pi pi-book text-4xl text-surface-400 mb-4"></i>
            <p class="text-lg text-surface-600 dark:text-surface-300">No hay cursos disponibles en este momento</p>
        </div>

        <!-- Listado de cursos agrupados por categoría -->
        <div v-else>
            <CursoCategoria v-for="(cursosGrupo, categoria) in cursosPorCategoria" :key="categoria" :categoria="categoria">
                <CursoCard v-for="curso in cursosGrupo" :key="curso.id" :curso="curso" />
            </CursoCategoria>
        </div>
    </div>
</template>
