<script setup lang="ts">
// 目标评论的工具栏
import { computed, type PropType } from 'vue';
import type { CommentShow } from '~/types/types-content';
import { useI18n } from "vue-i18n"

const props = defineProps({
  cs: {
    type: Object as PropType<CommentShow>,
    required: true,
  }
})

const { t } = useI18n()
const default_color = "var(--main-normal)"

const marginBlockStart = computed(() => {
  const { images, files } = props.cs
  if(images?.length || files?.length) {
    return `4px`
  }
  return `10px`
})

</script>
<template>

  <div class="cc-toolbar">

    <!-- 表态 -->
    <div class="liu-hover liu-hover_first cct-item"
      :aria-label="t('common.reaction')"
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
    >
      <div class="cct-svg-box">
        <svg-icon name="share" class="cct-svg"
          :color="default_color"
        ></svg-icon>
      </div>
    </div>

    <!-- 更多 -->

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

.cct-text {
  margin-inline-start: 2px;
  font-size: var(--btn-font);
  color: var(--main-normal);
  user-select: none;
  font-weight: 400;
  padding-inline-end: 5px;
}


</style>