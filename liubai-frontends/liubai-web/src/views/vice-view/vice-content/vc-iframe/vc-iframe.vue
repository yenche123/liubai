<script lang="ts" setup>
import { ref } from "vue"
import { useViHeight } from "./tools/useViHeight"

const iframeEl = ref<HTMLIFrameElement | null>(null)
const { iframeHeight, maskMarginTop } = useViHeight()

defineProps({
  isOutterDraging: {
    type: Boolean,
    default: false
  },
  iframeSrc: {
    type: String
  },
})

</script>
<template>

  <iframe
    v-if="iframeSrc"
    ref="iframeEl"
    width="100%" 
    :height="iframeHeight"
    :src="iframeSrc"
    class="vc-iframe"
  ></iframe>
  
  <!-- 用于显示拖动时覆盖在 iframe 上的透明度白屏 -->
  <div class="vc-cover" :class="{ 'vc-cover_show': isOutterDraging }"></div>
</template>
<style scoped>

.vc-iframe {
  border: none;
  overflow: auto;
}

.vc-cover {
  width: 100%;
  height: v-bind("iframeHeight + 'px'");
  margin-top: v-bind("maskMarginTop + 'px'");
  background-color: aliceblue;
  opacity: 0;
  visibility: hidden;
  transition: .3s;
  user-select: none;
}

.vc-cover_show {
  opacity: .5;
  visibility: visible;
}

</style>