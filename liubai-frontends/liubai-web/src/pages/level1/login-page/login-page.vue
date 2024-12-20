<script setup lang="ts">
import LpMain from "./lp-main/lp-main.vue"
import LpCode from "./lp-code/lp-code.vue"
import LpAccounts from "./lp-accounts/lp-accounts.vue";
import OpenWithBrowser from "./open-with-browser/open-with-browser.vue";
import { useLoginPage } from "./tools/useLoginPage"
import { useI18n } from 'vue-i18n';

const { t } = useI18n()
const { 
  lpData,
  showBackBtn,
  onEmailSubmitted,
  onSubmitCode,
  onBackFromCode,
  onTapLoginViaThirdParty,
  onSelectedAnAccount,
  onTapBack,
  onTapRequestSmsCode,
  onTapFinishForPhone,
} = useLoginPage()

</script>
<template>

  <!-- 顶部: 返回导航栏 -->
  <div class="lp-navi-bar">


    <div class="lpn-box" v-liu-show="showBackBtn">

      <!-- 返回按钮 -->
      <div class="liu-no-user-select liu-hover lpn-back" @click.stop="onTapBack">
        <div class="lpn-back-icon">
          <svg-icon name="arrow-back700" class="lpn-back-svg" 
            color="var(--main-normal)"
          ></svg-icon>
        </div>
        <span>{{ t('common.back') }}</span>
      </div>

    </div>

  </div>


  <!-- 主体 -->
  <div class="lp-body" 
    v-if="lpData.enable"
  >

    <!-- 顶部占位 -->
    <div class="lp-virtual lp-virtual-first"></div>

    <!-- 主页 -->
    <div class="lp-container lp-container_main" v-liu-show="lpData.view === 'main'">
      <LpMain
        @submitemail="onEmailSubmitted"
        @requestsmscode="onTapRequestSmsCode"
        @submitsmscode="onTapFinishForPhone"
        @tapthirdparty="onTapLoginViaThirdParty"
        :is-sending-email="lpData.isSendingEmail"
        :is-logging-by-phone="lpData.isLoggingByPhone"
        :sms-sending-num="lpData.smsSendingNum"
      ></LpMain>
    </div>

    <!-- 输入验证码页 -->
    <div class="lp-container" v-liu-show="lpData.view === 'code'">
      <LpCode :email="lpData.email"
        :clear-code-num="lpData.clearCodeNum"
        @submitcode="onSubmitCode"
        @back="onBackFromCode"
        :is-submitting-code="lpData.isSubmittingEmailCode"
      ></LpCode>
    </div>

    <!-- 选择账号页 -->
    <div class="lp-container" v-liu-show="lpData.view === 'accounts'">
      <LpAccounts 
        :accounts="lpData.accounts"
        :is-shown="lpData.view === 'accounts'"
        :is-selecting-account="lpData.isSelectingAccount"
        @confirm="onSelectedAnAccount"
      ></LpAccounts>
    </div>
    
    <!-- 底部占位，形成上下对称 -->
    <div class="lp-virtual"></div>

  </div>

  <!-- 使用浏览器打开的提示 -->
  <open-with-browser v-if="lpData.openWithBrowser"></open-with-browser>

</template>
<style scoped lang="scss">

.lp-navi-bar {
  width: 100%;
  height: 90px;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.lpn-box {
  height: 100%;
  width: 92%;
  max-width: 1500px;
  position: relative;
  display: flex;
  align-items: center;
}

.lpn-back {
  display: flex;
  align-items: center;
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 700;
  padding: 4px 16px 4px 10px;
}

.lpn-back-icon {
  width: 34px;
  height: 34px;
  margin-inline-end: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  .lpn-back-svg {
    width: 24px;
    height: 24px;
  }
}

.lp-body {
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  z-index: 50;
  background-color: var(--bg-color);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.lp-virtual {
  width: 100%;
  height: 90px;
  transition: .3s;
}

.lp-virtual-first {
  min-height: 90px;
}

.lp-container {
  position: relative;
  width: 92%;
  max-width: 600px;
  margin-block-start: -30px;
}

.lp-container_main {
  max-width: 450px;
  margin-block-start: -50px;
}

</style>