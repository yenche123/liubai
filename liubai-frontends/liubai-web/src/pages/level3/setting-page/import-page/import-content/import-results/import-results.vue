<script setup lang="ts">
import type { PropType } from 'vue';
import type { ImportedAtom2 } from "../tools/types"

defineProps({
  list: {
    type: Array as PropType<ImportedAtom2[]>,
    required: true,
  }
})

</script>
<template>


</template>
<style scoped lang="scss">

</style>