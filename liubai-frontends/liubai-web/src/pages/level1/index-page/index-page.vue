<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue"
import ViceView from "~/views/vice-view/vice-view.vue";
import { useMainVice } from "~/hooks/useMainVice";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue"
import IndexContent from "./index-content/index-content.vue"
import NaviAuto from "~/components/common/navi-auto/navi-auto.vue";
import FloatActionButton from "./float-action-button/float-action-button.vue";
import { useIndexPage } from "./tools/useIndexPage";

const { hiddenScrollBar, onVvWidthChange } = useMainVice()
const {
  showTop,
  onNaviAutoChanged,
} = useIndexPage()

</script>
<template>

  <!-- 主视图 -->
  <main-view :drop-files="true">
    <scroll-view :hidden-scrollbar="hiddenScrollBar">
      <NaviAuto @naviautochangeed="onNaviAutoChanged"></NaviAuto>
      <index-content :show-top="showTop" ></index-content>
    </scroll-view>

    <FloatActionButton></FloatActionButton>

  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>