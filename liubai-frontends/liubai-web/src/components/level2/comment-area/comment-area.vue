<script setup lang="ts">
// 评论区，只 loadByThread
// 场景: 已知 thread，在该动态下展示评论
import type { PropType } from "vue";
import CommentCard from "../comment-card/comment-card.vue";
import type { CommentAreaEmits } from "./tools/types"
import { useCommentArea } from "./tools/useCommentArea";
import type { WhatDetail } from "~/types/other/types-custom";

const props = defineProps({
  threadId: {
    type: String,
    required: true,
  },
  reachBottomNum: {
    type: Number,
    default: 0,
  },
  location: {
    type: String as PropType<WhatDetail>,
    required: true,
  },
  isShowing: {
    type: Boolean,
    default: true,
  }
})

const emit = defineEmits<CommentAreaEmits>()

const { caData } = useCommentArea(props, emit)

</script>
<template>

  <div class="ca-container">
    <template v-for="(item, index) in caData.comments" :key="item._id">
      <CommentCard
        :cs="item"
        :location="location"
        :is-showing="isShowing"
      ></CommentCard>
    </template>
  </div>

</template>
<style scoped lang="scss">

.ca-container {
  width: 100%;
  position: relative;
}


</style>