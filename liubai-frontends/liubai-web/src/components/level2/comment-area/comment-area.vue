<script setup lang="ts">
// 评论区，只 loadByThread
// 场景: 已知 thread，在该动态下展示评论
import type { PropType } from "vue";
import CommentCard from "../comment-card/comment-card.vue";
import ListBottom from "../../common/list-bottom/list-bottom.vue";
import type { CommentAreaEmits } from "./tools/types"
import { useCommentArea } from "./tools/useCommentArea";
import { useIdsChanged } from "./tools/useIdsChanged";
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
useIdsChanged(caData)

</script>
<template>

  <div class="ca-container">
    <template v-for="(item, index) in caData.comments" :key="item.first_id">
      <CommentCard
        :cs="item"
        :location="location"
        :is-showing="isShowing"
      ></CommentCard>
    </template>

    <ListBottom 
      :has-data="caData.comments.length > 0" 
      :reached="caData.hasReachedBottom"
    ></ListBottom>
  </div>

</template>
<style scoped lang="scss">

.ca-container {
  width: 100%;
  position: relative;
}


</style>