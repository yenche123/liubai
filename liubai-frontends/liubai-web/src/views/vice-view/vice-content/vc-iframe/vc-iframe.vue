<script lang="ts" setup>
import { ref } from "vue"

const iframeEl = ref<HTMLIFrameElement | null>(null)

defineProps({
  isOutterDraging: {
    type: Boolean,
    default: false
  },
  iframeSrc: {
    type: String
  },
  show: {
    type: Boolean,
    required: true
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

</script>
<template>

  <iframe
    v-if="iframeSrc"
    v-show="show"
    ref="iframeEl"
    width="100%" 
    :height="vcHeight"
    :src="iframeSrc"
    class="vc-iframe"
  ></iframe>
  
  <!-- 用于显示拖动时覆盖在 iframe 上的透明度白屏 -->
  <div v-show="show" class="vc-cover" :class="{ 'vc-cover_show': isOutterDraging }"></div>
</template>
<style scoped>

.vc-iframe {
  border: none;
  overflow: auto;
}

.vc-cover {
  width: 100%;
  height: v-bind("vcHeight + 'px'");
  margin-top: v-bind("maskMarginTop + 'px'");
  background-color: aliceblue;
  opacity: 0;
  visibility: hidden;
  transition: .3s;
  user-select: none;
}

.vc-cover_show {
  opacity: .6;
  visibility: visible;
}

</style>