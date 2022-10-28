<script setup lang="ts">
import cfg from "../../../../config"
import CustomEditor from "../../../../components/custom-editor/custom-editor.vue"
import AppLink from "../../../../components/common/app-link/app-link.vue"
import { useIndexContent } from "./tools/useIndexContent";

const virtualHeight = cfg.navi_height / 3
const { lastBar } = useIndexContent()

</script>
<template>

  <div class="mc-container">
    <div class="mc-virtual"></div>
    <div class="mc-box">
      
      <CustomEditor :last-bar="lastBar"></CustomEditor>
      <div class="mc-spacing"></div>

      <div class="mc-test">
        <AppLink to="?cid=sdfghjkhgfd">跳转到侧边栏详情页</AppLink>
      </div>

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

    .mc-test {
      border-radius: 20px;
      background-color: var(--card-bg);
      width: 100%;
      height: 100px;
      box-shadow: var(--card-shadow);
      margin-bottom: 30px;
    }

  }

}


</style>