import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CursoForm from '../CursoForm.vue';

// Stubs para componentes PrimeVue auto-importados
const InputTextStub = {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'invalid', 'placeholder', 'maxlength']
};

const TextareaStub = {
    template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    props: ['modelValue', 'invalid', 'rows', 'placeholder']
};

const InputNumberStub = {
    template: '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
    props: ['modelValue', 'invalid', 'min', 'max', 'mode', 'currency', 'locale', 'placeholder']
};

const SelectStub = {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'invalid', 'placeholder']
};

const ButtonStub = {
    template: '<button :type="type || \'button\'" @click="$emit(\'click\')">{{ label }}</button>',
    props: ['label', 'type', 'severity', 'icon']
};

const ToggleSwitchStub = {
    template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    props: ['modelValue', 'inputId']
};

const globalStubs = {
    InputText: InputTextStub,
    Textarea: TextareaStub,
    InputNumber: InputNumberStub,
    Select: SelectStub,
    Button: ButtonStub,
    ToggleSwitch: ToggleSwitchStub
};

function crearWrapper(props = {}) {
    return mount(CursoForm, {
        props,
        global: {
            stubs: globalStubs
        }
    });
}

describe('CursoForm', () => {
    describe('validación de nombre', () => {
        it('muestra error cuando nombre está vacío', async () => {
            const wrapper = crearWrapper();
            await wrapper.find('form').trigger('submit');

            expect(wrapper.text()).toContain('El nombre es obligatorio');
        });
    });

    describe('validación de descripcion', () => {
        it('muestra error cuando descripcion está vacía', async () => {
            const wrapper = crearWrapper();
            // Set nombre to pass that validation
            await wrapper.find('#nombre').setValue('Curso Test');
            await wrapper.find('form').trigger('submit');

            expect(wrapper.text()).toContain('La descripción es obligatoria');
        });
    });

    describe('validación de duracion_horas', () => {
        it('muestra error cuando duracion_horas está fuera del rango (1-200)', async () => {
            const wrapper = crearWrapper({
                curso: {
                    nombre: 'Curso Test',
                    descripcion: 'Descripción válida',
                    duracion_horas: 250,
                    precio: 1000,
                    categoria_licencia: 'A'
                }
            });

            await wrapper.find('form').trigger('submit');
            expect(wrapper.text()).toContain('La duración debe estar entre 1 y 200 horas');
        });
    });

    describe('validación de precio', () => {
        it('muestra error cuando precio está fuera del rango (0.01-99999.99)', async () => {
            const wrapper = crearWrapper({
                curso: {
                    nombre: 'Curso Test',
                    descripcion: 'Descripción válida',
                    duracion_horas: 20,
                    precio: 100000,
                    categoria_licencia: 'A'
                }
            });

            await wrapper.find('form').trigger('submit');
            expect(wrapper.text()).toContain('El precio debe estar entre $0.01 y $99,999.99');
        });
    });

    describe('validación de categoria_licencia', () => {
        it('muestra error cuando categoria_licencia no está seleccionada', async () => {
            const wrapper = crearWrapper({
                curso: {
                    nombre: 'Curso Test',
                    descripcion: 'Descripción válida',
                    duracion_horas: 20,
                    precio: 1000,
                    categoria_licencia: ''
                }
            });

            await wrapper.find('form').trigger('submit');
            expect(wrapper.text()).toContain('La categoría de licencia es obligatoria');
        });
    });

    describe('emisión de eventos', () => {
        it('emite evento guardar con datos del formulario cuando es válido', async () => {
            const cursoData = {
                nombre: 'Curso Completo',
                descripcion: 'Una descripción detallada del curso',
                descripcion_resumida: 'Resumen',
                duracion_horas: 30,
                precio: 5000,
                categoria_licencia: 'A',
                requisitos_previos: '',
                activo: true
            };

            const wrapper = crearWrapper({ curso: cursoData });
            await wrapper.find('form').trigger('submit');

            expect(wrapper.emitted('guardar')).toBeTruthy();
            expect(wrapper.emitted('guardar')[0][0]).toMatchObject({
                nombre: 'Curso Completo',
                descripcion: 'Una descripción detallada del curso',
                duracion_horas: 30,
                precio: 5000,
                categoria_licencia: 'A'
            });
        });

        it('emite evento cancelar cuando se hace click en cancelar', async () => {
            const wrapper = crearWrapper();

            // Find the cancel button (it has severity="secondary")
            const buttons = wrapper.findAll('button');
            const cancelBtn = buttons.find((b) => b.text() === 'Cancelar');
            await cancelBtn.trigger('click');

            expect(wrapper.emitted('cancelar')).toBeTruthy();
        });
    });
});
