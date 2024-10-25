<script setup lang="ts">
import type { PropType } from 'vue';
import liuApi from '~/utils/liu-api';
import type { TagItem } from "../tools/types"
import { useHashtagList } from "./tools/useHashtagList"
import middleBridge from '~/utils/middle-bridge';

const default_color = "var(--main-normal)"

const props = defineProps({
  list: {
    type: Array as PropType<TagItem[]>,
    required: true
  },
  selectedIndex: {
    type: Number,
    required: true
  },
})
const emit = defineEmits<{
  "mouseenteritem": [index: number]
  "tapitem": [index: number]
}>()

const { htListEl } = useHashtagList(props)
const { isPC } = liuApi.getCharacteristic()

const onMouseEnter = (index: number) => {
  if (index === props.selectedIndex) return
  emit("mouseenteritem", index)
}

const onTapItem = (index: number) => {
  emit("tapitem", index)
}

const showScrollbarProperty = middleBridge.canShowScrollbarProperty()

</script>
<template>

  <div class="ht-list" ref="htListEl" :class="{ 'ht-list-scrollbar': showScrollbarProperty }">

    <template v-for="(item, index) in list" :key="item.tagId">
      <div class="liu-no-user-select ht-item" :class="{ 'ht-item_selected': index === selectedIndex }"
        @mouseenter="() => onMouseEnter(index)" @click="() => onTapItem(index)">

        <div class="hti-icon">

          <span v-if="item.emoji">{{ item.emoji }}</span>
          <span v-else-if="item.parentEmoji">{{ item.parentEmoji }}</span>
          <svg-icon v-else name="tag" class="hti-svg-icon" :color="default_color"></svg-icon>

        </div>

        <div class="hti-title">
          <span>{{ item.text }}</span>
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
  max-height: 60vh;
  overflow-y: auto;
  border-top: 1px solid var(--line-hover);
  transition: .2s;

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }

}

.ht-list-scrollbar {
  scrollbar-color: var(--scrollbar-thumb) transparent;
  scrollbar-width: auto;
}


.ht-item {
  width: calc(100% - 20px);
  min-height: 56px;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.hti-icon {
  position: relative;
  width: 38px;
  height: 38px;
  margin-inline-end: 8px;
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
  font-size: var(--btn-font);
  color: var(--main-note);
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

@media screen and (max-width: 480px) {

  .ht-item {
    min-height: 50px;
  }

  .hti-icon {
    width: 32px;
    height: 32px;

    .hti-svg-icon {
      width: 20px;
      height: 20px;
    }
  }

  .hti-title {
    font-size: var(--btn-font);
  }

  .hti-footer {
    font-size: var(--mini-font);
  }

}
</style>