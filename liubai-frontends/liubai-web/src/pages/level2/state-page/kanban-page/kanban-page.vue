<script lang="ts">
import { defineComponent, PropType } from 'vue';
import StateNavi from '../state-navi/state-navi.vue';
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import type { StateWhichPage } from "../tools/types";
import { useInjectSnIndicator } from "../tools/useSnIndicator";
import cfg from "~/config"

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
    const kpHeightStr = `calc(100% - ${cfg.navi_height}px)`

    return {
      indicatorData,
      cfg,
      kpHeightStr,
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
    <div class="kp-test"></div>
    <div class="kp-test2"></div>
    <div class="kp-test"></div>
  </ScrollView>

</template>
<style scoped lang="scss">

.kp-sv {
  width: 100%;
  height: v-bind("kpHeightStr");
}

.kp-test {
  width: 500px;
  height: 300px;
  background-color: wheat;
}

.kp-test2 {
  width: 500px;
  height: 300px;
  background-color: darkcyan;
}


</style>