<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import TrashContent from "./trash-content/trash-content.vue";
import { useMainVice } from "~/hooks/useMainVice";
import { useI18n } from "vue-i18n";

const { 
  goToTop,
  onTapFab,
  scrollPosition,
  onScroll,
} = useMainVice()
const { t } = useI18n()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    <scroll-view @scroll="onScroll" :go-to-top="goToTop">
      <navi-virtual></navi-virtual>
      <TrashContent></TrashContent>
    </scroll-view>
    <navi-bar :title="t('common.trash')"></navi-bar>

    <FloatingActionButton :scroll-position="scrollPosition"
      @tapfab="onTapFab"
    ></FloatingActionButton>
  </main-view>

</template>
<style scoped>

</style>