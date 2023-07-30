<script setup lang="ts">
import { initCommentPopup } from "./tools/useCommentPopup"
import CommentCard from "~/components/level2/comment-card/comment-card.vue";
import CommentEditor from "~/components/editors/comment-editor/comment-editor.vue"

const { cpData } = initCommentPopup()


</script>
<template>

<div class="cp-container" v-if="cpData.enable">

  <div class="cp-big-box"
    :class="{ 'cp-big-box_show': cpData.show }"
  >

    <div class="cp-box">

      <CommentCard
        v-if="cpData.commentShow"
        :cs="cpData.commentShow"
        location="popup"
      ></CommentCard>
      <CommentCard
        v-else-if="cpData.csTsPretend"
        :cs="cpData.csTsPretend"
        location="popup"
      ></CommentCard>

      <CommentEditor
        located="popup"
        :parent-thread="cpData.parentThread"
        is-showing
      ></CommentEditor>

    </div>


  </div>

</div>

</template>
<style lang="scss" scoped>

/** 以 pc 端进行编写，再适配移动端（小于 500px 的情况） */

.cp-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4500;
}

.cp-big-box {
  width: 60%;
  min-width: 350px;
  max-width: 750px;
  border-radius: 24px 24px 24px 24px;
  overflow: hidden;
  background-color: var(--card-bg);
  position: relative;
  transform: translateY(100%);
  opacity: .66;
}

.cp-big-box_show {
  opacity: 1;
  transform: translateY(0);
}

.cp-box {
  width: 100%;
  box-sizing: border-box;
  padding: 24px 14px;
  height: 50vh;
  min-height: 300px;
  max-height: 600px;
  overflow: auto;
}



</style>