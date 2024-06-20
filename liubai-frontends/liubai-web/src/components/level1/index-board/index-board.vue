<script setup lang="ts">
import { useIndexBoard } from './tools/useIndexBoard';
import A2hsTip from './a2hs-tip/a2hs-tip.vue';
import NewVersionTip from "./new-version-tip/new-version-tip.vue"

const {
  ibData,
  onTapInstall,
  onTapCloseA2hsTip,
  onConfirmNewVersion,
  onCancelNewVersion,
} = useIndexBoard()

</script>
<template>

  <A2hsTip
    :expand="ibData.a2hs"
    @tapinstall="onTapInstall"
    @tapclose="onTapCloseA2hsTip"
  ></A2hsTip>

  <NewVersionTip
    :expand="ibData.newVersion"
    @confirm="onConfirmNewVersion"
    @cancel="onCancelNewVersion"
  ></NewVersionTip>
  

</template>
<style scoped lang="scss">


</style>