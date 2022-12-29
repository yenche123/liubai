<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ThreadShow } from '../../../../types/types-content';
import EditorCore from '../../../editor-core/editor-core.vue';
import { useWhenAndRemind } from './tools/useWhenAndRemind';
import TcAttachments from './tc-attachments/tc-attachments.vue';
import TcActionbar from './tc-actionbar/tc-actionbar.vue';
import TcBottombar from "./tc-bottombar/tc-bottombar.vue";
import TcTags from "./tc-tags/tc-tags.vue";
import TcCovers from "./tc-covers/tc-covers.vue";
import { useThreadCard } from './tools/useThreadCard';
import { useI18n } from 'vue-i18n';
import TcBubbleMenu from './tc-bubble-menu/tc-bubble-menu.vue';
import { useTcOperation } from "./tools/useTcOperation";
import type { ThreadOperation, TlViewType, TlDisplayType } from "../tools/types";

export default defineComponent({
  components: {
    EditorCore,
    TcAttachments,
    TcActionbar,
    TcBottombar,
    TcTags,
    TcCovers,
    TcBubbleMenu,
  },
  props: {
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
  },
  emits: {
    newoperate: (operation: ThreadOperation, position: number, oldThread: ThreadShow) => true
  },
  setup(props) {
    const {
      whenStr,
      remindStr,
    } = useWhenAndRemind(props.threadData)
    const {
      editorCoreRef,
      editor,
      isBriefing,
      onTapBriefing,
      onTapThreadCard,
      onTapContent,
    } = useThreadCard(props)
    const { t } = useI18n()

    const operations = useTcOperation(props)

    return {
      editorCoreRef,
      editor,
      t,
      whenStr,
      remindStr,
      isBriefing,
      onTapBriefing,
      onTapThreadCard,
      onTapContent,
      ...operations,
    }
  }
})

</script>
<template>

  <div class="tc-container">

    <div class="tc-box" @click="onTapThreadCard">

      <!-- 摘要 -->
      <div v-if="threadData.briefing" v-show="isBriefing" 
        class="tc-briefing"
        @click="onTapBriefing"
      >
        <EditorCore
          :edit-mode="false"
          :content="threadData.briefing"
        ></EditorCore>
        <div class="tcb-more">
          <span>{{ t('common.checkMore') }}</span>
        </div>
      </div>

      <!-- 全文的 bubble-menu -->
      <TcBubbleMenu
        v-if="threadData.content && !isBriefing"
        :editor="editor"
      ></TcBubbleMenu>

      <!-- 全文 -->
      <div v-if="threadData.content" v-show="!isBriefing" 
        class="tc-content"
        @click="onTapContent"
      >
        <EditorCore 
          ref="editorCoreRef"
          :edit-mode="false"
          :content="threadData.content"
        ></EditorCore>
      </div>

      <!-- 图片 -->
      <TcCovers :covers="threadData.images"></TcCovers>

      <!-- 什么时候 -->
      <TcAttachments
        :when-str="whenStr"
        :remind-str="remindStr"
        :files="threadData.files"
      ></TcAttachments>

      <!-- 标签: 只有当前工作区与动态所属工作区一致时，才会有标签 -->
      <TcTags
        v-if="threadData.tags?.length"
        :tag-shows="threadData.tags"
      ></TcTags>

      <!-- 操作栏 -->
      <TcActionbar
        v-if="viewType !== 'TRASH'"
        :workspace="threadData.workspace"
        :comment-num="threadData.commentNum"
        :emoji-num="threadData.emojiData.total"
        :my-favorite="threadData.myFavorite"
        :my-emoji="threadData.myEmoji"
        @tapcollect="$emit('newoperate', 'collect', position, threadData)"
        @tapcomment="$emit('newoperate', 'comment', position, threadData)"
        @tapshare="$emit('newoperate', 'share', position, threadData)"
      ></TcActionbar>

      <!-- 底部时间 -->
      <TcBottombar :thread-data="threadData"></TcBottombar>
      
    </div>

  </div>
  
</template>
<style scoped lang="scss">

.tc-container {
  width: 100%;
  border-radius: 20px;
  position: relative;
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow-2);
  transition: border-radius .3s;
  margin-bottom: 16px;

  &:hover {
    border-radius: 10px;
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

      .tcb-more {
        font-size: var(--btn-font);
        line-height: 1.5;
        color: var(--main-note);
        text-align: right;
      }
    }

    .tc-content {
      position: relative;
    }

  }


}


</style>