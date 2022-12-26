<script setup lang="ts">
import PlaceholderView from "../../../../views/common/placeholder-view/placeholder-view.vue";
import ThreadCard from "../../../../components/level1/thread-list/thread-card/thread-card.vue";
import { useDetailContent } from "./tools/useDetailContent";

const {
  dcData
} = useDetailContent()

</script>
<template>
  
  <div class="mc-container">
    <div class="tc-virtual"></div>
    <div class="mc-box">
      <PlaceholderView 
        :p-state="dcData.state"
      ></PlaceholderView>
      <ThreadCard 
        v-if="dcData.threadShow && dcData.state < 0"
        :thread-data="dcData.threadShow"
        :position="0"
      ></ThreadCard>
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