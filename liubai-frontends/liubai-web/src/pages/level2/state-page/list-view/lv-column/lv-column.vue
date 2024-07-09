<script setup lang="ts">
import type { PropType } from 'vue';
import { SlickList, SlickItem, HandleDirective } from 'vue-slicksort'
import type { ThreadShow } from '~/types/types-content';
import { useKanbanThreads } from "../../tools/useKanbanThreads";
import { useI18n } from "vue-i18n";
import { useLvColumn } from './tools/useLvColumn';
import type { KbListEmits } from "../../tools/types";

const vHandle = HandleDirective
const props = defineProps({
  stateId: {
    type: String,
    required: true,
  },
  threads: {
    type: Array as PropType<ThreadShow[]>,
    default: []
  },
  hasMore: {
    type: Boolean,
  },
  prefix: {
    type: String,
    required: true,
  }
})

const emit = defineEmits<KbListEmits>()

const { t } = useI18n()
const {
  list,
  showAddBox,
} = useKanbanThreads(props, emit)

const {
  lvcData
} = useLvColumn(emit)

const iconColor = "var(--main-note)"

</script>
<template>

  <SlickList
    class="lc-list"
    helper-class="lc-list_helper"
    axis="y"
    lockAxis="y"
    group="list"
    v-model:list="list"
    use-drag-handle
    :distance="5"
    :id="'list-' + stateId"
    @sort-insert="$emit('sort-insert', $event)"
    @update:list="$emit('threadsupdated', $event)"
  >

    <!-- 为空时的添加按钮 -->
    <div v-if="list.length < 1" class="lc-add-box"
      :class="{ 'lc-add-box_show': showAddBox }"
    >
      <div class="liu-no-user-select liu-hover lc-add"
        @click="$emit('tapadd')"
      >
        <svg-icon name="add" class="lc-add-svg"
          color="var(--main-code)"
        ></svg-icon>
        <span>{{ t('common.add') }}</span>
      </div>
    </div>

    <SlickItem
      v-for="(thread, j) in list"
      :key="thread._id"
      :index="j"
      class="lc-item"
    >
      <div class="lci-inner" @click="$emit('tapitem', thread._id)">

        <div class="liu-no-user-select lci-text">
          <span v-if="thread.title" class="lci-title">{{ thread.title }}</span>
          <span v-if="thread.summary">{{ thread.summary }}</span>
          <span v-else>{{ t('thread_related.img_file') }}</span>
        </div>

        <span class="lci-handle" v-handle>
          <svg-icon class="lci-handle-svg"
            name="drag_handle400"
            :color="iconColor"
          ></svg-icon>
        </span>

      </div>
    </SlickItem>

  </SlickList>

  
</template>
<style lang="scss" scoped>

.lc-list {
  width: 100%;
  padding: 0 0 10px;
  position: relative;
}

.lc-list_helper {
  opacity: .7;
}

.lc-add-box {
  width: 100%;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: .15s;
  opacity: 0;
}

.lc-add-box_show {
  opacity: 1;
}

.lc-add {
  height: 38px;
  padding: 0 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30%;
  min-width: 150px;
  max-width: 250px;
  font-size: var(--btn-font);
  color: var(--main-code);
  font-weight: 700;

  .lc-add-svg {
    width: 24px;
    height: 24px;
    margin-inline-end: 4px;
  }
}

.lc-item {
  width: 100%;
  position: relative;
  border-bottom: 0.5px solid var(--bg-color);
}

.lc-item:last-child {
  border-bottom: 0;
}

.lci-inner {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding-block: 4px;
  padding-inline-start: 16px;
  background-color: var(--card-bg);
  transition: .15s;
}

.lci-text {
  width: calc(100% - 50px);
  color: var(--main-normal);
  font-size: var(--btn-font);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  .lci-title {
    font-weight: 700;
    margin-inline-end: 6px;
  }
}

.lci-handle {
  width: 48px;
  height: 40px;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;

  .lci-handle-svg {
    width: 24px;
    height: 24px;
  }
}


@media(hover: hover) {
  .lci-inner:hover {
    background-color: var(--card-hover);
  }
}

.lci-inner:active {
  background-color: var(--card-hover);
}

</style>