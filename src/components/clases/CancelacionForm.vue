<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    clase: {
        type: Object,
        required: true
    },
    visible: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['confirmar', 'cancelar', 'update:visible']);

const motivo = ref('');
const enviando = ref(false);

const motivoValido = computed(() => {
    return motivo.value.length >= 10 && motivo.value.length <= 500;
});

const caracteresRestantes = computed(() => {
    return 500 - motivo.value.length;
});

const mensajeValidacion = computed(() => {
    if (motivo.value.length === 0) return '';
    if (motivo.value.length < 10) return `Mínimo 10 caracteres (faltan ${10 - motivo.value.length})`;
    return '';
});

async function onConfirmar() {
    if (!motivoValido.value) return;

    enviando.value = true;
    try {
        emit('confirmar', { claseId: props.clase.id, motivo: motivo.value });
    } finally {
        enviando.value = false;
    }
}

function onCancelar() {
    motivo.value = '';
    emit('cancelar');
    emit('update:visible', false);
}

function onHide() {
    motivo.value = '';
    emit('update:visible', false);
}
</script>

<template>
    <Dialog :visible="visible" @update:visible="onHide" modal header="Cancelar clase" :style="{ width: '500px' }" :closable="true">
        <div class="space-y-4">
            <div class="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                    <i class="pi pi-exclamation-triangle text-orange-500"></i>
                    <span class="font-medium text-orange-700 dark:text-orange-300">Atención</span>
                </div>
                <p class="text-sm text-orange-600 dark:text-orange-400">Al cancelar esta clase, las horas se mantendrán como pendientes en el avance del alumno. Solo clases en estado "programada" pueden ser canceladas.</p>
            </div>

            <div v-if="clase" class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <p class="text-sm text-surface-600 dark:text-surface-300"><strong>Fecha:</strong> {{ clase.fecha }} | <strong>Horario:</strong> {{ clase.hora_inicio }} - {{ clase.hora_fin }}</p>
                <p v-if="clase.instructor_nombre" class="text-sm text-surface-600 dark:text-surface-300 mt-1"><strong>Instructor:</strong> {{ clase.instructor_nombre }}</p>
            </div>

            <div class="flex flex-col gap-2">
                <label for="motivo" class="font-medium text-surface-700 dark:text-surface-200">Motivo de cancelación <span class="text-red-500">*</span></label>
                <Textarea id="motivo" v-model="motivo" rows="4" placeholder="Ingrese el motivo de la cancelación (mínimo 10 caracteres)" class="w-full" :class="{ 'p-invalid': motivo.length > 0 && !motivoValido }" />
                <div class="flex justify-between text-sm">
                    <span v-if="mensajeValidacion" class="text-red-500">{{ mensajeValidacion }}</span>
                    <span v-else class="text-surface-400"></span>
                    <span :class="caracteresRestantes < 50 ? 'text-orange-500' : 'text-surface-400'">{{ caracteresRestantes }} caracteres restantes</span>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="No, mantener" icon="pi pi-arrow-left" severity="secondary" @click="onCancelar" :disabled="enviando" />
                <Button label="Sí, cancelar clase" icon="pi pi-times" severity="danger" @click="onConfirmar" :disabled="!motivoValido || enviando" :loading="enviando" />
            </div>
        </template>
    </Dialog>
</template>
