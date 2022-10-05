<script setup lang="ts">
import { useMainView } from "./tools/useMainView"
import ScrollView from "../../components/common/scroll-view/scroll-view.vue";
import MainContent from "./main-content/main-content.vue";
import NaviBar from "../../components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '../../components/common/navi-virtual/navi-virtual.vue';

const { leftPx, rightPx } = useMainView()

</script>
<template>

  <div class="mv-container">
    <div class="mv-left" :style="{ width: leftPx + 'px' }"></div>
    <div class="mv-center">
      <scroll-view>
        <navi-virtual></navi-virtual>
        <main-content></main-content>
      </scroll-view>
      <navi-bar></navi-bar>
    </div>
    <div class="mv-right" :style="{ width: rightPx + 'px' }"></div>
  </div>

</template>
<style scoped>

.mv-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  background-color: #f5f5f0;
}

.mv-left, .mv-right {
  height: 100%;
  transition: .25s;
  background-color: #e6e4bf;
}

.mv-center {
  flex: 1;
  height: 100vh;
  position: relative;
}

</style>