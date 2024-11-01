<script lang="ts" setup>
import { type CsEmits, csProps } from "./tools/types"
import liuApi from '~/utils/liu-api';
import middleBridge from '~/utils/middle-bridge';
import { useChatScroll } from "./tools/useChatScroll";

const props = defineProps(csProps)
const emits = defineEmits<CsEmits>()

const { cs, csData, onScrolling } = useChatScroll(props, emits)
const { isMobile } = liuApi.getCharacteristic()
const showScrollbarProperty = middleBridge.canShowScrollbarProperty()


</script>
<template>

  <div ref="cs" class="liu-chat-scroll" 
    :class="{ 
      'cs-scrollbar': showScrollbarProperty,
      'cs-scollbar_hidden': showScrollbarProperty && hiddenScrollBar,
    }"
    @scroll.passive="onScrolling"
  >
    <slot></slot>
    <div class="cs-offset"></div>
  </div>
  

</template>
<style scoped lang="scss">
.liu-chat-scroll {
  width: 100%;
  height: 100%;
  position: relative;
  overflow-y: auto;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  justify-content: flex-start;
  flex-wrap: nowrap;
  container-type: inline-size;
  container-name: liu-chat-scroll;

  &::-webkit-scrollbar {
    display: v-bind("isMobile || hiddenScrollBar ? 'none' : 'block'");
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }
}

.cs-scrollbar {
  scrollbar-color: var(--scrollbar-thumb) transparent;
  scrollbar-width: v-bind("isMobile || hiddenScrollBar ? 'none' : 'auto'");
}

.cs-scollbar_hidden {
  scrollbar-color: transparent transparent;
}

.cs-offset {
  width: 100%;
  height: v-bind("csData.offset + 'px'");
}

</style>
<style>

.liu-chat-scroll > * {
  flex: 0 0 auto;
}

</style>