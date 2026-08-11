<script setup>
import ContactDialog from '@/components/contac/ContacDialog.vue';
import { ref } from 'vue';



//const display = ref(false);
const showDialog = ref(false)
const goToFacebook = () => {
  window.open('https://www.facebook.com/escuelademanejoautoestar', '_blank')
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
        <div class="items-center bg-surface-0 dark:bg-surface-900 grow justify-between hidden lg:flex w-full px-12 lg:px-0 z-20 rounded-border">
        <ul class="list-none p-0 m-0 flex lg:items-center select-none flex-col lg:flex-row cursor-pointer gap-8">
            <li>
                <a @click="smoothScroll('inicio')" class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                    <span>Inicio</span>
                </a>
            </li>
            <li>
                <a @click="smoothScroll('cursos')" class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                    <span>Cursos</span>
                </a>
            </li>
            <li>
                <a @click="smoothScroll('opiniones')" class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                    <span>Opiniones</span>
                </a>
            </li>
            <li>
                <a @click="smoothScroll('nosotros')" class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                    <span>Nosotros</span>
                </a>
            </li>
        </ul>
        <div class="flex border-t lg:border-t-0 border-surface py-4 lg:py-0 mt-4 lg:mt-0 gap-2">
            <Button
  label="Facebook"
  text
  rounded
  @click="goToFacebook"
/>

            <Button label="WhatsApp" @click="showDialog = true" />
                <ContactDialog v-model="showDialog" />
                <!-- <Dialog header="Déjalo en nuestras manos o llámanos" v-model:visible="display" :breakpoints="{ '960px': '75vw' }" :style="{ width: '40vw' }" :modal="true">                 
                    <div class="flex flex-col md:flex-row">
                        <div class="w-full md:w-5/12 flex flex-col items-center justify-center gap-3 py-5">
                            <div class="flex flex-col gap-2">
                                <label for="name">Nombre</label>
                                <InputText id="name" type="text" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <label for="number">WhatsApp</label>
                                <InputText id="number" type="text" />
                            </div>
                            <div class="flex">
                                <Button label="¡Quiero informes!" icon="pi pi-user" class="w-full max-w-[17.35rem] mx-auto"></Button>
                            </div>
                        </div>
                        <div class="w-full md:w-2/12">
                            <Divider layout="vertical" class="!hidden md:!flex"><b>O</b></Divider>
                        </div>
                        <div class="w-full md:w-5/12 flex flex-col items-center justify-center py-5">
                            <label for="number" class="text-l font-bold mb-1">55-54-71-38-95</label>
                            <img src="@/assets/images/qr1.png" alt="Logo Autostar" class="h-40 w-auto" />
                        </div>

                    </div>     
                </Dialog> -->
        </div>
    </div>
</template>




