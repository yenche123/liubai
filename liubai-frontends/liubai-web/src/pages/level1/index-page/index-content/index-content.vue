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
  onTapViewCalendar,
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
        <div class="ic-title_calendar">
          <span>{{ t(calendarTitleKey) }}</span>
        </div>
        <div class="ict-view" @click.stop="onTapViewCalendar">
          <span>{{ t('index.view_calendar') }}</span>
          <svg-icon name="arrow-right2"
            class="ict-icon"
            color="var(--main-note)"
          ></svg-icon>
        </div>
      </div>

      <!-- Time First -->
      <ThreadList
        view-type="CALENDAR"
        :show-txt="showTxt"
        @hasdata="onCalendarHasData"
        @nodata="showTitle = false"
      ></ThreadList>

      <!-- title: Inbox -->
      <div v-if="showTitle" 
        class="liu-no-user-select ic-title ic-title_inbox"
      >
        <span>{{ t('index.inbox') }}</span>
      </div>

      <!-- Pin -->
      <ThreadList
        view-type="PINNED"
        :show-txt="showTxt"
      ></ThreadList>

      <!-- General -->
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
  display: flex;
  width: 100%;
  box-sizing: border-box;
}

.ic-title_calendar {
  flex: 1;
}

.ict-view {
  flex: none;
  color: var(--main-note);
  font-size: var(--mini-font);
  font-weight: 700;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  cursor: pointer;
  transition: .15s;
  min-width: 90px;
}

.ict-icon {
  margin-inline-start: 4px;
  width: 14px;
  height: 14px
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

@media(hover: hover) {
  .ict-view:hover {
    opacity: .8;
  }
}


</style>