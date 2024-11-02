<script lang="ts" setup>
import { ref } from 'vue';
import ThreadList from '~/components/level1/thread-list/thread-list.vue';
import CalendarEmpty from '~/pages/shared/calender-empty/calendar-empty.vue';

const isEmpty = ref(false)

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-mc-box">

      <CalendarEmpty v-if="isEmpty"></CalendarEmpty>

      <thread-list
        view-type="TODAY_FUTURE"
        @hasdata="() => isEmpty = false"
        @nodata="() => isEmpty = true"
      ></thread-list>
    </div>
  </div>

</template>
<style scoped lang="scss">


</style>