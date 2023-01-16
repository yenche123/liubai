<script lang="ts" setup>
import liuApi from '~/utils/liu-api';
import { useRefresh } from './tools/useRefresh';
import { useScrollView } from './tools/useScrollView';

const props = defineProps({
  modelValue: {
    type: Boolean,
  },
  upperThreshold: {
    type: Number,
    default: 150
  },
  lowerThreshold: {
    type: Number,
    default: 150
  },
})

const emits = defineEmits<{
  // 滚动时，已做防抖节流
  (event: "scroll", data: { scrollTop: number }): void
  (event: "scrolltolower", data: { scrollTop: number }): void
  (event: "scrolltoupper", data: { scrollTop: number }): void
  // 下拉刷新被触发
  (event: "refresh"): void
}>()

const { sv, scrollTop, onScrolling } = useScrollView(props, emits)
const { 
  style1, style2, loadingScale, onTouchStart, onTouchMove, onTouchEnd 
} = useRefresh(props, emits, sv, scrollTop)

const { isMobile } = liuApi.getCharacteristic()

</script>

<template>

<!-- <div ref="sv" class="scroll-view" 
    @scroll="onScrolling"
    @mousedown="onTouchStart"
    @mousemove="onTouchMove"
    @mouseup="onTouchEnd"
    @mouseleave="onTouchEnd"
  > -->

  <div ref="sv" class="scroll-view" 
    @scroll="onScrolling"
  >
    <!-- <div class="sv-loading-container" :style="style1">
      <div class="sv-loading-box">
        <svg
          class="ring"
          viewBox="25 25 50 50"
          stroke-width="5"
          :style="style2"
        >
          <circle class="ring-circle" cx="50" cy="50" r="20" />
        </svg>
      </div>
    </div> -->

    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.scroll-view {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: auto;
}

.scroll-view::-webkit-scrollbar {
  display: v-bind("isMobile ? 'none' : 'block'");
}

.scroll-view::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
}

.sv-loading-container {
  width: 100%;
  overflow: hidden;

  .sv-loading-box {
    width: 100%;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.ring {
  --uib-size: 40px;
  --uib-speed: 2s;
  --uib-color: black;
  
  height: var(--uib-size);
  width: var(--uib-size);
  vertical-align: middle;
  transform-origin: center;
  transform: rotate(-90deg) v-bind("'scale(' + loadingScale + ')'");
  animation: rotate var(--uib-speed) linear infinite;
}

.ring-circle {
  fill: none;
  stroke: var(--uib-color);
  stroke-dasharray: 1 200;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: stretch calc(var(--uib-speed) * 0.75) ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(270deg) v-bind("'scale(' + loadingScale + ')'");
  }
}

@keyframes stretch {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 110, 200;
    stroke-dashoffset: -35px;
  }
  100% {
    stroke-dashoffset: -124px;
  }
}



</style>