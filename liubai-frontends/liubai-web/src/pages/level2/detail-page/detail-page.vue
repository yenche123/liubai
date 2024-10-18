<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import DetailContent from "./detail-content/detail-content.vue";
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';
import { useMainVice } from "~/hooks/useMainVice";
import { useI18n } from "vue-i18n";
import { useDetailPage } from "./tools/useDetailPage";
import type { TrueOrFalse } from "~/types/types-basic"

const { 
  hiddenScrollBar, 
  onVvWidthChange,
} = useMainVice({ setDefaultTitle: false })

const {
  dpData,
} = useDetailPage()


const { t } = useI18n()

</script>
<template>

  <!-- 主视图 -->
  <main-view :enable-drop-files="true">
    <template v-for="(item, index) in dpData.list" :key="item.id">
      <div class="liu-view" v-show="item.show">
        <scroll-view 
          :hidden-scroll-bar="item.show && hiddenScrollBar" 
          :show-txt="(String(item.show) as TrueOrFalse)"
        >
          <navi-virtual></navi-virtual>
          <detail-content :thread-id="item.id"></detail-content>
        </scroll-view>
        <navi-bar></navi-bar>
      </div>
    </template>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>