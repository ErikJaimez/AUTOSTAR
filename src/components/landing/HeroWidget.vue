<template>
    <div id="inicio" class="relative flex flex-col pt-6 px-6 lg:px-20 overflow-hidden text-white">
        <!-- VIDEO DE FONDO -->
        <video autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover z-0">
            <source src="/video/Video_inicio.mp4" type="video/mp4" />
            Tu navegador no soporta videos en HTML5.
        </video>
        <!-- Capa oscura -->
        <div class="absolute inset-0 bg-black/40 z-10"></div>
        <!-- CONTENIDO -->
        <div class="relative z-20 mx-6 md:mx-20 mt-0 md:mt-6">
            <h1 class="text-7xl font-bold text-white leading-tight">
                <span class="block">AUTOSTAR</span>
                <span>Escuela de manejo</span>
            </h1>
            <p class="text-white text-4xl mt-4">
                ¡<span class="text-yellow-400 font-semibold">Maneja</span> en tu primera clase!<br>
                Somos <span class="text-yellow-400 font-bold">expertos </span>en
                <span class="text-yellow-400 font-bold">personas nerviosas</span>.
            </p>

            <Button @click="enviarWhatsAppGeneral" rounded class="!text-2xl font-bold mt-8 !px-4">
                <span class="font-bold">¡Quiero aprender!</span>
            </Button><br>

            <Button @click="enviarWhatsAppGeneral" rounded class="!text-2xl font-bold mt-1 !px-4">
                <span class="font-bold">55-54-71-38-95</span>
            </Button>
        </div>
        <div class="relative z-20 flex justify-center md:justify-end">
            <h1 class="text-4xl font-bold text-white leading-tight">
                <span class="">Más de </span><span class="text-yellow-400 font-bold">8 años </span>de experiencia <br>
                <span>Cursos a DOMICILIO *</span><br>
                <span>CDMX ZONA SUR </span>
            </h1>
        </div>
    </div>
</template>

<script setup>
const WHATSAPP_NUMBER = '5215554713895';

function enviarWhatsAppGeneral() {
    const mensaje = encodeURIComponent('¡Hola! Me interesa obtener información sobre los cursos de manejo en AUTOSTAR. ¿Podrían darme más detalles?');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank');
}
</script>
