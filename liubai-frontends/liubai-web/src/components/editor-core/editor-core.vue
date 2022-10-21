<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { useEditorCore } from './tools/useEditorCore';
import cfg from "../../config"

const { editor } = useEditorCore()

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

  p {
    margin-block-start: 0;
    margin-block-end: 0;
  }

  ul,
  ol {
    padding: 0 10px;
  }

  code {
    background-color: rgba(#616161, 0.1);
    color: #616161;
    padding: 4px 6px;
    border-radius: 4px;
    font-size: var(--inline-code-font);
  }

  pre {
    background: #0D0D0D;
    color: #FFF;
    font-family: 'JetBrainsMono', monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
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