<script setup lang="ts">
import { toRefs } from 'vue';
import { useSidebar } from './tools/useSidebar';

const { sidebarEl, sbData } = useSidebar()

const {
  openType,
  minSidebarPx,
  firstSidebarPx,
  maxSidebarPx,
  isAnimating,
} = toRefs(sbData)

</script>
<template>

  <div class="sb-container"
    :class="{ 'sb-container_hidden': openType !== 'opened' }"
  >
    <!-- 放于底部给用户拖动的盒子 -->
    <div
      ref="sidebarEl" 
      class="sb-bar"
      :style="{
        minWidth: minSidebarPx > 0 ? minSidebarPx + 'px' : undefined,
        maxWidth: maxSidebarPx > 0 ? maxSidebarPx + 'px' : undefined 
      }"
      :class="{ 'sb-bar_animating': isAnimating }"
    ></div>

    <!-- 默认的分割线 -->
    <div class="sb-default-line"></div>

    <!-- 分割线到内容盒子的区域 4px -->
    <div class="sb-space-line"></div>

    <!-- 悬浮或拖动时显示的分割线 -->
    <div class="sb-drag-line"></div>

    <!-- 装内容的盒子 -->
    <div class="sb-box">
      <div class="sb-inner-box">

        <div class="sb-content-box"></div>

        <div class="sb-content-box"></div>

        <div class="sb-content-box"></div>

        <div class="sb-content-box"></div>

        <div class="sb-content-box"></div>

        <div class="sb-content-box"></div>
        <div class="sb-content-box"></div>

      </div>
    </div>


  </div>

  <!-- 如果是弹出层 底部多一个黑色的蒙层 -->

</template>
<style scoped>

.sb-container {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  height: 100vh;
  background: #f5f5f0;
  z-index: 500;
  transition: .3s;
}

.sb-container_hidden {
  transform: translateX(-100%);
}

.sb-bar {
  width: v-bind("firstSidebarPx + 'px'");
  height: inherit;
  resize: horizontal;
  cursor: ew-resize;
  opacity: 0;
  overflow: scroll;   /** 这一行一定要是 scroll 否则无法拖动 */
}

.sb-bar_animating {
  transition: .3s;
}

/* 没有以下该属性 竖直拖动条会不生效 */
.sb-bar::-webkit-scrollbar {
  width: 200px;
  height: inherit;
}

.sb-default-line {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 4px;
  border-right: 2px solid #e6e6e6;
  transition: .2s;
  pointer-events: none;
}

.sb-space-line {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 6px;
  border-right: 2px solid #dfe8f7;
  pointer-events: none;
}

.sb-bar:hover ~ .sb-default-line {
  opacity: 0;
}

.sb-drag-line {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 4px;
  border-right: 2px dashed #bbbbbb;
  opacity: 0;
  transition: .2s;
  pointer-events: none;
}

.sb-bar:hover ~ .sb-drag-line {
  opacity: 1;
}

/** 真正承载侧边栏内容的盒子 */
.sb-box {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 8px;
  display: flex;
  justify-content: flex-end;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #dfe8f7;
  padding-right: 10px;
}

.sb-inner-box {
  width: 80%;
  max-width: 500px;
  position: relative;
}

.sb-box::-webkit-scrollbar-thumb {
  background: #dfe8f7;
  opacity: 0;
  transition: .15s;
}

.sb-box:hover::-webkit-scrollbar-thumb {
  background: #84afd1;
}

.sb-content-box {
  width: 100%;
  height: 200px;
  margin-bottom: 50px;
  background-color: #fdeede;
}



</style>