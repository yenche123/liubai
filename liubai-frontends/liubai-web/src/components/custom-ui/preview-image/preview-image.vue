<script setup lang="ts">
import PiContent from "./pi-content/pi-content.vue"
import { initPreviewImage } from "./index"

const {
  enable,
  show,
  TRANSITION_DURATION,
  data,
  onTapCancel,
  onPiSwiper,
} = initPreviewImage()

</script>
<template>

  <div v-if="enable" 
    class="pi-container"
    :class="{ 'pi-container_show': show }"
    @click="onTapCancel"
  >
    <PiContent 
      :current-index="data.index" 
      :imgs="data.imgs"
      :view-transition-name="data.viewTransition ? 'preview-image' : undefined"
      @swiper="onPiSwiper"
    ></PiContent>
  </div>

</template>
<style lang="scss" scoped>

.pi-container {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  user-select: none;
  opacity: 0;
  background-color: rgba(0, 0, 0, 1);
  transition: v-bind("TRANSITION_DURATION + 'ms'");
  z-index: 3000;
}

.pi-container_show {
  opacity: 1;
}

/** pc 设备，背景有透明度 */
@media(hover: hover) {
  .pi-container {
    background-color: rgba(0, 0, 0, .86);
  }
}

</style>

<style lang="scss">

.liu-previewing-image {
  @keyframes fade-in {
    from { opacity: 0; }
  }

  @keyframes fade-out {
    to { opacity: 0; }
  }
  
  &::view-transition-old(root) {
    /** https://cubic-bezier.com/#.4,0,1,1  这个曲线会慢进，正常速率结束 */
    /** 100ms 表示等待 100ms 再执行该动画 */
    animation: 200ms cubic-bezier(0.4, 0, 1, 1) 100ms both fade-out;
  }

  &::view-transition-new(root) {
    /** https://cubic-bezier.com/#0,0,.2,1  这个曲线会快进，较慢结束 */
    animation: 200ms cubic-bezier(0, 0, 0.2, 1) 100ms both fade-in;
  }
  
  &::view-transition-old(preview-image),
  &::view-transition-new(preview-image) {
    animation: none;
    mix-blend-mode: normal;
    height: 100%;
    overflow: clip;
  }

  ::view-transition-image-pair(preview-image) {
    isolation: none;
  }
}

.liu-show-preview-image {
  &::view-transition-old(root) {
    z-index: 1;
  }

  &::view-transition-new(root) {
    z-index: 9999;
  }
  
  &::view-transition-old(preview-image) {
    object-fit: contain;
  }

  &::view-transition-new(preview-image) {
    object-fit: cover;
  }
}

.liu-close-preview-image {
  &::view-transition-old(root) {
    z-index: 9999;
  }

  &::view-transition-new(root) {
    z-index: 1;
  }

  &::view-transition-old(preview-image) {
    object-fit: cover;
  }

  &::view-transition-new(preview-image) {
    object-fit: contain;
  }
}

</style>