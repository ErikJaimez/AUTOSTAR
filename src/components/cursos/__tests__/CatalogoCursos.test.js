import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

// Mock del composable useCursos
vi.mock('@/composables/useCursos', () => ({
    useCursos: vi.fn()
}));

import { useCursos } from '@/composables/useCursos';
import CatalogoCursos from '@/views/public/CatalogoCursos.vue';

// Stubs para componentes
const CursoCardStub = {
    template: '<div class="curso-card-stub">{{ curso.nombre }}</div>',
    props: ['curso']
};

const CursoCategoriaStub = {
    template: '<div class="curso-categoria-stub"><slot /></div>',
    props: ['categoria']
};

const SkeletonStub = {
    template: '<div class="skeleton-stub"></div>',
    props: ['width', 'height']
};

const ButtonStub = {
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
    props: ['label', 'icon']
};

function crearWrapper(mockState = {}) {
    const defaultState = {
        cursos: computed(() => []),
        cargando: ref(false),
        error: ref(null),
        cargarCursos: vi.fn(),
        ...mockState
    };

    useCursos.mockReturnValue(defaultState);

    return mount(CatalogoCursos, {
        global: {
            stubs: {
                CursoCard: CursoCardStub,
                CursoCategoria: CursoCategoriaStub,
                Skeleton: SkeletonStub,
                Button: ButtonStub
            }
        }
    });
}

describe('CatalogoCursos', () => {
    it('muestra mensaje de estado vacío cuando no hay cursos disponibles', () => {
        const wrapper = crearWrapper({
            cursos: computed(() => []),
            cargando: ref(false),
            error: ref(null)
        });

        expect(wrapper.text()).toContain('No hay cursos disponibles en este momento');
    });

    it('muestra indicador de carga cuando está cargando', () => {
        const wrapper = crearWrapper({
            cursos: computed(() => []),
            cargando: ref(true),
            error: ref(null)
        });

        expect(wrapper.findAll('.skeleton-stub').length).toBeGreaterThan(0);
    });

    it('muestra mensaje de error cuando hay un error', () => {
        const wrapper = crearWrapper({
            cursos: computed(() => []),
            cargando: ref(false),
            error: ref('No se pudieron cargar los cursos')
        });

        expect(wrapper.text()).toContain('No se pudieron cargar los cursos');
        expect(wrapper.text()).toContain('Reintentar');
    });

    it('llama cargarCursos al montar el componente', () => {
        const cargarCursos = vi.fn();
        crearWrapper({
            cursos: computed(() => []),
            cargando: ref(false),
            error: ref(null),
            cargarCursos
        });

        expect(cargarCursos).toHaveBeenCalledOnce();
    });
});
