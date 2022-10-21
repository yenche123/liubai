<script setup lang="ts">
import EditorCore from "../editor-core/editor-core.vue"
import { useCustomEditor } from "./tools/useCustomEditor";
import cfg from "../../config"

const { maxEditorHeight } = useCustomEditor()

</script>
<template>

<div class="ce-container">

  <div class="ce-editor">
    <EditorCore></EditorCore>
  </div>

</div>
  
</template>
<style scoped>

.ce-container {
  width: 100%;
  background-color: var(--card-bg);
  box-sizing: border-box;
  padding: 20px 20px;
  border-radius: 20px;
  margin-bottom: 20px;
  box-shadow: var(--editor-shadow);
  position: relative;
  overflow: hidden;
}

.ce-editor {
  width: 100%;
  min-height: v-bind("cfg.min_editor_height + 'px'");
  max-height: v-bind("maxEditorHeight + 'px'");
  position: relative;
  overflow-y: overlay;
  overflow-y: auto;
}


</style>