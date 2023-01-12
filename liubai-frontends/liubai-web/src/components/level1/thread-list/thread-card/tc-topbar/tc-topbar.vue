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
    <div v-if="threadData.pinStamp" class="tct-pin">
      <div class="tct-triangle"></div>
    </div>

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
    width: 12px;
    height: 12px;
    border-top-right-radius: 4px;
    overflow: hidden;
    position: relative;

    .tct-triangle {
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 12px 12px 0;
      border-color: transparent var(--line-bottom) transparent transparent;
    }
  }

}


</style>