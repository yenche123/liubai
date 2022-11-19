<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ThreadShow } from '../../../../types/types-content';
import EditorCore from '../../../editor-core/editor-core.vue';
import { useWhenAndRemind } from './tools/useWhenAndRemind';
import TcWhenRemind from './tc-when-remind/tc-when-remind.vue';
import TcActionbar from './tc-actionbar/tc-actionbar.vue';

export default defineComponent({
  components: {
    EditorCore,
    TcWhenRemind,
    TcActionbar,
  },
  props: {
    threadData: {
      type: Object as PropType<ThreadShow>,
      required: true
    },
    displayType: {
      type: String as PropType<"list" | "detail">
    }
  },
  setup(props) {
    const {
      whenStr,
      remindStr,
    } = useWhenAndRemind(props.threadData)


    return {
      whenStr,
      remindStr
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

      <div class="tc-content">
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

      <!-- 操作栏 -->
      <TcActionbar
        :workspace="threadData.workspace"
        :comment-num="threadData.commentNum"
        :emoji-num="threadData.emojiData.total"
        :my-favorite="threadData.myFavorite"
        :my-emoji="threadData.myEmoji"
      ></TcActionbar>
      
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


    .tc-content {
      position: relative;
    }

  }


}


</style>