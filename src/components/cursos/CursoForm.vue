<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
    curso: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['guardar', 'cancelar']);

const formulario = reactive({
    nombre: '',
    descripcion: '',
    descripcion_resumida: '',
    duracion_horas: null,
    precio: null,
    categoria_licencia: '',
    requisitos_previos: '',
    activo: true
});

const errores = reactive({
    nombre: '',
    descripcion: '',
    duracion_horas: '',
    precio: '',
    categoria_licencia: ''
});

const categoriasLicencia = [
    { label: 'Tipo A - Automovilista', value: 'A' },
    { label: 'Tipo B - Chofer particular', value: 'B' },
    { label: 'Tipo C - Transporte público', value: 'C' },
    { label: 'Tipo D - Motociclista', value: 'D' },
    { label: 'Tipo E - Transporte de carga', value: 'E' }
];

// Cargar datos si se está editando
watch(
    () => props.curso,
    (nuevo) => {
        if (nuevo) {
            formulario.nombre = nuevo.nombre || '';
            formulario.descripcion = nuevo.descripcion || '';
            formulario.descripcion_resumida = nuevo.descripcion_resumida || '';
            formulario.duracion_horas = nuevo.duracion_horas || null;
            formulario.precio = nuevo.precio || null;
            formulario.categoria_licencia = nuevo.categoria_licencia || '';
            formulario.requisitos_previos = nuevo.requisitos_previos || '';
            formulario.activo = nuevo.activo !== undefined ? nuevo.activo : true;
        }
    },
    { immediate: true }
);

function limpiarErrores() {
    errores.nombre = '';
    errores.descripcion = '';
    errores.duracion_horas = '';
    errores.precio = '';
    errores.categoria_licencia = '';
}

function validar() {
    limpiarErrores();
    let valido = true;

    if (!formulario.nombre || formulario.nombre.trim().length === 0) {
        errores.nombre = 'El nombre es obligatorio';
        valido = false;
    } else if (formulario.nombre.length > 100) {
        errores.nombre = 'El nombre no puede exceder 100 caracteres';
        valido = false;
    }

    if (!formulario.descripcion || formulario.descripcion.trim().length === 0) {
        errores.descripcion = 'La descripción es obligatoria';
        valido = false;
    } else if (formulario.descripcion.length > 2000) {
        errores.descripcion = 'La descripción no puede exceder 2000 caracteres';
        valido = false;
    }

    if (!formulario.duracion_horas) {
        errores.duracion_horas = 'La duración es obligatoria';
        valido = false;
    } else if (formulario.duracion_horas < 1 || formulario.duracion_horas > 200) {
        errores.duracion_horas = 'La duración debe estar entre 1 y 200 horas';
        valido = false;
    }

    if (!formulario.precio && formulario.precio !== 0) {
        errores.precio = 'El precio es obligatorio';
        valido = false;
    } else if (formulario.precio < 0.01 || formulario.precio > 99999.99) {
        errores.precio = 'El precio debe estar entre $0.01 y $99,999.99';
        valido = false;
    }

    if (!formulario.categoria_licencia) {
        errores.categoria_licencia = 'La categoría de licencia es obligatoria';
        valido = false;
    }

    return valido;
}

function enviar() {
    if (validar()) {
        emit('guardar', { ...formulario });
    }
}

function cancelar() {
    emit('cancelar');
}
</script>

<template>
    <form @submit.prevent="enviar" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
            <label for="nombre" class="font-medium text-surface-900 dark:text-surface-0">Nombre *</label>
            <InputText id="nombre" v-model="formulario.nombre" :invalid="!!errores.nombre" placeholder="Nombre del curso" />
            <small v-if="errores.nombre" class="text-red-500">{{ errores.nombre }}</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="descripcion" class="font-medium text-surface-900 dark:text-surface-0">Descripción *</label>
            <Textarea id="descripcion" v-model="formulario.descripcion" :invalid="!!errores.descripcion" rows="4" placeholder="Descripción completa del curso" />
            <small class="text-surface-500">{{ formulario.descripcion?.length || 0 }}/2000</small>
            <small v-if="errores.descripcion" class="text-red-500">{{ errores.descripcion }}</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="descripcion_resumida" class="font-medium text-surface-900 dark:text-surface-0">Descripción resumida</label>
            <InputText id="descripcion_resumida" v-model="formulario.descripcion_resumida" placeholder="Resumen breve (máx 150 caracteres)" maxlength="150" />
            <small class="text-surface-500">{{ formulario.descripcion_resumida?.length || 0 }}/150</small>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
                <label for="duracion_horas" class="font-medium text-surface-900 dark:text-surface-0">Duración (horas) *</label>
                <InputNumber id="duracion_horas" v-model="formulario.duracion_horas" :invalid="!!errores.duracion_horas" :min="1" :max="200" placeholder="Horas totales" />
                <small v-if="errores.duracion_horas" class="text-red-500">{{ errores.duracion_horas }}</small>
            </div>

            <div class="flex flex-col gap-1">
                <label for="precio" class="font-medium text-surface-900 dark:text-surface-0">Precio (MXN) *</label>
                <InputNumber id="precio" v-model="formulario.precio" :invalid="!!errores.precio" mode="currency" currency="MXN" locale="es-MX" :min="0.01" :max="99999.99" placeholder="Precio" />
                <small v-if="errores.precio" class="text-red-500">{{ errores.precio }}</small>
            </div>
        </div>

        <div class="flex flex-col gap-1">
            <label for="categoria_licencia" class="font-medium text-surface-900 dark:text-surface-0">Categoría de licencia *</label>
            <Select id="categoria_licencia" v-model="formulario.categoria_licencia" :options="categoriasLicencia" optionLabel="label" optionValue="value" :invalid="!!errores.categoria_licencia" placeholder="Selecciona una categoría" />
            <small v-if="errores.categoria_licencia" class="text-red-500">{{ errores.categoria_licencia }}</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="requisitos_previos" class="font-medium text-surface-900 dark:text-surface-0">Requisitos previos</label>
            <Textarea id="requisitos_previos" v-model="formulario.requisitos_previos" rows="2" placeholder="Requisitos previos (opcional)" />
        </div>

        <div class="flex items-center gap-2">
            <ToggleSwitch v-model="formulario.activo" inputId="activo" />
            <label for="activo" class="font-medium text-surface-900 dark:text-surface-0">Curso activo</label>
        </div>

        <div class="flex justify-end gap-2 pt-4">
            <Button type="button" label="Cancelar" severity="secondary" @click="cancelar" />
            <Button type="submit" label="Guardar" icon="pi pi-check" />
        </div>
    </form>
</template>
