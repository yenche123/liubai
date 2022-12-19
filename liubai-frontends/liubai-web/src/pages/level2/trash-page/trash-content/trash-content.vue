<script setup lang="ts">
import ThreadList from '../../../../components/level1/thread-list/thread-list.vue';

</script>
<template>

  <div class="mc-container">
    <div class="tc-virtual"></div>
    <div class="mc-box">
      <thread-list
        view-type="TRASH"
      ></thread-list>
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