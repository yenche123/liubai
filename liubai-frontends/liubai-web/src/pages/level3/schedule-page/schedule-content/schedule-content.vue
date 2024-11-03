<script lang="ts" setup>
import ThreadList from '~/components/level1/thread-list/thread-list.vue';
import CalendarEmpty from '~/pages/shared/calender-empty/calendar-empty.vue';
import { useScheduleContent } from './tools/useScheduleContent';

const { 
  isEmpty,
  midnightClock,
  onNodata,
  onHasdata,
} = useScheduleContent()

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-mc-box">

      <CalendarEmpty v-if="isEmpty"></CalendarEmpty>

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