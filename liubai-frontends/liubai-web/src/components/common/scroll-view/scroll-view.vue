<script lang="ts" setup>
import { PropType } from 'vue';
import liuApi from '~/utils/liu-api';
import { useScrollView } from './tools/useScrollView';

const props = defineProps({
  upperThreshold: {
    type: Number,
    default: 150
  },
  lowerThreshold: {
    type: Number,
    default: 150
  },
  direction: {
    type: String as PropType<"vertical" | "horizontal">,
    default: "vertical",
  },
  hiddenScrollbar: {
    type: Boolean,
    default: false,
  },
  goToTop: {
    type: Number,
    default: 0,
  }
})

const emits = defineEmits<{
  // 滚动时，已做防抖节流
  (event: "scroll", data: { scrollPosition: number }): void
  (event: "scrolltoend", data: { scrollPosition: number }): void
  (event: "scrolltostart", data: { scrollPosition: number }): void
  // 下拉刷新被触发
  (event: "refresh"): void
}>()

const { sv, scrollPosition, onScrolling } = useScrollView(props, emits)
const { isMobile } = liuApi.getCharacteristic()

</script>

<template>

  <div ref="sv" class="liu-scroll-view" 
    :class="{ 
      'liu-scroll-view_flex': direction === 'horizontal',
      'liu-scollbar_hidden': hiddenScrollbar,
    }"
    @scroll="onScrolling"
  >
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.liu-scroll-view {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: auto;
  display: v-bind("direction === 'horizontal' ? 'flex' : 'block'");
  align-items: flex-start;
  flex-wrap: nowrap;
  scrollbar-color: var(--scrollbar-thumb) transparent;

  &::-webkit-scrollbar {
    display: v-bind("isMobile ? 'none' : 'block'");
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }
}

.liu-scollbar_hidden {
  scrollbar-color: transparent transparent;

  &::-webkit-scrollbar {
    display: none;
  }
}

</style>
<style>

.liu-scroll-view_flex > div {
  flex: 0 0 auto;
}

</style>