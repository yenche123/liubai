<script setup lang="ts">
// 评论区，只 loadByThread
// 场景: 已知 thread，在该动态下展示评论
import CommentCard from "../comment-card/comment-card.vue";
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

const { caData } = useCommentArea(props, emit)

</script>
<template>

  <div class="ca-container">
    <template v-for="(item, index) in caData.comments" :key="item._id">
      <CommentCard
        :cs="item"
      ></CommentCard>
    </template>
  </div>

</template>
<style scoped lang="scss">

.ca-container {
  widows: 100%;
  position: relative;
}


</style>