<script setup lang="ts">
import type { PropType } from 'vue';
import type { ThreadShow } from '~/types/types-content';
import type { TlViewType } from "../../tools/types";
import { useTcBottombar } from './tools/useTcBottombar';
import type { TcbEmits } from "./tools/types"
import { useI18n } from 'vue-i18n';

const props = defineProps({
  threadData: {
    type: Object as PropType<ThreadShow>,
    required: true
  },
  viewType: {
    type: String as PropType<TlViewType>,
  },
})
const emit = defineEmits<TcbEmits>()

const { t } = useI18n()
const default_color = "var(--main-code)"
const { footerMenu, onTapMenuItem } = useTcBottombar(props, emit)

</script>
<template>

  <div class="tcb-container">
    <div class="liu-no-user-select tcb-time">
      <span v-if="threadData.removedStr">{{ t('thread_related.deleted_at', { date: threadData.removedStr }) }}</span>
      <span v-else-if="threadData.editedStr">{{ t('thread_related.edited_at', { date: threadData.editedStr }) }}</span>
      <span v-else>{{ t('thread_related.created_at', { date: threadData.createdStr }) }}</span>
    </div>

    <!-- 更多 -->
    <div class="tcb-footer">
      <div class="tcbf-box">
        <LiuMenu
          :menu="footerMenu"
          min-width-str="100px"
          placement="top-end"
          @tapitem="onTapMenuItem"
        >
          <div class="liu-hover tcbf-icon-box">
            <svg-icon name="more" class="tcbf-icon" :color="default_color"></svg-icon>
          </div>
        </LiuMenu>
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
  }

  .tcb-footer {
    flex: 1;
    display: flex;
    justify-content: flex-end;

    .tcbf-box {
      width: 40px;
      height: 40px;
      margin-inline-end: -10px;
      margin-block-end: -10px;
    }

    .tcbf-icon-box {
      width: 40px;
      height: 40px;
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