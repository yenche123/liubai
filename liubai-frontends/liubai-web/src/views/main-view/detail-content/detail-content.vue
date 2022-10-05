<script setup lang="ts">
import AppLink from '../../../components/common/app-link/app-link.vue';
import { useRouteAndLiuRouter } from "../../../routes/liu-router";

const { router } = useRouteAndLiuRouter()

const onBack = () => {
  router.back()
}

</script>
<template>
  <div class="dc-test">这里是详情页</div>
  <div class="dc-back" @click="onBack">
    <span>返回</span>
  </div>

</template>
<style scoped>

.dc-test {
  width: 50%;
  height: 200px;
  margin-bottom: 20px;
  background-color: cadetblue;
}

.dc-back {
  width: 50%;
  height: 50px;
  border-radius: 10px;
  background-color: #00696d;
  color: white;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

</style>