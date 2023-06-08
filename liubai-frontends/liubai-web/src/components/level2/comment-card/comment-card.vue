<script setup lang="ts">
import { PropType } from 'vue';
import { CommentShow } from '~/types/types-content';


const props = defineProps({
  commentShow: {
    type: Object as PropType<CommentShow>,
    required: true,
  },
})



</script>
<template>

  <!-- 被删除的情况 -->


  <!-- 正常显示的情况 -->
  


</template>
<style scoped lang="scss">


</style>