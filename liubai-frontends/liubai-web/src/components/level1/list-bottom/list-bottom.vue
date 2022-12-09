<script setup lang="ts">
import PinwheelLoader from "../../loaders/pinwheel-loader/pinwheel-loader.vue"

defineProps({
  hasData: Boolean,
  reached: Boolean,
})

</script>
<template>

<div class="lb-container"
  :class="{ 'lb-container_reached': reached }"
>
  
  <!-- 加载框 -->
  <PinwheelLoader v-if="!reached" color="var(--main-tip)"></PinwheelLoader>

  <!-- 两横一线 -->
  <template v-else>
    <div class="lc-line"></div>
    <div class="lc-circle"></div>
    <div class="lc-line"></div>
  </template>

</div>

</template>
<style scoped>

.lb-container {
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.lb-container_reached {
  padding-bottom: 30px;
}

.lc-line {
  width: 30%;
  height: 1.6px;
  max-width: 400px;
  border-radius: 2px;
  background-color: var(--line-bottom);
}

.lc-circle {
  margin-inline-start: 16px;
  margin-inline-end: 16px;
  height: 4px;
  width: 4px;
  border-radius: 3px;
  background-color: var(--line-bottom);
}


</style>