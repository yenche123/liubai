<script setup lang="ts">
import cfg from "../../config"

</script>
<template>
  <div class="dv-container">
    
  </div>
</template>
<style scoped>
.dv-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  background: #f5f5f0;
  z-index: 500;
  transition: .3s;
}

.dv-container_hidden {
  transform: translateX(-100%);
}

.dv-bar {
  width: v-bind("cfg.default_detailview_width + 'px'");
  height: inherit;
  resize: horizontal;
  cursor: ew-resize;
  opacity: 0;
  overflow: scroll;   /** 这一行一定要是 scroll 否则无法拖动 */
}




</style>