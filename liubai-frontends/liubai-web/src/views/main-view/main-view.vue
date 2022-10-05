<script setup lang="ts">
import { useMainView } from "./tools/useMainView"
import ScrollView from "../../components/common/scroll-view/scroll-view.vue";
import MainContent from "./main-content/main-content.vue";
import DetailContent from "./detail-content/detail-content.vue";
import NaviBar from "../../components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '../../components/common/navi-virtual/navi-virtual.vue';
import { useRouteAndLiuRouter } from "../../routes/liu-router";

const { leftPx, rightPx } = useMainView()
const { route, router } = useRouteAndLiuRouter()
const routeName = route.name


</script>
<template>

  <div class="mv-container">
    <div class="mv-left" :style="{ width: leftPx + 'px' }"></div>
    <div class="mv-center">

      <!-- 工作区主内容 -->
      <template v-if="routeName === 'index'">
        <scroll-view>
          <main-content></main-content>
        </scroll-view>
      </template>

      <!-- 存放 静态布局的详情 -->
      <template v-else-if="routeName === 'detail'">
        <scroll-view>
          <navi-virtual></navi-virtual>
          <detail-content></detail-content>
        </scroll-view>
        <navi-bar></navi-bar>
      </template>
      
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