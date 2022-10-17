<script setup lang="ts">
import AppLink from '../../../components/common/app-link/app-link.vue';
// 侧边栏: 主内容


</script>
<template>
  <div class="sc-box">主内容</div>

  <div class="sc-box"></div>

  <div class="sc-box">
    <AppLink to="?tags=01">打开标签</AppLink>
  </div>

  <div class="sc-box"></div>

  <div class="sc-box"></div>

  <div class="sc-box"></div>

  <div class="sc-box"></div>

  <div class="sc-box"></div>
  

</template>
<style scoped>

.sc-box {
  width: 100%;
  height: 200px;
  margin-bottom: 50px;
  background-color: #fdeede;
}

</style>