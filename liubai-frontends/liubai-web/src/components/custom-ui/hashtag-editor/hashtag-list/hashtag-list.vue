<script lang="ts">
import { defineComponent, PropType, toRef, watch } from 'vue';
import liuApi from '../../../../utils/liu-api';
import type { TagItem } from "../tools/types"

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
    

    // 处理 selectedIndex 变化时，让被选中的选项进入可视区域
    const selectedIndex = toRef(props, "selectedIndex")
    watch(selectedIndex, (newV) => {
      const el = document.querySelector(".ht-item_selected")
      if(!el) return
      el.scrollIntoView()
    })

    const { isPC } = liuApi.getCharacteristic()

    const onMouseEnter = (index: number) => {
      if(index === selectedIndex.value) return
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
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: max(60vh, 400px);
  overflow-y: auto;

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }

  .ht-item {
    width: calc(100% - 20px);
    padding: 16px 10px 16px 20px;
    box-sizing: border-box;
    border-radius: 10px;
    display: flex;
    align-items: center;
    transition: .15s;
    cursor: pointer;

    .hti-icon {
      width: 32px;
      height: 32px;
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
      flex: 1;
      font-size: var(--desc-font);
      color: var(--main-normal);
      display: flex;
      flex-wrap: wrap;
    }

    .hti-footer {
      margin-inline-start: 6px;
      font-size: var(--desc-font);
      color: var(--main-code);
    }

  }

  .ht-item_selected {
    background-color: var(--bg-color);
  }

}



</style>