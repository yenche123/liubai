<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue"
import ViceView from "~/views/vice-view/vice-view.vue";
import { useMainVice } from "~/hooks/useMainVice";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue"
import IndexContent from "./index-content/index-content.vue"
import NaviAuto from "~/components/common/navi-auto/navi-auto.vue";

const { onVvWidthChange } = useMainVice()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    <scroll-view>
      <NaviAuto></NaviAuto>
      <index-content></index-content>
    </scroll-view>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>