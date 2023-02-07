<script setup lang="ts">
import CenterDropZone from "./center-drop-zone/center-drop-zone.vue"
import { useMainView } from "./tools/useMainView"
import { useMvDropZone } from "./tools/useMvDropZone"

const props = defineProps({
  dropFiles: {
    type: Boolean,
    default: false
  }
})

const { leftPx, rightPx } = useMainView()
const { isOverDropZone, centerRef } = useMvDropZone(props)

</script>
<template>

  <div class="mv-container">
    <div class="mv-left" :style="{ width: leftPx + 'px' }"></div>
    <div class="mv-center" ref="centerRef">
      <slot />

      <center-drop-zone 
        v-if="dropFiles"
        :is-over-drop-zone="isOverDropZone"
        :left-px="leftPx"
        :right-px="rightPx"
      ></center-drop-zone>

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
  flex-shrink: 0;
  height: 100%;
  transition: .25s;
  background-color: #e6e4bf;
}

.mv-center {
  flex: 1;
  height: 100vh;
  position: relative;
  overflow-x: hidden;
}

</style>