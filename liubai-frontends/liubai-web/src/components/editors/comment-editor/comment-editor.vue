<script setup lang="ts">
import { useCommentEditor } from './tools/useCommentEditor';
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import EditorCore from "../editor-core/editor-core.vue"
import { PropType } from 'vue';
import EditingBubbleMenu from "../shared/editing-bubble-menu/editing-bubble-menu.vue";
import EditingCovers from "../shared/editing-covers/editing-covers.vue";
import { useI18n } from 'vue-i18n';
import { useCommentFile } from './tools/useCommentFile';
import type { LocatedA } from "~/types/other/types-custom"

const { t } = useI18n()

const props = defineProps({
  located: {
    type: String as PropType<LocatedA>,
    required: true,
  },
  parentThread: {
    type: String,
    required: true,
  },
  parentComment: String,
  replyToComment: String,
})

const {
  ctx,
  minEditorHeight,
  editorCoreRef,
  editor,
  canSubmit,
  myProfile,
  onEditorFocus,
  onEditorBlur,
  onEditorUpdate,
} = useCommentEditor(props)

const {
  covers,
  onClearCover,
  onCoversSorted,
  onFileChange,
  onImageChange,
} = useCommentFile(props, ctx)

</script>
<template>

  <div v-if="myProfile" class="ce-container">

    <!-- 头像 -->
    <LiuAvatar
      :member-show="myProfile"
      class="ce-avatar"
    ></LiuAvatar>

    <!-- 编辑区域 -->
    <div class="ce-main">

      <!-- 气泡: 放在 editor-core 外层是因为避免被 ce-editor 遮挡 -->
      <EditingBubbleMenu 
        :editor="editor"
      ></EditingBubbleMenu>

      <div class="cem-editor">
        <EditorCore
          ref="editorCoreRef"
          :desc-placeholder="t('comment.placeholder1')"
          :min-height="'' + minEditorHeight + 'px'"
          @focus="onEditorFocus"
          @blur="onEditorBlur"
          @update="onEditorUpdate"
        ></EditorCore>
      </div>

      <!-- 留白 -->
      <div class="cem-bottom-two"></div>

      <EditingCovers 
        :is-in-comment="true"
        :located="located"
        :model-value="covers"
        @update:model-value="onCoversSorted"
        @clear="onClearCover"
      ></EditingCovers>

      <!-- 工具栏 -->
      <div class="cem-toolbar"
        :class="{ 'cem-toolbar_translateY': ctx.isToolbarTranslateY }"
      >
        <div class="cemt-main">

        </div>
        <div class="cemt-footer">

          <div class="cemtf-submit-btn"
            :class="{ 'cemtf-submit_disabled': !canSubmit }"
          >
            <span>{{ t('comment.submit1') }}</span>
          </div>

        </div>
      </div>

    </div>

  </div>

</template>
<style lang="scss" scoped>

.ce-container {
  width: 100%;
  position: relative;
  display: flex;
}

.ce-avatar {
  width: 42px;
  height: 42px;
  margin-inline-end: 12px;
  flex: none;
}

.ce-main {
  flex: 1;
  position: relative;
}

.cem-editor {
  width: 100%;
  min-height: v-bind("minEditorHeight + 'px'");
  position: relative;
  overflow-y: overlay;
  overflow-y: auto;
  transition: .3s;
  padding-block-start: 2px;
}

.cem-bottom-two {
  width: 100%;
  height: 9px;
}

.cem-toolbar {
  width: 100%;
  height: 42px;
  position: relative;
  display: flex;
  align-items: center;
  transition: .15s;
}

.cem-toolbar_translateY {
  pointer-events: none;
  margin-block-start: -53px;
}

.cemt-main {
  flex: 1;
}

.cemt-footer {
  display: flex;
  justify-content: flex-end;
  pointer-events: auto;
}

.cemtf-submit-btn {
  padding: 0 16px;
  border-radius: 20px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  background-color: var(--primary-color);
  color: var(--on-primary);
  font-size: var(--mini-font);
  transition: .15s;
  user-select: none;
  font-weight: 500;
}

@media(hover: hover) {
  .cemtf-submit-btn:hover {
    background-color: var(--primary-hover);
  }
}

.cemtf-submit-btn:active {
  background-color: var(--primary-active);
}

.cemtf-submit_disabled {
  background-color: var(--primary-color);
  opacity: .5;
  cursor: default;
}

@media(hover: hover) {
  .cemtf-submit_disabled:hover {
    background-color: var(--primary-color);
  }
}

.cemtf-submit_disabled:active {
  background-color: var(--primary-color);
}






</style>