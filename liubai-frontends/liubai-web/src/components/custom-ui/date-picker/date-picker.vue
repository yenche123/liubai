<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { type SupportedLocale } from '~/types/types-locale';
import liuUtil from "~/utils/liu-util";
import { initDatePicker } from "./index"
import { useSystemStore } from '~/hooks/stores/useSystemStore';
import { storeToRefs } from 'pinia';

const systemStore = useSystemStore()
const { supported_theme } = storeToRefs(systemStore)
const { locale, t } = useI18n()
const dayNames = liuUtil.getDayNames()

const {
  enable,
  show,
  date,
  timeStr,
  minDate,
  maxDate,
  TRANSITION_DURATION: dpTranMs,
  onTapConfirm,
  onTapCancel,
} = initDatePicker()

const handleInternal = (newDate: Date) => {
  if(!date.value) {
    date.value = newDate
    return
  }
  const res = liuUtil.areTheDatesEqual(date.value, newDate)
  if(res) return
  date.value = newDate
}

const previewDate = computed(() => {
  const lang = locale.value as SupportedLocale
  const d = date.value
  if(!d) return ""
  return liuUtil.showBasicTime(d, lang)
})

</script>
<template>

  <div v-if="enable"
    class="liu-no-user-select liu-dp-container"
    :class="{ 'liu-dp-container_show': show }"
  >
    <div class="liu-dp-bg" @click.stop="onTapCancel"></div>

    <VueDatePicker 
      :locale="locale" 
      :dayNames="dayNames" 
      weekStart="0" 
      :dark="supported_theme === 'dark'"
      inline
      v-model="date"
      :min-date="minDate"
      :max-date="maxDate"
      :ui="{
        menu: 'dp-custom-menu',
        calendar: 'dp-custom-calendar-wrapper',
        calendarCell: 'dp-custom-cell',
      }"
      minutesIncrement="5"
      @internalModelChange="handleInternal"
    >

      <template #action-preview="{ value }">
        <span>{{ previewDate }}</span>
      </template>

      <!-- 按钮区域 -->
      <template #action-buttons>
        <div class="liu-dp-btns">
          <div class="liu-hover liu-dp-btn liu-dp-cancel" @click="onTapCancel">
            <span>{{ t("common.cancel") }}</span>
          </div>

          <div class="liu-hover liu-dp-btn liu-dp-confirm" @click="onTapConfirm">
            <span>{{ t("common.confirm") }}</span>
          </div>

        </div>
      </template>

      <!-- 选择时间 -->
      <template #clock-icon>
        <div class="liu-dp-clock-calendar">
          <svg-icon name="when" class="liu-dcc-icon" color="var(--dp-icon-color)"></svg-icon>
          <span>{{ timeStr ? timeStr : t("date_picker.select_time") }}</span>
        </div>
      </template>

      <!-- 返回 -->
      <template #calendar-icon>
        <div class="liu-dp-clock-calendar">
          <svg-icon name="arrow-back" class="liu-dcc-icon" color="var(--dp-icon-color)"></svg-icon>
          <span>{{ t("common.back") }}</span>
        </div>
      </template>


    </VueDatePicker>

  </div>

  

</template>
<style scoped lang="scss">

.liu-dp-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: fixed;
  z-index: 5000;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: v-bind("dpTranMs + 'ms'");
  opacity: 0;

  &.liu-dp-container_show {
    opacity: 1;
  }
}

.liu-dp-bg {
  position: absolute;
  content: "";
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: var(--popup-bg);
}

.liu-dp-btns {
  flex: 1;
  display: flex;
  justify-content: flex-end;

  .liu-dp-btn {
    padding: 5px 10px;
    font-size: var(--btn-font);
    font-weight: 700;
  }

  .liu-dp-cancel {
    color: var(--main-text);
    margin-right: 5px;
  }

  .liu-dp-confirm {
    color: var(--primary-color);
  }

}

.liu-dp-clock-calendar {
  display: flex;
  align-items: center;
  font-size: var(--btn-font);
  font-weight: 700;
  color: var(--dp-icon-color);

  .liu-dcc-icon {
    width: 20px;
    height: 20px;
    margin-top: 2px;
    margin-right: 4px;
  }
}

</style>
<style lang="scss">

.liu-dp-container {
  --dp-menu-padding: 0;
  --dp-cell-padding: 0;

  .dp__flex_display {
    width: min-content;
    justify-content: center;

    .dp__outer_menu_wrap {
      display: flex;
      justify-content: center;
    }
  }

  .dp__theme_light  {
    --dp-primary-color: var(--primary-color);
    --dp-background-color: var(--card-bg);
    --dp-border-color: var(--line-default);
  }

  .dp__theme_dark {
    --dp-primary-color: var(--primary-color);
    --dp-background-color: var(--card-bg);
    --dp-text-color: var(--main-text);

    .dp__range_end, .dp__range_start, .dp__active_date {
      color: var(--on-primary);
    }
  }

  .dp-custom-menu {
    padding: 20px 20px 10px;
    border-radius: 20px;

    .dp__button {
      border-radius: 4px;
    }

    .dp--tp-wrap {
      max-width: 100%;
    }

  }

  .dp-custom-calendar-wrapper {

    .dp__calendar_header {
      margin-block-start: 10px;
    }

    .dp__calendar_header_item {
      width: 46px;
      height: 35px;
      max-width: 13vw;
      max-height: 13vw;
      flex-grow: 0;
    }

    .dp__calendar_item {
      outline: none;
      flex-grow: 0;
    }

    .dp-custom-cell {
      border-radius: 50%;
      width: 46px;
      height: 46px;
      max-width: 13vw;
      max-height: 13vw;
      transition: .16s;
      font-size: var(--btn-font);
    }
  }

  .dp__action_row {
    padding: 5px 0px 10px 10px;

    .dp__action_buttons {
      flex: 1; 
    }
  }

  /********************* hover & active style for Mobile ****************/
  .dp__button:hover, 
  .dp__month_year_select:hover, 
  .dp__overlay_cell:hover, 
  .dp__time_display:hover:enabled, 
  .dp__date_hover_end:hover, 
  .dp__date_hover_start:hover,
  .dp__date_hover:hover {
    background: none;
  }

  .dp__cell_offset.dp__date_hover:hover {
    color: var(--dp-secondary-color);
  }

  .dp__inc_dec_button:hover {
    background: none;
    color: var(--dp-icon-color);
  }

  @media(hover: hover) {
    .dp__button:hover,
    .dp__month_year_select:hover, 
    .dp__overlay_cell:hover,
    .dp__time_display:hover:enabled,
    .dp__date_hover_end:hover, 
    .dp__date_hover_start:hover,
    .dp__date_hover:hover {
      background: var(--dp-hover-color);
    }

    .dp__cell_offset.dp__date_hover:hover {
      color: var(--dp-hover-text-color);
    }

    .dp__inc_dec_button:hover {
      background: var(--dp-hover-color);
      color: var(--dp-primary-color);
    }
  }

  .dp__button:active,
  .dp__month_year_select:active, 
  .dp__overlay_cell:active,
  .dp__time_display:active:enabled,
  .dp__date_hover_end:active, 
  .dp__date_hover_start:active,
  .dp__date_hover:active {
    background: var(--dp-hover-color);
  }

  .dp__cell_offset.dp__date_hover:active {
    color: var(--dp-hover-text-color);
  }

  .dp__inc_dec_button:active {
    background: var(--dp-hover-color);
    color: var(--dp-primary-color);
  }


  /******************* responsive style for Mobile *****************/
  @media screen and (max-width: 400px) {
    .dp-custom-menu {
      padding: 10px 10px 10px;
    }

    .dp__action_row {
      padding: 5px 0 5px 5px;
    }
  }

  @media screen and (max-width: 370px) {

    .dp-custom-menu {
      padding: 10px 2vw 10px;
    }

    .dp__action_row {
      padding: 0px;
      padding-inline-start: 5px;
    }
  }

}

</style>