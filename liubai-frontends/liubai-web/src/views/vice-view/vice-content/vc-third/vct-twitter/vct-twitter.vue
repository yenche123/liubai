<script setup lang="ts">
import { useDynamics } from "~/hooks/useDynamics";
import { useThirdScript } from "../tools/useThirdScript"
import thirdLink from "~/config/third-link";

const props = defineProps({
  link: {
    type: String
  },
  vcHeight: {
    type: Number,
    default: 0,
  },
})

const { theme } = useDynamics()
const { boxRef } = useThirdScript(thirdLink.TWITTER_WIDGETS)

</script>
<template>

  <div class="vct-twitter">

    <div class="vctt-container">

      <div class="vctt-box" ref="boxRef">
        <blockquote class="twitter-tweet" :data-theme="theme">
          <a :href="link" style="color: transparent;">Opening Twitter......</a>
        </blockquote>
      </div>
      <div class="vctt-virtual"></div>

    </div>

  </div>

</template>
<style scoped lang="scss">


.vct-twitter {
  width: 90%;
  min-width: 200px;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  height: v-bind("vcHeight + 'px'");
  max-height: v-bind("vcHeight + 'px'");
  overflow-y: auto;
}

.vctt-container {
  width: 100%;
  min-height: v-bind("vcHeight + 'px'");
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

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