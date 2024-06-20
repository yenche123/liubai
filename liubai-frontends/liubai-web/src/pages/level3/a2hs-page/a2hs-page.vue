<script setup lang="ts">
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';
import A2hsDesktop from "./a2hs-desktop/a2hs-desktop.vue";
import A2hsMobile from "./a2hs-mobile/a2hs-mobile.vue";
import liuApi from "~/utils/liu-api";
import { onActivated } from "vue";
import middleBridge from "~/utils/middle-bridge";

const cha = liuApi.getCharacteristic()

onActivated(() => {
  middleBridge.setAppTitle({ val_key: "a2hs.title" })
})

</script>
<template>

  <!-- 主视图 -->
  <div class="a2hs-container">
    <scroll-view>
      <navi-virtual></navi-virtual>

      <div class="liu-mc-container">
        <div class="liu-tc-virtual"></div>
        <div class="liu-mc-box">
          <A2hsDesktop v-if="cha.isPC"></A2hsDesktop>
          <A2hsMobile v-else></A2hsMobile>
          <div style="width: 100%; height: 100px;"></div>
        </div>
      </div>

    </scroll-view>
    <navi-bar :show-menu="false" ></navi-bar>
  </div>

</template>
<style scoped>

.a2hs-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: relative;
  background-color: var(--bg-color);
}

</style>