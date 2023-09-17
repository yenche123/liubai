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
import CeFinishArea from "./ce-finish-area/ce-finish-area.vue";
import CeMoreArea from "./ce-more-area/ce-more-area.vue";
import { useCeFile } from "./tools/useCeFile";
import EditingCovers from "../shared/editing-covers/editing-covers.vue";
import CeToolbar from "./ce-toolbar/ce-toolbar.vue";
import CeTags from "./ce-tags/ce-tags.vue";
import { initCeState } from "./tools/initCeState";
import { useCeFinish } from "./tools/useCeFinish";
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import { useCeTag } from "./tools/useCeTag";
import EditingBubbleMenu from "../shared/editing-bubble-menu/editing-bubble-menu.vue";
import { useI18n } from "vue-i18n";
import { type CeEmits, ceProps } from "./tools/atom-ce"

const { t } = useI18n()

const props = defineProps(ceProps)
const emits = defineEmits<CeEmits>()

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
  onNewHashTags,
} = useCeTag(state)


const threadShowStore = useThreadShowStore()
const ctx = {
  editor,
  state,
  threadShowStore,
  emits,
}
const { toFinish } = useCeFinish(ctx)

const {
  titleFocused,
  anyFocused,
  onEditorFocus,
  onEditorBlur,
  onEditorUpdate,
  onEditorFinish,
  onWhenChange,
  onRemindMeChange,
  onTitleChange,
  onSyncCloudChange,
  onTapFinish,
  onTapCloseTitle,
  onTitleBarChange,
  onTitleEnter,
  onTitleEnterAndMeta,
  onTitleEnterAndCtrl,
} = useCeState(state, toFinish, editor)

</script>
<template>

<div class="ce-container"
  :class="{ 'ce-container_focused': anyFocused }"
  @click.stop="() => {}"
>

  <div v-if="state.showTitleBar" class="ce-title-bar">
    <input 
      class="ce-title-input" :value="state.title"
      :placeholder="t('editor.add_title2')"
      @focus="() => titleFocused = true"
      @blur="() => titleFocused = false"
      @input="onTitleBarChange" 
      @keyup.enter.exact="onTitleEnter"
      @keyup.ctrl.enter.exact="onTitleEnterAndCtrl"
      @keyup.meta.enter.exact="onTitleEnterAndMeta"
    />
    <div class="ce-clear-title" @click="onTapCloseTitle">
      <svg-icon name="close-circle" class="ce-clear-svg" 
        color="var(--main-tip)"
      ></svg-icon>
    </div>
  </div>

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
      purpose="thread-edit"
      :hash-trigger="true"
      :min-height="'' + minEditorHeight + 'px'"
      is-in-card
    ></EditorCore>

    <!-- 气泡 -->
    <EditingBubbleMenu 
      :editor="editor"
    ></EditingBubbleMenu>
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
    :tag-shows="tagShows"
    @imagechange="onImageChange"
    @tapmore="onTapMore"
    @addhashtag="onAddHashTag"
    @newhashtags="onNewHashTags"
  ></ce-toolbar>

  <!-- 更多栏 -->
  <ce-more-area 
    :editor="editor"
    :show="moreRef"
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
  <ce-finish-area 
    :can-submit="state.canSubmit"
    :in-code-block="editor?.isActive('codeBlock') ?? false"
    :focused="anyFocused"
    @confirm="onTapFinish"
  ></ce-finish-area>

</div>
  
</template>
<style scoped lang="scss">

.ce-container {
  width: 100%;
  background-color: var(--card-bg);
  box-sizing: border-box;
  padding: 20px 20px 15px;
  border-radius: 20px;
  margin-bottom: 14px;
  box-shadow: var(--card-shadow);
  position: relative;
  transition: box-shadow .3s;

  &.ce-container_focused {
    box-shadow: var(--editor-shadow);
  }
}

.ce-title-bar {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  margin-block-end: 0.3rem;
}

.ce-title-input {
  width: calc(100% - 36px);
  font-size: var(--title-font);
  font-weight: 700;
  color: var(--main-normal);
  line-height: 1.4;
  caret-color: var(--primary-color);

  &::-webkit-input-placeholder {
    color: var(--main-note);
  }

  &::selection {
    background-color: var(--select-bg);
  }
}

.ce-clear-title {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: .15s;

  .ce-clear-svg {
    width: 24px;
    height: 24px;
  }
}

@media(hover: hover) {
  .ce-clear-title:hover {
    opacity: .7;
  }
}

.ce-editor {
  width: 100%;
  max-height: v-bind("maxEditorHeight + 'px'");
  position: relative;
  overflow-y: v-bind("state.overflowType");
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