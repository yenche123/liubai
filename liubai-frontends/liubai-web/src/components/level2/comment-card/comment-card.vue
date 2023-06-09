<script setup lang="ts">
import type { PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CommentShow } from '~/types/types-content';

const { t } = useI18n()

const props = defineProps({
  cs: {          // cs 为 commentShow 的简写
    type: Object as PropType<CommentShow>,
    required: true,
  },
  isTargetComment: {     // 是否为目标评论
    type: Boolean,
    default: false,
  }
})


</script>
<template>

  <div class="cc-container">

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

      </div>

      <!-- 通用评论 -->
      <div v-else class="cc-common">

      </div>
      
    </div>

    <!-- 已删除时的部分 -->
    <div v-else class="cc-delete">
      <div class="cc-delete-box">
        <span>{{ t('comment.deleted_tip') }}</span>
      </div>

    </div>

  </div>
</template>
<style scoped lang="scss">

.cc-container {
  width: 100%;
  box-sizing: border-box;
  padding: 0 16px;
}

.cc-top {
  width: 100%;
  height: 12px;

  .cct-prevIReplied {
    width: 40px;
    height: 8px;
    display: flex;
    position: relative;

    .cct-prevIReplied-line {
      width: 2px;
      height: 100%;
      background-color: var(--line-bottom);
    }
  }
}

.cc-main {
  width: 100%;
  position: relative;
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