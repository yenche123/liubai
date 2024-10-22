<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import { useMainVice } from "~/hooks/useMainVice";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import IndexContent from "./index-content/index-content.vue";
import NaviAuto from "~/components/common/navi-auto/navi-auto.vue";
import NaviAutoVirtual from "~/components/common/navi-auto-virtual/navi-auto-virtual.vue";
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
  isNaviAutoShown,
  onNaviAutoChanged,
} = useIndexPage()

const onTapNaviTitle = () => {
  goToTop.value += 1
}

</script>
<template>

  <!-- 主视图 -->
  <main-view :enable-drop-files="true" @tapmainview="onTapMainView">
    <scroll-view :hidden-scroll-bar="hiddenScrollBar" @scroll="onScroll"
      consider-bottom-navi-bar
      :go-to-top="goToTop"
    >
      <navi-auto-virtual :show="isNaviAutoShown"></navi-auto-virtual>
      <index-content :show-top="!isNaviAutoShown" ></index-content>
    </scroll-view>

    <NaviAuto 
      :scroll-position="scrollPosition"
      @naviautochanged="onNaviAutoChanged"
      @taptitle="onTapNaviTitle"
    ></NaviAuto>

    <FloatingActionButton :scroll-position="scrollPosition"
      @tapfab="onTapFab"
      consider-bottom-navi-bar
    ></FloatingActionButton>

  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>