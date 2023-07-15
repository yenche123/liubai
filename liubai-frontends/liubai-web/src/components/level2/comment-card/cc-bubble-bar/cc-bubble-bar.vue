<script setup lang="ts">
// 当用户鼠标滑过 当前 comment-card 时
// 才悬浮于右上角的工具栏

import { type PropType } from 'vue';
import type { CommentCardLocation } from "../tools/types"
import type { CommentShow } from '~/types/types-content';
import { useI18n } from "vue-i18n"
import { useCcBubbleBar } from "./tools/useCcBubbleBar"

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
  }
})

const {
  onTapEmoji,
  onTapReply,
  onTapShare,
} = useCcBubbleBar(props)


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
      @click="onTapEmoji"
    >
      <div class="ccbb-svg-box">
        <svg-icon name="add_reaction_600" class="ccbb-svg"
          :color="default_color"
        ></svg-icon>
      </div>
      <span class="ccbb-text" v-if="cs.emojiData.total">{{ cs.emojiData.total }}</span>
    </div>

    <!-- 回复按钮 -->
    <div class="liu-hover ccbb-box"
      :aria-label="t('common.reply')"
    >
      <div class="ccbb-svg-box">
        <svg-icon name="comment" class="ccbb-svg"
          :color="default_color"
        ></svg-icon>
      </div>
      <span class="ccbb-text" v-if="cs.commentNum">{{ cs.commentNum }}</span>
    </div>

    <!-- 分享按钮 -->
    <div class="liu-hover ccbb-box"
      :aria-label="t('common.share')"
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

.ccbb-svg {
  width: 22px;
  height: 22px;
}

.ccbb-text {
  margin-inline-start: 2px;
  font-size: var(--mini-font);
  color: var(--main-code);
  user-select: none;
  font-weight: 400;
  padding-inline-end: 5px;
}



</style>