<script lang="ts">
import { defineComponent, PropType } from 'vue';
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import type { StateWhichPage } from "../tools/types";
import type { KanbanColumn } from '~/types/types-content';
import StateNavi from '../state-navi/state-navi.vue';
import { useInjectSnIndicator } from "../tools/useSnIndicator";
import { SlickList, SlickItem, HandleDirective } from 'vue-slicksort'
import { useI18n } from 'vue-i18n';
import { useKanbanColumns } from '../tools/useKanbanColumns';
import type { MenuItem } from '~/components/common/liu-menu/tools/types';
import LpColumn from "./lp-column/lp-column.vue";

export default defineComponent({

  components: {
    ScrollView,
    StateNavi,
    SlickList,
    SlickItem,
    LpColumn,
  },

  emits: {
    "tapnavi": (index: StateWhichPage) => true,

    // 父组件使用 v-model:kanban-columns="" 完成双向绑定
    "update:kanbanColumns": (val: KanbanColumn[]) => true,
  },

  props: {
    current: {
      type: Number as PropType<StateWhichPage>,
      default: 0,
    },
    kanbanColumns: {
      type: Array as PropType<KanbanColumn[]>,
      required: true
    },
  },

  directives: {
    handle: HandleDirective
  },

  setup(props, { emit }) {
    const iconColor = "var(--main-note)"
    const { t } = useI18n()
    const indicatorData = useInjectSnIndicator()

    const {
      MORE_ITEMS,
      columns,
      onColumnsSorted,
      onThreadInserted,
      onThreadsUpdated,
      onTapMoreMenuItem,
      onTapThreadItem,
    } = useKanbanColumns(props, emit)

    return {
      MORE_ITEMS,
      iconColor,
      indicatorData,
      t,
      columns,
      onColumnsSorted,
      onThreadInserted,
      onThreadsUpdated,
      onTapMoreMenuItem,
      onTapThreadItem,
    }
  },

})

</script>
<template>

  <SlickList
    axis="y"
    lockAxis="y"
    class="lp-container"
    helper-class="lp-container_helper"
    v-model:list="columns"
    use-drag-handle
    @update:list="onColumnsSorted"
  >
    <StateNavi 
      :current="current"
      :indicator-data="indicatorData"
      :page-in="1"
      @tapnavi="$emit('tapnavi', $event)"
    ></StateNavi>

    <div class="lp-virtual"></div>

    <SlickItem
      v-for="(item, index) in columns"
      :key="item.id"
      :index="index"
      class="lp-column"
    >

      <div class="lpc-box">


        <!-- 列表的标头 -->
        <div class="lp-column-header"
          :id="'lp-column-header_' + item.id"
        >

          <!-- column 的把手 -->
          <span class="lp-handle"
            v-handle
          >
            <svg-icon class="lp-handle-svg"
               name="drag_handle400"
              :color="iconColor"
            ></svg-icon>
          </span>

          <!--状态标题 -->
          <div class="lp-state-box">
            <div class="lp-state"
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
          <div class="lpch-footer">

            <!-- 更多 -->
            <LiuMenu
              :menu="MORE_ITEMS"
              :container="'#lp-column-header_' + item.id"
              placement="bottom-end"
              @tapitem="(event1: MenuItem, event2: number) => onTapMoreMenuItem(item.id, event1, event2)"
            >
              <div class="liu-hover lpch-btn">
                <svg-icon name="more" class="lpch-svg" 
                  :color="iconColor"
                ></svg-icon>
              </div>
            </LiuMenu>
          
            <!-- 添加动态 -->
            <div class="liu-hover lpch-btn">
              <svg-icon name="add" class="lpch-svg" 
                :color="iconColor"
              ></svg-icon>
            </div>

          </div>
        
        </div>

        <LpColumn
          v-model:threads="item.threads"
          :state-id="item.id"
          @sort-insert="onThreadInserted(item.id, $event)"
          @threadsupdated="onThreadsUpdated(item.id, $event)"
          @tapitem="onTapThreadItem"
        ></LpColumn>

      </div>

    </SlickItem>

  </SlickList>

</template>
<style scoped lang="scss">

.lp-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow-y: auto;

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }
}

.lp-container_helper {
  opacity: .5;
  cursor: grabbing;
}

.lp-virtual {
  width: 100%;
  height: 10px;
}

.lp-column {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-block-end: 20px;
  position: relative;
}

.lpc-box {
  width: 92%;
  max-width: 900px;
  position: relative;
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow-2);
  border-radius: 16px;
}

.lp-column-header {
  width: 100%;
  height: 50px;
  position: relative;
  display: flex;
  align-items: center;
}

.lp-handle {
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
}

.lp-handle-svg {
  width: 24px;
  height: 24px;
}

.lp-state-box {
  flex: 1;
  display: flex;
}

.lp-state {
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
  user-select: none;
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

.lpch-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  padding-inline-end: 8px;
  transition: .15s;
}

.lpch-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;

  .lpch-svg {
    width: 24px;
    height: 24px;
  }
}

@media(hover: hover) {
  .lpch-footer {
    opacity: 0;
  }

  .lp-column:hover .lpch-footer {
    opacity: 1;
  }
}

.lp-test {
  width: 100%;
  height: 100px;
}



</style>