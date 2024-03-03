<script setup lang="ts">
import { useSubscribeContent } from "./tools/useSubscribeContent"
import { toRef } from "vue";

const { scData } = useSubscribeContent()
const pi = toRef(scData, "subPlanInfo")

</script>
<template>

  <PlaceholderView
    :p-state="scData.state"
  ></PlaceholderView>

  <div v-if="pi" class="sc-container">
    
  </div>



</template>
<style scoped lang="scss">




</style>