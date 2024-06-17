<script setup lang="ts">
// 评论区，只 loadByComment
// 场景: 已知某个 targetComment，加载出它的上下文
//   向上加载: find_parent
//   向下加载: find_children
//   当向上加载到尽头时，加载 thread
import ThreadCard from "../../level1/thread-list/thread-card/thread-card.vue";
import CommentCard from "../comment-card/comment-card.vue";
import CommentEditor from "~/components/editors/comment-editor/comment-editor.vue";
import PinwheelLoader from "../../loaders/pinwheel-loader/pinwheel-loader.vue"
import type { PropType } from 'vue';
import type { WhatDetail, LocatedA } from '~/types/other/types-custom';
import type { CommentDetailEmit } from "./tools/types";
import { useCommentDetail } from "./tools/useCommentDetail"
import { 
  useThreadOperateInDetail 
} from "../../level1/thread-detail/tools/useThreadOperateInDetail"
import { useIdsChanged } from "./tools/useIdsChanged"
import { subscribeCdUpdate } from "./tools/subscribeCdUpdate"
import { useI18n } from 'vue-i18n';

const props = defineProps({
  location: {
    type: String as PropType<WhatDetail>,
    required: true
  },
  targetId: {
    type: String,
    required: true,
  },
  isShowing: {
    type: Boolean,
  },
})

let commentEditorLocated: LocatedA = "vice-view"
if(props.location === "detail-page") commentEditorLocated = "main-view"

const emit = defineEmits<CommentDetailEmit>()
const { cdData, virtualHeightPx } = useCommentDetail(props, emit)

const { receiveOperation } = useThreadOperateInDetail()

subscribeCdUpdate(cdData)
useIdsChanged(cdData)

const { t } = useI18n()

</script>
<template>

  <PlaceholderView 
    :p-state="cdData.state"
  ></PlaceholderView>

  <ThreadCard 
    v-if="cdData.thread?.oState === 'OK' && cdData.state < 0"
    :thread-data="cdData.thread"
    display-type="detail"
    :position="0"
    is-in-comment-detail
    @newoperate="(op) => receiveOperation(op, cdData.thread)"
  ></ThreadCard>

  <!-- 动态已被删除 -->
  <div v-else-if="cdData.hasReachedTop && cdData.state < 0" 
    class="liu-no-user-select liu-highlight-box cd-thread-deleted"
  >
    <span>{{ t('comment.thread_deleted') }}</span>
  </div>

  <!-- 评论区: aboveList + 目标评论 + 回复框 + belowList -->
  <div class="cd-container" v-if="cdData.state < 0 && cdData.targetComment">

    <!-- 上方评论 -->
    <template v-for="(item, index) in cdData.aboveList"
      :key="item.first_id"
    >
      <CommentCard
        :cs="item"
        :location="location"
        :is-showing="isShowing"
      ></CommentCard>
    </template>

    <!-- 目标评论 -->
    <CommentCard
      :cs="cdData.targetComment"
      is-target-comment
      :location="location"
      :is-showing="isShowing"
    ></CommentCard>

    <!-- 占位 -->
    <div class="cd-virtual-one"></div>

    <!-- 回复框 -->
    <CommentEditor
      :located="commentEditorLocated"
      :parent-thread="cdData.targetComment.parentThread"
      :parent-comment="cdData.targetComment.replyToComment ?? cdData.targetComment._id"
      :reply-to-comment="cdData.targetComment._id"
      :is-showing="isShowing"
      :focus-num="cdData.focusNum"
    ></CommentEditor>

    <!-- belowList -->
    <template v-for="(item, index) in cdData.belowList"
      :key="item.first_id"
    >
      <CommentCard
        :cs="item"
        :location="location"
        :is-showing="isShowing"
      ></CommentCard>
    </template>

    <!-- 底部加载 loading 和占位 -->
    <div class="cd-bottom">

      <!-- 必须有 belowList 才显示，因为 PlaceholderView 本身就有加载框了 -->
      <PinwheelLoader 
        v-if="cdData.belowList.length && !cdData.hasReachedBottom" 
        color="var(--main-tip)"
      ></PinwheelLoader>

    </div>

    <div class="cd-virtual-one" 
      v-if="cdData.state < 50"
      :style="{ 'height': virtualHeightPx + 'px' }"
    ></div>

  </div>

</template>
<style lang="scss" scoped>

.cd-thread-deleted {
  margin-block-end: 10px;
  padding: 16px 24px;
}

.cd-container {
  width: 100%;
  position: relative;
}

.cd-virtual-one {
  width: 100%;
  height: 10px;
}

.cd-bottom {
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}


</style>