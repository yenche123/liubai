<script setup lang="ts">
import ThreadDetail from "~/components/level1/thread-detail/thread-detail.vue";
import { useDetailContent } from "./tools/useDetailContent";

defineProps({
  threadId: {
    type: String,
    required: true,
  }
})

const {
  isShowing,
  onGetThreadShow,
} = useDetailContent()

</script>
<template>
  
  <div class="liu-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="liu-mc-box">
      <ThreadDetail 
        :is-showing="isShowing"
        :thread-id="threadId"
        location="detail-page"
        @getthreadshow="onGetThreadShow"
      ></ThreadDetail>
    </div>
  </div>

</template>
<style scoped>

</style>