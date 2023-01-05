<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ThreadShow } from '~/types/types-content';

export default defineComponent({
  props: {
    threadData: {
      type: Object as PropType<ThreadShow>,
      required: true
    }
  },
  setup(props) {
    const default_color = "var(--main-code)"

    return {
      default_color
    }
  }
})

</script>
<template>

  <div class="tcb-container">
    <div class="tcb-time">
      <span v-if="threadData.editedStr">{{ threadData.editedStr }}</span>
      <span v-else>{{ threadData.createdStr }}</span>
    </div>

    <!-- 更多 -->
    <div class="tcb-footer">
      <div class="liu-hover tcbf-icon-box">
        <svg-icon name="more" class="tcbf-icon" :color="default_color"></svg-icon>
      </div>
    </div>
  </div>


</template>
<style scoped lang="scss">

.tcb-container {
  width: 100%;
  position: relative;
  display: flex;
  align-items: flex-end;

  .tcb-time {
    font-size: var(--mini-font);
    color: var(--main-tip);
    user-select: none;
  }

  .tcb-footer {
    flex: 1;
    display: flex;
    justify-content: flex-end;

    .tcbf-icon-box {
      width: 40px;
      height: 40px;
      margin-inline-end: -10px;
      margin-block-end: -10px;
      display: flex;
      align-items: center;
      justify-content: center;

      .tcbf-icon {
        width: 26px;
        height: 26px;
      }
    }
  }


}

</style>