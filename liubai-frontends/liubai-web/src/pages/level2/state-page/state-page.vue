<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import KanbanPage from "./kanban-page/kanban-page.vue"
import ListPage from "./list-page/list-page.vue"
import { useMainVice } from "~/hooks/useMainVice";
import { useStatePage } from "./tools/useStatePage"
import { useProvideSnIndicator } from "./tools/useSnIndicator";

const { onVvWidthChange, hiddenScrollBar } = useMainVice()
const { whichPage, onNaviChange, kanban } = useStatePage()
useProvideSnIndicator()


</script>
<template>

  <!-- 主视图 -->
  <main-view>
    
    <!-- 列表 -->
    <div v-show="whichPage === 1"
      class="sp-layout"
    >
      <list-page 
        :current="whichPage"
        :hide-scrollbar="hiddenScrollBar"
        v-model:kanban-columns="kanban.columns"
        @tapnavi="onNaviChange"
      ></list-page>
    </div>

    <!-- 看板 -->
    <div v-show="whichPage === 2"
      class="sp-layout"
    >
      <kanban-page :current="whichPage"
        v-model:kanban-columns="kanban.columns"
        @tapnavi="onNaviChange"
      ></kanban-page>
    </div>
    
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

.sp-layout {
  position: relative;
  width: 100%;
  height: 100%;
}

</style>