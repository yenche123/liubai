<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useViceContent } from "./tools/useViceContent";
import { useVcHeight } from "./tools/useVcHeight";
import cfg from "../../../config"

const { iframeHeight, maskMarginTop } = useVcHeight()

const props = defineProps({
  isOutterDraging: {
    type: Boolean,
    default: false
  }
})

const { iframeSrc, iframeEl, onTapBack } = useViceContent()
const google_map_key = "AIzaSyCpLdXu0Smt4skm4P6tBfJ8kzE6vgZ9t40"

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

const onIframeLoad = (e: Event) => {
  console.log("onIframeLoad............")
  console.log(e)
  console.log(" ")
}

</script>
<template>
  <!-- <iframe width="100%" height="100%" 
    :src="'https://www.google.com/maps/embed/v1/view?zoom=11&center=25.0330,121.5654&key=' + google_map_key" 
    title="Google Search"
  ></iframe> -->

  <div class="vc-btn" @click="onTapBack">返回</div>

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

.vc-btn {
  cursor: pointer;
  width: 100%;
  height: v-bind("cfg.vice_navi_height + 'px'");
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  color: var(--on-primary);
  background-color: var(--primary-color);
}





</style>