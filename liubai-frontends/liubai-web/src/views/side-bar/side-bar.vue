<script setup lang="ts">
import { toRefs } from 'vue';
import { useSidebar } from './tools/useSidebar';
import { useSidebarOther } from './tools/useSidebarOther';
import SvgIcon from '../../assets/svg-icon.vue';

const { sidebarEl, sbData } = useSidebar()
const {
  innerBoxWidth
} = useSidebarOther()

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

        <div class="sb-virtual-box"></div>

        <div class="sb-navi-box">
          <SvgIcon class="sbnb-icon" name="arrow-back"></SvgIcon>
          <span>标签</span>
        </div>

        <div class="sb-virtual-box"></div>

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

/* 没有以下该属性 只会在右小角一个很小的区域能 drag */
.sb-bar::-webkit-scrollbar {
  width: 200px;
  height: inherit;
}

.sb-default-line {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 4px;
  border-right: 2px solid var(--line-default);
  transition: .2s;
  pointer-events: none;
}

.sb-space-line {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 6px;
  border-right: 4px solid var(--sidebar-bg);
  pointer-events: none;
}

.sb-bar:hover ~ .sb-default-line, 
.sb-bar:active ~ .sb-bar-default-line {
  border-right: 2px solid var(--sidebar-bg);
}

.sb-drag-line {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 4px;
  border-right: 2px dashed var(--line-hover);
  opacity: 0;
  transition: .2s;
  pointer-events: none;
}

.sb-bar:hover ~ .sb-drag-line {
  opacity: 1;
}

.sb-bar:active ~ .sb-drag-line {
  opacity: 1;
  border-right: 2px dashed var(--line-active);
}

/** 真正承载侧边栏内容的盒子 */
.sb-box {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 6px;
  display: flex;
  justify-content: flex-end;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: var(--sidebar-bg);
  padding-right: 10px;
}

.sb-box::-webkit-scrollbar-thumb {
  background-color: var(--sidebar-bg);
  transition: .15s;
}

.sb-box:hover::-webkit-scrollbar-thumb {
  background-color: var(--sidebar-scrollbar-thumb);
}


.sb-inner-box {
  width: v-bind("innerBoxWidth");
  /** max-content 浏览器兼容性: 所有浏览器皆支持 */
  /** https://developer.mozilla.org/zh-CN/docs/Web/CSS/height#%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E6%80%A7 */
  height: max-content;
  max-width: 500px;
  position: relative;
  transition: .3s;
}

.sb-navi-box {
  padding-top: 10px;
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  position: sticky;
  background-color: cadetblue;
  color: var(--main-text);
  font-size: var(--title-font);
  top: 0;
}

.sbnb-icon {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  border-radius: 8px;
  transition: .3s;
  cursor: pointer;
}

.sbnb-icon:hover {
  background-color: antiquewhite;
}

.sb-virtual-box {
  width: 100%;
  height: 20px;
}


.sb-content-box {
  width: 100%;
  height: 200px;
  margin-bottom: 50px;
  background-color: #fdeede;
}

</style>