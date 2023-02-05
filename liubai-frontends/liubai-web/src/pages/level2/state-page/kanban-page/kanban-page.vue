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
    const { t } = useI18n()
    const indicatorData = useInjectSnIndicator()
    const kpHeightStr = `calc(100% - ${cfg.navi_height + 1}px)`

    const { 
      columns, 
      scollTops, 
      setScrollTop, 
    } = useKanbanColumns(props, emit)

    return {
      t,
      columns,
      indicatorData,
      cfg,
      kpHeightStr,
      scollTops, 
      setScrollTop,
    }
  },

})


</script>
<template>

  <StateNavi 
    :which-page="current"
    :indicator-data="indicatorData"
    @tapnavi="$emit('tapnavi', $event)"
  ></StateNavi>
  <ScrollView
    class="kp-sv"
    direction="horizontal"
  >
    <SlickList 
      axis="x"
      lockAxis="x"
      class="kp-column-container"
      helper-class="kp-column-container_helper"
      v-model:list="columns"
      use-drag-handle
    >

      <SlickItem
        v-for="(item, index) in columns"
        :key="item.id"
        :index="index"
        class="kp-kanban-column"
      >

        <!-- 看板每一列的标头 -->
        <div class="kp-column-header">

          <!-- column 的把手 -->
          <span class="kp-handle"
            v-handle
          >
            <svg-icon class="kp-handle-svg"
              name="drag_handle400"
              color="var(--main-note)"
            ></svg-icon>
          </span>

          <!--状态标题 -->
          <div class="kp-state-box">
            <div class="kp-state"
              :style="{ 
                'color': item.color,
              }"
            >
              <div class="kps-bg"
                :style="{
                  'background-color': item.color
                }"
              ></div>
              <span v-if="item.text">{{ item.text }}</span>
              <span v-else-if="item.text_key">{{ t(item.text_key) }}</span>
            </div>
          </div>
          

          <!-- 状态 // 更多 -->

        </div>
        <KpColumn
          v-model:threads="item.threads"
          :state-id="item.id"
        ></KpColumn>
      </SlickItem>

    </SlickList>
  </ScrollView>

</template>
<style scoped lang="scss">

.kp-sv {
  width: 100%;
  border-top: 0.6px solid var(--line-default);
  height: v-bind("kpHeightStr");
}

.kp-column-container {
  padding-inline-start: 20px;
  display: flex;
  align-items: flex-start;
}

.kp-kanban-column {
  width: 330px;
  padding-inline-start: 6px;
  padding-inline-end: 6px;
  position: relative;
  background-color: var(--bg-color);
}

.kp-column-header {
  width: 96%;
  height: v-bind("cfg.kanban_header_height + 'px'");
  position: relative;
  display: flex;
  align-items: center;
}

.kp-handle {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block-start: 10px;
  padding-block-end: 10px;
  padding-inline-end: 6px;
  flex: none;
  cursor: grab;
}

.kp-column-container_helper {
  opacity: .5;
  cursor: grabbing;
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


</style>