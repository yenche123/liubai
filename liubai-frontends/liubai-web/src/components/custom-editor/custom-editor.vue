<script setup lang="ts">
/**
 * 本组件两种使用场景:
 * 1. 新的动态 NEW
 * 2. 旧的动态再编辑 EDIT
 * 使用 props.threadId 做区分，该字段有值代表为后者
 */

import EditorCore from "../editor-core/editor-core.vue"
import { useCustomEditor } from "./tools/useCustomEditor";
import cfg from "../../config";
import { useMoreItems } from "./tools/useMoreItems";
import { useCeState } from "./tools/useCeState";
import { ref } from "vue";
import CeFinishArea from "./ce-finish-area/ce-finish-area.vue";
import CeMoreArea from "./ce-more-area/ce-more-area.vue";
import { useCeFile } from "./tools/useCeFile";
import CeCovers from "./ce-covers/ce-covers.vue";
import CeToolbar from "./ce-toolbar/ce-toolbar.vue";
import { initCeState } from "./tools/initCeState";
import { useCeFinish } from "./tools/useCeFinish";
import { useGlobalStateStore } from "../../hooks/stores/useGlobalStateStore";

const props = defineProps({
  lastBar: {
    type: Boolean,
    default: false,
  },
  threadId: String
})

const canSubmitRef = ref(false)
const { maxEditorHeight, editorCoreRef, editor } = useCustomEditor()
const { state } = initCeState(props, editor)
const {
  onImageChange,
  covers,
  onClearCover,
  onCoversSorted,
  onFileChange,
} = useCeFile(state)

const {
  moreRef,
  onTapMore,
  showVirtualBar,
} = useMoreItems(props)

const globalStore = useGlobalStateStore()
const ctx = {
  canSubmitRef,
  editor,
  state,
  globalStore
}
const { toFinish } = useCeFinish(ctx)

const {
  focused,
  onEditorFocus,
  onEditorBlur,
  onEditorUpdate,
  onEditorFinish,
  onWhenChange,
  onRemindMeChange,
  onTitleChange,
  onSyncCloudChange,
  onTapFinish,
} = useCeState(state, canSubmitRef, toFinish)


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

  <CeCovers 
    :model-value="covers"
    @update:model-value="onCoversSorted"
    @clear="onClearCover"
  ></CeCovers>

  <ce-toolbar
    :editor="editor"
    :more="moreRef"
    @imagechange="onImageChange"
    @tapmore="onTapMore"
  ></ce-toolbar>

  <!-- 更多栏 -->
  <ce-more-area :show="moreRef"
    :state="state"
    @whenchange="onWhenChange"
    @remindmechange="onRemindMeChange"
    @titlechange="onTitleChange"
    @synccloudchange="onSyncCloudChange"
    @filechange="onFileChange"
  ></ce-more-area>

  <!-- 虚拟空间 用于避免完成按钮挡到其他地方 -->
  <div class="ce-virtual" :class="{ 'ce-virtual_show': showVirtualBar }"></div>

  <!-- 右小角: 提示字 + 按钮 -->
  <ce-finish-area :can-submit="canSubmitRef"
    :in-code-block="editor?.isActive('codeBlock') ?? false"
    @confirm="onTapFinish"
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