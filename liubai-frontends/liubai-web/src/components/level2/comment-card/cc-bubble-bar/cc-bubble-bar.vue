<script setup lang="ts">
// 当用户鼠标滑过 当前 comment-card 时
// 才悬浮于右上角的工具栏

import { type PropType } from 'vue';
import type { CommentCardLocation } from "../tools/types";
import type { CcBubbleBarEmits } from "./tools/types";
import type { CommentShow } from '~/types/types-content';
import { useI18n } from "vue-i18n";
import type { CommentCardReaction } from '../tools/types';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String as PropType<CommentCardLocation>,
    required: true,
  },
  cs: {
    type: Object as PropType<CommentShow>,
    required: true,
  },
  ccReaction: {
    type: Object as PropType<CommentCardReaction>,
  }
})

defineEmits<CcBubbleBarEmits>()

const default_color = "var(--main-code)"
const onTapBlank = () => {}

const { t } = useI18n()

</script>
<template>

  <!-- absolute 布局 -->
  <div class="cc-bubble-bar"
    :class="{ 'cc-bubble-bar_show': show }"
    @click.stop="onTapBlank"
  >

    <!-- 表态按钮 -->
    <div class="liu-hover ccbb-box"
      :aria-label="t('common.reaction')"
      @click.stop="$emit('newoperation', 'emoji')"
    >
      <div class="ccbb-svg-box">
        <svg-icon v-if="ccReaction?.iconName" 
          :name="ccReaction.iconName"
          class="ccbb-svg"
          :coverFillStroke="false"
        ></svg-icon>

        <span v-else-if="ccReaction?.emoji" class="ccbb-svg-text">{{ ccReaction.emoji }}</span>

        <svg-icon v-else name="add_reaction_600" class="ccbb-svg"
          :color="default_color"
        ></svg-icon>
      </div>
    </div>

    <!-- 回复按钮 -->
    <div class="liu-hover ccbb-box"
      :aria-label="t('common.reply')"
      @click.stop="$emit('newoperation', 'comment')"
    >
      <div class="ccbb-svg-box">
        <svg-icon name="comment" class="ccbb-svg ccbb-svg_reply"
          :color="default_color"
        ></svg-icon>
      </div>
      <span class="ccbb-text" v-if="cs.commentNum">{{ cs.commentNum }}</span>
    </div>

    <!-- 分享按钮 -->
    <div class="liu-hover ccbb-box"
      :aria-label="t('common.share')"
      @click.stop="$emit('newoperation', 'share')"
    >
      <div class="ccbb-svg-box">
        <svg-icon name="share" class="ccbb-svg"
          :color="default_color"
        ></svg-icon>
      </div>
    </div>

    <!-- 删除按钮 -->
    <div class="liu-hover liu-hover_last ccbb-box"
      v-if="cs.isMine"
      :aria-label="t('common.delete')"
      @click.stop="$emit('newoperation', 'delete')"
    >
      <div class="ccbb-svg-box">
        <svg-icon name="delete_400" class="ccbb-svg"
          :color="default_color"
        ></svg-icon>
      </div>
    </div>

    <!-- 举报按钮 -->
    <div class="liu-hover liu-hover_last ccbb-box"
      v-else
      :aria-label="t('common.report')"
      @click.stop="$emit('newoperation', 'report')"
    >
      <div class="ccbb-svg-box">
        <svg-icon name="report_600" class="ccbb-svg"
          :color="default_color"
        ></svg-icon>
      </div>
    </div>

  </div>


</template>
<style lang="scss" scoped>

.cc-bubble-bar {
  position: absolute;
  top: -14px;
  right: 8px;
  display: flex;
  opacity: 0;
  visibility: hidden;
  transition: .15s;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  padding: 4px 6px;
  cursor: auto;
}

.cc-bubble-bar_show {
  opacity: 1;
  visibility: visible;
}

.ccbb-box {
  display: flex;
  align-items: center;
  margin-inline-end: 4px;
}

.ccbb-box:last-child {
  margin-inline-end: 0;
}

.ccbb-svg-box {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.ccbb-svg-text {
  font-size: var(--desc-font);
}

.ccbb-svg {
  width: 22px;
  height: 22px;
}

.ccbb-svg_reply {
  margin-block-start: 2px;
}

.ccbb-text {
  margin-block-start: 2px;
  margin-inline-start: -2px;
  font-size: var(--mini-font);
  color: var(--main-code);
  user-select: none;
  font-weight: 400;
  padding-inline-end: 5px;
}



</style>