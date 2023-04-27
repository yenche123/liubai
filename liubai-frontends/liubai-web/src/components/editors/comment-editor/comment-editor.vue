<script setup lang="ts">
import { useCommentEditor } from './tools/useCommentEditor';
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import EditorCore from "../editor-core/editor-core.vue"
import { PropType } from 'vue';

const props = defineProps({
  located: {
    type: String as PropType<"comment_area" | "popup">,
    required: true,
  },
})

const {
  maxEditorHeight,
  minEditorHeight,
  editorCoreRef,
  editor,
  myProfile
} = useCommentEditor(props)

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
          :min-height="'' + minEditorHeight + 'px'"
        ></EditorCore>
      </div>

      <!-- 工具栏 -->
      <div class="cem-toolbar">
        <div class="cemt-main">

        </div>
        <div class="cemt-footer">

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
  margin-inline-end: 16px;
  flex: none;
}

.ce-main {
  flex: 1;
  position: relative;
}



</style>