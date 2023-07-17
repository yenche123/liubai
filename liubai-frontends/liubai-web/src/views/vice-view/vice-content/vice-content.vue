<script setup lang="ts">
import { useViceContent } from "./tools/useViceContent";
import VcNaviBar from './vc-navi-bar/vc-navi-bar.vue';
import VcIframe from './vc-iframe/vc-iframe.vue';
import VcThird from "./vc-third/vc-third.vue";
import ThreadDetail from "~/components/level1/thread-detail/thread-detail.vue";
import CommentDetail from "~/components/level2/comment-detail/comment-detail.vue";
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
  vcData,
  onTapBack,
  onTapClose,
  onTapOpenInNew,
} = useViceContent()

const {
  onViewStateChange,
  containerRef,
  showDropZone,
} = useVcDropZone(vcData, props)

watch(() => vcData.currentState, (newV) => {
  emits("vcstatechange", newV)
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
    :vc-state="vcData.currentState"
    @tapback="onTapBack"
    @tapclose="onTapClose"
    @tapopeninnew="onTapOpenInNew"
  ></VcNaviBar>

  <div class="vcliu-container" ref="containerRef">

    <template v-for="(item, index) in vcData.list" :key="item.id">

      <div class="vcliu-view" v-show="item.show">
        <!-- iframe -->
        <VcIframe
          v-if="item.state === 'iframe'"
          :is-outter-draging="item.show && isOutterDraging"
          :iframe-src="item.id"
          :vc-height="vcHeight2"
          :mask-margin-top="maskMarginTop"
        ></VcIframe>

        <!-- third-party -->
        <VcThird v-else-if="item.state === 'third' && item.thirdParty"
          :third-party="item.thirdParty"
          :link="item.id"
          :is-outter-draging="item.show && isOutterDraging"
          :vc-height="vcHeight2"
          :mask-margin-top="maskMarginTop"
        ></VcThird>

        <!-- 动态或评论 -->
        <div class="vcliu-content"
          v-else-if="item.state === 'thread' || item.state === 'comment'"
        >

          <ScrollView>
            <div class="vcliu-virtual"></div>
            <div class="vcliu-box" v-if="item.state === 'thread'">
              <ThreadDetail
                :thread-id="item.id"
                location="vice-view"
                @pagestatechange="onViewStateChange"
                :is-showing="item.show"
              ></ThreadDetail>
            </div>
            <div class="vcliu-box" v-else-if="item.state === 'comment'">
              <CommentDetail
                location="vice-view"
                :target-id="item.id"
                :is-showing="item.show"
              ></CommentDetail>
            </div>
          </ScrollView>
        </div>

      </div>
    
    </template>

    <!-- 文件掉落盒 -->
    <RightDropZone
      :show-drop-zone="showDropZone"
    ></RightDropZone>

  </div>

</template>
<style scoped lang="scss">

.vcliu-container {
  width: 100%;
  height: v-bind("vcHeight + 'px'");
  position: relative;
}

.vcliu-view {
  width: 100%;
  height: 100%;
  position: relative;
}

.vcliu-content {
  width: 100%;
  height: 100%;
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