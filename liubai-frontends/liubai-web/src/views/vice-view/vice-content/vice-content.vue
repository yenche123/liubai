<script setup lang="ts">
import { onMounted, ref } from 'vue';

const props = defineProps({
  isOutterDraging: {
    type: Boolean,
    default: false
  }
})

const iframeEl = ref<HTMLIFrameElement | null>(null)
const iframeSrc = ref("")
const I_SRC = "https://www.google.com/?igu=1"
const google_map_key = "AIzaSyCpLdXu0Smt4skm4P6tBfJ8kzE6vgZ9t40"

onMounted(() => {
  if(!iframeEl.value) {
    console.log("还没有获取到 iframeEl.............")
    return
  }
  const iframeWindow = iframeEl.value.contentWindow
  if(!iframeWindow) return
  const customUa = "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Mobile Safari/537.36"
  Object.defineProperty(iframeWindow.navigator, "userAgent", {
    value: customUa,
    writable: false
  })
  console.log("iframeWindow.navigator:")
  console.log(iframeWindow.navigator)
  console.log(" ")
  iframeSrc.value = I_SRC
})

</script>
<template>
  <!-- <iframe width="100%" height="100%" 
    :src="'https://www.google.com/maps/embed/v1/view?zoom=11&center=25.0330,121.5654&key=' + google_map_key" 
    title="Google Search"
  ></iframe> -->
  <iframe
    ref="iframeEl"
    width="100%" height="100%"
    :src="iframeSrc"
    class="vc-iframe"
  ></iframe>
  
  <div v-if="isOutterDraging" class="vc-cover"></div>

</template>
<style scoped>

.vc-iframe {
  border: none;
  overflow: auto;
}

.vc-cover {
  width: 100%;
  height: 100vh;
  margin-top: -101vh;
  background-color: aliceblue;
  opacity: 0.5;
}

</style>