<script setup>
import { useCursos } from '@/composables/useCursos';
import { useInstructores } from '@/composables/useInstructores';
import { computed, onMounted, reactive, ref, watch } from 'vue';

const props = defineProps({
    horarioEditar: {
        type: Object,
        default: null
    },
    errorConflicto: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['guardar', 'cancelar']);

const { cursos, cargarCursos } = useCursos();
const { instructores, cargarInstructores } = useInstructores();

// Solo instructores activos
const instructoresActivos = computed(() => instructores.value.filter((i) => i.activo));

// Estado del formulario
const form = reactive({
    curso_id: '',
    instructor_id: '',
    fecha: null,
    hora_inicio: '',
    hora_fin: '',
    capacidad_maxima: 1
});

const errores = reactive({
    curso_id: '',
    instructor_id: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    capacidad_maxima: ''
});

const enviando = ref(false);

// Cargar datos al montar
onMounted(async () => {
    await Promise.all([cargarCursos(), cargarInstructores()]);
});

// Si recibimos un slot para editar, prellenar
watch(
    () => props.horarioEditar,
    (nuevoSlot) => {
        if (nuevoSlot) {
            form.curso_id = nuevoSlot.curso_id || '';
            form.instructor_id = nuevoSlot.instructor_id || '';
            form.fecha = nuevoSlot.fecha ? new Date(nuevoSlot.fecha + 'T00:00:00') : null;
            form.hora_inicio = nuevoSlot.hora_inicio?.substring(0, 5) || '';
            form.hora_fin = nuevoSlot.hora_fin?.substring(0, 5) || '';
            form.capacidad_maxima = nuevoSlot.capacidad_maxima || 1;
        } else {
            resetForm();
        }
    },
    { immediate: true }
);

function resetForm() {
    form.curso_id = '';
    form.instructor_id = '';
    form.fecha = null;
    form.hora_inicio = '';
    form.hora_fin = '';
    form.capacidad_maxima = 1;
    limpiarErrores();
}

function limpiarErrores() {
    errores.curso_id = '';
    errores.instructor_id = '';
    errores.fecha = '';
    errores.hora_inicio = '';
    errores.hora_fin = '';
    errores.capacidad_maxima = '';
}

function validar() {
    limpiarErrores();
    let valido = true;

    if (!form.curso_id) {
        errores.curso_id = 'Seleccione un curso';
        valido = false;
    }

    if (!form.instructor_id) {
        errores.instructor_id = 'Seleccione un instructor';
        valido = false;
    }

    if (!form.fecha) {
        errores.fecha = 'Seleccione una fecha';
        valido = false;
    }

    if (!form.hora_inicio) {
        errores.hora_inicio = 'Ingrese la hora de inicio';
        valido = false;
    }

    if (!form.hora_fin) {
        errores.hora_fin = 'Ingrese la hora de fin';
        valido = false;
    }

    if (form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio) {
        errores.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
        valido = false;
    }

    if (!form.capacidad_maxima || form.capacidad_maxima < 1 || form.capacidad_maxima > 30) {
        errores.capacidad_maxima = 'La capacidad debe estar entre 1 y 30';
        valido = false;
    }

    return valido;
}

function formatearFechaEnvio(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function enviar() {
    if (!validar()) return;

    enviando.value = true;
    const datos = {
        curso_id: form.curso_id,
        instructor_id: form.instructor_id,
        fecha: formatearFechaEnvio(form.fecha),
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        capacidad_maxima: Number(form.capacidad_maxima)
    };

    emit('guardar', datos);
    enviando.value = false;
}
</script>

<template>
    <form class="flex flex-col gap-4" @submit.prevent="enviar">
        <!-- Error de conflicto del backend (409) -->
        <Message v-if="errorConflicto" severity="warn" :closable="false"> <i class="pi pi-exclamation-triangle mr-2"></i>{{ errorConflicto }} </Message>

        <!-- Curso -->
        <div class="flex flex-col gap-1">
            <label for="slot-curso" class="font-medium text-sm">Curso *</label>
            <Select id="slot-curso" v-model="form.curso_id" :options="cursos" option-label="nombre" option-value="id" placeholder="Seleccione un curso" :invalid="!!errores.curso_id" class="w-full" />
            <small v-if="errores.curso_id" class="text-red-500">{{ errores.curso_id }}</small>
        </div>

        <!-- Instructor -->
        <div class="flex flex-col gap-1">
            <label for="slot-instructor" class="font-medium text-sm">Instructor *</label>
            <Select id="slot-instructor" v-model="form.instructor_id" :options="instructoresActivos" option-label="nombre_completo" option-value="id" placeholder="Seleccione un instructor activo" :invalid="!!errores.instructor_id" class="w-full" />
            <small v-if="errores.instructor_id" class="text-red-500">{{ errores.instructor_id }}</small>
        </div>

        <!-- Fecha -->
        <div class="flex flex-col gap-1">
            <label for="slot-fecha" class="font-medium text-sm">Fecha *</label>
            <DatePicker id="slot-fecha" v-model="form.fecha" date-format="dd/mm/yy" :min-date="new Date()" placeholder="Seleccione una fecha" :invalid="!!errores.fecha" class="w-full" />
            <small v-if="errores.fecha" class="text-red-500">{{ errores.fecha }}</small>
        </div>

        <!-- Hora inicio y fin -->
        <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
                <label for="slot-hora-inicio" class="font-medium text-sm">Hora inicio *</label>
                <InputText id="slot-hora-inicio" v-model="form.hora_inicio" type="time" :invalid="!!errores.hora_inicio" class="w-full" />
                <small v-if="errores.hora_inicio" class="text-red-500">{{ errores.hora_inicio }}</small>
            </div>

            <div class="flex flex-col gap-1">
                <label for="slot-hora-fin" class="font-medium text-sm">Hora fin *</label>
                <InputText id="slot-hora-fin" v-model="form.hora_fin" type="time" :invalid="!!errores.hora_fin" class="w-full" />
                <small v-if="errores.hora_fin" class="text-red-500">{{ errores.hora_fin }}</small>
            </div>
        </div>

        <!-- Capacidad máxima -->
        <div class="flex flex-col gap-1">
            <label for="slot-capacidad" class="font-medium text-sm">Capacidad máxima *</label>
            <InputNumber id="slot-capacidad" v-model="form.capacidad_maxima" :min="1" :max="30" :invalid="!!errores.capacidad_maxima" class="w-full" />
            <small v-if="errores.capacidad_maxima" class="text-red-500">{{ errores.capacidad_maxima }}</small>
        </div>

        <!-- Botones -->
        <div class="flex justify-end gap-2 pt-2">
            <Button label="Cancelar" severity="secondary" outlined type="button" @click="emit('cancelar')" />
            <Button label="Guardar" icon="pi pi-check" type="submit" :loading="enviando" />
        </div>
    </form>
</template>
