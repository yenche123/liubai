<script lang="ts">
import { defineComponent, PropType } from 'vue';
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import type { StateWhichPage } from "../tools/types";
import StateNavi from '../state-navi/state-navi.vue';
import { useInjectSnIndicator } from "../tools/useSnIndicator";

export default defineComponent({

  components: {
    ScrollView,
    StateNavi
  },

  emits: {
    tapnavi: (index: StateWhichPage) => true,
  },

  props: {
    current: {
      type: Number as PropType<StateWhichPage>,
      default: 0,
    },
  },

  setup() {
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

  </scroll-view>

</template>
<style scoped lang="scss">


</style>