<script setup lang="ts">
import { initCommentPopup } from "./tools/useCommentPopup"
import CommentCard from "~/components/level2/comment-card/comment-card.vue";
import CommentEditor from "~/components/editors/comment-editor/comment-editor.vue";
import liuApi from '~/utils/liu-api';

const { 
  cpData,
  onTapCancel,
  onFinished,
} = initCommentPopup()

const { isMobile } = liuApi.getCharacteristic()
const icon_color = `var(--main-normal)`

</script>
<template>

<div class="cp-container" v-if="cpData.enable">

  <div class="cp-bg" 
    :class="{ 'cp-bg_show': cpData.show }"
    @click.stop="onTapCancel"
  ></div>

  <div class="cp-big-box"
    :class="{ 'cp-big-box_show': cpData.show }"
  >

    <div class="cp-box">

      <div class="cp-first-bar">
        <div class="liu-hover cp-close-box" @click="onTapCancel">
          <svg-icon name="close" class="cp-close-svg"
            :color="icon_color"
          ></svg-icon>
        </div>

      </div>

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
        :parent-comment="cpData.parentComment"
        :reply-to-comment="cpData.replyToComment"
        :comment-id="cpData.commentId"
        is-showing
        :focus-num="cpData.focusNum"
        @finished="onFinished"
      ></CommentEditor>

      <div class="cp-virtual"></div>

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
  z-index: 2500;

  .cp-bg {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: var(--popup-bg);
    z-index: 2505;
    opacity: 0;
    transition: v-bind("cpData.transDuration + 'ms'");

    &.cp-bg_show {
      opacity: 1;
    }
  }
}

.cp-big-box {
  z-index: 2510;
  width: 50%;
  min-width: 400px;
  max-width: 750px;
  border-radius: 24px 24px 24px 24px;
  overflow: hidden;
  background-color: var(--card-bg);
  position: relative;
  transform: translateY(100%);
  opacity: 0;
  transition: v-bind("cpData.transDuration + 'ms'");
  transition-timing-function: cubic-bezier(0.32, 0.72, 0.05, 1);
}

.cp-box {
  width: 100%;
  padding: 10px 14px 0px;
  box-sizing: border-box;
  max-height: min(500px, 90vh);
  overflow: auto;
  position: relative;

  scrollbar-color: var(--scrollbar-thumb) transparent;
  scrollbar-width: v-bind("isMobile ? 'none' : 'auto'");

  &::-webkit-scrollbar {
    display: v-bind("isMobile ? 'none' : 'block'");
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }
}

.cp-first-bar {
  width: 100%;
  height: 40px;
  position: relative;
}

.cp-close-box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
}

.cp-close-svg {
  width: 26px;
  height: 26px;
}

.cp-virtual {
  width: 90%;
  height: 14px;
}

@media screen and (max-width: 500px) {

  .cp-container {
    align-items: flex-end;
  }

  .cp-big-box {
    width: 100%;
    min-width: 250px;
    border-radius: 24px 24px 0px 0px;
    opacity: .56;
  }
}

.cp-big-box_show {
  opacity: 1;
  transform: translateY(0);
}


</style>