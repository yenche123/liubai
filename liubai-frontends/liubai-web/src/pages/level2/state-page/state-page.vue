<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import KanbanView from "./kanban-view/kanban-view.vue"
import ListView from "./list-view/list-view.vue"
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
      <list-view 
        :current="whichPage"
        :hide-scrollbar="hiddenScrollBar"
        v-model:kanban-columns="kanban.columns"
        @tapnavi="onNaviChange"
      ></list-view>
    </div>

    <!-- 看板 -->
    <div v-show="whichPage === 2"
      class="sp-layout"
    >
      <kanban-view :current="whichPage"
        v-model:kanban-columns="kanban.columns"
        @tapnavi="onNaviChange"
      ></kanban-view>
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