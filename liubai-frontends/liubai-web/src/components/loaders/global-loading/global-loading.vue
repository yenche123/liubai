<script setup lang="ts">
import { initGlobalLoading } from "./index"

const {
  enable,
  number,
  transition,
} = initGlobalLoading()

</script>
<template>

  <progress v-if="enable" class="gl-progress" max="100" :value="number"></progress>

</template>
<style scoped lang="scss">

.gl-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  z-index: 4000;
  border-radius: 0;

  &::-webkit-progress-bar {
    background-color: transparent;
  }

  &::-webkit-progress-value {
    background-color: var(--primary-color);
    transition: v-bind("transition + 'ms'");
  }
}

</style>