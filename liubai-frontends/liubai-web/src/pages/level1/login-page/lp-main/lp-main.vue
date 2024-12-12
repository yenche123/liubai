<script setup lang="ts">
import SmsButton from '~/components/common/sms-button/sms-button.vue';
import AgreeBox from '~/components/common/agree-box/agree-box.vue';
import { useI18n } from 'vue-i18n';
import { useLpMain } from "./tools/useLpMain";
import { type LpmEmit, lpmProps } from "./tools/types"

const props = defineProps(lpmProps)
const emit = defineEmits<LpmEmit>()

const { t } = useI18n()
const {
  lpSelectsEl,
  lpEmailInput,
  lpPhoneInput,
  lpSmsInput,
  lpmData,
  onTapSelect,
  onEmailEnter,
  onPhoneEnter,
  onSmsEnter,
  onTapGettingSMSCode,
  onTapFinishForSMS,
  onTapThirdParty,
  onToggleEmailPhone,
} = useLpMain(props, emit)

</script>
<template>

  <!-- Big Title: Login -->
  <div class="liu-no-user-select lpm-title">
    <span>{{ t('common.login') }}</span>
  </div>

  <div class="lpm-selects" ref="lpSelectsEl">

    <!-- Email or Phone -->
    <div class="liu-no-user-select lpms-item lps-item-1" 
      @click.stop="onTapSelect(1)"
      :class="{ 'lpms-item_active': lpmData.current === 1 }"
    >
      <span v-if="lpmData.btnOne === 'phone'">{{ t('login.login_with_phone') }}</span>
      <span v-else>{{ t('login.login_with_email') }}</span>
    </div>

    <!-- Third Party -->
    <div class="liu-no-user-select lpms-item lps-item-2" 
      @click.stop="onTapSelect(2)" 
      :class="{ 'lpms-item_active': lpmData.current === 2 }"
    >
      <span>{{ t('login.third_party') }}</span>
    </div>

    <!-- Indicator -->
    <div v-if="lpmData.indicatorData.width !== '0px'" class="lpms-indicator"></div>

  </div>

  <!-- email view -->
  <div class="lp-view" v-liu-show="lpmData.current === 1 && lpmData.btnOne === 'email'">

    <input class="lp-email-input" type="email" 
      :placeholder="t('login.email_ph')" 
      v-model="lpmData.emailVal"
      id="login-email"
      ref="lpEmailInput"
      @keyup.enter.exact="onEmailEnter"
    />

    <CustomBtn
      :disabled="!lpmData.showEmailSubmit || isSendingEmail"
      class="lp-email-btn"
      :is-loading="isSendingEmail"
      @click="onEmailEnter"
    >
      <span>{{ t('common.confirm') }}</span>
      <span v-show="!isSendingEmail"> ↵</span>
    </CustomBtn>

    <AgreeBox v-model:agree="lpmData.agreeRule"
      class="lpm-rule-box"
      :shaking-num="lpmData.agreeShakingNum"
    ></AgreeBox>

    <div v-if="lpmData.phoneEnabled" class="liu-no-user-select lpm-change-box">
      <div class="lpm-change-btn" @click.stop="onToggleEmailPhone">
        <span>{{ t('login.turn_into_phone') }}</span>
      </div>
    </div>
  
  </div>

  <!-- phone view -->
  <div class="lp-view" 
    v-liu-show="lpmData.current === 1 && lpmData.btnOne === 'phone'"
  >

    <input class="lp-phone-input" type="tel" 
      :placeholder="t('login.phone_ph')" 
      v-model="lpmData.phoneVal"
      id="login-phone"
      ref="lpPhoneInput"
      @keyup.enter.exact="onPhoneEnter"
      maxlength="11"
    />

    <div class="lp-sms-bar">
      <input class="lp-sms-input" type="text" 
        :placeholder="t('login.sms_ph')"
        id="login-sms"
        v-model="lpmData.smsVal"
        ref="lpSmsInput"
        @keyup.enter.exact="onSmsEnter"
        maxlength="6"
      />

      <SmsButton v-model:status="lpmData.smsStatus"
        @click="onTapGettingSMSCode"
      ></SmsButton>

    </div>

    <CustomBtn
      :disabled="!lpmData.showPhoneSubmit || isLoggingByPhone"
      class="lp-phone-finish-btn"
      :is-loading="isLoggingByPhone"
      @click="onTapFinishForSMS"
    >
      <span>{{ t('common.confirm') }}</span>
      <span v-show="!isLoggingByPhone"> ↵</span>
    </CustomBtn>

    <AgreeBox v-model:agree="lpmData.agreeRule"
      class="lpm-rule-box"
      :shaking-num="lpmData.agreeShakingNum"
    ></AgreeBox>

    <div v-if="lpmData.emailEnabled" class="liu-no-user-select lpm-change-box">
      <div class="lpm-change-btn" @click.stop="onToggleEmailPhone">
        <span>{{ t('login.turn_into_email') }}</span>
      </div>
    </div>
  
  </div>

  <!-- third-party view -->

  <div class="lp-view" v-liu-show="lpmData.current === 2">

    <!-- wechat -->
    <div v-if="lpmData.wechatEnabled"
      class="liu-no-user-select liu-hover lpv-btn" 
      @click.stop="onTapThirdParty('wechat')"
    >
      <div class="lpv-icon">
        <div class="lpv-icon-div"></div>
      </div>
      <div class="lpv-text">
        <span>{{ t('login.continue_with_wechat') }}</span>
      </div>
    </div>

    <!-- google -->
    <div v-if="lpmData.googleEnabled"
      class="liu-no-user-select liu-hover lpv-btn" 
      @click.stop="onTapThirdParty('google')"
    >
      <div class="lpv-icon">
        <svg-icon name="logos-google-color" 
          :cover-fill-stroke="false"
          class="lpv-svg-icon"
        ></svg-icon>
      </div>
      <div class="lpv-text">
        <span>{{ t('login.continue_with_google') }}</span>
      </div>
    </div>

    <!-- github -->
    <div v-if="lpmData.githubEnabled"
      class="liu-no-user-select liu-hover lpv-btn" 
      @click.stop="onTapThirdParty('github')"
    >
      <div class="lpv-icon">
        <svg-icon name="logos-github" 
          color="var(--main-text)"
          class="lpv-svg-icon"
        ></svg-icon>
      </div>
      <div class="lpv-text">
        <span>{{ t('login.continue_with_github') }}</span>
      </div>
    </div>

    <!-- Apple -->
    <!-- <div class="liu-hover lpv-btn" @click.stop="onTapThirdParty('apple')">
      <div class="lpv-icon">
        <svg-icon name="logos-apple" 
          color="var(--main-text)"
          class="lpv-svg-icon"
        ></svg-icon>
      </div>
      <div class="lpv-text">
        <span>{{ t('login.continue_with_apple') }}</span>
      </div>
    </div> -->

    <div class="lpm-rule-box-2">
      <AgreeBox v-model:agree="lpmData.agreeRule"
        :shaking-num="lpmData.agreeShakingNum"
        be-center
      ></AgreeBox>
    </div>

  </div>


</template>
<style scoped lang="scss">

.lpm-title {
  font-size: var(--big-word-style);
  font-weight: 600;
  color: var(--main-text);
  margin-block-end: 10px;
}

.lpm-selects {
  width: 100%;
  display: flex;
  position: relative;
}

.lpms-item {
  padding: 9px 0;
  font-size: var(--desc-font);
  font-weight: 700;
  color: var(--main-code);
  transition: .15s;
  cursor: pointer;
  margin-inline-end: 16px;
  box-sizing: border-box;
}

.lpms-item_active {
  color: var(--primary-color); 
}

.lpms-indicator {
  position: absolute;
  bottom: 0;
  left: v-bind("lpmData.indicatorData.left");
  width: v-bind("lpmData.indicatorData.width");
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 6px;
  transition: .3s;
  pointer-events: none;
}


.lp-view {
  width: 100%;
  padding-block-start: 10px;
  padding-block-end: 20px;
  height: 45vh;
  height: 45dvh;
  min-height: 310px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.lp-email-input, .lp-phone-input {
  box-sizing: border-box;
  width: 100%;
  padding: 16px 24px;
  font-size: var(--desc-font);
  color: var(--main-normal);
  background-color: var(--card-bg);
  border: 1.4px solid var(--line-bottom);
  border-radius: 8px;
  margin-block-end: 24px;

  &::placeholder {
    color: var(--main-note);
  }

  /** 消除自动填入时的样式，参考 
  * https://stackoverflow.com/questions/61083813/how-to-avoid-internal-autofill-selected-style-to-be-applied
  **/
  &:-webkit-autofill, &:-webkit-autofill:focus {
    transition: background-color 0s 600000s, color 0s 600000s;
    -webkit-box-shadow: 0 0 0px 1000px var(--card-bg) inset;
  }

  &::selection {
    background-color: var(--select-bg);
  }
}

.lp-phone-input {
  margin-block-end: 8px;
  padding: 14px 20px;
  letter-spacing: 1px;
}

.lp-sms-bar {
  margin-block-end: 24px;
  display: flex;
  width: 100%;
  position: relative;
}

.lp-sms-input {
  box-sizing: border-box;
  flex: 1;
  padding: 14px 20px;
  font-size: var(--desc-font);
  color: var(--main-normal);
  background-color: var(--card-bg);
  border: 1.4px solid var(--line-bottom);
  border-radius: 8px;
  margin-inline-end: 8px;
  min-width: 150px;
  letter-spacing: 1px;

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

.lpm-rule-box {
  margin-block-start: 24px;
}

.lpm-change-box {
  width: 100%;
  margin-block-start: 24px;
}

.lpm-change-btn {
  width: fit-content;
  font-size: var(--mini-font);
  color: var(--primary-color);
  cursor: pointer;
  padding-block-end: 12px;
  transition: .15s;
}


.lpm-rule-box-2 {
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
  position: relative;
}


.lp-email-btn, .lp-phone-finish-btn {
  white-space: pre-wrap;
}


.lpv-btn {
  width: 100%;
  padding: 4px 16px;
  box-sizing: border-box;
  min-height: 48px;
  border-radius: 8px;
  border: 1.4px solid var(--line-bottom);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--card-bg);
  margin-block-end: 12px;
}

.lpv-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-end: 10px;

  .lpv-svg-icon {
    width: 25px;
    height: 25px;
  }

  .lpv-icon-div {
    width: 27px;
    height: 27px;
    background-image: url('/images/third-party/wechat.png');
    background-size: contain;
  }
}

.lpv-text {
  font-size: var(--btn-font);
  color: var(--main-normal);
  min-width: 180px;
  text-align: center;
}

@media(hover: hover) {
  .lpm-change-btn:hover {
    opacity: .75;
  }
}


// @media screen and (max-width: 590px) {
//   .lpm-title {
//     font-size: var(--head-font);
//   }
// }



</style>