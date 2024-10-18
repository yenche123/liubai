<script setup lang="ts">
import PageDefault from "~/pages/shared/page-default/page-default.vue";
import { useTagManagement } from "./tools/useTagManagement";
import { Draggable } from "@he-tree/vue";

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

    <div class="tm-nothing-here">
      
    </div>


  </PageDefault>

</template>
<style scoped lang="scss">


</style>