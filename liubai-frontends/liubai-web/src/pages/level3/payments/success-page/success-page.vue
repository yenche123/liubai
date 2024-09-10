<script setup lang="ts">
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import SuccessContent from "./success-content/success-content.vue";
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';

</script>
<template>

  <div class="liu-basic-page">
    <scroll-view>
      <navi-virtual></navi-virtual>
      <SuccessContent></SuccessContent>
    </scroll-view>
    <navi-bar :show-menu="false"></navi-bar>
  </div>

</template>
<style scoped>

</style>