<script setup lang="ts">
// 操作栏: 收藏、（点赞）、评论数、分享
// 个人工作区: 收藏、评论数（、分享）
// 协作工作区: 点赞、评论数（、分享）
import type { SpaceType } from "~/types/types-basic"
import type { PropType } from "vue";
import { computed } from 'vue';
import liuApi from '~/utils/liu-api';

const props = defineProps({
  spaceType: {
    type: String as PropType<SpaceType>,
    required: true
  },
  isMine: {
    type: Boolean,
    required: true,
  },
  commentNum: {
    type: Number,
    required: true
  },
  emojiNum: {
    type: Number,
    required: true
  },
  myFavorite: {
    type: Boolean,
    required: true,
  },
  myEmoji: {
    type: String,
    required: true,
  }
})

const emits = defineEmits<{
  (event: "tapcollect"): void
  (event: "tapcomment"): void
  (event: "tapshare"): void
}>()

// decode emoji
const theEmoji = computed(() => {
  if(!props.myEmoji) return ""
  const tmp = liuApi.decode_URI_component(props.myEmoji)
  return tmp
})

// emoji最高 999+
const emojiShow = computed(() => {
  if(props.emojiNum > 999) return "999+"
  return `${props.emojiNum}`
})

// 评论最高 99+
const commentShow = computed(() => {
  if(props.commentNum > 99) return "99+"
  return `${props.commentNum}`
})

const default_color = "var(--main-code)"

const onTapCollect = (e: MouseEvent) => {
  e.stopPropagation()
  emits('tapcollect')
}

const onTapComment = (e: MouseEvent) => {
  e.stopPropagation()
  emits('tapcomment')
}

const onTapShare = (e: MouseEvent) => {
  e.stopPropagation()
  emits('tapshare')
}

</script>
<template>
  <div class="tca-container">

    <!-- 收藏 -->
    <div v-if="spaceType === 'ME' && isMine" class="liu-hover tca-item"
      @click="onTapCollect"
    >
      <div class="tca-icon-box">
        <svg-icon v-show="!myFavorite" name="star" class="tca-icon_star" :color="default_color"></svg-icon>
        <svg-icon v-show="myFavorite" name="collected" class="tca-icon_collected"></svg-icon>
      </div>
    </div>

    <!-- emoji -->
    <div v-else class="liu-hover tca-item">
      <div class="tca-icon-box">
        <span v-if="theEmoji">{{ theEmoji }}</span>
        <svg-icon v-else name="emoji" class="tca-icon_emoji" :color="default_color"></svg-icon>
      </div>
      <div v-if="emojiNum > 0" class="tcb-text tcb-text_adjusted">
        <span>{{ emojiShow }}</span>
      </div>
    </div>

    <!-- 评论 -->
    <div class="liu-hover tca-item"
      @click="onTapComment"
    >
      <div class="tca-icon-box">
        <svg-icon name="comment" class="tca-icon_comment" :color="default_color"></svg-icon>
      </div>
      <div v-if="commentNum > 0" class="tcb-text tcb-text_adjusted">
        <span>{{ commentShow }}</span>
      </div>
    </div>

    <!-- 分享 -->
    <div class="liu-hover tca-item"
      @click="onTapShare"
    >
      <div class="tca-icon-box">
        <svg-icon name="share" class="tca-icon" :color="default_color"></svg-icon>
      </div>
    </div>

  </div>
</template>
<style scoped lang="scss">

.tca-container {
  margin-inline-start: -4px;
  width: 100%;
  position: relative;
  padding-block-start: 10px;
  display: flex;
  align-items: flex-start;

  .tca-item {
    display: flex;
    align-items: center;
    margin-inline-end: 8px;

    .tcb-text {
      font-size: var(--btn-font);
      color: var(--main-code);
      padding-inline-start: 2px;
      padding-inline-end: 8px;
      user-select: none;
    }

    .tcb-text_adjusted {
      padding-top: 4px;
    }

  }

  .tca-icon-box {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--btn-font);
    user-select: none;

    .tca-icon {
      width: 26px;
      height: 26px;
    }

    .tca-icon_star {
      width: 26px;
      height: 26px;
    }

    .tca-icon_collected {
      width: 28px;
      height: 28px;
    }

    .tca-icon_emoji {
      margin-top: 3px;
      width: 24px;
      height: 24px;
    }

    .tca-icon_comment {
      margin-top: 5px;
      width: 24px;
      height: 24px;
    }
  }

  .tca-footer {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

}


</style>