<script setup lang="ts">
import { useCommentEditor } from './tools/useCommentEditor';
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import EditorCore from "../editor-core/editor-core.vue"
import { PropType } from 'vue';
import EditingBubbleMenu from "../shared/editing-bubble-menu/editing-bubble-menu.vue";
import EditingCovers from "../shared/editing-covers/editing-covers.vue";
import FileBar from './file-bar/file-bar.vue';
import ToolBar from './tool-bar/tool-bar.vue';
import { useI18n } from 'vue-i18n';
import { useCommentFile } from './tools/useCommentFile';
import type { LocatedA } from "~/types/other/types-custom";

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
  onViewFile,
  onClearFile,
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

      <div class="cem-editor">
        <EditorCore
          ref="editorCoreRef"
          purpose="comment-edit"
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

      <!-- 文件 -->
      <FileBar
        :file-show-name="ctx.fileShowName"
        @tapviewfile="onViewFile"
        @tapclear="onClearFile"
      ></FileBar>

      <!-- 工具栏 -->
      <ToolBar
        :is-toolbar-translate-y="ctx.isToolbarTranslateY"
        :can-submit="ctx.canSubmit"
        @imagechange="onImageChange"
        @filechange="onFileChange"
      ></ToolBar>

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
  width: 38px;
  height: 38px;
  margin-inline-end: 12px;
  flex: none;
}

.ce-main {
  flex: 1;
  position: relative;
  max-width: calc(100% - 54px);
}

.cem-editor {
  width: 100%;
  min-height: v-bind("minEditorHeight + 'px'");
  position: relative;
  overflow-y: overlay;
  overflow-y: auto;
  transition: .3s;
  padding-block-start: 3.7px;
}

.cem-bottom-two {
  width: 100%;
  height: 6px;
}


</style>