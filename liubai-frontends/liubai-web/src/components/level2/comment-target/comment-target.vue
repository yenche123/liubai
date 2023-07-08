<script setup lang="ts">
// 评论区，只 loadByComment
// 场景: 已知某个 targetComment，加载出它的上下文
//   向上加载: find_parent
//   向下加载: find_children
//   当向上加载到尽头时，加载 thread
import PlaceholderView from '~/views/common/placeholder-view/placeholder-view.vue';
import ThreadCard from "../../level1/thread-list/thread-card/thread-card.vue";
import CommentCard from "../comment-card/comment-card.vue";
import CommentEditor from "~/components/editors/comment-editor/comment-editor.vue";
import PinwheelLoader from "../../loaders/pinwheel-loader/pinwheel-loader.vue"
import type { PropType } from 'vue';
import type { WhatDetail, LocatedA } from '~/types/other/types-custom';
import type { CommentTargetEmit } from "./tools/types";
import { useCommentTarget } from "./tools/useCommentTarget"
import { 
  useThreadOperateInDetail 
} from "../../level1/thread-detail/tools/useThreadOperateInDetail"


const props = defineProps({
  location: {
    type: String as PropType<WhatDetail>,
    required: true
  },
  targetId: {
    type: String,
    required: true,
  }
})

let commentEditorLocated: LocatedA = "vice-view"
if(props.location === "detail-page") commentEditorLocated = "main-view"

const emit = defineEmits<CommentTargetEmit>()
const { ctData } = useCommentTarget(props, emit)

const { receiveOperation } = useThreadOperateInDetail()

</script>
<template>

  <PlaceholderView 
    :p-state="ctData.state"
  ></PlaceholderView>

  <ThreadCard 
    v-if="ctData.thread && ctData.state < 0"
    :thread-data="ctData.thread"
    display-type="detail"
    :position="0"
    @newoperate="(op) => receiveOperation(op, ctData.thread)"
  ></ThreadCard>

  <!-- 评论区: aboveList + 目标评论 + 回复框 + belowList -->
  <div class="ct-container" v-if="ctData.state < 0 && ctData.targetComment">

    <!-- 上方评论 -->
    <template v-for="(item, index) in ctData.aboveList"
      :key="item._id"
    >
      <CommentCard
        :cs="item"
        :location="location"
      ></CommentCard>
    </template>

    <!-- 目标评论 -->
    <CommentCard
      :cs="ctData.targetComment"
      :location="location"
    ></CommentCard>

    <!-- 回复框 -->
    <CommentEditor
      :located="commentEditorLocated"
      :parent-thread="ctData.targetComment.parentThread"
      :parent-comment="ctData.targetComment.replyToComment ?? ctData.targetComment._id"
      :reply-to-comment="ctData.targetComment._id"
    ></CommentEditor>

    <!-- belowList -->
    <template v-for="(item, index) in ctData.belowList"
      :key="item._id"
    >
      <CommentCard
        :cs="item"
        :location="location"
      ></CommentCard>
    </template>

    <!-- 底部加载 loading 和占位 -->
    <div class="ct-bottom">

      <!-- 必须有 belowList 才显示，因为 PlaceholderView 本身就有加载框了 -->
      <PinwheelLoader 
        v-if="ctData.belowList.length && !ctData.hasReachedBottom" 
        color="var(--main-tip)"
      ></PinwheelLoader>

    </div>



  </div>

</template>
<style lang="scss" scoped>

.ct-container {
  width: 100%;
  position: relative;
}

.ct-bottom {
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}


</style>