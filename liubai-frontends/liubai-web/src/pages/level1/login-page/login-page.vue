<script setup lang="ts">
import { useRouteAndLiuRouter } from "../../../routes/liu-router";
const { router } = useRouteAndLiuRouter()
const onBack = () => {
  router.back()
}

</script>
<template>

  <div class="lp-test">这里是登录页</div>
  <div @click="onBack">返回</div>
</template>
<style scoped>

.lp-test {
  width: 50%;
  height: 300px;
  margin-bottom: 20px;
  background-color: darkblue;
  color: white;
}

.lp-back {
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