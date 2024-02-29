<script setup lang="ts">
import PlaceholderView from "~/views/common/placeholder-view/placeholder-view.vue";
import { useSubscribeContent } from "./tools/useSubscribeContent"

const { scData } = useSubscribeContent()

</script>
<template>

  <PlaceholderView
    :p-state="scData.state"
  ></PlaceholderView>

  



</template>
<style scoped lang="scss">



</style>