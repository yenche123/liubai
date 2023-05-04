<script setup lang="ts">
import ThreadDetail from "~/components/level1/thread-detail/thread-detail.vue";
import { useDetailContent } from "./tools/useDetailContent";

const {
  threadId
} = useDetailContent()

</script>
<template>
  
  <div class="liu-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="liu-mc-box" v-if="threadId">
      <ThreadDetail 
        :thread-id="threadId"
        location="detail-page"
      ></ThreadDetail>
    </div>
  </div>

</template>
<style scoped>

</style>