<script setup lang="ts">
// 评论区，只 loadByComment
// 场景: 已知某个 targetComment，加载出它的上下文
//   向上加载: find_parent
//   向下加载: find_children
//   当向上加载到尽头时，加载 thread
import type { PropType } from 'vue';
import type { WhatDetail } from '~/types/other/types-custom';
import type { CommentTargetEmit } from "./tools/types"

const props = defineProps({
  location: {
    type: String as PropType<WhatDetail>,
    required: true
  },
  targetId: {
    type: String,
    required: true,
  }
})

const emit = defineEmits<CommentTargetEmit>()


</script>
<template>


</template>
<style lang="scss" scoped></style>