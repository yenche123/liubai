<script setup lang="ts">
import cfg from "../../../../config"
import PlaceholderView from "../../../../views/common/placeholder-view/placeholder-view.vue";

</script>
<template>
  
  <div class="mc-container">
    <div class="tc-virtual"></div>
    <div class="mc-box">
      <PlaceholderView :p-state="0" err-msg="查无任何资讯，如果有问题欢迎咨询客服"></PlaceholderView>
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