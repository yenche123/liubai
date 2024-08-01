<script setup lang="ts">
import ExportContent from "./export-content/export-content.vue";
import PageDefault from "~/pages/shared/page-default/page-default.vue";

</script>
<template>
  
  <PageDefault title-key="setting.export" :top-virtual="false">
    <ExportContent></ExportContent>
  </PageDefault>

</template>
<style scoped>

</style>