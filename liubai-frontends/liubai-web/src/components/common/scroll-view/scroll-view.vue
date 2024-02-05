<script lang="ts" setup>
import type { SvEmits } from "./tools/types"
import liuApi from '~/utils/liu-api';
import { useScrollView } from './tools/useScrollView';
import { svProps } from "./tools/types"

const props = defineProps(svProps)
const emits = defineEmits<SvEmits>()

const { sv, onScrolling } = useScrollView(props, emits)
const { isMobile } = liuApi.getCharacteristic()

</script>
<template>

  <div ref="sv" class="liu-scroll-view" 
    :class="{ 
      'liu-scroll-view_flex': direction === 'horizontal',
      'liu-scollbar_hidden': hiddenScrollBar,
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

  /** 下面两个属性限定 Firefox */
  scrollbar-color: var(--scrollbar-thumb) transparent;
  scrollbar-width: v-bind("isMobile ? 'none' : 'auto'");

  &::-webkit-scrollbar {
    display: v-bind("isMobile || hiddenScrollBar ? 'none' : 'block'");
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }
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