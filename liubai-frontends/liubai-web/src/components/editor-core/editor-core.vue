<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { useEditorCore } from './tools/useEditorCore'
import { EditorCoreContent } from "../../types/types-editor"
import cfg from "../../config"

const props = defineProps({
  titlePlaceholder: {
    type: String,
    default: "",
  },
  descPlaceholder: {
    type: String,
    default: "",
  }
})

const emits = defineEmits<{
  (event: "update", data: EditorCoreContent): void
  (event: "focus", data: EditorCoreContent): void
  (event: "blur", data: EditorCoreContent): void
  (event: "finish", data: EditorCoreContent): void
}>()

const { editor } = useEditorCore(props, emits)

defineExpose({
  editor
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
  min-height: v-bind("cfg.min_editor_height + 'px'");
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

  p::selection, code::selection {
    background-color: var(--select-bg);
  }

  pre {
    background: #0D0D0D;
    color: #FFF;
    font-family: 'JetBrainsMono', monospace;
    padding: 2rem 1rem 0.75rem;
    border-radius: 0.5rem;
    margin: 0.75rem 0;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: var(--btn-font);
      line-height: 1.6;

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