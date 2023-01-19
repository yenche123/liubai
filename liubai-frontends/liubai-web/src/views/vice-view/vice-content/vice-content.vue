<script setup lang="ts">
import { useViceContent } from "./tools/useViceContent";
import VcNaviBar from './vc-navi-bar/vc-navi-bar.vue';
import VcIframe from './vc-iframe/vc-iframe.vue';
import ThreadDetail from "~/components/level1/thread-detail/thread-detail.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import { useVcHeight } from "./tools/useVcHeight"
import type { VcState } from "./tools/types"
import { watch } from "vue";

defineProps({
  isOutterDraging: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits<{
  (event: "vcstatechange", vcState: VcState): void
}>()

const { 
  vcState,
  iframeSrc,
  onTapBack,
  onTapClose,
  onTapOpenInNew,
} = useViceContent()

watch(vcState, (newV) => {
  emits("vcstatechange", newV)
})

const {
  vcHeight,
  maskMarginTop,
} = useVcHeight()

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
    :show="vcState === 'iframe'"
    :is-outter-draging="isOutterDraging"
    :iframe-src="iframeSrc"
    :vc-height="vcHeight"
    :mask-margin-top="maskMarginTop"
  ></VcIframe>

  <!-- 动态 -->
  <div class="vcliu-content"
    v-show="vcState === 'thread'"
  >
    <ScrollView>
      <div class="vcliu-virtual"></div>
      <div class="vcliu-box">
        <ThreadDetail
          location="vice-view"
        ></ThreadDetail>
      </div>
    </ScrollView>
  </div>
  

</template>
<style scoped lang="scss">

.vcliu-content {
  width: 100%;
  height: v-bind("vcHeight + 'px'");
  position: relative;

  .vcliu-virtual {
    width: 100%;
    height: 10px;
  }

  .vcliu-box {
    width: 90%;
    max-width: var(--card-max);
    min-width: var(--card-min);
    position: relative;
    margin: 0 auto;
  }
}


</style>