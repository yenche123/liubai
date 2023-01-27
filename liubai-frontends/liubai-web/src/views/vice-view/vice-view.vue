<script setup lang="ts">
import { ref, toRefs } from "vue";
import { useViceView } from "./tools/useViceView"
import { useVvUI } from "./tools/useVvUI";
import type { VcState } from "./vice-content/tools/types";
import ViceContent from "./vice-content/vice-content.vue";
import IframeRestriction from "./iframe-restriction/iframe-restriction.vue";

const emits = defineEmits<{
  (e: "widthchange", widthPx: number): void
}>()

const { vvData, vvEl } = useViceView(emits)
const {
  openType,
  minVvPx,
  viceViewPx,
  maxVvPx,
  isAnimating,
  shadow,
} = toRefs(vvData)

const {
  isDraging,
  onStartDrag,
} = useVvUI()

const vcStateToIr = ref<VcState>("")
const onVcStateChange = (newV: VcState) => {
  vcStateToIr.value = newV
}


</script>
<template>
  <div class="vv-container"
    :class="{ 
      'vv-container_hidden': openType !== 'opened'
    }"
  >
    <!-- 放于底部给用户拖动的盒子 -->
    <div
      ref="vvEl" 
      class="vv-bar"
      :style="{
        minWidth: minVvPx > 0 ? minVvPx + 'px' : undefined,
        maxWidth: maxVvPx > 0 ? maxVvPx + 'px' : undefined 
      }"
      :class="{ 'vv-bar_animating': isAnimating }"
      @pointerdown="onStartDrag"
    ></div>

    <!-- 最左侧到分割线的留空，让用户可以有比较大的区域拖动 -->
    <div class="vv-buffer-zone"
      :class="{ 'vv-buffer-zone_transparent': shadow }"
    ></div>

    <!-- 分割线  -->
    <div class="vv-space-line"></div>

    <!-- 悬浮或拖动时显示的分割线 -->
    <div class="vv-drag-line"></div>

    <!-- 装内容的盒子 -->
    <div class="vv-box"
      :class="{ 'vv-box_shadow': shadow }"
    >

      <div class="vv-inner-box">
        <ViceContent :is-outter-draging="isDraging"
          @vcstatechange="onVcStateChange"
        ></ViceContent>
      </div>
      
    </div>
    
  </div>

  <IframeRestriction
    :vice-view-px="viceViewPx"
    :vc-state="vcStateToIr"
  ></IframeRestriction>

</template>
<style scoped>
.vv-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  z-index: 700;
  transition: .3s;
  direction: rtl;
}

.vv-container_hidden {
  transform: translateX(102%);
}

.vv-bar {
  width: v-bind("viceViewPx + 'px'");
  height: inherit;
  resize: horizontal;
  cursor: ew-resize;
  opacity: 0;
  overflow: scroll;   /** 这一行一定要是 scroll 否则无法拖动 */
}

.vv-bar_animating {
  transition: .3s;
}

/* 没有以下该属性 竖直拖动条会不生效 */
.vv-bar::-webkit-scrollbar {
  width: 200px;
  height: inherit;
}

.vv-buffer-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-left: 2px solid var(--bg-color);
  transition: .2s;
  pointer-events: none;
}

.vv-buffer-zone_transparent {
  border-left: 2px solid transparent;
}

.vv-space-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  border-left: 2px solid var(--line-default);
  pointer-events: none;
  z-index: 705;
}

.vv-bar:hover ~ .vv-buffer-zone,
.vv-bar:active ~ .vv-buffer-zone {
  opacity: 0;
}

.vv-drag-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  border-left: 2px dashed var(--line-hover);
  opacity: 0;
  transition: .2s;
  pointer-events: none;
  z-index: 705;
}

.vv-bar:hover ~ .vv-drag-line {
  opacity: 1;
}

.vv-bar:active ~ .vv-drag-line {
  opacity: 1;
  border-left: 2px solid var(--line-active);
}

@supports (-moz-user-select: none) {
  .vv-bar {
    cursor: auto;
  }

  .vv-bar:hover ~ .vv-buffer-zone,
  .vv-bar:active ~ .vv-buffer-zone {
    opacity: 1;
  }

  .vv-bar:hover ~ .vv-drag-line {
    opacity: 0;
  }

  .vv-bar:active ~ .vv-drag-line {
    opacity: 0;
    border-left: 2px dashed var(--line-hover);
  }
}

/** 真正承载侧边栏内容的盒子 */
.vv-box {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  left: 4px;
  display: flex;
  justify-content: flex-end;
  overflow-x: hidden;
  overflow-y: auto;
  direction: ltr;
  background-color: var(--vice-bg);
  scrollbar-color: transparent transparent;
}

.vv-box_shadow {
  box-shadow: var(--vice-shadow);
}

.vv-inner-box {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.vv-box::-webkit-scrollbar-thumb {
  background: var(--vice-scrollbar-thumb);
  opacity: 0;
  transition: .15s;
}

.vv-box:hover {
  scrollbar-color: var(--vice-scrollbar-thumb) transparent;
}

.vv-box:hover::-webkit-scrollbar-thumb {
  opacity: 1;
}

</style>