<script setup lang="ts">
import { useSystemStore } from "~/hooks/stores/useSystemStore";
import { storeToRefs } from "pinia";
import { useThirdScript } from "../tools/useThirdScript"
import thirdLink from "~/config/third-link";
import { ref } from "vue"

defineProps({
  link: {
    type: String
  },
})

const systemStore = useSystemStore()
const { supported_theme } = storeToRefs(systemStore)
const { boxRef } = useThirdScript(thirdLink.IG_EMBED)
const showData = ref(false)
setTimeout(() => {
  showData.value = true
}, 1200)

</script>
<template>

  <div class="vctt-box" ref="boxRef"
    :class="{ 'vctt-box_show': showData }"
  >
    <blockquote class="instagram-media" 
      data-instgrm-captioned
      :data-instgrm-permalink="link"
      data-instgrm-version="14"
      :data-theme="supported_theme"
    >
    </blockquote>
  </div>

  <div class="vctt-virtual"></div>

</template>
<style scoped lang="scss">

.vctt-box {
  width: 328px;
  margin: 0 auto;
  height: auto;
  flex: none;
  position: relative;
  opacity: 0;
  transition: .25s;
}

.vctt-box_show {
  opacity: 1;
}

.instagram-media {
  width: 100%;
}

.vctt-virtual {
  width: 100%;
  height: 50px;
  flex: none;
}

</style>