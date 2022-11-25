<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { TagShow } from "../../../types/types-content"

export default defineComponent({
  props: {
    tagShows: {
      type: Array as PropType<TagShow[]>,
      default: []
    },
  },
  emits: {
    cleartag: (index: number) => true,
  },
  setup(props, { emit }) {

    const onTapClear = (index: number) => {
      emit("cleartag", index)
    }

    return {
      onTapClear
    }
  },
})

</script>
<template>

  <div class="ce-tags">

    <template v-for="(item, index) in tagShows" :key="item.tagId">

      <div class="ce-tag-item">
        <span v-if="item.emoji" class="ce-tag-emoji">{{ item.emoji }} </span>
        <span>{{ item.text }}</span>
        <div class="ce-tag-delete" @click="() => onTapClear(index)">
          <svg-icon name="close" class="ce-tag-close" color="var(--main-tip)"></svg-icon>
        </div>

      </div>
    
    </template>

  </div>

</template>
<style scoped lang="scss">

.ce-tags {
  display: flex;
  flex-wrap: wrap;
  width: 100%;


  .ce-tag-item {
    padding: 6px 8px 6px 14px;
    font-size: var(--btn-font);
    color: var(--liu-quote);
    background-color: var(--tag-bg);
    border-radius: 10px;
    margin-inline-end: 10px;
    margin-block-end: 10px;
    user-select: none;
    display: flex;
    align-items: center;
    white-space: pre-wrap;
    
    .ce-tag-emoji {
      margin-inline-end: 6px;
    }

    .ce-tag-delete {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-inline-start: 4px;
      cursor: pointer;

      .ce-tag-close {
        width: 20px;
        height: 20px;
      }

    }


  }


}

</style>