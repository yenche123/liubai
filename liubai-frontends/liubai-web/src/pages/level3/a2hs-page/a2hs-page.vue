<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';
import A2hsDesktop from "./a2hs-desktop/a2hs-desktop.vue";
import A2hsMobile from "./a2hs-mobile/a2hs-mobile.vue";
import { useMainVice } from "~/hooks/useMainVice";
import liuApi from "~/utils/liu-api";

const { hiddenScrollBar, onVvWidthChange } = useMainVice()
const cha = liuApi.getCharacteristic()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    <scroll-view :hidden-scroll-bar="hiddenScrollBar">
      <navi-virtual></navi-virtual>

      <div class="liu-mc-container">
        <div class="liu-tc-virtual"></div>
        <div class="liu-mc-box">
          <A2hsDesktop v-if="cha.isPC"></A2hsDesktop>
          <A2hsMobile v-else></A2hsMobile>
        </div>
      </div>

    </scroll-view>
    <navi-bar></navi-bar>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>