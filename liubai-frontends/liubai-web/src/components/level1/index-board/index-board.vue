<script setup lang="ts">
import { useIndexBoard } from './tools/useIndexBoard';
import A2hsTip from './a2hs-tip/a2hs-tip.vue';

const {
  ibData,
  onTapInstall,
  onTapCloseA2hsTip,
} = useIndexBoard()

</script>
<template>

  <A2hsTip
    :a2hs="ibData.a2hs"
    @tapinstall="onTapInstall"
    @tapclose="onTapCloseA2hsTip"
  ></A2hsTip>
  

</template>
<style scoped lang="scss">


</style>