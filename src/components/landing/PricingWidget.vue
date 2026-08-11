<template>
    <div id="cursos" class="py-6 px-6 lg:px-20 my-2 md:my-6">
        <div class="text-center mb-6">
            <div class="text-surface-900 dark:text-surface-0 font-normal mb-2 text-6xl">Nuestros cursos</div>
            <span class="text-muted-color text-4xl">100% prácticos</span><br>
            <span class="text-muted-color text-2xl">¡Nos acoplamos a tus horarios!</span>
        </div>

        <div class="grid grid-cols-12 gap-4 justify-between mt-20 md:mt-0">
            <div v-for="curso in cursos" :key="curso.id" class="col-span-12 lg:col-span-4 p-0 md:p-4 mt-6 md:mt-0">
                <div class="p-4 flex flex-col border-surface-200 dark:border-surface-600 pricing-card cursor-pointer border-2 hover:border-primary duration-300 transition-all h-full" style="border-radius: 10px">
                    <div class="text-surface-900 dark:text-surface-0 text-center my-8 text-3xl">{{ curso.nombre }}</div>
                    <img :src="curso.imagen" class="w-10/12 mx-auto" :alt="curso.nombre" />
                    <div class="my-8 flex flex-col items-center gap-4">
                        <div class="flex items-center">
                            <span class="text-5xl font-bold mr-2 text-surface-900 dark:text-surface-0">{{ curso.precioEstandar }}</span>
                            <span class="text-surface-600 dark:text-surface-200">Estándar</span>
                        </div>
                        <div class="flex items-center">
                            <span class="text-5xl font-bold mr-2 text-surface-900 dark:text-surface-0">{{ curso.precioAutomatico }}</span>
                            <span class="text-surface-600 dark:text-surface-200">Automático</span>
                        </div>
                        <Button
                            label="Informes"
                            class="p-button-rounded border-0 ml-4 font-light leading-tight bg-blue-500 text-white"
                            @click="enviarWhatsApp(curso.nombre)"
                        />
                    </div>
                    <Divider class="w-full bg-surface-200"></Divider>
                    <ul class="my-8 list-none p-0 flex text-surface-900 dark:text-surface-0 flex-col px-8">
                        <li v-for="(item, idx) in curso.caracteristicas" :key="idx" class="py-2">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                            <span class="text-xl leading-normal">{{ item }}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const WHATSAPP_NUMBER = '5215554713895';

const cursos = ref([
    {
        id: 1,
        nombre: 'Completo (15 Horas)',
        imagen: new URL('@/assets/images/completo.jpg', import.meta.url).href,
        precioEstandar: '$3900',
        precioAutomatico: '$4300',
        caracteristicas: [
            'Personas muy nerviosas',
            'Aprende desde 0',
            'Incorporaciones y periférico',
            'Reversa y estacionamiento',
            'Subidas',
            'Cambio de neumáticos'
        ]
    },
    {
        id: 2,
        nombre: 'Principiante (10 Horas)',
        imagen: new URL('@/assets/images/principiante.jpg', import.meta.url).href,
        precioEstandar: '$2945',
        precioAutomatico: '$3345',
        caracteristicas: [
            'Primera vez manejando o muy poco',
            'Incorporaciones y periférico',
            'Reversa y estacionamiento',
            'Calles pequeñas',
            'Subidas'
        ]
    },
    {
        id: 3,
        nombre: 'Intermedio (7 Horas)',
        imagen: new URL('@/assets/images/intermedio.jpg', import.meta.url).href,
        precioEstandar: '$1990',
        precioAutomatico: '$2390',
        caracteristicas: [
            'Personas con poca experiencia',
            'Mejorar técnicas',
            'Subidas',
            'Práctica en general'
        ]
    },
    {
        id: 4,
        nombre: 'Práctica (5 Horas)',
        imagen: new URL('@/assets/images/practica.jpg', import.meta.url).href,
        precioEstandar: '$1990',
        precioAutomatico: '$2390',
        caracteristicas: [
            'Práctica en general',
            'Clases en vehículo propio',
            'Personas que ya manejan un poco',
            'Estacionamiento'
        ]
    },
    {
        id: 5,
        nombre: 'Refuerzo (4 Horas)',
        imagen: new URL('@/assets/images/refuerzo.jpg', import.meta.url).href,
        precioEstandar: '$1990',
        precioAutomatico: '$2390',
        caracteristicas: [
            'Práctica extra al terminar curso',
            'Mejorar técnicas',
            'Estacionamiento',
            'Puede ser en auto propio'
        ]
    },
    {
        id: 6,
        nombre: 'Carretera',
        imagen: new URL('@/assets/images/carretera.jpg', import.meta.url).href,
        precioEstandar: '$1990',
        precioAutomatico: '$2390',
        caracteristicas: [
            'Personas que ya manejan',
            'Salida a carretera',
            'Seguridad',
            'Práctica en general'
        ]
    }
]);

function enviarWhatsApp(nombreCurso) {
    const mensaje = encodeURIComponent(`¡Hola! Me interesa el curso "${nombreCurso}" de AUTOSTAR. ¿Podrían darme más información sobre horarios y disponibilidad?`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank');
}
</script>
