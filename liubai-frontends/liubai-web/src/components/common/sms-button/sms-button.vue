<script setup lang="ts">
import RingLoader from "~/components/loaders/ring-loader/ring-loader.vue";
import type { SmsStatus } from "~/types/types-view"
import type { SmsButtonEmit } from "./tools/types"
import { useSmsButton } from "./tools/useSmsButton"
import { useI18n } from 'vue-i18n';

const status = defineModel<SmsStatus>("status", { required: true })
const emit = defineEmits<SmsButtonEmit>()

const {
  sec,
  onTapButton,
} = useSmsButton(status, emit)

const { t } = useI18n()

</script>
<template>
  <div class="liu-no-user-select sms-button" 
    :class="{ 
      'sms-button_disabled': status !== 'can_tap',
      'sms-button_loading': status === 'loading',
    }"
    @click.stop="onTapButton"
  >
    <RingLoader v-if="status === 'loading'" :size="20"></RingLoader>
    <span v-else-if="status === 'can_tap'">{{ t('login.send_sms') }}</span>
    <span v-else-if="status === 'counting'">{{ sec }}</span>
  </div>

</template>
<style lang="scss" scoped>

.sms-button {
  height: 100%;
  max-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--btn-font);
  min-width: 100px;
  padding: 0 20px;
  box-sizing: border-box;
  background-color: var(--card-bg);
  border: 1.4px solid var(--line-bottom);
  color: var(--primary-color);
  transition: .15s;
  cursor: pointer;
  border-radius: 8px;
}

.sms-button_disabled {
  cursor: not-allowed;
  color: var(--main-note);
  background-color: var(--card-hover);
}

.sms-button_loading {
  cursor: default;
}

@media(hover: hover) {
  .sms-button:hover {
    background-color: var(--card-hover);
  }
}

</style>