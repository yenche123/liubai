<script setup lang="ts">
// 评论区，只 loadByComment
// 场景: 已知某个 targetComment，加载出它的上下文
//   向上加载: find_parent
//   向下加载: find_children
//   当向上加载到尽头时，加载 thread
import PlaceholderView from '~/views/common/placeholder-view/placeholder-view.vue';
import ThreadCard from "../../level1/thread-list/thread-card/thread-card.vue"
import type { PropType } from 'vue';
import type { WhatDetail } from '~/types/other/types-custom';
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

  <!-- 评论区 -->
  <div class="ct-container">



  </div>

</template>
<style lang="scss" scoped></style>