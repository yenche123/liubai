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

</style>
<style>

.liu-scroll-view_flex > div {
  flex: 0 0 auto;
}

</style>