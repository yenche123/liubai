<script setup lang="ts">
import { computed, ref } from 'vue';
import { BlurHashCanvas } from "another-vue3-blurhash"
import valTool from '~/utils/basic/val-tool';
import liuUtil from '~/utils/liu-util';

const TRANSITION_MS = 300

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
    type: String,
    default: "fill"
  },
  loading: {
    type: String,
    default: "auto",    // 使用 lazy 表示，lazy-loading
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
  }
})

const canvasWH = computed(() => {
  const w = props.width
  const h = props.height
  if(!w || !h) return null
  const widthHeight = liuUtil.constraintWidthHeight(w, h, 128, 128)
  return widthHeight
})


const show = ref(false)
const closeCanvas = ref(false)
const bgOpacity = computed(() => {
  if(show.value) return 0
  return 1
})

const onImgLoaded = async () => {
  if(show.value) return
  show.value = true

  if(closeCanvas.value) return
  if(!props.blurhash || !canvasWH.value) return

  await valTool.waitMilli(TRANSITION_MS)
  closeCanvas.value = true
}

</script>
<template>

  <div class="custom-img-box">

    <div
      v-if="blurhash && canvasWH && !closeCanvas"
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
      :class="{ 'custom-img_loaded': show }"
      :width="width ? width : undefined"
      :height="height ? height: undefined"
      :src="src" 
      :loading="loading"
      :draggable="draggable"
      @load="onImgLoaded" 
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
  transition: v-bind("TRANSITION_MS + 'ms'");
  object-fit: v-bind("objectFit ? objectFit : 'fill'");
  user-select: v-bind("userSelect ? 'auto' : 'none'");
  border-radius: v-bind("borderRadius ? borderRadius : '0'");
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
