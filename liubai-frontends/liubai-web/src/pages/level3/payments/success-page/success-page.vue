<script setup lang="ts">
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import SuccessContent from "./success-content/success-content.vue";

</script>
<template>

  <div class="liu-simple-page">
    <scroll-view>
      <navi-virtual></navi-virtual>
      <SuccessContent></SuccessContent>
    </scroll-view>
    <navi-bar></navi-bar>
  </div>

</template>
<style scoped>

</style>