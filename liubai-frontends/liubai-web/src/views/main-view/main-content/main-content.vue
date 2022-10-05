<script setup lang="ts">
import AppLink from '../../../components/common/app-link/app-link.vue';

</script>
<template>
  
  <div class="mv-test">

  </div>
  <div class="mv-test">
    <app-link to="/sdfghdfghjhgf">去详情页</app-link>
  </div>
  <div class="mv-test">
    <app-link to="/login">去登录页</app-link>
  </div>
  <div class="mv-test"></div>
  <div class="mv-test"></div>
  <div class="mv-test"></div>
  <div class="mv-test"></div>
  <div class="mv-test"></div>
</template>
<style>

.mv-test {
  width: 50%;
  height: 300px;
  background-color: salmon;
  margin-bottom: 100px;
  border-radius: 24px;
}

.test-a-active {
  color: yellow;
}

.test-a-inactive {
  color: #a0a0a0;
}

</style>