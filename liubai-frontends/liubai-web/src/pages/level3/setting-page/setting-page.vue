<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import SettingContent from "./setting-content/setting-content.vue";
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';

</script>
<template>

  <main-view>
    <scroll-view>
      <navi-virtual></navi-virtual>
      <SettingContent></SettingContent>
    </scroll-view>
    <navi-bar></navi-bar>
  </main-view>

</template>
<style scoped>

</style>