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
  <div class="mv-test">
    <span>自閉症類群（英語：Autism spectrum）是一種心理狀況的譜系障礙，亦稱自閉症類群障礙（英語：autism spectrum disorders，簡寫</span>
    <app-link to="?outq=ASD">ASD</app-link>
    <span>；或autism spectrum conditions，簡寫ASC）或泛自閉症障礙，描述了一個被DSM-5歸類為神經發展症候群的譜系範圍。</span>
  </div>
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
  padding: 10px;
}

.test-a-active {
  color: yellow;
}

.test-a-inactive {
  color: #a0a0a0;
}

</style>