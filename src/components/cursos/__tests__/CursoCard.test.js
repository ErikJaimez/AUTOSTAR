import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CursoCard from '../CursoCard.vue';

// Stub router-link para evitar warnings de vue-router
const RouterLinkStub = {
    template: '<a :href="to"><slot /></a>',
    props: ['to']
};

function crearWrapper(cursoOverrides = {}) {
    const curso = {
        id: 'abc-123',
        nombre: 'Curso de Manejo Básico',
        descripcion_resumida: 'Aprende a manejar desde cero con instructores certificados.',
        duracion_horas: 20,
        precio: 4500.0,
        categoria_licencia: 'A',
        ...cursoOverrides
    };

    return mount(CursoCard, {
        props: { curso },
        global: {
            stubs: {
                'router-link': RouterLinkStub
            }
        }
    });
}

describe('CursoCard', () => {
    it('renderiza el nombre del curso correctamente', () => {
        const wrapper = crearWrapper({ nombre: 'Curso Avanzado de Autopista' });
        expect(wrapper.text()).toContain('Curso Avanzado de Autopista');
    });

    it('trunca la descripcion_resumida a 150 caracteres', () => {
        const textoLargo = 'A'.repeat(200);
        const wrapper = crearWrapper({ descripcion_resumida: textoLargo });

        // Debe mostrar 150 caracteres + "..."
        const textoEsperado = 'A'.repeat(150) + '...';
        expect(wrapper.text()).toContain(textoEsperado);
        expect(wrapper.text()).not.toContain('A'.repeat(151));
    });

    it('muestra la descripcion_resumida completa si tiene 150 caracteres o menos', () => {
        const textoCorto = 'Descripción breve del curso de manejo.';
        const wrapper = crearWrapper({ descripcion_resumida: textoCorto });
        expect(wrapper.text()).toContain(textoCorto);
    });

    it('formatea el precio en formato MXN', () => {
        const wrapper = crearWrapper({ precio: 4500 });
        // Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }) produce "$4,500.00"
        expect(wrapper.text()).toMatch(/\$4,500\.00/);
    });

    it('muestra el valor de duracion_horas', () => {
        const wrapper = crearWrapper({ duracion_horas: 30 });
        expect(wrapper.text()).toContain('30 horas');
    });

    it('enlaza a la ruta detalle-curso con el id del curso', () => {
        const wrapper = crearWrapper({ id: 'curso-xyz' });
        const link = wrapper.findComponent(RouterLinkStub);
        expect(link.props('to')).toEqual({ name: 'detalle-curso', params: { id: 'curso-xyz' } });
    });
});
