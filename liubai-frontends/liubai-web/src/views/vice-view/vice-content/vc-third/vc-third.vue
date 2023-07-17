<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { VcThirdParty } from "../tools/types"
import VctTwitter from "./vct-twitter/vct-twitter.vue"

const props = defineProps({
  isOutterDraging: {
    type: Boolean,
    default: false
  },
  thirdParty: {
    type: String as PropType<VcThirdParty>,
  },
  link: {
    type: String
  },
  vcHeight: {
    type: Number,
    default: 0,
  },
  maskMarginTop: {
    type: Number,
    default: 0
  }
})

// 微调 8px，因为 8px 的误差仅在 iframe 上出现
const maskMarginTop2 = computed(() => {
  const m = props.maskMarginTop
  if(!m) return m
  return m + 8
})

</script>
<template>

  <VctTwitter 
    v-if="thirdParty === 'TWITTER'"
    :link="link"
    :vc-height="vcHeight"
  ></VctTwitter>
  
  <!-- 用于显示拖动时覆盖在 iframe 上的透明度白屏 -->
  <div class="vcliu-cover" :class="{ 'vcliu-cover_show': isOutterDraging }"></div>

</template>
<style lang="scss" scoped>

.vcliu-cover {
  width: 100%;
  height: v-bind("vcHeight + 'px'");
  margin-top: v-bind("maskMarginTop2 + 'px'");
  background-color: aliceblue;
  opacity: 0;
  visibility: hidden;
  transition: .3s;
  user-select: none;
}

.vcliu-cover_show {
  opacity: .6;
  visibility: visible;
}


</style>