<script lang="ts" setup>
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import CalendarView from "./schedule-content/calendar-view/calendar-view.vue";
import { useMainVice } from "~/hooks/useMainVice";
import { useI18n } from "vue-i18n";
import { usePageEnabled } from "~/hooks/useOpenClose";
import { useSchedulePage } from "./tools/useSchedulePage";

const {
  hiddenScrollBar,
  goToTop,
  onVvWidthChange,
  onTapFab,
  scrollPosition,
  onScroll,
} = useMainVice()
const { t } = useI18n()
const { onTapAdd, selectedDay } = useSchedulePage()

const { pageEnabled } = usePageEnabled("calendar")

</script>
<template>

  <main-view>
    <scroll-view v-if="pageEnabled"
      :hidden-scroll-bar="hiddenScrollBar" @scroll="onScroll"
      :go-to-top="goToTop"
    >
      <navi-virtual></navi-virtual>
      <div class="liu-mc-container">
        <div class="liu-mc-box">
          <CalendarView v-model:selected-day="selectedDay"></CalendarView>
        </div>
      </div>
    </scroll-view>
    <navi-bar :title="t('calendar.schedule')" show-add @tapadd="onTapAdd"></navi-bar>

    <FloatingActionButton :scroll-position="scrollPosition"
      @tapfab="onTapFab"
    ></FloatingActionButton>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped lang="scss">


</style>
