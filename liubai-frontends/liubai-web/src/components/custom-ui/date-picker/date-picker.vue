<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDynamics } from '../../../hooks/useDynamics';
import liuUtil from "../../../utils/liu-util";
import { initDatePicker } from "./index"

const { theme } = useDynamics()
const { locale, t } = useI18n()
const dayNames = liuUtil.getDayNames()

const {
  enable,
  show,
  _date,
  TRANSITION_DURATION: dpTranMs,
  onTapConfirm,
  onTapCancel,
} = initDatePicker()

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
      :selectText="t('common.confirm')"
      :cancelText="t('common.cancel')"
      inline
      arrowNavigation
      v-model="_date"
      calendarClassName="dp-custom-calendar-wrapper"
      calendarCellClassName="dp-custom-cell"
    >
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

</style>
<style lang="scss">

.dp__theme_light  {
  --dp-primary-color: var(--primary-color);
  --dp-background-color: var(--card-bg);
}

.dp__theme_dark {
  --dp-primary-color: var(--primary-color);
  --dp-background-color: var(--card-bg);
}

.dp-custom-calendar-wrapper {

  .dp__calendar_header_item {
    width: 46px;
    height: 46px;
    max-width: 13.2vw;
    max-height: 13.2vw;
  }

}

.dp-custom-cell {
  border-radius: 50%;
  width: 46px;
  height: 46px;
  max-width: 13.2vw;
  max-height: 13.2vw;
}

</style>