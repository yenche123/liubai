
<script lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { useEditorCore } from './tools/useEditorCore'
import type { EditorCoreContent, TipTapJSONContent } from "../../types/types-editor"
import cfg from "../../config"
import { defineComponent, PropType } from 'vue'
import type { HashTagEditorRes } from "../../types/other/types-hashtag"

export default defineComponent({
  components: {
    EditorContent,
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
    minHeight: {
      type: String,
      default: `${cfg.min_editor_height}px`
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
    const { editor } = useEditorCore(props, emit)

    return {
      editor, 
      cfg,
    }
  },
})

</script>

<template>

  <editor-content :editor="editor" />
  
</template>

<style lang="scss">

.ProseMirror {
  padding: 3px;
  outline: 0;
  font-size: var(--desc-font);
  line-height: 2;
  color: var(--main-normal);
  min-height: v-bind("editMode ? minHeight : 0");
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