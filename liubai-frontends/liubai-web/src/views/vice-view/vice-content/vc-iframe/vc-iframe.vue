<script lang="ts" setup>
import { useVcIframe } from "./tools/useVcIframe"

const props = defineProps({
  isOutterDraging: {
    type: Boolean,
    default: false
  },
  iframeSrc: {
    type: String
  },
  vcHeight: {
    type: Number,
    default: 0,
  },
  maskMarginTop: {
    type: Number,
    default: 0
  }
})

const {
  iframeEl,
  bgColor,
} = useVcIframe(props)

</script>
<template>

  <iframe
    v-if="iframeSrc"
    ref="iframeEl"
    width="100%" 
    :height="vcHeight"
    :src="iframeSrc"
    class="vcliu-iframe"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    frameborder="0"
    framespacing="0"
  ></iframe>
  
  <!-- 用于显示拖动时覆盖在 iframe 上的透明度白屏 -->
  <div class="vcliu-cover" :class="{ 'vcliu-cover_show': isOutterDraging }"></div>
</template>
<style scoped>

.vcliu-iframe {
  border: none;
  overflow: auto;
  background-color: v-bind("bgColor");
}

.vcliu-cover {
  width: 100%;
  height: v-bind("vcHeight + 'px'");
  margin-top: v-bind("maskMarginTop + 'px'");
  background-color: aliceblue;
  opacity: 0;
  visibility: hidden;
  transition: .3s;
  user-select: none;
}

.vcliu-cover_show {
  opacity: .6;
  visibility: visible;
}

</style>