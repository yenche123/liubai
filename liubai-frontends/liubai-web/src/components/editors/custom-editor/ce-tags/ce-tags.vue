<script setup lang="ts">
import type { PropType } from 'vue';
import type { TagShow } from "~/types/types-content"

defineProps({
  tagShows: {
    type: Array as PropType<TagShow[]>,
    default: []
  },
})

const emit = defineEmits<{
  "cleartag": [index: number]
}>()

const onTapClear = (index: number) => {
  emit("cleartag", index)
}

</script>
<template>
  <div class="ce-tags">

    <template v-for="(item, index) in tagShows" :key="item.tagId">

      <div class="ce-tag-item">
        <span v-if="item.emoji" class="ce-tag-emoji">{{ item.emoji }}</span>
        <span v-else-if="item.parentEmoji" class="ce-tag-emoji">{{ item.parentEmoji }}</span>
        <span>{{ item.text }}</span>
        <div class="ce-tag-delete" @click.stop="() => onTapClear(index)">
          <div class="liu-flexible-dot_bg">
            <div class="liu-flexible-dot_circle"></div>
          </div>
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
    padding: 3px 2px 3px 16px;
    font-size: var(--btn-font);
    color: var(--liu-quote);
    background-color: var(--tag-bg);
    border-radius: 24px;
    margin-inline-end: 10px;
    margin-block-end: 10px;
    user-select: none;
    display: flex;
    align-items: center;
    white-space: pre-wrap;

    .ce-tag-emoji {
      margin-inline-end: 6px;
    }
  }
}

.ce-tag-delete {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-inline-start: 2px;
  cursor: pointer;
  position: relative;

  .ce-tag-close {
    width: 20px;
    height: 20px;
    position: relative;
  }

}

@media(hover: hover) {
  .ce-tag-delete:hover {
    .liu-flexible-dot_circle {
      width: 48px;
      height: 48px;
      opacity: .09;
    }
  }
}

</style>