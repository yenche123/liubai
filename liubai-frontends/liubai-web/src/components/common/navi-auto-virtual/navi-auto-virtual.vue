<script setup lang="ts">
// 本文件仅用于在正常文档流里 占位顶部导航栏
import cfg from "~/config"

defineProps({
  show: {
    type: Boolean,
    default: false,
  }
})

</script>
<template>
  <div class="navi-virtual"
    :class="{ 'navi-virtual_show': show }"
  ></div>
</template>
<style scoped>

.navi-virtual {
  width: 100%;
  height: v-bind("cfg.navi_height + 'px'");
  max-height: 0;
  transition: .3s;
}

.navi-virtual_show {
  max-height: v-bind("cfg.navi_height + 'px'");
}

</style>