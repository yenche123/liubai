<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import KanbanPage from "./kanban-page/kanban-page.vue"
import ListPage from "./list-page/list-page.vue"
import { useMainVice } from "~/hooks/useMainVice";
import { useStatePage } from "./tools/useStatePage"

const { onVvWidthChange } = useMainVice()
const { whichPage } = useStatePage()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    
    <!-- 列表 -->
    <div v-show="whichPage === 1">
      <list-page></list-page>
    </div>

    <!-- 看板 -->
    <div v-show="whichPage === 2">
      <kanban-page></kanban-page>
    </div>
    
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>