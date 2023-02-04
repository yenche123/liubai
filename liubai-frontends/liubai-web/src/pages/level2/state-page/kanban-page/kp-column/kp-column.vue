<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SlickList, SlickItem, HandleDirective } from 'vue-slicksort'
import type { ThreadShow } from '~/types/types-content';
import { useKanbanThreads } from "../../tools/useKanbanThreads"
import { useKpColumn } from './tools/useKpColumn';

export default defineComponent({

  components: {
    SlickList,
    SlickItem,
  },

  emits: {
    "update:threads": (val: ThreadShow[]) => true,
  },

  props: {
    threads: {
      type: Array as PropType<ThreadShow[]>,
      default: []
    },
  },
  
  directives: {
    handle: HandleDirective
  },

  setup(props, { emit }) {
    const {
      list
    } = useKanbanThreads(props, emit)
    const {
      columnHeight,
    } = useKpColumn()

    return {
      list,
      columnHeight,
    }
  },

})

</script>
<template>

  <SlickList
    class="kc-kanban-list"
    helper-class="kc-kanban-helper"
    :style="{
      height: columnHeight + 'px'
    }"
    axis="y"
    group="kanban"
    v-model:list="list"
    use-drag-handle
  >

    <SlickItem
      v-for="(thread, j) in list"
      :key="thread._id"
      :index="j"
      class="kc-kanban-item"
    >

      <div class="kcki-inner">

        <div class="kc-text">
          <span v-if="thread.summary">{{ thread.summary }}</span>
          <span v-else>[图片或文件]</span>
        </div>

        <div class="kc-footer">
          <span class="kcf-handle" v-handle>
            <svg-icon name="drag_indicator" class="kcf-handle-svg"
              color="var(--main-code)"
            ></svg-icon>
          </span>
        </div>

      </div>

      

    </SlickItem>

  </SlickList>
  
</template>
<style lang="scss" scoped>

.kc-kanban-list {
  width: 330px;
  position: relative;
}

.kc-kanban-item {
  margin-block-end: 10px;
  width: 96%;
  position: relative;
}

.kcki-inner {
  border-radius: 4px;
  background-color: var(--card-bg);
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
}

.kc-kanban-helper {
  opacity: .7;
}

.kc-kanban-helper .kcki-inner {
  transform: rotate(5deg);
}

.kc-text {
  font-size: var(--btn-font);
  line-height: 1.5;
  color: var(--main-normal);
}

.kc-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.kcf-handle {
  width: 24px;
  height: 24px;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kcf-handle-svg {
  width: 20px;
  height: 20px;
}


</style>
<style lang="scss">





</style>