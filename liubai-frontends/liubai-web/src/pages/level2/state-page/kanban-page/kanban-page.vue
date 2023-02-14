<script lang="ts">
import { defineComponent, PropType } from 'vue';
import StateNavi from '../state-navi/state-navi.vue';
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import type { StateWhichPage } from "../tools/types";
import type { KanbanColumn } from '~/types/types-content';
import { useInjectSnIndicator } from "../tools/useSnIndicator";
import cfg from "~/config"
import { SlickList, SlickItem, HandleDirective } from 'vue-slicksort'
import { useKanbanColumns } from '../tools/useKanbanColumns';
import KpColumn from "./kp-column/kp-column.vue"
import { useI18n } from 'vue-i18n';
import type { MenuItem } from '~/components/common/liu-menu/tools/types';

export default defineComponent({

  components: {
    ScrollView,
    StateNavi,
    SlickList,
    SlickItem,
    KpColumn,
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
    const kpHeightStr = `calc(100% - ${cfg.navi_height + 1}px)`

    const {
      MORE_ITEMS,
      columns, 
      scollTops, 
      setScrollTop,
      onColumnsSorted,
      onThreadInserted,
      onThreadsUpdated,
      onTapMoreMenuItem,
      onTapThreadItem,
    } = useKanbanColumns(props, emit)

    return {
      MORE_ITEMS,
      iconColor,
      t,
      columns,
      indicatorData,
      cfg,
      kpHeightStr,
      scollTops, 
      setScrollTop,
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

  <StateNavi 
    :current="current"
    :indicator-data="indicatorData"
    :page-in="2"
    @tapnavi="$emit('tapnavi', $event)"
  ></StateNavi>

  <SlickList 
    axis="x"
    lockAxis="x"
    class="kp-column-container"
    helper-class="kp-column-container_helper"
    v-model:list="columns"
    use-drag-handle
    @update:list="onColumnsSorted"
  >

    <SlickItem
      v-for="(item, index) in columns"
      :key="item.id"
      :index="index"
      class="kp-kanban-column"
    >

      <!-- 看板每一列的标头 -->
      <div class="kp-column-header"
        :class="{ 'kpch-shadow': scollTops[item.id] > 10 }"
        :id="'kp-column-header_' + item.id"
      >

        <!-- column 的把手 -->
        <span class="kp-handle"
          v-handle
        >
          <svg-icon class="kp-handle-svg"
             name="drag_handle400"
            :color="iconColor"
          ></svg-icon>
        </span>

        <!--状态标题 -->
        <div class="kp-state-box">
          <div class="kp-state"
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
        <div class="kpch-footer">

          <!-- 更多 -->
          <LiuMenu
            :menu="MORE_ITEMS"
            :container="'#kp-column-header_' + item.id"
            placement="bottom-end"
            @tapitem="(event1: MenuItem, event2: number) => onTapMoreMenuItem(item.id, event1, event2)"
          >
            <div class="liu-hover kpch-btn">
              <svg-icon name="more" class="kpch-svg" 
                :color="iconColor"
              ></svg-icon>
            </div>
          </LiuMenu>
            

          <!-- 添加动态 -->
          <div class="liu-hover kpch-btn">
            <svg-icon name="add" class="kpch-svg" 
              :color="iconColor"
            ></svg-icon>
          </div>

        </div>

      </div>
      <KpColumn
        v-model:threads="item.threads"
        :state-id="item.id"
        @scrolling="setScrollTop(item.id, $event)"
        @sort-insert="onThreadInserted(item.id, $event)"
        @threadsupdated="onThreadsUpdated(item.id, $event)"
        @tapitem="onTapThreadItem"
      ></KpColumn>
    </SlickItem>

    <div class="kp-virtual"></div>

  </SlickList>

</template>
<style scoped lang="scss">

.kp-column-container {
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

.kp-column-container_helper {
  opacity: .5;
  cursor: grabbing;
}

.kp-kanban-column {
  width: 330px;
  padding-inline-start: 6px;
  padding-inline-end: 6px;
  position: relative;
  background-color: var(--bg-color);
  overflow: hidden;
}

.kp-column-header {
  width: 100%;
  height: v-bind("cfg.kanban_header_height + 'px'");
  position: relative;
  display: flex;
  align-items: center;
  z-index: 100;
}

.kpch-shadow {
  box-shadow: var(--kanban-header-shadow);
}

.kp-handle {
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

.kp-handle-svg {
  width: 24px;
  height: 24px;
}

.kp-state-box {
  flex: 1;
  display: flex;
}

.kp-state {
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

  .kps-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: .2;
  }
}

.kpch-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  transition: .15s;
}

.kpch-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;

  .kpch-svg {
    width: 24px;
    height: 24px;
  }
}


.kp-virtual {
  width: 20px;
  height: 100px;
}

@media(hover: hover) {
  .kpch-footer {
    opacity: 0;
  }

  .kp-kanban-column:hover .kpch-footer {
    opacity: 1;
  }
}

@media screen and (max-width: 400px) {
  .kp-column-container {
    padding-inline-start: 5px;
  }
}


</style>