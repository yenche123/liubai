<script setup lang="ts">
// 评论页（打开目标评论）
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';
import CommentContent from "./comment-content/comment-content.vue";
import { useMainVice } from "~/hooks/useMainVice";
import { useI18n } from "vue-i18n";

const { 
  hiddenScrollBar, 
  onVvWidthChange,
} = useMainVice({ setDefaultTitle: false })
const { t } = useI18n()

</script>
<template>

  <!-- 主视图 -->
  <main-view :drop-files="true">
    <scroll-view :hidden-scroll-bar="hiddenScrollBar">
      <navi-virtual></navi-virtual>
      <CommentContent></CommentContent>
    </scroll-view>
    <navi-bar :title="t('common.detail')"></navi-bar>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>