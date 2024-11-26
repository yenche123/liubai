<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import SettingContent from "./setting-content/setting-content.vue";

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