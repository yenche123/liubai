<script setup lang="ts">
// 评论的 “内文 + 图片 + 操作栏”
import type { CommentShow } from '~/types/types-content';
import type { PropType } from 'vue';

const props = defineProps({
  cs: {          // cs 为 commentShow 的简写
    type: Object as PropType<CommentShow>,
    required: true,
  },
})

</script>
<template>

  <!-- 内文 -->
  <div class="cb-content">

  </div>

  <!-- 图片 -->
  <div class="cb-images"></div>

  <!-- 文件 -->
  <div class="cb-files"></div>

  <!-- 工具栏 -->
  <div class="cb-actionbar">

    
  </div>

</template>
<style lang="scss" scoped>


</style>