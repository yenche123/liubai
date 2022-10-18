<script setup lang="ts">
import { useMainView } from "./tools/useMainView"

const props = defineProps({
  viceViewPx: {
    type: Number,
    default: 0,
  }
})

const { leftPx, rightPx } = useMainView(props)

</script>
<template>

  <div class="mv-container">
    <div class="mv-left" :style="{ width: leftPx + 'px' }"></div>
    <div class="mv-center">
      <slot />
    </div>
    <div class="mv-right" :style="{ width: rightPx + 'px' }"></div>
  </div>

</template>
<style scoped>

.mv-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  background-color: var(--bg-color);
}

.mv-left, .mv-right {
  height: 100%;
  transition: .25s;
  background-color: #e6e4bf;
}

.mv-center {
  flex: 1;
  height: 100vh;
  position: relative;
}

</style>