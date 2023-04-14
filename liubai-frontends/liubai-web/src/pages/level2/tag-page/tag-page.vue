<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import TagContent from "./tag-content/tag-content.vue";
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';
import { useMainVice } from "~/hooks/useMainVice";
import { useI18n } from "vue-i18n";
import { useTagPage } from "./tools/useTagPage";
import PlaceholderView from '~/views/common/placeholder-view/placeholder-view.vue';

const { 
  hiddenScrollBar, 
  goToTop,
  onVvWidthChange,
  onTapFab,
  scrollPosition,
  onScroll,
} = useMainVice()
const { t } = useI18n()

const { tagName, tagId, pState } = useTagPage()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    <scroll-view :hidden-scroll-bar="hiddenScrollBar" @scroll="onScroll"
      :go-to-top="goToTop"
    >
      <navi-virtual></navi-virtual>
      <PlaceholderView 
        :p-state="pState"
      ></PlaceholderView>
      <TagContent 
        :tag-id="tagId"
      ></TagContent>
    </scroll-view>
    <navi-bar :title="tagName ? tagName : t('common.tags')"></navi-bar>

    <FloatActionButton :scroll-position="scrollPosition"
      @tapfab="onTapFab"
    ></FloatActionButton>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>