<script setup lang="ts">
import { toRefs } from "vue";
import { useViceView } from "./tools/useViceView"
import { useVvUI } from "./tools/useVvUI";
import ViceContent from "./vice-content/vice-content.vue";

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


</script>
<template>
  <div class="vv-container"
    :class="{ 
      'vv-container_hidden': openType !== 'opened',
      'vv-container_shadow': shadow,
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

    <!-- 默认的分割线 -->
    <div class="vv-default-line"></div>

    <!-- 分割线到内容盒子的区域 4px -->
    <div class="vv-space-line"></div>

    <!-- 悬浮或拖动时显示的分割线 -->
    <div class="vv-drag-line"></div>

    <!-- 装内容的盒子 -->
    <div class="vv-box">

      <div class="vv-inner-box">
        <ViceContent :is-outter-draging="isDraging"></ViceContent>
      </div>
      
    </div>
    
  </div>
</template>
<style scoped>
.vv-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  background: #f5f5f0;
  z-index: 700;
  transition: .3s;
  direction: rtl;
}

.vv-container_hidden {
  transform: translateX(102%);
}

.vv-container_shadow {
  box-shadow: -7px 0 14px rgba(0,0,0,.11);
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

.vv-default-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-left: 2px solid #e6e6e6;
  transition: .2s;
  pointer-events: none;
}

.vv-space-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  border-left: 2px solid #dfe8f7;
  pointer-events: none;
}

.vv-bar:hover ~ .vv-default-line,
.vv-bar:active ~ .vv-default-line {
  opacity: 0;
}

.vv-drag-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-left: 2px dashed #bbbbbb;
  opacity: 0;
  transition: .2s;
  pointer-events: none;
}

.vv-bar:hover ~ .vv-drag-line {
  opacity: 1;
}

.vv-bar:active ~ .vv-drag-line {
  opacity: 1;
  border-left: 2px solid #aaaaaa;
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
  background-color: #dfe8f7;
}

.vv-inner-box {
  width: 100%;
  height: 100%;
  position: relative;
}

.vv-box::-webkit-scrollbar-thumb {
  background: #dfe8f7;
  opacity: 0;
  transition: .15s;
}

.vv-box:hover::-webkit-scrollbar-thumb {
  background: #84afd1;
}

.vv-content-box {
  width: 100%;
  height: 200px;
  margin-bottom: 50px;
  background-color: #fdeede;
}


</style>