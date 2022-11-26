<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { TagShow } from "../../../../../types/types-content"

export default defineComponent({
  props: {
    tagShows: {
      type: Array as PropType<TagShow[]>,
      default: []
    },
  },
  setup(props, { emit }) {

    const onTapTag = () => {
      console.log("onTapTag.........")
    }

    return {
      onTapTag
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
    padding: 6px 12px 6px 12px;
    font-size: var(--btn-font);
    color: var(--liu-quote);
    background-color: var(--tag-bg);
    border-radius: 10px;
    margin-inline-end: 10px;
    margin-block-start: 10px;
    user-select: none;
    display: flex;
    align-items: center;
    white-space: pre-wrap;
    cursor: pointer;
    
    .ce-tag-emoji {
      margin-inline-end: 6px;
    }


  }


}

</style>