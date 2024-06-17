<script lang="ts" setup>
import type { PropType } from "vue";
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
  },
  otherData: {
    type: Object as PropType<Record<string, any>>,
  }
})

const {
  iframeEl,
  bgColor,
  isCard,
  styles,
} = useVcIframe(props)

</script>
<template>

  <div class="vcliu-virtual" :style="{ 'height': styles.topVirtual + 'px'  }"></div>

  <iframe
    v-if="iframeSrc"
    ref="iframeEl"
    :width="styles.width" 
    :height="styles.height"
    :src="iframeSrc"
    class="vcliu-iframe"
    :class="{ 'vcliu-iframe_card': isCard }"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    frameborder="0"
    framespacing="0"
  ></iframe>

  <div class="vcliu-virtual" :style="{ 'height': styles.bottomVirtual + 'px' }"></div>
  
  <!-- 用于显示拖动时覆盖在 iframe 上的透明度白屏 -->
  <div class="liu-no-user-select vcliu-cover" 
    :class="{ 'vcliu-cover_show': isOutterDraging }"
  ></div>
</template>
<style scoped>

.vcliu-virtual {
  width: 100%;
}

.vcliu-iframe {
  border: none;
  overflow: auto;
  background-color: v-bind("bgColor");
  position: relative;
  display: block;
}

.vcliu-iframe_card {
  margin: 0 auto;
}

.vcliu-cover {
  width: 100%;
  height: v-bind("vcHeight + 'px'");
  margin-top: v-bind("maskMarginTop + 'px'");
  background-color: aliceblue;
  opacity: 0;
  visibility: hidden;
  transition: .3s;
}

.vcliu-cover_show {
  opacity: .6;
  visibility: visible;
}

</style>