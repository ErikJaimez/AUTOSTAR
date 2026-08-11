<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'General',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/admin' }]
    },
    {
        label: 'Gestión',
        items: [
            { label: 'Cursos', icon: 'pi pi-fw pi-book', to: '/admin/cursos' },
            { label: 'Horarios', icon: 'pi pi-fw pi-calendar', to: '/admin/horarios' },
            { label: 'Reservaciones', icon: 'pi pi-fw pi-file', to: '/admin/reservaciones' },
            { label: 'Instructores', icon: 'pi pi-fw pi-users', to: '/admin/instructores' },
            { label: 'Clases', icon: 'pi pi-fw pi-car', to: '/admin/clases' }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
