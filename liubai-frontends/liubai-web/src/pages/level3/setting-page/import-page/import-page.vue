<script setup lang="ts">
import ImportContent from "./import-content/import-content.vue";
import PageDefault from "~/pages/shared/page-default/page-default.vue";

</script>
<template>

  <PageDefault title-key="setting.import" :top-virtual="false">
    <ImportContent></ImportContent>
  </PageDefault>

</template>
<style scoped>

</style>