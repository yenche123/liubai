<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue"
import ViceView from "~/views/vice-view/vice-view.vue";
import { useMainVice } from "~/hooks/useMainVice";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue"
import IndexContent from "./index-content/index-content.vue"
import NaviAuto from "~/components/common/navi-auto/navi-auto.vue";
import FloatActionButton from "~/components/level1/float-action-button/float-action-button.vue";
import { useIndexPage } from "./tools/useIndexPage";

const { 
  hiddenScrollBar, 
  onVvWidthChange,
  goToTop,
  onTapFab,
  scrollPosition,
  onScroll,
  onTapMainView,
} = useMainVice()

const {
  showTop,
  onNaviAutoChanged,
} = useIndexPage()

</script>
<template>

  <!-- 主视图 -->
  <main-view :drop-files="true" @tapmainview="onTapMainView">
    <scroll-view :hidden-scroll-bar="hiddenScrollBar" @scroll="onScroll"
      :go-to-top="goToTop"
    >
      <NaviAuto @naviautochangeed="onNaviAutoChanged"></NaviAuto>
      <index-content :show-top="showTop" ></index-content>
    </scroll-view>

    <FloatActionButton :scroll-position="scrollPosition"
      @tapfab="onTapFab"
    ></FloatActionButton>

  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>