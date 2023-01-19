<script setup lang="ts">
import type { PropType } from 'vue';
import type { VcState } from "../vice-content/tools/types"
import { useIframeRestriction } from './tools/useIframeRestriction';

const props = defineProps({
  viceViewPx: {
    type: Number,
    required: true
  },
  vcState: {
    type: String as PropType<VcState>,
    default: "",
  }
})

const {
  enable,
  show,
  irPx,
  onTapConfirm,
} = useIframeRestriction(props)


</script>
<template>

  <div v-if="enable" class="ir-container"
    :class="{ 'ir-container_show': show }"
  >



  </div>

</template>
<style scoped lang="scss">

.ir-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 600;
  opacity: 0;
  transition: .3s;

}

.ir-container_show {
  opacity: 1;
}



</style>