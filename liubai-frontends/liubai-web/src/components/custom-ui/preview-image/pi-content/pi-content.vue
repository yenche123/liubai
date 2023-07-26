<script setup lang="ts">
import { Swiper, Zoom } from "swiper"
import { Swiper as VueSwiper, SwiperSlide } from 'swiper/vue';

import { ref, shallowRef } from 'vue';
import { usePiContent } from "./tools/usePiContent";
import { picProps } from "./tools/types"
import type { PicEmits } from "./tools/types"

// 引入样式
import 'swiper/css';
import 'swiper/css/zoom';

const iconColor = "rgba(255, 255, 255, .95)"

const props = defineProps(picProps)
const emit = defineEmits<PicEmits>()

const { 
  covers, 
  coverLength,
  onBoxPointerDown,
  onBoxPointerUp,
  onZoomChange,
} = usePiContent(props, emit)
const modules = [Zoom]
    
let _swiper = shallowRef<Swiper | null>(null)
const leftArrow = ref(false)
const rightArrow = ref(false)
const cLen = coverLength.value
if(cLen > 1) {
  if(props.currentIndex > 0) leftArrow.value = true
  if(props.currentIndex < cLen - 1) rightArrow.value = true
}

const onSlideChange = (swiper: Swiper) => {
  const actIdx = swiper.activeIndex
  leftArrow.value = actIdx > 0
  rightArrow.value = actIdx < (coverLength.value - 1)
}

const onTapLeft = (e: MouseEvent) => {
  if(!_swiper.value) return
  _swiper.value.slidePrev()
}

const onTapRight = (e: MouseEvent) => {
  if(!_swiper.value) return
  _swiper.value.slideNext()
}
    
const onSwiper = (swiper: Swiper) => {
  swiper.activeIndex = props.currentIndex
  _swiper.value = swiper
  emit("swiper", swiper)
}

</script>
<template>
  <VueSwiper @swiper="onSwiper" 
    @slideChange="onSlideChange"
    :modules="modules"
    :zoom="true"
    @zoom-change="onZoomChange"
  >
    <template v-for="(item, index) in covers" :key="item.id">
      <SwiperSlide>

        <!-- slide 盒子 -->
        <div class="pi-scroll-box" 
          @pointerdown="onBoxPointerDown"
          @pointerup="onBoxPointerUp"
        >
          <!-- 再给出这个 slide 可以上下左右自动对齐的盒子 -->
          <div class="pi-item swiper-zoom-container">
            <liu-img :src="item.src" 
              object-fit="cover" class="pi-image" 
              :style="{
                'width': item.width + 'px',
                'height': item.height + 'px',
              }"
              bg-color="transparent"
              :width="item.width"
              :height="item.height"
              :blurhash="item.blurhash"
              :disableTransition="currentIndex === index && viewTransitionName ? true : false"
              :view-transition-name="currentIndex === index ? viewTransitionName : undefined"
            ></liu-img>
          </div>

        </div>
      </SwiperSlide>
    </template>
  </VueSwiper>

  <!-- 右上角: x按钮 -->
  <div class="pi-close" @click.stop="$emit('cancel')">
    <svg-icon name="close" class="pi-close-icon" :color="iconColor"></svg-icon>
  </div>

  <!-- 往左 -->
  <div class="pi-direction pi-left" v-if="leftArrow" @click.stop="onTapLeft">
    <svg-icon name="arrow-right2" class="pid-icon pid-rotated" :color="iconColor"></svg-icon>
  </div>

  <!-- 往右 -->
  <div class="pi-direction pi-right" v-if="rightArrow" @click.stop="onTapRight">
    <svg-icon name="arrow-right2" class="pid-icon" :color="iconColor"></svg-icon>
  </div>
</template>
<style scoped lang="scss">

.pi-scroll-box {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow-x: hidden;
  overflow-y: hidden;
}

.pi-item {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .pi-image {
    width: 100%;
    height: 100%;
    max-width: 100vw;
    max-height: 100vh;
    max-height: 100dvh;
    transition: .2s;
  }

}

.pi-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: .2s;
  opacity: .33;
  background-color: transparent;
  cursor: pointer;
  z-index: 999;

  &:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, .5);
  }

  .pi-close-icon {
    width: 30px;
    height: 30px;
  }
}

.pi-direction {
  position: absolute;
  top: 50%;
  width: 90px;
  height: 60vh;
  height: 60dvh;
  margin-top: -30vh;
  margin-top: -30dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: .2s;
  opacity: .33;
  background-color: transparent;
  cursor: pointer;
  z-index: 999;

  &:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, .5);
  }

  .pid-icon {
    width: 30px;
    height: 30px;
  }

  .pid-rotated {
    transform: rotate(180deg);
  }
}

.pi-left {
  left: 0;
}

.pi-right {
  right: 0;
}

@media screen and (max-width: 600px) {
  .pi-close {
    display: none;
  }

  .pi-direction {
    display: none;
  }
}

</style>