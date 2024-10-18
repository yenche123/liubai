<script setup lang="ts">
import PageDefault from "~/pages/shared/page-default/page-default.vue";
import { useTagManagement } from "./tools/useTagManagement";

const { tmData } = useTagManagement()

</script>
<template>

  <PageDefault title-key="common.tags">


  </PageDefault>

</template>
<style scoped lang="scss">


</style>