<script setup lang="ts">
import { initGlobalLoading } from "./index"

const {
  enable,
  number,
  transition,
} = initGlobalLoading()

</script>
<template>

  <div class="gl-line" v-if="enable"></div>

</template>
<style scoped lang="scss">

.gl-line {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  max-width: v-bind("'' + number + '%'");
  overflow: hidden;
  z-index: 4000;
  background-color: var(--primary-color);
  transition: v-bind("transition + 'ms'");
  will-change: width, max-width;
}

</style>