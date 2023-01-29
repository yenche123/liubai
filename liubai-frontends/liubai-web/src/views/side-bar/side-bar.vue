<script setup lang="ts">
import { toRefs } from 'vue';
import { useSidebar } from './tools/useSidebar';
import { useSidebarOther } from './tools/useSidebarOther';
import { useSidebarRoute } from './tools/useSidebarRoute';
import SbContent from './sb-content/sb-content.vue';
import SbTags from './sb-tags/sb-tags.vue';
import SbFixed from './sb-fixed/sb-fixed.vue';
import { useImages } from '../../hooks/useImages';
import 'vue-draggable-resizable/dist/VueDraggableResizable.css'
import VueDraggableResizable from "vue-draggable-resizable/src/components/vue-draggable-resizable.vue";

const { images } = useImages()
const {
  sbData, 
  onResizing,
  onSbMouseEnter,
  onSbMouseLeave,
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
} = toRefs(sbData)

</script>
<template>

  <div class="sb-container"
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
      :z-index="501"
    >
      <template #mr>
        <div class="sb-handle-mr"></div>
      </template>
    </vue-draggable-resizable>

    

    <!-- 1. 侧边栏主内容 -->
    <div class="sb-box"
      :class="{ 'sb-box-main_hidden': expandState !== '' }"
    >
      <div class="sb-inner-box">
        <SbContent :show="expandState === ''"></SbContent>
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


  </div>

  <!-- fixed 布局、底部有黑色蒙层的 side-bar -->
  <SbFixed :expand-state="expandState"></SbFixed>

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
  overflow: hidden;
}

.sb-container_hidden {
  transform: translateX(-100%);
}

.sb-default-line {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 7px;
  border-right: 3px solid var(--line-default);
  transition: .2s;
  pointer-events: none;
}

.sb-bg {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 8px;
  background-color: var(--sidebar-bg);
  width: calc(100% - 8px);
  height: 100%;
}

.sb-bg::before {
  width: 100%;
  height: 100%;
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  background-image: v-bind("'url(' + images.bg1 + ')'");
  background-size: cover;
  background-position: left;
}

.sb-bg-mask {
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  width: 100%;
  height: 100%;
  background-color: var(--frosted-glass);
}

.sb-handle-mr {
  height: 60px;
  width: 8px;
  background-color: var(--liu-drag-handle);
  border-radius: 4px;
  transition: .2s;
  opacity: v-bind("showHandle ? 1 : 0");
  position: absolute;
  right: 4px;
  top: 50%;
  margin-top: -30px;
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
  transition: .3s;
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
}

</style>
<style>

.liu-vdr {
  height: inherit;
}

.liu-vdr_animating {
  height: inherit;
  transition: .3s;
}

.liu-vdr-handle {
  position: absolute;
  height: 70px;
  width: 14px;
  transition: 150ms;
}

.liu-vdr-handle-mr {
  top: 50%;
  margin-top: -35px;
  right: 0px;
  cursor: e-resize;
  transform-origin: center;
}

.liu-vdr-handle-mr:active {
  transform: scale(1.2);
}

@media(hover: hover) {
  .liu-vdr-handle-mr:hover {
    transform: scale(1.2);
  }
}

</style>