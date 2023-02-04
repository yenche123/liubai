<script lang="ts">
import { defineComponent, PropType } from 'vue';
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import type { StateWhichPage } from "../tools/types";
import type { KanbanColumn } from '~/types/types-content';
import StateNavi from '../state-navi/state-navi.vue';
import { useInjectSnIndicator } from "../tools/useSnIndicator";
import { SlickList, SlickItem, HandleDirective } from 'vue-slicksort'

export default defineComponent({

  components: {
    ScrollView,
    StateNavi,
    SlickList,
    SlickItem,
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
    const indicatorData = useInjectSnIndicator()
    return {
      indicatorData
    }
  },

})

</script>
<template>

  <scroll-view>

    <StateNavi 
      :which-page="current"
      :indicator-data="indicatorData"
      @tapnavi="$emit('tapnavi', $event)"
    ></StateNavi>

    <div class="kp-test"></div>
    <div class="kp-test2"></div>
    <div class="kp-test"></div>


  </scroll-view>

</template>
<style scoped lang="scss">

.kp-test {
  width: 500px;
  height: 500px;
  background-color: wheat;
}

.kp-test2 {
  width: 500px;
  height: 500px;
  background-color: darkcyan;
}

</style>