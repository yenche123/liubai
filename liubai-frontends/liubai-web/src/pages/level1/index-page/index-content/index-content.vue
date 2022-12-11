<script setup lang="ts">
import cfg from "../../../../config"
import CustomEditor from "../../../../components/custom-editor/custom-editor.vue"
import { useIndexContent } from "./tools/useIndexContent";
import ThreadList from "../../../../components/level1/thread-list/thread-list.vue"

const virtualHeight = cfg.navi_height / 3
const shortVirtual = cfg.navi_height / 9
const { lastBar, showTop } = useIndexContent()

</script>
<template>

  <div class="mc-container">
    <div class="mc-virtual"
      :class="{ 'mc-virtual_short': !showTop }"
    ></div>
    <div class="mc-box">
      
      <CustomEditor :last-bar="lastBar"></CustomEditor>
      <div class="mc-spacing"></div>

      <ThreadList></ThreadList>

    </div>

  </div>
  
</template>
<style scoped lang="scss">

.mc-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  .mc-virtual {
    width: 100%;
    height: v-bind("virtualHeight + 'px'");
    max-height: v-bind("virtualHeight + 'px'");
    transition: .15s;
  }

  .mc-virtual_short {
    max-height: v-bind("shortVirtual + 'px'");
  }


  .mc-box {
    width: 90%;
    max-width: var(--card-max);
    min-width: var(--card-min);
    position: relative;

    .mc-spacing {
      width: 100%;
      height: 10px;
    }

  }

}


</style>