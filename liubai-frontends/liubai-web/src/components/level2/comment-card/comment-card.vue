<script setup lang="ts">
import { type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CommentShow } from '~/types/types-content';
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import CcBox from "./cc-box/cc-box.vue"
import CcBubbleBar from './cc-bubble-bar/cc-bubble-bar.vue';
import type { CommentCardLocation } from "./tools/types"
import { useCommentCard } from "./tools/useCommentCard"
import CcToolbar from './cc-toolbar/cc-toolbar.vue';

const { t } = useI18n()

const props = defineProps({
  cs: {          // cs 为 commentShow 的简写
    type: Object as PropType<CommentShow>,
    required: true,
  },
  isTargetComment: {     // 是否为目标评论
    type: Boolean,
    default: false,
  },
  location: {
    type: String as PropType<CommentCardLocation>,
    required: true,
  }
})

const { 
  allowHover,
  hoverColor,
  enableBubbleBar,
  showBubbleBar,
  onMouseEnterComment,
  onMouseLeaveComment,
  onTapContainer,
} = useCommentCard(props)

</script>
<template>

  <div class="cc-container"
    @mouseenter="onMouseEnterComment"
    @mouseleave="onMouseLeaveComment"
    @click.stop="onTapContainer"
  >

    <!-- 上部留白 （ + 指向上方评论） -->
    <div class="cc-top">

      <!-- 当前评论有指向前面的评论时 -->
      <div v-if="cs.prevIReplied" class="cct-prevIReplied">
        <div class="cct-prevIReplied-line"></div>
      </div>

    </div>

    <!-- 正常显示时的主体 -->
    <div v-if="cs.oState === 'OK'" class="cc-main">

      <!-- 当前评论为目标评论时 -->
      <div v-if="isTargetComment" class="cc-target">

        <!-- 头像、姓名和日期 -->
        <div class="cct-first-bar">
          <LiuAvatar
            class="cct-avatar"
            :member-show="cs.creator"
          ></LiuAvatar>
          <div class="cctf-info">
            <!-- 用户名 -->
            <div class="cctf-account">
              <span v-if="cs.creator?.name">{{ cs.creator?.name }}</span>
              <span v-else>{{ t('comment.no_idea') }}</span>
            </div>

            <!-- 发表或编辑时间 -->
            <div class="cctf-time">
              <span v-if="cs.editedStr">{{ t('thread_related.edited_at', { date: cs.editedStr }) }}</span>
              <span v-else>{{ cs.createdStr }}</span>
            </div>

          </div>

          <!-- 更多选项: 先留空 -->
          <!-- <div class="cctf-footer">
            
          </div> -->
        </div>

        <!-- 内文 + 图片 + 文件 -->
        <CcBox :cs="cs"></CcBox>

        <!-- 工具栏 -->
        <CcToolbar :cs="cs"></CcToolbar>

      </div>

      <!-- 通用评论 -->
      <div v-else class="cc-common">

        <!-- 头像 （+指向下个评论的线条）-->
        <div class="ccc-first-column">
          <LiuAvatar
            class="ccc-avatar"
            :member-show="cs.creator"
          ></LiuAvatar>
          <div class="cccf-line-box">
            <div class="cccf-line" v-if="cs.nextRepliedMe"></div>
          </div>
        </div>

        <div class="ccc-main">
          <!-- 用户名 + 时间 -->
          <div class="ccc-account-time">
            <div class="ccc-account">
              <span v-if="cs.creator?.name">{{ cs.creator?.name }}</span>
              <span v-else>{{ t('comment.no_idea') }}</span>
            </div>
            <div class="ccc-time">
              <span v-if="cs.editedStr">{{ cs.editedStr }}</span>
              <span v-else>{{ cs.createdStr }}</span>
            </div>
          </div>

          <!-- 内文 + 图片 + 文件 -->
          <CcBox :cs="cs"></CcBox>

        </div>

      </div>
      
    </div>

    <!-- 已删除时的部分 -->
    <div v-else class="cc-delete">
      <div class="cc-delete-box">
        <span>{{ t('comment.deleted_tip') }}</span>
      </div>

    </div>


    <!-- 悬浮在右上角的 actionbar -->
    <CcBubbleBar
      v-if="enableBubbleBar"
      :show="showBubbleBar"
      :location="location"
      :cs="cs"
    ></CcBubbleBar>

  </div>
</template>
<style scoped lang="scss">

.cc-container {
  width: 100%;
  box-sizing: border-box;
  position: relative;
  padding: 0 10px;
  transition: .15s;
  border-radius: 16px;
  cursor: v-bind("allowHover ? 'pointer' : 'auto'");
}

@media(hover: hover) {
  .cc-container:hover {
    background: v-bind("hoverColor");
  }

}

.cc-top {
  width: 100%;
  height: 12px;

  .cct-prevIReplied {
    width: 38px;
    height: 8px;
    display: flex;
    position: relative;
    justify-content: center;

    .cct-prevIReplied-line {
      width: 2px;
      height: 100%;
      background-color: var(--line-hover);
      border-bottom-left-radius: 1px;
      border-bottom-right-radius: 1px;
    }
  }
}

.cc-main {
  width: 100%;
  position: relative;
}

.cc-target {
  width: 100%;
  position: relative;
  padding-block-end: 12px;
}

.cct-first-bar {
  width: 100%;
  position: relative;
  display: flex;
  margin-block-end: 4px;
}

.cct-avatar {
  width: 38px;
  height: 38px;
  margin-inline-end: 12px;
  flex: none;
}

.cctf-info {
  flex: 1;
  position: relative;
}

.cctf-account {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-size: var(--mini-font);
  color: var(--liu-quote);
  user-select: none;
  margin-block-start: -4px;
}

.cctf-time {
  font-size: var(--mini-font);
  color: var(--main-tip);
  user-select: none;
}

/** 通用评论的 layout */
.cc-common {
  width: 100%;
  position: relative;
  display: flex;
}

.ccc-first-column {
  width: 38px;
  flex: none;
  margin-inline-end: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.ccc-avatar {
  width: 38px;
  height: 38px;
  margin-block-end: 2px;
}

.cccf-line-box {
  display: flex;
  justify-content: center;
  position: relative;
  width: 100%;
  flex: 1;
}

.cccf-line {
  height: 100%;
  width: 2px;
  background: var(--line-hover);
  border-top-left-radius: 1px;
  border-top-right-radius: 1px;
  overflow: hidden;
}

.ccc-main {
  flex: 1;
  position: relative;
  padding-block-end: 12px;
  max-width: calc(100% - 50px);   // 扣掉头像的宽度 + margin
}

.ccc-account-time {
  display: flex;
  flex-wrap: wrap;
  user-select: none;
  margin-block-start: -4px;
  margin-block-end: 4px;
}

.ccc-account {
  font-size: var(--mini-font);
  color: var(--liu-quote);
  margin-inline-end: 10px;
}

.ccc-time {
  font-size: var(--mini-font);
  color: var(--main-note);
}



/** 删除的部分 */
.cc-delete {
  width: 100%;
  position: relative;
  padding-block-end: 12px;

  .cc-delete-box {
    width: 100%;
    padding: 12px;
    border-radius: 16px;
    box-sizing: border-box;
    background-color: var(--line-default);
    font-size: var(--mini-font);
    color: var(--main-note);
    word-wrap: break-word;
  }

}





</style>