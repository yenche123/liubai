<script lang="ts" setup>
import PageDefault from "~/pages/shared/page-default/page-default.vue";
import MineContent from "./mine-content/mine-content.vue";

</script>
<template>

  <PageDefault :has-top-navi="false" 
    consider-bottom-navi-bar 
  >
    <MineContent></MineContent>
  </PageDefault>

</template>
<style scoped>


</style>