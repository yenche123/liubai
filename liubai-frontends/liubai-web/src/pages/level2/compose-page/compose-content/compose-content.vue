<script setup lang="ts">
import CustomEditor from "~/components/editors/custom-editor/custom-editor.vue"
import { useComposeContent } from "./tools/useComposeContent"

const { ccData } = useComposeContent()

</script>
<template>

  <PlaceholderView
    :p-state="ccData.pageState"
  ></PlaceholderView>

  <CustomEditor v-if="ccData.pageState < 0"
    composing
  ></CustomEditor>

</template>
<style scoped lang="scss">

</style>