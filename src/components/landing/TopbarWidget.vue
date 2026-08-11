<script setup>
import { ref } from 'vue';

const WHATSAPP_NUMBER = '5215554713895';

const goToFacebook = () => {
  window.open('https://www.facebook.com/escuelademanejoautoestar', '_blank')
}

function enviarWhatsAppGeneral() {
    const mensaje = encodeURIComponent('¡Hola! Me interesa obtener información sobre los cursos de manejo en AUTOSTAR. ¿Podrían darme más detalles?');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank');
}



function smoothScroll(id) {
    document.body.click();
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// function open() {
//     display.value = true;
// }

// function close() {
//     display.value = false;
// }
</script>

<template>
    <a class="flex items-center" href="#">
        <img src="@/assets/images/solo_logo_blanco 2.png" alt="Logo Autostar" class="h-20 w-auto mr-4" />

        <span class="text-surface-900 dark:text-surface-0 font-medium text-2xl leading-normal mr-20">Autostar</span>
    </a>
    <Button
        class="lg:!hidden"
        text
        severity="secondary"
        rounded
        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
    >
        <i class="pi pi-bars !text-2xl"></i>
    </Button>
        <div class="items-center bg-surface-0 dark:bg-surface-900 grow justify-between hidden lg:flex absolute lg:static top-full left-0 right-0 w-full lg:w-auto px-6 lg:px-0 py-4 lg:py-0 z-50 rounded-border shadow-lg lg:shadow-none border-b lg:border-b-0 border-surface">
        <ul class="list-none p-0 m-0 flex lg:items-center select-none flex-col lg:flex-row cursor-pointer gap-2 lg:gap-8">
            <li>
                <a @click="smoothScroll('inicio')" class="block px-4 py-3 lg:px-0 lg:py-4 text-surface-900 dark:text-surface-0 font-medium text-xl rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 lg:hover:bg-transparent transition-colors">
                    <span>Inicio</span>
                </a>
            </li>
            <li>
                <a @click="smoothScroll('cursos')" class="block px-4 py-3 lg:px-0 lg:py-4 text-surface-900 dark:text-surface-0 font-medium text-xl rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 lg:hover:bg-transparent transition-colors">
                    <span>Cursos</span>
                </a>
            </li>
            <li>
                <a @click="smoothScroll('opiniones')" class="block px-4 py-3 lg:px-0 lg:py-4 text-surface-900 dark:text-surface-0 font-medium text-xl rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 lg:hover:bg-transparent transition-colors">
                    <span>Opiniones</span>
                </a>
            </li>
            <li>
                <a @click="smoothScroll('nosotros')" class="block px-4 py-3 lg:px-0 lg:py-4 text-surface-900 dark:text-surface-0 font-medium text-xl rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 lg:hover:bg-transparent transition-colors">
                    <span>Nosotros</span>
                </a>
            </li>
        </ul>
        <div class="flex border-t lg:border-t-0 border-surface py-4 lg:py-0 mt-4 lg:mt-0 gap-2 justify-center">
            <Button label="Facebook" text rounded @click="goToFacebook" />
            <Button label="WhatsApp" @click="enviarWhatsAppGeneral" />
        </div>
    </div>
</template>




