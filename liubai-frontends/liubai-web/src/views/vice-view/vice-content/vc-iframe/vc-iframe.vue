<script lang="ts" setup>
import { ref, onMounted } from "vue"
import { useViHeight } from "./tools/useViHeight"

const iframeEl = ref<HTMLIFrameElement | null>(null)
const { iframeHeight, maskMarginTop } = useViHeight()

onMounted(() => {
  if(!iframeEl.value) {
    return
  }
  const iframeWindow = iframeEl.value.contentWindow
  if(!iframeWindow) return
  const customUa = "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Mobile Safari/537.36"
  Object.defineProperty(iframeWindow.navigator, "userAgent", {
    value: customUa,
    writable: false
  })
})

defineProps({
  isOutterDraging: {
    type: Boolean,
    default: false
  },
  iframeSrc: {
    type: String
  },
})

const onIframeLoad = (e: Event) => {
  console.log("onIframeLoad............")
  console.log(e)
  console.log(" ")
}

</script>
<template>

  <iframe
    v-if="iframeSrc"
    ref="iframeEl"
    width="100%" 
    :height="iframeHeight"
    :src="iframeSrc"
    class="vc-iframe"
    @load="onIframeLoad"
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