<script setup lang="ts">
// 评论区，可向上加载，也可向下加载
// 向上加载只出现在 targetCommentId 有值时，且只向上加载它的回复
// 即它的 replyToComment，若 replyToComment 该值不存在就加载它的 parentThread
import type { CommentAreaEmits } from "./tools/types"
import { useCommentArea } from "./tools/useCommentArea";

const props = defineProps({
  threadId: {
    type: String,
    required: true,
  },
  targetCommentId: String,
  reachBottomNum: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits<CommentAreaEmits>()

useCommentArea(props, emit)

</script>
<template>


</template>
<style scoped lang="scss">


</style>