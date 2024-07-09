<script setup lang="ts">
import type { PropType } from 'vue';
import { SlickList, SlickItem, HandleDirective } from 'vue-slicksort'
import type { ThreadShow } from '~/types/types-content';
import { useKanbanThreads } from "../../tools/useKanbanThreads"
import { useKvColumn } from './tools/useKvColumn';
import { useI18n } from "vue-i18n"
import type { KbListEmits2 } from "../../tools/types"
import AppLink from '~/components/common/app-link/app-link.vue';

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

const emit = defineEmits<KbListEmits2>()

const { t } = useI18n()
const {
  list,
  showAddBox,
} = useKanbanThreads(props, emit)
const {
  columnHeight,
} = useKvColumn(props, emit)

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
    <div v-if="list.length < 1" class="liu-no-user-select kc-add-box"
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

      <div class="liu-no-user-select kcki-inner"
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

    <AppLink v-if="hasMore"
      :to="prefix + 'state-more/' + stateId"
    >
      <div class="liu-no-user-select liu-hover kc-more">
        <span>{{ t('common.checkMore') }}</span>
        <div class="kcm-icon-box">
          <svg-icon name="arrow-right2"
            class="kcm-svg-icon"
            color="var(--main-normal)"
          ></svg-icon>
        </div>
      </div>
    </AppLink>

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

.kc-more {
  width: 98%;
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin-block-start: 16px;
  margin-block-end: 16px;
  overflow: hidden;
  padding: 8px 10px;
  font-size: var(--btn-font);
  color: var(--main-normal);
  font-weight: 700;
}

.kc-more::before {
  border-radius: 8px;
}

.kcm-icon-box {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  .kcm-svg-icon {
    width: 18px;
    height: 18px;
  }
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
  will-change: transform;
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
  font-size: var(--btn-font);
  line-height: 1.5;
  color: var(--main-code);
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  overflow: hidden;
  max-height: 77px;
}

.kc-footer {
  padding-block-start: 5px;
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