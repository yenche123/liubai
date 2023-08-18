<script setup lang="ts">
import { initCommentPopup } from "./tools/useCommentPopup"
import CommentCard from "~/components/level2/comment-card/comment-card.vue";
import CommentEditor from "~/components/editors/comment-editor/comment-editor.vue";
import CpDropZone from "./cp-drop-zone/cp-drop-zone.vue"
import liuApi from '~/utils/liu-api';
import { useI18n } from "vue-i18n";
import { useCpDropZone } from "./tools/useCpDropZone"

const { 
  cpData,
  onTapCancel,
  onFinished,
} = initCommentPopup()

const { isMobile } = liuApi.getCharacteristic()
const icon_color = `var(--main-normal)`

const {
  containerRef,
  showDropZone,
} = useCpDropZone(cpData)

const { t } = useI18n()

const onTapTopFooterBtn = () => {
  if(!cpData.canSubmit) return
  cpData.submitNum++
}

</script>
<template>

<div class="cp-container" v-if="cpData.enable">

  <div class="cp-bg" 
    :class="{ 'cp-bg_show': cpData.show }"
    @click.stop="onTapCancel"
  ></div>

  <div class="cp-big-box"
    :class="{ 'cp-big-box_show': cpData.show }"
    ref="containerRef"
  >

    <div class="cp-top-bar">

      <LiuTooltip
        placement="left"
        :aria-label="t('comment.esc')"
        shortcut="Esc"
        :distance="4"
      >
        <div class="liu-hover cp-close-box" @click="onTapCancel">
          <svg-icon name="close" class="cp-close-svg"
            :color="icon_color"
          ></svg-icon>
        </div>
      </LiuTooltip>
      

      <div class="cp-top-footer">
        <div class="cemtf-submit-btn" 
          :class="{ 'cemtf-submit_disabled': !cpData.canSubmit }"
          v-show="cpData.rightTopBtn"
          @click.stop="onTapTopFooterBtn"
        >
          <span v-if="cpData.operation === 'edit_comment'">{{ t('common.update') }}</span>
          <span v-else>{{ t('common.reply') }}</span>
        </div>
      </div>
    </div>

    <div class="cp-box">

      <div class="cp-virtual-top"></div>

      <CommentCard
        v-if="cpData.operation === 'reply_comment' && cpData.commentShow"
        :cs="cpData.commentShow"
        location="popup"
      ></CommentCard>
      <CommentCard
        v-else-if="cpData.operation === 'reply_thread' && cpData.csTsPretend"
        :cs="cpData.csTsPretend"
        location="popup"
      ></CommentCard>

      <div v-else class="cp-virtual-top2"></div>

      <CommentEditor
        located="popup"
        :parent-thread="cpData.parentThread"
        :parent-comment="cpData.parentComment"
        :reply-to-comment="cpData.replyToComment"
        :comment-id="cpData.commentId"
        is-showing
        :focus-num="cpData.focusNum"
        :submit-num="cpData.submitNum"
        :show-submit-btn="!cpData.rightTopBtn"
        @finished="onFinished"
        @cansubmit="(newV) => cpData.canSubmit = newV"
      ></CommentEditor>

      <div class="cp-virtual"></div>

    </div>

    <CpDropZone :show-drop-zone="showDropZone"></CpDropZone>
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
  width: 60%;
  min-width: 450px;
  max-width: 800px;
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
  z-index: 2511;

  scrollbar-color: var(--scrollbar-thumb) transparent;
  scrollbar-width: v-bind("isMobile ? 'none' : 'auto'");

  &::-webkit-scrollbar {
    display: v-bind("isMobile ? 'none' : 'block'");
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }
}

.cp-top-bar {
  width: calc(100% - 10px);
  height: 56px;
  padding-block-start: 10px;
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2515;
  display: flex;
}

.cp-top-bar::before {
  background: var(--frosted-glass-4);
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
  overflow: hidden;
}

.cp-close-box {
  margin-inline-start: 14px;
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

.cp-top-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  margin-inline-end: 4px;
}

.cemtf-submit-btn {
  padding: 0 16px;
  border-radius: 20px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  background-color: var(--primary-color);
  color: var(--on-primary);
  font-size: var(--mini-font);
  transition: .15s;
  user-select: none;
  font-weight: 500;
  position: relative;
}

.cemtf-submit_disabled {
  background-color: var(--primary-color);
  opacity: .5;
  cursor: default;
}

@media(hover: hover) {
  .cemtf-submit-btn:hover {
    background-color: var(--primary-hover);
  }

  .cemtf-submit_disabled:hover {
    background-color: var(--primary-color);
  }
}

.cemtf-submit-btn:active {
  background-color: var(--primary-active);
}

.cemtf-submit_disabled:active {
  background-color: var(--primary-color);
}



.cp-virtual-top {
  width: 100%;
  height: 40px;
  position: relative;
}

.cp-virtual {
  width: 90%;
  height: 14px;
}

.cp-virtual-top2 {
  width: 100%;
  height: 10px;
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