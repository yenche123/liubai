<script setup lang="ts">
import type { PropType } from 'vue';
import PlaceholderView from '~/views/common/placeholder-view/placeholder-view.vue';
import ThreadCard from "../thread-list/thread-card/thread-card.vue"
import { useThreadDetail } from "./tools/useThreadDetail"
import { useThreadOperateInDetail } from './tools/useThreadOperateInDetail';
import { subscribeTdUpdate } from "./tools/subscribeTdUpdate"
import type { WhatDetail, LocatedA } from '~/types/other/types-custom';
import CommentEditor from "~/components/editors/comment-editor/comment-editor.vue"
import CommentArea from '~/components/level2/comment-area/comment-area.vue';
import type { TdEmit } from "./tools/types"

const props = defineProps({
  location: {
    type: String as PropType<WhatDetail>,
    required: true
  },
  threadId: {
    type: String,
    required: true,
  },
  isShowing: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits<TdEmit>()

const {
  tdData
} = useThreadDetail(props, emit)

let commentEditorLocated: LocatedA = "vice-view"
if(props.location === "detail-page") commentEditorLocated = "main-view"

const {
  receiveOperation
} = useThreadOperateInDetail()

subscribeTdUpdate(tdData)

</script>
<template>

  <PlaceholderView 
    :p-state="tdData.state"
  ></PlaceholderView>
  <ThreadCard 
    v-if="tdData.threadShow && tdData.state < 0"
    :thread-data="tdData.threadShow"
    display-type="detail"
    :position="0"
    @newoperate="(op) => receiveOperation(op, tdData.threadShow)"
  ></ThreadCard>

  <!-- 评论区 -->
  <div 
    v-if="tdData.threadShow && tdData.state < 0"
    class="td-comment-area"
  >

    <CommentEditor
      :located="commentEditorLocated"
      :parent-thread="tdData.threadShow._id"
      :is-showing="isShowing"
    ></CommentEditor>

    <CommentArea
      :thread-id="tdData.threadShow._id"
      :location="location"
      :is-showing="isShowing"
    ></CommentArea>

    <div class="td-tmp-box"></div>

  </div>

</template>
<style scoped lang="scss">

.td-comment-area {
  width: 100%;
  box-sizing: border-box;
  padding: 16px 0;
  position: relative;
}

.td-tmp-box {
  width: 100%;
  height: 60px;
}


</style>