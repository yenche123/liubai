<script setup lang="ts">
import { useViceContent } from "./tools/useViceContent";
import VcNaviBar from './vc-navi-bar/vc-navi-bar.vue';
import VcIframe from './vc-iframe/vc-iframe.vue';

defineProps({
  isOutterDraging: {
    type: Boolean,
    default: false
  }
})

const { 
  vcState,
  iframeSrc,
  onTapBack,
  onTapClose,
  onTapOpenInNew,
} = useViceContent()

</script>
<template>

  <!-- 导航栏 -->
  <VcNaviBar
    @tapback="onTapBack"
    @tapclose="onTapClose"
    @tapopeninnew="onTapOpenInNew"
  ></VcNaviBar>

  <!-- iframe -->
  <VcIframe
    v-if="vcState === 'iframe'"
    :is-outter-draging="isOutterDraging"
    :iframe-src="iframeSrc"
  ></VcIframe>

</template>
<style scoped>


</style>