<script setup lang="ts">
import EditorCore from "../editor-core/editor-core.vue"
import { useCustomEditor } from "./tools/useCustomEditor";
import cfg from "../../config";
import { EditorCoreContent } from "../../types/types-editor";
import { useMoreItems } from "./tools/useMoreItems";

const { maxEditorHeight, editorCoreRef, editor } = useCustomEditor()
const {
  moreRef,
  onTapMore,
} = useMoreItems()

const onEditorUpdate = (data: EditorCoreContent) => {
  console.log("onEditorUpdate.............")
  console.log(data)
  console.log(" ")
}

const onEditorFocus = (data: EditorCoreContent) => {
  console.log("focus 了!!!!!!!!!!!!!!")
}

const onEditorBlur = (data: EditorCoreContent) => {
  console.log("blur 了!!!!!!!!!!!!!!")
} 

</script>
<template>

<div class="ce-container">

  <div class="ce-editor">
    <EditorCore 
      ref="editorCoreRef"
      @update="onEditorUpdate"
      @focus="onEditorFocus"
      @blur="onEditorBlur"
    ></EditorCore>
  </div>

  <!-- 第一排工具栏 -->
  <div class="ce-toolbar">
    <!-- 图片 -->
    <div class="liu-hover cet-item">
      <svg-icon name="editor-image" class="ceti-icon" />
    </div>

    <!-- 粗体 -->
    <div class="liu-hover cet-item"
      :class="{ 'cet-item_selected': editor?.isActive('bold') }"
      @click="editor?.chain().focus().toggleBold().run()"
    >
      <svg-icon name="editor-bold" class="ceti-icon" />
    </div>

    <!-- 斜体 -->
    <div class="liu-hover cet-item"
      :class="{ 'cet-item_selected': editor?.isActive('italic') }"
      @click="editor?.chain().focus().toggleItalic().run()"
    >
      <svg-icon name="editor-italic" class="ceti-icon" />
    </div>

    <!-- 删除线 -->
    <div class="liu-hover cet-item"
      :class="{ 'cet-item_selected': editor?.isActive('strike') }"
      @click="editor?.chain().focus().toggleStrike().run()"
    >
      <svg-icon name="editor-strike" class="ceti-icon" />
    </div>

    <!-- 更多 -->
    <div class="liu-hover cet-item"
      :class="{ 'cet-item_selected': moreRef }"
      @click="onTapMore"
    >
      <svg-icon name="more" class="ceti-icon ceti-more" 
        :class="{ 'ceti-more_open': moreRef }"
      />
    </div>

  </div>

</div>
  
</template>
<style scoped lang="scss">

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

.ce-toolbar {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  position: relative;

  .cet-item {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-inline-end: 8px;
    
    .ceti-icon {
      width: 30px;
      height: 30px;
    }

    .ceti-more {
      transition: .25s;
    }

    .ceti-more_open {
      transform: rotate(90deg);
    }
  }

  .cet-item_selected {
    position: relative;
    overflow: hidden;
    
    &::before {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--primary-color);
      opacity: .12;
    }
  }

}


</style>