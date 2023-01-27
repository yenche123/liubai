<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDynamics } from '~/hooks/useDynamics';
import { SupportedLocale } from '~/types/types-locale';
import liuUtil from "~/utils/liu-util";
import { initDatePicker } from "./index"

const { theme } = useDynamics()
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
  return liuUtil.showBasicDate(d, lang)
})

</script>
<template>

  <div v-if="enable"
    class="liu-dp-container"
    :class="{ 'liu-dp-container_show': show }"
  >

    <VueDatePicker :locale="locale" 
      :dayNames="dayNames" 
      weekStart="0" 
      :dark="theme === 'dark'"
      inline
      arrowNavigation
      v-model="date"
      :min-date="minDate"
      :max-date="maxDate"
      menuClassName="dp-custom-menu"
      calendarClassName="dp-custom-calendar-wrapper"
      calendarCellClassName="dp-custom-cell"
      minutesIncrement="5"
      @internalModelChange="handleInternal"
    >

      <template #action-preview="{ value }">
        <span>{{ previewDate }}</span>
      </template>

      <!-- 按钮区域 -->
      <template #action-select>
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
  position: fixed;
  z-index: 5000;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: v-bind("dpTranMs + 'ms'");
  opacity: 0;
  user-select: none;

  &.liu-dp-container_show {
    opacity: 1;
  }

  &::before {
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
}

.dp-custom-calendar-wrapper {

  .dp__calendar_header_item {
    width: 46px;
    height: 46px;
    max-width: 13vw;
    max-height: 13vw;
  }

  .dp__calendar_item {
    outline: none;
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


@media screen and (max-width: 380px) {
  .dp-custom-menu {
    padding: 10px 10px 10px;
  }

  .dp__action_row {
    padding: 5px;
  }
}

@media screen and (max-width: 350px) {

  .dp-custom-menu {
    padding: 10px 3vw 10px;
  }

  .dp__action_row {
    padding: 0px;
  }
}

</style>