<script setup lang="ts">
import type { PropType } from 'vue';
import type { StateWhichPage } from "../tools/types";
import type { KanbanColumn } from '~/types/types-content';
import StateNavi from '../state-navi/state-navi.vue';
import { useInjectSnIndicator } from "../tools/useSnIndicator";
import { SlickList, SlickItem, HandleDirective } from 'vue-slicksort'
import { useI18n } from 'vue-i18n';
import { useKanbanColumns } from '../tools/useKanbanColumns';
import type { MenuItem } from '~/components/common/liu-menu/tools/types';
import LvColumn from "./lv-column/lv-column.vue";
import liuApi from '~/utils/liu-api';
import { useListView } from "./tools/useListView"
import middleBridge from '~/utils/middle-bridge';

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
  hideScrollbar: {
    type: Boolean,
    default: false,
  },
})

useListView()
const vHandle = HandleDirective
const iconColor = "var(--main-note)"
const { t } = useI18n()
const indicatorData = useInjectSnIndicator()

const {
  MORE_ITEMS,
  prefix,
  columns,
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
const { isMobile } = liuApi.getCharacteristic()

const showScrollbarProperty = middleBridge.canShowScrollbarProperty()

</script>
<template>

  <SlickList
    axis="y"
    lockAxis="y"
    class="lv-container"
    :class="{ 
      'lv-scrollbar': showScrollbarProperty,
      'lv-scroll_hidden': hideScrollbar,
    }"
    helper-class="lv-container_helper"
    v-model:list="columns"
    use-drag-handle
    id="state-page-lv-container"
    @update:list="onColumnsSorted"
  >
    <StateNavi 
      :current="current"
      :indicator-data="indicatorData"
      :page-in="1"
      @tapnavi="$emit('tapnavi', $event)"
    ></StateNavi>

    <div class="lv-virtual"></div>

    <SlickItem
      v-for="(item, index) in columns"
      :key="item.id"
      :index="index"
      class="lv-column"
    >

      <div class="lvc-box">


        <!-- 列表的标头 -->
        <div class="lv-column-header"
          :id="'lv-column-header_' + item.id"
        >

          <!-- column 的把手 -->
          <span class="lv-handle"
            v-handle
          >
            <svg-icon class="lv-handle-svg"
               name="drag_handle400"
              :color="iconColor"
            ></svg-icon>
          </span>

          <!--状态标题 -->
          <div class="lv-state-box">
            <div class="liu-no-user-select lv-state"
              :style="{ 
                'color': item.colorShow,
              }"
            >
              <div class="lps-bg"
                :style="{
                  'background-color': item.colorShow
                }"
              ></div>
              <span v-if="item.text">{{ item.text }}</span>
              <span v-else-if="item.text_key">{{ t(item.text_key) }}</span>
            </div>
          </div>

          <!-- 状态 // 更多 -->
          <div class="lvch-footer"
            :class="{ 'lvch-footer_show': item.id === stateIdThatCursorIsHovering }"
          >

            <!-- 更多 -->
            <!-- 原本有一个属性: :container="'#lv-column-header_' + item.id" -->
            <LiuMenu
              :menu="MORE_ITEMS"
              placement="bottom-end"
              @tapitem="(event1: MenuItem, event2: number) => onTapMoreMenuItem(item.id, event1, event2)"
              @menushow="() => onMenuShow(item.id)"
              @menuhide="() => onMenuHide(item.id)"
            >
              <div class="liu-hover lvch-btn">
                <svg-icon name="more" class="lvch-svg" 
                  :color="iconColor"
                ></svg-icon>
              </div>
            </LiuMenu>
          
            <!-- 添加动态 -->
            <div class="liu-hover lvch-btn"
              @click="onTapAddThread(item.id)"
            >
              <svg-icon name="add" class="lvch-svg" 
                :color="iconColor"
              ></svg-icon>
            </div>

          </div>
        
        </div>

        <LvColumn
          v-model:threads="item.threads"
          :has-more="item.hasMore"
          :state-id="item.id"
          :prefix="prefix"
          @sort-insert="onThreadInserted(item.id, $event)"
          @threadsupdated="onThreadsUpdated(item.id, $event, 'kanban-view')"
          @tapitem="onTapThreadItem"
          @tapadd="() => onTapAddThread(item.id)"
        ></LvColumn>

      </div>

    </SlickItem>


    <div class="lv-virtual-2"></div>

  </SlickList>

</template>
<style scoped lang="scss">

.lv-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    display: v-bind("isMobile ? 'none' : 'block'");
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }
}

.lv-scrollbar {
  scrollbar-color: var(--scrollbar-thumb) transparent;
  scrollbar-width: v-bind("isMobile ? 'none' : 'auto'"); 
}


.lv-scroll_hidden {
  scrollbar-color: transparent transparent;

  &::-webkit-scrollbar {
    display: none;
  }
}

.lv-container_helper {
  opacity: .5;
  cursor: grabbing;
}

.lv-virtual {
  width: 100%;
  height: 10px;
}

.lv-virtual-2 {
  width: 100%;
  height: 50px;
}

.lv-column {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-block-end: 20px;
  position: relative;
}

.lvc-box {
  width: 92%;
  max-width: 800px;
  position: relative;
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow-2);
  border-radius: 16px;
}

.lv-column-header {
  width: 100%;
  height: 50px;
  position: relative;
  display: flex;
  align-items: center;
}

.lv-handle {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-inline-start: 10px;
  padding-block-start: 6px;
  padding-block-end: 6px;
  padding-inline-end: 6px;
  flex: none;
  cursor: grab;
  touch-action: none;
}

.lv-handle-svg {
  width: 24px;
  height: 24px;
}

.lv-state-box {
  flex: 1;
  display: flex;
}

.lv-state {
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

  .lps-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: .2;
  }
}

.lvch-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  padding-inline-end: 8px;
  transition: .15s;
}

.lvch-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;

  .lvch-svg {
    width: 24px;
    height: 24px;
  }
}

@media(hover: hover) {
  .lvch-footer {
    opacity: 0;
  }

  .lv-column:hover .lvch-footer {
    opacity: 1;
  }
}

.lvch-footer_show {
  opacity: 1;
}


</style>