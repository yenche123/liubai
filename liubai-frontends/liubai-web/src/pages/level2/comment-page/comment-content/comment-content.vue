<script setup lang="ts">
import CommentTarget from '~/components/level2/comment-target/comment-target.vue';
import { useCommentContent } from './tools/useCommentContent';

const {
  commentId
} = useCommentContent()

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="liu-mc-box" v-if="commentId">
      <CommentTarget 
        :target-id="commentId"
        location="detail-page"
      ></CommentTarget>
    </div>
  </div>


</template>
<style scoped lang="scss">



</style>