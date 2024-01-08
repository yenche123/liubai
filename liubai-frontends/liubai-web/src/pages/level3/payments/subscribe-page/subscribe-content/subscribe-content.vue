<script setup lang="ts">
import { useSubscribeContent } from "./tools/useSubscribeContent"

const {
  onTapBtn
} = useSubscribeContent()

</script>
<template>

  <span>去测试 stripe</span>
  <CustomBtn @click="onTapBtn">
    <span>走你</span>
  </CustomBtn>

</template>
<style scoped>



</style>