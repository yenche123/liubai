<script setup lang="ts">
import PageDefault from "~/pages/shared/page-default/page-default.vue";
import { useTagManagement } from "./tools/useTagManagement";
import { Draggable } from "@he-tree/vue";
import TmItem from "./tm-item/tm-item.vue";

const {
  tmData,
  onTreeChange,
  onTapTagItem,
  onTapTagArrow,
  onOpenNode,
  onCloseNode,
  statHandler,
} = useTagManagement()

</script>
<template>

  <PageDefault title-key="common.tags">

    <div v-if="tmData.tagNodes.length < 1" class="tm-nothing-here">
      <span>nothing here</span>
    </div>

    <div v-else class="tm-container">
      <Draggable
        v-model="tmData.tagNodes"
        :indent="20"
        @change="onTreeChange"
        :watermark="false"
        :max-level="3"
        :node-key="(stat, index) => stat.data.tagId"
        :stat-handler="statHandler"
        @open:node="onOpenNode"
        @close:node="onCloseNode"
      >
        <template #default="{ node, stat }">
          <TmItem :node="node" :stat="stat" 
            @tapitem="onTapTagItem(tmData.toPath + node.tagId)"
            @taptagarrow="onTapTagArrow"
          ></TmItem>
        </template>
      </Draggable>

    </div>

  </PageDefault>

</template>
<style scoped lang="scss">

.tm-nothing-here {
  width: 100%;
  height: 85vh;
  height: 85dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: var(--mini-font);
  color: var(--main-normal);
}

.tm-container {
  width: 100%;
  padding: 16px 10px;
  background-color: var(--card-bg);
  border-radius: 24px;
  box-shadow: var(--card-shadow);
  box-sizing: border-box;
  position: relative;
}

</style>
<style lang="scss">

.tm-container {
  .he-tree {
    min-height: 60px;
  }

  /** 当标签正在拖动时的 css */
  .he-tree-drag-placeholder {
    background-color: var(--drag-bg);
    height: 46px;
    border-radius: 8px;
    border: 1px dashed var(--drag-border);
  }
}


</style>