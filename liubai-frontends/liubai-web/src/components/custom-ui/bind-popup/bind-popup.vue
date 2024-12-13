<script setup lang="ts">
import SmsButton from '~/components/common/sms-button/sms-button.vue';
import { useI18n } from 'vue-i18n';
import { initBindPopup } from './tools/useBindPopup';

const {
  bpData,
  TRANSITION_DURATION,
  onTapSubmit,
  onTapClose,
  onEnterFromFirstInput,
  onEnterFromSecondInput,
  onTapGettingCode,
} = initBindPopup()

const { t } = useI18n()

</script>
<template>

  <div v-if="bpData.enable" class="bp-container"
    :class="{ 'ba-container_show': bpData.show }"
  >
    <div class="bp-bg"></div>
    <div class="bp-box" :class="{ 'ba-box_show': bpData.show }">

      <!-- title + close button -->
      <div class="bp-first-bar">
        <div class="bp-title">
          <span v-if="bpData.bindType === 'email'">{{ t('bind.email_title') }}</span>
          <span v-else>{{ t('bind.phone_title') }}</span>
        </div>
        <div class="bp-close">
          <svg-icon name="close" color="var(--main-normal)"></svg-icon>
        </div>
      </div>

      <!-- compliance tip -->
      <div class="bp-compliance">
        <span>{{ t('bind.compliance') }}</span>
      </div>

      <div class="bp-bar">
        <input v-if="bpData.bindType === 'email'" class="bp-input" 
          :placeholder="t('bind.email_ph')"
          type="email"
          v-model="bpData.firstInputVal"
          id="bind-email"
          @keyup.enter.exact="onEnterFromFirstInput"
        />
        <input v-else class="bp-input" 
          :placeholder="t('bind.phone_ph')"
          type="tel"
          v-model="bpData.firstInputVal"
          id="bind-phone"
          @keyup.enter.exact="onEnterFromFirstInput"
          maxlength="11"
        />
      </div>

      <div class="bp-err" :class="{ 'bp-err_show': bpData.firstErr }">
        <span v-if="bpData.firstErr">{{ bpData.firstErr }}</span>
      </div>

      <div class="bp-bar">
        <input class="bp-second-input" 
          :placeholder="t('bind.code_ph')"
          type="text"
          v-model="bpData.secondInputVal"
          id="bind-code"
          maxlength="6"
          @keyup.enter.exact="onEnterFromSecondInput"
        />

        <SmsButton v-model:status="bpData.sendCodeStatus"
          @click="onTapGettingCode"
        ></SmsButton>

      </div>

      <div class="bp-err" :class="{ 'bp-err_show': bpData.secondErr }">
        <span v-if="bpData.secondErr">{{ bpData.secondErr }}</span>
      </div>

      <CustomBtn
        :disabled="!bpData.canSubmit"
        class="bp-finish-btn"
        :is-loading="bpData.btnLoading"
        @click="onTapSubmit"
      >
        <span>{{ t('common.confirm') }}</span>
      </CustomBtn>

    </div>
  </div>

</template>
<style scoped lang="scss">




</style>