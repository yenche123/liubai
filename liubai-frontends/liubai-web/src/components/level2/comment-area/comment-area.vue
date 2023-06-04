<script setup lang="ts">
// 评论区，只 loadByThread
import type { CommentAreaEmits } from "./tools/types"
import { useCommentArea } from "./tools/useCommentArea";

const props = defineProps({
  threadId: {
    type: String,
    required: true,
  },
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