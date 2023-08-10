<script setup lang="ts">
import type { PropType } from 'vue';
import type { ThreadShow } from '~/types/types-content';
import EditorCore from '~/components/editors/editor-core/editor-core.vue';
import TcAttachments from './tc-attachments/tc-attachments.vue';
import TcActionbar from './tc-actionbar/tc-actionbar.vue';
import TcBottombar from "./tc-bottombar/tc-bottombar.vue";
import TcTopbar from './tc-topbar/tc-topbar.vue';
import TcTags from "./tc-tags/tc-tags.vue";
import BrowsingCovers from "~/components/browsing/browsing-covers/browsing-covers.vue";
import { useThreadCard } from './tools/useThreadCard';
import { useI18n } from 'vue-i18n';
import BwBubbleMenu from '~/components/browsing/bw-bubble-menu/bw-bubble-menu.vue';
import { useTcOperation } from "./tools/useTcOperation";
import type { TlViewType, TlDisplayType } from "../tools/types";
import type { TcEmits } from "./tools/types"
import type { ThreadCardShowType } from "~/types/types-view"
import { useTcAnimate } from './tools/useTcAnimate';
import type { TrueOrFalse } from '~/types/types-basic';

const props = defineProps({
  threadData: {
    type: Object as PropType<ThreadShow>,
    required: true
  },
  displayType: {
    type: String as PropType<TlDisplayType>,
    default: "list",
  },
  viewType: {
    type: String as PropType<TlViewType>,
    default: "",
  },
  position: {
    type: Number,
    required: true
  },
  showType: {     // 这个是用于 移除列表时的显示和移除
    type: String as PropType<ThreadCardShowType>,
    default: "normal"
  },
  showTxt: {      // 这个是用于 视图切换
    type: String as PropType<TrueOrFalse>
  }
})
const emit = defineEmits<TcEmits>()
const {
  editorCoreRef,
  editor,
  isBriefing,
  onTapBriefing,
  onTapThreadCard,
  showMore,
  onMouseEnter,
  onMouseLeave,
} = useThreadCard(props)
const { t } = useI18n()
const {
  onTapComment,
  onTapShare,
  receiveBottomOperation,
} = useTcOperation(props, emit)
const {
  cardEl,
  cardHeightPx,
} = useTcAnimate(props)

const radius = `8px`
const hoverRadius = props.displayType === "list" ? "24px" : "8px"

</script>
<template>

<div class="tc-big-container"
  :class="{ 'tc-big-container_hiding': showType === 'hiding' }"
  ref="cardEl"
>

  <div class="tc-container"
    :class="{ 'tc-container_hiding': showType === 'hiding' }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >

    <div class="tc-box" @click.stop="onTapThreadCard">

      <TcTopbar
        :thread-data="threadData"
        @newoperate="receiveBottomOperation"
      ></TcTopbar>

      <!-- 摘要 -->
      <div v-if="threadData.briefing" v-show="isBriefing" 
        class="tc-briefing"
        @click.stop="onTapBriefing"
      >
        <EditorCore
          :is-edit="false"
          :content="threadData.briefing"
          is-in-card
        ></EditorCore>
        <div class="tcb-mask"></div>
        <div class="tcb-more">
          <span>{{ t('common.checkMore') }}</span>
        </div>
      </div>

      <!-- 全文的 bubble-menu -->
      <BwBubbleMenu
        v-if="threadData.content && !isBriefing"
        :editor="editor"
      ></BwBubbleMenu>

      <!-- 全文 -->
      <div v-if="threadData.content" v-show="!isBriefing" 
        class="tc-content"
      >
        <EditorCore 
          ref="editorCoreRef"
          :is-edit="false"
          :content="threadData.content"
          is-in-card
        ></EditorCore>
      </div>

      <!-- 图片 -->
      <BrowsingCovers 
        :covers="threadData.images"
        :img-layout="threadData.imgLayout"
        purpose="thread"
      ></BrowsingCovers>

      <!-- 什么时候、提醒我、文件、地点、创建人、指派给 -->
      <TcAttachments
        :thread="threadData"
      ></TcAttachments>

      <!-- 标签: 只有当前工作区与动态所属工作区一致时，才会有标签 -->
      <TcTags
        v-if="threadData.tags?.length"
        :tag-shows="threadData.tags"
      ></TcTags>

      <!-- 操作栏 -->
      <TcActionbar
        v-if="threadData.oState === 'OK'"
        :space-type="threadData.spaceType"
        :is-mine="threadData.isMine"
        :comment-num="threadData.commentNum"
        :emoji-num="threadData.emojiData.total"
        :my-favorite="threadData.myFavorite"
        :my-emoji="threadData.myEmoji"
        :show-more="showMore"
        @tapcollect="$emit('newoperate', 'collect', position, threadData)"
        @tapcomment="onTapComment"
        @tapshare="onTapShare"
        @newoperate="receiveBottomOperation"
      ></TcActionbar>

      <!-- 底部更多、发表或编辑时间 -->
      <TcBottombar :thread-data="threadData"
        :view-type="viewType"
        @newoperate="receiveBottomOperation"
      ></TcBottombar>
      
    </div>

  </div>

</div>
</template>
<style scoped lang="scss">

.tc-big-container {
  width: 100%;
  position: relative;
  will-change: margin-block-start;
  transition: .3s;
  padding-block-end: 10px;
}

.tc-big-container_hiding {
  margin-block-start: -10px;
  overflow: hidden;
}

.tc-container {
  width: 100%;
  border-radius: v-bind("radius");
  position: relative;
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow-2);
  will-change: border-radius, box-shadow, opacity, margin-block-start;
  transition: border-radius .2s, box-shadow .3s, opacity .3s, margin-block-start .3s;

  &.tc-container_hiding {
    opacity: 0;
    margin-block-start: v-bind("(-cardHeightPx) + 'px'");
  }

  @media(hover: hover) {
    &:hover {
      border-radius: v-bind("hoverRadius");
      box-shadow: var(--card-shadow2-hover);
    }
  }

  &:active {
    border-radius: v-bind("hoverRadius");
    box-shadow: var(--card-shadow2-hover);
  }

  .tc-box {
    width: 100%;
    box-sizing: border-box;
    padding: 20px;
    position: relative;

    .tc-briefing {
      position: relative;
      cursor: pointer;
      user-select: none;
      position: relative;

      .tcb-mask {
        width: 100%;
        height: 50px;
        background: var(--gradient-two);
        margin-block-start: -52px;
        position: relative;
      }

      .tcb-more {
        font-size: var(--mini-font);
        line-height: 1.5;
        color: var(--main-note);
        text-align: right;
      }
    }

    .tc-content {
      position: relative;
      cursor: auto;
    }

  }


}


</style>