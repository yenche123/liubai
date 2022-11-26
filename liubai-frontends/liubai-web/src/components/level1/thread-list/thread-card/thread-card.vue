<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ThreadShow } from '../../../../types/types-content';
import EditorCore from '../../../editor-core/editor-core.vue';
import { useWhenAndRemind } from './tools/useWhenAndRemind';
import TcWhenRemind from './tc-when-remind/tc-when-remind.vue';
import TcActionbar from './tc-actionbar/tc-actionbar.vue';
import TcBottombar from "./tc-bottombar/tc-bottombar.vue";
import TcTags from "./tc-tags/tc-tags.vue";
import { useThreadCard } from './tools/useThreadCard';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  components: {
    EditorCore,
    TcWhenRemind,
    TcActionbar,
    TcBottombar,
    TcTags,
  },
  props: {
    threadData: {
      type: Object as PropType<ThreadShow>,
      required: true
    },
    displayType: {
      type: String as PropType<"list" | "detail">,
      default: "list",
    }
  },
  setup(props) {
    const {
      whenStr,
      remindStr,
    } = useWhenAndRemind(props.threadData)
    const {
      isBriefing,
      onTapBriefing
    } = useThreadCard(props)
    const { t } = useI18n()

    return {
      t,
      whenStr,
      remindStr,
      isBriefing,
      onTapBriefing,
    }
  }
})

</script>
<template>

  <div class="tc-container">

    <div class="tc-box">

      <h1 v-if="threadData.title" class="tc-title">
        <span>{{ threadData.title }}</span>
      </h1>

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

      <!-- 全文 -->
      <div v-if="threadData.content" v-show="!isBriefing" class="tc-content">
        <EditorCore 
          :edit-mode="false"
          :content="threadData.content"
        ></EditorCore>
      </div>

      <!-- 什么时候、 -->
      <TcWhenRemind
        :when-str="whenStr"
        :remind-str="remindStr"
      ></TcWhenRemind>

      <!-- 标签 -->
      <TcTags
        v-if="threadData.tags?.length"
        :tag-shows="threadData.tags"
      ></TcTags>

      <!-- 操作栏 -->
      <TcActionbar
        :workspace="threadData.workspace"
        :comment-num="threadData.commentNum"
        :emoji-num="threadData.emojiData.total"
        :my-favorite="threadData.myFavorite"
        :my-emoji="threadData.myEmoji"
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
  overflow: hidden;
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

    .tc-title {
      font-size: var(--title-font);
      font-weight: 700;
      color: var(--main-normal);
      margin-block-start: 0.5rem;
      margin-block-end: 0.5rem;

      span::selection {
        background-color: var(--select-bg);
      }
    }

    .tc-briefing {
      position: relative;
      cursor: pointer;

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