<script setup lang="ts">
// 当用户鼠标滑过 当前 comment-card 时才显示
import { type PropType } from 'vue';
import type { CommentCardLocation } from "../tools/types"

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String as PropType<CommentCardLocation>,
    required: true,
  }
})

</script>
<template>

  <!-- absolute 布局 -->
  <div class="cc-actionbar"
    :class="{ 'cc-actionbar_show': show }"
  >




  </div>


</template>
<style lang="scss" scoped>

.cc-actionbar {
  position: absolute;
  top: -10px;
  right: 0;
  display: flex;
  opacity: 0;
  visibility: hidden;
  transition: .15s;
}

.cc-actionbar_show {
  opacity: 1;
  visibility: visible;
}



</style>