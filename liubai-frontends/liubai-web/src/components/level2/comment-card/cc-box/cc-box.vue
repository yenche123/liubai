<script setup lang="ts">
// 评论的 “内文 + 图片”
import type { CommentShow } from '~/types/types-content';
import { defineAsyncComponent, type PropType } from 'vue';
import EditorCore from '~/components/editors/editor-core/editor-core.vue';
import BrowsingCovers from "~/components/browsing/browsing-covers/browsing-covers.vue";
import PrettyFile from '~/components/browsing/pretty-file/pretty-file.vue';
import { useCcBox } from './tools/useCcBox';
import type { CommentCardLocation } from "../tools/types"

const BwBubbleMenu = defineAsyncComponent(() => {
  return import("~/components/browsing/bw-bubble-menu/bw-bubble-menu.vue")
})

const props = defineProps({
  cs: {          // cs 为 commentShow 的简写
    type: Object as PropType<CommentShow>,
    required: true,
  },
  location: {
    type: String as PropType<CommentCardLocation>,
    required: true,
  },
})

const { 
  editor,
  editorCoreRef,
  afterTapFile,
} = useCcBox(props)

</script>
<template>

  <!-- 内文 -->
  <div class="cb-content" v-if="cs.content">
    <EditorCore
      ref="editorCoreRef"
      :is-edit="false"
      :content="cs.content"
      :is-in-card="location === 'popup'"
      purpose="comment-browse"
    ></EditorCore>

    <!-- 评论的 bubble-menu -->
    <BwBubbleMenu
      v-if="cs.content"
      :editor="editor"
    ></BwBubbleMenu>
  </div>

  <!-- 图片 -->
  <BrowsingCovers
    :covers="cs.images"
    purpose="comment"
  ></BrowsingCovers>

  <!-- 文件 -->
  <PrettyFile
    v-if="cs.files?.length"
    :file="cs.files[0]"
    @aftertapfile="afterTapFile"
  ></PrettyFile>

</template>
<style lang="scss" scoped>

.cb-content {
  width: 100%;
  position: relative;
}


</style>