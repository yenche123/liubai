<script setup lang="ts">
import { useViceContent } from "./tools/useViceContent";
import VcNaviBar from './vc-navi-bar/vc-navi-bar.vue';
import VcIframe from './vc-iframe/vc-iframe.vue';
import ThreadDetail from "~/components/level1/thread-detail/thread-detail.vue";
import CommentTarget from "~/components/level2/comment-target/comment-target.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import RightDropZone from "./right-drop-zone/right-drop-zone.vue";
import { useVcHeight } from "./tools/useVcHeight"
import type { VcState } from "./tools/types"
import { watch } from "vue";
import { useVcDropZone } from "./tools/useVcDropZone";

const props = defineProps({
  isOutterDraging: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits<{
  (event: "vcstatechange", vcState: VcState): void
}>()

const { 
  cid,
  cid2,
  vcState,
  iframeSrc,
  onTapBack,
  onTapClose,
  onTapOpenInNew,
} = useViceContent()

const {
  onViewStateChange,
  contentRef,
  showDropZone,
} = useVcDropZone(vcState, props)

watch(vcState, (newV) => {
  emits("vcstatechange", newV)
})

watch(iframeSrc, (newV) => {
  // console.log("iframeSrc 發生變化........")
  // console.log(newV)
  // console.log(" ")
})

const {
  vcHeight,
  vcHeight2,
  maskMarginTop,
  viceNaviPx,
} = useVcHeight()

</script>
<template>

  <!-- 导航栏 -->
  <VcNaviBar
    :vc-state="vcState"
    @tapback="onTapBack"
    @tapclose="onTapClose"
    @tapopeninnew="onTapOpenInNew"
  ></VcNaviBar>

  <!-- iframe -->
  <VcIframe
    :show="vcState === 'iframe'"
    :is-outter-draging="isOutterDraging"
    :iframe-src="iframeSrc"
    :vc-height="vcHeight2"
    :mask-margin-top="maskMarginTop"
  ></VcIframe>

  <!-- 动态或评论 -->
  <div class="vcliu-content"
    v-show="vcState === 'thread' || vcState === 'comment'"
    ref="contentRef"
  >
    <ScrollView>
      <div class="vcliu-virtual"></div>
      <div class="vcliu-box" v-if="vcState === 'thread' && cid">
        <ThreadDetail
          :thread-id="cid"
          location="vice-view"
          @pagestatechange="onViewStateChange"
        ></ThreadDetail>
      </div>
      <div class="vcliu-box" v-else-if="vcState === 'comment' && cid2">
        <CommentTarget
          location="vice-view"
          :target-id="cid2"
        ></CommentTarget>
      </div>
    </ScrollView>

    <!-- 文件掉落盒 -->
    <RightDropZone
      :show-drop-zone="showDropZone"
    ></RightDropZone>
  </div>
  
  

</template>
<style scoped lang="scss">

.vcliu-content {
  width: 100%;
  height: v-bind("vcHeight + 'px'");
  position: relative;

  .vcliu-virtual {
    width: 100%;
    height: v-bind("'' + (viceNaviPx + 10) + 'px'");
  }

  .vcliu-box {
    width: var(--card-percent);
    max-width: var(--card-max);
    min-width: var(--card-min);
    position: relative;
    margin: 0 auto;
  }
}


</style>