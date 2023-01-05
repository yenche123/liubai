<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import KanbanContent from "./kanban-content/kanban-content.vue";
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';
import { useMainVice } from "~/hooks/useMainVice";
import { useI18n } from "vue-i18n";

const { onVvWidthChange } = useMainVice()
const { t } = useI18n()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    <scroll-view>
      <navi-virtual></navi-virtual>
      <KanbanContent></KanbanContent>
    </scroll-view>
    <navi-bar :title="t('common.kanban')"></navi-bar>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>