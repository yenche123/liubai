<script setup lang="ts">
import MainView from "../../../views/main-view/main-view.vue";
import ViceView from "../../../views/vice-view/vice-view.vue";
import ScrollView from "../../../components/common/scroll-view/scroll-view.vue";
import TrashContent from "./trash-content/trash-content.vue";
import NaviBar from "../../../components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '../../../components/common/navi-virtual/navi-virtual.vue';
import { useMainVice } from "../../../hooks/useMainVice";

const { viceViewPx, onVvWidthChange } = useMainVice()

</script>
<template>

  <!-- 主视图 -->
  <main-view :vice-view-px="viceViewPx">
    <scroll-view>
      <navi-virtual></navi-virtual>
      <TrashContent></TrashContent>
    </scroll-view>
    <navi-bar></navi-bar>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>