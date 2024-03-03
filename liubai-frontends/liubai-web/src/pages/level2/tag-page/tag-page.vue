<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import TagContent from "./tag-content/tag-content.vue";
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';
import { useMainVice } from "~/hooks/useMainVice";
import { useTagPage } from "./tools/useTagPage";
import type { TrueOrFalse } from "~/types/types-basic";

const { 
  hiddenScrollBar, 
  onVvWidthChange,
} = useMainVice()

const { tpData, onTapFab, onScroll } = useTagPage()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    <template v-for="(item, index) in tpData.list" :key="item.id">
      <div class="liu-view" v-show="item.show">
        <scroll-view 
          :hidden-scroll-bar="item.show && hiddenScrollBar" 
          :show-txt="(String(item.show) as TrueOrFalse)"
          @scroll="onScroll"
          :go-to-top="item.goToTop"
        >
          <navi-virtual></navi-virtual>
          <PlaceholderView 
            :p-state="item.state"
          ></PlaceholderView>
          <TagContent 
            v-if="item.state < 0"
            :tag-id="item.id"
            :show-txt="(String(item.show) as TrueOrFalse)"
          ></TagContent>
        </scroll-view>
        <navi-bar 
          :title="item.tagName"
          placeholder-key="common.tags"
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
<style scoped>

</style>