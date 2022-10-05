<script setup lang="ts">
// 本文件仅用于在正常文档流里 占位顶部导航栏
import cfg from "../../../config"

</script>
<template>
  <div class="navi-virtual"></div>
</template>
<style scoped>

.navi-virtual {
  width: 100%;
  height: v-bind("cfg.navi_height + 'px'");
}

</style>