<script setup lang="ts">
import { initGlobalLoading } from "./index"

const {
  enable,
  number,
  transition,
} = initGlobalLoading()

</script>
<template>

  <div class="gl-line" v-if="enable">
    <div class="gl-shadow"></div>
  </div>

</template>
<style scoped lang="scss">

.gl-line {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  max-width: v-bind("'' + number + '%'");
  z-index: 4000;
  background-color: var(--primary-color);
  transition: v-bind("transition + 'ms'");
  will-change: width, max-width;
}

.gl-shadow {
  position: absolute;
  right: 0;
  width: 100px;
  height: 100%;
  box-shadow: 0 0 12px var(--primary-color), 0 0 6px var(--primary-color);
  opacity: 1;
  transform: rotate(3deg) translateY(-4px);
}

</style>