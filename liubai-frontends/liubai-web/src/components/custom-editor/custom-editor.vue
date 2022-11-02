<script setup lang="ts">
import EditorCore from "../editor-core/editor-core.vue"
import { useCustomEditor } from "./tools/useCustomEditor";
import cfg from "../../config";
import { TipTapEditor } from "../../types/types-editor";
import { useMoreItems } from "./tools/useMoreItems";
import { useCeState } from "./tools/useCeState";
import type { ShallowRef } from "vue";
import CeFinishArea from "./ce-finish-area.vue";
import CeMoreArea from "./ce-more-area/ce-more-area.vue";
import { useCeImage } from "./tools/useCeImage";
import liuUtil from "../../utils/liu-util";
import CeCovers from "./ce-covers/ce-covers.vue"

const props = defineProps({
  lastBar: {
    type: Boolean,
    default: false,
  }
})

const { maxEditorHeight, editorCoreRef, editor } = useCustomEditor()
const {
  moreRef,
  onTapMore,
  canSubmitRef,
  onEditorUpdate,
  showVirtualBar,
} = useMoreItems(props)

const {
  focused,
  onEditorFocus,
  onEditorBlur,
  onEditorFinish,
  onWhenChange,
} = useCeState(editor as ShallowRef<TipTapEditor>)

const {
  selectImagesEl,
  onImageChange,
  covers,
  onClearCover,
} = useCeImage()


const icon_color = "var(--main-normal)"

</script>
<template>

<div class="ce-container"
  :class="{ 'ce-container_focused': focused }"
>

  <div class="ce-editor">
    <EditorCore 
      ref="editorCoreRef"
      @update="onEditorUpdate"
      @focus="onEditorFocus"
      @blur="onEditorBlur"
      @finish="onEditorFinish"
    ></EditorCore>
  </div>

  <CeCovers v-model="covers"
    @clear="onClearCover"
  ></CeCovers>

  <!-- 第一排工具栏 -->
  <div class="ce-toolbar">
    <!-- 图片 -->
    <div class="liu-hover cet-item">
      <input ref="selectImagesEl" 
        type="file" 
        :accept="liuUtil.getAcceptImgTypes()" 
        class="ceti-input" 
        @change="onImageChange"
        multiple
      />
      <svg-icon name="editor-image" class="ceti-icon" :color="icon_color" />
    </div>

    <!-- 粗体 -->
    <div class="liu-hover cet-item"
      :class="{ 'cet-item_selected': editor?.isActive('bold') }"
      @click="editor?.chain().focus().toggleBold().run()"
    >
      <svg-icon name="editor-bold" class="ceti-icon" :color="icon_color" />
    </div>

    <!-- 斜体 -->
    <div class="liu-hover cet-item"
      :class="{ 'cet-item_selected': editor?.isActive('italic') }"
      @click="editor?.chain().focus().toggleItalic().run()"
    >
      <svg-icon name="editor-italic" class="ceti-icon" :color="icon_color" />
    </div>

    <!-- 删除线 -->
    <div class="liu-hover cet-item"
      :class="{ 'cet-item_selected': editor?.isActive('strike') }"
      @click="editor?.chain().focus().toggleStrike().run()"
    >
      <svg-icon name="editor-strike" class="ceti-icon" :color="icon_color" />
    </div>

    <!-- 更多 -->
    <div class="liu-hover cet-item"
      :class="{ 'cet-item_selected': moreRef }"
      @click="onTapMore"
    >
      <svg-icon name="more" class="ceti-icon ceti-more" 
        :class="{ 'ceti-more_open': moreRef }"
        :color="icon_color"
      />
    </div>

  </div>

  <!-- 更多栏 -->
  <ce-more-area :show="moreRef"
    
  ></ce-more-area>

  <!-- 虚拟空间 用于避免完成按钮挡到其他地方 -->
  <div class="ce-virtual" :class="{ 'ce-virtual_show': showVirtualBar }"></div>

  <!-- 右小角: 提示字 + 按钮 -->
  <ce-finish-area :can-submit="canSubmitRef"
    :in-code-block="editor?.isActive('codeBlock') ?? false"
  ></ce-finish-area>

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
  box-shadow: var(--card-shadow);
  position: relative;
  overflow: hidden;
  transition: box-shadow .3s;

  &.ce-container_focused {
    box-shadow: var(--editor-shadow);
  }
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
    position: relative;

    .ceti-input {
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      position: absolute;
      opacity: 0;
      cursor: pointer;
    }
    
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

  @media screen and (max-width: 380px)  {
    .cet-item {
      width: 40px;
      height: 40px;
      margin-inline-end: 4px;

      .ceti-icon {
        width: 28px;
        height: 28px;
      }
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

.ce-virtual {
  width: 100%;
  transition: .2s;
  height: 55px;
  max-height: 0;
}

.ce-virtual_show {
  max-height: 55px;
}


</style>