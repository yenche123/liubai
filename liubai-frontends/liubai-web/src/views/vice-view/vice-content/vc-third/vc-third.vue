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
  vcHeight: {        // 窗口高度 - 导航栏高度
    type: Number,
    default: 0,
  },
  viceNaviPx: {      
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

  <!-- 外层壳: 当溢出时，可以滚动 -->
  <div class="vcliu-third">

    <!-- 导航栏占位 -->
    <div class="vcliu-virtual"></div>

    <!-- 内层壳: 水平和垂直居中 -->
    <div class="vct-container">
      <VctTwitter 
        v-if="thirdParty === 'TWITTER'"
        :link="link"
      ></VctTwitter>
    </div>
  </div>

  <!-- 用于显示拖动时覆盖在 iframe 上的透明度白屏 -->
  <div class="vcliu-cover" :class="{ 'vcliu-cover_show': isOutterDraging }"></div>

</template>
<style lang="scss" scoped>

/** 大盒子: 垂直溢出时，可以滚动 */
.vcliu-third {
  width: 100%;
  height: 100%;
  max-height: 100%;
  position: relative;
  overflow-y: auto;
}

.vcliu-virtual {
  width: 100%;
  height: v-bind("viceNaviPx + 'px'");
}

.vct-container {
  width: 90%;
  min-width: 200px;
  max-width: 500px;
  margin: 0 auto;

  min-height: v-bind("vcHeight + 'px'");
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

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