<template>
  <Dialog
    header="Déjalo en nuestras manos o llámanos"
    v-model:visible="visible"
    :breakpoints="{ '960px': '75vw' }"
    :style="{ width: '40vw' }"
    :modal="true"
  >
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
          <Button
            label="¡Quiero informes!"
            icon="pi pi-user"
            class="w-full max-w-[17.35rem] mx-auto"
          />
        </div>
      </div>
      <div class="w-full md:w-2/12">
        <Divider layout="vertical" class="!hidden md:!flex"><b>O</b></Divider>
      </div>
      <div class="w-full md:w-5/12 flex flex-col items-center justify-center py-5">
        <label class="text-lg font-bold mb-1">55-54-71-38-95</label>
        <img
          src="@/assets/images/qr1.png"
          alt="Logo Autostar"
          class="h-40 w-auto"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { defineProps, ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  visible.value = val
})
watch(visible, (val) => {
  emit('update:modelValue', val)
})
</script>
