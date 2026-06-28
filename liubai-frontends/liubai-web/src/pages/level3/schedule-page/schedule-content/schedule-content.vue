<script lang="ts" setup>
import ThreadList from '~/components/level1/thread-list/thread-list.vue';
import CalendarEmpty from '~/pages/shared/calender-empty/calendar-empty.vue';
import CalendarView from './calendar-view/calendar-view.vue';
import { useScheduleContent } from './tools/useScheduleContent';
import HighlightBox from './highlight-box/highlight-box.vue';

defineProps<{
  viewMode?: "list" | "calendar"
}>()

const selectedDay = defineModel<Date>("selectedDay", { required: true })

const {
  scData,
  onNodata,
  onHasdata,
} = useScheduleContent()

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-mc-box sc-box">

      <template v-if="viewMode === 'calendar'">
        <CalendarView v-model:selected-day="selectedDay"></CalendarView>
      </template>

      <template v-else>
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
      </template>
    </div>
  </div>

</template>
<style scoped lang="scss">


</style>
