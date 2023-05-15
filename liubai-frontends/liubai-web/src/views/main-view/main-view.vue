<script setup lang="ts">
import CenterDropZone from "./center-drop-zone/center-drop-zone.vue"
import { useMainView } from "./tools/useMainView"
import { useMvDropZone } from "./tools/useMvDropZone"
import { useMvTouchBox } from "./tools/useMvTouchBox"

const props = defineProps({
  dropFiles: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits<{
  "tapmainview": []
}>()

const { leftPx, rightPx } = useMainView()
const { isOverDropZone, centerRef } = useMvDropZone(props)
const { 
  showTouchBox,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
} = useMvTouchBox(leftPx)

const onTapCenter = (e: MouseEvent) => {
  emits("tapmainview")
}

</script>
<template>
  <div class="mv-container" :draggable="false">
    <div class="mv-left" :style="{ width: leftPx + 'px' }"></div>
    <div class="mv-center" ref="centerRef" @click="onTapCenter">
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

  <!-- 监听滑动打开侧边栏的盒子 -->
  <div v-if="showTouchBox" class="mv-touch-box"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchCancel"
    :draggable="false"
  ></div>

</template>
<style scoped>

.mv-container {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
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
  height: 100dvh;
  position: relative;
  overflow-x: hidden;
}

.mv-touch-box {
  position: fixed;
  top: 0;
  left: 0;
  height: 90vh;
  height: 100svh;
  width: 6vw;
  max-width: 50px;
  user-select: none;
}

</style>