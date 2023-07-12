<script setup lang="ts">
import CommentDetail from '~/components/level2/comment-detail/comment-detail.vue';
import { useCommentContent } from './tools/useCommentContent';

const {
  commentId
} = useCommentContent()

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="liu-mc-box" v-if="commentId">
      <CommentDetail 
        :target-id="commentId"
        location="detail-page"
      ></CommentDetail>
    </div>
  </div>


</template>
<style scoped lang="scss">



</style>