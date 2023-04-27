<script setup lang="ts">
/**
 * 本组件两种使用场景:
 * 1. 新的动态 NEW
 * 2. 旧的动态再编辑 EDIT
 * 使用 props.threadId 做区分，该字段有值代表为后者
 */

import EditorCore from "../editor-core/editor-core.vue"
import { useCustomEditor } from "./tools/useCustomEditor";
import { useMoreItems } from "./tools/useMoreItems";
import { useCeState } from "./tools/useCeState";
import { ref } from "vue";
import CeFinishArea from "./ce-finish-area/ce-finish-area.vue";
import CeMoreArea from "./ce-more-area/ce-more-area.vue";
import { useCeFile } from "./tools/useCeFile";
import EditingCovers from "../common/editing-covers/editing-covers.vue";
import CeToolbar from "./ce-toolbar/ce-toolbar.vue";
import CeTags from "./ce-tags/ce-tags.vue";
import { initCeState } from "./tools/initCeState";
import { useCeFinish } from "./tools/useCeFinish";
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import { useCeTag } from "./tools/useCeTag";
import EditingBubbleMenu from "../common/editing-bubble-menu/editing-bubble-menu.vue";

const props = defineProps({
  lastBar: {
    type: Boolean,
    default: false,
  },
  threadId: String
})

const emits = defineEmits<{
  (event: "nodata", threadId: string): void
  (event: "hasdata", threadId: string): void
  (event: "updated", threadId: string): void
}>()

const canSubmitRef = ref(false)
const { 
  maxEditorHeight, 
  minEditorHeight, 
  editorCoreRef, 
  editor,
  onEditorScrolling,
  showMask,
} = useCustomEditor()
const { state } = initCeState(props, emits, editor)

const {
  moreRef,
  onTapMore,
  showVirtualBar,
} = useMoreItems(props)

const {
  onImageChange,
  covers,
  onClearCover,
  onCoversSorted,
  onFileChange,
} = useCeFile(state, moreRef)
const {
  tagShows,
  onTapClearTag,
  onAddHashTag,
} = useCeTag(state)


const threadShowStore = useThreadShowStore()
const ctx = {
  canSubmitRef,
  editor,
  state,
  threadShowStore,
  emits,
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

const onTapCeContainer = (e: MouseEvent) => {}

</script>
<template>

<div class="ce-container"
  :class="{ 'ce-container_focused': focused }"
  @click.stop="onTapCeContainer"
>

  <!-- 气泡: 放在 editor-core 外层是因为避免被 ce-editor 遮挡 -->
  <EditingBubbleMenu 
    :editor="editor"
  ></EditingBubbleMenu>

  <div class="ce-editor"
    @scroll="onEditorScrolling"
  >
    <EditorCore 
      ref="editorCoreRef"
      @update="onEditorUpdate"
      @focus="onEditorFocus"
      @blur="onEditorBlur"
      @finish="onEditorFinish"
      @addhashtag="onAddHashTag"
      :hash-trigger="true"
      :min-height="'' + minEditorHeight + 'px'"
    ></EditorCore>
  </div>

  <!-- 隐入隐出渐变分隔条 -->
  <div class="ce-editor-bottom"></div>

  <!-- 留白 -->
  <div class="ce-editor-bottom-two"></div>

  <EditingCovers 
    :model-value="covers"
    @update:model-value="onCoversSorted"
    @clear="onClearCover"
  ></EditingCovers>

  <CeTags
    :tag-shows="tagShows"
    @cleartag="onTapClearTag"
  ></CeTags>

  <ce-toolbar
    :editor="editor"
    :more="moreRef"
    @imagechange="onImageChange"
    @tapmore="onTapMore"
    @addhashtag="onAddHashTag"
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
  margin-bottom: 14px;
  box-shadow: var(--card-shadow);
  position: relative;
  transition: box-shadow .3s;

  &.ce-container_focused {
    box-shadow: var(--editor-shadow);
  }
}


.ce-editor {
  width: 100%;
  min-height: v-bind("minEditorHeight + 'px'");
  max-height: v-bind("maxEditorHeight + 'px'");
  position: relative;
  overflow-y: overlay;
  overflow-y: auto;
  transition: .3s;
}

.ce-editor-bottom {
  width: 100%;
  height: 20px;
  margin-top: -20px;
  transition: .6s;
  background: var(--gradient-two);
  opacity: v-bind("showMask ? 1 : 0");
  position: relative;
  pointer-events: none;
}

.ce-editor-bottom-two {
  width: 100%;
  height: 15px;
}


.ce-virtual {
  width: 100%;
  transition: .2s;
  height: 55px;
  max-height: 0px;
}

.ce-virtual_show {
  max-height: 55px;
}


</style>