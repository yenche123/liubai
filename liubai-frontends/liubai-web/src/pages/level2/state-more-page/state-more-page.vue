<script setup lang="ts">
// 状态更多页，用于查看某个状态下的更多动态
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import StateMoreContent from "./state-more-content/state-more-content.vue";
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';
import { useMainVice } from "~/hooks/useMainVice";
import { useStateMorePage } from "./tools/useStateMorePage";
import PlaceholderView from '~/views/common/placeholder-view/placeholder-view.vue';
import type { TrueOrFalse } from "~/types/types-basic";

const { 
  hiddenScrollBar, 
  onVvWidthChange,
} = useMainVice()

const {
  smpData,
  onTapFab,
  onScroll,
} = useStateMorePage()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    <template v-for="(item, index) in smpData.list" :key="item.id">
      <div class="liu-view" v-show="item.show">
        <scroll-view 
          :hidden-scroll-bar="item.show && hiddenScrollBar" 
          :show-txt="(String(item.show) as TrueOrFalse)"
          @scroll="onScroll"
          :go-to-top="item.goToTop"
        >
          <navi-virtual></navi-virtual>
          <PlaceholderView 
            :p-state="item.pState"
          ></PlaceholderView>
          <StateMoreContent 
            v-if="item.pState < 0"
            :state-id="item.id"
            :show-txt="(String(item.show) as TrueOrFalse)"
          ></StateMoreContent>
        </scroll-view>
        <navi-bar 
          :title="item.stateText"
          :title-key="item.stateTextKey"
          placeholder-key="common.state"
        ></navi-bar>

        <FloatActionButton 
          :scroll-position="item.scrollPosition"
          @tapfab="onTapFab"
        ></FloatActionButton>
      </div>
    </template>
    
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style lang="scss" scoped>


</style>