<script setup lang="ts">
import CommentDetail from '~/components/level2/comment-detail/comment-detail.vue';

defineProps({
  commentId: {
    type: String,
    required: true,
  },
  isShowing: {
    type: Boolean,
  }
})

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="liu-mc-box" v-if="commentId">
      <CommentDetail 
        :target-id="commentId"
        :is-showing="isShowing"
        location="detail-page"
      ></CommentDetail>
    </div>
  </div>


</template>
<style scoped lang="scss">



</style>