<script setup lang="ts">
import { computed, ref } from 'vue';
import valTool from '../../../utils/basic/val-tool';

defineProps({
  src: {
    type: String,
    required: true,
  },
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
})

const show = ref(false)
const bgOpacity = computed(() => {
  if(show.value) return 0
  return 1
})

const onImgLoaded = async () => {
  show.value = true
}

</script>
<template>

  <div class="custom-img-box">
    <img class="custom-img" 
      :class="{ 'custom-img_loaded': show }"
      :width="width ? width : undefined"
      :height="height ? height: undefined"
      :src="src" 
      :loading="loading"
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
  transition: .15s;
  opacity: v-bind("bgOpacity");
}

.custom-img {
  position: relative;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: .15s;
  object-fit: v-bind("objectFit ? objectFit : 'fill'");
}

.custom-img_loaded {
  opacity: 1;
}

</style>
