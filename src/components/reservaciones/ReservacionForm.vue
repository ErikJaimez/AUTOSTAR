<script setup>
import { validarFormularioReservacion } from '@/utils/validators';
import { esZonaServicio } from '@/utils/zonaServicio';
import { reactive, ref } from 'vue';

const props = defineProps({
    cursoId: { type: String, default: null },
    slotId: { type: String, default: null },
    cargando: { type: Boolean, default: false }
});

const emit = defineEmits(['enviar']);

const formulario = reactive({
    nombre_completo: '',
    edad: null,
    direccion: '',
    codigo_postal: '',
    telefono: '',
    email: ''
});

const errores = ref({});
const errorZona = ref(null);

function validar() {
    errores.value = {};
    errorZona.value = null;

    // Validar campos del formulario
    const resultado = validarFormularioReservacion(formulario);

    if (!resultado.valido) {
        errores.value = resultado.errores;
        return false;
    }

    // Validar zona de servicio
    if (!esZonaServicio(formulario.codigo_postal)) {
        errorZona.value = 'El servicio está disponible únicamente para la zona sur de CDMX';
        errores.value.codigo_postal = errorZona.value;
        return false;
    }

    return true;
}

function enviar() {
    if (!validar()) return;

    emit('enviar', {
        ...formulario,
        curso_id: props.cursoId,
        slot_horario_id: props.slotId
    });
}

function limpiar() {
    formulario.nombre_completo = '';
    formulario.edad = null;
    formulario.direccion = '';
    formulario.codigo_postal = '';
    formulario.telefono = '';
    formulario.email = '';
    errores.value = {};
    errorZona.value = null;
}

defineExpose({ limpiar });
</script>

<template>
    <form @submit.prevent="enviar" class="flex flex-col gap-4">
        <!-- Nombre completo -->
        <div class="flex flex-col gap-1">
            <label for="nombre_completo" class="font-semibold text-surface-700 dark:text-surface-200">Nombre completo</label>
            <InputText id="nombre_completo" v-model="formulario.nombre_completo" placeholder="Tu nombre completo" :invalid="!!errores.nombre_completo" maxlength="120" />
            <small v-if="errores.nombre_completo" class="text-red-500">{{ errores.nombre_completo }}</small>
        </div>

        <!-- Edad -->
        <div class="flex flex-col gap-1">
            <label for="edad" class="font-semibold text-surface-700 dark:text-surface-200">Edad</label>
            <InputNumber id="edad" v-model="formulario.edad" placeholder="Tu edad" :invalid="!!errores.edad" :min="16" :max="99" :useGrouping="false" />
            <small v-if="errores.edad" class="text-red-500">{{ errores.edad }}</small>
        </div>

        <!-- Dirección -->
        <div class="flex flex-col gap-1">
            <label for="direccion" class="font-semibold text-surface-700 dark:text-surface-200">Dirección (colonia)</label>
            <InputText id="direccion" v-model="formulario.direccion" placeholder="Colonia o dirección" :invalid="!!errores.direccion" />
        </div>

        <!-- Código postal -->
        <div class="flex flex-col gap-1">
            <label for="codigo_postal" class="font-semibold text-surface-700 dark:text-surface-200">Código Postal</label>
            <InputText id="codigo_postal" v-model="formulario.codigo_postal" placeholder="Ej: 14000" :invalid="!!errores.codigo_postal" maxlength="5" />
            <small v-if="errores.codigo_postal" class="text-red-500">{{ errores.codigo_postal }}</small>
            <small v-if="errorZona && !errores.codigo_postal" class="text-red-500">{{ errorZona }}</small>
        </div>

        <!-- Teléfono -->
        <div class="flex flex-col gap-1">
            <label for="telefono" class="font-semibold text-surface-700 dark:text-surface-200">Teléfono</label>
            <InputText id="telefono" v-model="formulario.telefono" placeholder="10 dígitos" :invalid="!!errores.telefono" maxlength="10" />
            <small v-if="errores.telefono" class="text-red-500">{{ errores.telefono }}</small>
        </div>

        <!-- Email -->
        <div class="flex flex-col gap-1">
            <label for="email" class="font-semibold text-surface-700 dark:text-surface-200">Correo electrónico</label>
            <InputText id="email" v-model="formulario.email" placeholder="correo@ejemplo.com" :invalid="!!errores.email" type="email" />
            <small v-if="errores.email" class="text-red-500">{{ errores.email }}</small>
        </div>

        <!-- Botón enviar -->
        <div class="flex justify-end mt-2">
            <Button type="submit" label="Reservar" icon="pi pi-check" :loading="cargando" />
        </div>
    </form>
</template>
