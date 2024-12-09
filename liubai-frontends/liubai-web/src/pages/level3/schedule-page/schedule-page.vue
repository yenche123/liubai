<script lang="ts" setup>
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import ScheduleContent from "./schedule-content/schedule-content.vue";
import { useMainVice } from "~/hooks/useMainVice";
import { useI18n } from "vue-i18n";
import { usePageEnabled } from "~/hooks/useOpenClose";

const { 
  hiddenScrollBar, 
  goToTop,
  onVvWidthChange,
  onTapFab,
  scrollPosition,
  onScroll,
} = useMainVice()
const { t } = useI18n()

const { pageEnabled } = usePageEnabled("schedule")

</script>
<template>

  <main-view>
    <scroll-view v-if="pageEnabled"
      :hidden-scroll-bar="hiddenScrollBar" @scroll="onScroll"
      :go-to-top="goToTop"
    >
      <navi-virtual></navi-virtual>
      <ScheduleContent></ScheduleContent>
    </scroll-view>
    <navi-bar :title="t('calendar.schedule')"></navi-bar>

    <FloatingActionButton :scroll-position="scrollPosition"
      @tapfab="onTapFab"
    ></FloatingActionButton>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped lang="scss">


</style>