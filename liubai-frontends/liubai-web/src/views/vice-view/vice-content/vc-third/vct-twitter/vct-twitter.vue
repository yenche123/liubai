<script setup lang="ts">
import { useDynamics } from "~/hooks/useDynamics";
import { useThirdScript } from "../tools/useThirdScript"
import thirdLink from "~/config/third-link";

const props = defineProps({
  link: {
    type: String
  },
})

const { theme } = useDynamics()
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