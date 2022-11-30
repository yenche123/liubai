
<script lang="ts">
import { EditorContent, BubbleMenu } from '@tiptap/vue-3'
import { useEditorCore } from './tools/useEditorCore'
import type { EditorCoreContent, TipTapJSONContent } from "../../types/types-editor"
import cfg from "../../config"
import { defineComponent, PropType } from 'vue'
import type { HashTagEditorRes } from "../../types/other/types-hashtag"
import { useBubbleMenu } from './tools/useBubbleMenu'
import { useI18n } from 'vue-i18n'

const bubbleColor = "var(--bubble-menu-color)"

export default defineComponent({
  components: {
    EditorContent,
    BubbleMenu,
  },
  props: {
    titlePlaceholder: {
      type: String,
      default: "",
    },
    descPlaceholder: {
      type: String,
      default: "",
    },
    editMode: {         // 是否为编辑模式
      type: Boolean,
      default: true
    },
    content: {
      type: Object as PropType<TipTapJSONContent>
    },
    hashTrigger: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    update: (payload: EditorCoreContent) => true,
    focus: (payload: EditorCoreContent) => true,
    blur: (payload: EditorCoreContent) => true,
    finish: (payload: EditorCoreContent) => true,
    addhashtag: (payload: HashTagEditorRes) => true
  },
  expose: ['editor'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { editor } = useEditorCore(props, emit)
    const { 
      shouldShow, 
      tippyOptions,
      onTapCopy,
      onTapSearchIn,
      onTapSearchOut,
    } = useBubbleMenu({ editMode: props.editMode, editor })

    return { 
      t,
      editor, 
      cfg,
      shouldShow,
      tippyOptions,
      bubbleColor,
      onTapCopy,
      onTapSearchIn,
      onTapSearchOut,
    }
  },
})

</script>

<template>

  <bubble-menu
    v-if="editor"
    :editor="editor"
    :should-show="shouldShow"
    :updateDelay="250"
    :tippy-options="tippyOptions"
  >
    
    <!-- 编辑时: 粗体、斜体、删除线 -->
    <div v-if="editMode" class="ec-bubble-menu">
      <!-- 粗体 -->
      <div class="ec-bubble-box"
        :class="{ 'ec-bubble-box_selected': editor?.isActive('bold') }"
        @click="editor?.chain().focus().toggleBold().run()"
      >
        <svg-icon name="editor-bold" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('editor.bold') }}</span>
      </div>

      <!-- 斜体 -->
      <div class="ec-bubble-box"
        :class="{ 'ec-bubble-box_selected': editor?.isActive('italic') }"
        @click="editor?.chain().focus().toggleItalic().run()"
      >
        <svg-icon name="editor-italic" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('editor.italic') }}</span>
      </div>

      <!-- 删除线 -->
      <div class="ec-bubble-box"
        :class="{ 'ec-bubble-box_selected': editor?.isActive('strike') }"
        @click="editor?.chain().focus().toggleStrike().run()"
      >
        <svg-icon name="editor-strike" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('editor.strike') }}</span>
      </div>
      
    </div>

    <!-- 浏览时: 复制、内部搜索、外部搜索 -->
    <div v-else class="ec-bubble-menu">
      <!-- 复制 -->
      <div class="ec-bb-two"
        @click="onTapCopy"
      >
        <svg-icon name="copy" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('card_bubble.copy') }}</span>
      </div>

      <!-- 站内搜索 -->
      <div class="ec-bb-two"
        @click="onTapSearchIn"
      >
        <svg-icon name="search" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('card_bubble.search_in') }}</span>
      </div>

      <!-- 站外搜索 -->
      <div class="ec-bb-two"
        @click="onTapSearchOut"
      >
        <svg-icon name="google" :color="bubbleColor" class="ec-bubble-icon ec-bubble-outside"></svg-icon>
        <span>{{ t('card_bubble.search_out') }}</span>
      </div>
      
    </div>


  </bubble-menu>

  <editor-content :editor="editor" />
  
</template>

<style scoped>

.ec-bubble-menu {
  padding: 0 10px;
  border-radius: 10px;
  display: flex;
  background-color: var(--bubble-menu-bg);
  margin: 10px;
  box-shadow: var(--bubble-menu-shadow);
}

.ec-bubble-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  font-size: var(--mini-font);
  color: var(--bubble-menu-color);
  transition: .2s;
  opacity: .6;
  cursor: pointer;
  user-select: none;
}

.ec-bubble-box:hover {
  opacity: .86;
}

.ec-bubble-box_selected {
  opacity: 1;
}

.ec-bb-two {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  font-size: var(--mini-font);
  color: var(--bubble-menu-color);
  transition: .15s;
  opacity: .96;
  cursor: pointer;
  user-select: none;
}

.ec-bb-two:hover {
  opacity: .7;
}

.ec-bubble-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}

.ec-bubble-outside {
  width: 22px;
  height: 22px;
  margin-bottom: 6px;
}



</style>


<style lang="scss">

.ProseMirror {
  padding: 3px;
  outline: 0;
  font-size: var(--desc-font);
  line-height: 2;
  color: var(--main-normal);
  min-height: v-bind("editMode ? cfg.min_editor_height + 'px' : 0");
  transition: .3s;

  p {
    margin-block-start: 0;
    margin-block-end: 0;
  }

  p.is-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: var(--main-note);
    pointer-events: none;
    height: 0;
  }

  ul, ol {
    padding: 0 0 0 24px;
    margin-block-start: 8px;
    margin-block-end: 8px;
  }

  .liu-tasklist {
    padding: 0 0 0 6px;
    margin-block-start: 8px;
    margin-block-end: 8px;

    .liu-taskitem {
      display: flex;

      > label {
        flex: 0 0 auto;
        margin-right: 0.5rem;
        user-select: none;

        > input[type=checkbox] {
          position: relative;
          background-color: var(--primary-color);
          background: var(--primary-color);
          color: var(--primary-color);
        }

      }

      > div {
        flex: 1 1 auto;
      }
    }
  }

  code {
    background-color: var(--on-main-code);
    color: var(--main-code);
    padding: 4px 6px;
    border-radius: 4px;
    font-size: var(--inline-code-font);
  }

  em {
    margin-inline-end: 1px;
  }

  a {
    color: var(--primary-color);
  }

  a:hover {
    text-decoration: underline;
  }

  p::selection, 
  code::selection, 
  em::selection, 
  strong::selection, 
  br::selection, 
  s::selection, 
  a::selection {
    background-color: var(--select-bg);
  }

  pre {
    background: #121212;
    color: #FFF;
    font-family: 'JetBrainsMono', monospace;
    padding: v-bind("editMode ? '2.5rem 1rem 0.75rem' : '1.5rem 1rem 0.75rem'");
    border-radius: 0.5rem;
    margin: 0.75rem 0;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: var(--btn-font);
      line-height: 1.6;

      // div {
      //   max-width: 100%;
      //   white-space: pre-wrap;
      //   word-wrap: break-word;
      //   overflow-wrap: break-word;
      // }

      div::selection, span::selection {
        background-color: var(--select-code);
      }
    }

    .hljs-comment,
    .hljs-quote {
      color: #616161;
    }

    .hljs-variable,
    .hljs-template-variable,
    .hljs-attribute,
    .hljs-tag,
    .hljs-name,
    .hljs-regexp,
    .hljs-link,
    .hljs-name,
    .hljs-selector-id,
    .hljs-selector-class {
      color: #F98181;
    }

    .hljs-number,
    .hljs-meta,
    .hljs-built_in,
    .hljs-builtin-name,
    .hljs-literal,
    .hljs-type,
    .hljs-params {
      color: #FBBC88;
    }

    .hljs-string,
    .hljs-symbol,
    .hljs-bullet {
      color: #B9F18D;
    }

    .hljs-title,
    .hljs-section {
      color: #FAF594;
    }

    .hljs-keyword,
    .hljs-selector-tag {
      color: #70CFF8;
    }

    .hljs-emphasis {
      font-style: italic;
    }

    .hljs-strong {
      font-weight: 700;
    }
  }

  img {
    max-width: 100%;
    height: auto;
  }

  blockquote {
    padding-left: 1rem;
    border-left: 4px solid var(--liu-hr);
    margin-inline-start: 10px;
    margin-inline-end: 0;
    margin-block-start: 10px;
    margin-block-end: 10px;
    color: var(--liu-quote);
  }

  hr {
    border: none;
    border-top: 2px solid var(--liu-hr);
    margin: 1.2rem 0;
  }
}

</style>