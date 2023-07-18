<script setup lang="ts">
import { useThirdScript } from "../tools/useThirdScript"
import thirdLink from "~/config/third-link";

const props = defineProps({
  link: {
    type: String
  },
})

const { boxRef } = useThirdScript(thirdLink.CALENDLY_WIDGETS)

</script>
<template>

  <div class="vctt-box" ref="boxRef">
    <div class="calendly-inline-widget" 
      :data-url="link"
      style="position: relative; width: 100%; height: 100%;"
    ></div>
  </div>

</template>
<style scoped lang="scss">

.vctt-box {
  width: 100%;
  height: 100%;
  flex: none;
  position: relative;
}


</style>