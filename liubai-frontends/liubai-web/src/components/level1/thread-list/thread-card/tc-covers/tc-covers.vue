<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ImageShow } from '~/types';
import type { ImgLayout } from "~/types/other/types-custom"
import cui from '../../../../custom-ui';


export default defineComponent({
  props: {
    covers: {
      type: Array<ImageShow>,
    },
    imgLayout: {
      type: Object as PropType<ImgLayout>,
    }
  },
  setup(props) {
    const imgWidth = 140

    const onTapImage = (e: MouseEvent, index: number) => {
      const c = props.covers
      if(!c || !c[index]) return
      cui.previewImage({
        imgs: c,
        index
      })
      e.stopPropagation()
    }

    return {
      imgWidth,
      onTapImage,
    }
  }
})

</script>
<template>

  <div class="tcc-container"
    v-if="covers?.length"
  >

    <!-- 一张图片时 -->
    <div v-if="imgLayout?.one" class="tcc-box"
      :style="{ 
        'max-width': imgLayout.one.maxWidthPx + 'px',
      }"
    >
      <div class="tcc-virtual" 
        :style="{
          'padding-bottom': imgLayout.one.heightStr,
        }"
      ></div>
      <div class="tcc-one-box">
        <liu-img :src="covers[0].src" 
          :draggable="false" 
          :blurhash="covers[0].blurhash"
          border-radius="10px"
          class="tcc-one-img"
          object-fit="cover" 
          @click="onTapImage($event, 0)"
        ></liu-img>
      </div>
    </div>

    <div v-else class="cc-container">
      <template v-for="(item, index) in covers">
        <div class="cec-item">
          <liu-img :src="item.src" 
            :width="imgWidth" 
            :height="imgWidth" 
            :draggable="false" 
            :blurhash="item.blurhash"
            border-radius="10px"
            class="cc-img"
            object-fit="cover" 
            @click="onTapImage($event, index)"
          ></liu-img>
        </div>
      </template>
    </div>

  </div>

</template>
<style lang="scss" scoped>

.tcc-container {
  width: 100%;
  position: relative;
  user-select: none;
  padding-block-start: 10px;
}

.tcc-box {
  overflow: hidden;
  position: relative;
} 

.tcc-virtual {
  width: 100%;
}

.tcc-one-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  .tcc-one-img {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
}


.cc-container {
  display: flex;
  flex-wrap: wrap;
  flex: 1;

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

    &:active {
      opacity: .66;
    }

    .cc-img {
      width: v-bind("imgWidth + 'px'");
      height: v-bind("imgWidth + 'px'");
      cursor: pointer;
    }
  }

  @media(hover: hover) {
    .cec-item:hover {
      opacity: .66;
    }
  }

}

</style>