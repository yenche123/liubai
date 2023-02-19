<script lang="ts">
import { defineComponent, nextTick, PropType, toRef, watch } from 'vue';
import liuApi from '~/utils/liu-api';
import type { TagItem } from "../tools/types"
import { useHashtagList } from "./tools/useHashtagList" 

const default_color = "var(--main-normal)"

export default defineComponent({
  props: {
    list: {
      type: Array as PropType<TagItem[]>,
      required: true
    },
    selectedIndex: {
      type: Number,
      required: true
    },
  },

  emits: {
    mouseenteritem: (index: number) => true,
    tapitem: (index: number) => true,
  },

  setup(props, { emit }) {
    

    useHashtagList(props)
    
    const { isPC } = liuApi.getCharacteristic()

    const onMouseEnter = (index: number) => {
      if(index === props.selectedIndex) return
      emit("mouseenteritem", index)
    }

    const onTapItem = (index: number) => {
      emit("tapitem", index)
    }
    
    return { 
      isPC, 
      default_color, 
      onMouseEnter,
      onTapItem,
    }
  },

})

</script>

<template>

<div class="ht-list">


  <template v-for="(item, index) in list" :key="item.tagId">
    <div class="ht-item"
      :class="{ 'ht-item_selected': index === selectedIndex }"
      @mouseenter="() => onMouseEnter(index)"
      @click="() => onTapItem(index)"
    >

      <div class="hti-icon">

        <span v-if="item.emoji">{{ item.emoji }}</span>
        <svg-icon v-else name="tag" 
          class="hti-svg-icon" 
          :color="default_color"
        ></svg-icon>

      </div>

      <div class="hti-title">
        <span>{{ item.textBlank }}</span>
      </div>

      <div v-if="isPC" class="hti-footer">
        <span>↵</span>
      </div>

    </div>

  </template>

</div>
  
</template>
<style scoped lang="scss">

.ht-list {
  padding: 10px 0;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 40vh;
  overflow-y: auto;
  border-top: 1px solid var(--line-hover);
  transition: .2s;
  scrollbar-color: var(--scrollbar-thumb) transparent;

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }

  .ht-item {
    width: calc(100% - 20px);
    min-height: 60px;
    box-sizing: border-box;
    padding: 10px;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;

    .hti-icon {
      position: relative;
      width: 38px;
      height: 38px;
      margin-inline-end: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--desc-font);

      .hti-svg-icon {
        width: 24px;
        height: 24px;
      }
    }

    .hti-title {
      position: relative;
      flex: 1;
      font-size: var(--desc-font);
      color: var(--main-normal);
      display: flex;
      flex-wrap: wrap;
    }

    .hti-footer {
      position: relative;
      margin-inline-start: 6px;
      font-size: var(--desc-font);
      color: var(--main-note);
    }

  }

  .ht-item_selected {
    position: relative;
    overflow: hidden;
    box-shadow: 1px 2px 3px rgba(0, 0, 0, .03);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--card-bg);
      opacity: .6;
    }
  }

}



</style>