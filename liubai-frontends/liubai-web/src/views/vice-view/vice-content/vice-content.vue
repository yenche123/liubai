<script setup lang="ts">
import { useViceContent } from "./tools/useViceContent";
import VcNaviBar from './vc-navi-bar/vc-navi-bar.vue';
import VcIframe from './vc-iframe/vc-iframe.vue';
import ThreadDetail from "~/components/level1/thread-detail/thread-detail.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import { useVcHeight } from "./tools/useVcHeight"

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
  <div class="vc-content"
    v-show="vcState === 'thread'"
  >
    <ScrollView>
      <div class="vc-virtual"></div>
      <div class="vc-box">
        <ThreadDetail
          location="vice-view"
        ></ThreadDetail>
      </div>
    </ScrollView>
  </div>
  

</template>
<style scoped lang="scss">

.vc-content {
  width: 100%;
  height: v-bind("vcHeight + 'px'");
  position: relative;

  .vc-virtual {
    width: 100%;
    height: 10px;
  }

  .vc-box {
    width: 90%;
    max-width: var(--card-max);
    min-width: var(--card-min);
    position: relative;
    margin: 0 auto;
  }
}


</style>