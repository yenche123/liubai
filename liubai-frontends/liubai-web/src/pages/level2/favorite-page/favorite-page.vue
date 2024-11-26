<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import FavoriteContent from "./favorite-content/favorite-content.vue";
import { useMainVice } from "~/hooks/useMainVice";
import { useI18n } from "vue-i18n";

const { 
  hiddenScrollBar, 
  goToTop,
  onVvWidthChange,
  onTapFab,
  scrollPosition,
  onScroll,
} = useMainVice()
const { t } = useI18n()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    <scroll-view :hidden-scroll-bar="hiddenScrollBar" @scroll="onScroll"
      :go-to-top="goToTop"
    >
      <navi-virtual></navi-virtual>
      <FavoriteContent></FavoriteContent>
    </scroll-view>
    <navi-bar :title="t('common.favorite')"></navi-bar>

    <FloatingActionButton :scroll-position="scrollPosition"
      @tapfab="onTapFab"
    ></FloatingActionButton>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>