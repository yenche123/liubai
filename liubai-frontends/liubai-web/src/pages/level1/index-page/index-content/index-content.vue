<script setup lang="ts">
import cfg from "~/config"
import CustomEditor from "~/components/editors/custom-editor/custom-editor.vue"
import IndexBoard from "~/components/level1/index-board/index-board.vue"
import ThreadList from "~/components/level1/thread-list/thread-list.vue"
import { useIndexContent } from "./tools/useIndexContent"
import { useI18n } from "vue-i18n"

defineProps({
  showTop: {
    type: Boolean,
  }
})

const virtualHeight = cfg.navi_height / 3
const shortVirtual = cfg.navi_height / 9

const {
  showTxt,
  showTitle,
  calendarTitleKey,
  onCalendarHasData,
} = useIndexContent()

const { t } = useI18n()

</script>
<template>

  <div class="liu-mc-container">
    <div class="mc-virtual"
      :class="{ 'mc-virtual_short': !showTop }"
    ></div>
    <div class="liu-mc-box">
      
      <CustomEditor></CustomEditor>
      <div class="liu-mc-spacing"></div>

      <IndexBoard></IndexBoard>

      <!-- title: Today or Next 24 hrs -->
      <div v-if="showTitle && calendarTitleKey" 
        class="liu-no-user-select ic-title"
      >
        <span>{{ t(calendarTitleKey) }}</span>
      </div>

      <!-- 时间优先 -->
      <ThreadList
        view-type="CALENDAR"
        :show-txt="showTxt"
        @hasdata="onCalendarHasData"
        @nodata="showTitle = false"
      ></ThreadList>

      <!-- 置顶 -->
      <ThreadList
        view-type="PINNED"
        :show-txt="showTxt"
      ></ThreadList>

      <!-- title: Inbox -->
      <div v-if="showTitle" 
        class="liu-no-user-select ic-title ic-title_inbox"
      >
        <span>{{ t('index.inbox') }}</span>
      </div>

      <!-- 一般 -->
      <ThreadList
        view-type="INDEX"
        :show-txt="showTxt"
      ></ThreadList>

    </div>

  </div>
  
</template>
<style scoped lang="scss">

.ic-title {
  font-size: var(--title-font);
  color: var(--main-text);
  font-weight: 700;
  padding-inline-start: 8px;
  padding-block: 5px;
}

.ic-title_inbox {
  padding-block-start: 14px;
}

.mc-virtual {
  width: 100%;
  height: v-bind("virtualHeight + 'px'");
  max-height: v-bind("virtualHeight + 'px'");
  transition: .15s;
}

.mc-virtual_short {
  max-height: v-bind("shortVirtual + 'px'");
}


</style>