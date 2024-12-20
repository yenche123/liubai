<script setup lang="ts">
import { toRefs } from 'vue';
import { useSidebar } from './tools/useSidebar';
import { useSidebarOther } from './tools/useSidebarOther';
import { useSidebarRoute } from './tools/useSidebarRoute';
import SbContent from './sb-content/sb-content.vue';
import SbTags from './sb-tags/sb-tags.vue';
import SbFixed from './sb-fixed/sb-fixed.vue';
import SbBottom from './sb-bottom/sb-bottom.vue';
import SbOpen from './sb-open/sb-open.vue';

const {
  bgSrc,
  sbData, 
  onResizing,
  onSbMouseEnter,
  onSbMouseLeave,
  onTapOpenBtn,
  onTapCloseBtn,
} = useSidebar()

const {
  innerBoxWidth
} = useSidebarOther()

const { expandState } = useSidebarRoute()

const {
  openType,
  minSidebarPx,
  sidebarWidthPx,
  maxSidebarPx,
  isAnimating,
  sidebarHeightPx,
  showHandle,
  cursor,
} = toRefs(sbData)

</script>
<template>

  <div v-if="sbData.enable"
    class="sb-container"
    :class="{ 'sb-container_hidden': openType !== 'opened' }"
    @mouseenter="onSbMouseEnter"
    @mouseleave="onSbMouseLeave"
  >

    <!-- 默认的分割线 -->
    <div class="sb-default-line"></div>

    <!-- 存放背景颜色 -->
    <div class="sb-bg">
      <div class="sb-bg-mask"></div>
    </div>

    <!-- 1. 侧边栏主内容 -->
    <div class="sb-box"
      :class="{ 'sb-box-main_hidden': expandState !== '' }"
    >
      <div class="sb-inner-box">
        <SbContent
          :show="expandState === ''"
        ></SbContent>
      </div>
    </div>

    <!-- 2. 侧边栏展示标签 -->
    <div class="sb-box sb-box-other_hidden"
      :class="{ 'sb-box-other_show': expandState === 'tags' }"
    >
      <div class="sb-inner-box">
        <SbTags :show="expandState === 'tags'"></SbTags>
      </div>
    </div>

    <!-- 放于底部给用户拖动的盒子 -->
    <vue-draggable-resizable
      @resizing="onResizing"
      :class-name="isAnimating ? 'liu-vdr_animating' : 'liu-vdr'"
      class-name-handle="liu-vdr-handle"
      :w="sidebarWidthPx"
      :h="sidebarHeightPx"
      :min-width="minSidebarPx"
      :max-width="maxSidebarPx"
      :active="true"
      :prevent-deactivation="true"
      :draggable="false"
      :resizable="true"
      :handles="['mr']"
      :z-index="601"
    >
      <template #mr>
        <div class="sb-handle-mr"></div>
      </template>
    </vue-draggable-resizable>

    <!-- 侧边栏里的关闭按钮 -->
    <SbBottom :show-handle="showHandle"
      @tapclose="onTapCloseBtn"
    ></SbBottom>

  </div>

  <!-- fixed 布局、底部有黑色蒙层的 side-bar -->
  <SbFixed 
    :expand-state="expandState"
    :bg-src="bgSrc"
  ></SbFixed>

  <!-- 侧边栏关闭后，会显示在屏幕左下角的 open 按钮 -->
  <SbOpen
    @tapopen="onTapOpenBtn"
  ></SbOpen>

</template>
<style scoped>

.sb-container {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  height: 100vh;
  height: 100dvh;
  z-index: 600;
  transition: .3s;
  overflow: hidden;
  content-visibility: auto;
}

.sb-container_hidden {
  transform: translateX(-100%);
}

.sb-default-line {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 9.4px;
  border-right: 3px solid var(--line-default);
  transition: .2s;
  pointer-events: none;
}

.sb-bg {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 10px;
  background-color: var(--sidebar-bg);
  width: calc(100% - 10px);
  height: 100%;
}

.sb-bg::before {
  width: 100%;
  height: 100%;
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  background-image: v-bind("bgSrc");
  background-size: cover;
  background-position: left;
}

.sb-bg-mask {
  -webkit-backdrop-filter: blur(var(--blur-radius));
  backdrop-filter: blur(var(--blur-radius));
  width: 100%;
  height: 100%;
  background: var(--frosted-glass);
}

.sb-handle-mr {
  height: 60px;
  width: 8px;
  background-color: var(--liu-drag-handle);
  border-radius: 4px;
  transition: .2s;
  opacity: v-bind("showHandle ? 1 : 0");
  position: absolute;
  right: 50%;
  top: 50%;
  margin-top: -30px;
  margin-right: -4px;
}

/** 真正承载侧边栏内容的盒子 */
.sb-box {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 14px;
  display: flex;
  justify-content: flex-end;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 10px;
  transition: .4s;
  scrollbar-color: transparent transparent;
}

.sb-box-main_hidden {
  transform: translateX(-100%);
  opacity: .1;
}

.sb-box-other_hidden {
  transform: translateX(110%);
  opacity: 0;
}

.sb-box-other_show {
  transform: translateX(0);
  opacity: 1;
}

.sb-inner-box {
  width: v-bind("innerBoxWidth");
  /** max-content 浏览器兼容性: 所有浏览器皆支持 */
  /** https://developer.mozilla.org/zh-CN/docs/Web/CSS/height#%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E6%80%A7 */
  height: max-content;
  max-width: 500px;
  position: relative;
  transition: .3s;
  container-type: inline-size;
  container-name: sidebar;
}

</style>
<style>

.liu-vdr {
  pointer-events: none;
}

.liu-vdr_animating {
  pointer-events: none;
  transition: .45s;
}

.liu-vdr-handle {
  position: absolute;
  height: 100px;
  width: 20px;
  transition: 150ms;
  pointer-events: auto;
}

.liu-vdr-handle-mr {
  top: 50%;
  margin-top: -50px;
  right: 0px;
  cursor: v-bind("cursor");
  transform-origin: center;
}

@media(hover: hover) {
  .liu-vdr-handle-mr:hover {
    transform: scale(1.2);
  }
}

.liu-vdr-handle-mr:active {
  transform: scale(1.2);
}

</style>