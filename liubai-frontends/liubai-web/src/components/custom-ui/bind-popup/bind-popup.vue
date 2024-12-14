<script setup lang="ts">
import SmsButton from '~/components/common/sms-button/sms-button.vue';
import { useI18n } from 'vue-i18n';
import { initBindPopup } from './tools/useBindPopup';

const {
  emailInputRef,
  phoneInputRef,
  secondInputRef,
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
    :class="{ 'bp-container_show': bpData.show }"
  >
    <div class="bp-bg"></div>
    <div class="bp-box" :class="{ 'bp-box_show': bpData.show }">

      <!-- title + close button -->
      <div class="bp-first-bar">
        <div class="liu-no-user-select bp-title">
          <span v-if="bpData.bindType === 'email'">{{ t('bind.email_title') }}</span>
          <span v-else>{{ t('bind.phone_title') }}</span>
        </div>
        <div class="bp-close" @click.stop="onTapClose">
          <svg-icon name="close" color="var(--main-normal)"
            class="bp-close-svg"
          ></svg-icon>
        </div>
      </div>

      <!-- compliance tip -->
      <div v-if="bpData.compliance" class="liu-no-user-select bp-compliance">
        <span>{{ t('bind.compliance') }}</span>
      </div>

      <div class="bp-bar">
        <input v-if="bpData.bindType === 'email'" 
          class="bp-input bp-first-input" 
          :placeholder="t('bind.email_ph')"
          type="email"
          v-model="bpData.firstInputVal"
          id="bind-email"
          @keyup.enter.exact="onEnterFromFirstInput"
          ref="emailInputRef"
        />
        <input v-else class="bp-input bp-first-input" 
          :placeholder="t('bind.phone_ph')"
          type="tel"
          v-model="bpData.firstInputVal"
          id="bind-phone"
          @keyup.enter.exact="onEnterFromFirstInput"
          maxlength="11"
          ref="phoneInputRef"
        />
      </div>

      <div class="liu-no-user-select bp-err" 
        :class="{ 'bp-err_show': bpData.firstErr }"
      >
        <span>{{ bpData.firstErr ?? " " }}</span>
      </div>

      <div class="bp-bar">
        <input class="bp-input bp-second-input" 
          :placeholder="t('bind.code_ph')"
          type="text"
          v-model="bpData.secondInputVal"
          id="bind-code"
          maxlength="6"
          @keyup.enter.exact="onEnterFromSecondInput"
          ref="secondInputRef"
        />

        <SmsButton v-model:status="bpData.sendCodeStatus"
          @click="onTapGettingCode"
        ></SmsButton>

      </div>

      <div class="liu-no-user-select bp-err" 
        :class="{ 'bp-err_show': bpData.secondErr }"
      >
        <span v-if="bpData.secondErr">{{ bpData.secondErr }}</span>
      </div>

      <CustomBtn
        :disabled="!bpData.canSubmit || bpData.btnLoading"
        class="bp-finish-btn"
        :is-loading="bpData.btnLoading"
        @click="onTapSubmit"
      >
        <span>{{ t('common.confirm') }}</span>
      </CustomBtn>

      <div class="liu-no-user-select bp-err bp-err_btn" 
        :class="{ 'bp-err_show': bpData.btnErr }"
      >
        <span>{{ bpData.btnErr ?? " " }}</span>
      </div>

    </div>
  </div>

</template>
<style scoped lang="scss">

.bp-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2600;
  opacity: 0;
  transition-duration: v-bind("TRANSITION_DURATION + 'ms'");

  &.bp-container_show {
    opacity: 1;
  }

  .bp-bg {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: var(--frosted-glass-3);
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
  }
}

.bp-box {
  padding: 32px 32px 24px;
  border-radius: 24px;
  overflow: hidden;
  background-color: var(--card-bg);
  transition-timing-function: cubic-bezier(0.17, 0.86, 0.45, 1);
  transition-duration: v-bind("TRANSITION_DURATION + 'ms'");
  transform: translateY(25%);
  position: relative;
  box-shadow: var(--cui-popup-shadow);
  box-sizing: border-box;
  width: 92%;
  max-width: var(--standard-max-px);

  &.bp-box_show {
    transform: translateY(0);
  }
}

.bp-first-bar {
  display: flex;
  width: 100%;
  padding-block-end: 14px;
}

.bp-title {
  flex: 1;
  font-size: var(--head-font);
  font-weight: 700;
  color: var(--main-normal);
  line-height: 1.5;
}

.bp-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: .15s;
  cursor: pointer;
  flex: none;

  .bp-close-svg {
    width: 100%;
    height: 100%;
  }
}

.bp-compliance {
  width: 100%;
  color: var(--main-code);
  font-size: var(--mini-font);
  line-height: 1.5;
  padding-block-end: 20px;
}

.bp-bar {
  padding-block-start: 10px;
  width: 100%;
  display: flex;
  position: relative;
}

.bp-input {
  padding: 14px 16px;
  font-size: var(--desc-font);
  color: var(--main-normal);
  background-color: var(--card-bg);
  border: 1.4px solid var(--line-bottom);
  border-radius: 8px;

  &::placeholder {
    color: var(--main-note);
  }

  &:-webkit-autofill, &:-webkit-autofill:focus {
    transition: background-color 0s 600000s, color 0s 600000s;
    -webkit-box-shadow: 0 0 0px 1000px var(--card-bg) inset;
  }

  &::selection {
    background-color: var(--select-bg);
  }
  
}

.bp-first-input {
  box-sizing: border-box;
  width: 100%;
  letter-spacing: 1px;

  &::placeholder {
    color: var(--main-note);
  }
}

.bp-err {
  width: 100%;
  padding-inline-start: 16px;
  box-sizing: border-box;
  opacity: 0;
  transition: .3s;
  color: var(--liu-state-3);
  font-size: var(--mini-font);
  max-height: 0;
  overflow: hidden;
  word-wrap: break-word;
  white-space: pre-wrap;
  margin-block-start: 5px;
}

.bp-err_btn {
  margin-block-start: 16px;
  padding-inline: 16px;
  text-align: center;
  text-wrap: pretty;
}

.bp-err_show {
  opacity: 1;
  max-height: 40px;
}

.bp-second-input {
  box-sizing: border-box;
  flex: 1;
  margin-inline-end: 8px;
  min-width: 140px;
  letter-spacing: 1px;
}


.bp-finish-btn {
  white-space: pre-wrap;
  margin-block-start: 20px;
}

@media(hover: hover) {
  .bp-close:hover {
    opacity: .75;
  }
}

@media screen and (max-width: 500px) {
  .bp-box {
    padding: 24px 24px 16px;
  }

  .bp-title {
    font-size: var(--title-font);
  }

  .bp-compliance {
    padding-block-end: 5px;
  }

  .bp-input {
    font-size: var(--btn-font);
  }



}



</style>