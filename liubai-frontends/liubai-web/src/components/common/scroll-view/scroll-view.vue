<script lang="ts" setup>
import type { SvEmits } from "./tools/types"
import liuApi from '~/utils/liu-api';
import { useScrollView } from './tools/useScrollView';
import { svProps } from "./tools/types"
import middleBridge from "~/utils/middle-bridge";

const props = defineProps(svProps)
const emits = defineEmits<SvEmits>()

const { 
  sv, 
  svData,
  onScrolling,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
} = useScrollView(props, emits)
const { isMobile } = liuApi.getCharacteristic()
const showScrollbarProperty = middleBridge.canShowScrollbarProperty()

</script>
<template>

  <div ref="sv" class="liu-scroll-view" 
    :class="{ 
      'liu-scroll-view_flex': direction === 'horizontal',
      'sv-scrollbar': showScrollbarProperty,
      'liu-scollbar_hidden': showScrollbarProperty && hiddenScrollBar,
    }"
    @scroll.passive="onScrolling"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend.passive="onTouchEnd"
  >
    <slot></slot>

    <div class="sv-offset"
      :class="{ 'sv-offset_horizontal': direction === 'horizontal' }"
    ></div>

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
  container-type: inline-size;
  container-name: liu-scroll-view;

  /** refer: https://defensivecss.dev/tip/scrollbar-gutter/ */
  scrollbar-gutter: v-bind("isMobile ? 'auto' : 'stable'");

  &::-webkit-scrollbar {
    display: v-bind("isMobile || hiddenScrollBar ? 'none' : 'block'");
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }
}

.sv-scrollbar {
  scrollbar-color: var(--scrollbar-thumb) transparent;
  scrollbar-width: v-bind("isMobile || hiddenScrollBar ? 'none' : 'auto'");
}

.liu-scollbar_hidden {
  scrollbar-color: transparent transparent;
}

.sv-offset {
  width: 100%;
  height: v-bind("svData.offset + 'px'");
}

.sv-offset_horizontal {
  width: v-bind("svData.offset + 'px'");
  height: 1px;
}

</style>
<style>

.liu-scroll-view_flex > div {
  flex: 0 0 auto;
}

</style>