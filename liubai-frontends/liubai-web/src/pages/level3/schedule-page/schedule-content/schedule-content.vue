<script lang="ts" setup>
import ThreadList from '~/components/level1/thread-list/thread-list.vue';
import CalendarEmpty from '~/pages/shared/calender-empty/calendar-empty.vue';
import { useScheduleContent } from './tools/useScheduleContent';
import { useI18n } from 'vue-i18n';

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

      <!-- <div class="sc-midnight" v-if="scData.tipClock"
        :class="{ 'sc-midnight_shown': scData.tipShown }"
      >
        <div class="liu-highlight-box">
          <div class="sc-midnight-tip">
            <span>{{ t('calendar.midnight_tip', { clock: scData.tipClock, today: scData.tipToday }) }}</span>
          </div>
          <div class="scm-close">
            <svg-icon name="close"
              class="scm-close-svg"
              color=""
            ></svg-icon>
          </div>
        </div>
      </div> -->

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