<script setup>
import { useAuth } from '@/composables/useAuth';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const { login, estaAutenticado, cargando, error } = useAuth();

const usuario = ref('');
const contrasena = ref('');

// Bloqueo temporal (429)
const bloqueadoHasta = ref(null);
const tiempoRestante = ref(0);
let intervaloBloqueo = null;

// Mensaje de sesión expirada (viene del query param)
const sesionExpirada = computed(() => route.query.sesionExpirada === '1');

const estaBloqueado = computed(() => tiempoRestante.value > 0);

function iniciarContadorBloqueo(segundos) {
    bloqueadoHasta.value = Date.now() + segundos * 1000;
    tiempoRestante.value = segundos;

    intervaloBloqueo = setInterval(() => {
        const restante = Math.ceil((bloqueadoHasta.value - Date.now()) / 1000);
        if (restante <= 0) {
            tiempoRestante.value = 0;
            bloqueadoHasta.value = null;
            clearInterval(intervaloBloqueo);
            intervaloBloqueo = null;
        } else {
            tiempoRestante.value = restante;
        }
    }, 1000);
}

async function handleLogin() {
    if (estaBloqueado.value || cargando.value) return;

    try {
        await login({ usuario: usuario.value, contrasena: contrasena.value });
        router.push('/admin');
    } catch (err) {
        const status = err.response?.status;
        if (status === 429) {
            const segundos = err.response?.data?.tiempoRestante || 300;
            iniciarContadorBloqueo(segundos);
        }
    }
}

onMounted(() => {
    if (estaAutenticado.value) {
        router.push('/admin');
    }
});

onUnmounted(() => {
    if (intervaloBloqueo) {
        clearInterval(intervaloBloqueo);
    }
});
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen w-full overflow-hidden px-4">
        <div class="flex flex-col items-center justify-center w-full max-w-md">
            <div class="layout-login-wrapper w-full" style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="layout-login-card w-full bg-surface-0 dark:bg-surface-900 py-12 sm:py-20 px-6 sm:px-12 md:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <img src="@/assets/images/solo_logo_blanco 2.png" alt="Logo Autostar" class="h-20 w-auto mx-auto mb-4" />
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Panel de Administración</div>
                        <span class="text-muted-color font-medium">Ingresa tus credenciales para continuar</span>
                    </div>

                    <!-- Mensaje de sesión expirada -->
                    <Message v-if="sesionExpirada" severity="warn" class="mb-6" :closable="false"> Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente. </Message>

                    <!-- Mensaje de error genérico -->
                    <Message v-if="error && !estaBloqueado" severity="error" class="mb-6" :closable="false">
                        {{ error }}
                    </Message>

                    <!-- Mensaje de bloqueo temporal -->
                    <Message v-if="estaBloqueado" severity="warn" class="mb-6" :closable="false"> Demasiados intentos fallidos. Intenta de nuevo en {{ tiempoRestante }} segundos. </Message>

                    <form @submit.prevent="handleLogin">
                        <label for="usuario" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Usuario</label>
                        <InputText id="usuario" type="text" placeholder="Nombre de usuario" class="w-full mb-6" v-model="usuario" :disabled="estaBloqueado || cargando" />

                        <label for="contrasena" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                        <Password id="contrasena" v-model="contrasena" placeholder="Contraseña" class="mb-10" fluid :feedback="false" :toggleMask="true" :disabled="estaBloqueado || cargando" />

                        <Button type="submit" label="Iniciar Sesión" class="w-full" :loading="cargando" :disabled="estaBloqueado || !usuario || !contrasena" />
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
