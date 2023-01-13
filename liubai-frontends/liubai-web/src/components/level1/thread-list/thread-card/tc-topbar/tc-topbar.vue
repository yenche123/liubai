<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ThreadShow } from '~/types/types-content';
import { useTcTopbar } from './tools/useTcTopbar';

export default defineComponent({
  props: {
    threadData: {
      type: Object as PropType<ThreadShow>,
      required: true
    }
  },
  setup(props) {
    const { showTopbar } = useTcTopbar(props)

    return {
      showTopbar
    }
  }
})

</script>
<template>
  <div v-if="showTopbar" class="tct-container">
    
    <!-- 置顶 -->
    <svg v-if="threadData.pinStamp" class="tct-pin" viewBox="-50 -50 300 300">
      <polygon class="tct-triangle" stroke-linejoin="round" points="20,-20 220,-20 220,180"/>
    </svg>

  </div>
</template>
<style lang="scss" scoped>

.tct-container {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  position: relative;

  .tct-pin {
    width: 14px;
    height: 14px;
    border-top-right-radius: 4px;
    overflow: hidden;
    position: relative;

    .tct-triangle {
      fill: var(--main-tip);
      stroke: var(--main-tip);
      stroke-width: 60;
    }
  }

}


</style>