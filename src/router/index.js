import { useAuth } from '@/composables/useAuth';
import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // Página principal pública — Landing de AUTOSTAR
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/demo',
            component: AppLayout,
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue')
                },
                {
                    path: '/uikit/input',
                    name: 'input',
                    component: () => import('@/views/uikit/InputDoc.vue')
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue')
                },
                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/views/uikit/OverlayDoc.vue')
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue')
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/views/uikit/MiscDoc.vue')
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/views/uikit/TimelineDoc.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/views/pages/Crud.vue')
                },
                {
                    path: '/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue')
                }
            ]
        },
        // Rutas protegidas del panel de administración
        {
            path: '/admin',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'admin-dashboard',
                    meta: { requiresAuth: true },
                    component: () => import('@/views/admin/DashboardAdmin.vue')
                },
                {
                    path: 'cursos',
                    name: 'admin-cursos',
                    meta: { requiresAuth: true },
                    component: () => import('@/views/admin/CursosAdmin.vue')
                },
                {
                    path: 'horarios',
                    name: 'admin-horarios',
                    meta: { requiresAuth: true },
                    component: () => import('@/views/admin/HorariosAdmin.vue')
                },
                {
                    path: 'reservaciones',
                    name: 'admin-reservaciones',
                    meta: { requiresAuth: true },
                    component: () => import('@/views/admin/ReservacionesAdmin.vue')
                },
                {
                    path: 'instructores',
                    name: 'admin-instructores',
                    meta: { requiresAuth: true },
                    component: () => import('@/views/admin/InstructoresAdmin.vue')
                },
                {
                    path: 'clases',
                    name: 'admin-clases',
                    meta: { requiresAuth: true },
                    component: () => import('@/views/admin/ClasesAdmin.vue')
                },
                {
                    path: 'clientes/:id',
                    name: 'admin-detalle-cliente',
                    meta: { requiresAuth: true },
                    component: () => import('@/views/admin/DetalleCliente.vue')
                }
            ]
        },
        // Rutas públicas de cursos
        {
            path: '/cursos',
            name: 'catalogo-cursos',
            component: () => import('@/views/public/CatalogoCursos.vue')
        },
        {
            path: '/cursos/:id',
            name: 'detalle-curso',
            component: () => import('@/views/public/DetalleCurso.vue')
        },
        {
            path: '/reservar/:cursoId/:slotId',
            name: 'form-reservacion',
            component: () => import('@/views/public/FormReservacion.vue')
        },
        {
            path: '/landing',
            name: 'landing',
            redirect: '/'
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});

// Navigation guard: proteger rutas admin
router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

    if (!requiresAuth) {
        return next();
    }

    const { estaAutenticado, verificarSesion } = useAuth();

    // Si ya está autenticado en memoria, dejar pasar
    if (estaAutenticado.value) {
        return next();
    }

    // Verificar sesión contra el backend (por si hay token vigente)
    const sesionValida = await verificarSesion();

    if (sesionValida) {
        return next();
    }

    // No hay sesión válida → redirigir a login con indicador de sesión expirada
    next({
        name: 'login',
        query: from.name ? { sesionExpirada: '1' } : {}
    });
});

export default router;
