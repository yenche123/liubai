<script lang="ts">
import { defineComponent } from 'vue';
import type { ImageShow } from '../../../../../types';
import cui from '../../../../custom-ui';


export default defineComponent({
  props: {
    covers: {
      type: Array<ImageShow>,
    }
  },
  setup(props) {
    const imgWidth = 140

    const onTapImage = (index: number) => {
      const c = props.covers
      if(!c || !c[index]) return
      cui.previewImage({
        imgs: c,
        index
      })
    }

    return {
      imgWidth,
      onTapImage,
    }
  }
})

</script>
<template>

  <div class="cc-container"
    v-if="covers?.length"
  >

    <template v-for="(item, index) in covers">
      <div class="cec-item">

        <liu-img :src="item.src" 
          :width="imgWidth" 
          :height="imgWidth" 
          :draggable="false" 
          class="cc-img"
          object-fit="cover" 
          @click="onTapImage(index)"
        ></liu-img>

      </div>

    </template>

  </div>

</template>
<style lang="scss" scoped>



.cc-container {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  user-select: none;
  padding-block-start: 10px;

  .cec-item {
    width: v-bind("imgWidth + 'px'");
    height: v-bind("imgWidth + 'px'");
    overflow: hidden;
    border-radius: 10px;
    margin-right: 10px;
    margin-bottom: 10px;
    position: relative;
    cursor: pointer;
    transition: .15s;

    &:hover {
      opacity: .66;
    }

    .cc-img {
      width: v-bind("imgWidth + 'px'");
      height: v-bind("imgWidth + 'px'");
    }
  }



}

</style>