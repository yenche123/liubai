<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';
import ImportContent from "./import-content/import-content.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    <scroll-view>
      <navi-virtual></navi-virtual>
      <ImportContent></ImportContent>
    </scroll-view>
    <navi-bar :title="t('setting.import')"></navi-bar>
  </main-view>

</template>
<style scoped>

</style>