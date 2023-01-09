<script setup lang="ts">
import { useEditContent } from './tools/useEditContent';

const {
  threadId,
} = useEditContent()

</script>
<template>
  
  <div class="mc-container">
    <div class="tc-virtual"></div>
    <div class="mc-box">
      开发 edit 页中: {{ threadId }}
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