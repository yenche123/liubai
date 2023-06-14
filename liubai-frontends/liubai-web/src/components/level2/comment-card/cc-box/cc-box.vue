<script setup lang="ts">
// 评论的 “内文 + 图片 + 操作栏”
import type { CommentShow } from '~/types/types-content';
import type { PropType } from 'vue';
import EditorCore from '~/components/editors/editor-core/editor-core.vue';
import BrowsingCovers from "~/components/browsing/browsing-covers/browsing-covers.vue";
import PrettyFile from '~/components/browsing/pretty-file/pretty-file.vue';

const props = defineProps({
  cs: {          // cs 为 commentShow 的简写
    type: Object as PropType<CommentShow>,
    required: true,
  },
})

</script>
<template>

  <!-- 内文 -->
  <div class="cb-content" v-if="cs.content">
    <EditorCore
      :is-edit="false"
      :content="cs.content"
      purpose="comment-browse"
    ></EditorCore>
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
  ></PrettyFile>

  <!-- 工具栏 -->
  <div class="cb-actionbar">

    
  </div>

</template>
<style lang="scss" scoped>

.cb-content {
  width: 100%;
  position: relative;
}


</style>