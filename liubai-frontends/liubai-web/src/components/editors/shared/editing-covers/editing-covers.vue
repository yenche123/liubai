<script setup lang="ts">
import type { ImageShow } from '~/types';
import liuApi from "~/utils/liu-api"
import { useEditingCovers } from "./tools/useEditingCovers"
import { SlickList, SlickItem, HandleDirective } from 'vue-slicksort'
import { ceCoversProps } from "./tools/types"

const props = defineProps(ceCoversProps)
const emit = defineEmits<{
  'update:modelValue': [covers: ImageShow[]]
  'clear': [index: number]
}>()
    
const cha = liuApi.getCharacteristic()
const {
  imgWidth,
  axis,
  sortList,
  viewTranNames,
  onDragStart,
  onDragEnd,
  onTapImage,
} = useEditingCovers(props)

const onListUpdate = (newV: ImageShow[]) => {
  emit("update:modelValue", newV)
}

const onTapClear = (e: MouseEvent, index: number) => {
  emit("clear", index)
}

const vHandle = HandleDirective

</script>
<template>

  <SlickList v-if="sortList.length" 
    :axis="axis"
    v-model:list="sortList"
    use-drag-handle
    @sort-start="onDragStart"
    @sort-end="onDragEnd"
    @sort-cancel="onDragEnd"
    @update:list="onListUpdate"
    class="cc-container"
    helper-class="cec-item_helper"
    :hideSortableGhost="true"
  >
    <SlickItem v-for="(item, index) in sortList" :key="item.id" :index="index"
      class="cec-item"
    >

      <liu-img :src="item.src" 
        :width="imgWidth" 
        :height="imgWidth"
        :draggable="false"
        :blurhash="item.blurhash"
        border-radius="10px"
        :style="{
          'width': imgWidth + 'px',
          'height': imgWidth + 'px',
        }"
        :view-transition-name="viewTranNames[index]"
        object-fit="cover"
        @click="onTapImage(index)"
      ></liu-img>

      <!-- 右上角的删除按钮 -->
      <div class="cec-delete"
        @click.stop="onTapClear($event, index)"
      >
        <svg-icon name="close" 
          class="cec-icon"
          color="#e0e0e0"
        ></svg-icon>
      </div>

      <!-- 右下角的拖动按钮 -->
      <span class="cec-drag"
        v-if="sortList.length > 1"
        :class="{ 'cec-drag_mobile': cha.isMobile }"
        v-handle
      >
        <svg-icon name="drag_indicator" 
          class="cec-drag-icon"
          color="#f1f1f1"
        ></svg-icon>
      </span>
    </SlickItem> 
  </SlickList>

</template>
<style lang="scss" scoped>

.cc-container {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  user-select: none;
}

.cec-item {
  width: v-bind("imgWidth + 'px'");
  height: v-bind("imgWidth + 'px'");
  overflow: hidden;
  border-radius: 10px;
  margin-inline-end: 10px;
  margin-block-end: 10px;
  position: relative;

  .cec-delete {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 30px;
    height: 30px;
    cursor: pointer;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, .66);
    transition: .15s;
    transform-origin: top right;

    /** 扩大删除按钮的点击范围 */
    &::before {
      position: absolute;
      content: "";
      top: -4px;
      right: -4px;
      bottom: 0;
      left: 0;
    }
  }

  @media(hover: hover) {
    .cec-delete:hover {
      border-radius: 5px;
    }
  }

  .cec-drag {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 38px;
    height: 38px;
    cursor: move;
    border-top-left-radius: 4px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: .15s;
    opacity: 0;
  }

  .cec-drag_mobile {
    opacity: 1;
  }

  .cec-drag::before {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
    border-radius: 20px 0 10px 0;
    overflow: hidden;
  }

  .cec-icon {
    width: 20px;
    height: 20px;
  }

  .cec-drag-icon {
    width: 28px;
    height: 28px;
    position: relative;
    filter: drop-shadow(0 1px 0px rgba(0, 0, 0, .5));
  }
}

.cec-item:hover .cec-drag {
  opacity: 1;
}

.cec-item_helper {
  opacity: .6;
}

/** 下面的 z-index 不能设置在 .cec-item_helper 的原因:  
*      .cec-item_helper 在鼠标松开后，会被 vue-slicksort 移除
*      这时从释放鼠标时所处的位置位移到列表中的新位置时，这段过度动画是没有 z-index 的
*      就会导致过度动画执行时被其他元素挡住的情况，故需要把 z-index 设置在 body 的直接
*      子节点 .cec-item 里以解决这个问题。
*/
body > .cec-item {
  z-index: 6500;
}

</style>