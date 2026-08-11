<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
    instructor: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['guardar', 'cancelar']);

const form = reactive({
    nombre_completo: '',
    telefono: '',
    email: '',
    activo: true
});

const errores = reactive({
    nombre_completo: '',
    telefono: '',
    email: ''
});

// Cargar datos cuando se edita un instructor existente
watch(
    () => props.instructor,
    (val) => {
        if (val) {
            form.nombre_completo = val.nombre_completo || '';
            form.telefono = val.telefono || '';
            form.email = val.email || '';
            form.activo = val.activo !== undefined ? val.activo : true;
        } else {
            form.nombre_completo = '';
            form.telefono = '';
            form.email = '';
            form.activo = true;
        }
        limpiarErrores();
    },
    { immediate: true }
);

function limpiarErrores() {
    errores.nombre_completo = '';
    errores.telefono = '';
    errores.email = '';
}

function validar() {
    let valido = true;
    limpiarErrores();

    if (!form.nombre_completo.trim() || form.nombre_completo.trim().length > 120) {
        errores.nombre_completo = 'El nombre es obligatorio (máximo 120 caracteres)';
        valido = false;
    }

    if (!/^\d{10}$/.test(form.telefono)) {
        errores.telefono = 'El teléfono debe tener exactamente 10 dígitos numéricos';
        valido = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email) || form.email.length > 150) {
        errores.email = 'Ingrese un correo electrónico válido (máximo 150 caracteres)';
        valido = false;
    }

    return valido;
}

function onSubmit() {
    if (!validar()) return;

    emit('guardar', {
        nombre_completo: form.nombre_completo.trim(),
        telefono: form.telefono,
        email: form.email.trim(),
        activo: form.activo
    });
}

function onCancelar() {
    emit('cancelar');
}
</script>

<template>
    <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
            <label for="nombre_completo" class="font-medium">Nombre completo</label>
            <InputText id="nombre_completo" v-model="form.nombre_completo" placeholder="Nombre completo del instructor" :invalid="!!errores.nombre_completo" />
            <small v-if="errores.nombre_completo" class="text-red-500">{{ errores.nombre_completo }}</small>
        </div>

        <div class="flex flex-col gap-2">
            <label for="telefono" class="font-medium">Teléfono</label>
            <InputText id="telefono" v-model="form.telefono" placeholder="10 dígitos" maxlength="10" :invalid="!!errores.telefono" />
            <small v-if="errores.telefono" class="text-red-500">{{ errores.telefono }}</small>
        </div>

        <div class="flex flex-col gap-2">
            <label for="email" class="font-medium">Correo electrónico</label>
            <InputText id="email" v-model="form.email" placeholder="correo@ejemplo.com" :invalid="!!errores.email" />
            <small v-if="errores.email" class="text-red-500">{{ errores.email }}</small>
        </div>

        <div class="flex items-center gap-3">
            <label for="activo" class="font-medium">Estado</label>
            <ToggleButton v-model="form.activo" onLabel="Activo" offLabel="Inactivo" onIcon="pi pi-check" offIcon="pi pi-times" />
        </div>

        <div class="flex justify-end gap-2 mt-4">
            <Button label="Cancelar" severity="secondary" outlined @click="onCancelar" type="button" />
            <Button label="Guardar" type="submit" icon="pi pi-save" />
        </div>
    </form>
</template>
