<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SlickList, SlickItem, HandleDirective } from 'vue-slicksort'
import type { ThreadShow } from '~/types/types-content';
import { useKanbanThreads } from "../../tools/useKanbanThreads"
import { useKpColumn } from './tools/useKpColumn';
import { useI18n } from "vue-i18n"
import type { 
  ColumnInsertData,
} from "../../tools/types"

export default defineComponent({

  components: {
    SlickList,
    SlickItem,
  },

  emits: {
    "update:threads": (val: ThreadShow[]) => true,
    "scrolling": (val: number) => true,
    "sort-insert": (val: ColumnInsertData) => true,
    "threadsupdated": (val: ThreadShow[]) => true,
    "tapitem": (contentId: string) => true,
    "tapadd": () => true,
  },

  props: {
    stateId: {
      type: String,
      required: true,
    },
    threads: {
      type: Array as PropType<ThreadShow[]>,
      default: []
    },
  },
  
  directives: {
    handle: HandleDirective
  },

  setup(props, { emit }) {
    const { t } = useI18n()
    const {
      list,
      showAddBox,
    } = useKanbanThreads(props, emit)
    const {
      columnHeight,
    } = useKpColumn(props, emit)

    return {
      t,
      list,
      showAddBox,
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
    :distance="1"
    :id="'kanban-' + stateId"
    @sort-insert="$emit('sort-insert', $event)"
    @update:list="$emit('threadsupdated', $event)"
  >

    <!-- 为空时的添加按钮 -->
    <div v-if="list.length < 1" class="kc-add-box"
      :class="{ 'kc-add-box_show': showAddBox }"
      @click="$emit('tapadd')"
    >
      <svg-icon name="add" class="kc-add-svg"
        color="var(--main-note)"
      ></svg-icon>
      <span>{{ t('common.add') }}</span>
    </div>

    <SlickItem
      v-for="(thread, j) in list"
      :key="thread._id"
      :index="j"
      class="kc-kanban-item"
    >

      <div class="kcki-inner"
        @click="$emit('tapitem', thread._id)"
      >

        <div class="kc-title" v-if="thread.title">
          <span>{{ thread.title }}</span>
        </div>

        <div class="kc-text">
          <span v-if="thread.summary">{{ thread.summary }}</span>
          <span v-else>{{ t("thread_related.img_file") }}</span>
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

.kc-add-box {
  width: 312px;
  border: 3px dashed var(--line-bottom);
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--btn-font);
  color: var(--main-note);
  border-radius: 20px;
  user-select: none;
  cursor: pointer;
  transition: .15s;
  opacity: 0;

  .kc-add-svg {
    width: 30px;
    height: 30px;
    transition: .15s;
    margin-inline-end: 10px;
  }
}

.kc-add-box_show {
  opacity: 1;
}

@media(hover: hover) {
  .kc-add-box:hover {
    font-size: var(--title-font);

    .kc-add-svg {
      width: 36px;
      height: 36px;
    }
  }
}

.kc-add-box:active {
  opacity: .7;
  font-size: var(--title-font);

  .kc-add-svg {
    width: 36px;
    height: 36px;
  }
}

.kc-kanban-list {
  padding-inline-start: 10px;
  width: 320px;
  position: relative;
  overflow-y: auto;
}

.kc-kanban-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
}

.kc-kanban-list::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.kc-kanban-item {
  margin-block-end: 10px;
  width: 98%;
  position: relative;
}

.kcki-inner {
  border-radius: 4px;
  background-color: var(--card-bg);
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
  position: relative;
  user-select: none;
}

.kc-kanban-helper {
  opacity: .7;
}

.kc-kanban-helper .kcki-inner {
  transform: rotate(5deg);
}

.kc-title {
  line-height: 2;
  font-size: var(--btn-font);
  font-weight: 700;
  color: var(--main-normal);
}

.kc-text {
  position: relative;
  width: 100%;
  font-size: 17px;
  line-height: 1.5;
  color: var(--main-code);
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  max-height: 77px;
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