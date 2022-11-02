<script lang="ts">
import { defineComponent } from 'vue';
import type { ImageShow } from '../../../types';

export default defineComponent({
  props: {
    covers: {
      type: Array<ImageShow>,
    }
  },
  setup() {
    const imgWidth = 120
    return { imgWidth }
  },
})


</script>
<template>

  <div v-if="covers?.length" class="cc-container">
    <template v-for="(item, index) in covers" :key="item.id">
      <liu-img :src="item.src" :width="imgWidth" :height="imgWidth"
        class="cc-img"
        object-fit="cover"
      ></liu-img>
    </template>
  </div>

</template>
<style scoped lang="scss">

.cc-container {
  display: flex;
  flex-wrap: wrap;
  flex: 1;

  .cc-img {
    width: v-bind("imgWidth + 'px'");
    height: v-bind("imgWidth + 'px'");
    overflow: hidden;
    border-radius: 10px;
    margin-right: 10px;
    margin-bottom: 10px;
  }
}


</style>