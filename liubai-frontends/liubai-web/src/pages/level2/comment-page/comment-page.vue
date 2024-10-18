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
import { useCommentPage } from "./tools/useCommentPage";
import type { TrueOrFalse } from "~/types/types-basic";

const { 
  hiddenScrollBar, 
  onVvWidthChange,
} = useMainVice({ setDefaultTitle: false })

const {
  cpData,
} = useCommentPage()

const { t } = useI18n()

</script>
<template>

  <!-- 主视图 -->
  <main-view :enable-drop-files="true">
    <template v-for="(item, index) in cpData.list" :key="item.id">
      <div class="liu-view" v-show="item.show">
        <scroll-view 
          :hidden-scroll-bar="item.show && hiddenScrollBar"
          :show-txt="(String(item.show) as TrueOrFalse)"
        >
          <navi-virtual></navi-virtual>
          <CommentContent
            :comment-id="item.id"
            :is-showing="item.show"
          ></CommentContent>
        </scroll-view>
        <navi-bar :title="t('common.detail')"></navi-bar>
      </div>
    </template>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>