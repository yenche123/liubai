<script setup lang="ts">
import type { A2hsTipProps, A2hsTipEmits } from "./tools/types"
import { useA2hsTip } from "./tools/useA2hsTip"

const props = defineProps<A2hsTipProps>()
defineEmits<A2hsTipEmits>()

const { atData } = useA2hsTip(props)

</script>
<template>


</template>
<style lang="scss" scoped>


</style>