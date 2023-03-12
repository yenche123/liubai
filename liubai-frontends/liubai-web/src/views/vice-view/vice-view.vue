<script setup lang="ts">
import { ref, toRefs } from "vue";
import { useViceView } from "./tools/useViceView"
import { useVvUI } from "./tools/useVvUI";
import type { VcState } from "./vice-content/tools/types";
import ViceContent from "./vice-content/vice-content.vue";
import IframeRestriction from "./iframe-restriction/iframe-restriction.vue";
import VueDraggableResizable from "vue-draggable-resizable/src/components/vue-draggable-resizable.vue";


const emits = defineEmits<{
  (e: "widthchange", widthPx: number): void
}>()

const { 
  vvData, 
  onResizing,
  onVvMouseEnter,
  onVvMouseLeave,
} = useViceView(emits)

const {
  openType,
  minVvPx,
  viceViewPx,
  vvHeightPx,
  maxVvPx,
  isAnimating,
  shadow,
  showHandle,
} = toRefs(vvData)

const {
  onStartDrag,
  isDraging,
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
    @mouseenter="onVvMouseEnter"
    @mouseleave="onVvMouseLeave"
  >

    <div class="vv-bg"
      :class="{ 'vv-bg_shadow': shadow }"
    ></div>

    <!-- 分割线  -->
    <div class="vv-space-line"></div>


    <!-- 装内容的盒子 -->
    <div class="vv-box">

      <div class="vv-inner-box">
        <ViceContent :is-outter-draging="isDraging"
          @vcstatechange="onVcStateChange"
        ></ViceContent>
      </div>
      
    </div>

    <!-- 放于底部给用户拖动的盒子 -->
    <vue-draggable-resizable
      @resizing="onResizing"
      :class-name="isAnimating ? 'liu-vv-vdr_animating' : 'liu-vv-vdr'"
      class-name-handle="liu-vv-vdr-handle"
      style="transform: translate(0px, 0px)"
      :w="viceViewPx"
      :h="vvHeightPx"
      :min-width="minVvPx"
      :max-width="maxVvPx"
      :active="true"
      :prevent-deactivation="true"
      :draggable="false"
      :resizable="true"
      :handles="['ml']"
      :z-index="706"
      @pointerdown="onStartDrag"
    >
      <template #ml>
        <div class="vv-handle-ml"></div>
      </template>
    </vue-draggable-resizable>
    
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
  height: 100dvh;
  z-index: 700;
  transition: .3s;
  direction: rtl;
}

.vv-container_hidden {
  transform: translateX(105%);
}

.vv-bg {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  left: 1.6px;
  background-color: var(--vice-bg);
}

.vv-bg_shadow {
  box-shadow: var(--vice-shadow);
}

.vv-space-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 1px;
  border-left: 1px solid var(--line-default);
  pointer-events: none;
}

.vv-handle-ml {
  height: 60px;
  width: 8px;
  background-color: var(--liu-drag-handle);
  border-radius: 4px;
  transition: .2s;
  opacity: v-bind("showHandle ? 1 : 0");
  position: absolute;
  left: 50%;
  top: 50%;
  margin-top: -30px;
  margin-left: -4px;
}

/** 真正承载侧边栏内容的盒子 */
.vv-box {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  left: 2px;
  display: flex;
  justify-content: flex-end;
  overflow-x: hidden;
  overflow-y: auto;
  direction: ltr;
  scrollbar-color: transparent transparent;
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
<style>

.liu-vv-vdr {
  direction: rtl;
  pointer-events: none;
}

.liu-vv-vdr_animating {
  direction: rtl;
  pointer-events: none;
  transition: .3s;
}

.liu-vv-vdr-handle {
  position: absolute;
  height: 100px;
  width: 20px;
  transition: 150ms;
  pointer-events: auto;
}

.liu-vv-vdr-handle-ml {
  top: 50%;
  margin-top: -50px;
  left: 0;
  margin-left: -9px;
  cursor: e-resize;
  transform-origin: center;
}

.liu-vv-vdr-handle-ml:active {
  transform: scale(1.2);
}

@media(hover: hover) {
  .liu-vv-vdr-handle-ml:hover {
    transform: scale(1.2);
  }
}

</style>