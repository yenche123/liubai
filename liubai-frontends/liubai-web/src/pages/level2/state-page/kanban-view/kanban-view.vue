<script setup lang="ts">
import type { PropType } from 'vue';
import StateNavi from '../state-navi/state-navi.vue';
import type { StateWhichPage } from "../tools/types";
import type { KanbanColumn } from '~/types/types-content';
import { useInjectSnIndicator } from "../tools/useSnIndicator";
import cfg from "~/config"
import { SlickList, SlickItem, HandleDirective } from 'vue-slicksort'
import { useKanbanColumns } from '../tools/useKanbanColumns';
import KvColumn from "./kv-column/kv-column.vue"
import { useI18n } from 'vue-i18n';
import type { MenuItem } from '~/components/common/liu-menu/tools/types';

// Vue 3.3+ 的 defineEmits 声明方式
const emit = defineEmits<{
  "tapnavi": [index: StateWhichPage]
  "update:kanbanColumns": [val: KanbanColumn[]]
}>()

const props = defineProps({
  current: {
    type: Number as PropType<StateWhichPage>,
    default: 0,
  },
  kanbanColumns: {
    type: Array as PropType<KanbanColumn[]>,
    required: true
  },
})

const vHandle = HandleDirective

const iconColor = "var(--main-note)"
const { t } = useI18n()
const indicatorData = useInjectSnIndicator()
const kpHeightStr = `calc(100% - ${cfg.navi_height + 1}px)`

const {
  MORE_ITEMS,
  prefix,
  columns, 
  scollTops, 
  setScrollTop,
  onColumnsSorted,
  onThreadInserted,
  onThreadsUpdated,
  onTapMoreMenuItem,
  onTapThreadItem,
  onTapAddThread,
  onMenuShow,
  onMenuHide,
  stateIdThatCursorIsHovering,
} = useKanbanColumns(props, emit)

</script>
<template>

  <StateNavi 
    :current="current"
    :indicator-data="indicatorData"
    :page-in="2"
    @tapnavi="$emit('tapnavi', $event)"
  ></StateNavi>

  <SlickList 
    axis="x"
    lockAxis="x"
    class="kv-column-container"
    helper-class="kv-column-container_helper"
    v-model:list="columns"
    use-drag-handle
    @update:list="onColumnsSorted"
  >

    <SlickItem
      v-for="(item, index) in columns"
      :key="item.id"
      :index="index"
      class="kv-kanban-column"
    >

      <!-- 看板每一列的标头 -->
      <div class="kv-column-header"
        :class="{ 'kvch-shadow': scollTops[item.id] > 10 }"
        :id="'kv-column-header_' + item.id"
      >

        <!-- column 的把手 -->
        <span class="kv-handle"
          v-handle
        >
          <svg-icon class="kv-handle-svg"
             name="drag_handle400"
            :color="iconColor"
          ></svg-icon>
        </span>

        <!--状态标题 -->
        <div class="kv-state-box">
          <div class="liu-no-user-select kv-state"
            :style="{ 
              'color': item.colorShow,
            }"
          >
            <div class="kps-bg"
              :style="{
                'background-color': item.colorShow
              }"
            ></div>
            <span v-if="item.text">{{ item.text }}</span>
            <span v-else-if="item.text_key">{{ t(item.text_key) }}</span>
          </div>
        </div>
          

        <!-- 状态 // 更多 -->
        <div class="kvch-footer" 
          :class="{ 'kvch-footer_show': item.id === stateIdThatCursorIsHovering }"
        >

          <!-- 更多 -->
          <LiuMenu
            :menu="MORE_ITEMS"
            :container="'#kv-column-header_' + item.id"
            placement="bottom-end"
            @tapitem="(event1: MenuItem, event2: number) => onTapMoreMenuItem(item.id, event1, event2)"
            @menushow="() => onMenuShow(item.id)"
            @menuhide="() => onMenuHide(item.id)"
            mask-z-index="40"
          >
            <div class="liu-hover kvch-btn">
              <svg-icon name="more" class="kvch-svg" 
                :color="iconColor"
              ></svg-icon>
            </div>
          </LiuMenu>
            

          <!-- 添加动态 -->
          <div class="liu-hover kvch-btn"
            @click="onTapAddThread(item.id)"
          >
            <svg-icon name="add" class="kvch-svg" 
              :color="iconColor"
            ></svg-icon>
          </div>

        </div>

      </div>
      <KvColumn
        v-model:threads="item.threads"
        :has-more="item.hasMore"
        :state-id="item.id"
        :prefix="prefix"
        @scrolling="setScrollTop(item.id, $event)"
        @sort-insert="onThreadInserted(item.id, $event)"
        @threadsupdated="onThreadsUpdated(item.id, $event)"
        @tapitem="onTapThreadItem"
        @tapadd="() => onTapAddThread(item.id)"
      ></KvColumn>
    </SlickItem>

    <div class="kv-virtual"></div>

  </SlickList>

</template>
<style scoped lang="scss">

.kv-column-container {
  width: 100%;
  border-top: 0.6px solid var(--line-default);
  height: v-bind("kpHeightStr");
  padding-inline-start: 20px;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  overflow-x: auto;

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }

  & > div {
    flex: 0 0 auto;
  }
}

.kv-column-container_helper {
  opacity: .5;
  cursor: grabbing;
}

.kv-kanban-column {
  width: 330px;
  padding-inline-start: 6px;
  padding-inline-end: 6px;
  position: relative;
  background-color: var(--bg-color);
  overflow: hidden;
}

.kv-column-header {
  width: 100%;
  height: v-bind("cfg.kanban_header_height + 'px'");
  position: relative;
  display: flex;
  align-items: center;
  z-index: 50;
}

.kvch-shadow {
  box-shadow: var(--kanban-header-shadow);
}

.kv-handle {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-inline-start: 6px;
  padding-block-start: 10px;
  padding-block-end: 10px;
  padding-inline-end: 6px;
  flex: none;
  cursor: grab;
}

.kv-handle-svg {
  width: 24px;
  height: 24px;
}

.kv-state-box {
  flex: 1;
  display: flex;
}

.kv-state {
  padding: 3px 9px;
  border-radius: 3px;
  border-top-right-radius: 10px;
  border-bottom-left-radius: 10px;
  min-width: 40px;
  text-align: center;
  font-size: var(--mini-font);
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  font-weight: 500;

  .kps-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: .19;
  }
}

.kvch-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  transition: .15s;
}

.kvch-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;

  .kvch-svg {
    width: 24px;
    height: 24px;
  }
}


.kv-virtual {
  width: 20px;
  height: 100px;
}

@media(hover: hover) {
  .kvch-footer {
    opacity: 0;
  }

  .kv-kanban-column:hover .kvch-footer {
    opacity: 1;
  }
}


.kvch-footer_show {
  opacity: 1;
}


@media screen and (max-width: 400px) {
  .kv-column-container {
    padding-inline-start: 5px;
  }
}


</style>