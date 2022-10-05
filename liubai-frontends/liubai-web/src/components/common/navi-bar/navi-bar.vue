<script setup lang="ts">
import cfg from "../../../config"

</script>
<template>

  <div class="nb-container">
    導航欄標題
  </div>

</template>
<style scoped>
.nb-container {
  width: 100%;
  height: v-bind("cfg.navi_height + 'px'");
  background-color: brown;
  position: absolute;
  top: 0;
  left: 0;
}

</style>