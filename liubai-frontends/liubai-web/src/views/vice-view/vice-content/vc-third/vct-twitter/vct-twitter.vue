<script setup lang="ts">
import { useThirdScript } from "../tools/useThirdScript"
import thirdLink from "~/config/third-link";
import { useSystemStore } from "~/hooks/stores/useSystemStore";
import { storeToRefs } from "pinia";

const props = defineProps({
  link: {
    type: String
  },
})

const systemStore = useSystemStore()
const { supported_theme: theme } = storeToRefs(systemStore)
const { boxRef } = useThirdScript(thirdLink.TWITTER_WIDGETS)

</script>
<template>

  <div class="vctt-box" ref="boxRef">
    <blockquote class="twitter-tweet" :data-theme="theme">
      <a :href="link" style="color: transparent;">Opening Twitter......</a>
    </blockquote>
  </div>
  <div class="vctt-virtual"></div>

</template>
<style scoped lang="scss">

.vctt-box {
  width: 100%;
  height: auto;
  flex: none;
}

.vctt-virtual {
  width: 100%;
  height: 50px;
  flex: none;
}


</style>