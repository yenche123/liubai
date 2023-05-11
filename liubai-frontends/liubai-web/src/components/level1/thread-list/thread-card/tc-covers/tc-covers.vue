<script lang="ts">
import { defineComponent } from 'vue';
import { tcCoversProps } from "./tools/types"
import { useTcCovers } from './tools/useTcCovers';

export default defineComponent({
  props: tcCoversProps,
  setup(props) {
    const imgWidth = 140
    const { viewTranNames, onTapImage } = useTcCovers(props)

    return {
      imgWidth,
      viewTranNames,
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
          border-radius="12px"
          class="tcc-one-img"
          object-fit="cover" 
          :viewTransitionName="viewTranNames[0]"
          @click.stop="onTapImage($event, 0, '12px')"
        ></liu-img>
      </div>
    </div>

    <!-- 两张图片时 -->
    <div v-else-if="imgLayout?.two" class="tcc-box"
      :style="{ 
        'max-width': imgLayout.two.maxWidthPx + 'px',
      }"
    >
      <div class="tcc-virtual" 
        :style="{
          'padding-bottom': imgLayout.two.heightStr,
        }"
      ></div>
      <div class="tcc-two-box"
        :class="{ 
          'tcc-two-box_column': imgLayout.two.isColumn 
        }"
      >
        <div v-for="(item, index) in covers" :key="item.id"
          class="tcctb-img-box"
          :class="{
            'tcctb-img-box_column': imgLayout.two.isColumn
          }"
        >
          <liu-img :src="item.src" 
            :draggable="false" 
            :blurhash="item.blurhash"
            class="tcc-two-img"
            object-fit="cover" 
            :viewTransitionName="viewTranNames[index]"
            @click.stop="onTapImage($event, index, '12px')"
          ></liu-img>
        </div>
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
            :viewTransitionName="viewTranNames[index]"
            @click.stop="onTapImage($event, index, '10px')"
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
  transition: .15s;

  @media(hover: hover) {
    &:hover {
      opacity: .8;
    }
  }

  &:active {
    opacity: .72;
  }
  
  .tcc-one-img {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
}

.tcc-two-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  border-radius: 12px;
  overflow: hidden;
}

.tcc-two-box_column {
  flex-direction: column;
}

.tcctb-img-box {
  flex: 1;
  width: 10px;   /** 随便一个正整数的值都可以，因为宽度会被 flex: 1 决定 */
  height: 100%;
  position: relative;
  flex-basis: 0;
  transition: .15s;

  @media(hover: hover) {
    &:hover {
      opacity: .8;
    }
  }

  &:active {
    opacity: .72;
  }

  .tcc-two-img {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
}

.tcctb-img-box:first-child {
  margin-inline-end: 3px;
}

.tcctb-img-box_column {
  width: 100%;

  /** 随便一个正整数的值都可以，
  * 因为当盒子为 flex-direction: column 时，高度会被 flex: 1 决定 
  */
  height: 10px;
}

.tcctb-img-box_column:first-child {
  margin-inline-end: 0;
  margin-block-end: 3px;
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

    @media(hover: hover) {
      &:hover {
        opacity: .8;
      }
    }

    &:active {
      opacity: .72;
    }

    .cc-img {
      width: v-bind("imgWidth + 'px'");
      height: v-bind("imgWidth + 'px'");
      cursor: pointer;
    }
  }

}

</style>