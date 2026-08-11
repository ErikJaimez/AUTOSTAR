<script setup>
import ReservacionForm from '@/components/reservaciones/ReservacionForm.vue';
import { useReservaciones } from '@/composables/useReservaciones';
import { formatearFechaCorta, formatearHora } from '@/utils/formatters';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { crearReservacion, cargando, error } = useReservaciones();

const cursoId = route.params.cursoId || route.query.cursoId;
const slotId = route.params.slotId || route.query.slotId;

const reservacionExitosa = ref(false);
const folioConfirmacion = ref('');
const slotNoDisponible = ref(false);
const alternativas = ref([]);
const formRef = ref(null);

async function enviarReservacion(datos) {
    reservacionExitosa.value = false;
    slotNoDisponible.value = false;
    alternativas.value = [];

    try {
        const resultado = await crearReservacion(datos);
        reservacionExitosa.value = true;
        folioConfirmacion.value = resultado.folio;
    } catch (err) {
        if (err.response?.status === 409) {
            // Slot ya no está disponible
            slotNoDisponible.value = true;
            const respuesta = err.response?.data;
            alternativas.value = respuesta?.alternativas || [];
        }
    }
}

function irACursos() {
    router.push({ name: 'catalogo-cursos' });
}

function seleccionarAlternativa(slot) {
    router.push({
        name: 'form-reservacion',
        params: { cursoId: cursoId, slotId: slot.id }
    });
    // Reset state
    slotNoDisponible.value = false;
    alternativas.value = [];
    if (formRef.value) {
        formRef.value.limpiar();
    }
}
</script>

<template>
    <div class="flex justify-center items-start min-h-screen bg-surface-50 dark:bg-surface-900 p-4 md:p-8 overflow-hidden">
        <div class="w-full max-w-lg">
            <!-- Encabezado -->
            <div class="text-center mb-6">
                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Reservar Clase</h1>
                <p class="text-surface-600 dark:text-surface-300">Completa tus datos para reservar tu lugar</p>
            </div>

            <!-- Confirmación exitosa -->
            <div v-if="reservacionExitosa" class="card text-center">
                <i class="pi pi-check-circle text-5xl text-green-500 mb-4"></i>
                <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">¡Reservación confirmada!</h2>
                <p class="text-surface-600 dark:text-surface-300 mb-4">Tu reservación ha sido registrada exitosamente.</p>
                <div class="bg-surface-100 dark:bg-surface-800 rounded-lg p-4 mb-4">
                    <p class="text-sm text-surface-500 dark:text-surface-400">Tu número de folio</p>
                    <p class="text-2xl font-bold text-primary">{{ folioConfirmacion }}</p>
                </div>
                <p class="text-sm text-surface-500 dark:text-surface-400 mb-4">Recibirás un correo con la confirmación y detalles de tu reservación.</p>
                <Button label="Ver cursos disponibles" icon="pi pi-arrow-left" severity="secondary" @click="irACursos" />
            </div>

            <!-- Slot no disponible + alternativas -->
            <div v-else-if="slotNoDisponible" class="card">
                <div class="text-center mb-4">
                    <i class="pi pi-exclamation-circle text-4xl text-orange-500 mb-3"></i>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Horario no disponible</h2>
                    <p class="text-surface-600 dark:text-surface-300">El horario seleccionado ya no tiene lugares disponibles.</p>
                </div>

                <div v-if="alternativas.length > 0">
                    <h3 class="font-semibold text-surface-700 dark:text-surface-200 mb-3">Horarios alternativos disponibles:</h3>
                    <div class="flex flex-col gap-2">
                        <div
                            v-for="slot in alternativas"
                            :key="slot.id"
                            class="flex items-center justify-between p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer"
                            @click="seleccionarAlternativa(slot)"
                        >
                            <div>
                                <p class="font-medium text-surface-900 dark:text-surface-0">{{ formatearFechaCorta(slot.fecha) }}</p>
                                <p class="text-sm text-surface-500 dark:text-surface-400">{{ formatearHora(slot.hora_inicio) }} - {{ formatearHora(slot.hora_fin) }}</p>
                            </div>
                            <Button icon="pi pi-arrow-right" text rounded />
                        </div>
                    </div>
                </div>

                <div v-else class="text-center mt-4">
                    <p class="text-surface-500 dark:text-surface-400 mb-3">No hay horarios alternativos disponibles en este momento.</p>
                </div>

                <div class="flex justify-center mt-4">
                    <Button label="Volver a cursos" icon="pi pi-arrow-left" severity="secondary" @click="irACursos" />
                </div>
            </div>

            <!-- Formulario de reservación -->
            <div v-else class="card">
                <!-- Error general -->
                <Message v-if="error && !slotNoDisponible" severity="error" :closable="false" class="mb-4">{{ error }}</Message>

                <ReservacionForm ref="formRef" :curso-id="cursoId" :slot-id="slotId" :cargando="cargando" @enviar="enviarReservacion" />
            </div>
        </div>
    </div>
</template>
