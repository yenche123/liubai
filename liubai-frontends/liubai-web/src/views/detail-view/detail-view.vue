<script setup lang="ts">
import { toRefs } from "vue";
import { useDetailView } from "./tools/useDetailView"

const { dvData, dvEl } = useDetailView()
const {
  openType,
  minDvPx,
  firstDvPx,
  maxDvPx,
  isAnimating,
} = toRefs(dvData)

</script>
<template>
  <div class="dv-container"
    :class="{ 'dv-container_hidden': openType !== 'opened'}"
  >
    <!-- 放于底部给用户拖动的盒子 -->
    <div
      ref="dvEl" 
      class="dv-bar"
      :style="{
        minWidth: minDvPx > 0 ? minDvPx + 'px' : undefined,
        maxWidth: maxDvPx > 0 ? maxDvPx + 'px' : undefined 
      }"
      :class="{ 'dv-bar_animating': isAnimating }"
    ></div>

    <!-- 默认的分割线 -->
    <div class="dv-default-line"></div>

    <!-- 分割线到内容盒子的区域 4px -->
    <div class="dv-space-line"></div>

    <!-- 悬浮或拖动时显示的分割线 -->
    <div class="dv-drag-line"></div>

    <!-- 装内容的盒子 -->
    <div class="dv-box">
      <div class="dv-inner-box">

        <div class="dv-content-box"></div>

        <div class="dv-content-box"></div>

        <div class="dv-content-box"></div>

        <div class="dv-content-box"></div>

        <div class="dv-content-box"></div>

        <div class="dv-content-box"></div>
        <div class="dv-content-box"></div>

      </div>
    </div>
    
  </div>
</template>
<style scoped>
.dv-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  background: #f5f5f0;
  z-index: 500;
  transition: .3s;
}

.dv-container_hidden {
  transform: translateX(100%);
}

.dv-bar {
  width: v-bind("firstDvPx + 'px'");
  height: inherit;
  resize: horizontal;
  cursor: ew-resize;
  opacity: 0;
  overflow: scroll;   /** 这一行一定要是 scroll 否则无法拖动 */
}

.dv-bar_animating {
  transition: .3s;
}

/* 没有以下该属性 竖直拖动条会不生效 */
.dv-bar::-webkit-scrollbar {
  width: 200px;
  height: inherit;
}

.dv-default-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-right: 2px solid #e6e6e6;
  transition: .2s;
  pointer-events: none;
}

.dv-space-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  border-right: 2px solid #dfe8f7;
  pointer-events: none;
}

.dv-bar:hover ~ .dv-default-line {
  opacity: 0;
}

.dv-drag-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-right: 2px dashed #bbbbbb;
  opacity: 0;
  transition: .2s;
  pointer-events: none;
}

.dv-bar:hover ~ .dv-drag-line {
  opacity: 1;
}

/** 真正承载侧边栏内容的盒子 */
.dv-box {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  left: 4px;
  display: flex;
  justify-content: flex-end;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #dfe8f7;
  padding-left: 10px;
}

.dv-inner-box {
  width: 80%;
  max-width: 500px;
  position: relative;
}

.dv-box::-webkit-scrollbar-thumb {
  background: #dfe8f7;
  opacity: 0;
  transition: .15s;
}

.dv-box:hover::-webkit-scrollbar-thumb {
  background: #84afd1;
}

.dv-content-box {
  width: 100%;
  height: 200px;
  margin-bottom: 50px;
  background-color: #fdeede;
}


</style>