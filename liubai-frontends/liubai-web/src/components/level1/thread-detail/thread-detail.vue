<script setup lang="ts">
import type { PropType } from 'vue';
import PlaceholderView from '~/views/common/placeholder-view/placeholder-view.vue';
import ThreadCard from "../thread-list/thread-card/thread-card.vue"
import { useThreadDetail } from "./tools/useThreadDetail"
import { useThreadOperateInDetail } from './tools/useThreadOperateInDetail';
import { subscribeUpdate } from "./tools/subscribeUpdate"
import type { WhatDetail } from '~/types/other/types-custom';
import CommentEditor from "~/components/editors/comment-editor/comment-editor.vue"
import type { LocatedA } from "~/types/other/types-custom"
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
  }
})

const emit = defineEmits<TdEmit>()

const {
  tdData
} = useThreadDetail(props, emit)

let commentEditorLocated: LocatedA = "vice-view"
if(props.location === "detail-page") commentEditorLocated = "main-view"

const {
  receiveOperation
} = useThreadOperateInDetail(tdData)

subscribeUpdate(tdData)

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
    @newoperate="receiveOperation"
  ></ThreadCard>

  <!-- 评论区 -->
  <div 
    v-if="tdData.threadShow && tdData.state < 0"
    class="td-comment-area"
  >

    <CommentEditor
      :located="commentEditorLocated"
      :parent-thread="tdData.threadShow._id"
    ></CommentEditor>

    <CommentArea
      :thread-id="tdData.threadShow._id"
    ></CommentArea>

    <div class="td-tmp-box"></div>

  </div>

</template>
<style scoped lang="scss">

.td-comment-area {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 0;
  position: relative;
}

.td-tmp-box {
  width: 100%;
  height: 100px;
}


</style>