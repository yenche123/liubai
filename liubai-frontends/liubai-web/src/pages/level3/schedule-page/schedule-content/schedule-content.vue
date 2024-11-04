<script lang="ts" setup>
import ThreadList from '~/components/level1/thread-list/thread-list.vue';
import CalendarEmpty from '~/pages/shared/calender-empty/calendar-empty.vue';
import { useScheduleContent } from './tools/useScheduleContent';
import { useI18n } from 'vue-i18n';
import HighlightBox from './highlight-box/highlight-box.vue';

const { 
  scData,
  onNodata,
  onHasdata,
} = useScheduleContent()

const { t } = useI18n()

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-mc-box">

      <CalendarEmpty v-if="scData.isEmpty"></CalendarEmpty>

      <HighlightBox v-if="scData.tipClock"
        title-key="calendar.midnight_tip"
        :title-key-opt="{ clock: scData.tipClock, today: scData.tipToday }"
      ></HighlightBox>

      <thread-list
        view-type="TODAY_FUTURE"
        @hasdata="onHasdata"
        @nodata="onNodata"
      ></thread-list>
    </div>
  </div>

</template>
<style scoped lang="scss">


</style>