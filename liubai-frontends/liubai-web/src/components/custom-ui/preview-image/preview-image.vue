<script setup lang="ts">
import PiContent from "./pi-content.vue"
import { initPreviewImage } from "./index"

const {
  enable,
  show,
  TRANSITION_DURATION,
  data,
  onTapCancel,
} = initPreviewImage()

</script>
<template>

  <div v-if="enable" 
    class="pi-container"
    :class="{ 'pi-container_show': show }"
    @click="onTapCancel"
  >
    <PiContent 
      :current-index="data.index" 
      :imgs="data.imgs"
    ></PiContent>
  </div>

</template>
<style lang="scss" scoped>

.pi-container {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  user-select: none;
  opacity: 0;
  background-color: rgba(0, 0, 0, .86);
  transition: v-bind("TRANSITION_DURATION + 'ms'");
  z-index: 3000;
}

.pi-container_show {
  opacity: 1;
}


</style>