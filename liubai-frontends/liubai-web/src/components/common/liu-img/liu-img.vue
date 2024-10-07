<script setup lang="ts">
import { BlurHashCanvas } from "another-vue3-blurhash"
import type { PropType } from 'vue';
import type { 
  LiuObjectFit,
  LiuImgEmits,
} from "./tools/types"
import { useLiuImg } from './tools/useLiuImg';

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  blurhash: String,
  referrerpolicy: {
    type: String,
    default: "no-referrer",
  },
  width: Number,
  height: Number,
  objectFit: {
    type: String as PropType<LiuObjectFit>,
    default: "fill"
  },
  loading: {
    type: String as PropType<"eager" | "lazy">,
    default: "eager",    // 使用 lazy 表示，lazy-loading
  },
  bgColor: String,
  borderRadius: String,
  draggable: {
    type: Boolean,
    default: true
  },
  userSelect: {
    type: Boolean,
    default: false,
  },
  disableTransition: {
    type: Boolean,
    default: false,     // 是否关闭渐变加载
  },
  viewTransitionName: {
    type: String,
  }
})
const emits = defineEmits<LiuImgEmits>()

const {
  TRANSITION_MS,
  imgEl,
  imgStyles,
  canvasWH,
  show,
  closeCanvas,
  bgOpacity,
  onImgLoaded,
} = useLiuImg(props, emits)

</script>
<template>

  <div class="custom-img-box">

    <div
      v-if="blurhash && !disableTransition && canvasWH && !closeCanvas"
      class="liu-blurhash"
      :class="{ 'liu-blurhash_hidden': show }"
    >
      <BlurHashCanvas
        :width="canvasWH.width"
        :height="canvasWH.height"
        :hash="blurhash"
        class="liu-blurhash-canvas"
      ></BlurHashCanvas>
    </div>


    <img class="custom-img" 
      ref="imgEl"
      :class="{ 'custom-img_loaded': disableTransition || show }"
      :style="imgStyles"
      :width="width ? width : undefined"
      :height="height ? height: undefined"
      :src="src" 
      :loading="loading"
      :draggable="draggable"
      @load="onImgLoaded" 
      referrerpolicy="no-referrer"
    >
    
  </div>

</template>
<style scoped>

.custom-img-box {
  position: relative;
  display: flex;
}

.custom-img-box::before {
  position: absolute;
  content: "";
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: v-bind("bgColor ? bgColor : 'var(--liu-image)'");
  transition: v-bind("TRANSITION_MS + 'ms'");
  opacity: v-bind("bgOpacity");
}

.custom-img {
  position: relative;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.custom-img_loaded {
  opacity: 1;
}

.liu-blurhash {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: v-bind("TRANSITION_MS + 'ms'");
  overflow: hidden;
  border-radius: v-bind("borderRadius ? borderRadius : '0'");
}

.liu-blurhash_hidden {
  opacity: 0;
}

.liu-blurhash-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

</style>
