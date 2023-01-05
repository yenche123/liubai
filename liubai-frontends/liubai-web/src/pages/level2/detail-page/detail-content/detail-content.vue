<script setup lang="ts">
import ThreadDetail from "~/components/level1/thread-detail/thread-detail.vue";

</script>
<template>
  
  <div class="mc-container">
    <div class="tc-virtual"></div>
    <div class="mc-box">
      <ThreadDetail location="detail-page"></ThreadDetail>
    </div>
  </div>

</template>
<style scoped>

.mc-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.tc-virtual {
  width: 100%;
  height: 10px;
}

.mc-box {
  width: 90%;
  max-width: var(--card-max);
  min-width: var(--card-min);
  position: relative;
}

</style>