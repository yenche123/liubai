<script setup lang="ts">
import { defineAsyncComponent } from "vue"
import { useMainView } from "./tools/useMainView"
import { useMvDropZone } from "./tools/useMvDropZone"
import { type MainViewEmits, mainViewProps } from "./tools/types"

const CenterDropZone = defineAsyncComponent(() => {
  return import("./center-drop-zone/center-drop-zone.vue")
})

const props = defineProps(mainViewProps)
const emits = defineEmits<MainViewEmits>()

const { leftPx, rightPx } = useMainView(props)
const { 
  isOverDropZone, 
  centerRef,
  onTapCenterDropZone,
} = useMvDropZone(props)

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
        v-if="enableDropFiles"
        :is-over-drop-zone="isOverDropZone"
        @tap="onTapCenterDropZone"
      ></center-drop-zone>

    </div>
    <div class="mv-right" :style="{ width: rightPx + 'px' }"></div>
  </div>

  <!-- 监听滑动打开左边侧边栏的盒子 -->

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
  transition: .45s;
  background-color: #e6e4bf;
  contain: strict;
}

.mv-center {
  flex: 1;
  height: 100vh;
  height: 100dvh;
  position: relative;
  overflow-x: hidden;
  transform: translateX(0);
  content-visibility: auto;
}

</style>