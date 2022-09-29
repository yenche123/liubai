<script setup lang="ts">
import ScrollView from './scroll-view/scroll-view.vue';

const onScrollToLower = (data: { scrollTop: number }) => {
  console.log("触底了.......")
  console.log(data)
  console.log(" ")
}

</script>

<template>
  <scroll-view class="hello-world" @scrolltolower="onScrollToLower">
    <div class="box"></div>
    <div class="box" style="background: blue"></div>
    <div class="box" style="background: yellowgreen"></div>
    <div class="box" style="background: goldenrod"></div>
  </scroll-view>
</template>

<style scoped>

.hello-world {
  width: 60%;
  height: 90vh;
}

.box {
  width: 98%;
  height: 75vh;
  background-color: brown;
}

</style>
