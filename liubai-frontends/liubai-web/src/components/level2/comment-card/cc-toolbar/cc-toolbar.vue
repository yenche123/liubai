<script setup lang="ts">
// 目标评论的工具栏
import { type PropType } from 'vue';
import type { CommentShow } from '~/types/types-content';
import { useI18n } from "vue-i18n";
import { useCcToolbar } from './tools/useCcToolbar';

const props = defineProps({
  cs: {
    type: Object as PropType<CommentShow>,
    required: true,
  },
  isMouseEnter: Boolean,
})

const { t } = useI18n()
const default_color = "var(--main-normal)"
const {
  marginBlockStart,
  footerMenu,
  expandMore,
  onMenuShow,
  onMenuHide,
  onTapReaction,
  onTapReply,
  onTapShare,
  onTapMenuItem,
} = useCcToolbar(props)

</script>
<template>

  <div class="cc-toolbar">

    <!-- 表态 -->
    <div class="liu-hover liu-hover_first cct-item"
      :aria-label="t('common.reaction')"
      @click.stop="onTapReaction"
    >
      <div class="cct-svg-box">
        <svg-icon name="add_reaction_600" class="cct-svg"
          :color="default_color"
        ></svg-icon>
      </div>
      <span class="cct-text" v-if="cs.emojiData.total">{{ cs.emojiData.total }}</span>
    </div>

    <!-- 回复 -->
    <div class="liu-hover cct-item"
      :aria-label="t('common.reply')"
      @click.stop="onTapReply"
    >
      <div class="cct-svg-box">
        <svg-icon name="comment" class="cct-svg"
          :color="default_color"
        ></svg-icon>
      </div>
      <span class="cct-text" v-if="cs.commentNum">{{ cs.commentNum }}</span>
    </div>

    <!-- 分享 -->
    <div class="liu-hover cct-item"
      :aria-label="t('common.share')"
      @click.stop="onTapShare"
    >
      <div class="cct-svg-box">
        <svg-icon name="share" class="cct-svg"
          :color="default_color"
        ></svg-icon>
      </div>
    </div>

    <!-- 更多 -->
    <div class="liu-hover cct-more"
      :class="{ 'cct-more_show': expandMore }"
      :aria-label="t('editor.more')"
    >
      <LiuMenu
        :menu="footerMenu"
        min-width-str="100px"
        @menushow="onMenuShow"
        @menuhide="onMenuHide"
      >
        <div class="cct-svg-box">
          <svg-icon name="more" class="cct-svg_more"
            :color="default_color"
          ></svg-icon>
        </div>
      </LiuMenu>
    </div>

  </div>



</template>
<style lang="scss" scoped>

.cc-toolbar {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  position: relative;
  margin-block-start: v-bind("marginBlockStart");
  margin-inline-start: -6px;
}

.cct-item {
  display: flex;
  align-items: center;
  margin-inline-end: 6px;
}

.cct-item:last-child {
  margin-inline-end: 0;
}

.cct-more {
  width: 36px;
  height: 36px;
  position: relative;
  visibility: hidden;
  opacity: 0;
  transform: translateX(-100%);
  transition: .2s;
}

.cct-more_show {
  visibility: visible;
  opacity: 1;
  transform: translateX(0);
}

.cct-svg-box {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.cct-svg {
  width: 24px;
  height: 24px;
}

.cct-svg_more {
  width: 26px;
  height: 26px;
}

.cct-text {
  margin-inline-start: 2px;
  font-size: var(--btn-font);
  color: var(--main-normal);
  user-select: none;
  font-weight: 400;
  padding-inline-end: 5px;
}


</style>