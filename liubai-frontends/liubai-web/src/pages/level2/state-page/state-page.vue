<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import KanbanPage from "./kanban-page/kanban-page.vue"
import ListPage from "./list-page/list-page.vue"
import { useMainVice } from "~/hooks/useMainVice";
import { useStatePage } from "./tools/useStatePage"
import { useProvideSnIndicator } from "./tools/useSnIndicator";

const { onVvWidthChange } = useMainVice()
const { whichPage, onNaviChange } = useStatePage()
useProvideSnIndicator()


</script>
<template>

  <!-- 主视图 -->
  <main-view>
    
    <!-- 列表 -->
    <div v-show="whichPage === 1">
      <list-page :current="whichPage"
        @tapnavi="onNaviChange"
      ></list-page>
    </div>

    <!-- 看板 -->
    <div v-show="whichPage === 2">
      <kanban-page :current="whichPage"
        @tapnavi="onNaviChange"
      ></kanban-page>
    </div>
    
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>