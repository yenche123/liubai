<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { useEditorCore } from './tools/useEditorCore'
import type { EditorCoreEmits } from "./tools/types"
import { editorCoreProps } from "./tools/types"
import { useEditorLink } from './tools/useEditorLink'
import './virtual-cursor.css'

const props = defineProps(editorCoreProps)
const emit = defineEmits<EditorCoreEmits>()

const {
  editor,
  styles,
  transition,
} = useEditorCore(props, emit)

const {
  ecRef
} = useEditorLink(props)

defineExpose({ editor })

</script>
<template>

<!-- 
  ph-no-capture is for PostHog mask
  see https://posthog.com/docs/session-replay/privacy
-->
<!--
  data-bf-ignore-keypress is for BugFender
  see https://docs.bugfender.com/docs/platforms/web-apps/bugfender-for-javascript-on-browsers/#ignore-keypress-value-for-sensitive-fields
-->
<!--
  data-clarity-mask is for microsoft clarity
  see https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking#using-the-clarity-data-clarity-mask-api
-->

  <editor-content class="editor-core ph-no-capture" 
    :editor="editor" 
    ref="ecRef" 
    data-clarity-mask="true"
    data-bf-ignore-keypress
  />
</template>

<style lang="scss">
.editor-core {

  .ProseMirror {
    padding: 0;
    outline: 0;
    font-size: v-bind("styles.fontSize");
    line-height: v-bind("styles.lineHeight");
    color: var(--main-normal);
    min-height: v-bind("isEdit ? minHeight : 0");
    transition: v-bind("transition");
    caret-color: var(--primary-color);

    h1 {
      font-size: v-bind("styles.h1Size");
      font-weight: 700;
      color: var(--main-normal);
      margin-block-start: 0;
      margin-block-end: 0.3rem;
      line-height: 1.4;
    }

    p {
      margin-block-start: 0;
      margin-block-end: 0;
    }

    p.is-empty:nth-child(2)::before {
      content: attr(data-placeholder);
      float: left;
      color: var(--main-note);
      pointer-events: none;
      height: 0;
    }

    ul, ol {
      padding: 0 0 0 32px;
      margin-block-start: 8px;
      margin-block-end: 8px;
    }

    li {
      line-height: 1.7;
    }

    .liu-tasklist {
      padding: 0 0 0 6px;
      margin-block-start: 8px;
      margin-block-end: 8px;

      .liu-taskitem {
        display: flex;

        >label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
          -webkit-user-select: none;

          >input[type=checkbox] {
            position: relative;
            background-color: var(--primary-color);
            background: var(--primary-color);
            color: var(--primary-color);
            accent-color: var(--primary-color);
          }

        }

        >div {
          flex: 1 1 auto;
        }
      }
    }

    code {
      background-color: var(--on-main-code);
      color: var(--main-code);
      padding: 4px 6px;
      border-radius: 4px;
      font-size: v-bind("styles.inlineCodeSize");
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
    a::selection,
    h1::selection {
      background-color: v-bind("styles.selectBg");
    }

    pre {
      background: var(--code-block-bg);
      color: #eee;
      font-family: 'JetBrainsMono', monospace;
      padding: 2.5rem 1rem 0.75rem;
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
      border-left: 4px solid var(--liu-hr2);
      margin-inline-start: 10px;
      margin-inline-end: 0;
      margin-block-start: 10px;
      margin-block-end: 10px;
      color: var(--liu-quote);
    }

    hr {
      border: none;
      border-top: 2px solid v-bind("styles.hrBg");
      margin: 1.2rem 0;
    }
  }

}
</style>