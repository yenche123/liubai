<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
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
    const { t } = useI18n()
    const { showTopbar } = useTcTopbar(props)

    return {
      t,
      showTopbar
    }
  }
})

</script>
<template>
  <div v-if="showTopbar" class="tct-container">

    <!-- 状态 -->
    <div class="tct-state-box" v-if="threadData.stateShow"
      :style="{ 
        'color': threadData.stateShow.color,
      }"
    >
      <div class="tctsb-bg"
        :style="{
          'background-color': threadData.stateShow.color
        }"
      ></div>
      <span v-if="threadData.stateShow.text">{{ threadData.stateShow.text }}</span>
      <span v-else-if="threadData.stateShow.text_key">{{ t(threadData.stateShow.text_key) }}</span>
    </div>

    
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

  .tct-state-box {
    padding: 2px 8px;
    border-radius: 2px;
    border-top-right-radius: 10px;
    border-bottom-left-radius: 10px;
    min-width: 40px;
    text-align: center;
    font-size: var(--state-font);
    letter-spacing: 1px;
    position: relative;
    overflow: hidden;

    .tctsb-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: .2;
    }

  }

  .tct-pin {
    margin-inline-start: 10px;
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