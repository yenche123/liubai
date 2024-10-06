<script setup lang="ts">
import { browsingCoversProps } from "./tools/types"
import { useBrowsingCovers } from './tools/useBrowsingCovers';

const props = defineProps(browsingCoversProps)
const { 
  viewTranNames, 
  onTapImage,
  imgWidth,
  paddingBlockStart,
} = useBrowsingCovers(props)

</script>
<template>

  <div class="liu-no-user-select bc-container"
    v-if="covers?.length"
  >

    <!-- 一张图片时 -->
    <div v-if="imgLayout?.one" class="bc-box"
      :style="{ 
        'max-width': imgLayout.one.maxWidthPx + 'px',
      }"
    >
      <div class="bc-virtual" 
        :style="{
          'padding-bottom': imgLayout.one.heightStr,
        }"
      ></div>
      <div class="bc-one-box">
        <liu-img :src="covers[0].src" 
          :draggable="false" 
          :blurhash="covers[0].blurhash"
          border-radius="12px"
          class="bc-one-img"
          object-fit="cover" 
          :view-transition-name="viewTranNames[0]"
          @click.stop="onTapImage($event, 0, '12px')"
          loading="lazy"
        ></liu-img>
      </div>
    </div>

    <!-- 两张图片时 -->
    <div v-else-if="imgLayout?.two" class="bc-box"
      :style="{ 
        'max-width': imgLayout.two.maxWidthPx + 'px',
      }"
    >
      <div class="bc-virtual" 
        :style="{
          'padding-bottom': imgLayout.two.heightStr,
        }"
      ></div>
      <div class="bc-two-box"
        :class="{ 
          'bc-two-box_column': imgLayout.two.isColumn 
        }"
      >
        <div v-for="(item, index) in covers" :key="item.id"
          class="bctb-img-box"
          :class="{
            'bctb-img-box_column': imgLayout.two.isColumn
          }"
        >
          <liu-img :src="item.src" 
            :draggable="false" 
            :blurhash="item.blurhash"
            class="bc-two-img"
            object-fit="cover" 
            :view-transition-name="viewTranNames[index]"
            @click.stop="onTapImage($event, index, '12px')"
            loading="lazy"
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
            :view-transition-name="viewTranNames[index]"
            @click.stop="onTapImage($event, index, '10px')"
            loading="lazy"
          ></liu-img>
        </div>
      </template>
    </div>

  </div>

</template>
<style lang="scss" scoped>

.bc-container {
  width: 100%;
  position: relative;
  padding-block-start: v-bind("paddingBlockStart + 'px'");
}

.bc-box {
  overflow: hidden;
  position: relative;
} 

.bc-virtual {
  width: 100%;
}

.bc-one-box {
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
  
  .bc-one-img {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
}

.bc-two-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  border-radius: 12px;
  overflow: hidden;
}

.bc-two-box_column {
  flex-direction: column;
}

.bctb-img-box {
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

  .bc-two-img {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
}

.bctb-img-box:first-child {
  margin-inline-end: 3px;
}

.bctb-img-box_column {
  width: 100%;

  /** 随便一个正整数的值都可以，
  * 因为当盒子为 flex-direction: column 时，高度会被 flex: 1 决定 
  */
  height: 10px;
}

.bctb-img-box_column:first-child {
  margin-inline-end: 0;
  margin-block-end: 3px;
}


.cc-container {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
}

.cec-item {
  width: v-bind("imgWidth + 'px'");
  height: v-bind("imgWidth + 'px'");
  overflow: hidden;
  border-radius: 10px;
  margin-inline-end: 10px;
  margin-block-end: 10px;
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

@media screen and (max-width: 450px) {
  .cec-item {
    margin-inline-end: 7px;
    margin-block-end: 7px;
  }
}

</style>